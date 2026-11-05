import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, guardPatient, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Patient record.
 *
 * There is no anonymous path. Access requires either
 *   • a verified patient session for this exact phone number, or
 *   • an authenticated clinic member whose clinic has a real record
 *     (appointment / prescription / document) for this patient, or
 *   • a super admin (audited).
 *
 * Clinical fields are never fabricated: if the database has no value, the
 * response carries null/empty rather than an invented diagnosis or vitals.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ phone: string }> }
) {
  try {
    const { phone } = await params;
    const cleanPhone = decodeURIComponent(phone || "").replace(/[^0-9]/g, "").slice(-10);

    if (cleanPhone.length !== 10) {
      return apiError(400, "Invalid patient phone number.", "invalid_phone");
    }

    let scopeClinicId: string | null = null;
    let actorId: string | null = null;
    let actorRole = "patient";
    let isSuperAdmin = false;

    const patientAuth = await guardPatient(req);
    if (patientAuth.ok) {
      if (patientAuth.auth.phone !== cleanPhone) {
        return apiError(403, "You can only view your own records.", "patient_scope_denied");
      }
      actorRole = "patient";
    } else {
      const staff = await guard(req, { roles: CLINIC_ROLES });
      if (!staff.ok) return staff.response;

      actorId = staff.auth.user.id;
      actorRole = staff.auth.role;
      isSuperAdmin = staff.auth.isSuperAdmin;
      if (!isSuperAdmin) {
        scopeClinicId = staff.auth.clinic?.id ?? null;
        if (!scopeClinicId) {
          return apiError(403, "A clinic context is required.", "clinic_required");
        }
      }
    }

    const appointments = scopeClinicId
      ? await sql`
          SELECT a.*, c.slug as clinic_slug, c.name as clinic_name
          FROM appointments a
          LEFT JOIN clinics c ON c.id::text = a.clinic_id::text
          WHERE RIGHT(REGEXP_REPLACE(a.patient_phone, '[^0-9]', '', 'g'), 10) = ${cleanPhone}
            AND a.clinic_id::text = ${scopeClinicId}::text
          ORDER BY a.appointment_date DESC, a.created_at DESC;
        `
      : await sql`
          SELECT a.*, c.slug as clinic_slug, c.name as clinic_name
          FROM appointments a
          LEFT JOIN clinics c ON c.id::text = a.clinic_id::text
          WHERE RIGHT(REGEXP_REPLACE(a.patient_phone, '[^0-9]', '', 'g'), 10) = ${cleanPhone}
          ORDER BY a.appointment_date DESC, a.created_at DESC;
        `;

    const prescriptions = scopeClinicId
      ? await sql`
          SELECT p.*, c.slug as clinic_slug, c.name as clinic_name
          FROM prescriptions p
          LEFT JOIN clinics c ON c.id::text = p.clinic_id::text
          WHERE RIGHT(REGEXP_REPLACE(p.patient_phone, '[^0-9]', '', 'g'), 10) = ${cleanPhone}
            AND p.clinic_id::text = ${scopeClinicId}::text
          ORDER BY p.created_at DESC;
        `
      : await sql`
          SELECT p.*, c.slug as clinic_slug, c.name as clinic_name
          FROM prescriptions p
          LEFT JOIN clinics c ON c.id::text = p.clinic_id::text
          WHERE RIGHT(REGEXP_REPLACE(p.patient_phone, '[^0-9]', '', 'g'), 10) = ${cleanPhone}
          ORDER BY p.created_at DESC;
        `;

    const documents = scopeClinicId
      ? await sql`
          SELECT id, patient_phone, clinic_id, patient_name, document_type, title,
                 file_name, file_size_kb, doctor_notes, uploaded_at, is_private
          FROM patient_documents
          WHERE RIGHT(REGEXP_REPLACE(patient_phone, '[^0-9]', '', 'g'), 10) = ${cleanPhone}
            AND clinic_id::text = ${scopeClinicId}::text
          ORDER BY uploaded_at DESC;
        `
      : await sql`
          SELECT id, patient_phone, clinic_id, patient_name, document_type, title,
                 file_name, file_size_kb, doctor_notes, uploaded_at, is_private
          FROM patient_documents
          WHERE RIGHT(REGEXP_REPLACE(patient_phone, '[^0-9]', '', 'g'), 10) = ${cleanPhone}
          ORDER BY uploaded_at DESC;
        `;

    // A clinic member may only see a patient who actually has a record there.
    if (scopeClinicId && appointments.length + prescriptions.length + documents.length === 0) {
      return apiError(
        403,
        "This patient has no records at your clinic.",
        "patient_not_in_clinic"
      );
    }

    const demographics = await sql`
      SELECT uhid, full_name, phone, age, gender, blood_group
      FROM emr_patients
      WHERE RIGHT(REGEXP_REPLACE(phone, '[^0-9]', '', 'g'), 10) = ${cleanPhone}
      LIMIT 1;
    `;
    const emr = demographics[0] || null;

    const allergies = emr?.uhid
      ? await sql`
          SELECT allergen_name, reaction_severity, reaction_description
          FROM emr_allergies
          WHERE patient_uhid = ${emr.uhid} AND is_active = true
          ORDER BY created_at DESC;
        `
      : [];

    const doctorSlug = appointments[0]?.doctor_slug || null;
    const doctorSpec = doctorSlug
      ? (await sql`SELECT specialization FROM doctors WHERE slug = ${doctorSlug} LIMIT 1`)[0]
          ?.specialization || null
      : null;

    const rxByAppointment = new Map<string, any>();
    for (const rx of prescriptions) {
      if (rx.appointment_number) rxByAppointment.set(rx.appointment_number, rx);
    }

    const parseJson = (value: any) => {
      if (value == null) return null;
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return null;
        }
      }
      return value;
    };

    const visits = appointments.map((apt: any) => {
      const linkedRx = rxByAppointment.get(apt.appointment_number) || null;
      const rxItems = parseJson(linkedRx?.items);
      const rxVitals = parseJson(linkedRx?.vitals);

      return {
        visit_id: apt.appointment_number,
        visit_date: apt.appointment_date || null,
        doctor_name: apt.doctor_name || linkedRx?.doctor_name || null,
        doctor_slug: apt.doctor_slug || linkedRx?.doctor_slug || null,
        doctor_specialization: doctorSpec,
        clinic_name: apt.clinic_name || linkedRx?.clinic_name || null,
        clinic_slug: apt.clinic_slug || linkedRx?.clinic_slug || null,
        provisional_diagnosis: linkedRx?.provisional_diagnosis || apt.symptoms_description || null,
        vitals: rxVitals && typeof rxVitals === "object" ? rxVitals : null,
        medications_summary: Array.isArray(rxItems)
          ? rxItems.map((m: any) => `${m.medicine_name}${m.dosage_frequency ? ` (${m.dosage_frequency})` : ""}`)
          : [],
        followup_advice: linkedRx?.instructions || null,
        prescription_number: linkedRx?.prescription_number || null,
        fee_amount: apt.fee_amount == null ? null : Number(apt.fee_amount),
        payment_status: apt.payment_status || null,
        clinic_id: apt.clinic_id || null,
      };
    });

    const knownConditions = Array.from(
      new Set(
        [
          ...prescriptions.map((r: any) => r.provisional_diagnosis),
          ...appointments.map((a: any) => a.symptoms_description),
        ].filter(Boolean)
      )
    );

    const latest = visits[0] || null;

    const patientProfile = {
      id: emr?.uhid ? `uhid-${emr.uhid}` : `pt-${cleanPhone}`,
      uhid: emr?.uhid || null,
      full_name:
        emr?.full_name ||
        appointments[0]?.patient_name ||
        prescriptions[0]?.patient_name ||
        null,
      phone: emr?.phone || appointments[0]?.patient_phone || prescriptions[0]?.patient_phone || `+91${cleanPhone}`,
      gender: emr?.gender || null,
      age: emr?.age ?? null,
      blood_group: emr?.blood_group || null,
      chronic_allergies: allergies,
      known_conditions: knownConditions,
      total_visits: appointments.length,
      primary_clinic_slug: appointments[0]?.clinic_slug || prescriptions[0]?.clinic_slug || "derma-care-dehradun",
      visits,
      documents,
    };

    await logAudit({
      actorId,
      actorRole,
      clinicId: scopeClinicId,
      action: "patient_record.view",
      entity: "patient",
      entityId: cleanPhone,
      request: req,
    });

    return NextResponse.json({ patient: patientProfile });
  } catch (error: any) {
    console.error("GET /api/patients/[phone] error:", error);
    return apiError(500, "Failed to load patient history.", "internal_error");
  }
}
