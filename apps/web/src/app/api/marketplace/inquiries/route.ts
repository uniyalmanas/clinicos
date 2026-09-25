import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      item_type = "medicine",
      item_name,
      patient_name,
      patient_phone,
      patient_address,
      quantity = 1,
      notes = ""
    } = body;

    if (!patient_name || !patient_phone) {
      return NextResponse.json({ error: "patient_name and patient_phone are required" }, { status: 400 });
    }

    await sql`
      CREATE TABLE IF NOT EXISTS marketplace_inquiries (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        item_type TEXT NOT NULL,
        item_name TEXT,
        patient_name TEXT NOT NULL,
        patient_phone TEXT NOT NULL,
        patient_address TEXT,
        quantity INTEGER DEFAULT 1,
        notes TEXT,
        status TEXT DEFAULT 'PENDING',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    const id = randomUUID();
    await sql`
      INSERT INTO marketplace_inquiries (
        id, item_type, item_name, patient_name, patient_phone,
        patient_address, quantity, notes, status, created_at
      ) VALUES (
        ${id}, ${item_type}, ${item_name || ''}, ${patient_name},
        ${patient_phone}, ${patient_address || ''}, ${Number(quantity) || 1},
        ${notes}, 'PENDING', NOW()
      );
    `;

    return NextResponse.json({
      success: true,
      message: "Order inquiry received! Our pharmacy delivery desk will contact you via WhatsApp.",
      inquiry_id: id
    });
  } catch (error: any) {
    console.error("Marketplace inquiry error:", error);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
