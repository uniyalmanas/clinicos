import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { 
  PROCEDURE_CATALOG, 
  AUTHORIZED_FINANCE_PINS, 
  calculateQuerySla,
  MandatoryDocumentItem
} from "@/data/insuranceGovernance";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status");

    let claims;
    if (status && status !== "all") {
      claims = await db`
        SELECT c.*, b.bed_number 
        FROM insurance_claims c
        LEFT JOIN clinic_beds b ON b.id::text = c.bed_id::text
        WHERE c.status = ${status}
        ORDER BY c.created_at DESC;
      `;
    } else {
      claims = await db`
        SELECT c.*, b.bed_number 
        FROM insurance_claims c
        LEFT JOIN clinic_beds b ON b.id::text = c.bed_id::text
        ORDER BY c.created_at DESC;
      `;
    }

    // Process and enrich claims with dynamic SLA calculation and parsed JSON fields
    const enrichedClaims = claims.map((c: any) => {
      const queryDetails = typeof c.tpa_query_details === "string" 
        ? JSON.parse(c.tpa_query_details || "{}") 
        : (c.tpa_query_details || {});

      const settlementDetails = typeof c.settlement_details === "string"
        ? JSON.parse(c.settlement_details || "{}")
        : (c.settlement_details || {});

      const docsChecklist = typeof c.mandatory_docs_checklist === "string"
        ? JSON.parse(c.mandatory_docs_checklist || "[]")
        : (c.mandatory_docs_checklist || []);

      const auditTrail = typeof c.audit_trail === "string"
        ? JSON.parse(c.audit_trail || "[]")
        : (c.audit_trail || []);

      const slaInfo = c.status === "query_raised" ? calculateQuerySla(queryDetails) : null;

      const totalDocs = docsChecklist.length;
      const verifiedDocs = docsChecklist.filter((d: any) => d.verified).length;
      const isDocsComplete = totalDocs > 0 && verifiedDocs === totalDocs;

      return {
        ...c,
        estimated_amount: parseFloat(c.estimated_amount || 0),
        approved_amount: parseFloat(c.approved_amount || 0),
        package_rate_cap: parseFloat(c.package_rate_cap || 0),
        mandatory_docs_checklist: docsChecklist,
        tpa_query_details: queryDetails,
        settlement_details: settlementDetails,
        audit_trail: auditTrail,
        sla_info: slaInfo,
        docs_summary: {
          total: totalDocs,
          verified: verifiedDocs,
          is_complete: isDocsComplete
        }
      };
    });

    const counts = await db`
      SELECT 
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE status = 'pre_auth_submitted' OR status = 'under_review') as pre_auth_count,
        COUNT(*) FILTER (WHERE status = 'query_raised') as query_count,
        COUNT(*) FILTER (WHERE status = 'approved') as approved_count,
        COUNT(*) FILTER (WHERE status = 'settled') as settled_count,
        COALESCE(SUM(approved_amount), 0) as total_approved_amount
      FROM insurance_claims;
    `;

    // Calculate advanced metrics
    const slaBreachedCount = enrichedClaims.filter((c: any) => c.sla_info?.isBreached).length;
    const disputedCount = enrichedClaims.filter((c: any) => c.settlement_details?.dispute_status === "dispute_queued").length;
    const totalRemitted = enrichedClaims.reduce((sum: number, c: any) => sum + (c.settlement_details?.remitted_amount || 0), 0);

    return NextResponse.json({
      claims: enrichedClaims,
      metrics: {
        total: parseInt(counts[0].total) || 0,
        pre_auth: parseInt(counts[0].pre_auth_count) || 0,
        query_raised: parseInt(counts[0].query_count) || 0,
        approved: parseInt(counts[0].approved_count) || 0,
        settled: parseInt(counts[0].settled_count) || 0,
        total_approved_amount: parseFloat(counts[0].total_approved_amount) || 0,
        sla_breached_count: slaBreachedCount,
        disputed_count: disputedCount,
        total_remitted_amount: totalRemitted
      }
    });
  } catch (error: any) {
    console.error("Fetch insurance claims error:", error);
    return NextResponse.json({ error: error.message || "Failed to load insurance claims" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      patient_name,
      patient_phone,
      policy_number,
      tpa_company,
      procedure_code,
      bed_id,
      estimated_amount,
      remarks,
      mandatory_docs_checklist,
      package_override_pin,
      package_override_reason,
      as_draft = false
    } = body;

    if (!patient_name || !patient_phone || !policy_number || !tpa_company || !procedure_code) {
      return NextResponse.json({ 
        error: "patient_name, patient_phone, policy_number, tpa_company, and procedure_code are required" 
      }, { status: 400 });
    }

    // Look up procedure specification
    const proc = PROCEDURE_CATALOG.find(p => p.code === procedure_code);
    if (!proc) {
      return NextResponse.json({ error: `Invalid procedure code: ${procedure_code}` }, { status: 400 });
    }

    const estAmount = parseFloat(estimated_amount) || 0;
    const rateCap = proc.tpa_rate_caps[tpa_company] || 25000;
    const isRateOverrun = estAmount > rateCap;

    // FIX 2: Corporate Package Rate Governance
    let overrideAuthorizedBy = null;
    if (isRateOverrun && !as_draft) {
      if (!package_override_pin) {
        return NextResponse.json({
          error: `PACKAGE RATE OVERRUN BLOCKED: Estimated amount ₹${estAmount.toLocaleString()} exceeds negotiated ${tpa_company} cap of ₹${rateCap.toLocaleString()} by ₹${(estAmount - rateCap).toLocaleString()}. Submission requires Finance Head PIN authorization.`,
          code: "PACKAGE_RATE_OVERRUN_REQUIRES_PIN",
          rate_cap: rateCap,
          excess_amount: estAmount - rateCap
        }, { status: 422 });
      }

      const matchedPin = AUTHORIZED_FINANCE_PINS.find(p => p.pin === package_override_pin);
      if (!matchedPin) {
        return NextResponse.json({
          error: "INVALID FINANCE PIN: Authorization failed. Only Finance Head or Hospital Billing Director PIN can override package rate caps.",
          code: "INVALID_FINANCE_PIN"
        }, { status: 403 });
      }

      overrideAuthorizedBy = `${matchedPin.name} (${matchedPin.role})`;
    }

    // FIX 1: Pre-Authorization Validation Rules & Mandatory Document Checklist
    const preparedChecklist: MandatoryDocumentItem[] = Array.isArray(mandatory_docs_checklist) && mandatory_docs_checklist.length > 0
      ? mandatory_docs_checklist
      : proc.mandatory_documents.map(d => ({ ...d }));

    if (!as_draft) {
      const missingDocs = preparedChecklist.filter(d => d.is_mandatory && !d.verified);
      if (missingDocs.length > 0) {
        return NextResponse.json({
          error: `PRE-AUTH SUBMISSION BLOCKED: Mandatory clinical documents missing verification: ${missingDocs.map(d => d.label).join("; ")}. Insurer will auto-reject incomplete dossier.`,
          code: "MANDATORY_DOCS_INCOMPLETE",
          missing_documents: missingDocs
        }, { status: 422 });
      }
    }

    const tpaInitials = tpa_company.split(" ")[0].toUpperCase().slice(0, 4);
    const claimNumber = `CLM-${new Date().getFullYear()}-${tpaInitials}-${Math.floor(1000 + Math.random() * 9000)}`;
    const initialStatus = as_draft ? "draft" : "pre_auth_submitted";

    const nowIso = new Date().toISOString();
    const auditTrail = [
      {
        action: as_draft ? "CLAIM_DRAFT_CREATED" : "PRE_AUTH_SUBMITTED",
        timestamp: nowIso,
        by: "TPA Desk Executive",
        notes: as_draft 
          ? "Claim saved as draft pending document verification."
          : `Pre-auth dossier validated with 100% document checklist. Hospital ROHINI Code: ROHINI-UK-DED-0418.`
      }
    ];

    if (isRateOverrun && overrideAuthorizedBy) {
      auditTrail.unshift({
        action: "PACKAGE_RATE_OVERRUN_AUTHORIZED",
        timestamp: nowIso,
        by: overrideAuthorizedBy,
        notes: `Estimate ₹${estAmount} exceeds cap ₹${rateCap}. Override reason: ${package_override_reason || "COMORBIDITY_HIGH_RISK"}`
      });
    }

    const inserted = await db`
      INSERT INTO insurance_claims (
        claim_number,
        patient_name,
        patient_phone,
        policy_number,
        tpa_company,
        procedure_code,
        procedure_name,
        package_rate_cap,
        package_rate_overrun,
        package_override_pin,
        package_override_reason,
        package_override_by,
        bed_id,
        estimated_amount,
        approved_amount,
        status,
        remarks,
        mandatory_docs_checklist,
        tpa_query_details,
        settlement_details,
        audit_trail
      ) VALUES (
        ${claimNumber},
        ${patient_name},
        ${patient_phone},
        ${policy_number},
        ${tpa_company},
        ${procedure_code},
        ${proc.name},
        ${rateCap},
        ${isRateOverrun},
        ${package_override_pin || null},
        ${package_override_reason || null},
        ${overrideAuthorizedBy},
        ${bed_id || null},
        ${estAmount},
        0,
        ${initialStatus},
        ${remarks || `Cashless pre-auth claim submission for ${proc.name}.`},
        ${JSON.stringify(preparedChecklist)}::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        ${JSON.stringify(auditTrail)}::jsonb
      ) RETURNING *;
    `;

    return NextResponse.json({ 
      success: true, 
      claim: inserted[0],
      message: as_draft 
        ? "Draft claim saved successfully. Complete document verification prior to submission." 
        : "Pre-authorization successfully validated and submitted to TPA portal."
    });
  } catch (error: any) {
    console.error("Create insurance claim error:", error);
    return NextResponse.json({ error: error.message || "Failed to submit insurance claim" }, { status: 500 });
  }
}
