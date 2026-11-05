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
    const { appointment_number } = body;

    if (!appointment_number) {
      return apiError(400, "appointment_number is required.", "missing_appointment");
    }

    const clinicId = auth.auth.clinic!.id;
    const updated = await sql`
      UPDATE appointments
      SET status = 'completed'
      WHERE (appointment_number = ${String(appointment_number)} OR id::text = ${String(appointment_number)})
        AND clinic_id::text = ${clinicId}::text
      RETURNING *;
    `;

    if (updated.length === 0) {
      return apiError(404, "Appointment not found in your clinic.", "appointment_not_found");
    }

    sseBroker.broadcast(
      "token_completed",
      {
        appointment_number: updated[0].appointment_number,
        token_number: updated[0].token_number,
      },
      clinicId
    );

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "token.complete",
      entity: "appointment",
      entityId: String(updated[0].id),
      request: req,
    });

    return NextResponse.json({
      status: "success",
      completed_by: auth.auth.user.full_name,
      appointment: updated[0],
    });
  } catch (error: any) {
    console.error("POST /api/clinic/complete-token error:", error);
    return apiError(500, "Failed to complete token.", "internal_error");
  }
}
