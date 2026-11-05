import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, ADMIN_ROLES, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/** Opening float is the drawer's recorded petty-cash reserve, never an assumption. */
async function currentOpeningFloat(clinicSlug: string): Promise<number> {
  const rows = await sql`
    SELECT current_balance
    FROM clinic_petty_cash_float
    WHERE clinic_slug = ${clinicSlug}
    LIMIT 1;
  `;
  return Number(rows[0]?.current_balance || 0);
}

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;
    const todayStr = new Date().toISOString().split("T")[0];

    // Fetch shift handovers
    const handovers = await sql`
      SELECT * FROM clinic_shift_handovers
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY created_at DESC
      LIMIT 10;
    `;

    // Calculate live cash drawer expected total for current shift
    const aptCash = await sql`
      SELECT COALESCE(SUM(fee_amount), 0) AS total_cash
      FROM appointments
      WHERE payment_status = 'paid'
        AND payment_mode = 'cash'
        AND clinic_id::text = ${clinicId}::text
        AND (appointment_date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;
    const cashApts = Number(aptCash[0]?.total_cash || 0);

    const pharmCash = await sql`
      SELECT COALESCE(SUM(total_amount), 0) AS total_cash
      FROM pharmacy_dispenses
      WHERE payment_mode = 'cash'
        AND clinic_slug = ${clinicSlug}
        AND created_at::date = CURRENT_DATE;
    `;
    const cashPharm = Number(pharmCash[0]?.total_cash || 0);

    const expCash = await sql`
      SELECT COALESCE(SUM(amount), 0) AS total_exp
      FROM expenses
      WHERE payment_mode = 'cash'
        AND approval_status = 'APPROVED'
        AND clinic_slug = ${clinicSlug}
        AND (date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;
    const cashExpenses = Number(expCash[0]?.total_exp || 0);

    const openingFloat = await currentOpeningFloat(clinicSlug);
    const totalCashInflow = cashApts + cashPharm;
    const expectedDrawerCash = openingFloat + totalCashInflow - cashExpenses;

    const activeLock = handovers.find((h: any) => h.is_pos_locked);

    return NextResponse.json({
      handovers,
      current_drawer: {
        opening_float: openingFloat,
        cash_inflow: totalCashInflow,
        cash_expenses: cashExpenses,
        expected_cash: expectedDrawerCash,
        is_pos_locked: Boolean(activeLock),
        locked_reason: activeLock?.variance_reason || null,
        locked_shift_id: activeLock?.id || null,
      },
    });
  } catch (error: any) {
    console.error("GET /api/clinic/shifts error:", error);
    return apiError(500, "Failed to load shift handovers.", "internal_error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      action = "handover",
      shift_name,
      next_cashier_name = null,
      denominations = {},
      counted_cash,
      variance_reason,
    } = body;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;
    const cashier_name = auth.auth.user.full_name;

    // ACTION: UNLOCK POS — administrator-only, scoped to this clinic.
    if (action === "unlock_pos") {
      if (
        !auth.auth.isSuperAdmin &&
        !ADMIN_ROLES.map((r) => String(r)).includes(String(auth.auth.role))
      ) {
        return apiError(
          403,
          "Only a clinic owner or administrator can unlock the POS.",
          "admin_required"
        );
      }

      const { shift_id } = body;
      const updated = shift_id
        ? await sql`
            UPDATE clinic_shift_handovers
            SET
              is_pos_locked = false,
              manager_override_pin = 'AUTH_SESSION',
              manager_override_by = ${auth.auth.user.full_name},
              handover_status = 'RECONCILED_OVERRIDE',
              updated_at = NOW()
            WHERE id = ${String(shift_id)}
              AND clinic_slug = ${clinicSlug}
            RETURNING *;
          `
        : await sql`
            UPDATE clinic_shift_handovers
            SET
              is_pos_locked = false,
              manager_override_pin = 'AUTH_SESSION',
              manager_override_by = ${auth.auth.user.full_name},
              handover_status = 'RECONCILED_OVERRIDE',
              updated_at = NOW()
            WHERE is_pos_locked = true
              AND clinic_slug = ${clinicSlug}
            RETURNING *;
          `;

      if (updated.length === 0) {
        return apiError(404, "No locked shift found for your clinic.", "shift_not_found");
      }

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "shift.pos.unlock",
        entity: "clinic_shift_handover",
        entityId: String(updated[0].id),
        request: req,
      });

      return NextResponse.json({
        status: "success",
        message: `POS unlocked by ${auth.auth.user.full_name}.`,
        unlocked_shift: updated[0],
      });
    }

    // ACTION: RECORD PHYSICAL CASH COUNT & SHIFT HANDOVER
    const countedNum = Number(counted_cash);
    if (counted_cash === undefined || counted_cash === null || !Number.isFinite(countedNum)) {
      return apiError(400, "counted_cash is required.", "counted_cash_required");
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const aptCash = await sql`
      SELECT COALESCE(SUM(fee_amount), 0) AS total_cash
      FROM appointments
      WHERE payment_status = 'paid'
        AND payment_mode = 'cash'
        AND clinic_id::text = ${clinicId}::text
        AND (appointment_date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;
    const cashApts = Number(aptCash[0]?.total_cash || 0);

    const pharmCash = await sql`
      SELECT COALESCE(SUM(total_amount), 0) AS total_cash
      FROM pharmacy_dispenses
      WHERE payment_mode = 'cash'
        AND clinic_slug = ${clinicSlug}
        AND created_at::date = CURRENT_DATE;
    `;
    const cashPharm = Number(pharmCash[0]?.total_cash || 0);

    const expCash = await sql`
      SELECT COALESCE(SUM(amount), 0) AS total_exp
      FROM expenses
      WHERE payment_mode = 'cash'
        AND approval_status = 'APPROVED'
        AND clinic_slug = ${clinicSlug}
        AND (date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;
    const cashExpenses = Number(expCash[0]?.total_exp || 0);

    const floatNum = await currentOpeningFloat(clinicSlug);
    const expectedCash = floatNum + cashApts + cashPharm - cashExpenses;
    const variance = countedNum - expectedCash;
    const variancePct =
      expectedCash > 0
        ? parseFloat(((Math.abs(variance) / expectedCash) * 100).toFixed(2))
        : 0;

    // Variance above ₹100 or 1% is a breach and needs an administrator.
    const isBreach = Math.abs(variance) > 100 || variancePct > 1.0;
    const isAdmin =
      auth.auth.isSuperAdmin ||
      ADMIN_ROLES.map((r) => String(r)).includes(String(auth.auth.role));

    let varianceStatus = "BALANCED";
    let isPosLocked = false;

    if (variance === 0) {
      varianceStatus = "BALANCED";
    } else if (!isBreach) {
      varianceStatus = "TOLERABLE_VARIANCE";
    } else if (isAdmin) {
      varianceStatus = "VARIANCE_AUTHORIZED";
    } else {
      varianceStatus = "VARIANCE_BREACH";
      isPosLocked = true;
    }

    const id = randomUUID();
    const finalShiftName =
      shift_name ||
      (new Date().getHours() < 14
        ? "Morning Shift (08:00 - 14:00)"
        : "Evening Shift (14:00 - 21:00)");

    const inserted = await sql`
      INSERT INTO clinic_shift_handovers (
        id, clinic_slug, shift_name, shift_date, cashier_name, next_cashier_name,
        opening_float, cash_inflow, cash_expenses, expected_cash, counted_cash,
        variance, variance_pct, variance_status, is_pos_locked, variance_reason,
        manager_override_pin, manager_override_by, handover_status, created_at
      ) VALUES (
        ${id},
        ${clinicSlug},
        ${finalShiftName},
        ${todayStr},
        ${cashier_name},
        ${next_cashier_name},
        ${floatNum},
        ${cashApts + cashPharm},
        ${cashExpenses},
        ${expectedCash},
        ${countedNum},
        ${variance},
        ${variancePct},
        ${varianceStatus},
        ${isPosLocked},
        ${variance_reason || (isBreach ? `Discrepancy of ₹${Math.abs(variance)} exceeds the ₹100/1% threshold.` : "Cash drawer balanced.")},
        ${isAdmin && isBreach ? "AUTH_SESSION" : null},
        ${isAdmin && isBreach ? `${auth.auth.user.full_name} (${auth.auth.role})` : null},
        ${isPosLocked ? "HANDOVER_BLOCKED" : "RECONCILED"},
        NOW()
      )
      RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "shift.handover",
      entity: "clinic_shift_handover",
      entityId: id,
      after: inserted[0] || null,
      request: req,
    });

    return NextResponse.json({
      status: "success",
      handover: inserted[0],
      is_pos_locked: isPosLocked,
      message: isPosLocked
        ? `Cash discrepancy of ₹${Math.abs(variance)} exceeds the ₹100 threshold. Next shift POS access is blocked until an administrator resolves it.`
        : `Shift handover reconciled. Drawer status: ${varianceStatus}.`,
    });
  } catch (error: any) {
    console.error("POST /api/clinic/shifts error:", error);
    return apiError(500, "Failed to record shift handover.", "internal_error");
  }
}
