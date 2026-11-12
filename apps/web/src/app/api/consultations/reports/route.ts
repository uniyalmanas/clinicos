import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, guardPatient, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import type { ConsultationLanguage } from "@/lib/consultation-types";

export const dynamic = "force-dynamic";

const cleanPhone = (value: unknown) =>
  String(value || "").replace(/[^0-9]/g, "").slice(-10);

const asObject = (value: unknown): Record<string, any> =>
  value && typeof value === "object" && !Array.isArray(value)
    ? (value as Record<string, any>)
    : {};

const asArray = (value: unknown): any[] => (Array.isArray(value) ? value : []);

function serialise(row: any) {
  return {
    id: row.id,
    appointment_number: row.appointment_number,
    patient_phone: row.patient_phone,
    patient_name: row.patient_name,
    doctor_slug: row.doctor_slug,
    doctor_name: row.doctor_name,
    language: row.language || "auto",
    duration_seconds: row.duration_seconds ?? null,
    transcript: row.transcript || "",
    chief_complaints: row.chief_complaints || null,
    provisional_diagnosis: row.provisional_diagnosis || null,
    vitals: asObject(row.vitals),
    medicines: asArray(row.medicines),
    lab_tests: asArray(row.lab_tests),
    doctor_report: asObject(row.doctor_report),
    patient_report: asObject(row.patient_report),
    status: row.status || "draft",
    approved_at: row.approved_at || null,
    created_at: row.created_at,
    updated_at: row.updated_at,
  };
}

/**
 * Save (or approve) an AI consultation report.
 *
 * A report is written twice: once as a clinical document for the doctor, once
 * as a plain-language document for the patient. The doctor reviews both before
 * this endpoint is called with `status: "approved"`.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINICAL_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const body = await req.json();

    const {
      id = null,
      appointment_number = null,
      patient_name,
      patient_phone,
      doctor_slug = null,
      doctor_name = null,
      language = "auto",
      duration_seconds = null,
      transcript = "",
      chief_complaints = null,
      provisional_diagnosis = null,
      vitals = {},
      medicines = [],
      lab_tests = [],
      doctor_report = {},
      patient_report = {},
      status = "approved",
    } = body || {};

    if (!patient_name || !patient_phone) {
      return apiError(400, "Patient name and phone are required.", "invalid_input");
    }
    const phone = cleanPhone(patient_phone);
    if (phone.length !== 10) {
      return apiError(400, "A valid 10-digit patient phone is required.", "invalid_phone");
    }
    if (status !== "draft" && status !== "approved") {
      return apiError(400, "status must be draft or approved.", "invalid_status");
    }
    if (!String(transcript).trim()) {
      return apiError(
        400,
        "The consultation transcript is empty. Record or type the conversation first.",
        "missing_transcript"
      );
    }

    const approved = status === "approved";
    const approvedBy = approved ? auth.auth.user.id : null;
    const approvedAt = approved ? new Date().toISOString() : null;
    const reportLanguage = String(language) as ConsultationLanguage;

    if (id) {
      const updated = await sql`
        UPDATE consultation_reports SET
          appointment_number = ${appointment_number},
          patient_phone = ${phone},
          patient_name = ${String(patient_name)},
          doctor_slug = ${doctor_slug},
          doctor_name = ${doctor_name},
          language = ${reportLanguage},
          duration_seconds = ${duration_seconds === null ? null : Number(duration_seconds)},
          transcript = ${String(transcript)},
          chief_complaints = ${chief_complaints},
          provisional_diagnosis = ${provisional_diagnosis},
          vitals = ${JSON.stringify(asObject(vitals))}::jsonb,
          medicines = ${JSON.stringify(asArray(medicines))}::jsonb,
          lab_tests = ${JSON.stringify(asArray(lab_tests))}::jsonb,
          doctor_report = ${JSON.stringify(asObject(doctor_report))}::jsonb,
          patient_report = ${JSON.stringify(asObject(patient_report))}::jsonb,
          status = ${status},
          approved_by = ${approvedBy},
          approved_at = ${approvedAt},
          updated_at = NOW()
        WHERE id = ${id}::uuid
          AND clinic_id::text = ${clinicId}::text
        RETURNING *;
      `;
      if (updated.length === 0) {
        return apiError(404, "Report not found in your clinic.", "report_not_found");
      }
      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: approved ? "consultation_report.approve" : "consultation_report.update",
        entity: "consultation_report",
        entityId: updated[0].id,
        request: req,
      });
      return NextResponse.json({ status: "success", report: serialise(updated[0]) });
    }

    const inserted = await sql`
      INSERT INTO consultation_reports (
        clinic_id, appointment_number, patient_phone, patient_name,
        doctor_slug, doctor_name, language, duration_seconds, transcript,
        chief_complaints, provisional_diagnosis, vitals, medicines, lab_tests,
        doctor_report, patient_report, status, approved_by, approved_at
      ) VALUES (
        ${clinicId}, ${appointment_number}, ${phone}, ${String(patient_name)},
        ${doctor_slug}, ${doctor_name}, ${reportLanguage},
        ${duration_seconds === null ? null : Number(duration_seconds)}, ${String(transcript)},
        ${chief_complaints}, ${provisional_diagnosis},
        ${JSON.stringify(asObject(vitals))}::jsonb,
        ${JSON.stringify(asArray(medicines))}::jsonb,
        ${JSON.stringify(asArray(lab_tests))}::jsonb,
        ${JSON.stringify(asObject(doctor_report))}::jsonb,
        ${JSON.stringify(asObject(patient_report))}::jsonb,
        ${status}, ${approvedBy}, ${approvedAt}
      )
      RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: approved ? "consultation_report.approve" : "consultation_report.create",
      entity: "consultation_report",
      entityId: inserted[0].id,
      request: req,
    });

    return NextResponse.json({ status: "success", report: serialise(inserted[0]) });
  } catch (error) {
    console.error("POST /api/consultations/reports error:", error);
    return apiError(500, "Failed to save the consultation report.", "internal_error");
  }
}

/**
 * List approved consultation reports for a patient, or the reports attached to
 * one appointment. Patients may only read their own phone number.
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const requestedPhone = cleanPhone(url.searchParams.get("patient_phone"));
    const appointmentNumber = url.searchParams.get("appointment_number");
    const reportId = url.searchParams.get("id");

    let clinicId: string | null = null;
    let actorId: string | null = null;
    let actorRole = "patient";

    const patientAuth = await guardPatient(req);
    if (patientAuth.ok) {
      if (requestedPhone && patientAuth.auth.phone !== requestedPhone) {
        return apiError(403, "You can only view your own reports.", "patient_scope_denied");
      }
      if (!requestedPhone) {
        return apiError(400, "patient_phone is required.", "missing_phone");
      }
    } else {
      const staff = await guard(req, { roles: ["owner", "clinic_admin", "doctor", "staff", "receptionist"] });
      if (!staff.ok) return staff.response;
      clinicId = staff.auth.clinic?.id ?? null;
      actorId = staff.auth.user.id;
      actorRole = staff.auth.role;
      if (!clinicId && !staff.auth.isSuperAdmin) {
        return apiError(403, "A clinic context is required.", "clinic_required");
      }
    }

    if (reportId) {
      const UUID_RE =
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
      if (!UUID_RE.test(reportId)) {
        return apiError(400, "Invalid report id.", "invalid_report_id");
      }
    }

    let rows: any[] = [];

    if (reportId) {
      if (patientAuth.ok) {
        // A patient may only open their own *approved* report, never a draft
        // and never another patient's record.
        rows = await sql`
          SELECT * FROM consultation_reports
          WHERE id = ${reportId}::uuid
            AND patient_phone = ${patientAuth.auth.phone}
            AND status = 'approved'
          LIMIT 1;
        `;
      } else {
        rows = clinicId
          ? await sql`
              SELECT * FROM consultation_reports
              WHERE id = ${reportId}::uuid AND clinic_id::text = ${clinicId}::text
              LIMIT 1;
            `
          : await sql`SELECT * FROM consultation_reports WHERE id = ${reportId}::uuid LIMIT 1;`;
      }
    } else if (!patientAuth.ok && appointmentNumber) {
      rows = clinicId
        ? await sql`
            SELECT * FROM consultation_reports
            WHERE appointment_number = ${appointmentNumber}
              AND clinic_id::text = ${clinicId}::text
            ORDER BY created_at DESC LIMIT 50;
          `
        : await sql`
            SELECT * FROM consultation_reports
            WHERE appointment_number = ${appointmentNumber}
            ORDER BY created_at DESC LIMIT 50;
          `;
    } else {
      const phone = requestedPhone;
      // Patients only ever see approved reports.
      if (patientAuth.ok) {
        rows = await sql`
          SELECT * FROM consultation_reports
          WHERE patient_phone = ${phone} AND status = 'approved'
          ORDER BY created_at DESC LIMIT 50;
        `;
      } else {
        rows = clinicId
          ? await sql`
              SELECT * FROM consultation_reports
              WHERE patient_phone = ${phone} AND clinic_id::text = ${clinicId}::text
              ORDER BY created_at DESC LIMIT 50;
            `
          : await sql`
              SELECT * FROM consultation_reports
              WHERE patient_phone = ${phone}
              ORDER BY created_at DESC LIMIT 50;
            `;
      }
    }

    await logAudit({
      actorId,
      actorRole,
      clinicId,
      action: "consultation_report.list",
      entity: "patient",
      entityId: requestedPhone || appointmentNumber || reportId,
      request: req,
    });

    return NextResponse.json({ status: "success", reports: rows.map(serialise) });
  } catch (error) {
    console.error("GET /api/consultations/reports error:", error);
    return apiError(500, "Failed to load consultation reports.", "internal_error");
  }
}
