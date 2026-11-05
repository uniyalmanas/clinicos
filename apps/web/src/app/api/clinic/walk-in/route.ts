import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const cleanPhone = (value: unknown) =>
  String(value || "").replace(/[^0-9]/g, "").slice(-10);

/**
 * Register a walk-in consultation.
 *
 * The doctor must belong to the caller's clinic, the fee comes from the doctor
 * record (or an explicit, validated override), and the payment mode is
 * required. No sample doctor, fee, or clinic is substituted.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const clinicSlug = auth.auth.clinic!.slug;
    const clinic = auth.auth.clinic!;

    const body = await req.json();
    const {
      patient_name,
      patient_phone,
      doctor_slug,
      fee_amount = null,
      payment_mode,
      symptoms_description = null,
    } = body;

    if (!patient_name || !patient_phone) {
      return apiError(400, "patient_name and patient_phone are required.", "invalid_input");
    }
    if (!doctor_slug) {
      return apiError(400, "doctor_slug is required.", "doctor_required");
    }
    if (!payment_mode) {
      return apiError(400, "payment_mode is required.", "payment_mode_required");
    }

    const phone = cleanPhone(patient_phone);
    if (phone.length !== 10) {
      return apiError(400, "A valid 10-digit patient phone is required.", "invalid_phone");
    }

    const doctors = await sql`
      SELECT id, slug, full_name, consultation_fee, followup_validity_days,
             clinic_id, clinic_name, clinic_slug
      FROM doctors
      WHERE slug = ${String(doctor_slug)}
        AND (clinic_id::text = ${clinicId} OR clinic_slug = ${clinicSlug})
      LIMIT 1;
    `;
    if (doctors.length === 0) {
      return apiError(404, "Doctor not found in your clinic.", "doctor_not_found");
    }
    const doc = doctors[0];

    const explicitFee =
      fee_amount === null || fee_amount === undefined || fee_amount === ""
        ? null
        : Number(fee_amount);
    if (explicitFee !== null && (!Number.isFinite(explicitFee) || explicitFee < 0)) {
      return apiError(400, "fee_amount must be a non-negative number.", "invalid_fee");
    }

    const doctorFee = doc.consultation_fee == null ? null : Number(doc.consultation_fee);
    const todayStr = new Date().toISOString().split("T")[0];

    let isFreeFollowup = false;

    const inserted = await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(hashtext(${clinicId} || ':' || ${doc.slug} || ':' || ${todayStr}));`;

      const tokenQuery = await tx`
        SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token
        FROM appointments
        WHERE clinic_id::text = ${clinicId}
          AND doctor_slug = ${doc.slug}
          AND appointment_date = ${todayStr};
      `;
      const nextToken = Number(tokenQuery[0]?.next_token || 1);

      if (doc.followup_validity_days != null) {
        const validityDays = Number(doc.followup_validity_days);
        const pastConsultation = await tx`
          SELECT id FROM appointments
          WHERE clinic_id::text = ${clinicId}
            AND doctor_slug = ${doc.slug}
            AND patient_phone = ${phone}
            AND status = 'completed'
            AND created_at >= NOW() - INTERVAL '1 day' * ${validityDays}
          LIMIT 1;
        `;
        isFreeFollowup = pastConsultation.length > 0;
      }

      const resolvedFee = isFreeFollowup ? 0 : (explicitFee ?? doctorFee);
      if (resolvedFee === null || !Number.isFinite(resolvedFee)) {
        throw Object.assign(
          new Error(
            "This doctor has no consultation fee configured. Set the fee on the doctor profile before registering a walk-in."
          ),
          { status: 422, code: "fee_not_configured" }
        );
      }

      const dateCompact = todayStr.replace(/-/g, "").slice(2);
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const aptNumber = `APT-${dateCompact}-WLK-${nextToken
        .toString()
        .padStart(2, "0")}-${randSuffix}`;

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
          ${clinicId},
          ${doc.full_name},
          ${doc.clinic_name || clinic.name},
          ${String(patient_name)},
          ${phone},
          ${todayStr},
          'Immediate Walk-In',
          ${nextToken},
          'waiting',
          ${resolvedFee},
          'paid',
          ${String(payment_mode)},
          ${symptoms_description},
          NOW()
        )
        RETURNING *;
      `;
    });

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "appointment.walk_in",
      entity: "appointment",
      entityId: String(inserted[0].id),
      after: {
        appointment_number: inserted[0].appointment_number,
        doctor_slug: doc.slug,
        patient_phone: phone,
        fee_amount: inserted[0].fee_amount,
        payment_mode,
        is_free_followup: isFreeFollowup,
      },
      request: req,
    });

    return NextResponse.json({
      status: "admitted",
      is_free_followup: isFreeFollowup,
      registered_by: auth.auth.user.full_name,
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
      },
    });
  } catch (error: any) {
    console.error("POST /api/clinic/walk-in error:", error);
    if (error?.status) {
      return apiError(error.status, error.message, error.code || "invalid_input");
    }
    return apiError(500, "Failed to admit walk-in.", "internal_error");
  }
}
