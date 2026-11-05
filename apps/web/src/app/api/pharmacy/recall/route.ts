import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * CDSCO batch recall. Recalling a batch freezes dispensing immediately for
 * every item in the caller's clinic that matches the batch number.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    const body = await req.json();
    const { batch_number, is_recalled = true, recall_reason = null } = body;

    if (!batch_number) {
      return apiError(400, "batch_number is required.", "invalid_input");
    }

    const reason = String(recall_reason || "").trim();
    if (is_recalled && !reason) {
      return apiError(
        400,
        "recall_reason is required when recalling a batch.",
        "reason_required"
      );
    }

    const updated = await sql`
      UPDATE pharmacy_items
      SET
        is_recalled = ${Boolean(is_recalled)},
        recall_reason = ${is_recalled ? reason : null}
      WHERE lower(batch_number) = ${String(batch_number).toLowerCase().trim()}
        AND clinic_slug = ${clinicSlug}
      RETURNING id, brand_name, batch_number, current_stock, is_recalled, recall_reason;
    `;

    if (updated.length === 0) {
      return apiError(
        404,
        `Batch "${batch_number}" not found in your clinic's inventory.`,
        "batch_not_found"
      );
    }

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: is_recalled ? "pharmacy.recall.raise" : "pharmacy.recall.clear",
      entity: "pharmacy_item",
      entityId: String(updated[0].id),
      after: {
        batch_number,
        is_recalled: Boolean(is_recalled),
        recall_reason: is_recalled ? reason : null,
        affected_items: updated.length,
      },
      request: req,
    });

    return NextResponse.json({
      success: true,
      action: is_recalled ? "recalled_and_frozen" : "unfrozen",
      message: is_recalled
        ? `Batch ${batch_number} frozen across this clinic's dispensary counters. Dispensing is blocked per CDSCO protocol.`
        : `Batch ${batch_number} unfrozen for dispensing.`,
      affected_items: updated,
    });
  } catch (error: any) {
    console.error("POST /api/pharmacy/recall error:", error);
    return apiError(500, "Failed to process drug recall.", "internal_error");
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;

    const recalledItems = await sql`
      SELECT id, brand_name, generic_name, batch_number, expiry_date,
             current_stock, mrp, recall_reason, manufacturer
      FROM pharmacy_items
      WHERE is_recalled = true
        AND clinic_slug = ${clinicSlug}
      ORDER BY brand_name ASC;
    `;

    return NextResponse.json({
      recalled_batches: recalledItems,
      total_frozen_units: recalledItems.reduce(
        (acc: number, curr: any) => acc + Number(curr.current_stock || 0),
        0
      ),
    });
  } catch (error: any) {
    console.error("GET /api/pharmacy/recall error:", error);
    return apiError(500, "Failed to load recalled batches.", "internal_error");
  }
}
