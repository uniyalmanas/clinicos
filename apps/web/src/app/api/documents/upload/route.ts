import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patient_phone,
      patient_name,
      clinic_id = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      document_type = "Blood Test",
      title,
      file_name,
      file_size_kb = 350,
      doctor_notes = ""
    } = body;

    if (!patient_phone || !title) {
      return NextResponse.json({ error: "patient_phone and title are required" }, { status: 400 });
    }

    const id = randomUUID();
    const fileName = file_name || `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`;

    const inserted = await sql`
      INSERT INTO patient_documents (
        id, patient_phone, patient_name, clinic_id, document_type, 
        title, file_name, file_size_kb, doctor_notes, uploaded_at
      ) VALUES (
        ${id},
        ${patient_phone},
        ${patient_name || "Patient"},
        ${clinic_id},
        ${document_type},
        ${title},
        ${fileName},
        ${Number(file_size_kb)},
        ${doctor_notes},
        NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({ status: "success", document: inserted[0] });
  } catch (error: any) {
    console.error("POST /api/documents/upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload document" }, { status: 500 });
  }
}
