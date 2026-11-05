import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { supabase } from "@/lib/supabase";
import { guard, guardPatient, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Signed URLs are short-lived: a leaked link expires quickly. */
const SIGNED_URL_TTL_SECONDS = 300;

/**
 * Authorized access to a stored patient document.
 *
 * Allowed callers:
 *   • a verified patient session for the document's own phone number, or
 *   • an authenticated clinic member of the document's clinic (or super admin).
 *
 * Everything else is denied. A bare Authorization header is never sufficient.
 */
export async function GET(req: NextRequest) {
  try {
    const documentId = new URL(req.url).searchParams.get("id");
    if (!documentId) {
      return apiError(400, "Document ID is required.", "missing_document_id");
    }

    const docRows = await sql`
      SELECT id, clinic_id, patient_phone, patient_name, title, document_type,
             file_name, file_size_kb, storage_path
      FROM patient_documents
      WHERE id::text = ${documentId}::text
      LIMIT 1;
    `;
    if (docRows.length === 0) {
      return apiError(404, "Document not found.", "document_not_found");
    }
    const doc = docRows[0];
    const docPhone = String(doc.patient_phone || "").replace(/[^0-9]/g, "").slice(-10);

    let actorId: string | null = null;
    let actorRole = "patient";
    let clinicId: string | null = null;

    const patientAuth = await guardPatient(req);
    if (patientAuth.ok) {
      if (!docPhone || patientAuth.auth.phone !== docPhone) {
        return apiError(403, "You can only access your own documents.", "patient_scope_denied");
      }
    } else {
      const staff = await guard(req, { roles: CLINIC_ROLES });
      if (!staff.ok) return staff.response;

      actorId = staff.auth.user.id;
      actorRole = staff.auth.role;
      clinicId = staff.auth.clinic?.id ?? null;

      if (!staff.auth.isSuperAdmin) {
        if (!clinicId || String(clinicId) !== String(doc.clinic_id)) {
          return apiError(403, "This document belongs to another clinic.", "cross_tenant_denied");
        }
      }
    }

    if (!supabase) {
      return apiError(503, "Document storage is not configured.", "storage_unavailable");
    }

    const storagePath =
      doc.storage_path ||
      `${doc.clinic_id}/${docPhone}/${doc.id}-${doc.file_name}`;

    const { data, error } = await supabase.storage
      .from("patient-documents")
      .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

    if (error || !data?.signedUrl) {
      console.warn("Signed URL generation failed:", error);
      return apiError(404, "The document file is not available.", "file_missing");
    }

    await logAudit({
      actorId,
      actorRole,
      clinicId: clinicId ?? doc.clinic_id,
      action: "patient_document.view",
      entity: "patient_document",
      entityId: String(doc.id),
      request: req,
    });

    return NextResponse.json({
      success: true,
      signed_url: data.signedUrl,
      expires_in: SIGNED_URL_TTL_SECONDS,
      document: {
        id: doc.id,
        title: doc.title,
        document_type: doc.document_type,
        file_name: doc.file_name,
        file_size_kb: doc.file_size_kb,
        patient_name: doc.patient_name,
      },
    });
  } catch (error: any) {
    console.error("GET /api/documents/signed-url error:", error);
    return apiError(500, "Failed to retrieve the document.", "internal_error");
  }
}
