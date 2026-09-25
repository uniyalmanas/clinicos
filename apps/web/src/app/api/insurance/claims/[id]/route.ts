import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { 
  AUTHORIZED_FINANCE_PINS,
  calculateQuerySla,
  MandatoryDocumentItem 
} from "@/data/insuranceGovernance";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { action } = body;

    // Fetch existing claim
    const claimRows = await db`SELECT * FROM insurance_claims WHERE id = ${id} LIMIT 1;`;
    if (claimRows.length === 0) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }
    const claim = claimRows[0];

    const nowIso = new Date().toISOString();
    let currentAudit = typeof claim.audit_trail === "string" 
      ? JSON.parse(claim.audit_trail || "[]") 
      : (claim.audit_trail || []);

    // ACTION 1: Verify a specific mandatory document (Fix 1)
    if (action === "verify_doc") {
      const { doc_id, verified_by = "TPA Desk Officer", file_name } = body;
      let docsList: MandatoryDocumentItem[] = typeof claim.mandatory_docs_checklist === "string"
        ? JSON.parse(claim.mandatory_docs_checklist || "[]")
        : (claim.mandatory_docs_checklist || []);

      let matchedLabel = "";
      docsList = docsList.map(d => {
        if (d.id === doc_id) {
          matchedLabel = d.label;
          return {
            ...d,
            verified: true,
            verified_at: nowIso,
            verified_by,
            file_name: file_name || d.file_name || `${doc_id}_verified.pdf`
          };
        }
        return d;
      });

      currentAudit.push({
        action: "DOCUMENT_VERIFIED",
        timestamp: nowIso,
        by: verified_by,
        notes: `Clinical document verified: ${matchedLabel || doc_id}`
      });

      const updated = await db`
        UPDATE insurance_claims
        SET 
          mandatory_docs_checklist = ${JSON.stringify(docsList)}::jsonb,
          audit_trail = ${JSON.stringify(currentAudit)}::jsonb,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;

      return NextResponse.json({ success: true, claim: updated[0], message: "Document verified successfully." });
    }

    // ACTION 2: Submit Pre-Auth after document checklist verification (Fix 1 & Fix 2)
    if (action === "submit_pre_auth") {
      const { package_override_pin, package_override_reason } = body;
      const docsList: MandatoryDocumentItem[] = typeof claim.mandatory_docs_checklist === "string"
        ? JSON.parse(claim.mandatory_docs_checklist || "[]")
        : (claim.mandatory_docs_checklist || []);

      const missingDocs = docsList.filter(d => d.is_mandatory && !d.verified);
      if (missingDocs.length > 0) {
        return NextResponse.json({
          error: `SUBMISSION HALTED: Incomplete mandatory clinical records: ${missingDocs.map(d => d.label).join("; ")}.`,
          code: "MANDATORY_DOCS_INCOMPLETE"
        }, { status: 422 });
      }

      // Check package rate cap if overrun
      let overrideBy = claim.package_override_by;
      if (claim.package_rate_overrun && !overrideBy) {
        if (!package_override_pin) {
          return NextResponse.json({
            error: "Finance Head PIN authorization required for package rate overrun prior to submission.",
            code: "PACKAGE_RATE_OVERRUN_REQUIRES_PIN"
          }, { status: 422 });
        }
        const matched = AUTHORIZED_FINANCE_PINS.find(p => p.pin === package_override_pin);
        if (!matched) {
          return NextResponse.json({ error: "Invalid Finance PIN.", code: "INVALID_PIN" }, { status: 403 });
        }
        overrideBy = `${matched.name} (${matched.role})`;
      }

      currentAudit.push({
        action: "PRE_AUTH_SUBMITTED",
        timestamp: nowIso,
        by: "TPA Desk Executive",
        notes: "Dossier passed 100% mandatory checklist verification. Digital authorization dispatched."
      });

      const updated = await db`
        UPDATE insurance_claims
        SET 
          status = 'pre_auth_submitted',
          submission_date = NOW(),
          package_override_by = COALESCE(${overrideBy}, package_override_by),
          package_override_reason = COALESCE(${package_override_reason}, package_override_reason),
          audit_trail = ${JSON.stringify(currentAudit)}::jsonb,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;

      return NextResponse.json({ success: true, claim: updated[0], message: "Pre-authorization submitted to TPA." });
    }

    // ACTION 3: Log TPA Query (Fix 3)
    if (action === "raise_query") {
      const { query_text, query_type = "MEDICAL_NECESSITY", assigned_to = "Ritu Negi (TPA Desk)" } = body;
      const queryData = {
        query_text,
        query_type,
        assigned_to,
        query_received_at: nowIso,
        sla_hours_limit: 24,
        escalation_tier: "normal"
      };

      currentAudit.push({
        action: "TPA_QUERY_LOGGED",
        timestamp: nowIso,
        by: "TPA Portal Ingest",
        notes: `Query logged (${query_type}): ${query_text.substring(0, 100)}... Assigned to ${assigned_to} with 24h SLA.`
      });

      const updated = await db`
        UPDATE insurance_claims
        SET 
          status = 'query_raised',
          tpa_query_details = ${JSON.stringify(queryData)}::jsonb,
          audit_trail = ${JSON.stringify(currentAudit)}::jsonb,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;

      return NextResponse.json({ success: true, claim: updated[0] });
    }

    // ACTION 4: Respond to TPA Query with Evidence (Fix 3)
    if (action === "respond_query") {
      const { response_text, responded_by = "Dr. Arvind Shenoy", dispute_evidence } = body;
      if (!response_text) {
        return NextResponse.json({ error: "response_text is required" }, { status: 400 });
      }

      let queryData = typeof claim.tpa_query_details === "string"
        ? JSON.parse(claim.tpa_query_details || "{}")
        : (claim.tpa_query_details || {});

      queryData = {
        ...queryData,
        response_text,
        responded_at: nowIso,
        responded_by,
        dispute_evidence: dispute_evidence || "Clinical indoor chart & daily vitals progress sheet attached"
      };

      currentAudit.push({
        action: "QUERY_RESPONSE_DISPATCHED",
        timestamp: nowIso,
        by: responded_by,
        notes: `Query resolved and dispatched. Evidence: ${queryData.dispute_evidence}`
      });

      const updated = await db`
        UPDATE insurance_claims
        SET 
          status = 'under_review',
          tpa_query_details = ${JSON.stringify(queryData)}::jsonb,
          audit_trail = ${JSON.stringify(currentAudit)}::jsonb,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;

      return NextResponse.json({ 
        success: true, 
        claim: updated[0], 
        message: "Query response transmitted. Status returned to Under Review." 
      });
    }

    // ACTION 5: Approve Pre-Authorization
    if (action === "approve_claim") {
      const { approved_amount, approval_ref, remarks } = body;
      const appAmount = parseFloat(approved_amount) || parseFloat(claim.estimated_amount);

      currentAudit.push({
        action: "PRE_AUTH_APPROVED",
        timestamp: nowIso,
        by: "TPA Medical Adjudicator",
        notes: `Approved amount ₹${appAmount.toLocaleString()} with reference ${approval_ref || "AUTH-VERIFIED"}`
      });

      const updated = await db`
        UPDATE insurance_claims
        SET 
          status = 'approved',
          approved_amount = ${appAmount},
          approval_ref = ${approval_ref || `AUTH/${claim.tpa_company.slice(0, 4).toUpperCase()}/${new Date().getFullYear()}/${Math.floor(10000 + Math.random() * 90000)}`},
          remarks = COALESCE(${remarks}, remarks),
          audit_trail = ${JSON.stringify(currentAudit)}::jsonb,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;

      return NextResponse.json({ success: true, claim: updated[0] });
    }

    // ACTION 6: Automated Settlement Reconciliation (Fix 4)
    if (action === "reconcile_settlement") {
      const { 
        utr_number, 
        remittance_date = nowIso, 
        remitted_amount, 
        deductions = [], 
        reconciled_by = "Suresh Rawat (Finance Head)"
      } = body;

      if (!utr_number || remitted_amount === undefined) {
        return NextResponse.json({ error: "utr_number and remitted_amount are required for settlement reconciliation" }, { status: 400 });
      }

      const numRemitted = parseFloat(remitted_amount) || 0;
      const numApproved = parseFloat(claim.approved_amount) || parseFloat(claim.estimated_amount);
      const shortfall = Math.max(0, numApproved - numRemitted);

      const hasDisputedDeductions = deductions.some((d: any) => d.disputed);
      const disputeStatus = hasDisputedDeductions ? "dispute_queued" : "none";

      const settlementDetails = {
        utr_number,
        remittance_date,
        approved_amount: numApproved,
        remitted_amount: numRemitted,
        shortfall_amount: shortfall,
        deductions,
        is_reconciled: true,
        reconciled_at: nowIso,
        reconciled_by,
        posted_to_ledger: true,
        dispute_status: disputeStatus
      };

      currentAudit.push({
        action: "REMITTANCE_RECONCILED",
        timestamp: nowIso,
        by: reconciled_by,
        notes: `Bank UTR ${utr_number} reconciled. Remitted: ₹${numRemitted.toLocaleString()}, Shortfall: ₹${shortfall.toLocaleString()}. Deductions itemized: ${deductions.length}.`
      });

      // If patient is tied to a bed, post net cashless credit to bed_billing_ledger
      if (claim.bed_id) {
        try {
          const ledgerId = randomUUID();
          await db`
            INSERT INTO bed_billing_ledger (
              id, bed_id, charge_type, description, amount, 
              created_by, is_prorated, created_at
            ) VALUES (
              ${ledgerId},
              ${claim.bed_id},
              'insurance_cashless_settlement',
              ${`Cashless settlement via ${claim.tpa_company} (UTR: ${utr_number})`},
              ${-numRemitted},
              ${reconciled_by},
              false,
              NOW()
            );
          `;
          currentAudit.push({
            action: "POSTED_TO_PATIENT_LEDGER",
            timestamp: nowIso,
            by: "Ledger Gateway",
            notes: `Credited ₹${numRemitted.toLocaleString()} to inpatient billing ledger for bed ${claim.bed_id}.`
          });
        } catch (e) {
          console.warn("Could not post directly to bed_billing_ledger:", e);
        }
      }

      const updated = await db`
        UPDATE insurance_claims
        SET 
          status = 'settled',
          settlement_details = ${JSON.stringify(settlementDetails)}::jsonb,
          audit_trail = ${JSON.stringify(currentAudit)}::jsonb,
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *;
      `;

      return NextResponse.json({ 
        success: true, 
        claim: updated[0],
        message: `Settlement reconciled with UTR ${utr_number}. ${hasDisputedDeductions ? "Disputed deductions routed to grievance queue." : "Net payment posted to patient ledger."}`
      });
    }

    // Default: Generic Update
    const { status, approved_amount, approval_ref, remarks } = body;
    const updated = await db`
      UPDATE insurance_claims
      SET 
        status = COALESCE(${status}, status),
        approved_amount = COALESCE(${approved_amount !== undefined ? parseFloat(approved_amount) : null}, approved_amount),
        approval_ref = COALESCE(${approval_ref}, approval_ref),
        remarks = COALESCE(${remarks}, remarks),
        updated_at = NOW()
      WHERE id = ${id}
      RETURNING *;
    `;

    return NextResponse.json({ success: true, claim: updated[0] });
  } catch (error: any) {
    console.error("Update insurance claim error:", error);
    return NextResponse.json({ error: error.message || "Failed to update claim" }, { status: 500 });
  }
}
