import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patient_name,
      patient_phone,
      fee_amount = 600,
      payment_mode = "upi",
      doctor_slug = "dr-rahul-sharma",
      clinic_slug = "derma-care-dehradun",
      symptoms_description = "Walk-in consultation"
    } = body;

    if (!patient_name || !patient_phone) {
      return NextResponse.json({ error: "Patient name and phone are required for walk-in" }, { status: 400 });
    }

    // Look up doctor
    const doctors = await sql`
      SELECT id, full_name, consultation_fee, followup_validity_days, clinic_id, clinic_name, clinic_slug 
      FROM doctors 
      WHERE slug = ${doctor_slug} 
      LIMIT 1;
    `;
    const doc = doctors[0];

    const todayStr = new Date().toISOString().split("T")[0];

    // Compute next token
    const tokenQuery = await sql`
      SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token 
      FROM appointments 
      WHERE doctor_slug = ${doctor_slug} AND appointment_date = ${todayStr};
    `;
    const nextToken = tokenQuery[0]?.next_token || 1;

    // Marley 7-day Fee Validity Check
    const validityDays = doc?.followup_validity_days || 7;
    const pastConsultation = await sql`
      SELECT id, created_at FROM appointments
      WHERE doctor_slug = ${doctor_slug} 
        AND patient_phone = ${patient_phone}
        AND status = 'completed'
        AND created_at >= NOW() - INTERVAL '1 day' * ${validityDays}
      LIMIT 1;
    `;

    const isFreeFollowup = pastConsultation.length > 0;
    const finalFee = isFreeFollowup ? 0 : fee_amount;

    const dateCompact = todayStr.replace(/-/g, "").slice(2);
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const aptNumber = `APT-${dateCompact}-WLK-${nextToken.toString().padStart(2, '0')}-${randSuffix}`;
    const id = randomUUID();

    const inserted = await sql`
      INSERT INTO appointments (
        id, appointment_number, doctor_slug, clinic_id, doctor_name, 
        clinic_name, patient_name, patient_phone, appointment_date, 
        time_slot, token_number, status, fee_amount, payment_status, 
        payment_mode, symptoms_description, created_at
      ) VALUES (
        ${id},
        ${aptNumber},
        ${doctor_slug},
        ${doc?.clinic_id || 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa'},
        ${doc?.full_name || 'Dr. Rahul Sharma'},
        ${doc?.clinic_name || 'Derma Care Skin & Laser Centre'},
        ${patient_name},
        ${patient_phone},
        ${todayStr},
        'Immediate Walk-In',
        ${nextToken},
        'waiting',
        ${finalFee},
        'paid',
        ${payment_mode},
        ${symptoms_description},
        NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({
      status: "admitted",
      is_free_followup: isFreeFollowup,
      appointment: {
        appointment_number: inserted[0].appointment_number,
        token_number: inserted[0].token_number,
        patient_name: inserted[0].patient_name,
        patient_phone: inserted[0].patient_phone,
        status: "waiting",
        time_slot: inserted[0].time_slot,
        fee_amount: Number(inserted[0].fee_amount),
        payment_status: inserted[0].payment_status,
        payment_mode: inserted[0].payment_mode,
        is_walk_in: true
      }
    });
  } catch (error: any) {
    console.error("POST /api/clinic/walk-in error:", error);
    return NextResponse.json({ error: error.message || "Failed to admit walk-in" }, { status: 500 });
  }
}
