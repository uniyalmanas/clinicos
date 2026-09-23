import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bed_id,
      patient_name,
      patient_phone,
      assigned_doctor_name = "Dr. Rahul Sharma",
      admission_notes = "Clinical observation and monitoring"
    } = body;

    if (!bed_id || !patient_name) {
      return NextResponse.json({ error: "bed_id and patient_name are required" }, { status: 400 });
    }

    const updated = await sql`
      UPDATE clinic_beds 
      SET 
        status = 'occupied',
        current_patient_name = ${patient_name},
        current_patient_phone = ${patient_phone || null},
        assigned_doctor_name = ${assigned_doctor_name},
        admission_notes = ${admission_notes},
        admission_timestamp = NOW()
      WHERE id = ${bed_id}
      RETURNING *;
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    return NextResponse.json({ status: "success", bed: updated[0] });
  } catch (error: any) {
    console.error("POST /api/beds/admit error:", error);
    return NextResponse.json({ error: error.message || "Failed to admit patient" }, { status: 500 });
  }
}
