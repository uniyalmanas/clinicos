import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      order_id, 
      collector_name, 
      sample_barcode, 
      vacutainer_tube,
      tat_sla_minutes 
    } = body;

    if (!order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const orderQuery = await db`SELECT * FROM diagnostic_lab_orders WHERE id = ${order_id} LIMIT 1;`;
    if (orderQuery.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const order = orderQuery[0];

    // Determine vacutainer tube based on test type if not specified
    let tube = vacutainer_tube;
    if (!tube) {
      const lower = order.test_name.toLowerCase();
      if (lower.includes("cbc") || lower.includes("blood count") || lower.includes("hba1c")) {
        tube = "Lavender (K2-EDTA)";
      } else if (lower.includes("glucose") || lower.includes("sugar")) {
        tube = "Grey (Sodium Fluoride)";
      } else if (lower.includes("pt") || lower.includes("inr") || lower.includes("coagulation")) {
        tube = "Light Blue (Sodium Citrate)";
      } else {
        tube = "Gold (SST Gel Clot Activator)";
      }
    }

    // Generate unique sample barcode
    const tubeSuffix = tube.includes("EDTA") ? "EDTA" : tube.includes("Fluoride") ? "GLU" : "SST";
    const barcode = sample_barcode || `BC-${Date.now().toString().slice(-6)}-${tubeSuffix}`;
    const sla = Number(tat_sla_minutes || (order.category === "Hematology" ? 90 : 180));

    const updated = await db`
      UPDATE diagnostic_lab_orders
      SET 
        status = 'sample_collected',
        sample_collected_at = NOW(),
        sample_collector_name = ${collector_name || "Sister Rekha (Phlebotomist)"},
        sample_barcode = ${barcode},
        vacutainer_tube = ${tube},
        tat_sla_minutes = ${sla},
        sample_rejected = false,
        sample_rejection_reason = NULL,
        updated_at = NOW()
      WHERE id = ${order_id}
      RETURNING *;
    `;

    return NextResponse.json({ 
      success: true, 
      message: `Sample collected for ${order.patient_name}. Barcode ${barcode} generated for ${tube} tube.`,
      order: updated[0] 
    });
  } catch (error: any) {
    console.error("Sample collection error:", error);
    return NextResponse.json({ error: error.message || "Failed to update sample collection" }, { status: 500 });
  }
}
