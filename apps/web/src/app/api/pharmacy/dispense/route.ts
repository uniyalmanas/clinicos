import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Dispense medicines against a prescription (or a documented walk-in).
 *
 * Tenant, stock, recall state, patient identity and prescriber details all come
 * from the database. Nothing is defaulted: no sample clinic, doctor, address or
 * "duty pharmacist" name. Schedule H1 sales are logged with the authenticated
 * pharmacist and the prescriber's real council registration.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    const body = await req.json();
    const {
      prescription_number = null,
      patient_name,
      patient_phone = null,
      patient_address = null,
      doctor_name,
      doctor_reg_number = null,
      items = [],
      subtotal = null,
      discount = null,
      gst_amount = null,
      total_amount = null,
      payment_mode = null,
      payment_notes = null,
      is_offline_reconciliation = false,
    } = body;

    if (!Array.isArray(items) || items.length === 0) {
      return apiError(400, "At least one item is required.", "invalid_input");
    }

    // Resolve the prescription when one is supplied. The prescription must
    // belong to this clinic.
    let prescription: any = null;
    if (prescription_number) {
      const rows = await sql`
        SELECT prescription_number, patient_name, patient_phone, doctor_name,
               doctor_reg_number
        FROM prescriptions
        WHERE prescription_number = ${String(prescription_number)}
          AND clinic_id::text = ${clinicId}
        LIMIT 1;
      `;
      if (rows.length === 0) {
        return apiError(
          404,
          "Prescription not found in your clinic.",
          "prescription_not_found"
        );
      }
      prescription = rows[0];
    }

    const finalPatientName = String(patient_name || prescription?.patient_name || "").trim();
    const finalPatientPhone = String(patient_phone || prescription?.patient_phone || "").trim();
    const finalDoctorName = String(doctor_name || prescription?.doctor_name || "").trim();
    const finalDoctorReg = String(
      doctor_reg_number || prescription?.doctor_reg_number || ""
    ).trim();

    if (!finalPatientName) {
      return apiError(400, "patient_name is required.", "patient_required");
    }
    if (!finalDoctorName) {
      return apiError(400, "doctor_name is required.", "doctor_required");
    }

    // Validate every line before touching stock.
    const lines = items.map((item: any, index: number) => {
      const qty = Number(item.quantity ?? 1);
      if (!Number.isFinite(qty) || qty <= 0) {
        throw Object.assign(new Error(`Item ${index + 1} has an invalid quantity.`), {
          status: 400,
          code: "invalid_quantity",
        });
      }
      if (!item.brand_name) {
        throw Object.assign(new Error(`Item ${index + 1} is missing brand_name.`), {
          status: 400,
          code: "invalid_item",
        });
      }
      return { ...item, quantity: qty };
    });

    // Pre-flight: recalls and stock for every packaged item.
    for (const item of lines) {
      if (item.item_id && !String(item.item_id).startsWith("manual-")) {
        const itemRows = await sql`
          SELECT brand_name, batch_number, is_recalled, recall_reason, current_stock, schedule_type
          FROM pharmacy_items
          WHERE id::text = ${String(item.item_id)}
            AND clinic_slug = ${clinicSlug}
          LIMIT 1;
        `;
        if (itemRows.length === 0) {
          return apiError(
            404,
            `Item "${item.brand_name}" is not in your clinic's inventory.`,
            "item_not_found"
          );
        }
        const matched = itemRows[0];
        if (matched.is_recalled) {
          return apiError(
            403,
            `Dispensing blocked: batch ${matched.batch_number} of "${matched.brand_name}" is under CDSCO recall (${
              matched.recall_reason || "regulatory safety notice"
            }).`,
            "drug_recalled"
          );
        }
        if (Number(matched.current_stock || 0) < item.quantity) {
          return apiError(
            409,
            `Insufficient stock for "${matched.brand_name}" (batch ${matched.batch_number}): ${
              matched.current_stock ?? 0
            } on hand.`,
            "insufficient_stock"
          );
        }
      }
    }

    // Atomic conditional decrement. Any failure rolls back the lines already
    // decremented so stock never silently disappears.
    const depleted: Array<{ item_id: string; qty: number }> = [];
    for (const item of lines) {
      if (item.item_id && !String(item.item_id).startsWith("manual-")) {
        const updated = await sql`
          UPDATE pharmacy_items
          SET current_stock = current_stock - ${item.quantity}
          WHERE id::text = ${String(item.item_id)}
            AND clinic_slug = ${clinicSlug}
            AND current_stock >= ${item.quantity}
            AND (is_recalled IS NULL OR is_recalled = false)
          RETURNING id;
        `;

        if (updated.length === 0) {
          for (const d of depleted) {
            await sql`
              UPDATE pharmacy_items
              SET current_stock = current_stock + ${d.qty}
              WHERE id::text = ${d.item_id}
                AND clinic_slug = ${clinicSlug};
            `;
          }
          return apiError(
            409,
            `Insufficient stock for "${item.brand_name}" — it may have just been dispensed at another counter. Refresh and retry.`,
            "concurrency_stock_depleted"
          );
        }
        depleted.push({ item_id: String(item.item_id), qty: item.quantity });
      }
    }

    const toMoney = (value: any, fallback: number | null) => {
      if (value === undefined || value === null || value === "") return fallback;
      const n = Number(value);
      return Number.isFinite(n) ? n : fallback;
    };

    // Recompute the bill from the line totals rather than trusting a single
    // client-supplied grand total.
    const computedSubtotal = lines.reduce((acc: number, item: any) => {
      const unit = toMoney(item.unit_price ?? item.selling_price ?? item.mrp, null);
      if (unit == null) return acc;
      return acc + unit * item.quantity;
    }, 0);

    const finalSubtotal = toMoney(subtotal, computedSubtotal) as number;
    const finalDiscount = toMoney(discount, 0) as number;
    const finalGst = toMoney(gst_amount, 0) as number;
    const finalTotal = toMoney(total_amount, finalSubtotal + finalGst - finalDiscount) as number;

    if (finalDiscount < 0 || finalGst < 0 || finalTotal < 0) {
      return apiError(400, "Bill amounts cannot be negative.", "invalid_amount");
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
        ${clinicSlug},
        ${billNumber},
        ${prescription_number || null},
        ${finalPatientName},
        ${finalPatientPhone || null},
        ${finalDoctorName},
        ${JSON.stringify(lines)},
        ${finalSubtotal},
        ${finalDiscount},
        ${finalGst},
        ${finalTotal},
        ${payment_mode || null},
        'dispensed',
        NOW()
      )
      RETURNING *;
    `;

    // Schedule H1 register (Drugs & Cosmetics Rule 65).
    for (const item of lines) {
      if (item.schedule_type === "Schedule H1" || item.is_schedule_h1) {
        if (!finalDoctorReg) {
          return apiError(
            422,
            `"${item.brand_name}" is a Schedule H1 drug. The prescriber's council registration number is required for the H1 register.`,
            "registration_required"
          );
        }
        await sql`
          INSERT INTO pharmacy_schedule_h1_logs (
            id, bill_number, clinic_slug, patient_name, patient_phone,
            patient_address, doctor_name, doctor_reg_number, drug_name,
            batch_number, quantity, pharmacist_name, dispensed_at
          ) VALUES (
            ${randomUUID()},
            ${billNumber},
            ${clinicSlug},
            ${finalPatientName},
            ${finalPatientPhone || null},
            ${patient_address},
            ${finalDoctorName},
            ${finalDoctorReg},
            ${item.brand_name},
            ${item.batch_number || null},
            ${item.quantity},
            ${auth.auth.user.full_name},
            NOW()
          );
        `;
      }
    }

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "pharmacy.dispense",
      entity: "pharmacy_dispense",
      entityId: id,
      after: {
        bill_number: billNumber,
        prescription_number,
        patient_name: finalPatientName,
        total_amount: finalTotal,
        payment_mode,
      },
      request: req,
    });

    return NextResponse.json({
      status: "success",
      bill: {
        ...inserted[0],
        items: lines,
        is_offline_reconciliation: Boolean(is_offline_reconciliation),
        payment_notes: payment_notes || null,
      },
    });
  } catch (error: any) {
    console.error("POST /api/pharmacy/dispense error:", error);
    if (error?.status) {
      return apiError(error.status, error.message, error.code || "invalid_input");
    }
    return apiError(500, "Failed to dispense pharmacy items.", "internal_error");
  }
}
