import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let query;
    if (status && status !== "all") {
      query = await db`
        SELECT * FROM diagnostic_lab_orders 
        WHERE status = ${status} 
        ORDER BY created_at DESC
      `;
    } else {
      query = await db`
        SELECT * FROM diagnostic_lab_orders 
        ORDER BY created_at DESC
      `;
    }

    const counts = await db`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'ordered') as ordered_count,
        COUNT(*) FILTER (WHERE status = 'sample_collected') as in_progress_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count
      FROM diagnostic_lab_orders
    `;

    return NextResponse.json({
      orders: query,
      metrics: {
        total: parseInt(counts[0].total) || 0,
        ordered: parseInt(counts[0].ordered_count) || 0,
        in_progress: parseInt(counts[0].in_progress_count) || 0,
        completed: parseInt(counts[0].completed_count) || 0,
      }
    });
  } catch (error: any) {
    console.error("Lab orders fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to load lab orders" }, { status: 500 });
  }
}
