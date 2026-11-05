import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { sseBroker } from "@/lib/sse-broker";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const target =
      body.appointment_number || body.token_id || body.id || body.appointment_id;
    const { chamber_name = "Chamber 1" } = body;

    if (!target) {
      return apiError(400, "appointment_number or id is required.", "missing_appointment");
    }

    const clinicId = auth.auth.clinic!.id;
    const apts = await sql`
      SELECT * FROM appointments
      WHERE (appointment_number = ${String(target)} OR id::text = ${String(target)})
        AND clinic_id::text = ${clinicId}::text
      LIMIT 1;
    `;

    if (apts.length === 0) {
      return apiError(404, "Appointment not found in your clinic.", "appointment_not_found");
    }

    const currentApt = apts[0];

    // Only one patient per doctor can be in consultation at a time.
    await sql`
      UPDATE appointments
      SET status = 'completed'
      WHERE doctor_slug = ${currentApt.doctor_slug}
        AND clinic_id::text = ${clinicId}::text
        AND status = 'in_consultation'
        AND id::text != ${String(currentApt.id)};
    `;

    const updated = await sql`
      UPDATE appointments
      SET status = 'in_consultation'
      WHERE id::text = ${String(currentApt.id)}
        AND clinic_id::text = ${clinicId}::text
      RETURNING *;
    `;

    if (updated.length === 0) {
      return apiError(404, "Appointment not found in your clinic.", "appointment_not_found");
    }

    sseBroker.broadcast(
      "token_called",
      {
        appointment_number: currentApt.appointment_number,
        token_number: currentApt.token_number,
        patient_name: currentApt.patient_name,
        doctor_name: currentApt.doctor_name,
        chamber_name,
        trigger_chime: true,
      },
      clinicId
    );

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "token.call",
      entity: "appointment",
      entityId: String(currentApt.id),
      request: req,
    });

    return NextResponse.json({
      status: "success",
      called_by: auth.auth.user.full_name,
      appointment: updated[0],
    });
  } catch (error: any) {
    console.error("POST /api/clinic/call-token error:", error);
    return apiError(500, "Failed to call token.", "internal_error");
  }
}
