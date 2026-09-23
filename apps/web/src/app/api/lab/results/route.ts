import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { order_id, results, pathologist_notes, verified_by } = body;

    if (!order_id || !Array.isArray(results)) {
      return NextResponse.json({ error: "order_id and results array are required" }, { status: 400 });
    }

    const updated = await db`
      UPDATE diagnostic_lab_orders
      SET 
        results = ${JSON.stringify(results)}::jsonb,
        pathologist_notes = ${pathologist_notes || "All clinical parameters verified."},
        verified_by = ${verified_by || "Chief Pathologist (MD Path)"},
        verified_at = NOW(),
        status = 'completed',
        updated_at = NOW()
      WHERE id = ${order_id}
      RETURNING *;
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, order: updated[0] });
  } catch (error: any) {
    console.error("Save lab results error:", error);
    return NextResponse.json({ error: error.message || "Failed to save lab results" }, { status: 500 });
  }
}
