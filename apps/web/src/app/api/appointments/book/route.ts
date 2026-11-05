import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { apiError } from "@/lib/api-auth";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const PAYMENT_MODES = ["cash", "counter_soundbox", "counter_cash", "online_upi", "online", "card"];

/**
 * Public appointment booking.
 *
 * The doctor and clinic come from the doctor record, the fee comes from the
 * doctor's configured consultation fee, and payment is always recorded as
 * pending. A caller cannot claim a payment succeeded — that requires
 * `/api/payments/verify`. No sample clinic, doctor or ₹600 fallback is used.
 */
export async function POST(req: NextRequest) {
  try {
    const ipLimit = await rateLimit(rateLimitKey(req, "book:ip"), 10, 3600);
    if (!ipLimit.allowed) {
      return NextResponse.json(tooManyRequests(ipLimit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
      });
    }

    const body = await req.json();
    const {
      doctor_slug,
      patient_name,
      patient_phone,
      appointment_date = null,
      time_slot = null,
      symptoms_description = null,
      payment_mode = "cash",
    } = body;

    if (!doctor_slug || !patient_name || !patient_phone) {
      return apiError(
        400,
        "doctor_slug, patient_name and patient_phone are required.",
        "invalid_input"
      );
    }

    const phone = String(patient_phone).replace(/[^0-9]/g, "").slice(-10);
    if (phone.length !== 10) {
      return apiError(400, "A valid 10-digit patient phone is required.", "invalid_phone");
    }

    const phoneLimit = await rateLimit(`book:phone:${phone}`, 5, 3600);
    if (!phoneLimit.allowed) {
      return NextResponse.json(tooManyRequests(phoneLimit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(phoneLimit.retryAfterSeconds) },
      });
    }

    const doctors = await sql`
      SELECT id, slug, full_name, clinic_id, clinic_name, clinic_slug,
             consultation_fee, followup_validity_days
      FROM doctors
      WHERE slug = ${String(doctor_slug)}
        AND COALESCE(is_active, true) = true
      LIMIT 1;
    `;
    if (doctors.length === 0) {
      return apiError(404, "Doctor not found or not accepting appointments.", "doctor_not_found");
    }
    const doc = doctors[0];

    if (!doc.clinic_id) {
      return apiError(
        422,
        "This doctor is not linked to a clinic and cannot accept bookings.",
        "clinic_not_configured"
      );
    }
    if (doc.consultation_fee == null || !Number.isFinite(Number(doc.consultation_fee))) {
      return apiError(
        422,
        "This doctor has no consultation fee configured.",
        "fee_not_configured"
      );
    }
    const doctorFee = Number(doc.consultation_fee);

    let clinicName = doc.clinic_name ? String(doc.clinic_name) : null;
    if (!clinicName) {
      const clinicRows = await sql`
        SELECT name FROM clinics WHERE id::text = ${String(doc.clinic_id)}::text LIMIT 1;
      `;
      clinicName = clinicRows[0]?.name || null;
    }
    if (!clinicName) {
      return apiError(422, "The doctor's clinic record is incomplete.", "clinic_not_configured");
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const requestedDate = appointment_date ? String(appointment_date) : todayStr;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(requestedDate)) {
      return apiError(400, "appointment_date must be YYYY-MM-DD.", "invalid_date");
    }
    const maxDate = new Date(Date.now() + 90 * 86400000).toISOString().split("T")[0];
    if (requestedDate < todayStr || requestedDate > maxDate) {
      return apiError(400, "appointment_date must be between today and 90 days ahead.", "invalid_date");
    }

    const mode = PAYMENT_MODES.includes(String(payment_mode))
      ? String(payment_mode)
      : "cash";

    const validityDays =
      doc.followup_validity_days == null ? null : Number(doc.followup_validity_days);

    const inserted = await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(hashtext(${String(doc.clinic_id)} || ':' || ${doc.slug} || ':' || ${requestedDate}));`;

      const tokenQuery = await tx`
        SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token
        FROM appointments
        WHERE clinic_id::text = ${String(doc.clinic_id)}::text
          AND doctor_slug = ${doc.slug}
          AND appointment_date = ${requestedDate};
      `;
      const nextToken = Number(tokenQuery[0]?.next_token || 1);

      let isFreeFollowup = false;
      if (validityDays != null && Number.isFinite(validityDays) && validityDays > 0) {
        const pastConsultations = await tx`
          SELECT id FROM appointments
          WHERE clinic_id::text = ${String(doc.clinic_id)}::text
            AND doctor_slug = ${doc.slug}
            AND patient_phone = ${phone}
            AND status = 'completed'
            AND created_at >= NOW() - INTERVAL '1 day' * ${validityDays}
          LIMIT 1;
        `;
        isFreeFollowup = pastConsultations.length > 0;
      }

      const finalFee = isFreeFollowup ? 0 : doctorFee;
      const aptPrefix = doc.slug.replace(/^dr-/, "").slice(0, 5).toUpperCase();
      const dateCompact = requestedDate.replace(/-/g, "").slice(2);
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const aptNumber = `APT-${dateCompact}-${aptPrefix}-${nextToken
        .toString()
        .padStart(2, "0")}-${randSuffix}`;
      const slotLabel = time_slot ? String(time_slot) : `Live OPD Token #${nextToken}`;

      return await tx`
        INSERT INTO appointments (
          id, appointment_number, doctor_slug, clinic_id, doctor_name,
          clinic_name, patient_name, patient_phone, appointment_date,
          time_slot, token_number, status, fee_amount, payment_status,
          payment_mode, symptoms_description, created_at
        ) VALUES (
          ${randomUUID()},
          ${aptNumber},
          ${doc.slug},
          ${String(doc.clinic_id)},
          ${doc.full_name},
          ${clinicName},
          ${String(patient_name)},
          ${phone},
          ${requestedDate},
          ${slotLabel},
          ${nextToken},
          'confirmed',
          ${finalFee},
          'pending',
          ${mode},
          ${symptoms_description ? String(symptoms_description).slice(0, 2000) : null},
          NOW()
        )
        RETURNING *;
      `;
    });

    return NextResponse.json({
      status: "confirmed",
      is_free_followup: Number(inserted[0].fee_amount) === 0,
      followup_note:
        Number(inserted[0].fee_amount) === 0 && validityDays != null
          ? `No fee applied — valid follow-up within ${validityDays} days.`
          : null,
      appointment: inserted[0],
    });
  } catch (error: any) {
    console.error("POST /api/appointments/book error:", error);
    return apiError(500, "Failed to book appointment.", "internal_error");
  }
}
