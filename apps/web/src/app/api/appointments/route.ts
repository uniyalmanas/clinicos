import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const { searchParams } = new URL(req.url);
    const doctorSlug = searchParams.get("doctor_slug");
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    if (doctorSlug && date) {
      return NextResponse.json(
        await sql`
          SELECT * FROM appointments
          WHERE clinic_id::text = ${clinicId}::text
            AND doctor_slug = ${doctorSlug}
            AND appointment_date = ${date}
          ORDER BY token_number ASC;
        `
      );
    }
    if (doctorSlug) {
      return NextResponse.json(
        await sql`
          SELECT * FROM appointments
          WHERE clinic_id::text = ${clinicId}::text
            AND doctor_slug = ${doctorSlug}
          ORDER BY appointment_date DESC, token_number ASC;
        `
      );
    }
    if (status) {
      return NextResponse.json(
        await sql`
          SELECT * FROM appointments
          WHERE clinic_id::text = ${clinicId}::text
            AND status = ${status}
          ORDER BY appointment_date DESC, token_number ASC;
        `
      );
    }

    return NextResponse.json(
      await sql`
        SELECT * FROM appointments
        WHERE clinic_id::text = ${clinicId}::text
        ORDER BY created_at DESC
        LIMIT 100;
      `
    );
  } catch (error: any) {
    console.warn("GET /api/appointments DB unavailable, returning empty list fallback:", error?.message);
    return NextResponse.json([]);
  }
}

/**
 * Staff-side appointment creation (front desk / walk-in).
 *
 * The fee comes from the doctor's configured tariff. A client-supplied
 * `fee_amount` is ignored except for explicit waivers (`fee_override = 0`),
 * which are audited.
 */
export async function POST(req: NextRequest) {
  try {
    const limit = await rateLimit(rateLimitKey(req, "appointments:create"), 60, 600);
    if (!limit.allowed) {
      return NextResponse.json(tooManyRequests(limit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const body = await req.json();
    const {
      doctor_slug,
      patient_name,
      patient_phone,
      appointment_date,
      time_slot,
      payment_mode = null,
      payment_status = "pending",
      symptoms_description = "",
      waiver_reason = null,
    } = body;

    if (!doctor_slug || !patient_name || !patient_phone) {
      return apiError(
        400,
        "doctor_slug, patient_name and patient_phone are required.",
        "invalid_input"
      );
    }

    const doctors = await sql`
      SELECT id, full_name, consultation_fee, followup_fee, followup_validity_days,
             clinic_id, clinic_name, clinic_slug
      FROM doctors
      WHERE slug = ${String(doctor_slug)}
        AND (clinic_id::text = ${clinicId}::text OR clinic_slug = ${auth.auth.clinic!.slug})
      LIMIT 1;
    `;
    const doc = doctors[0];
    if (!doc) {
      return apiError(404, "Doctor not found in your clinic.", "doctor_not_found");
    }

    const todayStr = appointment_date || new Date().toISOString().split("T")[0];
    const cleanPhone = String(patient_phone).replace(/[^0-9]/g, "").slice(-10);
    if (cleanPhone.length !== 10) {
      return apiError(400, "A valid 10-digit patient phone is required.", "invalid_phone");
    }

    const tokenQuery = await sql`
      SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token
      FROM appointments
      WHERE doctor_slug = ${String(doctor_slug)}
        AND appointment_date = ${todayStr};
    `;
    const nextToken = Number(tokenQuery[0]?.next_token || 1);

    const validityDays = Number(doc.followup_validity_days || 0);
    const pastConsultation =
      validityDays > 0
        ? await sql`
            SELECT id FROM appointments
            WHERE doctor_slug = ${String(doctor_slug)}
              AND RIGHT(REGEXP_REPLACE(patient_phone, '[^0-9]', '', 'g'), 10) = ${cleanPhone}
              AND status = 'completed'
              AND created_at >= NOW() - (${validityDays} * INTERVAL '1 day')
            LIMIT 1;
          `
        : [];

    const isFreeFollowup = pastConsultation.length > 0;
    const configuredFee = Number(doc.consultation_fee);
    const isWaiver = body.fee_override === 0;
    if (!isFreeFollowup && !isWaiver && (!Number.isFinite(configuredFee) || configuredFee <= 0)) {
      return apiError(
        422,
        "This doctor has no consultation fee configured.",
        "fee_not_configured"
      );
    }
    const finalFee = isFreeFollowup || isWaiver ? 0 : configuredFee;

    const aptPrefix = String(doctor_slug).replace(/^dr-/, "").slice(0, 5).toUpperCase();
    const dateCompact = todayStr.replace(/-/g, "").slice(2);
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const aptNumber = `APT-${dateCompact}-${aptPrefix}-${String(nextToken).padStart(2, "0")}-${randSuffix}`;
    const id = randomUUID();

    const inserted = await sql`
      INSERT INTO appointments (
        id, appointment_number, doctor_slug, clinic_id, doctor_name,
        clinic_name, patient_name, patient_phone, appointment_date,
        time_slot, token_number, status, fee_amount, payment_status,
        payment_mode, symptoms_description, created_at
      ) VALUES (
        ${id},
        ${aptNumber},
        ${String(doctor_slug)},
        ${clinicId},
        ${doc.full_name},
        ${doc.clinic_name},
        ${String(patient_name)},
        ${cleanPhone},
        ${todayStr},
        ${time_slot || `Token #${nextToken}`},
        ${nextToken},
        'confirmed',
        ${finalFee},
        ${payment_status},
        ${payment_mode},
        ${symptoms_description},
        NOW()
      )
      RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "appointment.create",
      entity: "appointment",
      entityId: id,
      after: inserted[0] || null,
      request: req,
    });

    return NextResponse.json({
      status: "confirmed",
      is_free_followup: isFreeFollowup,
      fee_waived: isWaiver,
      waiver_reason,
      appointment: inserted[0],
    });
  } catch (error: any) {
    console.error("POST /api/appointments error:", error);
    return apiError(500, "Failed to create appointment.", "internal_error");
  }
}
