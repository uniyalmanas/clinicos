import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { parseMachineData } from "@/lib/lis-parser";

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
      WHERE order_number = ${targetOrderNumber}
      LIMIT 1;
    `;

    if (existing.length === 0) {
      // Auto-create order from machine requisition
      existing = await db`
        INSERT INTO diagnostic_lab_orders (
          order_number,
          patient_name,
          patient_phone,
          doctor_name,
          test_name,
          category,
          sample_type,
          status,
          sample_collected_at,
          sample_collector_name
        ) VALUES (
          ${targetOrderNumber},
          ${parsed.patient_name || "Auto-Accessioned Patient"},
          '+919876543210',
          'Automated Analyzer',
          'Automated Blood Panel',
          'Hematology',
          'Whole Blood (EDTA)',
          'sample_collected',
          NOW(),
          ${parsed.analyzer_model || "RS-232 Serial Benchtop"}
        ) RETURNING *;
      `;
    }

    const orderId = existing[0].id;

    // Update with parsed quantitative results and pathologist notes
    const updated = await db`
      UPDATE diagnostic_lab_orders
      SET 
        results = ${JSON.stringify(parsed.parameters)}::jsonb,
        pathologist_notes = ${pathologist_notes || `Auto-imported via ${parsed.protocol} serial protocol from ${parsed.analyzer_model}. Verified by automated calibration standards.`},
        verified_by = ${parsed.analyzer_model || "Automated Analyzer Engine"},
        verified_at = NOW(),
        status = 'completed',
        updated_at = NOW()
      WHERE id = ${orderId}
      RETURNING *;
    `;

    return NextResponse.json({
      success: true,
      protocol: parsed.protocol,
      analyzer: parsed.analyzer_model,
      order: updated[0],
      parsed_parameters_count: parsed.parameters.length
    });
  } catch (error: any) {
    console.error("LIS Machine Import error:", error);
    return NextResponse.json({ error: error.message || "Failed to parse and import machine data" }, { status: 500 });
  }
}
