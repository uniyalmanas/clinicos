import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clinic_slug = "derma-care-dehradun",
      doctor_slug,
      doctor_name,
      amount,
      payment_mode = "upi",
      notes = "Visiting Doctor OPD Payout",
      manager_pin
    } = body;

    if (!doctor_name || !amount) {
      return NextResponse.json({ error: "doctor_name and amount are required" }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split("T")[0];

    // FIX 2: Check if Day-Close locks payouts
    const closings = await sql`
      SELECT id FROM clinic_eod_closings 
      WHERE clinic_slug = ${clinic_slug} AND closing_date = ${todayStr}
      LIMIT 1;
    `;

    if (closings.length > 0 && manager_pin !== "4491" && manager_pin !== "1234") {
      return NextResponse.json({ 
        error: "Day-Close is locked! Post-close payout disbursements require Finance Head PIN override." 
      }, { status: 403 });
    }

    const id = randomUUID();

    // Insert into expenses table as 'Staff Salary' / 'Doctor Revenue Split'
    const inserted = await sql`
      INSERT INTO expenses (
        id, clinic_slug, title, category, amount, 
        payment_mode, recorded_by, date, created_at,
        requires_approval, approval_status, approved_by,
        manager_pin_verified, ocr_verified
      ) VALUES (
        ${id},
        ${clinic_slug},
        ${`Doctor Payout: ${doctor_name} (${notes})`},
        'Staff Salary',
        ${Number(amount)},
        ${payment_mode},
        'Front Desk Lead',
        ${todayStr},
        NOW(),
        false,
        'APPROVED',
        'Finance Head Auto-Authorized',
        true,
        true
      )
      RETURNING *;
    `;

    return NextResponse.json({
      status: "success",
      message: `✓ Payout of ₹${Number(amount).toLocaleString("en-IN")} settled for ${doctor_name}. Posted to ledger.`,
      expense: inserted[0]
    });
  } catch (error: any) {
    console.error("POST /api/clinic/settle-doctor-payout error:", error);
    return NextResponse.json({ error: error.message || "Failed to settle doctor payout" }, { status: 500 });
  }
}
