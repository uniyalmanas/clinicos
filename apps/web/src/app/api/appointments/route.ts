import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorSlug = searchParams.get("doctor_slug");
    const clinicId = searchParams.get("clinic_id");
    const date = searchParams.get("date");
    const status = searchParams.get("status");

    let appointments;

    if (doctorSlug && date) {
      appointments = await sql`
        SELECT * FROM appointments 
        WHERE doctor_slug = ${doctorSlug} AND appointment_date = ${date}
        ORDER BY token_number ASC;
      `;
    } else if (doctorSlug) {
      appointments = await sql`
        SELECT * FROM appointments 
        WHERE doctor_slug = ${doctorSlug}
        ORDER BY appointment_date DESC, token_number ASC;
      `;
    } else if (clinicId) {
      appointments = await sql`
        SELECT * FROM appointments 
        WHERE clinic_id = ${clinicId}
        ORDER BY appointment_date DESC, token_number ASC;
      `;
    } else if (status) {
      appointments = await sql`
        SELECT * FROM appointments 
        WHERE status = ${status}
        ORDER BY appointment_date DESC, token_number ASC;
      `;
    } else {
      appointments = await sql`
        SELECT * FROM appointments 
        ORDER BY created_at DESC
        LIMIT 100;
      `;
    }

    return NextResponse.json(appointments);
  } catch (error: any) {
    console.error("GET /api/appointments error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch appointments" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      doctor_slug,
      patient_name,
      patient_phone,
      appointment_date,
      time_slot,
      fee_amount = 600,
      payment_mode = "upi",
      payment_status = "pending",
      symptoms_description = ""
    } = body;

    if (!doctor_slug || !patient_name || !patient_phone) {
      return NextResponse.json({ error: "Missing required appointment fields" }, { status: 400 });
    }

    // Lookup doctor to get clinic details and consultation fee
    const doctors = await sql`
      SELECT id, full_name, consultation_fee, followup_validity_days, clinic_id, clinic_name, clinic_slug 
      FROM doctors 
      WHERE slug = ${doctor_slug} 
      LIMIT 1;
    `;
    const doc = doctors[0];

    const todayStr = appointment_date || new Date().toISOString().split("T")[0];

    // Compute next token number for this doctor on this day
    const tokenQuery = await sql`
      SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token 
      FROM appointments 
      WHERE doctor_slug = ${doctor_slug} AND appointment_date = ${todayStr};
    `;
    const nextToken = tokenQuery[0]?.next_token || 1;

    // Check Marley 7-Day Fee Validity (Free follow-up if consulted within validity days)
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
    const finalFee = isFreeFollowup ? 0 : (fee_amount ?? doc?.consultation_fee ?? 600);

    const aptPrefix = doctor_slug.replace(/^dr-/, "").slice(0, 5).toUpperCase();
    const dateCompact = todayStr.replace(/-/g, "").slice(2);
    const randSuffix = Math.floor(1000 + Math.random() * 9000);
    const aptNumber = `APT-${dateCompact}-${aptPrefix}-${nextToken.toString().padStart(2, '0')}-${randSuffix}`;
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
        ${time_slot || `Live OPD Token #${nextToken}`},
        ${nextToken},
        'confirmed',
        ${finalFee},
        ${payment_status},
        ${payment_mode},
        ${symptoms_description},
        NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({
      status: "confirmed",
      is_free_followup: isFreeFollowup,
      appointment: inserted[0]
    });
  } catch (error: any) {
    console.error("POST /api/appointments error:", error);
    return NextResponse.json({ error: error.message || "Failed to create appointment" }, { status: 500 });
  }
}
