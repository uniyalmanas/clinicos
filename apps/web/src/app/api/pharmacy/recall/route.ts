import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * CDSCO Drug Recall Module
 * Hard-blocks dispensing across all counters instantly for recalled batches.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { batch_number, is_recalled = true, recall_reason, clinic_slug = "derma-care-dehradun" } = body;

    if (!batch_number) {
      return NextResponse.json({ error: "batch_number is required" }, { status: 400 });
    }

    const updated = await sql`
      UPDATE pharmacy_items
      SET 
        is_recalled = ${Boolean(is_recalled)},
        recall_reason = ${is_recalled ? (recall_reason || "CDSCO Regulatory Quality Alert") : null}
      WHERE lower(batch_number) = ${batch_number.toLowerCase().trim()}
      RETURNING id, brand_name, batch_number, current_stock, is_recalled, recall_reason;
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: `Batch "${batch_number}" not found in pharmacy inventory` }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      action: is_recalled ? "recalled_and_frozen" : "unfrozen",
      message: is_recalled
        ? `Batch ${batch_number} has been frozen across all dispensary counters. Immediate dispensing hard-blocked per CDSCO protocol.`
        : `Batch ${batch_number} has been unfrozen for dispensing.`,
      affected_items: updated
    });
  } catch (error: any) {
    console.error("CDSCO recall API error:", error);
    return NextResponse.json({ error: error.message || "Failed to process drug recall" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const recalledItems = await sql`
      SELECT id, brand_name, generic_name, batch_number, expiry_date, current_stock, mrp, recall_reason, manufacturer
      FROM pharmacy_items
      WHERE is_recalled = true
      ORDER BY brand_name ASC;
    `;

    return NextResponse.json({
      recalled_batches: recalledItems,
      total_frozen_units: recalledItems.reduce((acc, curr) => acc + Number(curr.current_stock || 0), 0)
    });
  } catch (error: any) {
    console.error("GET recalled items error:", error);
    return NextResponse.json({ error: error.message || "Failed to load recalled batches" }, { status: 500 });
  }
}
