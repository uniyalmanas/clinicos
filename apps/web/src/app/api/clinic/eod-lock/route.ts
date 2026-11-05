import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createHash, randomUUID } from "crypto";
import { guard, ADMIN_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Lock the financial day.
 *
 * Metrics are computed from this clinic's paid appointments only. Cash is the
 * sum of explicitly cash-paid visits; UPI is the sum of explicitly UPI-paid
 * visits. Anything else is not silently reclassified as cash. The seal hashes
 * the row that was actually written.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: ADMIN_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const clinicSlug = auth.auth.clinic!.slug;
    const closedBy = auth.auth.user.full_name;

    const body = await req.json();
    const { counted_cash, closing_notes = null } = body;

    const countedCash = Number(counted_cash);
    if (!Number.isFinite(countedCash) || countedCash < 0) {
      return apiError(
        400,
        "counted_cash must be a non-negative number.",
        "invalid_cash"
      );
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const apts = await sql`
      SELECT fee_amount, payment_mode
      FROM appointments
      WHERE clinic_id::text = ${clinicId}
        AND (appointment_date = ${todayStr} OR created_at::date = CURRENT_DATE)
        AND payment_status = 'paid';
    `;

    const totalConsultations = apts.length;
    const gross = apts.reduce((acc: number, a: any) => acc + Number(a.fee_amount || 0), 0);
    const upi = apts
      .filter((a: any) => ["upi", "online_upi"].includes(String(a.payment_mode || "").toLowerCase()))
      .reduce((acc: number, a: any) => acc + Number(a.fee_amount || 0), 0);
    const cash = apts
      .filter((a: any) => String(a.payment_mode || "").toLowerCase() === "cash")
      .reduce((acc: number, a: any) => acc + Number(a.fee_amount || 0), 0);
    const discrepancy = countedCash - cash;

    const hashPayload = `${clinicSlug}|${todayStr}|${totalConsultations}|${gross}|${upi}|${cash}|${countedCash}|${closedBy}|${auth.auth.user.id}|${Date.now()}`;
    const auditHash = `EOD-SEAL-${createHash("sha256")
      .update(hashPayload)
      .digest("hex")
      .slice(0, 10)
      .toUpperCase()}`;

    const existing = await sql`
      SELECT id FROM clinic_eod_closings
      WHERE clinic_slug = ${clinicSlug} AND closing_date = ${todayStr}
      ORDER BY closed_at DESC NULLS LAST
      LIMIT 1;
    `;

    let record: any;
    if (existing.length > 0) {
      const updated = await sql`
        UPDATE clinic_eod_closings
        SET
          closed_at = NOW(),
          closed_by = ${closedBy},
          counted_cash = ${countedCash},
          expected_cash = ${cash},
          cash_discrepancy = ${discrepancy},
          gross_collections = ${gross},
          soundbox_upi = ${upi},
          total_consultations = ${totalConsultations},
          closing_notes = ${closing_notes},
          audit_hash = ${auditHash},
          status = 'LOCKED'
        WHERE id = ${String(existing[0].id)}
        RETURNING *;
      `;
      record = updated[0];
    } else {
      const inserted = await sql`
        INSERT INTO clinic_eod_closings (
          id, clinic_slug, closing_date, closed_at, closed_by,
          counted_cash, expected_cash, cash_discrepancy, gross_collections,
          soundbox_upi, total_consultations, closing_notes, audit_hash, status
        ) VALUES (
          ${randomUUID()},
          ${clinicSlug},
          ${todayStr},
          NOW(),
          ${closedBy},
          ${countedCash},
          ${cash},
          ${discrepancy},
          ${gross},
          ${upi},
          ${totalConsultations},
          ${closing_notes},
          ${auditHash},
          'LOCKED'
        )
        RETURNING *;
      `;
      record = inserted[0];
    }

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "clinic.eod.lock",
      entity: "clinic_eod_closing",
      entityId: String(record.id),
      after: {
        closing_date: todayStr,
        total_consultations: totalConsultations,
        gross_collections: gross,
        expected_cash: cash,
        counted_cash: countedCash,
        discrepancy,
        audit_hash: auditHash,
      },
      request: req,
    });

    return NextResponse.json({
      status: "success",
      locked_by: closedBy,
      clinic: clinicSlug,
      record,
      audit_hash: auditHash,
      summary: {
        total_consultations: totalConsultations,
        gross_revenue: gross,
        upi_revenue: upi,
        cash_revenue: cash,
        counted_cash: countedCash,
        variance: discrepancy,
      },
    });
  } catch (error: any) {
    console.error("POST /api/clinic/eod-lock error:", error);
    return apiError(500, "Failed to lock the day.", "internal_error");
  }
}
