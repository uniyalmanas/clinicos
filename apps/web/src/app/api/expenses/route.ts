import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinic_slug") || "derma-care-dehradun";

    // 1. Fetch expenses
    const expensesRows = await sql`
      SELECT * FROM expenses 
      WHERE clinic_slug = ${clinicSlug} OR clinic_slug IS NULL
      ORDER BY date DESC, created_at DESC;
    `;

    // 2. Fetch appointment collections
    const aptRevenueQuery = await sql`
      SELECT COALESCE(SUM(fee_amount), 0) AS total_fee 
      FROM appointments 
      WHERE payment_status = 'paid';
    `;
    const appointmentCollections = Number(aptRevenueQuery[0]?.total_fee || 0);

    // 3. Fetch pharmacy collections
    const pharmRevenueQuery = await sql`
      SELECT COALESCE(SUM(total_amount), 0) AS total_pharm 
      FROM pharmacy_dispenses;
    `;
    const pharmacyCollections = Number(pharmRevenueQuery[0]?.total_pharm || 0);

    const grossCollections = appointmentCollections + pharmacyCollections;

    // 4. Calculate total expenses & breakdown by category
    const categoryBreakdown: Record<string, number> = {};
    let totalExpenses = 0;

    for (const exp of expensesRows) {
      const amt = Number(exp.amount || 0);
      totalExpenses += amt;
      const cat = exp.category || "General";
      categoryBreakdown[cat] = (categoryBreakdown[cat] || 0) + amt;
    }

    const realNetProfit = grossCollections - totalExpenses;
    const profitMarginPct = grossCollections > 0 
      ? parseFloat(((realNetProfit / grossCollections) * 100).toFixed(1)) 
      : 0;

    return NextResponse.json({
      expenses: expensesRows,
      kpis: {
        gross_collections: grossCollections,
        appointment_collections: appointmentCollections,
        pharmacy_collections: pharmacyCollections,
        total_expenses: totalExpenses,
        real_net_profit: realNetProfit,
        profit_margin_pct: profitMarginPct
      },
      category_breakdown: categoryBreakdown
    });
  } catch (error: any) {
    console.error("GET /api/expenses error:", error);
    return NextResponse.json({ error: error.message || "Failed to load expenses" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clinic_slug = "derma-care-dehradun",
      title,
      category = "Consumables",
      amount,
      payment_mode = "upi",
      recorded_by = "Front Desk",
      date
    } = body;

    if (!title || !amount) {
      return NextResponse.json({ error: "Title and amount are required" }, { status: 400 });
    }

    const id = randomUUID();
    const expenseDate = date || new Date().toISOString().split("T")[0];

    const inserted = await sql`
      INSERT INTO expenses (
        id, clinic_slug, title, category, amount, 
        payment_mode, recorded_by, date, created_at
      ) VALUES (
        ${id},
        ${clinic_slug},
        ${title},
        ${category},
        ${Number(amount)},
        ${payment_mode},
        ${recorded_by},
        ${expenseDate},
        NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({ status: "success", expense: inserted[0] });
  } catch (error: any) {
    console.error("POST /api/expenses error:", error);
    return NextResponse.json({ error: error.message || "Failed to record expense" }, { status: 500 });
  }
}
