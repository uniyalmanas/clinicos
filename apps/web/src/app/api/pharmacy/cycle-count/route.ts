import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Cycle Count Spot-Check Mode
 * Daily 5-item random physical verification to maintain GST book-vs-ground accuracy.
 * Flags statistical anomalies (>₹500 or >5 units) for manager review; ignores routine minor noise.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      item_id,
      physical_count,
      audited_by = "Head Pharmacist",
      audit_notes = ""
    } = body;

    if (!item_id || physical_count === undefined) {
      return NextResponse.json({ error: "item_id and physical_count are required" }, { status: 400 });
    }

    const itemRows = await sql`
      SELECT id, brand_name, batch_number, current_stock, purchase_price, mrp, selling_price
      FROM pharmacy_items
      WHERE id = ${item_id}
      LIMIT 1;
    `;

    if (itemRows.length === 0) {
      return NextResponse.json({ error: "Pharmacy item not found" }, { status: 404 });
    }

    const item = itemRows[0];
    const systemStock = Number(item.current_stock || 0);
    const groundStock = Number(physical_count);
    const unitVariance = groundStock - systemStock;
    const absUnitVariance = Math.abs(unitVariance);
    const financialVariance = Math.round(absUnitVariance * Number(item.purchase_price || item.mrp || 0) * 100) / 100;

    // Threshold-Based Variance Logic per Audit:
    // Only flag anomaly if financial variance > ₹500 OR unit variance > 5 units
    const isStatisticalAnomaly = financialVariance > 500 || absUnitVariance > 5;

    // Reconcile system count to match ground truth
    await sql`
      UPDATE pharmacy_items
      SET current_stock = ${groundStock}
      WHERE id = ${item_id};
    `;

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
        ? `⚠️ Statistical Anomaly Detected: Variance of ${absUnitVariance} units (₹${financialVariance.toLocaleString("en-IN")}) exceeds the ₹500/5-unit threshold. Manager audit required.`
        : `✓ Verified: Routine variance of ${absUnitVariance} units (₹${financialVariance}) within normal counting tolerance.`,
      audited_by,
      audited_at: new Date().toISOString()
    });
  } catch (error: any) {
    console.error("Cycle count error:", error);
    return NextResponse.json({ error: error.message || "Failed to process cycle count" }, { status: 500 });
  }
}
