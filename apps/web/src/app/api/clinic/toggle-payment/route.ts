import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const target = body.appointment_number || body.token_id || body.id || body.appointment_id;
    const { payment_status, payment_mode } = body;

    if (!target) {
      return NextResponse.json({ error: "appointment_number or id is required" }, { status: 400 });
    }

    let updated;
    if (payment_status && payment_mode) {
      updated = await sql`
        UPDATE appointments 
        SET payment_status = ${payment_status}, payment_mode = ${payment_mode}
        WHERE appointment_number = ${target} OR id::text = ${target}
        RETURNING *;
      `;
    } else if (payment_status) {
      updated = await sql`
        UPDATE appointments 
        SET payment_status = ${payment_status}
        WHERE appointment_number = ${target} OR id::text = ${target}
        RETURNING *;
      `;
    } else {
      // Toggle logic
      const current = await sql`
        SELECT payment_status FROM appointments 
        WHERE appointment_number = ${target} OR id::text = ${target}
        LIMIT 1;
      `;
      const nextStatus = current[0]?.payment_status === "paid" ? "pending" : "paid";
      updated = await sql`
        UPDATE appointments 
        SET payment_status = ${nextStatus}
        WHERE appointment_number = ${target} OR id::text = ${target}
        RETURNING *;
      `;
    }

    return NextResponse.json({ status: "success", appointment: updated[0] });
  } catch (error: any) {
    console.error("POST /api/clinic/toggle-payment error:", error);
    return NextResponse.json({ error: error.message || "Failed to update payment" }, { status: 500 });
  }
}
