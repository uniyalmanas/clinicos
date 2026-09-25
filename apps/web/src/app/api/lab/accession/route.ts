import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Smart Sample Accessioning & Quality Integrity Gate API
 * 1. Verifies physical barcode match to digital requisition.
 * 2. Pre-analytical Quality Checks: rejects compromised specimens (Hemolyzed, Clotted, Insufficient QNS, Mismatched).
 * 3. Transitions status to 'sample_accessioned' and routes to benchtop analyzer.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      order_id, 
      action = "accession", // 'accession' or 'reject'
      scanned_barcode, 
      accessioner_name = "Rajesh Sharma (Senior Lab Tech)",
      rejection_reason = "HEMOLYZED_SAMPLE",
      rejection_notes 
    } = body;

    if (!order_id) {
      return NextResponse.json({ error: "order_id is required" }, { status: 400 });
    }

    const orderQuery = await db`SELECT * FROM diagnostic_lab_orders WHERE id = ${order_id} LIMIT 1;`;
    if (orderQuery.length === 0) {
      return NextResponse.json({ error: "Lab order not found" }, { status: 404 });
    }
    const order = orderQuery[0];

    // ACTION: ACCESSION (Barcode verification + Tube integrity passed)
    if (action === "accession") {
      // Validate barcode if provided
      if (scanned_barcode && order.sample_barcode && scanned_barcode !== order.sample_barcode) {
        return NextResponse.json({
          error: `BARCODE MISMATCH ERROR: Scanned tag "${scanned_barcode}" does not match patient tube "${order.sample_barcode}". Accessioning rejected to prevent specimen mix-up.`,
          code: "BARCODE_MISMATCH"
        }, { status: 422 });
      }

      // Determine analyzer routing bench
      let targetBench = "Mindray BC-5150 Hematology Bench";
      if (order.category === "Biochemistry") targetBench = "Roche Cobas c311 Chemistry Analyzer";
      else if (order.category === "Serology") targetBench = "Beckman Coulter Immunoassay Bench";

      const updated = await db`
        UPDATE diagnostic_lab_orders
        SET 
          status = 'sample_accessioned',
          sample_accessioned_at = NOW(),
          sample_accessioner_name = ${accessioner_name},
          sample_rejected = false,
          sample_rejection_reason = NULL,
          updated_at = NOW()
        WHERE id = ${order_id}
        RETURNING *;
      `;

      return NextResponse.json({
        success: true,
        message: `✓ Sample ${order.sample_barcode} accessioned successfully by ${accessioner_name}. Specimen routed to ${targetBench}.`,
        target_bench: targetBench,
        order: updated[0]
      });
    }

    // ACTION: REJECT COMPROMISED SPECIMEN (Hemolysis, Clotting, QNS)
    if (action === "reject") {
      const updated = await db`
        UPDATE diagnostic_lab_orders
        SET 
          status = 'ordered', -- Reset for redraw
          sample_rejected = true,
          sample_rejection_reason = ${rejection_reason},
          sample_collected_at = NULL,
          sample_accessioned_at = NULL,
          pathologist_notes = ${`SPECIMEN REJECTED [${rejection_reason}]: ${rejection_notes || 'Sample compromised during pre-analytical phase. Mandatory phlebotomy redraw requested.'}`},
          updated_at = NOW()
        WHERE id = ${order_id}
        RETURNING *;
      `;

      return NextResponse.json({
        success: true,
        rejected: true,
        message: `⚠️ Specimen REJECTED due to [${rejection_reason}]. Order reset to 'ordered' for immediate phlebotomy re-draw notification.`,
        order: updated[0]
      });
    }

    return NextResponse.json({ error: "Invalid accession action" }, { status: 400 });
  } catch (error: any) {
    console.error("Accession error:", error);
    return NextResponse.json({ error: error.message || "Failed to process sample accessioning" }, { status: 500 });
  }
}
