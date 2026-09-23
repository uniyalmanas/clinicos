import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createHash, randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinic_slug") || "derma-care-dehradun";
    const todayStr = new Date().toISOString().split("T")[0];

    // Check if day is already locked
    const existing = await sql`
      SELECT * FROM clinic_eod_closings 
      WHERE clinic_slug = ${clinicSlug} AND closing_date = ${todayStr}
      LIMIT 1;
    `;

    // Fetch today's consultations metrics
    const apts = await sql`
      SELECT * FROM appointments 
      WHERE (clinic_id IN (SELECT id FROM clinics WHERE slug = ${clinicSlug}) OR clinic_name ILIKE '%Derma Care%')
        AND (appointment_date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;

    // Fetch today's pharmacy
    const pharm = await sql`
      SELECT * FROM pharmacy_dispenses 
      WHERE (clinic_slug = ${clinicSlug} OR clinic_slug IS NULL)
        AND created_at::date = CURRENT_DATE;
    `;

    // Fetch today's expenses
    const exp = await sql`
      SELECT * FROM expenses 
      WHERE (clinic_slug = ${clinicSlug} OR clinic_slug IS NULL)
        AND (date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;

    const totalConsultations = apts.length;
    const walkIns = apts.filter((a: any) => a.time_slot?.toLowerCase().includes("walk-in") || !a.time_slot?.includes("-")).length;
    const advanceBookings = totalConsultations - walkIns;
    const freeFollowups = apts.filter((a: any) => Number(a.fee_amount) === 0).length;

    // Collections
    const aptGross = apts.filter((a: any) => a.payment_status === "paid").reduce((acc: number, curr: any) => acc + Number(curr.fee_amount || 0), 0);
    const pharmGross = pharm.reduce((acc: number, curr: any) => acc + Number(curr.total_amount || 0), 0);
    const grossCollections = aptGross + pharmGross;

    const soundboxUpi = apts.filter((a: any) => a.payment_status === "paid" && a.payment_mode === "upi").reduce((acc: number, curr: any) => acc + Number(curr.fee_amount || 0), 0)
      + pharm.filter((p: any) => p.payment_mode === "upi").reduce((acc: number, curr: any) => acc + Number(curr.total_amount || 0), 0);

    const grossCash = apts.filter((a: any) => a.payment_status === "paid" && a.payment_mode === "cash").reduce((acc: number, curr: any) => acc + Number(curr.fee_amount || 0), 0)
      + pharm.filter((p: any) => p.payment_mode === "cash").reduce((acc: number, curr: any) => acc + Number(curr.total_amount || 0), 0);

    const pettyExpenses = exp.reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);
    const expectedCash = Math.max(0, grossCash - pettyExpenses);

    const isLocked = existing.length > 0;
    const lockRecord = existing[0] || null;

    return NextResponse.json({
      clinic_slug: clinicSlug,
      closing_date: todayStr,
      is_day_locked: isLocked,
      audit_hash: lockRecord?.audit_hash || null,
      patient_metrics: {
        total_consultations: totalConsultations,
        walk_in_patients: walkIns,
        advance_bookings: advanceBookings,
        free_follow_up_reviews: freeFollowups
      },
      financial_metrics: {
        gross_collections: isLocked ? lockRecord.gross_collections : grossCollections,
        soundbox_upi_inflow: isLocked ? lockRecord.soundbox_upi : soundboxUpi,
        gross_cash_collected: grossCash,
        petty_expenses_outflow: pettyExpenses,
        expected_cash: isLocked ? lockRecord.expected_cash : expectedCash,
        actual_cash_counted: isLocked ? lockRecord.counted_cash : expectedCash,
        cash_discrepancy: isLocked ? lockRecord.cash_discrepancy : 0
      }
    });
  } catch (error: any) {
    console.error("GET /api/clinic/settlement error:", error);
    return NextResponse.json({ error: error.message || "Failed to load settlement data" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clinic_slug = "derma-care-dehradun",
      closing_date,
      closed_by = "Front Desk Staff",
      total_consultations = 0,
      gross_collections = 0,
      soundbox_upi = 0,
      expected_cash = 0,
      counted_cash = 0,
      cash_discrepancy = 0,
      closing_notes = "Shift closed and verified"
    } = body;

    const todayStr = closing_date || new Date().toISOString().split("T")[0];

    // Compute cryptographic tamper-proof hash for shift audit
    const hashPayload = `${clinic_slug}|${todayStr}|${gross_collections}|${soundbox_upi}|${counted_cash}|${closed_by}|${new Date().toISOString()}`;
    const auditHash = createHash("sha256").update(hashPayload).digest("hex");

    const id = randomUUID();

    const inserted = await sql`
      INSERT INTO clinic_eod_closings (
        id, clinic_slug, closing_date, closed_by, total_consultations, 
        gross_collections, soundbox_upi, expected_cash, counted_cash, 
        cash_discrepancy, status, closing_notes, audit_hash, closed_at
      ) VALUES (
        ${id},
        ${clinic_slug},
        ${todayStr},
        ${closed_by},
        ${Number(total_consultations)},
        ${Number(gross_collections)},
        ${Number(soundbox_upi)},
        ${Number(expected_cash)},
        ${Number(counted_cash)},
        ${Number(cash_discrepancy)},
        'closed',
        ${closing_notes},
        ${auditHash},
        NOW()
      )
      ON CONFLICT (id) DO UPDATE SET
        counted_cash = EXCLUDED.counted_cash,
        cash_discrepancy = EXCLUDED.cash_discrepancy,
        closing_notes = EXCLUDED.closing_notes,
        audit_hash = EXCLUDED.audit_hash
      RETURNING *;
    `;

    return NextResponse.json({
      status: "success",
      closing: inserted[0],
      audit_hash: auditHash
    });
  } catch (error: any) {
    console.error("POST /api/clinic/settlement error:", error);
    return NextResponse.json({ error: error.message || "Failed to save EOD closing" }, { status: 500 });
  }
}
