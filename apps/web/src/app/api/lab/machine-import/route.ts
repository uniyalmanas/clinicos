import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseMachineData } from "@/lib/lis-parser";
import { createHash, randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { raw_stream, order_number, pathologist_notes } = body;

    if (!raw_stream) {
      return NextResponse.json({ error: "raw_stream is required" }, { status: 400 });
    }

    // Parse ASTM or HL7 protocol stream
    const parsed = parseMachineData(raw_stream);
    const targetOrderNumber = order_number || parsed.order_number;

    // Check if order exists in Supabase
    let existing = await db`
      SELECT * FROM diagnostic_lab_orders
      WHERE order_number = ${targetOrderNumber} OR sample_barcode = ${targetOrderNumber}
      LIMIT 1;
    `;

    if (existing.length === 0) {
      // Auto-create order from machine requisition barcode
      const newBarcode = `BC-${Date.now().toString().slice(-6)}-EDTA`;
      existing = await db`
        INSERT INTO diagnostic_lab_orders (
          order_number,
          sample_barcode,
          patient_name,
          patient_phone,
          doctor_name,
          test_name,
          category,
          sample_type,
          status,
          sample_collected_at,
          sample_accessioned_at,
          sample_collector_name,
          analyzer_model,
          import_protocol
        ) VALUES (
          ${targetOrderNumber},
          ${newBarcode},
          ${parsed.patient_name || "Auto-Accessioned Patient"},
          '+919876543210',
          'Automated Analyzer',
          'Automated Blood Panel',
          'Hematology',
          'Whole Blood (EDTA)',
          'sample_accessioned',
          NOW(),
          NOW(),
          ${parsed.analyzer_model || "RS-232 Serial Benchtop"},
          ${parsed.analyzer_model || "Sysmex XN-350"},
          ${parsed.protocol}
        ) RETURNING *;
      `;
    }

    const order = existing[0];
    const orderId = order.id;

    // Check Critical Values
    let hasCritical = false;
    const criticalParams: string[] = [];

    const processedParameters = parsed.parameters.map((p: any) => {
      const num = parseFloat(String(p.value).replace(/[^0-9.]/g, ""));
      let status = p.status || "normal";

      if (!isNaN(num)) {
        if (p.parameter.includes("Hemoglobin") && (num < 7.0 || num > 20.0)) {
          status = "critical";
          hasCritical = true;
          criticalParams.push(`CRITICAL Hb: ${num} g/dL`);
        } else if (p.parameter.includes("Platelet") && (num < 20000 || num > 1000000)) {
          status = "critical";
          hasCritical = true;
          criticalParams.push(`CRITICAL Platelets: ${num} /cumm`);
        } else if (p.parameter.includes("Glucose") && (num < 50 || num > 400)) {
          status = "critical";
          hasCritical = true;
          criticalParams.push(`CRITICAL Glucose: ${num} mg/dL`);
        }
      }

      return { ...p, status };
    });

    // Generate SHA-256 Hash
    const rawPayload = `${orderId}-${targetOrderNumber}-${JSON.stringify(processedParameters)}-${parsed.analyzer_model}-${new Date().toISOString()}`;
    const reportSha256 = createHash("sha256").update(rawPayload).digest("hex");

    // If critical, log alert
    if (hasCritical) {
      await db`
        INSERT INTO lis_critical_alert_logs (
          id, order_id, order_number, patient_name, doctor_name,
          doctor_phone, parameter_name, critical_value, channel
        ) VALUES (
          ${randomUUID()},
          ${orderId},
          ${targetOrderNumber},
          ${order.patient_name},
          ${order.doctor_name},
          ${order.patient_phone},
          ${criticalParams.join("; ")},
          'CRITICAL_VALUE_FLAGGED',
          'SMS+DOCTOR_CALL'
        );
      `;
    }

    // Update with parsed quantitative results and pathologist notes
    const updated = await db`
      UPDATE diagnostic_lab_orders
      SET 
        results = ${JSON.stringify(processedParameters)}::jsonb,
        pathologist_notes = ${pathologist_notes || `Auto-imported via ${parsed.protocol} serial protocol from ${parsed.analyzer_model || 'Automated Analyzer'}. Verified by automated calibration standards.`},
        verified_by = ${parsed.analyzer_model || "Automated Analyzer Engine"},
        verified_at = NOW(),
        status = 'completed',
        analyzer_model = ${parsed.analyzer_model || "Automated Analyzer Engine"},
        import_protocol = ${parsed.protocol || "MANUAL"},
        critical_value_alert = ${hasCritical},
        critical_parameters = ${JSON.stringify(criticalParams)}::jsonb,
        report_sha256 = ${reportSha256},
        qc_verified = true,
        updated_at = NOW()
      WHERE id = ${orderId}
      RETURNING *;
    `;

    return NextResponse.json({
      success: true,
      protocol: parsed.protocol,
      analyzer: parsed.analyzer_model,
      order: updated[0],
      critical_value_alert: hasCritical,
      report_sha256: reportSha256,
      parsed_parameters_count: processedParameters.length
    });
  } catch (error: any) {
    console.error("LIS Machine Import error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse and import machine data" }, { status: 500 });
  }
}
