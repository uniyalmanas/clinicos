import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sseBroker } from "@/lib/sse-broker";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { appointment_number } = body;

    if (!appointment_number) {
      return NextResponse.json({ error: "appointment_number is required" }, { status: 400 });
    }

    const updated = await sql`
      UPDATE appointments 
      SET status = 'completed' 
      WHERE appointment_number = ${appointment_number}
      RETURNING *;
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    sseBroker.broadcast("token_completed", {
      appointment_number: updated[0].appointment_number,
      token_number: updated[0].token_number
    });

    return NextResponse.json({
      status: "success",
      appointment: updated[0]
    });
  } catch (error: any) {
    console.error("POST /api/clinic/complete-token error:", error);
    return NextResponse.json({ error: error.message || "Failed to complete token" }, { status: 500 });
  }
}
