import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const numberOrNull = (value: any): number | null => {
  if (value === undefined || value === null || value === "") return null;
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
};

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const { searchParams } = new URL(req.url);
    const filterType = searchParams.get("filter_type");

    const rows = await sql`
      SELECT * FROM pharmacy_items
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY brand_name ASC;
    `;

    const now = new Date();

    const items = rows.map((item: any) => {
      let daysToExpiry: number | null = null;
      let isExpiringSoon = false;
      let isExpired = false;

      if (item.expiry_date) {
        const exp = new Date(item.expiry_date);
        if (!isNaN(exp.getTime())) {
          const diffMs = exp.getTime() - now.getTime();
          daysToExpiry = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
          isExpired = daysToExpiry < 0;
          isExpiringSoon = daysToExpiry >= 0 && daysToExpiry <= 60;
        }
      }

      const supplierReturnWindowDays =
        item.supplier_return_window_days == null
          ? null
          : Number(item.supplier_return_window_days);
      const daysToReturnDeadline =
        daysToExpiry != null && supplierReturnWindowDays != null
          ? daysToExpiry - supplierReturnWindowDays
          : null;
      const isReturnWindowActive =
        daysToReturnDeadline != null && daysToReturnDeadline >= 0 && daysToReturnDeadline <= 30;
      const isReturnEligibilityExpired =
        daysToReturnDeadline != null && daysToReturnDeadline < 0 && (daysToExpiry ?? 0) >= 0;

      const currentStock = Number(item.current_stock ?? 0);
      const reorderLevel = numberOrNull(item.reorder_level);
      const isLowStock = reorderLevel != null && currentStock <= reorderLevel;

      return {
        id: item.id,
        clinic_slug: item.clinic_slug,
        brand_name: item.brand_name,
        generic_name: item.generic_name,
        dosage_form: item.dosage_form,
        strength: item.strength,
        batch_number: item.batch_number,
        expiry_date: item.expiry_date,
        days_to_expiry: daysToExpiry,
        is_expiring_soon: isExpiringSoon,
        is_expired: isExpired,
        supplier_name: item.supplier_name,
        supplier_id: item.supplier_id,
        supplier_return_window_days: supplierReturnWindowDays,
        days_to_return_deadline: daysToReturnDeadline,
        is_return_window_active: isReturnWindowActive,
        is_return_eligibility_expired: isReturnEligibilityExpired,
        is_recalled: Boolean(item.is_recalled),
        recall_reason: item.recall_reason || null,
        schedule_type: item.schedule_type || null,
        current_stock: currentStock,
        reorder_level: reorderLevel,
        is_low_stock: isLowStock,
        purchase_price: numberOrNull(item.purchase_price),
        mrp: numberOrNull(item.mrp),
        selling_price: numberOrNull(item.selling_price),
        gst_rate: numberOrNull(item.gst_rate),
        hsn_code: item.hsn_code || null,
        manufacturer: item.manufacturer || null,
        rack_location: item.rack_location || null,
        created_at: item.created_at,
      };
    });

    let filteredItems = items;
    if (filterType === "expiring_soon") {
      filteredItems = items.filter((i) => i.is_expiring_soon || i.is_expired);
    } else if (filterType === "return_eligible") {
      filteredItems = items.filter((i) => i.is_return_window_active || i.is_expiring_soon);
    } else if (filterType === "low_stock") {
      filteredItems = items.filter((i) => i.is_low_stock);
    } else if (filterType === "recalled") {
      filteredItems = items.filter((i) => i.is_recalled);
    } else if (filterType === "schedule_h1") {
      filteredItems = items.filter((i) => i.schedule_type === "Schedule H1");
    }

    const totalStockUnits = items.reduce((acc, curr) => acc + curr.current_stock, 0);
    const totalInventoryMrp = items.reduce(
      (acc, curr) => acc + curr.current_stock * (curr.mrp ?? 0),
      0
    );

    return NextResponse.json({
      items: filteredItems,
      summary: {
        total_skus: items.length,
        total_stock_units: totalStockUnits,
        total_inventory_mrp: totalInventoryMrp,
        low_stock_count: items.filter((i) => i.is_low_stock).length,
        expiring_soon_count: items.filter((i) => i.is_expiring_soon || i.is_expired).length,
        return_eligible_count: items.filter((i) => i.is_return_window_active).length,
        recalled_count: items.filter((i) => i.is_recalled).length,
        schedule_h1_count: items.filter((i) => i.schedule_type === "Schedule H1").length,
      },
    });
  } catch (error: any) {
    console.error("GET /api/pharmacy/inventory error:", error);
    return apiError(500, "Failed to load pharmacy inventory.", "internal_error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    const body = await req.json();
    const {
      brand_name,
      generic_name = null,
      dosage_form = null,
      strength = null,
      batch_number,
      expiry_date,
      current_stock,
      reorder_level = null,
      purchase_price = null,
      mrp = null,
      selling_price = null,
      gst_rate = null,
      rack_location = null,
      manufacturer = null,
      hsn_code = null,
      supplier_name = null,
      supplier_id = null,
      supplier_return_window_days = null,
      schedule_type = null,
    } = body;

    if (!brand_name || !batch_number || !expiry_date) {
      return apiError(
        400,
        "brand_name, batch_number and expiry_date are required.",
        "invalid_input"
      );
    }

    const stock = Number(current_stock);
    if (!Number.isInteger(stock) || stock < 0) {
      return apiError(
        400,
        "current_stock must be a non-negative whole number.",
        "invalid_stock"
      );
    }

    const selling = numberOrNull(selling_price);
    const mrpValue = numberOrNull(mrp);
    if (selling == null && mrpValue == null) {
      return apiError(
        400,
        "Provide at least one of selling_price or mrp.",
        "price_required"
      );
    }

    const id = randomUUID();

    const inserted = await sql`
      INSERT INTO pharmacy_items (
        id, clinic_slug, brand_name, generic_name, dosage_form,
        strength, batch_number, expiry_date, current_stock, reorder_level,
        purchase_price, mrp, selling_price, gst_rate, rack_location,
        manufacturer, hsn_code, supplier_name, supplier_id,
        supplier_return_window_days, schedule_type, created_at
      ) VALUES (
        ${id},
        ${clinicSlug},
        ${String(brand_name)},
        ${generic_name ? String(generic_name).toUpperCase() : null},
        ${dosage_form},
        ${strength},
        ${String(batch_number)},
        ${String(expiry_date)},
        ${stock},
        ${reorder_level == null ? null : Number(reorder_level)},
        ${numberOrNull(purchase_price)},
        ${mrpValue},
        ${selling},
        ${numberOrNull(gst_rate)},
        ${rack_location},
        ${manufacturer},
        ${hsn_code},
        ${supplier_name},
        ${supplier_id},
        ${supplier_return_window_days == null ? null : Number(supplier_return_window_days)},
        ${schedule_type},
        NOW()
      )
      RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "pharmacy.inventory.create",
      entity: "pharmacy_item",
      entityId: id,
      after: {
        brand_name,
        batch_number,
        expiry_date,
        current_stock: stock,
      },
      request: req,
    });

    return NextResponse.json({ status: "success", item: inserted[0] });
  } catch (error: any) {
    console.error("POST /api/pharmacy/inventory error:", error);
    return apiError(500, "Failed to add inventory batch.", "internal_error");
  }
}
