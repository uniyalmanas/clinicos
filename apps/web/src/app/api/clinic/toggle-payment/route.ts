import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const ALLOWED_STATUS = new Set(["paid", "pending", "refunded", "waived"]);

export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const target = body.appointment_number || body.token_id || body.id || body.appointment_id;
    const { payment_mode } = body;
    let { payment_status } = body;

    if (!target) {
      return apiError(400, "appointment_number or id is required.", "missing_target");
    }
    if (payment_status && !ALLOWED_STATUS.has(String(payment_status))) {
      return apiError(400, "Invalid payment status.", "invalid_payment_status");
    }

    const clinicId = auth.auth.clinic!.id;
    const current = await sql`
      SELECT * FROM appointments
      WHERE (appointment_number = ${target} OR id::text = ${target})
        AND clinic_id::text = ${clinicId}::text
      LIMIT 1;
    `;

    if (current.length === 0) {
      return apiError(404, "Appointment not found in your clinic.", "appointment_not_found");
    }

    if (!payment_status) {
      payment_status =
        current[0].payment_status === "paid" ? "pending" : "paid";
    }

    const updated = payment_mode
      ? await sql`
          UPDATE appointments
          SET payment_status = ${payment_status}, payment_mode = ${payment_mode}
          WHERE id::text = ${current[0].id}::text
          RETURNING *;
        `
      : await sql`
          UPDATE appointments
          SET payment_status = ${payment_status}
          WHERE id::text = ${current[0].id}::text
          RETURNING *;
        `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "appointment.payment.update",
      entity: "appointment",
      entityId: String(current[0].id),
      before: { payment_status: current[0].payment_status, payment_mode: current[0].payment_mode },
      after: { payment_status, payment_mode: payment_mode ?? current[0].payment_mode },
      request: req,
    });

    return NextResponse.json({ status: "success", appointment: updated[0] });
  } catch (error: any) {
    console.error("POST /api/clinic/toggle-payment error:", error);
    return apiError(500, "Failed to update payment.", "internal_error");
  }
}
