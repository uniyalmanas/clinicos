import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINIC_ROLES, ADMIN_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { calculateQuerySla, MandatoryDocumentItem } from "@/data/insuranceGovernance";

export const dynamic = "force-dynamic";

const parseJson = (value: any, fallback: any) => {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  }
  return value;
};

const requireAdmin = (auth: any, action: string) => {
  if (!ADMIN_ROLES.some((r) => r === auth.role)) {
    return apiError(
      403,
      `${action} requires an owner or clinic administrator session.`,
      "forbidden"
    );
  }
  return null;
};

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;
    const actorName = auth.auth.user.full_name;

    const { id } = await params;
    const body = await req.json();
    const { action } = body;

    const claimRows = await sql`
      SELECT * FROM insurance_claims
      WHERE id::text = ${String(id)}
        AND clinic_slug = ${clinicSlug}
      LIMIT 1;
    `;
    if (claimRows.length === 0) {
      return apiError(404, "Claim not found in your clinic.", "claim_not_found");
    }
    const claim = claimRows[0];

    const nowIso = new Date().toISOString();
    const auditTrail: any[] = parseJson(claim.audit_trail, []);
    const pushAudit = (entry: Record<string, unknown>) =>
      auditTrail.push({ timestamp: nowIso, by: actorName, ...entry });

    // ── Verify a mandatory document ─────────────────────────────────
    if (action === "verify_doc") {
      const { doc_id, file_name } = body;
      if (!doc_id) {
        return apiError(400, "doc_id is required.", "invalid_input");
      }

      const docsList: MandatoryDocumentItem[] = parseJson(
        claim.mandatory_docs_checklist,
        []
      );
      let matchedLabel = "";
      let matched = false;

      const updatedDocs = docsList.map((d) => {
        if (d.id === doc_id) {
          matched = true;
          matchedLabel = d.label;
          return {
            ...d,
            verified: true,
            verified_at: nowIso,
            verified_by: actorName,
            file_name: file_name || d.file_name,
          };
        }
        return d;
      });

      if (!matched) {
        return apiError(404, "Document not found on this claim.", "document_not_found");
      }

      pushAudit({
        action: "DOCUMENT_VERIFIED",
        notes: `Clinical document verified: ${matchedLabel}`,
      });

      const updated = await sql`
        UPDATE insurance_claims
        SET
          mandatory_docs_checklist = ${JSON.stringify(updatedDocs)}::jsonb,
          audit_trail = ${JSON.stringify(auditTrail)}::jsonb,
          updated_at = NOW()
        WHERE id = ${String(claim.id)}
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "insurance.claim.document.verify",
        entity: "insurance_claim",
        entityId: String(claim.id),
        after: { doc_id, label: matchedLabel },
        request: req,
      });

      return NextResponse.json({
        success: true,
        claim: updated[0],
        message: "Document verified.",
      });
    }

    // ── Submit pre-authorization ────────────────────────────────────
    if (action === "submit_pre_auth") {
      const denied = requireAdmin(auth.auth, "Submitting a pre-authorization");
      if (denied) return denied;

      const docsList: MandatoryDocumentItem[] = parseJson(
        claim.mandatory_docs_checklist,
        []
      );
      const missingDocs = docsList.filter((d) => d.is_mandatory && !d.verified);
      if (missingDocs.length > 0) {
        return NextResponse.json(
          {
            error: `Submission halted. Incomplete mandatory clinical records: ${missingDocs
              .map((d) => d.label)
              .join("; ")}.`,
            code: "MANDATORY_DOCS_INCOMPLETE",
          },
          { status: 422 }
        );
      }

      let overrideBy = claim.package_override_by;
      let overrideReason = claim.package_override_reason;
      if (claim.package_rate_overrun && !overrideBy) {
        const reason = String(body.package_override_reason || "").trim();
        if (!reason) {
          return apiError(
            422,
            "package_override_reason is required to submit an over-cap claim.",
            "override_reason_required"
          );
        }
        overrideBy = actorName;
        overrideReason = reason;
      }

      pushAudit({
        action: "PRE_AUTH_SUBMITTED",
        notes: "Dossier passed the mandatory checklist. Digital authorization dispatched.",
      });

      const updated = await sql`
        UPDATE insurance_claims
        SET
          status = 'pre_auth_submitted',
          submission_date = NOW(),
          package_override_by = ${overrideBy},
          package_override_reason = ${overrideReason},
          audit_trail = ${JSON.stringify(auditTrail)}::jsonb,
          updated_at = NOW()
        WHERE id = ${String(claim.id)}
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "insurance.claim.pre_auth.submit",
        entity: "insurance_claim",
        entityId: String(claim.id),
        after: { claim_number: claim.claim_number, override_by: overrideBy },
        request: req,
      });

      return NextResponse.json({
        success: true,
        claim: updated[0],
        message: "Pre-authorization submitted to the TPA.",
      });
    }

    // ── Log a TPA query ─────────────────────────────────────────────
    if (action === "raise_query") {
      const { query_text, query_type = "MEDICAL_NECESSITY", assigned_to } = body;
      const text = String(query_text || "").trim();
      if (!text) {
        return apiError(400, "query_text is required.", "invalid_input");
      }

      const queryData = {
        query_text: text,
        query_type,
        assigned_to: String(assigned_to || actorName),
        query_received_at: nowIso,
        sla_hours_limit: 24,
        escalation_tier: "normal",
      };

      pushAudit({
        action: "TPA_QUERY_LOGGED",
        notes: `Query logged (${query_type}): ${text.slice(0, 100)}`,
      });

      const updated = await sql`
        UPDATE insurance_claims
        SET
          status = 'query_raised',
          tpa_query_details = ${JSON.stringify(queryData)}::jsonb,
          audit_trail = ${JSON.stringify(auditTrail)}::jsonb,
          updated_at = NOW()
        WHERE id = ${String(claim.id)}
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "insurance.claim.query.raise",
        entity: "insurance_claim",
        entityId: String(claim.id),
        after: { query_type, assigned_to: queryData.assigned_to },
        request: req,
      });

      return NextResponse.json({
        success: true,
        claim: updated[0],
        sla: calculateQuerySla(queryData),
      });
    }

    // ── Respond to a TPA query ──────────────────────────────────────
    if (action === "respond_query") {
      const { response_text, dispute_evidence } = body;
      const responseText = String(response_text || "").trim();
      if (!responseText) {
        return apiError(400, "response_text is required.", "invalid_input");
      }

      const queryData = {
        ...parseJson(claim.tpa_query_details, {}),
        response_text: responseText,
        responded_at: nowIso,
        responded_by: actorName,
        dispute_evidence: dispute_evidence || null,
      };

      pushAudit({
        action: "QUERY_RESPONSE_DISPATCHED",
        notes: `Query resolved and dispatched. Evidence: ${queryData.dispute_evidence || "none attached"}`,
      });

      const updated = await sql`
        UPDATE insurance_claims
        SET
          status = 'under_review',
          tpa_query_details = ${JSON.stringify(queryData)}::jsonb,
          audit_trail = ${JSON.stringify(auditTrail)}::jsonb,
          updated_at = NOW()
        WHERE id = ${String(claim.id)}
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "insurance.claim.query.respond",
        entity: "insurance_claim",
        entityId: String(claim.id),
        after: { responded_by: actorName },
        request: req,
      });

      return NextResponse.json({
        success: true,
        claim: updated[0],
        message: "Query response transmitted. Status returned to under review.",
      });
    }

    // ── Record TPA approval ─────────────────────────────────────────
    if (action === "approve_claim") {
      const denied = requireAdmin(auth.auth, "Recording an approval amount");
      if (denied) return denied;

      const { approved_amount, approval_ref, remarks } = body;
      const appAmount = Number(approved_amount);
      if (!Number.isFinite(appAmount) || appAmount <= 0) {
        return apiError(
          400,
          "approved_amount must be a positive number.",
          "invalid_amount"
        );
      }

      const ref =
        approval_ref ||
        `AUTH/${String(claim.tpa_company).slice(0, 4).toUpperCase()}/${new Date().getFullYear()}/${Math.floor(
          10000 + Math.random() * 90000
        )}`;

      pushAudit({
        action: "PRE_AUTH_APPROVED",
        notes: `Approved amount ₹${appAmount.toLocaleString("en-IN")} with reference ${ref}`,
      });

      const updated = await sql`
        UPDATE insurance_claims
        SET
          status = 'approved',
          approved_amount = ${appAmount},
          approval_ref = ${ref},
          remarks = COALESCE(${remarks}, remarks),
          audit_trail = ${JSON.stringify(auditTrail)}::jsonb,
          updated_at = NOW()
        WHERE id = ${String(claim.id)}
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "insurance.claim.approve",
        entity: "insurance_claim",
        entityId: String(claim.id),
        after: { approved_amount: appAmount, approval_ref: ref },
        request: req,
      });

      return NextResponse.json({ success: true, claim: updated[0] });
    }

    // ── Reconcile settlement ────────────────────────────────────────
    if (action === "reconcile_settlement") {
      const denied = requireAdmin(auth.auth, "Reconciling a settlement");
      if (denied) return denied;

      const { utr_number, remittance_date = nowIso, remitted_amount, deductions = [] } =
        body;

      if (!utr_number || remitted_amount === undefined) {
        return apiError(
          400,
          "utr_number and remitted_amount are required for settlement reconciliation.",
          "invalid_input"
        );
      }

      const numRemitted = Number(remitted_amount);
      if (!Number.isFinite(numRemitted) || numRemitted < 0) {
        return apiError(400, "remitted_amount must be a positive number.", "invalid_amount");
      }

      const baseApproved =
        claim.approved_amount != null ? Number(claim.approved_amount) : null;
      if (baseApproved == null) {
        return apiError(
          422,
          "This claim has no approved amount on record, so the remittance cannot be reconciled.",
          "approval_required"
        );
      }

      const shortfall = Math.max(0, baseApproved - numRemitted);
      const cleanDeductions = Array.isArray(deductions) ? deductions : [];
      const hasDisputedDeductions = cleanDeductions.some((d: any) => d?.disputed);
      const disputeStatus = hasDisputedDeductions ? "dispute_queued" : "none";

      const settlementDetails = {
        utr_number,
        remittance_date,
        approved_amount: baseApproved,
        remitted_amount: numRemitted,
        shortfall_amount: shortfall,
        deductions: cleanDeductions,
        is_reconciled: true,
        reconciled_at: nowIso,
        reconciled_by: actorName,
        posted_to_ledger: false,
        dispute_status: disputeStatus,
      };

      pushAudit({
        action: "REMITTANCE_RECONCILED",
        notes: `Bank UTR ${utr_number} reconciled. Remitted ₹${numRemitted.toLocaleString(
          "en-IN"
        )}, shortfall ₹${shortfall.toLocaleString("en-IN")}. Deductions: ${cleanDeductions.length}.`,
      });

      // Post the net cashless credit to the inpatient ledger when the claim is
      // tied to one of this clinic's beds.
      if (claim.bed_id) {
        const bedRows = await sql`
          SELECT id, bed_number, admission_id FROM clinic_beds
          WHERE id::text = ${String(claim.bed_id)}
            AND clinic_slug = ${clinicSlug}
          LIMIT 1;
        `;
        if (bedRows.length > 0) {
          const bed = bedRows[0];
          await sql`
            INSERT INTO bed_billing_ledger (
              id, admission_id, bed_id, bed_number, charge_type,
              description, amount, source_order_ref, posted_by, posted_at
            ) VALUES (
              ${randomUUID()},
              ${bed.admission_id ?? null},
              ${bed.id},
              ${bed.bed_number},
              'insurance_cashless_settlement',
              ${`Cashless settlement via ${claim.tpa_company} (UTR: ${utr_number})`},
              ${-numRemitted},
              ${`UTR-${utr_number}`},
              ${actorName},
              NOW()
            );
          `;
          settlementDetails.posted_to_ledger = true;
          pushAudit({
            action: "POSTED_TO_PATIENT_LEDGER",
            notes: `Credited ₹${numRemitted.toLocaleString("en-IN")} to inpatient ledger for bed ${bed.bed_number}.`,
          });
        }
      }

      const updated = await sql`
        UPDATE insurance_claims
        SET
          status = 'settled',
          settlement_details = ${JSON.stringify(settlementDetails)}::jsonb,
          audit_trail = ${JSON.stringify(auditTrail)}::jsonb,
          updated_at = NOW()
        WHERE id = ${String(claim.id)}
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "insurance.claim.settle",
        entity: "insurance_claim",
        entityId: String(claim.id),
        after: {
          utr_number,
          remitted_amount: numRemitted,
          shortfall,
          dispute_status: disputeStatus,
        },
        request: req,
      });

      return NextResponse.json({
        success: true,
        claim: updated[0],
        message: `Settlement reconciled with UTR ${utr_number}. ${
          hasDisputedDeductions
            ? "Disputed deductions routed to the grievance queue."
            : "Net payment posted to the patient ledger."
        }`,
      });
    }

    // ── Generic update ──────────────────────────────────────────────
    const denied = requireAdmin(auth.auth, "Editing claim status or amounts");
    if (denied) return denied;

    const { status, approved_amount, approval_ref, remarks } = body;
    const parsedApproved =
      approved_amount === undefined || approved_amount === null
        ? null
        : Number(approved_amount);
    if (parsedApproved !== null && !Number.isFinite(parsedApproved)) {
      return apiError(400, "approved_amount must be numeric.", "invalid_amount");
    }

    const updated = await sql`
      UPDATE insurance_claims
      SET
        status = COALESCE(${status ?? null}, status),
        approved_amount = COALESCE(${parsedApproved}, approved_amount),
        approval_ref = COALESCE(${approval_ref ?? null}, approval_ref),
        remarks = COALESCE(${remarks ?? null}, remarks),
        updated_at = NOW()
      WHERE id = ${String(claim.id)}
      RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "insurance.claim.update",
      entity: "insurance_claim",
      entityId: String(claim.id),
      before: {
        status: claim.status,
        approved_amount: claim.approved_amount,
      },
      after: { status, approved_amount: parsedApproved, approval_ref, remarks },
      request: req,
    });

    return NextResponse.json({ success: true, claim: updated[0] });
  } catch (error: any) {
    console.error("PATCH /api/insurance/claims/[id] error:", error);
    return apiError(500, "Failed to update claim.", "internal_error");
  }
}
