import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, ADMIN_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: ADMIN_ROLES, audit: "shift.settle" });
    if (!auth.ok) return auth.response;

    const body = await req.json();
    const {
      shift_name,
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
    } = body;

    if (!shift_name) {
      return apiError(400, "shift_name is required.", "missing_shift");
    }

    const clinicSlug = auth.auth.clinic!.slug;
    const id = randomUUID();
    const settlementNumber = `STL-${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, "0")}${String(new Date().getDate()).padStart(2, "0")}-${new Date().getHours() < 14 ? "M" : "E"}-${Math.floor(100 + Math.random() * 900)}`;
    const todayStr = new Date().toISOString().split("T")[0];

    const inserted = await sql`
      INSERT INTO settlements (
        id, settlement_number, clinic_slug, shift_name, shift_date,
        staff_name, doctor_name, total_patients, gross_collections,
        upi_amount, cash_expected, petty_cash_expenses, petty_cash_remarks,
        net_cash_expected, actual_cash_counted, discrepancy, denominations,
        notes, status, created_at
      ) VALUES (
        ${id}, ${settlementNumber}, ${clinicSlug}, ${shift_name}, ${todayStr},
        ${auth.auth.user.full_name}, ${auth.auth.doctor?.full_name || null},
        ${Number(total_patients)}, ${Number(gross_collections)},
        ${Number(upi_amount)}, ${Number(cash_expected)}, ${Number(petty_cash_expenses)}, ${petty_cash_remarks},
        ${Number(net_cash_expected)}, ${Number(actual_cash_counted)}, ${Number(discrepancy)}, ${JSON.stringify(denominations)},
        ${notes}, 'SETTLED', NOW()
      )
      RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId: auth.auth.clinic!.id,
      action: "shift.settle",
      entity: "settlement",
      entityId: String(inserted[0]?.id || id),
      after: inserted[0] || null,
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: "Shift settled and locked successfully in clinic ledger.",
      settlement: inserted[0],
    });
  } catch (error: any) {
    console.error("Shift settlement error:", error);
    return apiError(500, "Failed to settle shift.", "internal_error");
  }
}
