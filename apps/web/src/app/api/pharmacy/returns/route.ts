import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Return-to-supplier challan.
 *
 * Stock, brand, supplier and unit price come from the clinic's own inventory
 * row when an item_id is supplied. The reason is required — a debit note is
 * never issued against an assumed excuse.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    const body = await req.json();
    const {
      item_id = null,
      batch_number,
      brand_name,
      supplier_name = null,
      quantity,
      unit_purchase_price = null,
      reason,
      notes = null,
    } = body;

    const returnQty = Number(quantity);
    if (!Number.isInteger(returnQty) || returnQty <= 0) {
      return apiError(
        400,
        "quantity must be a positive whole number.",
        "invalid_quantity"
      );
    }

    const reasonText = String(reason || "").trim();
    if (!reasonText) {
      return apiError(
        400,
        "reason is required for a supplier return.",
        "reason_required"
      );
    }

    let resolvedBrand = brand_name ? String(brand_name) : null;
    let resolvedBatch = batch_number ? String(batch_number) : null;
    let resolvedSupplier = supplier_name ? String(supplier_name) : null;
    let unitPrice =
      unit_purchase_price === null || unit_purchase_price === ""
        ? null
        : Number(unit_purchase_price);

    if (item_id) {
      const existing = await sql`
        SELECT current_stock, purchase_price, brand_name, batch_number, supplier_name
        FROM pharmacy_items
        WHERE id::text = ${String(item_id)}
          AND clinic_slug = ${clinicSlug}
        LIMIT 1;
      `;
      if (existing.length === 0) {
        return apiError(404, "Item not found in your clinic.", "item_not_found");
      }
      const item = existing[0];
      if (Number(item.current_stock || 0) < returnQty) {
        return apiError(
          400,
          `Cannot return ${returnQty} units — only ${item.current_stock ?? 0} on hand.`,
          "insufficient_stock"
        );
      }
      resolvedBrand = resolvedBrand || item.brand_name;
      resolvedBatch = resolvedBatch || item.batch_number;
      resolvedSupplier = resolvedSupplier || item.supplier_name;
      if (unitPrice === null && item.purchase_price != null) {
        unitPrice = Number(item.purchase_price);
      }
    }

    if (!resolvedBatch || !resolvedBrand) {
      return apiError(
        400,
        "batch_number and brand_name are required (or supply a valid item_id).",
        "invalid_input"
      );
    }
    if (!resolvedSupplier) {
      return apiError(
        400,
        "supplier_name is required — it is not recorded for this item.",
        "supplier_required"
      );
    }
    if (unitPrice === null || !Number.isFinite(unitPrice) || unitPrice < 0) {
      return apiError(
        400,
        "unit_purchase_price is required — it is not recorded for this item.",
        "price_required"
      );
    }

    if (item_id) {
      await sql`
        UPDATE pharmacy_items
        SET current_stock = GREATEST(0, current_stock - ${returnQty})
        WHERE id::text = ${String(item_id)}
          AND clinic_slug = ${clinicSlug};
      `;
    }

    const totalDebit = Math.round(returnQty * unitPrice * 100) / 100;
    const challanNum = `RET-CHALLAN-${Date.now().toString().slice(-6)}`;
    const id = randomUUID();

    const inserted = await sql`
      INSERT INTO pharmacy_return_challans (
        id, challan_number, clinic_slug, supplier_name, batch_number,
        brand_name, quantity, unit_purchase_price, total_debit_amount,
        reason, status, notes, created_at
      ) VALUES (
        ${id},
        ${challanNum},
        ${clinicSlug},
        ${resolvedSupplier},
        ${resolvedBatch},
        ${resolvedBrand},
        ${returnQty},
        ${unitPrice},
        ${totalDebit},
        ${reasonText},
        'issued',
        ${notes},
        NOW()
      )
      RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "pharmacy.return.issue",
      entity: "pharmacy_return_challan",
      entityId: id,
      after: {
        challan_number: challanNum,
        batch_number: resolvedBatch,
        brand_name: resolvedBrand,
        quantity: returnQty,
        total_debit_amount: totalDebit,
        reason: reasonText,
      },
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: `Return challan ${challanNum} issued. ₹${totalDebit.toLocaleString(
        "en-IN"
      )} debited from supplier payables.`,
      challan: inserted[0],
    });
  } catch (error: any) {
    console.error("POST /api/pharmacy/returns error:", error);
    return apiError(500, "Failed to generate return challan.", "internal_error");
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;

    const challans = await sql`
      SELECT * FROM pharmacy_return_challans
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY created_at DESC
      LIMIT 50;
    `;

    return NextResponse.json({
      challans,
      total_challans: challans.length,
      total_debit_volume: challans.reduce(
        (acc: number, curr: any) => acc + Number(curr.total_debit_amount || 0),
        0
      ),
    });
  } catch (error: any) {
    console.error("GET /api/pharmacy/returns error:", error);
    return apiError(500, "Failed to fetch return challans.", "internal_error");
  }
}
