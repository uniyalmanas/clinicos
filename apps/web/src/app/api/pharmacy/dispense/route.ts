import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clinic_slug = "derma-care-dehradun",
      prescription_number,
      patient_name,
      patient_phone,
      patient_address = "Dehradun, Uttarakhand",
      doctor_name = "Dr. Rahul Sharma",
      doctor_reg_number = "UKMC-8942-2012",
      items = [],
      subtotal = 0,
      discount = 0,
      gst_amount = 0,
      total_amount = 0,
      payment_mode = "upi",
      payment_notes = "",
      is_offline_reconciliation = false
    } = body;

    if (!patient_name || !items || items.length === 0) {
      return NextResponse.json({ error: "Patient name and at least one item are required" }, { status: 400 });
    }

    // Step 1: Pre-flight check for CDSCO Recall on any item
    for (const item of items) {
      if (item.item_id && !String(item.item_id).startsWith("manual-")) {
        const itemRows = await sql`
          SELECT brand_name, batch_number, is_recalled, recall_reason, current_stock, schedule_type
          FROM pharmacy_items 
          WHERE id = ${item.item_id}
          LIMIT 1;
        `;
        if (itemRows.length > 0) {
          const matched = itemRows[0];
          if (matched.is_recalled) {
            return NextResponse.json({
              error: `DISPENSING HARD-BLOCKED: Batch ${matched.batch_number} of "${matched.brand_name}" is under CDSCO Regulatory Recall (${matched.recall_reason || "Regulatory Safety Notice"}).`,
              code: "DRUG_RECALLED"
            }, { status: 403 });
          }
        }
      }
    }

    // Step 2: Atomic concurrency control / Row-level conditional decrement
    // Prevents race conditions and negative inventory from simultaneous counter checkout
    const depletedItems: Array<{ item_id: string; brand_name: string; qty: number }> = [];

    for (const item of items) {
      if (item.item_id && !String(item.item_id).startsWith("manual-")) {
        const qty = Number(item.quantity) || 1;
        
        // Atomic conditional decrement: Only succeeds if current_stock >= qty and not recalled
        const updated = await sql`
          UPDATE pharmacy_items 
          SET current_stock = current_stock - ${qty}
          WHERE id = ${item.item_id} 
            AND current_stock >= ${qty}
            AND (is_recalled IS NULL OR is_recalled = false)
          RETURNING id, brand_name, batch_number, current_stock, schedule_type;
        `;

        if (updated.length === 0) {
          // Concurrency collision or insufficient stock detected
          // Rollback any items already decremented in this transaction loop
          for (const d of depletedItems) {
            await sql`
              UPDATE pharmacy_items 
              SET current_stock = current_stock + ${d.qty}
              WHERE id = ${d.item_id};
            `;
          }

          return NextResponse.json({
            error: `Dispense Concurrency Conflict: Insufficient stock for "${item.brand_name}" (Batch ${item.batch_number}). Another counter pharmacist may have just dispensed this unit. Please refresh stock count.`,
            code: "CONCURRENCY_STOCK_DEPLETED"
          }, { status: 409 });
        }

        depletedItems.push({
          item_id: item.item_id,
          brand_name: item.brand_name,
          qty
        });
      }
    }

    const billNumber = `BILL-PHARM-${Math.floor(100000 + Math.random() * 900000)}`;
    const id = randomUUID();

    const inserted = await sql`
      INSERT INTO pharmacy_dispenses (
        id, clinic_slug, bill_number, prescription_number, patient_name, 
        patient_phone, doctor_name, items, subtotal, discount, 
        gst_amount, total_amount, payment_mode, status, created_at
      ) VALUES (
        ${id},
        ${clinic_slug},
        ${billNumber},
        ${prescription_number || null},
        ${patient_name},
        ${patient_phone || null},
        ${doctor_name},
        ${JSON.stringify(items)},
        ${Number(subtotal)},
        ${Number(discount)},
        ${Number(gst_amount)},
        ${Number(total_amount)},
        ${payment_mode},
        'dispensed',
        NOW()
      )
      RETURNING *;
    `;

    // Step 3: Mandatory Schedule H1 Compliance Audit Log
    // Drugs & Cosmetics Rule 65: Prescriptions containing Schedule H1 drugs must be logged in a separate register
    for (const item of items) {
      if (item.schedule_type === "Schedule H1" || item.is_schedule_h1) {
        const logId = randomUUID();
        try {
          await sql`
            INSERT INTO pharmacy_schedule_h1_logs (
              id, bill_number, clinic_slug, patient_name, patient_phone, 
              patient_address, doctor_name, doctor_reg_number, drug_name, 
              batch_number, quantity, pharmacist_name, dispensed_at
            ) VALUES (
              ${logId},
              ${billNumber},
              ${clinic_slug},
              ${patient_name},
              ${patient_phone || "N/A"},
              ${patient_address || "Dehradun, Uttarakhand"},
              ${doctor_name},
              ${doctor_reg_number},
              ${item.brand_name},
              ${item.batch_number || "BATCH-H1"},
              ${Number(item.quantity) || 1},
              'Registered Pharmacist (Duty)',
              NOW()
            );
          `;
        } catch (logErr) {
          console.warn("Schedule H1 auto-log warning:", logErr);
        }
      }
    }

    return NextResponse.json({
      status: "success",
      bill: {
        ...inserted[0],
        items: items,
        is_offline_reconciliation: Boolean(is_offline_reconciliation),
        payment_notes: payment_notes || null
      }
    });
  } catch (error: any) {
    console.error("POST /api/pharmacy/dispense error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispense pharmacy items" }, { status: 500 });
  }
}
