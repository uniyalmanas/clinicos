import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clinic_name,
      contact_person,
      phone,
      email,
      city = "Dehradun",
      specialization = "General / Polyclinic",
      doctor_count = 1
    } = body;

    if (!clinic_name || !phone) {
      return NextResponse.json({ error: "clinic_name and phone are required" }, { status: 400 });
    }

    await sql`
      CREATE TABLE IF NOT EXISTS marketplace_partners (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_name TEXT NOT NULL,
        contact_person TEXT,
        phone TEXT NOT NULL,
        email TEXT,
        city TEXT DEFAULT 'Dehradun',
        specialization TEXT,
        doctor_count INTEGER DEFAULT 1,
        status TEXT DEFAULT 'NEW',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const id = randomUUID();
    await sql`
      INSERT INTO marketplace_partners (
        id, clinic_name, contact_person, phone, email,
        city, specialization, doctor_count, status, created_at
      ) VALUES (
        ${id}, ${clinic_name}, ${contact_person || ''}, ${phone},
        ${email || ''}, ${city}, ${specialization}, ${Number(doctor_count) || 1},
        'NEW', NOW()
      );
    `;

    return NextResponse.json({
      success: true,
      message: "Partner inquiry registered! Our onboarding specialist will reach out within 2 hours.",
      partner_id: id
    });
  } catch (error: any) {
    console.error("Marketplace partner error:", error);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
