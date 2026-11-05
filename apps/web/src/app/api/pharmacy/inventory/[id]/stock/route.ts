import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Set an item's stock by id (PUT variant used by the stock editor).
 * Same tenant scoping and audit as the POST adjust-stock route.
 */
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    const { id } = await params;
    const body = await req.json();
    const { new_stock, reason = null } = body;

    if (new_stock === undefined || new_stock === null) {
      return apiError(400, "new_stock is required.", "invalid_input");
    }

    const stock = Number(new_stock);
    if (!Number.isInteger(stock) || stock < 0) {
      return apiError(
        400,
        "new_stock must be a non-negative whole number.",
        "invalid_stock"
      );
    }

    const existing = await sql`
      SELECT id, current_stock FROM pharmacy_items
      WHERE id::text = ${String(id)}
        AND clinic_slug = ${clinicSlug}
      LIMIT 1;
    `;
    if (existing.length === 0) {
      return apiError(404, "Item not found in your clinic.", "item_not_found");
    }

    const updated = await sql`
      UPDATE pharmacy_items
      SET current_stock = ${stock}
      WHERE id::text = ${String(id)}
        AND clinic_slug = ${clinicSlug}
      RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "pharmacy.inventory.adjust",
      entity: "pharmacy_item",
      entityId: String(id),
      before: { current_stock: existing[0].current_stock },
      after: { current_stock: stock, reason },
      request: req,
    });

    return NextResponse.json({ status: "success", item: updated[0] });
  } catch (error: any) {
    console.error("PUT /api/pharmacy/inventory/[id]/stock error:", error);
    return apiError(500, "Failed to adjust stock.", "internal_error");
  }
}
