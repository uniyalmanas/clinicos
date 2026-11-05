import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { findClinicLabOrder } from "@/lib/lab-scope";

export const dynamic = "force-dynamic";

/**
 * Smart sample accessioning and quality gate.
 *
 * Verifies the physical barcode against the digital requisition and rejects
 * compromised specimens. The order must belong to the caller's clinic through
 * its originating appointment or prescription.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINICAL_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const body = await req.json();
    const {
      order_id,
      action = "accession",
      scanned_barcode,
      accessioner_name,
      rejection_reason,
      rejection_notes,
    } = body;

    if (!order_id) {
      return apiError(400, "order_id is required.", "invalid_input");
    }

    const order = await findClinicLabOrder(clinicId, order_id);
    if (!order) {
      return apiError(404, "Lab order not found in your clinic.", "order_not_found");
    }

    const accessioner = String(accessioner_name || auth.auth.user.full_name);

    if (action === "accession") {
      if (
        scanned_barcode &&
        order.sample_barcode &&
        String(scanned_barcode) !== String(order.sample_barcode)
      ) {
        return apiError(
          422,
          `Scanned barcode ${scanned_barcode} does not match the collected sample ${order.sample_barcode}.`,
          "barcode_mismatch"
        );
      }

      const updated = await sql`
        UPDATE diagnostic_lab_orders
        SET
          status = 'sample_accessioned',
          sample_accessioned_at = NOW(),
          sample_accessioner_name = ${accessioner},
          sample_rejected = false,
          sample_rejection_reason = NULL,
          updated_at = NOW()
        WHERE id = ${String(order.id)}
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "lab.sample.accession",
        entity: "diagnostic_lab_order",
        entityId: String(order.id),
        after: { accessioner, barcode: order.sample_barcode },
        request: req,
      });

      return NextResponse.json({
        success: true,
        message: `Sample ${order.sample_barcode || order.order_number} accessioned by ${accessioner}.`,
        order: updated[0],
      });
    }

    if (action === "reject") {
      const reason = String(rejection_reason || "").trim();
      if (!reason) {
        return apiError(
          400,
          "rejection_reason is required when rejecting a specimen.",
          "reason_required"
        );
      }

      const updated = await sql`
        UPDATE diagnostic_lab_orders
        SET
          status = 'ordered',
          sample_rejected = true,
          sample_rejection_reason = ${reason},
          sample_collected_at = NULL,
          sample_accessioned_at = NULL,
          pathologist_notes = ${`Specimen rejected [${reason}]: ${
            rejection_notes || "Compromised during pre-analytical phase. Redraw required."
          }`},
          updated_at = NOW()
        WHERE id = ${String(order.id)}
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "lab.sample.reject",
        entity: "diagnostic_lab_order",
        entityId: String(order.id),
        after: { rejection_reason: reason, rejection_notes: rejection_notes || null },
        request: req,
      });

      return NextResponse.json({
        success: true,
        rejected: true,
        message: `Specimen rejected due to ${reason}. Order reset to 'ordered' for redraw.`,
        order: updated[0],
      });
    }

    return apiError(400, "Invalid accession action.", "invalid_action");
  } catch (error: any) {
    console.error("Accession error:", error);
    return apiError(500, "Failed to process sample accessioning.", "internal_error");
  }
}
