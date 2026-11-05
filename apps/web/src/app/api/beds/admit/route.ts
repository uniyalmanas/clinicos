import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Inpatient admission.
 *
 * Only a bed in VACANT_CLEAN can be occupied; VACANT_DIRTY is hard-blocked until
 * dual sanitization QA passes. Every row written here is scoped to the caller's
 * clinic and every tariff comes from the ward configuration.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINICAL_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;
    const actorName = auth.auth.user.full_name;

    const body = await req.json();
    const {
      bed_id,
      patient_name,
      patient_phone = null,
      assigned_doctor_name,
      admission_type = null,
      admission_notes = null,
      vitals_protocol = null,
    } = body;

    if (!bed_id || !patient_name) {
      return apiError(400, "bed_id and patient_name are required.", "invalid_input");
    }
    if (!assigned_doctor_name) {
      return apiError(
        400,
        "assigned_doctor_name is required for an inpatient admission.",
        "doctor_required"
      );
    }

    const bedQuery = await sql`
      SELECT b.*, w.daily_rate, w.hourly_rate, w.name AS ward_name
      FROM clinic_beds b
      LEFT JOIN clinic_wards w ON w.id = b.ward_id
      WHERE b.id = ${String(bed_id)}
        AND b.clinic_slug = ${clinicSlug}
      LIMIT 1;
    `;
    if (bedQuery.length === 0) {
      return apiError(404, "Bed not found in your clinic.", "bed_not_found");
    }

    const bed = bedQuery[0];
    const currentStatus = String(bed.status || "").toUpperCase();

    if (currentStatus === "VACANT_DIRTY") {
      return apiError(
        422,
        `Bed ${bed.bed_number} is awaiting sanitization. Housekeeping and nurse QA must both sign off before admission.`,
        "bed_not_sanitized"
      );
    }
    if (
      currentStatus === "OCCUPIED_ACTIVE" ||
      currentStatus === "OCCUPIED_PENDING_DISCHARGE" ||
      currentStatus === "OCCUPIED"
    ) {
      return apiError(409, `Bed ${bed.bed_number} is already occupied.`, "bed_occupied");
    }
    if (currentStatus === "MAINTENANCE") {
      return apiError(422, `Bed ${bed.bed_number} is under maintenance.`, "bed_maintenance");
    }
    if (currentStatus !== "VACANT_CLEAN" && currentStatus !== "VACANT" && currentStatus !== "") {
      return apiError(422, `Bed ${bed.bed_number} is not available.`, "bed_unavailable");
    }

    const dailyRate = bed.daily_rate == null ? null : Number(bed.daily_rate);
    if (dailyRate == null || !Number.isFinite(dailyRate) || dailyRate <= 0) {
      return apiError(
        422,
        `Ward tariff for bed ${bed.bed_number} is not configured. Set a daily rate on the ward before admitting.`,
        "tariff_not_configured"
      );
    }

    const admissionId = `ADM-${String(bed.bed_number)}-${randomUUID().slice(0, 8)}`;
    const now = new Date();

    await sql`
      INSERT INTO bed_admissions (
        id, clinic_slug, bed_id, bed_number, patient_name, patient_phone,
        doctor_name, admission_type, admission_timestamp, daily_rate, status
      ) VALUES (
        ${admissionId},
        ${clinicSlug},
        ${bed.id},
        ${bed.bed_number},
        ${String(patient_name)},
        ${patient_phone},
        ${String(assigned_doctor_name)},
        ${admission_type},
        ${now},
        ${dailyRate},
        'active'
      );
    `;

    const updated = await sql`
      UPDATE clinic_beds
      SET
        status = 'OCCUPIED_ACTIVE',
        admission_id = ${admissionId},
        current_patient_name = ${String(patient_name)},
        current_patient_phone = ${patient_phone},
        assigned_doctor_name = ${String(assigned_doctor_name)},
        admission_notes = ${admission_notes},
        admission_timestamp = ${now},
        discharge_ordered_at = NULL,
        doctor_discharge_signed = false,
        active_vitals_protocol = ${vitals_protocol},
        vitals_breach_alert = false,
        sanitization_hk_logged = false,
        sanitization_nurse_qa = false
      WHERE id = ${String(bed_id)}
        AND clinic_slug = ${clinicSlug}
      RETURNING *;
    `;

    const ledgerId = randomUUID();
    await sql`
      INSERT INTO bed_billing_ledger (
        id, admission_id, bed_id, bed_number, charge_type,
        description, amount, source_order_ref, posted_by, posted_at
      ) VALUES (
        ${ledgerId},
        ${admissionId},
        ${bed.id},
        ${bed.bed_number},
        'base_tariff',
        ${`Day 1 inpatient bed tariff (${bed.ward_name || "ward"})`},
        ${dailyRate},
        ${admissionId},
        ${actorName},
        ${now}
      );
    `;

    await sql`
      INSERT INTO bed_care_tasks (
        id, bed_id, admission_id, task_type, description, due_time, threshold_criteria, assigned_to
      ) VALUES
      (
        ${randomUUID()},
        ${bed.id},
        ${admissionId},
        'vitals_check',
        'Intake baseline vitals (BP, pulse, SpO2, temperature)',
        'Within 15 minutes',
        'Alert if SpO2 < 92% or temperature > 100.4F',
        'Duty nurse'
      ),
      (
        ${randomUUID()},
        ${bed.id},
        ${admissionId},
        'medication_admin',
        'Nursing assessment and IV line check',
        'Within 1 hour',
        'Verify patency and medication chart',
        'Staff nurse'
      );
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "bed.admit",
      entity: "bed_admission",
      entityId: admissionId,
      after: updated[0] || null,
      request: req,
    });

    return NextResponse.json({
      status: "success",
      admission_id: admissionId,
      message: `Patient ${patient_name} admitted to bed ${bed.bed_number}. Billing meter started.`,
      bed: updated[0],
    });
  } catch (error: any) {
    console.error("POST /api/beds/admit error:", error);
    return apiError(500, "Failed to admit patient.", "internal_error");
  }
}
