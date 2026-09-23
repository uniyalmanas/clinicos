import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      doctor_slug,
      doctor_name,
      amount,
      payment_mode = "upi",
      notes = "Visiting Doctor OPD Payout"
    } = body;

    if (!doctor_name || !amount) {
      return NextResponse.json({ error: "doctor_name and amount are required" }, { status: 400 });
    }

    const todayStr = new Date().toISOString().split("T")[0];
    const id = randomUUID();

    // Insert into expenses table as 'Staff Salary' / 'Doctor Revenue Split'
    const inserted = await sql`
      INSERT INTO expenses (
        id, clinic_slug, category, amount, description, 
        payment_mode, date, created_at
      ) VALUES (
        ${id},
        'derma-care-dehradun',
        'Staff Salary',
        ${Number(amount)},
        ${`Doctor Payout: ${doctor_name} (${notes})`},
        ${payment_mode},
        ${todayStr},
        NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({
      status: "success",
      expense: inserted[0]
    });
  } catch (error: any) {
    console.error("POST /api/clinic/settle-doctor-payout error:", error);
    return NextResponse.json({ error: error.message || "Failed to settle doctor payout" }, { status: 500 });
  }
}
