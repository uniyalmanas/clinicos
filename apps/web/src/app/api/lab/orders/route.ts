import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Lab worklist for the caller's clinic.
 *
 * `diagnostic_lab_orders` has no clinic_id, so orders are scoped through the
 * appointment or prescription they were created from.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const status = new URL(req.url).searchParams.get("status");

    const scopedOrders = status && status !== "all"
      ? await sql`
          SELECT o.* FROM diagnostic_lab_orders o
          WHERE o.status = ${status}
            AND (
              EXISTS (
                SELECT 1 FROM appointments a
                WHERE a.id::text = o.appointment_id::text
                  AND a.clinic_id::text = ${clinicId}::text
              )
              OR EXISTS (
                SELECT 1 FROM prescriptions p
                WHERE p.id::text = o.prescription_id::text
                  AND p.clinic_id::text = ${clinicId}::text
              )
            )
          ORDER BY o.created_at DESC;
        `
      : await sql`
          SELECT o.* FROM diagnostic_lab_orders o
          WHERE (
            EXISTS (
              SELECT 1 FROM appointments a
              WHERE a.id::text = o.appointment_id::text
                AND a.clinic_id::text = ${clinicId}::text
            )
            OR EXISTS (
              SELECT 1 FROM prescriptions p
              WHERE p.id::text = o.prescription_id::text
                AND p.clinic_id::text = ${clinicId}::text
            )
          )
          ORDER BY o.created_at DESC;
        `;

    const counts = await sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE o.status = 'ordered') AS ordered_count,
        COUNT(*) FILTER (WHERE o.status = 'sample_collected') AS collected_count,
        COUNT(*) FILTER (WHERE o.status = 'sample_accessioned') AS accessioned_count,
        COUNT(*) FILTER (WHERE o.status = 'completed') AS completed_count,
        COUNT(*) FILTER (WHERE o.critical_value_alert = true) AS critical_count,
        COUNT(*) FILTER (WHERE o.sample_rejected = true) AS rejected_count
      FROM diagnostic_lab_orders o
      WHERE (
        EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.id::text = o.appointment_id::text
            AND a.clinic_id::text = ${clinicId}::text
        )
        OR EXISTS (
          SELECT 1 FROM prescriptions p
          WHERE p.id::text = o.prescription_id::text
            AND p.clinic_id::text = ${clinicId}::text
        )
      );
    `;

    const now = new Date();
    const enrichedOrders = scopedOrders.map((o: any) => {
      let isTatBreached = false;
      let elapsedMinutes = 0;
      let remainingMinutes = 0;
      const slaLimit = Number(o.tat_sla_minutes || 0);

      const startTime = o.sample_collected_at || o.created_at;
      if (startTime) {
        const start = new Date(startTime);
        const end = o.verified_at ? new Date(o.verified_at) : now;
        elapsedMinutes = Math.max(
          0,
          Math.floor((end.getTime() - start.getTime()) / (1000 * 60))
        );
        remainingMinutes = slaLimit > 0 ? Math.max(0, slaLimit - elapsedMinutes) : 0;

        if (slaLimit > 0 && o.status !== "completed" && elapsedMinutes > slaLimit) {
          isTatBreached = true;
        }
      }

      return {
        ...o,
        elapsed_minutes: elapsedMinutes,
        remaining_minutes: remainingMinutes,
        tat_breached: isTatBreached,
      };
    });

    const tatBreachedCount = enrichedOrders.filter((o: any) => o.tat_breached).length;
    const c = counts[0] || {};

    return NextResponse.json({
      orders: enrichedOrders,
      metrics: {
        total: parseInt(c.total, 10) || 0,
        ordered: parseInt(c.ordered_count, 10) || 0,
        sample_collected: parseInt(c.collected_count, 10) || 0,
        sample_accessioned: parseInt(c.accessioned_count, 10) || 0,
        in_progress:
          (parseInt(c.collected_count, 10) || 0) +
          (parseInt(c.accessioned_count, 10) || 0),
        completed: parseInt(c.completed_count, 10) || 0,
        critical_count: parseInt(c.critical_count, 10) || 0,
        rejected_count: parseInt(c.rejected_count, 10) || 0,
        tat_breached_count: tatBreachedCount,
      },
    });
  } catch (error: any) {
    console.error("Lab orders fetch error:", error);
    return apiError(500, "Failed to load lab orders.", "internal_error");
  }
}
