import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Inter-branch stock transfer within one clinic.
 *
 * Both the transfer row and the source-item lookup are scoped to the caller's
 * clinic. Dispatch and receipt actors are the authenticated users, and outlet
 * names are required rather than filled with sample branches.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    const body = await req.json();
    const {
      action = "dispatch",
      transfer_id,
      from_outlet,
      to_outlet,
      item_id = null,
      brand_name,
      batch_number,
      quantity,
      notes = null,
    } = body;

    if (action === "dispatch") {
      const transferQty = Number(quantity);
      if (!Number.isInteger(transferQty) || transferQty <= 0) {
        return apiError(
          400,
          "quantity must be a positive whole number.",
          "invalid_quantity"
        );
      }
      if (!from_outlet || !to_outlet) {
        return apiError(
          400,
          "from_outlet and to_outlet are required.",
          "outlet_required"
        );
      }
      if (String(from_outlet).trim() === String(to_outlet).trim()) {
        return apiError(
          400,
          "Source and destination outlets must differ.",
          "same_outlet"
        );
      }
      if (!brand_name || !batch_number) {
        return apiError(
          400,
          "brand_name and batch_number are required.",
          "invalid_input"
        );
      }

      if (item_id) {
        const itemRows = await sql`
          SELECT current_stock, brand_name, batch_number
          FROM pharmacy_items
          WHERE id::text = ${String(item_id)}
            AND clinic_slug = ${clinicSlug}
          LIMIT 1;
        `;
        if (itemRows.length === 0) {
          return apiError(404, "Item not found in your clinic.", "item_not_found");
        }
        if (Number(itemRows[0].current_stock || 0) < transferQty) {
          return apiError(
            400,
            `Insufficient stock at source — only ${itemRows[0].current_stock ?? 0} on hand.`,
            "insufficient_stock"
          );
        }

        await sql`
          UPDATE pharmacy_items
          SET current_stock = GREATEST(0, current_stock - ${transferQty})
          WHERE id::text = ${String(item_id)}
            AND clinic_slug = ${clinicSlug};
        `;
      }

      const id = randomUUID();
      const transferNum = `TRF-${Date.now().toString().slice(-6)}`;

      const inserted = await sql`
        INSERT INTO pharmacy_stock_transfers (
          id, clinic_slug, transfer_number, from_outlet, to_outlet, item_id,
          brand_name, batch_number, quantity, status, dispatched_by,
          notes, created_at
        ) VALUES (
          ${id},
          ${clinicSlug},
          ${transferNum},
          ${String(from_outlet)},
          ${String(to_outlet)},
          ${item_id ? String(item_id) : null},
          ${String(brand_name)},
          ${String(batch_number)},
          ${transferQty},
          'in_transit',
          ${auth.auth.user.full_name},
          ${notes},
          NOW()
        )
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "pharmacy.transfer.dispatch",
        entity: "pharmacy_stock_transfer",
        entityId: id,
        after: {
          transfer_number: transferNum,
          from_outlet,
          to_outlet,
          brand_name,
          batch_number,
          quantity: transferQty,
        },
        request: req,
      });

      return NextResponse.json({
        success: true,
        message: `Transfer ${transferNum} dispatched. ${transferQty} units of ${brand_name} are in transit.`,
        transfer: inserted[0],
      });
    }

    if (action === "receive") {
      if (!transfer_id) {
        return apiError(
          400,
          "transfer_id is required to acknowledge receipt.",
          "invalid_input"
        );
      }

      const updated = await sql`
        UPDATE pharmacy_stock_transfers
        SET
          status = 'received',
          received_by = ${auth.auth.user.full_name},
          received_at = NOW()
        WHERE (id::text = ${String(transfer_id)} OR transfer_number = ${String(transfer_id)})
          AND clinic_slug = ${clinicSlug}
          AND status = 'in_transit'
        RETURNING *;
      `;

      if (updated.length === 0) {
        return apiError(
          404,
          "In-transit transfer not found in your clinic.",
          "transfer_not_found"
        );
      }

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "pharmacy.transfer.receive",
        entity: "pharmacy_stock_transfer",
        entityId: String(updated[0].id),
        after: { transfer_number: updated[0].transfer_number },
        request: req,
      });

      return NextResponse.json({
        success: true,
        message: `Transfer ${updated[0].transfer_number} received and reconciled at the destination outlet.`,
        transfer: updated[0],
      });
    }

    return apiError(400, "Unknown action.", "invalid_action");
  } catch (error: any) {
    console.error("POST /api/pharmacy/transfers error:", error);
    return apiError(500, "Failed to process transfer.", "internal_error");
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;

    const transfers = await sql`
      SELECT * FROM pharmacy_stock_transfers
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY created_at DESC
      LIMIT 50;
    `;

    return NextResponse.json({
      transfers,
      in_transit_count: transfers.filter((t: any) => t.status === "in_transit").length,
    });
  } catch (error: any) {
    console.error("GET /api/pharmacy/transfers error:", error);
    return apiError(500, "Failed to load transfers.", "internal_error");
  }
}
