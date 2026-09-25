import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * Return-to-Supplier Workflow Engine
 * Generates an official Return Challan / Debit Note before distributor credit note window closes.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clinic_slug = "derma-care-dehradun",
      item_id,
      batch_number,
      brand_name,
      supplier_name = "Doon Medical Distributors",
      quantity,
      unit_purchase_price,
      reason = "near_expiry",
      notes = ""
    } = body;

    const returnQty = Number(quantity);
    if (!returnQty || returnQty <= 0) {
      return NextResponse.json({ error: "A valid positive return quantity is required" }, { status: 400 });
    }

    if (!batch_number || !brand_name) {
      return NextResponse.json({ error: "batch_number and brand_name are required" }, { status: 400 });
    }

    // Verify stock availability
    if (item_id) {
      const existing = await sql`
        SELECT current_stock, purchase_price, brand_name, supplier_name 
        FROM pharmacy_items 
        WHERE id = ${item_id}
        LIMIT 1;
      `;
      if (existing.length === 0 || Number(existing[0].current_stock) < returnQty) {
        return NextResponse.json({
          error: `Cannot return ${returnQty} units: Current on-hand stock is only ${existing[0]?.current_stock || 0}`
        }, { status: 400 });
      }

      // Deduct returned units from active inventory
      await sql`
        UPDATE pharmacy_items 
        SET current_stock = GREATEST(0, current_stock - ${returnQty})
        WHERE id = ${item_id};
      `;
    }

    const price = Number(unit_purchase_price || 0);
    const totalDebit = Math.round(returnQty * price * 100) / 100;
    const challanNum = `RET-CHALLAN-${Date.now().toString().slice(-6)}`;
    const id = randomUUID();

    const inserted = await sql`
      INSERT INTO pharmacy_return_challans (
        id, challan_number, clinic_slug, supplier_name, batch_number,
        brand_name, quantity, unit_purchase_price, total_debit_amount,
        reason, status, notes, created_at
      ) VALUES (
        ${id},
        ${challanNum},
        ${clinic_slug},
        ${supplier_name},
        ${batch_number},
        ${brand_name},
        ${returnQty},
        ${price},
        ${totalDebit},
        ${reason},
        'issued',
        ${notes || "Return Challan issued for supplier credit note reconciliation"},
        NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({
      success: true,
      message: `Return Challan ${challanNum} generated. ₹${totalDebit.toLocaleString("en-IN")} debited from supplier payables ledger.`,
      challan: inserted[0]
    });
  } catch (error: any) {
    console.error("Return Challan generation error:", error);
    return NextResponse.json({ error: error.message || "Failed to generate return challan" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const challans = await sql`
      SELECT * FROM pharmacy_return_challans
      ORDER BY created_at DESC
      LIMIT 50;
    `;

    const totalDebitVolume = challans.reduce((acc, curr) => acc + Number(curr.total_debit_amount || 0), 0);

    return NextResponse.json({
      challans,
      total_challans: challans.length,
      total_debit_volume: totalDebitVolume
    });
  } catch (error: any) {
    console.error("GET return challans error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch return challans" }, { status: 500 });
  }
}
