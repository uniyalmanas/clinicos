import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, ADMIN_ROLES, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const VALID_REASON_CODES = new Set([
  "ICU_TRANSFER",
  "INSURANCE_WAIVER",
  "GOODWILL_DISCOUNT",
  "DISPUTED_HOURS",
  "CLINICAL_TOLERANCE",
]);

const clinicBedIds = async (clinicSlug: string) => {
  const rows = await sql`
    SELECT id FROM clinic_beds WHERE clinic_slug = ${clinicSlug};
  `;
  return rows.map((r: any) => String(r.id));
};

/**
 * Inpatient billing ledger.
 *
 * GET is available to any clinic member (scoped to this clinic's beds).
 * POST is a money movement and therefore requires an owner/administrator
 * session — there are no shared supervisor PINs stored in source.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const { searchParams } = new URL(req.url);
    const bedId = searchParams.get("bed_id");
    const admissionId = searchParams.get("admission_id");

    const bedIds = await clinicBedIds(clinicSlug);
    if (bedIds.length === 0) {
      return NextResponse.json({
        success: true,
        ledger: [],
        overrides: [],
        total_debited: 0,
        total_adjustments: 0,
        entry_count: 0,
        override_count: 0,
      });
    }

    let ledgerEntries: any[];
    let overridesEntries: any[];

    if (admissionId) {
      const owned = await sql`
        SELECT 1 FROM bed_admissions
        WHERE id = ${String(admissionId)}
          AND clinic_slug = ${clinicSlug}
        LIMIT 1;
      `;
      if (owned.length === 0) {
        return apiError(404, "Admission not found in your clinic.", "admission_not_found");
      }
      ledgerEntries = await sql`
        SELECT * FROM bed_billing_ledger
        WHERE admission_id = ${String(admissionId)}
        ORDER BY posted_at ASC;
      `;
      overridesEntries = await sql`
        SELECT * FROM bed_billing_overrides
        WHERE admission_id = ${String(admissionId)}
        ORDER BY created_at DESC;
      `;
    } else if (bedId) {
      if (!bedIds.includes(String(bedId))) {
        return apiError(404, "Bed not found in your clinic.", "bed_not_found");
      }
      ledgerEntries = await sql`
        SELECT * FROM bed_billing_ledger
        WHERE bed_id = ${String(bedId)}
        ORDER BY posted_at ASC;
      `;
      overridesEntries = await sql`
        SELECT * FROM bed_billing_overrides
        WHERE bed_id = ${String(bedId)}
        ORDER BY created_at DESC;
      `;
    } else {
      ledgerEntries = await sql`
        SELECT * FROM bed_billing_ledger
        WHERE bed_id = ANY(${bedIds})
        ORDER BY posted_at DESC
        LIMIT 100;
      `;
      overridesEntries = await sql`
        SELECT * FROM bed_billing_overrides
        WHERE bed_id = ANY(${bedIds})
        ORDER BY created_at DESC
        LIMIT 50;
      `;
    }

    const totalDebited = ledgerEntries.reduce(
      (acc, curr) => acc + Number(curr.amount || 0),
      0
    );
    const totalAdjustments = overridesEntries.reduce(
      (acc, curr) => acc + Number(curr.adjustment_delta || 0),
      0
    );

    return NextResponse.json({
      success: true,
      ledger: ledgerEntries,
      overrides: overridesEntries,
      total_debited: totalDebited,
      total_adjustments: totalAdjustments,
      entry_count: ledgerEntries.length,
      override_count: overridesEntries.length,
    });
  } catch (error: any) {
    console.error("GET billing ledger error:", error);
    return apiError(500, "Failed to load billing ledger.", "internal_error");
  }
}

/**
 * Apply a governed billing adjustment.
 *
 * Authorization is the authenticated administrator session; the acting user is
 * recorded on both the override row and the ledger entry for audit.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: ADMIN_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;
    const supervisorName = auth.auth.user.full_name;

    const body = await req.json();
    const {
      bed_id,
      admission_id = null,
      reason_code,
      original_amount,
      adjusted_amount,
      waiver_notes,
    } = body;

    if (!bed_id) {
      return apiError(400, "bed_id is required.", "invalid_input");
    }

    const cleanReason = String(reason_code || "").trim().toUpperCase();
    if (!VALID_REASON_CODES.has(cleanReason)) {
      return apiError(
        400,
        `reason_code must be one of: ${Array.from(VALID_REASON_CODES).join(", ")}.`,
        "invalid_reason_code"
      );
    }

    const cleanNotes = String(waiver_notes || "").trim();
    if (cleanNotes.length < 5) {
      return apiError(
        400,
        "A justification note of at least 5 characters is required.",
        "notes_required"
      );
    }

    const orig = Number(original_amount);
    const adj = Number(adjusted_amount);
    if (!Number.isFinite(orig) || !Number.isFinite(adj)) {
      return apiError(
        400,
        "original_amount and adjusted_amount must be numbers.",
        "invalid_amount"
      );
    }
    const delta = adj - orig;

    const bedQuery = await sql`
      SELECT * FROM clinic_beds
      WHERE id = ${String(bed_id)}
        AND clinic_slug = ${clinicSlug}
      LIMIT 1;
    `;
    if (bedQuery.length === 0) {
      return apiError(404, "Bed not found in your clinic.", "bed_not_found");
    }
    const bed = bedQuery[0];

    const overrideId = randomUUID();
    const now = new Date();

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
        ${supervisorName},
        false,
        ${cleanReason},
        ${orig},
        ${adj},
        ${delta},
        ${cleanNotes},
        ${now}
      );
    `;

    const ledgerId = randomUUID();
    const ledgerDesc = `[${cleanReason}] ${orig} -> ${adj}. ${cleanNotes}`;

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
        ${`OVERRIDE-${overrideId.slice(0, 8).toUpperCase()}`},
        ${supervisorName},
        ${now}
      );
    `;

    await sql`
      UPDATE clinic_beds
      SET itemized_charges_total = COALESCE(itemized_charges_total, 0) + ${delta}
      WHERE id = ${String(bed_id)}
        AND clinic_slug = ${clinicSlug};
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "bed.billing.override",
      entity: "bed_billing_override",
      entityId: overrideId,
      after: {
        reason_code: cleanReason,
        original_amount: orig,
        adjusted_amount: adj,
        delta,
        notes: cleanNotes,
      },
      request: req,
    });

    return NextResponse.json({
      success: true,
      override_id: overrideId,
      adjustment_delta: delta,
      reason_code: cleanReason,
      message: `Adjustment of ${delta} applied to bed ${bed.bed_number} under ${cleanReason}.`,
      override: {
        id: overrideId,
        reason_code: cleanReason,
        delta,
        supervisor: supervisorName,
        notes: cleanNotes,
        timestamp: now.toISOString(),
      },
    });
  } catch (error: any) {
    console.error("POST Governed Override error:", error);
    return apiError(500, "Failed to apply override.", "internal_error");
  }
}
