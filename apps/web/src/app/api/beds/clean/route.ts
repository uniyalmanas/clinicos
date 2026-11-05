import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Dual-verified sanitization workflow.
 *
 *   1. Housekeeping logs the disinfection method and time.
 *   2. A nurse performs the QA check and signs it electronically.
 *
 * The bed stays VACANT_DIRTY until both logs exist. There is no manual override.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINICAL_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;
    const actorName = auth.auth.user.full_name;

    const body = await req.json();
    const {
      bed_id,
      action = "housekeeping_log",
      hk_staff_name,
      disinfection_method,
      nurse_qa_name,
      nurse_qa_esign,
    } = body;

    if (!bed_id) {
      return apiError(400, "bed_id is required.", "invalid_input");
    }

    const bedQuery = await sql`
      SELECT * FROM clinic_beds
      WHERE id = ${String(bed_id)}
        AND clinic_slug = ${clinicSlug}
      LIMIT 1;
    `;
    if (bedQuery.length === 0) {
      return apiError(404, "Bed not found in your clinic.", "bed_not_found");
    }
    const bed = bedQuery[0];
    const now = new Date();

    if (action === "housekeeping_log" || action === "hk_clean") {
      const staffName = String(hk_staff_name || actorName).trim();
      const method = String(disinfection_method || "").trim();
      if (!method) {
        return apiError(
          400,
          "disinfection_method is required to record terminal cleaning.",
          "method_required"
        );
      }

      await sql`
        INSERT INTO bed_sanitization_logs (
          id, bed_id, bed_number, hk_staff_name, disinfection_method, hk_completed_at, status
        ) VALUES (
          ${randomUUID()},
          ${bed.id},
          ${bed.bed_number},
          ${staffName},
          ${method},
          ${now},
          'pending_qa'
        );
      `;

      const updated = await sql`
        UPDATE clinic_beds
        SET
          sanitization_hk_logged = true,
          sanitization_hk_at = ${now},
          sanitization_hk_by = ${staffName}
        WHERE id = ${String(bed_id)}
          AND clinic_slug = ${clinicSlug}
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "bed.sanitization.housekeeping",
        entity: "clinic_bed",
        entityId: String(bed.id),
        after: { method, staff: staffName },
        request: req,
      });

      return NextResponse.json({
        success: true,
        action: "housekeeping_logged",
        message: `Housekeeping disinfection logged for bed ${bed.bed_number}. Awaiting nurse QA.`,
        bed: updated[0],
      });
    }

    if (action === "nurse_qa" || action === "qa_verify") {
      if (!bed.sanitization_hk_logged) {
        return apiError(
          422,
          "Housekeeping disinfection must be logged before nurse QA.",
          "hk_log_missing"
        );
      }

      const qaName = String(nurse_qa_name || actorName).trim();
      const esign = String(nurse_qa_esign || "").trim();
      if (!esign) {
        return apiError(
          400,
          "nurse_qa_esign is required for the QA sign-off.",
          "esign_required"
        );
      }

      await sql`
        UPDATE bed_sanitization_logs
        SET
          nurse_qa_name = ${qaName},
          nurse_qa_esign = ${esign},
          nurse_verified_at = ${now},
          status = 'verified_clean'
        WHERE bed_id = ${String(bed.id)}
          AND status = 'pending_qa';
      `;

      const updated = await sql`
        UPDATE clinic_beds
        SET
          status = 'VACANT_CLEAN',
          sanitization_nurse_qa = true,
          sanitization_nurse_at = ${now},
          sanitization_nurse_by = ${qaName}
        WHERE id = ${String(bed_id)}
          AND clinic_slug = ${clinicSlug}
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "bed.sanitization.qa",
        entity: "clinic_bed",
        entityId: String(bed.id),
        after: { qa_name: qaName },
        request: req,
      });

      return NextResponse.json({
        success: true,
        action: "dual_verification_passed",
        message: `Dual sanitization verification passed. Bed ${bed.bed_number} is now VACANT_CLEAN.`,
        bed: updated[0],
      });
    }

    return apiError(400, "Invalid sanitization action.", "invalid_action");
  } catch (error: any) {
    console.error("POST /api/beds/clean error:", error);
    return apiError(500, "Failed to process sanitization.", "internal_error");
  }
}
