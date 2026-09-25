import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// Authorized Supervisor PINs for Governed Billing Overrides (In production, stored in encrypted auth vault)
const AUTHORIZED_SUPERVISOR_PINS = new Set(["7788", "ADMIN99", "SUPER2026", "9900"]);

const VALID_REASON_CODES = new Set([
  "ICU_TRANSFER",
  "INSURANCE_WAIVER",
  "GOODWILL_DISCOUNT",
  "DISPUTED_HOURS",
  "CLINICAL_TOLERANCE"
]);

/**
 * Inpatient Stay Billing Ledger & Governed Override API
 * 1. Provides immutable audit trail of every charge debit (Base tariff, bedside consumables, nursing fees).
 * 2. Governed Override Workflow: Tariff adjustments require Supervisor PIN + Reason Code.
 * 3. Overrides logged separately in `bed_billing_overrides` for CA audit reconciliation.
 */
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const bedId = searchParams.get("bed_id");
    const admissionId = searchParams.get("admission_id");

    let ledgerEntries = [];
    let overridesEntries = [];

    // 1. Fetch Immutable Ledger Entries
    if (admissionId) {
      ledgerEntries = await sql`
        SELECT * FROM bed_billing_ledger 
        WHERE admission_id = ${admissionId}
        ORDER BY posted_at ASC;
      `;
      overridesEntries = await sql`
        SELECT * FROM bed_billing_overrides
        WHERE admission_id = ${admissionId}
        ORDER BY created_at DESC;
      `;
    } else if (bedId) {
      ledgerEntries = await sql`
        SELECT * FROM bed_billing_ledger 
        WHERE bed_id = ${bedId}
        ORDER BY posted_at ASC;
      `;
      overridesEntries = await sql`
        SELECT * FROM bed_billing_overrides
        WHERE bed_id = ${bedId}
        ORDER BY created_at DESC;
      `;
    } else {
      ledgerEntries = await sql`
        SELECT * FROM bed_billing_ledger 
        ORDER BY posted_at DESC 
        LIMIT 100;
      `;
      overridesEntries = await sql`
        SELECT * FROM bed_billing_overrides
        ORDER BY created_at DESC 
        LIMIT 50;
      `;
    }

    const totalDebited = ledgerEntries.reduce((acc, curr) => acc + Number(curr.amount || 0), 0);
    const totalAdjustments = overridesEntries.reduce((acc, curr) => acc + Number(curr.adjustment_delta || 0), 0);

    return NextResponse.json({
      success: true,
      ledger: ledgerEntries,
      overrides: overridesEntries,
      total_debited: totalDebited,
      total_adjustments: totalAdjustments,
      entry_count: ledgerEntries.length,
      override_count: overridesEntries.length
    });
  } catch (error: any) {
    console.error("GET billing ledger error:", error);
    return NextResponse.json({ error: error.message || "Failed to load billing ledger" }, { status: 500 });
  }
}

/**
 * POST: Apply Governed Billing Override
 * Requires Supervisor PIN + Reason Code + Audit Waiver Notes
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      bed_id,
      admission_id,
      supervisor_name = "Medical Superintendent",
      supervisor_pin,
      reason_code,
      original_amount,
      adjusted_amount,
      waiver_notes
    } = body;

    if (!bed_id) {
      return NextResponse.json({ error: "bed_id is required" }, { status: 400 });
    }

    // 1. Validate Supervisor PIN
    const cleanedPin = String(supervisor_pin || "").trim();
    if (!cleanedPin || !AUTHORIZED_SUPERVISOR_PINS.has(cleanedPin)) {
      return NextResponse.json(
        {
          error: "SUPERVISOR AUTHORIZATION REJECTED: Invalid Supervisor PIN. Governed tariff overrides require an authorized Medical Director or Finance Supervisor PIN.",
          code: "INVALID_SUPERVISOR_PIN"
        },
        { status: 401 }
      );
    }

    // 2. Validate Reason Code
    const cleanReason = String(reason_code || "").trim().toUpperCase();
    if (!VALID_REASON_CODES.has(cleanReason)) {
      return NextResponse.json(
        {
          error: `Invalid Reason Code "${cleanReason}". Must be one of: ICU_TRANSFER, INSURANCE_WAIVER, GOODWILL_DISCOUNT, DISPUTED_HOURS, CLINICAL_TOLERANCE.`,
          code: "INVALID_REASON_CODE"
        },
        { status: 400 }
      );
    }

    // 3. Validate Waiver Notes
    const cleanNotes = String(waiver_notes || "").trim();
    if (!cleanNotes || cleanNotes.length < 5) {
      return NextResponse.json(
        { error: "Mandatory justification note (min 5 characters) required for CA audit trail." },
        { status: 400 }
      );
    }

    // 4. Fetch Bed
    const bedQuery = await sql`SELECT * FROM clinic_beds WHERE id = ${bed_id} LIMIT 1;`;
    if (bedQuery.length === 0) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }
    const bed = bedQuery[0];

    const orig = Number(original_amount || 0);
    const adj = Number(adjusted_amount || 0);
    const delta = adj - orig; // e.g. 5000 -> 2500 => delta is -2500

    const overrideId = randomUUID();
    const now = new Date();

    // 5. Insert into bed_billing_overrides (Separate table for CA Audit Reconciliation)
    await sql`
      INSERT INTO bed_billing_overrides (
        id, admission_id, bed_id, bed_number, supervisor_name,
        supervisor_pin_verified, reason_code, original_amount,
        adjusted_amount, adjustment_delta, waiver_notes, created_at
      ) VALUES (
        ${overrideId},
        ${admission_id || bed.admission_id},
        ${bed.id},
        ${bed.bed_number},
        ${supervisor_name},
        true,
        ${cleanReason},
        ${orig},
        ${adj},
        ${delta},
        ${cleanNotes},
        ${now}
      );
    `;

    // 6. Post compensating adjustment entry into immutable ledger
    const ledgerId = randomUUID();
    const ledgerDesc = `[GOVERNED OVERRIDE: ${cleanReason}] Original: ₹${orig} -> Adjusted: ₹${adj}. Note: ${cleanNotes}`;

    await sql`
      INSERT INTO bed_billing_ledger (
        id, admission_id, bed_id, bed_number, charge_type,
        description, amount, source_order_ref, posted_by, posted_at
      ) VALUES (
        ${ledgerId},
        ${admission_id || bed.admission_id},
        ${bed.id},
        ${bed.bed_number},
        'supervisor_override',
        ${ledgerDesc},
        ${delta},
        ${`AUTH-PIN-${overrideId.slice(0, 6).toUpperCase()}`},
        ${`Supervisor: ${supervisor_name}`},
        ${now}
      );
    `;

    // 7. Update itemized charges total on bed
    await sql`
      UPDATE clinic_beds
      SET itemized_charges_total = COALESCE(itemized_charges_total, 0) + ${delta}
      WHERE id = ${bed_id};
    `;

    return NextResponse.json({
      success: true,
      override_id: overrideId,
      adjustment_delta: delta,
      reason_code: cleanReason,
      message: `✓ Governed Tariff Adjustment of ₹${delta} applied for Bed ${bed.bed_number} under Reason Code [${cleanReason}]. Authorized by ${supervisor_name} and recorded for CA Audit reconciliation.`,
      override: {
        id: overrideId,
        reason_code: cleanReason,
        delta,
        supervisor: supervisor_name,
        notes: cleanNotes,
        timestamp: now.toISOString()
      }
    });
  } catch (error: any) {
    console.error("POST Governed Override error:", error);
    return NextResponse.json({ error: error.message || "Failed to apply override" }, { status: 500 });
  }
}
