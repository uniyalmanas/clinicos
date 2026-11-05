import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";
import { logAudit } from "@/lib/audit";
import { sseBroker } from "@/lib/sse-broker";

export const dynamic = "force-dynamic";

const cleanPhone = (value: unknown) =>
  String(value || "").replace(/[^0-9]/g, "").slice(-10);

/**
 * Public patient self-check-in kiosk endpoint.
 *
 * No authentication required — this is used by a tablet/kiosk at the clinic
 * front desk. Rate-limited per IP and per clinic to prevent abuse.
 *
 * Body:
 *   clinic_slug   (required) — clinic slug
 *   doctor_slug   (required) — doctor to check in with
 *   patient_name  (required)
 *   patient_phone (required, 10 digits)
 *   age           (optional)
 *   gender        (optional)
 *   complaint     (optional)
 *   payment_mode  (required: "upi" | "cash")
 */
export async function POST(req: NextRequest) {
  try {
    // ── Rate limit: 10 check-ins per hour per IP + per clinic ──
    const ipLimit = await rateLimit(rateLimitKey(req, "checkin:ip"), 60, 3600);
    if (!ipLimit.allowed) {
      return NextResponse.json(tooManyRequests(ipLimit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
      });
    }

    const body = await req.json();
    const {
      clinic_slug,
      doctor_slug,
      patient_name,
      patient_phone,
      age,
      gender,
      complaint,
      payment_mode,
    } = body;

    if (!clinic_slug || !doctor_slug || !patient_name || !patient_phone || !payment_mode) {
      return NextResponse.json(
        { error: "clinic_slug, doctor_slug, patient_name, patient_phone and payment_mode are required.", code: "invalid_input" },
        { status: 400 }
      );
    }

    const phone = cleanPhone(patient_phone);
    if (phone.length !== 10) {
      return NextResponse.json(
        { error: "A valid 10-digit patient phone is required.", code: "invalid_phone" },
        { status: 400 }
      );
    }

    // ── Resolve clinic ──
    const clinics = await sql`
      SELECT id, name, slug, consultation_fee_default
      FROM clinics
      WHERE slug = ${String(clinic_slug)}
      LIMIT 1;
    `;
    if (clinics.length === 0) {
      return NextResponse.json(
        { error: "Clinic not found.", code: "clinic_not_found" },
        { status: 404 }
      );
    }
    const clinic = clinics[0];

    // ── Resolve doctor ──
    const doctors = await sql`
      SELECT id, slug, full_name, consultation_fee, followup_validity_days,
             clinic_id, clinic_name, clinic_slug
      FROM doctors
      WHERE slug = ${String(doctor_slug)}
        AND (clinic_id::text = ${clinic.id}::text OR clinic_slug = ${clinic.slug})
      LIMIT 1;
    `;
    if (doctors.length === 0) {
      return NextResponse.json(
        { error: "Doctor not found in this clinic.", code: "doctor_not_found" },
        { status: 404 }
      );
    }
    const doc = doctors[0];

    const todayStr = new Date().toISOString().split("T")[0];

    // ── Follow-up fee logic (declared outside tx for scope) ──
    let isFreeFollowup = false;
    let resolvedFee = Number(doc.consultation_fee) || 0;

    // ── Advisory lock for token allocation ──
    const inserted = await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(hashtext(${clinic.id}::text || ':' || ${doc.slug} || ':' || ${todayStr}));`;

      const tokenQuery = await tx`
        SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token
        FROM appointments
        WHERE clinic_id::text = ${clinic.id}::text
          AND doctor_slug = ${doc.slug}
          AND appointment_date = ${todayStr};
      `;
      const nextToken = Number(tokenQuery[0]?.next_token || 1);

      if (doc.followup_validity_days != null) {
        const validityDays = Number(doc.followup_validity_days);
        const pastConsultation = await tx`
          SELECT id FROM appointments
          WHERE clinic_id::text = ${clinic.id}::text
            AND doctor_slug = ${doc.slug}
            AND patient_phone = ${phone}
            AND status = 'completed'
            AND created_at >= NOW() - INTERVAL '1 day' * ${validityDays}
          LIMIT 1;
        `;
        isFreeFollowup = pastConsultation.length > 0;
        if (isFreeFollowup) resolvedFee = 0;
      }

      const dateCompact = todayStr.replace(/-/g, "").slice(2);
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const aptNumber = `APT-${dateCompact}-KSK-${nextToken.toString().padStart(2, "0")}-${randSuffix}`;

      return await tx`
        INSERT INTO appointments (
          id, appointment_number, doctor_slug, clinic_id, doctor_name,
          clinic_name, patient_name, patient_phone, appointment_date,
          time_slot, token_number, status, fee_amount, payment_status,
          payment_mode, symptoms_description, created_at, source
        ) VALUES (
          ${randomUUID()},
          ${aptNumber},
          ${doc.slug},
          ${clinic.id},
          ${doc.full_name},
          ${clinic.name},
          ${String(patient_name)},
          ${phone},
          ${todayStr},
          'Kiosk Check-in',
          ${nextToken},
          'waiting',
          ${resolvedFee},
          'paid',
          ${String(payment_mode)},
          ${complaint || null},
          NOW(),
          'kiosk'
        )
        RETURNING *;
      `;
    });

    await logAudit({
      actorId: null,
      actorRole: "patient",
      clinicId: clinic.id,
      action: "appointment.kiosk_checkin",
      entity: "appointment",
      entityId: String(inserted[0].id),
      after: {
        appointment_number: inserted[0].appointment_number,
        doctor_slug: doc.slug,
        patient_phone: phone,
        fee_amount: inserted[0].fee_amount,
        payment_mode,
        is_free_followup: isFreeFollowup || false,
      },
      request: req,
    });

    // Broadcast to waiting room TV in real-time
    sseBroker.broadcast(
      "walk_in_registered",
      {
        appointment_number: inserted[0].appointment_number,
        token_number: inserted[0].token_number,
        patient_name: inserted[0].patient_name,
        doctor_slug: doc.slug,
        doctor_name: doc.full_name,
        clinic_slug: clinic.slug,
        status: "waiting",
        time_slot: inserted[0].time_slot,
        fee_amount: Number(inserted[0].fee_amount),
        payment_status: inserted[0].payment_status,
      },
      clinic.id
    );

    return NextResponse.json({
      status: "admitted",
      is_free_followup: isFreeFollowup || false,
      appointment: {
        appointment_number: inserted[0].appointment_number,
        token_number: inserted[0].token_number,
        patient_name: inserted[0].patient_name,
        patient_phone: inserted[0].patient_phone,
        status: "waiting",
        time_slot: inserted[0].time_slot,
        fee_amount: Number(inserted[0].fee_amount),
        payment_status: inserted[0].payment_status,
        payment_mode: inserted[0].payment_mode,
        is_walk_in: true,
        doctor_name: doc.full_name,
        clinic_name: clinic.name,
      },
    });
  } catch (error: any) {
    console.error("POST /api/check-in/public error:", error);
    if (error?.status) {
      return NextResponse.json({ error: error.message, code: error.code || "invalid_input" }, { status: error.status });
    }
    return NextResponse.json(
      { error: "Failed to check in. Please try again or ask the receptionist.", code: "internal_error" },
      { status: 500 }
    );
  }
}

/**
 * GET — return today's doctors for a clinic (for the kiosk doctor picker).
 * Public, rate-limited.
 */
export async function GET(req: NextRequest) {
  try {
    const ipLimit = await rateLimit(rateLimitKey(req, "checkin:doctors"), 60, 3600);
    if (!ipLimit.allowed) {
      return NextResponse.json(tooManyRequests(ipLimit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
      });
    }

    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinic_slug");
    if (!clinicSlug) {
      return NextResponse.json({ error: "clinic_slug is required.", code: "clinic_required" }, { status: 400 });
    }

    const clinics = await sql`SELECT id, name, slug FROM clinics WHERE slug = ${String(clinicSlug)} LIMIT 1;`;
    if (clinics.length === 0) {
      return NextResponse.json({ error: "Clinic not found.", code: "clinic_not_found" }, { status: 404 });
    }

    const doctors = await sql`
      SELECT id, slug, full_name, specialization, consultation_fee, chamber_name
      FROM doctors
      WHERE (clinic_id::text = ${clinics[0].id}::text OR clinic_slug = ${clinicSlug})
        AND is_active = true
      ORDER BY full_name;
    `;

    return NextResponse.json({
      clinic: clinics[0],
      doctors: doctors.map((d: any) => ({
        id: d.id,
        slug: d.slug,
        full_name: d.full_name,
        specialization: d.specialization,
        consultation_fee: Number(d.consultation_fee || 0),
        chamber_name: d.chamber_name,
      })),
    });
  } catch (error: any) {
    console.error("GET /api/check-in/public error:", error);
    return NextResponse.json(
      { error: "Failed to load doctors.", code: "internal_error" },
      { status: 500 }
    );
  }
}
