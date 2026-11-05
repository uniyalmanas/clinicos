import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createHash } from "crypto";
import { timingSafeEqual } from "crypto";
import { apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { parseMachineData } from "@/lib/lis-parser";

export const dynamic = "force-dynamic";

/**
 * Analyzer result import (ASTM / HL7 stream).
 *
 * Called by the lab middleware, not by a browser session, so it authenticates
 * with the shared `x-lab-machine-secret` header. The secret is required — the
 * route refuses to run unconfigured.
 *
 * The order must already exist. Imports never invent an order, patient,
 * clinician, or phone number; a barcode with no requisition is rejected. A
 * report that a pathologist has already signed is never overwritten.
 */
export async function POST(req: NextRequest) {
  try {
    const configuredSecret = (process.env.LAB_MACHINE_SECRET || "").trim();
    if (!configuredSecret) {
      return apiError(
        503,
        "Analyzer import is not configured. Set LAB_MACHINE_SECRET.",
        "not_configured"
      );
    }

    const providedSecret = (req.headers.get("x-lab-machine-secret") || "").trim();
    const a = Buffer.from(providedSecret);
    const b = Buffer.from(configuredSecret);
    const secretOk = a.length === b.length && timingSafeEqual(a, b);
    if (!secretOk) {
      return apiError(401, "Invalid analyzer credentials.", "unauthorized");
    }

    const body = await req.json();
    const { raw_stream, order_number, pathologist_notes } = body;

    if (!raw_stream) {
      return apiError(400, "raw_stream is required.", "invalid_input");
    }

    const parsed = parseMachineData(raw_stream);
    const targetOrderNumber = String(order_number || parsed.order_number || "").trim();
    if (!targetOrderNumber) {
      return apiError(
        400,
        "No order number or sample barcode could be read from the stream.",
        "order_required"
      );
    }

    const existing = await sql`
      SELECT * FROM diagnostic_lab_orders
      WHERE order_number = ${targetOrderNumber}
         OR sample_barcode = ${targetOrderNumber}
      LIMIT 1;
    `;

    if (existing.length === 0) {
      return apiError(
        404,
        `No requisition matches ${targetOrderNumber}. Create the lab order in the app before importing analyzer results.`,
        "order_not_found"
      );
    }

    const order = existing[0];

    if (String(order.status || "") === "completed") {
      return apiError(
        409,
        "This report has already been signed. A pathologist must reopen it before new analyzer results can be imported.",
        "report_already_signed"
      );
    }

    if (order.sample_rejected) {
      return apiError(
        409,
        "This specimen was rejected. Collect a fresh sample before importing results.",
        "specimen_rejected"
      );
    }

    if (!Array.isArray(parsed.parameters) || parsed.parameters.length === 0) {
      return apiError(
        422,
        "No measurable parameters were parsed from the stream.",
        "no_parameters"
      );
    }

    // Resolve the tenant from the originating appointment/prescription so the
    // audit row is attributed correctly.
    const origin = await sql`
      SELECT
        a.clinic_id AS appointment_clinic,
        p.clinic_id AS prescription_clinic
      FROM (SELECT 1) AS seed
      LEFT JOIN appointments a ON a.id::text = ${order.appointment_id ? String(order.appointment_id) : null}
      LEFT JOIN prescriptions p ON p.id::text = ${order.prescription_id ? String(order.prescription_id) : null}
      LIMIT 1;
    `;
    const clinicId: string | null =
      origin[0]?.appointment_clinic || origin[0]?.prescription_clinic || null;

    let hasCritical = false;
    const criticalParams: string[] = [];

    const processedParameters = parsed.parameters.map((p: any) => {
      const num = parseFloat(String(p.value).replace(/[^0-9.]/g, ""));
      let status = p.status || "normal";
      const name = String(p.parameter || "");

      if (!isNaN(num)) {
        if (name.includes("Hemoglobin") && (num < 7.0 || num > 20.0)) {
          status = "critical";
          hasCritical = true;
          criticalParams.push(`CRITICAL Hb: ${num} g/dL`);
        } else if (name.includes("Platelet") && (num < 20000 || num > 1000000)) {
          status = "critical";
          hasCritical = true;
          criticalParams.push(`CRITICAL Platelets: ${num} /cumm`);
        } else if (name.includes("Glucose") && (num < 50 || num > 400)) {
          status = "critical";
          hasCritical = true;
          criticalParams.push(`CRITICAL Glucose: ${num} mg/dL`);
        }
      }

      return { ...p, status };
    });

    const importedAt = new Date().toISOString();
    const rawPayload = `${order.id}-${targetOrderNumber}-${JSON.stringify(
      processedParameters
    )}-${parsed.analyzer_model || ""}-${importedAt}`;
    const reportSha256 = createHash("sha256").update(rawPayload).digest("hex");

    if (hasCritical) {
      await sql`
        INSERT INTO lis_critical_alert_logs (
          id, order_id, order_number, patient_name, doctor_name,
          doctor_phone, parameter_name, critical_value, channel
        ) VALUES (
          gen_random_uuid(),
          ${order.id},
          ${targetOrderNumber},
          ${order.patient_name},
          ${order.doctor_name},
          ${order.patient_phone},
          ${criticalParams.join("; ")},
          'CRITICAL_VALUE_FLAGGED',
          'analyzer_import'
        );
      `;
    }

    // Results are stored as analyzer output. They are NOT marked verified —
    // a pathologist still has to sign the report via /api/lab/results.
    const updated = await sql`
      UPDATE diagnostic_lab_orders
      SET
        results = ${JSON.stringify(processedParameters)}::jsonb,
        pathologist_notes = ${pathologist_notes || null},
        status = 'results_entered',
        analyzer_model = ${parsed.analyzer_model || null},
        import_protocol = ${parsed.protocol || "MANUAL"},
        critical_value_alert = ${hasCritical},
        critical_parameters = ${JSON.stringify(criticalParams)}::jsonb,
        report_sha256 = ${reportSha256},
        updated_at = NOW()
      WHERE id = ${order.id}
      RETURNING *;
    `;

    await logAudit({
      actorId: null,
      actorRole: "lab_analyzer",
      clinicId,
      action: "lab.machine.import",
      entity: "diagnostic_lab_order",
      entityId: String(order.id),
      after: {
        order_number: targetOrderNumber,
        analyzer: parsed.analyzer_model || null,
        protocol: parsed.protocol || null,
        parameter_count: processedParameters.length,
        critical_value_alert: hasCritical,
        report_sha256: reportSha256,
      },
      request: req,
    });

    return NextResponse.json({
      success: true,
      protocol: parsed.protocol,
      analyzer: parsed.analyzer_model,
      status: "results_entered",
      awaiting_pathologist_signoff: true,
      order: updated[0],
      critical_value_alert: hasCritical,
      report_sha256: reportSha256,
      parsed_parameters_count: processedParameters.length,
    });
  } catch (error: any) {
    console.error("POST /api/lab/machine-import error:", error);
    return apiError(500, "Failed to parse and import analyzer data.", "internal_error");
  }
}
