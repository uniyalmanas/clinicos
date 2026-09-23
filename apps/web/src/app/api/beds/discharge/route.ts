import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bed_id, payment_mode = "upi", mark_as_maintenance = true } = body;

    if (!bed_id) {
      return NextResponse.json({ error: "bed_id is required" }, { status: 400 });
    }

    // Get bed and ward details
    const bedQuery = await sql`
      SELECT b.*, w.name as ward_name, w.hourly_rate, w.daily_rate 
      FROM clinic_beds b
      LEFT JOIN clinic_wards w ON w.id = b.ward_id
      WHERE b.id = ${bed_id}
      LIMIT 1;
    `;

    if (bedQuery.length === 0) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    const bed = bedQuery[0];
    const now = new Date();
    const admittedAt = bed.admission_timestamp ? new Date(bed.admission_timestamp) : new Date(Date.now() - 3600000);
    const diffHours = Math.max(0.5, Math.round(((now.getTime() - admittedAt.getTime()) / (1000 * 60 * 60)) * 10) / 10);

    const hourlyRate = Number(bed.hourly_rate || 150);
    const dailyRate = Number(bed.daily_rate || 1400);

    let roomCharges = 0;
    let billingBasis = "";

    if (diffHours <= 12) {
      roomCharges = Math.round(diffHours * hourlyRate);
      billingBasis = `Hourly (${diffHours}h @ ₹${hourlyRate}/h)`;
    } else {
      const days = Math.ceil(diffHours / 24);
      roomCharges = days * dailyRate;
      billingBasis = `Daily (${days} Day(s) @ ₹${dailyRate}/day)`;
    }

    const receiptNumber = `DISC-${bed.bed_number}-${Math.floor(100000 + Math.random() * 900000)}`;

    const nextStatus = mark_as_maintenance ? "maintenance" : "vacant";

    // Clear bed record
    await sql`
      UPDATE clinic_beds 
      SET 
        status = ${nextStatus},
        current_patient_name = NULL,
        current_patient_phone = NULL,
        assigned_doctor_name = NULL,
        admission_notes = NULL,
        admission_timestamp = NULL
      WHERE id = ${bed_id};
    `;

    const invoice = {
      receipt_number: receiptNumber,
      patient_name: bed.current_patient_name || "Patient",
      patient_phone: bed.current_patient_phone || "+91 98765 00000",
      assigned_doctor: bed.assigned_doctor_name || "Dr. Rahul Sharma",
      bed_number: bed.bed_number,
      ward_name: bed.ward_name || "General Ward",
      admission_time: admittedAt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      discharge_time: now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" }),
      total_stay_hours: diffHours,
      billing_basis: billingBasis,
      room_charges: roomCharges,
      payment_mode: payment_mode,
      payment_status: "settled"
    };

    return NextResponse.json({ status: "success", invoice });
  } catch (error: any) {
    console.error("POST /api/beds/discharge error:", error);
    return NextResponse.json({ error: error.message || "Failed to discharge patient" }, { status: 500 });
  }
}
