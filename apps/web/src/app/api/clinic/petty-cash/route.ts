import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinic_slug") || "derma-care-dehradun";

    // 1. Fetch Petty Cash Float status
    let floatRows = await sql`
      SELECT * FROM clinic_petty_cash_float
      WHERE clinic_slug = ${clinicSlug}
      LIMIT 1;
    `;

    if (floatRows.length === 0) {
      // Auto-initialize if not yet created
      floatRows = await sql`
        INSERT INTO clinic_petty_cash_float (
          clinic_slug, target_float, current_balance, min_threshold, 
          last_replenished_at, last_replenished_by, status
        ) VALUES (
          ${clinicSlug}, 2000.0, 1450.0, 800.0, NOW(), 'Dr. Rahul Sharma', 'HEALTHY'
        ) RETURNING *;
      `;
    }

    const floatRecord = floatRows[0];
    const currentBalance = Number(floatRecord.current_balance || 0);
    const minThreshold = Number(floatRecord.min_threshold || 800);
    const isLowFloat = currentBalance < minThreshold;

    // Update status if needed
    const currentStatus = currentBalance <= 0 
      ? "DEPLETED" 
      : (isLowFloat ? "LOW_FLOAT_ALERT" : "HEALTHY");

    if (floatRecord.status !== currentStatus) {
      await sql`
        UPDATE clinic_petty_cash_float
        SET status = ${currentStatus}, updated_at = NOW()
        WHERE id = ${floatRecord.id};
      `;
      floatRecord.status = currentStatus;
    }

    // 2. Fetch recent ledger entries
    const ledger = await sql`
      SELECT * FROM clinic_petty_cash_ledger
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY created_at DESC
      LIMIT 15;
    `;

    return NextResponse.json({
      float: {
        id: floatRecord.id,
        target_float: Number(floatRecord.target_float),
        current_balance: currentBalance,
        min_threshold: minThreshold,
        status: currentStatus,
        is_low_float: isLowFloat,
        last_replenished_at: floatRecord.last_replenished_at,
        last_replenished_by: floatRecord.last_replenished_by
      },
      ledger
    });
  } catch (error: any) {
    console.error("GET /api/clinic/petty-cash error:", error);
    return NextResponse.json({ error: error.message || "Failed to load petty cash float" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clinic_slug = "derma-care-dehradun",
      action = "replenish",
      amount,
      source_or_recipient = "Main Cash Safe Transfer",
      voucher_id,
      recorded_by = "Pooja Verma (Front Desk)",
      notes
    } = body;

    if (!amount || Number(amount) <= 0) {
      return NextResponse.json({ error: "Valid amount is required" }, { status: 400 });
    }

    const numAmount = Number(amount);

    // Fetch current float
    const floatRows = await sql`
      SELECT * FROM clinic_petty_cash_float
      WHERE clinic_slug = ${clinic_slug}
      LIMIT 1;
    `;

    const floatRecord = floatRows[0] || {
      target_float: 2000.0,
      current_balance: 1450.0,
      min_threshold: 800.0
    };

    let newBalance = Number(floatRecord.current_balance);

    if (action === "replenish") {
      newBalance += numAmount;
    } else {
      newBalance = Math.max(0, newBalance - numAmount);
    }

    const newStatus = newBalance < Number(floatRecord.min_threshold || 800) ? "LOW_FLOAT_ALERT" : "HEALTHY";

    // Update float table
    await sql`
      UPDATE clinic_petty_cash_float
      SET 
        current_balance = ${newBalance},
        status = ${newStatus},
        last_replenished_at = ${action === "replenish" ? sql`NOW()` : sql`last_replenished_at`},
        last_replenished_by = ${action === "replenish" ? recorded_by : sql`last_replenished_by`},
        updated_at = NOW()
      WHERE clinic_slug = ${clinic_slug};
    `;

    // Log in ledger
    const id = randomUUID();
    const entryType = action === "replenish" ? "REPLENISHMENT" : "DISBURSEMENT";

    const ledgerEntry = await sql`
      INSERT INTO clinic_petty_cash_ledger (
        id, clinic_slug, entry_type, amount, running_balance,
        source_or_recipient, voucher_id, recorded_by, notes, created_at
      ) VALUES (
        ${id},
        ${clinic_slug},
        ${entryType},
        ${numAmount},
        ${newBalance},
        ${source_or_recipient},
        ${voucher_id || (action === "replenish" ? `FLOAT-REPL-${Date.now().toString().slice(-4)}` : null)},
        ${recorded_by},
        ${notes || (action === "replenish" ? "Float replenishment from main cash counter" : "Cash disbursement for front desk petty voucher")},
        NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({
      status: "success",
      message: action === "replenish"
        ? `✓ Petty Cash Float replenished with ₹${numAmount.toLocaleString("en-IN")}. Current balance: ₹${newBalance.toLocaleString("en-IN")}.`
        : `✓ Petty Cash disbursement of ₹${numAmount.toLocaleString("en-IN")} recorded. Remaining balance: ₹${newBalance.toLocaleString("en-IN")}.`,
      current_balance: newBalance,
      float_status: newStatus,
      entry: ledgerEntry[0]
    });
  } catch (error: any) {
    console.error("POST /api/clinic/petty-cash error:", error);
    return NextResponse.json({ error: error.message || "Failed to update petty cash" }, { status: 500 });
  }
}
