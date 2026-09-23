import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get("filter_type");
    const clinicSlug = searchParams.get("clinic_slug") || "derma-care-dehradun";

    const rows = await sql`
      SELECT * FROM pharmacy_items 
      WHERE clinic_slug = ${clinicSlug} OR clinic_slug IS NULL
      ORDER BY brand_name ASC;
    `;

    const now = new Date();

    const items = rows.map((item: any) => {
      let daysToExpiry = 999;
      let isExpiringSoon = false;
      let isExpired = false;

      if (item.expiry_date) {
        const exp = new Date(item.expiry_date);
        const diffMs = exp.getTime() - now.getTime();
        daysToExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        isExpired = daysToExpiry < 0;
        isExpiringSoon = daysToExpiry >= 0 && daysToExpiry <= 60;
      }

      const isLowStock = Number(item.current_stock) <= Number(item.reorder_level);

      return {
        id: item.id,
        clinic_slug: item.clinic_slug || clinicSlug,
        brand_name: item.brand_name,
        generic_name: item.generic_name,
        dosage_form: item.dosage_form,
        strength: item.strength,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
        days_to_expiry: daysToExpiry,
        is_expiring_soon: isExpiringSoon,
        is_expired: isExpired,
        current_stock: Number(item.current_stock || 0),
        reorder_level: Number(item.reorder_level || 0),
        is_low_stock: isLowStock,
        purchase_price: Number(item.purchase_price || 0),
        mrp: Number(item.mrp || 0),
        selling_price: Number(item.selling_price || 0),
        gst_rate: Number(item.gst_rate || 12),
        hsn_code: item.hsn_code,
        manufacturer: item.manufacturer,
        rack_location: item.rack_location,
        created_at: item.created_at
      };
    });

    // Apply filter
    let filteredItems = items;
    if (filterType === "expiring_soon") {
      filteredItems = items.filter(i => i.is_expiring_soon || i.is_expired);
    } else if (filterType === "low_stock") {
      filteredItems = items.filter(i => i.is_low_stock);
    }

    // Calculate Summary Metrics
    const totalSkus = items.length;
    const totalStockUnits = items.reduce((acc, curr) => acc + curr.current_stock, 0);
    const totalInventoryMrp = items.reduce((acc, curr) => acc + (curr.current_stock * curr.mrp), 0);
    const lowStockCount = items.filter(i => i.is_low_stock).length;
    const expiringSoonCount = items.filter(i => i.is_expiring_soon || i.is_expired).length;

    return NextResponse.json({
      items: filteredItems,
      summary: {
        total_skus: totalSkus,
        total_stock_units: totalStockUnits,
        total_inventory_mrp: totalInventoryMrp,
        low_stock_count: lowStockCount,
        expiring_soon_count: expiringSoonCount
      }
    });
  } catch (error: any) {
    console.error("GET /api/pharmacy/inventory error:", error);
    return NextResponse.json({ error: error.message || "Failed to load pharmacy inventory" }, { status: 500 });
  }
}

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
    console.error("POST /api/pharmacy/inventory error:", error);
    return NextResponse.json({ error: error.message || "Failed to add inventory batch" }, { status: 500 });
  }
}
