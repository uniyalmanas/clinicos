import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { sseBroker } from "@/lib/sse-broker";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const target = body.appointment_number || body.token_id || body.id || body.appointment_id;
    const { chamber_name = "Chamber 1" } = body;

    if (!target) {
      return NextResponse.json({ error: "appointment_number or id is required" }, { status: 400 });
    }

    // Get current appointment details by appointment_number or id
    const apts = await sql`
      SELECT * FROM appointments 
      WHERE appointment_number = ${target} OR id::text = ${target}
      LIMIT 1;
    `;

    if (apts.length === 0) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const currentApt = apts[0];

    // Mark previous 'in_consultation' for the same doctor/clinic as 'completed'
    await sql`
      UPDATE appointments 
      SET status = 'completed' 
      WHERE doctor_slug = ${currentApt.doctor_slug} 
        AND status = 'in_consultation' 
        AND id != ${currentApt.id};
    `;

    // Mark target appointment as 'in_consultation'
    const updated = await sql`
      UPDATE appointments 
      SET status = 'in_consultation' 
      WHERE id = ${currentApt.id}
      RETURNING *;
    `;

    // Broadcast to SSE clients (Smart TV waiting room, receptionist desk)
    sseBroker.broadcast("token_called", {
      appointment_number: currentApt.appointment_number,
      token_number: currentApt.token_number,
      patient_name: currentApt.patient_name,
      doctor_name: currentApt.doctor_name,
      chamber_name: chamber_name,
      trigger_chime: true
    });

    return NextResponse.json({
      status: "success",
      appointment: updated[0]
    });
  } catch (error: any) {
    console.error("POST /api/clinic/call-token error:", error);
    return NextResponse.json({ error: error.message || "Failed to call token" }, { status: 500 });
  }
}
