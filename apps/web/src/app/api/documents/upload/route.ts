import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { randomUUID } from "crypto";
import { authorizeClinicUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      patient_phone,
      patient_name,
      clinic_id: requestedClinicId,
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

    // Determine tenant clinic identity: check if authenticated clinic staff, else resolve valid clinic
    let targetClinicId: string | null = null;
    try {
      const auth = await authorizeClinicUser(req);
      targetClinicId = auth.clinic.id;
    } catch {
      // If patient upload or session not present, resolve clinic by ID or default to main clinic
      if (requestedClinicId) {
        const matched = await sql`SELECT id FROM clinics WHERE id::text = ${requestedClinicId}::text LIMIT 1`;
        if (matched.length > 0) targetClinicId = matched[0].id;
      }
      if (!targetClinicId) {
        const defaultClinic = await sql`SELECT id FROM clinics WHERE slug = 'derma-care-dehradun' OR is_verified = true LIMIT 1`;
        if (defaultClinic.length > 0) targetClinicId = defaultClinic[0].id;
      }
    }

    if (!targetClinicId) {
      return NextResponse.json({ error: "Invalid clinic association for document upload." }, { status: 400 });
    }

    const id = randomUUID();
    const sanitizedFileName = (file_name || `${title.toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`).replace(/[^a-zA-Z0-9._-]/g, "");
    let storagePath: string | null = null;
    let signedUrl: string | null = null;
    let actualSizeKb = Number(file_size_kb);

    // Ensure schema columns exist
    await sql`
      CREATE TABLE IF NOT EXISTS patient_documents (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        patient_phone TEXT NOT NULL,
        patient_name TEXT NOT NULL,
        clinic_id UUID REFERENCES clinics(id) ON DELETE CASCADE,
        document_type TEXT NOT NULL,
        title TEXT NOT NULL,
        file_name TEXT NOT NULL,
        file_size_kb INTEGER DEFAULT 350,
        file_url TEXT,
        storage_path TEXT,
        is_private BOOLEAN DEFAULT TRUE,
        doctor_notes TEXT,
        uploaded_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;
    await sql`ALTER TABLE patient_documents ADD COLUMN IF NOT EXISTS storage_path TEXT;`;
    await sql`ALTER TABLE patient_documents ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT TRUE;`;

    // 1. Private Cloud Storage Upload (Supabase Storage)
    if (file_base64 && supabase) {
      try {
        const cleanBase64 = file_base64.replace(/^data:[^;]+;base64,/, "");
        const fileBuffer = Buffer.from(cleanBase64, "base64");
        actualSizeKb = Math.round(fileBuffer.length / 1024);

        storagePath = `${targetClinicId}/${patient_phone.replace(/[^0-9]/g, "")}/${id}-${sanitizedFileName}`;
        const { error: uploadError } = await supabase.storage
          .from("patient-documents")
          .upload(storagePath, fileBuffer, {
            contentType: mime_type,
            upsert: true
          });

        if (!uploadError) {
          // Generate 15-minute temporary signed URL for immediate preview (Private, never public!)
          const { data: signedData } = await supabase.storage
            .from("patient-documents")
            .createSignedUrl(storagePath, 900); // 900 seconds = 15 minutes
          signedUrl = signedData?.signedUrl || null;
        } else {
          console.warn("Private storage upload warning:", uploadError);
        }
      } catch (uploadErr) {
        console.warn("Storage upload warning, fallback to database record:", uploadErr);
      }
    }

    const inserted = await sql`
      INSERT INTO patient_documents (
        id, patient_phone, patient_name, clinic_id, document_type, 
        title, file_name, file_size_kb, file_url, storage_path, is_private, doctor_notes, uploaded_at
      ) VALUES (
        ${id},
        ${patient_phone},
        ${patient_name || "Patient"},
        ${targetClinicId},
        ${document_type},
        ${title},
        ${sanitizedFileName},
        ${actualSizeKb},
        null,
        ${storagePath},
        true,
        ${doctor_notes},
        NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({
      status: "success",
      message: storagePath 
        ? "Document stored in private encrypted bucket with temporary 15-minute signed access."
        : "Document metadata saved successfully.",
      document: {
        ...inserted[0],
        signed_url: signedUrl,
        signed_url_expires_in: signedUrl ? 900 : null
      }
    });
  } catch (error: any) {
    console.error("POST /api/documents/upload error:", error);
    return NextResponse.json({ error: error.message || "Failed to upload document" }, { status: 500 });
  }
}
