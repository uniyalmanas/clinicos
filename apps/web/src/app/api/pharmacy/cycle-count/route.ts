import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Cycle-count spot check.
 *
 * Reconciles the system count to the physical count for one item in the
 * caller's clinic. The auditor is the authenticated user — not a default
 * "Head Pharmacist".
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    const body = await req.json();
    const { item_id, physical_count, audit_notes = null } = body;

    if (!item_id || physical_count === undefined || physical_count === null) {
      return apiError(
        400,
        "item_id and physical_count are required.",
        "invalid_input"
      );
    }

    const groundStock = Number(physical_count);
    if (!Number.isInteger(groundStock) || groundStock < 0) {
      return apiError(
        400,
        "physical_count must be a non-negative whole number.",
        "invalid_count"
      );
    }

    const itemRows = await sql`
      SELECT id, brand_name, batch_number, current_stock, purchase_price, mrp, selling_price
      FROM pharmacy_items
      WHERE id::text = ${String(item_id)}
        AND clinic_slug = ${clinicSlug}
      LIMIT 1;
    `;

    if (itemRows.length === 0) {
      return apiError(404, "Pharmacy item not found in your clinic.", "item_not_found");
    }

    const item = itemRows[0];
    const systemStock = Number(item.current_stock || 0);
    const unitVariance = groundStock - systemStock;
    const absUnitVariance = Math.abs(unitVariance);
    const unitCost = Number(
      item.purchase_price ?? item.mrp ?? item.selling_price ?? 0
    );
    const financialVariance = Math.round(absUnitVariance * unitCost * 100) / 100;

    // Threshold-based variance logic: flag only material discrepancies.
    const isStatisticalAnomaly = financialVariance > 500 || absUnitVariance > 5;

    const updated = await sql`
      UPDATE pharmacy_items
      SET current_stock = ${groundStock}
      WHERE id::text = ${String(item.id)}
        AND clinic_slug = ${clinicSlug}
      RETURNING id, brand_name, batch_number, current_stock, reorder_level;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "pharmacy.cycle_count",
      entity: "pharmacy_item",
      entityId: String(item.id),
      before: { current_stock: systemStock },
      after: {
        current_stock: groundStock,
        unit_variance: unitVariance,
        financial_variance: financialVariance,
        flagged: isStatisticalAnomaly,
        notes: audit_notes,
      },
      request: req,
    });

    return NextResponse.json({
      success: true,
      item_name: item.brand_name,
      batch_number: item.batch_number,
      system_stock_before: systemStock,
      ground_stock_after: groundStock,
      unit_variance: unitVariance,
      financial_variance_inr: financialVariance,
      is_statistical_anomaly: isStatisticalAnomaly,
      anomaly_status: isStatisticalAnomaly
        ? "FLAGGED_FOR_MANAGER_REVIEW"
        : "ROUTINE_ACCEPTABLE_VARIANCE",
      audit_summary: isStatisticalAnomaly
        ? `Statistical anomaly: variance of ${absUnitVariance} units (₹${financialVariance.toLocaleString(
            "en-IN"
          )}) exceeds the ₹500 / 5-unit threshold. Manager audit required.`
        : `Verified: variance of ${absUnitVariance} units (₹${financialVariance}) within normal counting tolerance.`,
      audited_by: auth.auth.user.full_name,
      audited_at: new Date().toISOString(),
      item: updated[0],
    });
  } catch (error: any) {
    console.error("POST /api/pharmacy/cycle-count error:", error);
    return apiError(500, "Failed to process cycle count.", "internal_error");
  }
}
