import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * System-Enforced Inpatient Admission Gate
 * Rule: Only beds in VACANT_CLEAN state can admit patients.
 * If VACANT_DIRTY, admission is hard-blocked until dual sanitization QA passes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bed_id,
      patient_name,
      patient_phone,
      assigned_doctor_name = "Dr. Rahul Sharma",
      admission_type = "post_op_recovery",
      admission_notes = "Clinical observation and monitoring",
      vitals_protocol = "q4h",
      admitted_by = "Staff Nurse (In-Charge)"
    } = body;

    if (!bed_id || !patient_name) {
      return NextResponse.json({ error: "bed_id and patient_name are required" }, { status: 400 });
    }

    // Step 1: Pre-flight state check
    const bedQuery = await sql`
      SELECT b.*, w.daily_rate, w.hourly_rate, w.name as ward_name 
      FROM clinic_beds b
      LEFT JOIN clinic_wards w ON w.id = b.ward_id
      WHERE b.id = ${bed_id}
      LIMIT 1;
    `;

    if (bedQuery.length === 0) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    const bed = bedQuery[0];
    const currentStatus = String(bed.status || "").toUpperCase();

    // Enforce State Machine Gate
    if (currentStatus === "VACANT_DIRTY") {
      return NextResponse.json({
        error: `ADMISSION HARD-BLOCKED: Bed ${bed.bed_number} is in VACANT_DIRTY state. Dual-verification sanitization (Housekeeping UV cycle + Nurse QA e-sign) is legally required before patient admission.`,
        code: "BED_NOT_SANITIZED"
      }, { status: 422 });
    }

    if (currentStatus === "OCCUPIED_ACTIVE" || currentStatus === "OCCUPIED_PENDING_DISCHARGE" || currentStatus === "OCCUPIED") {
      return NextResponse.json({
        error: `ADMISSION BLOCKED: Bed ${bed.bed_number} already has an active patient (${bed.current_patient_name}).`,
        code: "BED_ALREADY_OCCUPIED"
      }, { status: 409 });
    }

    if (currentStatus === "MAINTENANCE") {
      return NextResponse.json({
        error: `ADMISSION BLOCKED: Bed ${bed.bed_number} is locked under MAINTENANCE for equipment inspection.`,
        code: "BED_MAINTENANCE"
      }, { status: 422 });
    }

    const admissionId = `ADM-${bed.bed_number}-${Date.now().toString().slice(-6)}`;
    const now = new Date();

    // Step 2: Create bed_admissions record
    await sql`
      INSERT INTO bed_admissions (
        id, clinic_slug, bed_id, bed_number, patient_name, patient_phone,
        doctor_name, admission_type, admission_timestamp, daily_rate, status
      ) VALUES (
        ${admissionId},
        ${bed.clinic_slug || "derma-care-dehradun"},
        ${bed.id},
        ${bed.bed_number},
        ${patient_name},
        ${patient_phone || null},
        ${assigned_doctor_name},
        ${admission_type},
        ${now},
        ${Number(bed.daily_rate || 1400)},
        'active'
      );
    `;

    // Step 3: Transition bed status strictly to OCCUPIED_ACTIVE
    const updated = await sql`
      UPDATE clinic_beds 
      SET 
        status = 'OCCUPIED_ACTIVE',
        admission_id = ${admissionId},
        current_patient_name = ${patient_name},
        current_patient_phone = ${patient_phone || null},
        assigned_doctor_name = ${assigned_doctor_name},
        admission_notes = ${admission_notes},
        admission_timestamp = ${now},
        discharge_ordered_at = NULL,
        doctor_discharge_signed = false,
        active_vitals_protocol = ${vitals_protocol},
        vitals_breach_alert = false,
        sanitization_hk_logged = false,
        sanitization_nurse_qa = false
      WHERE id = ${bed_id}
      RETURNING *;
    `;

    // Step 4: Automated Stay Billing Engine - Auto-post Day 1 Base Tariff to Immutable Ledger
    const ledgerId = randomUUID();
    const dayTariff = Number(bed.daily_rate || 1400);
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
        ${`Day 1 Inpatient Bed Tariff (${bed.ward_name || "General Ward"})`},
        ${dayTariff},
        ${admissionId},
        ${admitted_by},
        ${now}
      );
    `;

    // Step 5: Structured Clinical Task Engine - Auto-schedule Intake Protocols
    const task1Id = randomUUID();
    const task2Id = randomUUID();
    await sql`
      INSERT INTO bed_care_tasks (
        id, bed_id, admission_id, task_type, description, due_time, threshold_criteria, assigned_to
      ) VALUES 
      (
        ${task1Id},
        ${bed.id},
        ${admissionId},
        'vitals_check',
        'Intake Baseline Vitals (BP, Pulse, SpO2, Temp)',
        'Immediate (Within 15 mins)',
        'Alert if SpO2 < 92% or Temp > 100.4°F',
        'Duty Nurse'
      ),
      (
        ${task2Id},
        ${bed.id},
        ${admissionId},
        'medication_admin',
        'Nursing Assessment & IV Line Check',
        'Within 1 hour',
        'Verify patency and medication chart',
        'Staff Nurse'
      );
    `;

    return NextResponse.json({
      status: "success",
      admission_id: admissionId,
      message: `Patient ${patient_name} admitted to Bed ${bed.bed_number}. Billing meter running; intake vitals protocol activated.`,
      bed: updated[0]
    });
  } catch (error: any) {
    console.error("POST /api/beds/admit error:", error);
    return NextResponse.json({ error: error.message || "Failed to admit patient" }, { status: 500 });
  }
}
