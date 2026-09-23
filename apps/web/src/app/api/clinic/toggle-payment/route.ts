import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appointment_number, payment_status, payment_mode } = body;

    if (!appointment_number) {
      return NextResponse.json({ error: "appointment_number is required" }, { status: 400 });
    }

    let updated;
    if (payment_status && payment_mode) {
      updated = await sql`
        UPDATE appointments 
        SET payment_status = ${payment_status}, payment_mode = ${payment_mode}
        WHERE appointment_number = ${appointment_number}
        RETURNING *;
      `;
    } else if (payment_status) {
      updated = await sql`
        UPDATE appointments 
        SET payment_status = ${payment_status}
        WHERE appointment_number = ${appointment_number}
        RETURNING *;
      `;
    } else {
      // Toggle logic
      const current = await sql`
        SELECT payment_status FROM appointments WHERE appointment_number = ${appointment_number};
      `;
      const nextStatus = current[0]?.payment_status === "paid" ? "pending" : "paid";
      updated = await sql`
        UPDATE appointments 
        SET payment_status = ${nextStatus}
        WHERE appointment_number = ${appointment_number}
        RETURNING *;
      `;
    }

    return NextResponse.json({ status: "success", appointment: updated[0] });
  } catch (error: any) {
    console.error("POST /api/clinic/toggle-payment error:", error);
    return NextResponse.json({ error: error.message || "Failed to update payment" }, { status: 500 });
  }
}
