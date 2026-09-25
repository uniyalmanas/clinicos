import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

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
        COUNT(*) FILTER (WHERE status = 'sample_collected') as collected_count,
        COUNT(*) FILTER (WHERE status = 'sample_accessioned') as accessioned_count,
        COUNT(*) FILTER (WHERE status = 'completed') as completed_count,
        COUNT(*) FILTER (WHERE critical_value_alert = true) as critical_count,
        COUNT(*) FILTER (WHERE sample_rejected = true) as rejected_count
      FROM diagnostic_lab_orders
    `;

    // Calculate TAT SLA status for each order
    const now = new Date();
    const enrichedOrders = query.map((o: any) => {
      let isTatBreached = false;
      let elapsedMinutes = 0;
      let remainingMinutes = 0;
      const slaLimit = Number(o.tat_sla_minutes || 90);

      const startTime = o.sample_collected_at || o.created_at;
      if (startTime) {
        const start = new Date(startTime);
        const end = o.verified_at ? new Date(o.verified_at) : now;
        elapsedMinutes = Math.max(0, Math.floor((end.getTime() - start.getTime()) / (1000 * 60)));
        remainingMinutes = Math.max(0, slaLimit - elapsedMinutes);

        if (o.status !== "completed" && elapsedMinutes > slaLimit) {
          isTatBreached = true;
        }
      }

      return {
        ...o,
        elapsed_minutes: elapsedMinutes,
        remaining_minutes: remainingMinutes,
        tat_breached: isTatBreached
      };
    });

    const tatBreachedCount = enrichedOrders.filter((o: any) => o.tat_breached).length;

    return NextResponse.json({
      orders: enrichedOrders,
      metrics: {
        total: parseInt(counts[0].total) || 0,
        ordered: parseInt(counts[0].ordered_count) || 0,
        sample_collected: parseInt(counts[0].collected_count) || 0,
        sample_accessioned: parseInt(counts[0].accessioned_count) || 0,
        in_progress: (parseInt(counts[0].collected_count) || 0) + (parseInt(counts[0].accessioned_count) || 0),
        completed: parseInt(counts[0].completed_count) || 0,
        critical_count: parseInt(counts[0].critical_count) || 0,
        rejected_count: parseInt(counts[0].rejected_count) || 0,
        tat_breached_count: tatBreachedCount
      }
    });
  } catch (error: any) {
    console.error("Lab orders fetch error:", error);
    return NextResponse.json({ error: error.message || "Failed to load lab orders" }, { status: 500 });
  }
}
