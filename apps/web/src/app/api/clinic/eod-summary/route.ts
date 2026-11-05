import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinic_slug") || auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;
    const todayStr = new Date().toISOString().split("T")[0];

    const clinicRows = await sql`
      SELECT name, phone FROM clinics WHERE id::text = ${clinicId}::text LIMIT 1;
    `;
    const clinicName = clinicRows[0]?.name || auth.auth.clinic!.name;

    const closings = await sql`
      SELECT * FROM clinic_eod_closings
      WHERE clinic_slug = ${clinicSlug} AND closing_date = ${todayStr}
      LIMIT 1;
    `;
    const isLocked = closings.length > 0;
    const lockRecord = closings[0] || null;

    const appointments = await sql`
      SELECT * FROM appointments
      WHERE clinic_id::text = ${clinicId}::text
        AND (appointment_date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;

    const pharmacy = await sql`
      SELECT * FROM pharmacy_dispenses
      WHERE clinic_slug = ${clinicSlug}
        AND created_at::date = CURRENT_DATE;
    `;

    const expenses = await sql`
      SELECT * FROM expenses
      WHERE clinic_slug = ${clinicSlug}
        AND (date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;

    const totalConsultations = appointments.length;
    const walkIns = appointments.filter(
      (a: any) =>
        a.time_slot?.toLowerCase().includes("walk-in") ||
        a.time_slot?.toLowerCase().includes("token")
    ).length;
    const advanceBookings = Math.max(0, totalConsultations - walkIns);
    const freeFollowups = appointments.filter((a: any) => Number(a.fee_amount) === 0).length;

    const paidApts = appointments.filter((a: any) => a.payment_status === "paid");
    const aptGross = paidApts.reduce((sum: number, a: any) => sum + Number(a.fee_amount || 0), 0);
    const pharmGross = pharmacy.reduce((sum: number, p: any) => sum + Number(p.total_amount || 0), 0);
    const grossRevenue = aptGross + pharmGross;

    const upiApt = paidApts
      .filter((a: any) => a.payment_mode === "upi" || a.payment_mode === "online_upi")
      .reduce((sum: number, a: any) => sum + Number(a.fee_amount || 0), 0);
    const upiPharm = pharmacy
      .filter((p: any) => p.payment_mode === "upi")
      .reduce((sum: number, p: any) => sum + Number(p.total_amount || 0), 0);
    const soundboxUpi = upiApt + upiPharm;

    const cashApt = paidApts
      .filter((a: any) => a.payment_mode === "cash")
      .reduce((sum: number, a: any) => sum + Number(a.fee_amount || 0), 0);
    const cashPharm = pharmacy
      .filter((p: any) => p.payment_mode === "cash")
      .reduce((sum: number, p: any) => sum + Number(p.total_amount || 0), 0);
    const grossCash = cashApt + cashPharm;

    const pettyExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const expectedCash = Math.max(0, grossCash - pettyExpenses);
    const actualCashCounted = isLocked ? Number(lockRecord.counted_cash) : expectedCash;
    const cashDiscrepancy = isLocked ? Number(lockRecord.cash_discrepancy) : 0;

    // Doctor splits come from explicit contracts, never from array position or
    // a hardcoded name match.
    const contracts = await sql`
      SELECT d.slug, d.full_name, c.split_pct
      FROM doctors d
      LEFT JOIN LATERAL (
        SELECT split_pct
        FROM doctor_compensation_contracts cc
        WHERE cc.doctor_id::text = d.id::text
          AND cc.clinic_id::text = ${clinicId}::text
          AND cc.effective_from <= CURRENT_DATE
          AND (cc.effective_to IS NULL OR cc.effective_to >= CURRENT_DATE)
        ORDER BY cc.effective_from DESC
        LIMIT 1
      ) c ON true
      WHERE d.clinic_id::text = ${clinicId}::text OR d.clinic_slug = ${clinicSlug};
    `;
    const splitBySlug = new Map<string, number>();
    for (const c of contracts) splitBySlug.set(String(c.slug), Number(c.split_pct ?? 100));

    const byDoctor = new Map<string, { doctor: string; patients: number; gross: number }>();
    for (const apt of appointments) {
      const key = String(apt.doctor_slug || apt.doctor_name || "unassigned");
      const row = byDoctor.get(key) || {
        doctor: apt.doctor_name || key,
        patients: 0,
        gross: 0,
      };
      row.patients += 1;
      if (apt.payment_status === "paid") row.gross += Number(apt.fee_amount || 0);
      byDoctor.set(key, row);
    }

    const doctorSplits = Array.from(byDoctor.entries()).map(([slug, row]) => {
      const split = splitBySlug.get(slug);
      return {
        doctor: row.doctor,
        patients: row.patients,
        split: split == null ? null : `${split}/${100 - split}`,
        gross: row.gross,
        payout: split == null ? null : Math.round(row.gross * (split / 100)),
        status: split == null ? "contract_missing" : "computed",
      };
    });

    const visitingPayouts = doctorSplits.reduce((sum, d) => sum + (d.payout || 0), 0);
    const realNetProfit = Math.max(0, grossRevenue - pettyExpenses - visitingPayouts);
    const profitMargin =
      grossRevenue > 0 ? Number(((realNetProfit / grossRevenue) * 100).toFixed(1)) : 0;

    const dateFormatted = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });

    const waMsg =
      `*${clinicName} — Day Closing Audit*\n` +
      `Date: ${dateFormatted} | Shift: Full Day Closed\n\n` +
      `*Patient Footfall:*\n` +
      `Total Consultations: ${totalConsultations}\n` +
      `Walk-ins: ${walkIns} | Advance Bookings: ${advanceBookings} | Free Follow-ups: ${freeFollowups}\n\n` +
      `*Gross Revenue Collected:* ₹${grossRevenue.toLocaleString("en-IN")}\n` +
      `Soundbox UPI: ₹${soundboxUpi.toLocaleString("en-IN")}\n` +
      `Cash in Drawer: ₹${grossCash.toLocaleString("en-IN")}\n\n` +
      `*Deductions & Outflows:*\n` +
      `Counter Petty Expenses: ₹${pettyExpenses.toLocaleString("en-IN")}\n` +
      `Doctor Payouts: ₹${visitingPayouts.toLocaleString("en-IN")}\n\n` +
      `*Net Clinic Profit Today:* ₹${realNetProfit.toLocaleString("en-IN")} (${profitMargin}% Margin)\n` +
      `Physical Drawer: ₹${actualCashCounted.toLocaleString("en-IN")} Counted (${cashDiscrepancy === 0 ? "Balanced" : "Discrepancy"})`;

    const helpline = String(clinicRows[0]?.phone || "").replace(/[^0-9]/g, "").slice(-10);

    return NextResponse.json({
      clinic_name: clinicName,
      date: dateFormatted,
      is_day_locked: isLocked,
      audit_hash: lockRecord?.audit_hash || null,
      patient_metrics: {
        total_consultations: totalConsultations,
        walk_in_patients: walkIns,
        advance_bookings: advanceBookings,
        free_follow_up_reviews: freeFollowups,
      },
      financial_metrics: {
        gross_collections: isLocked ? Number(lockRecord.gross_collections) : grossRevenue,
        soundbox_upi_inflow: isLocked ? Number(lockRecord.soundbox_upi) : soundboxUpi,
        gross_cash_collected: grossCash,
        petty_expenses_outflow: pettyExpenses,
        doctor_payouts: visitingPayouts,
        net_expected_cash: expectedCash,
        actual_cash_counted: actualCashCounted,
        cash_discrepancy: cashDiscrepancy,
        drawer_status: cashDiscrepancy === 0 ? "balanced" : "discrepancy",
        real_net_profit: realNetProfit,
        profit_margin_percentage: profitMargin,
      },
      doctor_splits: doctorSplits,
      whatsapp_eod_message: waMsg,
      whatsapp_url: helpline
        ? `https://wa.me/91${helpline}?text=${encodeURIComponent(waMsg)}`
        : null,
    });
  } catch (error: any) {
    console.error("GET /api/clinic/eod-summary error:", error);
    return apiError(500, "Failed to load EOD summary.", "internal_error");
  }
}
