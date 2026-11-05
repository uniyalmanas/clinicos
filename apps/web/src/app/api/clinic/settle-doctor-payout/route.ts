import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, ADMIN_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Settle a doctor payout.
 *
 * A payout moves money, so it requires an owner/administrator session. The
 * doctor must belong to the caller's clinic. The expense row records who
 * actually authorized it; no approval flags are pre-ticked.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: ADMIN_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    const body = await req.json();
    const {
      doctor_slug,
      doctor_name = null,
      amount,
      payment_mode,
      notes = null,
    } = body;

    if (!doctor_slug) {
      return apiError(400, "doctor_slug is required.", "doctor_required");
    }

    const payout = Number(amount);
    if (!Number.isFinite(payout) || payout <= 0) {
      return apiError(400, "amount must be a positive number.", "invalid_amount");
    }
    if (!payment_mode) {
      return apiError(400, "payment_mode is required.", "payment_mode_required");
    }

    const docRows = await sql`
      SELECT id, full_name, slug FROM doctors
      WHERE slug = ${String(doctor_slug)}
        AND (clinic_id::text = ${clinicId} OR clinic_slug = ${clinicSlug})
      LIMIT 1;
    `;
    if (docRows.length === 0) {
      return apiError(404, "Doctor not found in your clinic.", "doctor_not_found");
    }
    const doctor = docRows[0];
    const resolvedName = String(doctor_name || doctor.full_name);

    const todayStr = new Date().toISOString().split("T")[0];
    const recordedBy = `${auth.auth.user.full_name} (${auth.auth.role})`;

    const id = randomUUID();
    const inserted = await sql`
      INSERT INTO expenses (
        id, clinic_slug, title, category, amount,
        payment_mode, recorded_by, date, created_at,
        requires_approval, approval_status, approved_by,
        manager_pin_verified, ocr_verified
      ) VALUES (
        ${id},
        ${clinicSlug},
        ${`Doctor Payout: ${resolvedName}${notes ? ` (${notes})` : ""}`},
        'Staff Salary',
        ${payout},
        ${String(payment_mode)},
        ${recordedBy},
        ${todayStr},
        NOW(),
        false,
        'APPROVED',
        ${recordedBy},
        false,
        false
      )
      RETURNING *;
    `;

    // Mirror the payment into the payout ledger so reconciliation does not rely
    // on parsing expense titles.
    const existingLedger = await sql`
      SELECT id FROM payout_ledger
      WHERE clinic_id::text = ${clinicId}
        AND doctor_id::text = ${String(doctor.id)}
        AND period_start = ${todayStr}
        AND period_end = ${todayStr}
      LIMIT 1;
    `;
    if (existingLedger.length > 0) {
      await sql`
        UPDATE payout_ledger
        SET
          net_amount = ${payout},
          status = 'paid',
          approved_by = ${auth.auth.user.full_name},
          approved_at = NOW(),
          paid_at = NOW(),
          notes = ${notes}
        WHERE id = ${String(existingLedger[0].id)};
      `;
    } else {
      await sql`
        INSERT INTO payout_ledger (
          id, clinic_id, doctor_id, period_start, period_end,
          gross_amount, deductions, net_amount, split_pct, status,
          computed_at, approved_by, approved_at, paid_at, notes
        ) VALUES (
          ${randomUUID()},
          ${clinicId},
          ${String(doctor.id)},
          ${todayStr},
          ${todayStr},
          ${payout},
          0,
          ${payout},
          NULL,
          'paid',
          NOW(),
          ${auth.auth.user.full_name},
          NOW(),
          NOW(),
          ${notes}
        );
      `;
    }

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "payout.settle",
      entity: "doctor_payout",
      entityId: id,
      after: {
        doctor_slug: doctor.slug,
        doctor_name: resolvedName,
        amount: payout,
        payment_mode,
      },
      request: req,
    });

    return NextResponse.json({
      status: "success",
      message: `Payout of ₹${payout.toLocaleString("en-IN")} settled for ${resolvedName}.`,
      expense: inserted[0],
    });
  } catch (error: any) {
    console.error("POST /api/clinic/settle-doctor-payout error:", error);
    return apiError(500, "Failed to settle doctor payout.", "internal_error");
  }
}
