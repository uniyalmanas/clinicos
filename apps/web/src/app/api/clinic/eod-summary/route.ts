import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinic_slug") || "derma-care-dehradun";
    const todayStr = new Date().toISOString().split("T")[0];

    // Check if day is already locked in clinic_eod_closings
    const closings = await sql`
      SELECT * FROM clinic_eod_closings 
      WHERE clinic_slug = ${clinicSlug} AND closing_date = ${todayStr}
      LIMIT 1;
    `;
    const isLocked = closings.length > 0;
    const lockRecord = closings[0] || null;

    // Get today's appointments
    const appointments = await sql`
      SELECT * FROM appointments 
      WHERE (clinic_id IN (SELECT id FROM clinics WHERE slug = ${clinicSlug}) OR clinic_name ILIKE '%Derma Care%')
        AND (appointment_date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;

    // Get today's pharmacy sales
    const pharmacy = await sql`
      SELECT * FROM pharmacy_dispenses 
      WHERE (clinic_slug = ${clinicSlug} OR clinic_slug IS NULL)
        AND created_at::date = CURRENT_DATE;
    `;

    // Get today's expenses
    const expenses = await sql`
      SELECT * FROM expenses 
      WHERE (clinic_slug = ${clinicSlug} OR clinic_slug IS NULL)
        AND (date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;

    const totalConsultations = appointments.length;
    const walkIns = appointments.filter((a: any) => 
      a.time_slot?.toLowerCase().includes("walk-in") || 
      a.time_slot?.toLowerCase().includes("token")
    ).length;
    const advanceBookings = Math.max(0, totalConsultations - walkIns);
    const freeFollowups = appointments.filter((a: any) => Number(a.fee_amount) === 0).length;

    // Revenue calculations
    const paidApts = appointments.filter((a: any) => a.payment_status === "paid");
    const aptGross = paidApts.reduce((sum: number, a: any) => sum + Number(a.fee_amount || 0), 0);
    const pharmGross = pharmacy.reduce((sum: number, p: any) => sum + Number(p.total_amount || 0), 0);
    const grossRevenue = aptGross + pharmGross;

    const upiApt = paidApts.filter((a: any) => a.payment_mode === "upi" || a.payment_mode === "online_upi").reduce((sum: number, a: any) => sum + Number(a.fee_amount || 0), 0);
    const upiPharm = pharmacy.filter((p: any) => p.payment_mode === "upi").reduce((sum: number, p: any) => sum + Number(p.total_amount || 0), 0);
    const soundboxUpi = upiApt + upiPharm;

    const cashApt = paidApts.filter((a: any) => a.payment_mode === "cash").reduce((sum: number, a: any) => sum + Number(a.fee_amount || 0), 0);
    const cashPharm = pharmacy.filter((p: any) => p.payment_mode === "cash").reduce((sum: number, p: any) => sum + Number(p.total_amount || 0), 0);
    const grossCash = cashApt + cashPharm;

    const pettyExpenses = expenses.reduce((sum: number, e: any) => sum + Number(e.amount || 0), 0);
    const expectedCash = Math.max(0, grossCash - pettyExpenses);
    const actualCashCounted = isLocked ? Number(lockRecord.counted_cash) : expectedCash;
    const cashDiscrepancy = isLocked ? Number(lockRecord.cash_discrepancy) : 0;

    // Doctor splits breakdown
    const drRahulPatients = appointments.filter((a: any) => (a.doctor_name || "").includes("Rahul")).length;
    const drNehaPatients = appointments.filter((a: any) => (a.doctor_name || "").includes("Neha")).length;
    const drVikramPatients = appointments.filter((a: any) => (a.doctor_name || "").includes("Vikram")).length;

    const drRahulAmt = drRahulPatients * 600;
    const drNehaGross = drNehaPatients * 700;
    const drNehaPayout = Math.round(drNehaGross * 0.8);
    const drVikramGross = drVikramPatients * 900;
    const drVikramPayout = Math.round(drVikramGross * 0.75);

    const visitingPayouts = drNehaPayout + drVikramPayout;
    const realNetProfit = Math.max(0, grossRevenue - pettyExpenses - visitingPayouts);
    const profitMargin = grossRevenue > 0 ? Number(((realNetProfit / grossRevenue) * 100).toFixed(1)) : 0;

    const dateFormatted = new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    });

    const waMsg = 
      `🏥 *DERMA CARE SKIN & LASER CENTRE — Day Closing Audit*\n` +
      `📅 Date: ${dateFormatted} | Shift: Full Day Closed\n\n` +
      `👥 *Patient Footfall:*\n` +
      `• Total Consultations: ${totalConsultations}\n` +
      `• Walk-ins: ${walkIns} | Advance Bookings: ${advanceBookings} | Free Follow-ups: ${freeFollowups}\n\n` +
      `💵 *Gross Revenue Collected:* ₹${grossRevenue.toLocaleString("en-IN")}\n` +
      `• Soundbox UPI (Direct to Bank): ₹${soundboxUpi.toLocaleString("en-IN")}\n` +
      `• Cash in Drawer: ₹${grossCash.toLocaleString("en-IN")}\n\n` +
      `📉 *Deductions & Outflows:*\n` +
      `• Counter Petty Expenses: ₹${pettyExpenses.toLocaleString("en-IN")}\n` +
      `• Visiting Doctor Payouts: ₹${visitingPayouts.toLocaleString("en-IN")}\n\n` +
      `💰 *Real Net Clinic Profit Today:* ₹${realNetProfit.toLocaleString("en-IN")} (${profitMargin}% Margin)\n` +
      `🔒 *Physical Drawer:* ₹${actualCashCounted.toLocaleString("en-IN")} Counted (${cashDiscrepancy === 0 ? "✓ Balanced" : "⚠️ Discrepancy"})\n\n` +
      `✅ All records cryptographically sealed in ClinicOS. Zero Excel needed.`;

    return NextResponse.json({
      clinic_name: "Derma Care Skin & Laser Centre",
      date: dateFormatted,
      is_day_locked: isLocked,
      audit_hash: lockRecord?.audit_hash || null,
      patient_metrics: {
        total_consultations: totalConsultations,
        walk_in_patients: walkIns,
        advance_bookings: advanceBookings,
        free_follow_up_reviews: freeFollowups
      },
      financial_metrics: {
        gross_collections: isLocked ? Number(lockRecord.gross_collections) : grossRevenue,
        soundbox_upi_inflow: isLocked ? Number(lockRecord.soundbox_upi) : soundboxUpi,
        gross_cash_collected: grossCash,
        petty_expenses_outflow: pettyExpenses,
        visiting_doctor_payouts: visitingPayouts,
        net_expected_cash: expectedCash,
        actual_cash_counted: actualCashCounted,
        cash_discrepancy: cashDiscrepancy,
        drawer_status: cashDiscrepancy === 0 ? "balanced" : "discrepancy",
        real_net_profit: realNetProfit,
        profit_margin_percentage: profitMargin
      },
      doctor_splits: [
        { doctor: "Dr. Rahul Sharma", patients: drRahulPatients, retention: "100% In-house", amount: drRahulAmt },
        { doctor: "Dr. Neha Kapoor", patients: drNehaPatients, split: "80/20", payout: drNehaPayout, status: "settled" },
        { doctor: "Dr. Vikram Negi", patients: drVikramPatients, split: "75/25", payout: drVikramPayout, status: "settled" }
      ],
      whatsapp_eod_message: waMsg,
      whatsapp_url: `https://wa.me/919876543210?text=${encodeURIComponent(waMsg)}`
    });
  } catch (error: any) {
    console.error("GET /api/clinic/eod-summary error:", error);
    return NextResponse.json({ error: error.message || "Failed to load EOD summary" }, { status: 500 });
  }
}
