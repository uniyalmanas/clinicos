import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINIC_ROLES, ADMIN_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const todayIso = () => new Date().toISOString().split("T")[0];

/**
 * Doctor payout preview.
 *
 * Everything is derived from real rows: the clinic's doctors, today's paid
 * consultations, the doctor's compensation contract, escrow disputes, and the
 * payout ledger. A doctor with no contract shows "contract_missing" rather
 * than an invented split, patient count, or fee.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const clinicSlug = auth.auth.clinic!.slug;

    const { searchParams } = new URL(req.url);
    const requestedSlug = searchParams.get("clinic_slug");
    if (requestedSlug && requestedSlug !== clinicSlug) {
      return apiError(403, "Clinic tenant mismatch.", "tenant_mismatch");
    }

    const todayStr = todayIso();

    const doctors = await sql`
      SELECT id, slug, full_name, specialization, phone, consultation_fee, opd_timings, chamber_name
      FROM doctors
      WHERE (clinic_id::text = ${clinicId} OR clinic_slug = ${clinicSlug})
        AND COALESCE(is_active, true) = true
      ORDER BY full_name ASC;
    `;

    const apts = await sql`
      SELECT doctor_slug, fee_amount, payment_status, payment_mode
      FROM appointments
      WHERE clinic_id::text = ${clinicId}
        AND (appointment_date = ${todayStr} OR created_at::date = CURRENT_DATE)
        AND payment_status = 'paid';
    `;

    const contracts = await sql`
      SELECT doctor_id, split_pct, fixed_fee_inr, consumables_policy, effective_from, effective_to
      FROM doctor_compensation_contracts
      WHERE clinic_id::text = ${clinicId}
        AND effective_from <= ${todayStr}
        AND (effective_to IS NULL OR effective_to >= ${todayStr})
      ORDER BY effective_from DESC;
    `;

    const ledgerRows = await sql`
      SELECT doctor_id, gross_amount, deductions, net_amount, split_pct, status, paid_at
      FROM payout_ledger
      WHERE clinic_id::text = ${clinicId}
        AND (period_start <= ${todayStr} AND period_end >= ${todayStr});
    `;

    const disputes = await sql`
      SELECT * FROM clinic_doctor_payout_disputes
      WHERE clinic_slug = ${clinicSlug}
        AND (dispute_date = ${todayStr} OR status = 'DISPUTED_ESCROW')
      ORDER BY created_at DESC;
    `;

    const dayCloseRecord = await sql`
      SELECT id, status, audit_hash FROM clinic_eod_closings
      WHERE clinic_slug = ${clinicSlug} AND closing_date = ${todayStr}
      LIMIT 1;
    `;
    const isDayClosed = dayCloseRecord.length > 0;

    const settledExpenses = await sql`
      SELECT title, amount, payment_mode FROM expenses
      WHERE clinic_slug = ${clinicSlug}
        AND category = 'Staff Salary'
        AND title ILIKE '%Payout%'
        AND (date = ${todayStr} OR created_at::date = CURRENT_DATE);
    `;

    const contractFor = (doctorId: string) =>
      contracts.find((c: any) => String(c.doctor_id) === String(doctorId)) || null;

    const ledgerFor = (doctorId: string) =>
      ledgerRows.find((l: any) => String(l.doctor_id) === String(doctorId)) || null;

    const payouts = doctors.map((doc: any) => {
      const contract = contractFor(doc.id);
      const ledger = ledgerFor(doc.id);

      const docApts = apts.filter((a: any) => a.doctor_slug === doc.slug);
      const patientsSeen = docApts.length;
      const gross = docApts.reduce((sum: number, a: any) => sum + Number(a.fee_amount || 0), 0);

      const splitPct = contract ? Number(contract.split_pct) : null;
      const fixedFee =
        contract && contract.fixed_fee_inr != null ? Number(contract.fixed_fee_inr) : null;

      const doctorShare =
        splitPct == null
          ? null
          : Math.round((gross * splitPct) / 100 + (fixedFee ?? 0));
      const clinicShare = doctorShare == null ? null : gross - doctorShare;

      const deductions = ledger && ledger.deductions != null ? Number(ledger.deductions) : null;

      const docDisputes = disputes.filter(
        (d: any) => d.doctor_slug === doc.slug && d.status === "DISPUTED_ESCROW"
      );
      const escrowAmount = docDisputes.reduce(
        (sum: number, d: any) => sum + Number(d.escrow_amount || 0),
        0
      );

      const netPayable =
        doctorShare == null ? null : Math.max(0, doctorShare - (deductions ?? 0) - escrowAmount);

      const expense = settledExpenses.find((e: any) =>
        String(e.title || "").toLowerCase().includes(String(doc.full_name).toLowerCase())
      );
      const isSettled = ledger?.status === "paid" || Boolean(expense);

      let status = "pending";
      if (!contract) status = "contract_missing";
      else if (docDisputes.length > 0) status = "disputed_escrow";
      else if (isSettled) status = "settled";
      else if (isDayClosed) status = "locked_day_close";

      const summaryLine =
        `Patients seen: ${patientsSeen} | Gross: ₹${gross.toLocaleString("en-IN")}` +
        (splitPct == null
          ? "\nCompensation contract not configured — payout cannot be computed."
          : `\nAgreed split: ${splitPct}% (₹${doctorShare!.toLocaleString("en-IN")})` +
            (deductions ? `\nDeductions: -₹${deductions}` : "") +
            (escrowAmount ? `\nHeld in escrow: -₹${escrowAmount}` : "") +
            `\nNet payable: ₹${(netPayable ?? 0).toLocaleString("en-IN")}`);

      const closingSms = `Namaste ${doc.full_name}. OPD closing summary:\n${summaryLine}`;
      const phoneDigits = String(doc.phone || "").replace(/[^0-9]/g, "");

      return {
        id: `payout-${doc.slug}`,
        doctor_id: doc.id,
        doctor_slug: doc.slug,
        doctor_name: doc.full_name,
        specialty: doc.specialization,
        chamber_name: doc.chamber_name || null,
        roster_type: contract ? (fixedFee != null ? "salaried" : "revenue_split") : "unconfigured",
        schedule: doc.opd_timings || null,
        split_percentage: splitPct,
        clinic_percentage: splitPct == null ? null : 100 - splitPct,
        contract_effective_from: contract?.effective_from ?? null,
        patients_seen: patientsSeen,
        consultation_fee: doc.consultation_fee == null ? null : Number(doc.consultation_fee),
        gross_collections: gross,
        doctor_share: doctorShare,
        clinic_share: clinicShare,
        consumables_deduction: deductions,
        escrow_disputed_amount: escrowAmount,
        net_payable: netPayable,
        status,
        payment_mode: expense?.payment_mode || (ledger?.status === "paid" ? "recorded" : null),
        has_dispute: docDisputes.length > 0,
        dispute_details: docDisputes[0] || null,
        closing_sms: closingSms,
        whatsapp_url: phoneDigits
          ? `https://wa.me/${phoneDigits}?text=${encodeURIComponent(closingSms)}`
          : null,
      };
    });

    const totalPatients = payouts.reduce((sum, p) => sum + p.patients_seen, 0);
    const totalGross = payouts.reduce((sum, p) => sum + p.gross_collections, 0);
    const totalDoctorPayouts = payouts.reduce((sum, p) => sum + (p.net_payable ?? 0), 0);
    const totalEscrowHeld = payouts.reduce((sum, p) => sum + p.escrow_disputed_amount, 0);
    const doctorsMissingContract = payouts.filter((p) => p.status === "contract_missing").length;

    return NextResponse.json({
      doctors: payouts,
      disputes,
      is_day_closed: isDayClosed,
      summary: {
        total_patients: totalPatients,
        total_gross_collections: totalGross,
        total_doctor_payouts: totalDoctorPayouts,
        total_clinic_retained: totalGross - totalDoctorPayouts,
        total_escrow_held: totalEscrowHeld,
        doctors_missing_contract: doctorsMissingContract,
      },
    });
  } catch (error: any) {
    console.error("GET /api/clinic/doctor-payouts error:", error);
    return apiError(500, "Failed to load doctor payouts.", "internal_error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    const body = await req.json();
    const {
      action = "hold_escrow",
      doctor_slug,
      doctor_name,
      escrow_amount,
      gross_amount = null,
      agreed_split_pct = null,
      dispute_reason,
      dispute_id,
    } = body;

    if (action === "hold_escrow") {
      if (!doctor_slug || !escrow_amount || !dispute_reason) {
        return apiError(
          400,
          "doctor_slug, escrow_amount and dispute_reason are required.",
          "invalid_input"
        );
      }

      const docRows = await sql`
        SELECT id, full_name, slug FROM doctors
        WHERE slug = ${String(doctor_slug)}
          AND (clinic_id::text = ${clinicId} OR clinic_slug = ${clinicSlug})
        LIMIT 1;
      `;
      if (docRows.length === 0) {
        return apiError(404, "Doctor not found in your clinic.", "doctor_not_found");
      }
      const doc = docRows[0];

      // Split comes from the contract. If there is no contract, the caller must
      // state the agreed split explicitly rather than inheriting a default.
      const contractRows = await sql`
        SELECT split_pct FROM doctor_compensation_contracts
        WHERE clinic_id::text = ${clinicId}
          AND doctor_id::text = ${String(doc.id)}
          AND effective_from <= CURRENT_DATE
          AND (effective_to IS NULL OR effective_to >= CURRENT_DATE)
        ORDER BY effective_from DESC
        LIMIT 1;
      `;
      const splitPct =
        agreed_split_pct != null
          ? Number(agreed_split_pct)
          : contractRows.length > 0
            ? Number(contractRows[0].split_pct)
            : null;
      if (splitPct == null || !Number.isFinite(splitPct)) {
        return apiError(
          422,
          "No compensation contract is on file. Pass agreed_split_pct to record the disputed split.",
          "split_required"
        );
      }

      const id = randomUUID();
      const todayStr = todayIso();

      const inserted = await sql`
        INSERT INTO clinic_doctor_payout_disputes (
          id, clinic_slug, doctor_slug, doctor_name, dispute_date,
          gross_amount, agreed_split_pct, escrow_amount, dispute_reason,
          status, created_at
        ) VALUES (
          ${id},
          ${clinicSlug},
          ${doc.slug},
          ${String(doctor_name || doc.full_name)},
          ${todayStr},
          ${gross_amount == null ? null : Number(gross_amount)},
          ${splitPct},
          ${Number(escrow_amount)},
          ${String(dispute_reason)},
          'DISPUTED_ESCROW',
          NOW()
        )
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "payout.escrow.hold",
        entity: "clinic_doctor_payout_dispute",
        entityId: id,
        after: {
          doctor_slug: doc.slug,
          escrow_amount: Number(escrow_amount),
          split_pct: splitPct,
        },
        request: req,
      });

      return NextResponse.json({
        status: "success",
        message: `Split of ₹${Number(escrow_amount).toLocaleString(
          "en-IN"
        )} for ${doc.full_name} moved to disputed escrow. Payout held pending clinical review.`,
        dispute: inserted[0],
      });
    }

    if (action === "resolve_escrow") {
      if (!dispute_id) {
        return apiError(400, "dispute_id is required.", "invalid_input");
      }
      if (!ADMIN_ROLES.some((r) => r === auth.auth.role)) {
        return apiError(
          403,
          "Only an owner or clinic administrator may release escrow.",
          "forbidden"
        );
      }

      const updated = await sql`
        UPDATE clinic_doctor_payout_disputes
        SET
          status = 'RESOLVED_RELEASED',
          resolved_by = ${auth.auth.user.full_name},
          resolution_notes = ${body.resolution_notes || "Escrow reviewed and released."},
          updated_at = NOW()
        WHERE id::text = ${String(dispute_id)}
          AND clinic_slug = ${clinicSlug}
        RETURNING *;
      `;

      if (updated.length === 0) {
        return apiError(404, "Dispute not found in your clinic.", "dispute_not_found");
      }

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "payout.escrow.release",
        entity: "clinic_doctor_payout_dispute",
        entityId: String(dispute_id),
        after: { status: "RESOLVED_RELEASED" },
        request: req,
      });

      return NextResponse.json({
        status: "success",
        message: `Escrow resolved and released by ${auth.auth.user.full_name}.`,
        dispute: updated[0],
      });
    }

    return apiError(400, "Invalid action.", "invalid_action");
  } catch (error: any) {
    console.error("POST /api/clinic/doctor-payouts error:", error);
    return apiError(500, "Failed to process payout action.", "internal_error");
  }
}
