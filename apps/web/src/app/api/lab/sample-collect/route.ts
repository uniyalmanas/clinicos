import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { findClinicLabOrder } from "@/lib/lab-scope";

export const dynamic = "force-dynamic";

/**
 * Record sample collection.
 *
 * The collector is the authenticated user — there is no "default phlebotomist".
 * TAT/SLA is whatever the caller supplies; an unconfigured SLA stays null.
 * Tube type is derived from the ordered test only when not supplied.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINICAL_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const body = await req.json();
    const { order_id, collector_name, sample_barcode, vacutainer_tube, tat_sla_minutes } =
      body;

    if (!order_id) {
      return apiError(400, "order_id is required.", "invalid_input");
    }

    const order = await findClinicLabOrder(clinicId, order_id);
    if (!order) {
      return apiError(404, "Lab order not found in your clinic.", "order_not_found");
    }

    if (order.sample_rejected) {
      return apiError(
        409,
        `This specimen was rejected (${order.sample_rejection_reason || "reason not recorded"}). Confirm the redraw before collecting again.`,
        "specimen_rejected"
      );
    }

    const collector = String(collector_name || auth.auth.user.full_name || "").trim();
    if (!collector) {
      return apiError(400, "collector_name is required.", "collector_required");
    }

    // Derive the tube from the test name only when the caller did not specify.
    let tube = vacutainer_tube ? String(vacutainer_tube) : null;
    if (!tube) {
      const test = String(order.test_name || "").toLowerCase();
      if (test.includes("cbc") || test.includes("blood count") || test.includes("hba1c")) {
        tube = "Lavender (K2-EDTA)";
      } else if (test.includes("glucose") || test.includes("sugar")) {
        tube = "Grey (Sodium Fluoride)";
      } else if (test.includes("pt") || test.includes("inr") || test.includes("coagulation")) {
        tube = "Light Blue (Sodium Citrate)";
      } else {
        tube = "Gold (SST Gel Clot Activator)";
      }
    }

    const tubeSuffix = tube.includes("EDTA")
      ? "EDTA"
      : tube.includes("Fluoride")
        ? "GLU"
        : tube.includes("Citrate")
          ? "CIT"
          : "SST";
    const barcode =
      sample_barcode ||
      order.sample_barcode ||
      `BC-${Date.now().toString().slice(-6)}-${tubeSuffix}`;

    let sla: number | null = null;
    if (tat_sla_minutes !== undefined && tat_sla_minutes !== null && tat_sla_minutes !== "") {
      const parsed = Number(tat_sla_minutes);
      if (!Number.isFinite(parsed) || parsed <= 0) {
        return apiError(400, "tat_sla_minutes must be a positive number.", "invalid_sla");
      }
      sla = Math.round(parsed);
    }

    const updated = await sql`
      UPDATE diagnostic_lab_orders
      SET
        status = 'sample_collected',
        sample_collected_at = NOW(),
        sample_collector_name = ${collector},
        sample_barcode = ${barcode},
        vacutainer_tube = ${tube},
        tat_sla_minutes = ${sla},
        sample_rejected = false,
        sample_rejection_reason = NULL,
        updated_at = NOW()
      WHERE id = ${String(order.id)}
      RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "lab.sample.collect",
      entity: "diagnostic_lab_order",
      entityId: String(order.id),
      after: { barcode, tube, collector, tat_sla_minutes: sla },
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: `Sample collected for ${order.patient_name}. Barcode ${barcode} on ${tube} tube.`,
      order: updated[0],
    });
  } catch (error: any) {
    console.error("POST /api/lab/sample-collect error:", error);
    return apiError(500, "Failed to record sample collection.", "internal_error");
  }
}
