import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      shift_name = "Evening Shift (14:00 - 21:00)",
      staff_name = "Aarav Sharma (Reception Lead)",
      doctor_name = "Dr. Rahul Sharma",
      total_patients = 0,
      gross_collections = 0,
      upi_amount = 0,
      cash_expected = 0,
      petty_cash_expenses = 0,
      petty_cash_remarks = "",
      net_cash_expected = 0,
      actual_cash_counted = 0,
      discrepancy = 0,
      denominations = [],
      notes = "",
      clinic_slug = "derma-care-dehradun"
    } = body;

    const id = randomUUID();
    const settlementNumber = `STL-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${new Date().getHours() < 14 ? "M" : "E"}-${Math.floor(100 + Math.random() * 900)}`;
    const todayStr = new Date().toISOString().split("T")[0];

    // Ensure clinic_shift_handovers exists
    await sql`
      CREATE TABLE IF NOT EXISTS clinic_shift_handovers (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clinic_slug TEXT NOT NULL DEFAULT 'derma-care-dehradun',
        shift_name TEXT NOT NULL,
        staff_name TEXT NOT NULL,
        doctor_name TEXT,
        shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
        opening_float NUMERIC(10,2) DEFAULT 2000.00,
        expected_cash NUMERIC(10,2) NOT NULL,
        counted_cash NUMERIC(10,2) NOT NULL,
        variance NUMERIC(10,2) NOT NULL,
        variance_percentage NUMERIC(5,2) DEFAULT 0,
        variance_status TEXT DEFAULT 'BALANCED',
        is_pos_locked BOOLEAN DEFAULT false,
        manager_override_by TEXT,
        notes TEXT,
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Also ensure settlements table exists if queried
    await sql`
      CREATE TABLE IF NOT EXISTS settlements (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        settlement_number TEXT NOT NULL UNIQUE,
        clinic_slug TEXT NOT NULL DEFAULT 'derma-care-dehradun',
        shift_name TEXT NOT NULL,
        shift_date DATE NOT NULL DEFAULT CURRENT_DATE,
        staff_name TEXT NOT NULL,
        doctor_name TEXT,
        total_patients INTEGER DEFAULT 0,
        gross_collections NUMERIC(10,2) DEFAULT 0,
        upi_amount NUMERIC(10,2) DEFAULT 0,
        cash_expected NUMERIC(10,2) DEFAULT 0,
        petty_cash_expenses NUMERIC(10,2) DEFAULT 0,
        petty_cash_remarks TEXT,
        net_cash_expected NUMERIC(10,2) DEFAULT 0,
        actual_cash_counted NUMERIC(10,2) DEFAULT 0,
        discrepancy NUMERIC(10,2) DEFAULT 0,
        denominations JSONB DEFAULT '[]'::jsonb,
        notes TEXT,
        status TEXT DEFAULT 'SETTLED',
        created_at TIMESTAMPTZ DEFAULT NOW()
      );
    `;

    // Insert into settlements
    const inserted = await sql`
      INSERT INTO settlements (
        id, settlement_number, clinic_slug, shift_name, shift_date,
        staff_name, doctor_name, total_patients, gross_collections,
        upi_amount, cash_expected, petty_cash_expenses, petty_cash_remarks,
        net_cash_expected, actual_cash_counted, discrepancy, denominations,
        notes, status, created_at
      ) VALUES (
        ${id}, ${settlementNumber}, ${clinic_slug}, ${shift_name}, ${todayStr},
        ${staff_name}, ${doctor_name}, ${Number(total_patients)}, ${Number(gross_collections)},
        ${Number(upi_amount)}, ${Number(cash_expected)}, ${Number(petty_cash_expenses)}, ${petty_cash_remarks},
        ${Number(net_cash_expected)}, ${Number(actual_cash_counted)}, ${Number(discrepancy)}, ${JSON.stringify(denominations)},
        ${notes}, 'SETTLED', NOW()
      )
      RETURNING *;
    `;

    const settlement = inserted[0] || {
      id,
      settlement_number: settlementNumber,
      shift_name,
      shift_date: todayStr,
      staff_name,
      doctor_name,
      total_patients: Number(total_patients),
      gross_collections: Number(gross_collections),
      upi_amount: Number(upi_amount),
      cash_expected: Number(cash_expected),
      petty_cash_expenses: Number(petty_cash_expenses),
      petty_cash_remarks,
      net_cash_expected: Number(net_cash_expected),
      actual_cash_counted: Number(actual_cash_counted),
      discrepancy: Number(discrepancy),
      denominations,
      notes,
      created_at: new Date().toISOString()
    };

    return NextResponse.json({
      success: true,
      message: "Shift settled and locked successfully in clinic ledger.",
      settlement
    });
  } catch (error: any) {
    console.error("Shift settlement error:", error);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
