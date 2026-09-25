import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      doctor_slug,
      patient_name,
      patient_phone,
      appointment_date,
      time_slot,
      consultation_type = "clinic_visit",
      symptoms_description = "",
      payment_status = "pending",
      payment_mode = "cash"
    } = body;

    if (!doctor_slug || !patient_name || !patient_phone) {
      return NextResponse.json({ error: "Doctor, patient name, and phone are required" }, { status: 400 });
    }

    // Get doctor record
    const doctors = await sql`
      SELECT id, full_name, specialization, consultation_fee, followup_validity_days, clinic_id, clinic_name, clinic_slug 
      FROM doctors 
      WHERE slug = ${doctor_slug} 
      LIMIT 1;
    `;

    const doc = doctors[0];
    const todayStr = appointment_date || new Date().toISOString().split("T")[0];

    const validityDays = doc?.followup_validity_days || 7;
    let isFreeFollowup = false;

    // Atomic Token Generation with PostgreSQL Advisory Lock (Zero Concurrency Collision)
    const inserted = await sql.begin(async (tx) => {
      await tx`SELECT pg_advisory_xact_lock(hashtext(${doctor_slug} || ':' || ${todayStr}));`;

      const tokenQuery = await tx`
        SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token 
        FROM appointments 
        WHERE doctor_slug = ${doctor_slug} AND appointment_date = ${todayStr};
      `;
      const nextToken = Number(tokenQuery[0]?.next_token || 1);

      // Check Marley 7-Day Fee Validity
      const pastConsultations = await tx`
        SELECT id, created_at FROM appointments
        WHERE doctor_slug = ${doctor_slug} 
          AND patient_phone = ${patient_phone}
          AND status = 'completed'
          AND created_at >= NOW() - INTERVAL '1 day' * ${validityDays}
        ORDER BY created_at DESC
        LIMIT 1;
      `;

      isFreeFollowup = pastConsultations.length > 0;
      const finalFee = isFreeFollowup ? 0 : (doc?.consultation_fee ?? 600);

      const aptPrefix = doctor_slug.replace(/^dr-/, "").slice(0, 5).toUpperCase();
      const dateCompact = todayStr.replace(/-/g, "").slice(2);
      const randSuffix = Math.floor(1000 + Math.random() * 9000);
      const aptNumber = `APT-${dateCompact}-${aptPrefix}-${nextToken.toString().padStart(2, '0')}-${randSuffix}`;
      const id = randomUUID();

      const slotLabel = time_slot || `Live OPD Token #${nextToken}`;

      return await tx`
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
          ${slotLabel},
          ${nextToken},
          'confirmed',
          ${finalFee},
          ${payment_status || 'pending'},
          ${payment_mode || 'cash'},
          ${symptoms_description},
          NOW()
        )
        RETURNING *;
      `;
    });

    return NextResponse.json({
      status: "confirmed",
      is_free_followup: isFreeFollowup,
      followup_note: isFreeFollowup ? `Marley Protocol: 0 Fee applied (Valid Follow-up within ${validityDays} days)` : null,
      appointment: inserted[0]
    });
  } catch (error: any) {
    console.error("POST /api/appointments/book error:", error);
    return NextResponse.json({ error: error.message || "Failed to book appointment" }, { status: 500 });
  }
}
