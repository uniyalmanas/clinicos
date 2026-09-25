import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

/**
 * Multi-Outlet Inter-Branch Stock Transfer Engine
 * Tracks stock dispatched between clinic dispensaries with in-transit reconciliation.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = "dispatch",
      transfer_id,
      from_outlet = "Main Dispensary (Rajpur Rd)",
      to_outlet = "EC Road Daycare Branch",
      item_id,
      brand_name,
      batch_number,
      quantity,
      dispatched_by = "Lead Pharmacist",
      received_by = "Branch In-Charge",
      notes = ""
    } = body;

    // Action 1: Dispatch stock to another branch
    if (action === "dispatch") {
      const transferQty = Number(quantity);
      if (!transferQty || transferQty <= 0) {
        return NextResponse.json({ error: "Valid positive transfer quantity required" }, { status: 400 });
      }

      if (!brand_name || !batch_number) {
        return NextResponse.json({ error: "brand_name and batch_number are required" }, { status: 400 });
      }

      // Check stock at source
      if (item_id) {
        const itemRows = await sql`
          SELECT current_stock, brand_name, batch_number 
          FROM pharmacy_items 
          WHERE id = ${item_id}
          LIMIT 1;
        `;
        if (itemRows.length === 0 || Number(itemRows[0].current_stock) < transferQty) {
          return NextResponse.json({
            error: `Insufficient stock at source: On-hand is only ${itemRows[0]?.current_stock || 0}`
          }, { status: 400 });
        }

        // Deduct from source branch immediately
        await sql`
          UPDATE pharmacy_items 
          SET current_stock = GREATEST(0, current_stock - ${transferQty})
          WHERE id = ${item_id};
        `;
      }

      const id = randomUUID();
      const transferNum = `TRF-${Date.now().toString().slice(-6)}`;

      const inserted = await sql`
        INSERT INTO pharmacy_stock_transfers (
          id, transfer_number, from_outlet, to_outlet, item_id,
          brand_name, batch_number, quantity, status, dispatched_by,
          notes, created_at
        ) VALUES (
          ${id},
          ${transferNum},
          ${from_outlet},
          ${to_outlet},
          ${item_id || null},
          ${brand_name},
          ${batch_number},
          ${transferQty},
          'in_transit',
          ${dispatched_by},
          ${notes || "Inter-branch stock transfer"},
          NOW()
        )
        RETURNING *;
      `;

      return NextResponse.json({
        success: true,
        message: `Transfer ${transferNum} dispatched. ${transferQty} units of ${brand_name} are now In-Transit.`,
        transfer: inserted[0]
      });
    }

    // Action 2: Receive and verify stock at destination branch
    if (action === "receive") {
      if (!transfer_id) {
        return NextResponse.json({ error: "transfer_id is required to acknowledge receipt" }, { status: 400 });
      }

      const updated = await sql`
        UPDATE pharmacy_stock_transfers
        SET 
          status = 'received',
          received_by = ${received_by},
          received_at = NOW()
        WHERE id = ${transfer_id} OR transfer_number = ${transfer_id}
        RETURNING *;
      `;

      if (updated.length === 0) {
        return NextResponse.json({ error: "Transfer record not found" }, { status: 404 });
      }

      return NextResponse.json({
        success: true,
        message: `Transfer ${updated[0].transfer_number} received & reconciled at destination outlet.`,
        transfer: updated[0]
      });
    }

    return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  } catch (error: any) {
    console.error("Transfer error:", error);
    return NextResponse.json({ error: error.message || "Failed to process transfer" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const transfers = await sql`
      SELECT * FROM pharmacy_stock_transfers
      ORDER BY created_at DESC
      LIMIT 50;
    `;

    return NextResponse.json({
      transfers,
      in_transit_count: transfers.filter((t: any) => t.status === "in_transit").length
    });
  } catch (error: any) {
    console.error("GET transfers error:", error);
    return NextResponse.json({ error: error.message || "Failed to load transfers" }, { status: 500 });
  }
}
