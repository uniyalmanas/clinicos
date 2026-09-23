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
      doctor_name = "Dr. Rahul Sharma",
      items = [],
      subtotal = 0,
      discount = 0,
      gst_amount = 0,
      total_amount = 0,
      payment_mode = "upi"
    } = body;

    if (!patient_name || !items || items.length === 0) {
      return NextResponse.json({ error: "Patient name and at least one item are required" }, { status: 400 });
    }

    // Atomically decrement stock in pharmacy_items
    for (const item of items) {
      if (item.item_id) {
        const qty = Number(item.quantity) || 1;
        await sql`
          UPDATE pharmacy_items 
          SET current_stock = GREATEST(0, current_stock - ${qty})
          WHERE id = ${item.item_id};
        `;
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

    return NextResponse.json({
      status: "success",
      bill: {
        ...inserted[0],
        items: items
      }
    });
  } catch (error: any) {
    console.error("POST /api/pharmacy/dispense error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispense pharmacy items" }, { status: 500 });
  }
}
