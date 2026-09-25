import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { authorizeClinicUser } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinic_slug") || "derma-care-dehradun";
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
        AND (appointment_date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;
    const cashApts = Number(aptCash[0]?.total_cash || 0);

    const pharmCash = await sql`
      SELECT COALESCE(SUM(total_amount), 0) AS total_cash
      FROM pharmacy_dispenses
      WHERE payment_mode = 'cash'
        AND created_at::date = CURRENT_DATE;
    `;
    const cashPharm = Number(pharmCash[0]?.total_cash || 0);

    const expCash = await sql`
      SELECT COALESCE(SUM(amount), 0) AS total_exp
      FROM expenses
      WHERE payment_mode = 'cash'
        AND approval_status = 'APPROVED'
        AND (date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;
    const cashExpenses = Number(expCash[0]?.total_exp || 0);

    const openingFloat = 2000.0;
    const totalCashInflow = cashApts + cashPharm;
    const expectedDrawerCash = openingFloat + totalCashInflow - cashExpenses;

    // Check if any recent shift has a POS lock
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
        locked_shift_id: activeLock?.id || null
      }
    });
  } catch (error: any) {
    console.error("GET /api/clinic/shifts error:", error);
    return NextResponse.json({ error: error.message || "Failed to load shift handovers" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clinic_slug = "derma-care-dehradun",
      action = "handover",
      shift_name,
      cashier_name = "Pooja Verma (Front Desk)",
      next_cashier_name = "Rohit Semwal (Evening Desk)",
      opening_float = 2000.0,
      denominations = {},
      counted_cash,
      variance_reason,
      manager_override_pin
    } = body;

    // ACTION: UNLOCK POS WITH MANAGER AUTHORIZATION
    if (action === "unlock_pos") {
      const { shift_id } = body;
      let managerName = "Clinic Administrator";
      try {
        const auth = await authorizeClinicUser(req, { requiredRoles: ["owner", "clinic_admin"] });
        managerName = `${auth.user.full_name} (${auth.membership.role})`;
      } catch (authErr: any) {
        return NextResponse.json({ error: authErr.message || "Invalid or unauthorized session. Practice Manager authorization required to unlock POS." }, { status: 403 });
      }

      let updated;
      if (shift_id) {
        updated = await sql`
          UPDATE clinic_shift_handovers
          SET 
            is_pos_locked = false,
            manager_override_pin = 'AUTH_SESSION',
            manager_override_by = ${managerName},
            handover_status = 'RECONCILED_OVERRIDE',
            updated_at = NOW()
          WHERE id = ${shift_id} OR is_pos_locked = true
          RETURNING *;
        `;
      } else {
        updated = await sql`
          UPDATE clinic_shift_handovers
          SET 
            is_pos_locked = false,
            manager_override_pin = 'AUTH_SESSION',
            manager_override_by = ${managerName},
            handover_status = 'RECONCILED_OVERRIDE',
            updated_at = NOW()
          WHERE is_pos_locked = true
          RETURNING *;
        `;
      }

      return NextResponse.json({
        status: "success",
        message: `POS successfully unlocked by ${managerName}. Next shift counter access granted.`,
        unlocked_shift: updated[0] || null
      });
    }

    // ACTION: RECORD PHYSICAL CASH COUNT & SHIFT HANDOVER
    if (counted_cash === undefined || counted_cash === null) {
      return NextResponse.json({ error: "counted_cash is required" }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // Compute expected cash
    const aptCash = await sql`
      SELECT COALESCE(SUM(fee_amount), 0) AS total_cash
      FROM appointments
      WHERE payment_status = 'paid' 
        AND payment_mode = 'cash'
        AND (appointment_date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;
    const cashApts = Number(aptCash[0]?.total_cash || 0);

    const expCash = await sql`
      SELECT COALESCE(SUM(amount), 0) AS total_exp
      FROM expenses
      WHERE payment_mode = 'cash'
        AND approval_status = 'APPROVED'
        AND (date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;
    const cashExpenses = Number(expCash[0]?.total_exp || 0);

    const floatNum = Number(opening_float) || 2000.0;
    const expectedCash = floatNum + cashApts - cashExpenses;
    const countedNum = Number(counted_cash);
    const variance = countedNum - expectedCash;
    const variancePct = expectedCash > 0 ? parseFloat(((Math.abs(variance) / expectedCash) * 100).toFixed(2)) : 0;

    // Variance Tolerance Logic (> ₹100 or > 1.0% of shift total)
    const isBreach = Math.abs(variance) > 100 || variancePct > 1.0;
    let isAuthorizedByManager = false;
    let overrideBy: string | null = null;

    if (isBreach) {
      try {
        const auth = await authorizeClinicUser(req, { requiredRoles: ["owner", "clinic_admin"] });
        isAuthorizedByManager = true;
        overrideBy = `${auth.user.full_name} (${auth.membership.role})`;
      } catch {
        isAuthorizedByManager = false;
      }
    }

    let varianceStatus = "BALANCED";
    let isPosLocked = false;

    if (Math.abs(variance) === 0) {
      varianceStatus = "BALANCED";
      isPosLocked = false;
    } else if (!isBreach) {
      varianceStatus = "TOLERABLE_VARIANCE";
      isPosLocked = false;
    } else {
      // Variance breach!
      if (isAuthorizedByManager) {
        varianceStatus = "VARIANCE_AUTHORIZED";
        isPosLocked = false;
      } else {
        varianceStatus = "VARIANCE_BREACH";
        isPosLocked = true; // Blocks next shift's POS access until resolved
      }
    }

    const id = randomUUID();
    const finalShiftName = shift_name || (new Date().getHours() < 14 ? "Morning Shift (08:00 - 14:00)" : "Evening Shift (14:00 - 21:00)");

    const inserted = await sql`
      INSERT INTO clinic_shift_handovers (
        id, clinic_slug, shift_name, shift_date, cashier_name, next_cashier_name,
        opening_float, cash_inflow, cash_expenses, expected_cash, counted_cash,
        variance, variance_pct, variance_status, is_pos_locked, variance_reason,
        manager_override_pin, manager_override_by, handover_status, created_at
      ) VALUES (
        ${id},
        ${clinic_slug},
        ${finalShiftName},
        ${todayStr},
        ${cashier_name},
        ${next_cashier_name},
        ${floatNum},
        ${cashApts},
        ${cashExpenses},
        ${expectedCash},
        ${countedNum},
        ${variance},
        ${variancePct},
        ${varianceStatus},
        ${isPosLocked},
        ${variance_reason || (isBreach ? `Discrepancy of ₹${Math.abs(variance)} exceeds ₹100/1% threshold.` : "Cash drawer balanced.")},
        ${isAuthorizedByManager ? "AUTH_SESSION" : null},
        ${overrideBy},
        ${isPosLocked ? "HANDOVER_BLOCKED" : "RECONCILED"},
        NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({
      status: "success",
      handover: inserted[0],
      is_pos_locked: isPosLocked,
      message: isPosLocked 
        ? `🚨 Cash Discrepancy (₹${Math.abs(variance)}) exceeds ₹100 threshold! Next Shift POS Access is BLOCKED until resolved by Manager PIN.`
        : `✓ Shift handover reconciled successfully. Drawer status: ${varianceStatus}.`
    });
  } catch (error: any) {
    console.error("POST /api/clinic/shifts error:", error);
    return NextResponse.json({ error: error.message || "Failed to record shift handover" }, { status: 500 });
  }
}
