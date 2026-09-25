import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Inpatient Stay Billing Ledger API
 * Provides immutable audit trail of every charge debit (Base tariff, bedside consumables, nursing fees).
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bedId = searchParams.get("bed_id");
    const admissionId = searchParams.get("admission_id");

    let entries = [];
    if (admissionId) {
      entries = await sql`
        SELECT * FROM bed_billing_ledger 
        WHERE admission_id = ${admissionId}
        ORDER BY posted_at ASC;
      `;
    } else if (bedId) {
      entries = await sql`
        SELECT * FROM bed_billing_ledger 
        WHERE bed_id = ${bedId}
        ORDER BY posted_at ASC;
      `;
    } else {
      entries = await sql`
        SELECT * FROM bed_billing_ledger 
        ORDER BY posted_at DESC 
        LIMIT 100;
      `;
    }

    const totalDebited = entries.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);

    return NextResponse.json({
      success: true,
      ledger: entries,
      total_debited: totalDebited,
      entry_count: entries.length
    });
  } catch (error: any) {
    console.error("GET billing ledger error:", error);
    return NextResponse.json({ error: error.message || "Failed to load billing ledger" }, { status: 500 });
  }
}
