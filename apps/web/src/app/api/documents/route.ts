import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, guardPatient, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * List patient documents.
 *
 * A caller must be either clinic staff (scoped to their own clinic) or the
 * patient themselves (patient session matching the requested phone). There is
 * no unauthenticated lookup by phone number.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const patientPhone = searchParams.get("patient_phone");
    const requestedClinicId = searchParams.get("clinic_id");

    if (patientPhone) {
      const cleanPhone = String(patientPhone).replace(/[^0-9]/g, "").slice(-10);
      if (cleanPhone.length !== 10) {
        return apiError(400, "A valid 10-digit patient phone is required.", "invalid_phone");
      }

      const staff = await guard(req, { roles: CLINIC_ROLES });
      if (staff.ok) {
        const docs = await sql`
          SELECT id, patient_phone, patient_name, clinic_id, document_type, title,
                 file_name, file_size_kb, doctor_notes, uploaded_at, is_private
          FROM patient_documents
          WHERE clinic_id::text = ${String(staff.auth.clinic!.id)}::text
            AND right(regexp_replace(patient_phone, '[^0-9]', '', 'g'), 10) = ${cleanPhone}
          ORDER BY uploaded_at DESC;
        `;
        await logAudit({
          actorId: staff.auth.user.id,
          actorRole: staff.auth.role,
          clinicId: staff.auth.clinic!.id,
          action: "patient_documents.list",
          entity: "patient_phone",
          entityId: cleanPhone,
          request: req,
        });
        return NextResponse.json({ documents: docs });
      }

      const patient = await guardPatient(req);
      if (!patient.ok) return patient.response;
      if (patient.auth.phone !== cleanPhone) {
        return apiError(403, "You can only view your own documents.", "forbidden");
      }

      const docs = await sql`
        SELECT id, patient_phone, patient_name, clinic_id, document_type, title,
               file_name, file_size_kb, doctor_notes, uploaded_at, is_private
        FROM patient_documents
        WHERE right(regexp_replace(patient_phone, '[^0-9]', '', 'g'), 10) = ${cleanPhone}
        ORDER BY uploaded_at DESC;
      `;
      return NextResponse.json({ documents: docs });
    }

    if (requestedClinicId) {
      const staff = await guard(req, { roles: CLINIC_ROLES });
      if (!staff.ok) return staff.response;
      if (String(staff.auth.clinic!.id) !== String(requestedClinicId)) {
        return apiError(403, "You can only view documents in your clinic.", "forbidden");
      }
      const docs = await sql`
        SELECT id, patient_phone, patient_name, clinic_id, document_type, title,
               file_name, file_size_kb, doctor_notes, uploaded_at, is_private
        FROM patient_documents
        WHERE clinic_id::text = ${String(staff.auth.clinic!.id)}::text
        ORDER BY uploaded_at DESC
        LIMIT 50;
      `;
      return NextResponse.json({ documents: docs });
    }

    const staff = await guard(req, { roles: CLINIC_ROLES });
    if (!staff.ok) return staff.response;

    const docs = await sql`
      SELECT id, patient_phone, patient_name, clinic_id, document_type, title,
             file_name, file_size_kb, doctor_notes, uploaded_at, is_private
      FROM patient_documents
      WHERE clinic_id::text = ${String(staff.auth.clinic!.id)}::text
      ORDER BY uploaded_at DESC
      LIMIT 50;
    `;
    return NextResponse.json({ documents: docs });
  } catch (error: any) {
    console.error("GET /api/documents error:", error);
    return apiError(500, "Failed to load documents.", "internal_error");
  }
}

/** Metadata-only writes are not accepted; use POST /api/documents/upload. */
export async function POST() {
  return apiError(
    405,
    "Use POST /api/documents/upload with a real file.",
    "use_upload_endpoint"
  );
}
