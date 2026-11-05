import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { randomUUID } from "crypto";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const MAX_FILE_SIZE_KB = 25000; // 25 MB
const ALLOWED_MIMETYPES = [
  "application/pdf",
  "image/jpeg",
  "image/png",
  "image/jpg",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
];

/**
 * Private patient-document upload, staff only.
 *
 * The clinic always comes from the caller's membership, a real file body is
 * required (no metadata-only rows with invented sizes), and the object is
 * stored in the private bucket. Database DDL is managed by migrations, never
 * run from a request handler.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;

    const body = await req.json().catch(() => ({}));
    const {
      patient_phone,
      patient_name,
      document_type = "Blood Test",
      title,
      file_name,
      file_base64,
      mime_type = "application/pdf",
      doctor_notes = null,
    } = body;

    if (!patient_phone || !patient_name || !title) {
      return apiError(
        400,
        "patient_phone, patient_name and title are required.",
        "missing_fields"
      );
    }

    if (!ALLOWED_MIMETYPES.includes(String(mime_type))) {
      return apiError(
        400,
        "Invalid file type. Allowed: PDF, JPEG, PNG, DOC, DOCX.",
        "invalid_file_type"
      );
    }

    if (!file_base64 || typeof file_base64 !== "string") {
      return apiError(
        400,
        "file_base64 is required — metadata-only document records are not accepted.",
        "missing_file"
      );
    }

    if (!supabase) {
      return apiError(
        503,
        "Private document storage is not configured on the server.",
        "storage_unavailable"
      );
    }

    const cleanBase64 = file_base64.replace(/^data:[^;]+;base64,/, "");
    const fileBuffer = Buffer.from(cleanBase64, "base64");
    if (fileBuffer.length === 0) {
      return apiError(400, "The uploaded file is empty.", "empty_file");
    }
    const actualSizeKb = Math.round(fileBuffer.length / 1024);
    if (actualSizeKb > MAX_FILE_SIZE_KB) {
      return apiError(
        400,
        `File too large. Maximum size is ${MAX_FILE_SIZE_KB} KB (25 MB).`,
        "file_too_large"
      );
    }

    const id = randomUUID();
    const sanitizedFileName = (
      file_name || `${String(title).toLowerCase().replace(/[^a-z0-9]/g, "_")}.pdf`
    ).replace(/[^a-zA-Z0-9._-]/g, "");

    const storagePath = `${clinicId}/${String(patient_phone).replace(/[^0-9]/g, "")}/${id}-${sanitizedFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("patient-documents")
      .upload(storagePath, fileBuffer, { contentType: mime_type, upsert: false });

    if (uploadError) {
      console.error("Private storage upload failed:", uploadError);
      return apiError(502, "Could not store the document. Please retry.", "storage_error");
    }

    const { data: signedData } = await supabase.storage
      .from("patient-documents")
      .createSignedUrl(storagePath, 900);

    const inserted = await sql`
      INSERT INTO patient_documents (
        id, patient_phone, patient_name, clinic_id, document_type,
        title, file_name, file_size_kb, file_url, storage_path, is_private, doctor_notes, uploaded_at
      ) VALUES (
        ${id},
        ${String(patient_phone)},
        ${String(patient_name)},
        ${String(clinicId)},
        ${String(document_type)},
        ${String(title)},
        ${sanitizedFileName},
        ${actualSizeKb},
        null,
        ${storagePath},
        true,
        ${doctor_notes ? String(doctor_notes).slice(0, 2000) : null},
        NOW()
      )
      RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "patient_document.upload",
      entity: "patient_document",
      entityId: id,
      after: { patient_phone, title, size_kb: actualSizeKb },
      request: req,
    });

    return NextResponse.json({
      status: "success",
      message: "Document stored in the private bucket with temporary signed access.",
      document: {
        ...inserted[0],
        signed_url: signedData?.signedUrl || null,
        signed_url_expires_in: signedData?.signedUrl ? 900 : null,
      },
    });
  } catch (error: any) {
    console.error("POST /api/documents/upload error:", error);
    return apiError(500, "Failed to upload document.", "internal_error");
  }
}
