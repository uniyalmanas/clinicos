import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createHash, randomUUID } from "crypto";
import { guard, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const cleanPhone = (value: unknown) =>
  String(value || "").replace(/[^0-9]/g, "").slice(-10);

/**
 * Issue a prescription.
 *
 * Everything printed on the document is resolved server-side:
 *   • the clinic from the authenticated tenant,
 *   • the prescribing doctor (and their council registration) from the database,
 *   • the appointment, which must belong to the same clinic.
 *
 * Nothing is defaulted. A missing doctor registration, appointment, age, or
 * follow-up date is rejected or stored as null — never invented.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINICAL_ROLES });
    if (!auth.ok) return auth.response;

    const clinic = auth.auth.clinic!;
    const clinicId = clinic.id;

    const body = await req.json();
    const {
      appointment_number,
      doctor_slug,
      patient_name,
      patient_phone,
      patient_age = null,
      patient_gender = null,
      vitals = {},
      symptoms = [],
      provisional_diagnosis = null,
      items = [],
      instructions = "",
      followup_date = null,
      lab_tests = [],
      procedures = [],
      clinical_notes = "",
      diet_advice = "",
    } = body;

    if (!patient_name || !patient_phone) {
      return apiError(400, "Patient name and phone are required.", "invalid_input");
    }
    const patientPhone = cleanPhone(patient_phone);
    if (patientPhone.length !== 10) {
      return apiError(400, "A valid 10-digit patient phone is required.", "invalid_phone");
    }
    if (!appointment_number) {
      return apiError(
        400,
        "appointment_number is required so the prescription is tied to a real visit.",
        "appointment_required"
      );
    }

    const appointments = await sql`
      SELECT * FROM appointments
      WHERE appointment_number = ${String(appointment_number)}
        AND clinic_id::text = ${clinicId}::text
      LIMIT 1;
    `;
    if (appointments.length === 0) {
      return apiError(404, "Appointment not found in your clinic.", "appointment_not_found");
    }
    const appointment = appointments[0];

    // Resolve the prescribing doctor. The doctor must belong to this clinic and
    // must have a real council registration number on file.
    let doctorRow: any = null;
    if (auth.auth.doctor) {
      const rows = await sql`
        SELECT id, slug, full_name, medical_council_reg_number
        FROM doctors
        WHERE id::text = ${auth.auth.doctor.id}::text
          AND (
            clinic_id::text = ${clinicId}::text
            OR clinic_slug = ${clinic.slug}
          )
        LIMIT 1;
      `;
      doctorRow = rows[0] || null;
    }

    if (!doctorRow && doctor_slug) {
      const rows = await sql`
        SELECT id, slug, full_name, medical_council_reg_number
        FROM doctors
        WHERE slug = ${String(doctor_slug)}
          AND (
            clinic_id::text = ${clinicId}::text
            OR clinic_slug = ${clinic.slug}
          )
        LIMIT 1;
      `;
      doctorRow = rows[0] || null;
    }

    if (!doctorRow) {
      return apiError(
        422,
        "No prescribing doctor is linked to your account. Pass doctor_slug or ask an administrator to link your doctor profile.",
        "doctor_required"
      );
    }

    const doctorRegNumber = String(doctorRow.medical_council_reg_number || "").trim();
    if (!doctorRegNumber) {
      return apiError(
        422,
        `Dr. ${doctorRow.full_name} has no medical council registration number on file. A prescription cannot be issued without it.`,
        "registration_required"
      );
    }

    const clinicAddress =
      [
        clinic.address_line,
        clinic.city,
        clinic.state,
        clinic.postal_code,
      ]
        .filter(Boolean)
        .join(", ") || null;

    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, "0");
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const rxNumber = `RX-${year}-${month}-${randSuffix}`;

    const standardizedItems = (Array.isArray(items) ? items : []).map((item: any) => ({
      medicine_name: item.medicine_name || item.name || "",
      generic_name: String(item.generic_name || item.generic || "").toUpperCase(),
      dosage_form: item.dosage_form || null,
      strength: item.strength || null,
      dosage_frequency: item.dosage_frequency || item.frequency || null,
      timing_relation: item.timing_relation || null,
      duration_days:
        item.duration_days == null && item.duration == null
          ? null
          : Number(item.duration_days ?? parseInt(item.duration, 10)) || null,
      special_instructions: item.special_instructions || null,
    }));

    const ageNum =
      patient_age === null || patient_age === undefined || patient_age === ""
        ? null
        : Number(patient_age);
    if (ageNum !== null && (!Number.isFinite(ageNum) || ageNum < 0 || ageNum > 130)) {
      return apiError(400, "patient_age must be a sensible number.", "invalid_age");
    }

    // Cryptographic integrity seal over the server-authoritative payload.
    const integrityPayload = [
      rxNumber,
      clinicId,
      doctorRegNumber,
      patient_name,
      patientPhone,
      JSON.stringify(standardizedItems),
      now.toISOString(),
    ].join("|");
    const integrityHash = createHash("sha256").update(integrityPayload).digest("hex");
    const qrVerificationCode = `VERIFY-${String(doctorRow.slug)
      .replace(/^dr-/, "")
      .slice(0, 5)
      .toUpperCase()}-${Math.floor(100000 + Math.random() * 900000)}`;

    const id = randomUUID();

    const inserted = await sql`
      INSERT INTO prescriptions (
        id, prescription_number, appointment_number, clinic_id, doctor_name,
        doctor_reg_number, clinic_name, clinic_address, patient_name,
        patient_phone, patient_age, patient_gender, vitals, symptoms,
        provisional_diagnosis, items, instructions, followup_date,
        digital_signature_hash, qr_verification_code, lab_tests,
        procedures, clinical_notes, diet_advice, created_at
      ) VALUES (
        ${id},
        ${rxNumber},
        ${String(appointment_number)},
        ${clinicId},
        ${doctorRow.full_name},
        ${doctorRegNumber},
        ${clinic.name},
        ${clinicAddress},
        ${String(patient_name)},
        ${patientPhone},
        ${ageNum},
        ${patient_gender || null},
        ${JSON.stringify(vitals)},
        ${JSON.stringify(Array.isArray(symptoms) ? symptoms : [symptoms])},
        ${provisional_diagnosis},
        ${JSON.stringify(standardizedItems)},
        ${instructions},
        ${followup_date},
        ${integrityHash},
        ${qrVerificationCode},
        ${JSON.stringify(Array.isArray(lab_tests) ? lab_tests : [])},
        ${JSON.stringify(Array.isArray(procedures) ? procedures : [])},
        ${clinical_notes},
        ${diet_advice},
        NOW()
      )
      RETURNING *;
    `;

    await sql`
      UPDATE appointments
      SET status = 'completed'
      WHERE id::text = ${String(appointment.id)}
        AND clinic_id::text = ${clinicId}::text;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "prescription.issue",
      entity: "prescription",
      entityId: id,
      after: {
        prescription_number: rxNumber,
        appointment_number: String(appointment_number),
        doctor_id: doctorRow.id,
      },
      request: req,
    });

    return NextResponse.json({
      status: "success",
      prescription: {
        ...inserted[0],
        doctor_slug: doctorRow.slug,
        prescription_integrity_hash: integrityHash,
        integrity_hash: integrityHash,
        integrity_seal_label: "Prescription Integrity Hash (SHA-256)",
        items: standardizedItems,
        vitals: typeof inserted[0].vitals === "string" ? JSON.parse(inserted[0].vitals) : inserted[0].vitals,
        symptoms:
          typeof inserted[0].symptoms === "string"
            ? JSON.parse(inserted[0].symptoms)
            : inserted[0].symptoms,
      },
    });
  } catch (error: any) {
    console.error("POST /api/prescriptions/generate error:", error);
    return apiError(500, "Failed to generate prescription.", "internal_error");
  }
}
