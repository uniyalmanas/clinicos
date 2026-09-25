import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { supabase } from "@/lib/supabase";
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
      file_base64,
      mime_type = "application/pdf",
      doctor_notes = ""
    } = body;

    if (!patient_phone || !title) {
      return NextResponse.json({ error: "patient_phone and title are required" }, { status: 400 });
    }

    const id = randomUUID();
    const sanitizedFileName = (file_name || `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`).replace(/[^a-zA-Z0-9._-]/g, "");
    let fileUrl: string | null = null;
    let actualSizeKb = Number(file_size_kb);

    // 1. Real Cloud Storage Upload if binary payload provided
    if (file_base64) {
      try {
        const cleanBase64 = file_base64.replace(/^data:[^;]+;base64,/, "");
        const fileBuffer = Buffer.from(cleanBase64, "base64");
        actualSizeKb = Math.round(fileBuffer.length / 1024);

        if (supabase) {
          const storagePath = `${clinic_id}/${patient_phone.replace(/[^0-9]/g, "")}/${id}-${sanitizedFileName}`;
          const { error: uploadError } = await supabase.storage
            .from("patient-documents")
            .upload(storagePath, fileBuffer, {
              contentType: mime_type,
              upsert: true
            });

          if (!uploadError) {
            const { data: urlData } = supabase.storage
              .from("patient-documents")
              .getPublicUrl(storagePath);
            fileUrl = urlData?.publicUrl || null;
          }
        }
      } catch (uploadErr) {
        console.warn("Storage upload warning, fallback to database record:", uploadErr);
      }
    }

    // Ensure schema columns exist
    await sql`
      CREATE TABLE IF NOT EXISTS patient_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_phone TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        clinic_id UUID DEFAULT 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
        document_type TEXT NOT NULL,
        title TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size_kb INTEGER DEFAULT 350,
        file_url TEXT,
        doctor_notes TEXT,
        uploaded_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Ensure file_url column exists if table was created previously without it
    await sql`ALTER TABLE patient_documents ADD COLUMN IF NOT EXISTS file_url TEXT;`;

    const inserted = await sql`
      INSERT INTO patient_documents (
        id, patient_phone, patient_name, clinic_id, document_type, 
        title, file_name, file_size_kb, file_url, doctor_notes, uploaded_at
      ) VALUES (
        ${id},
        ${patient_phone},
        ${patient_name || "Patient"},
        ${clinic_id},
        ${document_type},
        ${title},
        ${sanitizedFileName},
        ${actualSizeKb},
        ${fileUrl},
        ${doctor_notes},
        NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({
      status: "success",
      message: fileUrl ? "Document uploaded to secure cloud storage." : "Document metadata saved successfully.",
      document: inserted[0]
    });
  } catch (error: any) {
    console.error("POST /api/documents/upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload document" }, { status: 500 });
  }
}
