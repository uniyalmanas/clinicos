import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createHash, randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      clinic_slug = "derma-care-dehradun",
      closed_by = "Pooja Verma (Front Desk Lead)",
      counted_cash = 0,
      closing_notes = "Day closed and reconciled"
    } = body;

    const todayStr = new Date().toISOString().split("T")[0];

    // Gather metrics for audit payload
    const apts = await sql`
      SELECT * FROM appointments 
      WHERE (clinic_id IN (SELECT id FROM clinics WHERE slug = ${clinic_slug}) OR clinic_name ILIKE '%Derma Care%')
        AND (appointment_date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;

    const totalConsultations = apts.length;
    const gross = apts.filter((a: any) => a.payment_status === "paid").reduce((acc: number, curr: any) => acc + Number(curr.fee_amount || 0), 0);
    const upi = apts.filter((a: any) => a.payment_status === "paid" && (a.payment_mode === "upi" || a.payment_mode === "online_upi")).reduce((acc: number, curr: any) => acc + Number(curr.fee_amount || 0), 0);

    const hashPayload = `${clinic_slug}|${todayStr}|${totalConsultations}|${gross}|${counted_cash}|${closed_by}|${Date.now()}`;
    const auditHash = `EOD-SEAL-${createHash("sha256").update(hashPayload).digest("hex").slice(0, 10).toUpperCase()}`;

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
        ${totalConsultations},
        ${gross},
        ${upi},
        ${counted_cash},
        ${counted_cash},
        0,
        'closed',
        ${closing_notes},
        ${auditHash},
        NOW()
      )
      RETURNING *;
    `;

    return NextResponse.json({
      status: "success",
      record: inserted[0] || { audit_hash: auditHash },
      audit_hash: auditHash
    });
  } catch (error: any) {
    console.error("POST /api/clinic/eod-lock error:", error);
    return NextResponse.json({ error: error.message || "Failed to lock day audit" }, { status: 500 });
  }
}
