import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { resolveLabOrderOrigin } from "@/lib/lab-scope";

export const dynamic = "force-dynamic";

/**
 * Create a lab order for a real visit.
 *
 * The order must originate from an appointment or prescription in the caller's
 * clinic — that link is what makes the order tenant-scoped. Demographics and
 * clinician names are taken from the sourced record, not invented.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINICAL_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const body = await req.json();
    const {
      appointment_id = null,
      prescription_id = null,
      patient_name,
      patient_phone,
      patient_age = null,
      patient_gender = null,
      doctor_name = null,
      test_name,
      category = null,
      sample_type = null,
      fasting_required = null,
      vacutainer_tube = null,
      tat_sla_minutes = null,
    } = body;

    if (!patient_name || !patient_phone || !test_name) {
      return apiError(
        400,
        "patient_name, patient_phone and test_name are required.",
        "invalid_input"
      );
    }

    const origin = await resolveLabOrderOrigin(clinicId, appointment_id, prescription_id);
    if (!origin.ok) {
      return apiError(422, origin.error, "origin_required");
    }

    // Prefer the ordering clinician recorded on the visit when the caller did
    // not supply one.
    let resolvedDoctor = doctor_name;
    if (!resolvedDoctor && origin.appointmentId) {
      const rows = await sql`
        SELECT doctor_name FROM appointments WHERE id::text = ${origin.appointmentId} LIMIT 1;
      `;
      resolvedDoctor = rows[0]?.doctor_name || null;
    }
    if (!resolvedDoctor && origin.prescriptionId) {
      const rows = await sql`
        SELECT doctor_name FROM prescriptions WHERE id::text = ${origin.prescriptionId} LIMIT 1;
      `;
      resolvedDoctor = rows[0]?.doctor_name || null;
    }

    const orderNumber = `LAB-${new Date().getFullYear()}-${Math.floor(100000 + Math.random() * 900000)}`;
    const sampleBarcode = `BC-${Math.floor(100000 + Math.random() * 900000)}`;
    const ageNum = patient_age == null ? null : Number(patient_age);

    const inserted = await sql`
      INSERT INTO diagnostic_lab_orders (
        id,
        order_number,
        appointment_id,
        prescription_id,
        sample_barcode,
        patient_name,
        patient_phone,
        patient_age,
        patient_gender,
        doctor_name,
        test_name,
        category,
        sample_type,
        vacutainer_tube,
        fasting_required,
        tat_sla_minutes,
        status
      ) VALUES (
        ${randomUUID()},
        ${orderNumber},
        ${origin.appointmentId},
        ${origin.prescriptionId},
        ${sampleBarcode},
        ${String(patient_name)},
        ${String(patient_phone)},
        ${ageNum},
        ${patient_gender},
        ${resolvedDoctor},
        ${String(test_name)},
        ${category},
        ${sample_type},
        ${vacutainer_tube},
        ${fasting_required == null ? null : Boolean(fasting_required)},
        ${tat_sla_minutes == null ? null : Number(tat_sla_minutes)},
        'ordered'
      )
      RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "lab.order.create",
      entity: "diagnostic_lab_order",
      entityId: String(inserted[0].id),
      after: {
        order_number: orderNumber,
        test_name,
        appointment_id: origin.appointmentId,
        prescription_id: origin.prescriptionId,
      },
      request: req,
    });

    return NextResponse.json({ success: true, order: inserted[0] });
  } catch (error: any) {
    console.error("Create lab order error:", error);
    return apiError(500, "Failed to create lab order.", "internal_error");
  }
}
