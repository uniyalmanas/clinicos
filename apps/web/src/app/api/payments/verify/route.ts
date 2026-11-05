import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createHmac, timingSafeEqual } from "crypto";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const COUNTER_MODES = ["cash", "counter_soundbox", "counter_cash"];
const ONLINE_MODES = ["online_upi", "online", "card", "netbanking", "wallet", "upi"];

function signaturesMatch(expected: string, received: string): boolean {
  const a = Buffer.from(expected, "utf8");
  const b = Buffer.from(received, "utf8");
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

/**
 * Mark an appointment as paid.
 *
 * Counter payments require an authenticated clinic session and are scoped to
 * that clinic. Online payments are verified against Razorpay's signature *and*
 * the gateway order itself (amount, doctor and phone must match the
 * appointment), so a valid signature for someone else's order cannot mark an
 * arbitrary appointment paid. No transaction id is invented.
 */
export async function POST(req: NextRequest) {
  try {
    const limit = await rateLimit(rateLimitKey(req, "payments:verify"), 30, 600);
    if (!limit.allowed) {
      return NextResponse.json(tooManyRequests(limit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const body = await req.json().catch(() => ({}));
    const appointmentNumber = String(body.appointment_number || "").trim();
    const orderId = String(body.order_id || "").trim();
    const paymentId = String(body.payment_id || "").trim();
    const signature = String(body.signature || "").trim();
    const requestedMode = String(body.payment_mode || "").toLowerCase();

    if (!appointmentNumber) {
      return apiError(400, "appointment_number is required.", "missing_appointment");
    }

    if (COUNTER_MODES.includes(requestedMode)) {
      const auth = await guard(req, { roles: CLINIC_ROLES });
      if (!auth.ok) return auth.response;

      const clinicId = auth.auth.clinic!.id;

      const apptRows = await sql`
        SELECT id, appointment_number, doctor_slug, patient_name, patient_phone,
               fee_amount, payment_status, clinic_id
        FROM appointments
        WHERE appointment_number = ${appointmentNumber}
          AND clinic_id::text = ${clinicId}::text
        LIMIT 1;
      `;
      if (apptRows.length === 0) {
        return apiError(404, "Appointment not found in your clinic.", "appointment_not_found");
      }
      const appt = apptRows[0];

      const updated = await sql`
        UPDATE appointments
        SET payment_status = 'paid', payment_mode = ${requestedMode}
        WHERE id = ${String(appt.id)}
          AND clinic_id::text = ${clinicId}::text
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "payment.counter.record",
        entity: "appointment",
        entityId: String(appt.id),
        before: { payment_status: appt.payment_status },
        after: { payment_status: "paid", payment_mode: requestedMode },
        request: req,
      });

      return NextResponse.json({
        status: "success",
        payment_status: "paid",
        payment_mode: requestedMode,
        transaction_id: null,
        appointment: updated[0] || null,
      });
    }

    // ── Online gateway verification ────────────────────────────────────────
    const paymentMode = ONLINE_MODES.includes(requestedMode) ? requestedMode : "online_upi";
    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return apiError(
        503,
        "Online payments are not configured on the server.",
        "payment_gateway_unavailable"
      );
    }
    if (!orderId || !paymentId || !signature) {
      return apiError(
        400,
        "order_id, payment_id and signature are required for online verification.",
        "missing_payment_fields"
      );
    }

    const expected = createHmac("sha256", razorpayKeySecret)
      .update(`${orderId}|${paymentId}`)
      .digest("hex");
    if (!signaturesMatch(expected, signature)) {
      return apiError(400, "Payment signature verification failed.", "signature_mismatch");
    }

    // Fetch the gateway order so the amount and booking notes can be checked
    // against the appointment we are about to mark paid.
    const gatewayAuth = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");
    const orderRes = await fetch(`https://api.razorpay.com/v1/orders/${encodeURIComponent(orderId)}`, {
      headers: { Authorization: `Basic ${gatewayAuth}` },
    });
    if (!orderRes.ok) {
      return apiError(502, "Could not load the payment order from the gateway.", "gateway_error");
    }
    const order = await orderRes.json();

    const apptRows = await sql`
      SELECT id, appointment_number, doctor_slug, patient_name, patient_phone,
             fee_amount, payment_status, clinic_id
      FROM appointments
      WHERE appointment_number = ${appointmentNumber}
      LIMIT 1;
    `;
    if (apptRows.length === 0) {
      return apiError(404, "Appointment not found.", "appointment_not_found");
    }
    const appt = apptRows[0];

    const expectedPaise = Math.round(Number(appt.fee_amount || 0) * 100);
    const notes = (order?.notes || {}) as Record<string, unknown>;
    const orderDoctor = String(notes.doctor_slug || "");
    const orderPhone = String(notes.patient_phone || "").replace(/[^0-9]/g, "").slice(-10);

    if (Number(order?.amount) !== expectedPaise) {
      return apiError(
        409,
        "Paid amount does not match this appointment's fee.",
        "amount_mismatch"
      );
    }
    if (orderDoctor && orderDoctor !== appt.doctor_slug) {
      return apiError(409, "This payment order is for a different doctor.", "doctor_mismatch");
    }
    if (orderPhone && appt.patient_phone && orderPhone !== String(appt.patient_phone).slice(-10)) {
      return apiError(409, "This payment order is for a different patient.", "patient_mismatch");
    }

    const updated = await sql`
      UPDATE appointments
      SET payment_status = 'paid', payment_mode = ${paymentMode}
      WHERE id = ${String(appt.id)}
      RETURNING *;
    `;

    await logAudit({
      actorId: null,
      actorRole: "payment_gateway",
      clinicId: appt.clinic_id ? String(appt.clinic_id) : null,
      action: "payment.online.verified",
      entity: "appointment",
      entityId: String(appt.id),
      before: { payment_status: appt.payment_status },
      after: {
        payment_status: "paid",
        payment_mode: paymentMode,
        payment_id: paymentId,
        order_id: orderId,
      },
      request: req,
    });

    return NextResponse.json({
      status: "success",
      payment_status: "paid",
      payment_mode: paymentMode,
      transaction_id: paymentId,
      appointment: updated[0] || null,
    });
  } catch (error: any) {
    console.error("POST /api/payments/verify error:", error);
    return apiError(500, "Failed to verify payment.", "internal_error");
  }
}
