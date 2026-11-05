import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, guardPatient, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const parse = (value: any, fallback: any) => {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
};

/**
 * Prescription view.
 *
 * Full clinical detail requires either clinic staff of the owning clinic or a
 * verified patient session for the prescription's own phone number. Anonymous
 * callers (QR verification, public /p/ link) receive a redacted copy: masked
 * patient identity, no phone number, no clinical notes.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id || "").trim();
    if (!cleanId) {
      return apiError(400, "Prescription id is required.", "missing_id");
    }

    const rxQuery = await sql`
      SELECT * FROM prescriptions
      WHERE prescription_number = ${cleanId} OR id::text = ${cleanId}
      LIMIT 1;
    `;
    if (rxQuery.length === 0) {
      return apiError(404, "Prescription not found.", "prescription_not_found");
    }
    const rx = rxQuery[0];

    const rxPhone = String(rx.patient_phone || "").replace(/[^0-9]/g, "").slice(-10);

    let authorized = false;
    let actorId: string | null = null;
    let actorRole = "public";

    const patientAuth = await guardPatient(req);
    if (patientAuth.ok && rxPhone && patientAuth.auth.phone === rxPhone) {
      authorized = true;
      actorRole = "patient";
    } else {
      const staff = await guard(req, { roles: CLINIC_ROLES, requireClinic: false });
      if (
        staff.ok &&
        (staff.auth.isSuperAdmin ||
          (staff.auth.clinic && String(staff.auth.clinic.id) === String(rx.clinic_id)))
      ) {
        authorized = true;
        actorId = staff.auth.user.id;
        actorRole = staff.auth.role;
      }
    }

    const parsedRx = {
      ...rx,
      vitals: parse(rx.vitals, null),
      symptoms: parse(rx.symptoms, []),
      items: parse(rx.items, []),
      lab_tests: parse(rx.lab_tests, []),
      procedures: parse(rx.procedures, []),
    };

    if (!authorized) {
      const maskedName = String(rx.patient_name || "")
        .split(/\s+/)
        .map((part: string, index: number) =>
          index === 0 ? part : `${part.charAt(0).toUpperCase()}.`
        )
        .join(" ");

      return NextResponse.json({
        redacted: true,
        prescription_number: rx.prescription_number,
        doctor_name: rx.doctor_name,
        doctor_reg_number: rx.doctor_reg_number,
        clinic_name: rx.clinic_name,
        clinic_address: rx.clinic_address,
        patient_name_masked: maskedName || null,
        patient_age: rx.patient_age,
        patient_gender: rx.patient_gender,
        provisional_diagnosis: rx.provisional_diagnosis,
        items: parse(rx.items, []),
        instructions: rx.instructions,
        followup_date: rx.followup_date,
        digital_signature_hash: rx.digital_signature_hash,
        qr_verification_code: rx.qr_verification_code,
        created_at: rx.created_at,
      });
    }

    await logAudit({
      actorId,
      actorRole,
      clinicId: rx.clinic_id ? String(rx.clinic_id) : null,
      action: "prescription.view",
      entity: "prescription",
      entityId: String(rx.id),
      request: req,
    });

    return NextResponse.json({ ...parsedRx, redacted: false });
  } catch (error: any) {
    console.error("GET /api/prescriptions/[id] error:", error);
    return apiError(500, "Failed to load prescription.", "internal_error");
  }
}
