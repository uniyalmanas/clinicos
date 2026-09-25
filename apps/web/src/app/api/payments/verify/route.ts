import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createHmac } from "crypto";
import { authorizeClinicUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      appointment_number,
      order_id,
      payment_id,
      signature,
      payment_mode = "online_upi"
    } = body;

    if (!appointment_number) {
      return NextResponse.json({ error: "appointment_number is required" }, { status: 400 });
    }

    // Verify signature or desk authorization
    const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;
    let isVerified = false;

    if (payment_mode === "cash" || payment_mode === "counter_soundbox" || payment_mode === "counter_cash") {
      // Counter collections require authorized staff / receptionist / doctor / admin session
      try {
        await authorizeClinicUser(req, {
          requiredRoles: ["owner", "clinic_admin", "staff", "receptionist", "doctor"]
        });
        isVerified = true;
      } catch (authErr: any) {
        return NextResponse.json(
          { error: authErr.message || "Counter payment confirmation requires authenticated clinic staff authorization." },
          { status: 401 }
        );
      }
    } else {
      // Online Gateway verification
      if (!razorpayKeySecret) {
        return NextResponse.json(
          { error: "Payment gateway secret (RAZORPAY_KEY_SECRET) is not configured on server." },
          { status: 500 }
        );
      }

      if (!order_id || !payment_id || !signature) {
        return NextResponse.json(
          { error: "order_id, payment_id, and signature are strictly required for online verification." },
          { status: 400 }
        );
      }

      const generatedSignature = createHmac("sha256", razorpayKeySecret)
        .update(`${order_id}|${payment_id}`)
        .digest("hex");
      isVerified = generatedSignature === signature;
    }

    if (!isVerified) {
      return NextResponse.json({ error: "Payment verification failed: cryptographic signature mismatch." }, { status: 400 });
    }

    // Update appointment in Supabase PostgreSQL
    const updated = await sql`
      UPDATE appointments 
      SET 
        payment_status = 'paid',
        payment_mode = ${payment_mode}
      WHERE appointment_number = ${appointment_number}
      RETURNING *;
    `;

    return NextResponse.json({
      status: "success",
      payment_status: "paid",
      transaction_id: payment_id || `txn_${Date.now()}`,
      appointment: updated[0] || null
    });
  } catch (error: any) {
    console.error("POST /api/payments/verify error:", error);
    return NextResponse.json({ error: error.message || "Failed to verify payment" }, { status: 500 });
  }
}
