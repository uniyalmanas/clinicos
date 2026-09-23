import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { item_id, new_stock, reason = "Stock Count Audit" } = body;

    if (!item_id || new_stock === undefined) {
      return NextResponse.json({ error: "item_id and new_stock are required" }, { status: 400 });
    }

    const updated = await sql`
      UPDATE pharmacy_items 
      SET current_stock = ${Number(new_stock)}
      WHERE id = ${item_id}
      RETURNING *;
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      item: updated[0]
    });
  } catch (error: any) {
    console.error("POST /api/pharmacy/inventory/adjust-stock error:", error);
    return NextResponse.json({ error: error.message || "Failed to adjust stock" }, { status: 500 });
  }
}
