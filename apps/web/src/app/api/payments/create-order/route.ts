import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";
import { apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Payment order creation for the public booking flow.
 *
 * The amount is derived from the doctor's configured fee, never from the
 * request body, and no fake gateway/UPI identifier is invented when Razorpay
 * is not configured.
 */
export async function POST(req: NextRequest) {
  try {
    const limit = await rateLimit(rateLimitKey(req, "payments:create-order"), 10, 3600);
    if (!limit.allowed) {
      return NextResponse.json(tooManyRequests(limit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const body = await req.json().catch(() => ({}));
    const doctorSlug = String(body.doctor_slug || "").trim();
    const patientName = String(body.patient_name || "").slice(0, 120);
    const patientPhone = String(body.patient_phone || "").replace(/[^0-9]/g, "").slice(-10);

    if (!doctorSlug) {
      return apiError(400, "doctor_slug is required.", "missing_doctor");
    }

    const doctors = await sql`
      SELECT full_name, consultation_fee
      FROM doctors
      WHERE slug = ${doctorSlug} AND is_active = true
      LIMIT 1;
    `;
    if (doctors.length === 0) {
      return apiError(404, "Doctor not found.", "doctor_not_found");
    }

    const amountInRupees = Number(doctors[0].consultation_fee);
    if (!Number.isFinite(amountInRupees) || amountInRupees <= 0) {
      return apiError(422, "This doctor has no payable consultation fee.", "fee_not_configured");
    }
    const amountInPaise = Math.round(amountInRupees * 100);

    const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

    if (!razorpayKeyId || !razorpayKeySecret) {
      return apiError(
        503,
        "Online payments are not configured. Please pay at the clinic.",
        "payment_gateway_unavailable"
      );
    }

    const authHeader = Buffer.from(`${razorpayKeyId}:${razorpayKeySecret}`).toString("base64");
    const rzRes = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Basic ${authHeader}`,
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: `rcpt_${Date.now().toString(36)}`,
        notes: { doctor_slug: doctorSlug, patient_name: patientName, patient_phone: patientPhone },
      }),
    });

    if (!rzRes.ok) {
      console.error("[payments] Razorpay order failed", rzRes.status, await rzRes.text());
      return apiError(502, "Could not create a payment order.", "gateway_error");
    }

    const rzOrder = await rzRes.json();
    return NextResponse.json({
      gateway: "razorpay",
      order_id: rzOrder.id,
      amount: amountInRupees,
      amount_paise: amountInPaise,
      currency: "INR",
      key_id: razorpayKeyId,
      doctor_name: doctors[0].full_name,
    });
  } catch (error: any) {
    console.error("POST /api/payments/create-order error:", error);
    return apiError(500, "Failed to create payment order.", "internal_error");
  }
}
