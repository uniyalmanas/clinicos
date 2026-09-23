import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clinic_slug = "derma-care-dehradun",
      brand_name,
      generic_name,
      dosage_form = "Tablet",
      strength = "",
      batch_number,
      expiry_date,
      current_stock = 50,
      reorder_level = 15,
      purchase_price = 0,
      mrp = 0,
      selling_price = 0,
      gst_rate = 12,
      rack_location = "Rack A-01",
      manufacturer = "Generic Pharma",
      hsn_code = "3004"
    } = body;

    if (!brand_name || !batch_number || !expiry_date) {
      return NextResponse.json({ error: "Brand name, batch number, and expiry date are required" }, { status: 400 });
    }

    const id = randomUUID();

    const inserted = await sql`
      INSERT INTO pharmacy_items (
        id, clinic_slug, brand_name, generic_name, dosage_form, 
        strength, batch_number, expiry_date, current_stock, reorder_level, 
        purchase_price, mrp, selling_price, gst_rate, rack_location, 
        manufacturer, hsn_code, created_at
      ) VALUES (
        ${id},
        ${clinic_slug},
        ${brand_name},
        ${(generic_name || brand_name).toUpperCase()},
        ${dosage_form},
        ${strength},
        ${batch_number},
        ${expiry_date},
        ${Number(current_stock)},
        ${Number(reorder_level)},
        ${Number(purchase_price)},
        ${Number(mrp)},
        ${Number(selling_price || mrp)},
        ${Number(gst_rate)},
        ${rack_location},
        ${manufacturer},
        ${hsn_code},
        NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({ status: "success", item: inserted[0] });
  } catch (error: any) {
    console.error("POST /api/pharmacy/inventory/add-batch error:", error);
    return NextResponse.json({ error: error.message || "Failed to add inventory batch" }, { status: 500 });
  }
}
