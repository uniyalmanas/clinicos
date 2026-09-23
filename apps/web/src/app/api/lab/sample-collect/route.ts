import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, collector_name } = body;

    if (!order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const updated = await db`
      UPDATE diagnostic_lab_orders
      SET 
        status = 'sample_collected',
        sample_collected_at = NOW(),
        sample_collector_name = ${collector_name || "Phlebotomy Staff"},
        updated_at = NOW()
      WHERE id = ${order_id}
      RETURNING *;
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated[0] });
  } catch (error: any) {
    console.error("Sample collection error:", error);
    return NextResponse.json({ error: error.message || "Failed to update sample collection" }, { status: 500 });
  }
}
