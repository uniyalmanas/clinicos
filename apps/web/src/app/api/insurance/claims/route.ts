import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, ADMIN_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import {
  PROCEDURE_CATALOG,
  calculateQuerySla,
  MandatoryDocumentItem,
} from "@/data/insuranceGovernance";

export const dynamic = "force-dynamic";

/**
 * Insurance claims are tenant-scoped through the clinic that opened them. A
 * claim with no clinic key (legacy row with no bed) is never returned to
 * anyone, so one clinic can never read another clinic's patient finance data.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const claims =
      status && status !== "all"
        ? await sql`
            SELECT c.*, b.bed_number
            FROM insurance_claims c
            LEFT JOIN clinic_beds b
              ON b.id::text = c.bed_id::text AND b.clinic_slug = ${clinicSlug}
            WHERE c.clinic_slug = ${clinicSlug}
              AND c.status = ${status}
            ORDER BY c.created_at DESC;
          `
        : await sql`
            SELECT c.*, b.bed_number
            FROM insurance_claims c
            LEFT JOIN clinic_beds b
              ON b.id::text = c.bed_id::text AND b.clinic_slug = ${clinicSlug}
            WHERE c.clinic_slug = ${clinicSlug}
            ORDER BY c.created_at DESC;
          `;

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

    const enrichedClaims = claims.map((c: any) => {
      const queryDetails = parseJson(c.tpa_query_details, {});
      const settlementDetails = parseJson(c.settlement_details, {});
      const docsChecklist = parseJson(c.mandatory_docs_checklist, []);
      const auditTrail = parseJson(c.audit_trail, []);

      const slaInfo =
        c.status === "query_raised" ? calculateQuerySla(queryDetails) : null;

      const totalDocs = docsChecklist.length;
      const verifiedDocs = docsChecklist.filter((d: any) => d.verified).length;

      return {
        ...c,
        estimated_amount: c.estimated_amount == null ? null : Number(c.estimated_amount),
        approved_amount: c.approved_amount == null ? null : Number(c.approved_amount),
        package_rate_cap: c.package_rate_cap == null ? null : Number(c.package_rate_cap),
        mandatory_docs_checklist: docsChecklist,
        tpa_query_details: queryDetails,
        settlement_details: settlementDetails,
        audit_trail: auditTrail,
        sla_info: slaInfo,
        docs_summary: {
          total: totalDocs,
          verified: verifiedDocs,
          is_complete: totalDocs > 0 && verifiedDocs === totalDocs,
        },
      };
    });

    const counts = await sql`
      SELECT
        COUNT(*) AS total,
        COUNT(*) FILTER (WHERE status = 'pre_auth_submitted' OR status = 'under_review') AS pre_auth_count,
        COUNT(*) FILTER (WHERE status = 'query_raised') AS query_count,
        COUNT(*) FILTER (WHERE status = 'approved') AS approved_count,
        COUNT(*) FILTER (WHERE status = 'settled') AS settled_count,
        COALESCE(SUM(approved_amount), 0) AS total_approved_amount
      FROM insurance_claims
      WHERE clinic_slug = ${clinicSlug};
    `;

    const slaBreachedCount = enrichedClaims.filter((c: any) => c.sla_info?.isBreached).length;
    const disputedCount = enrichedClaims.filter(
      (c: any) => c.settlement_details?.dispute_status === "dispute_queued"
    ).length;
    const totalRemitted = enrichedClaims.reduce(
      (sum: number, c: any) => sum + (Number(c.settlement_details?.remitted_amount) || 0),
      0
    );

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
        total_remitted_amount: totalRemitted,
      },
    });
  } catch (error: any) {
    console.error("GET /api/insurance/claims error:", error);
    return apiError(500, "Failed to load insurance claims.", "internal_error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;
    const actorName = auth.auth.user.full_name;

    const body = await req.json();
    const {
      patient_name,
      patient_phone,
      policy_number,
      tpa_company,
      procedure_code,
      bed_id = null,
      estimated_amount,
      remarks = null,
      mandatory_docs_checklist,
      package_override_reason = null,
      as_draft = false,
    } = body;

    if (!patient_name || !patient_phone || !policy_number || !tpa_company || !procedure_code) {
      return apiError(
        400,
        "patient_name, patient_phone, policy_number, tpa_company and procedure_code are required.",
        "invalid_input"
      );
    }

    const proc = PROCEDURE_CATALOG.find((p) => p.code === procedure_code);
    if (!proc) {
      return apiError(400, `Invalid procedure code: ${procedure_code}.`, "invalid_procedure");
    }

    const estAmount = Number(estimated_amount);
    if (!Number.isFinite(estAmount) || estAmount <= 0) {
      return apiError(
        400,
        "estimated_amount must be a positive number.",
        "invalid_amount"
      );
    }

    if (bed_id) {
      const bedRows = await sql`
        SELECT id FROM clinic_beds
        WHERE id::text = ${String(bed_id)}
          AND clinic_slug = ${clinicSlug}
        LIMIT 1;
      `;
      if (bedRows.length === 0) {
        return apiError(404, "Bed not found in your clinic.", "bed_not_found");
      }
    }

    // A negotiated cap comes from the tariff schedule. When the TPA has no
    // published cap on file, none is assumed — the claim is simply not
    // rate-capped instead of being compared to an invented number.
    const rateCap = proc.tpa_rate_caps?.[tpa_company] ?? null;
    const isRateOverrun = rateCap != null && estAmount > rateCap;

    let overrideAuthorizedBy: string | null = null;
    if (isRateOverrun && !as_draft) {
      const isAdmin = ADMIN_ROLES.some((r) => r === auth.auth.role);
      if (!isAdmin) {
        return apiError(
          403,
          `Estimated amount ₹${estAmount.toLocaleString("en-IN")} exceeds the negotiated ${tpa_company} cap of ₹${rateCap!.toLocaleString(
            "en-IN"
          )}. Only an owner or clinic administrator may authorize the overrun.`,
          "override_forbidden"
        );
      }
      if (!String(package_override_reason || "").trim()) {
        return apiError(
          422,
          "package_override_reason is required when the estimate exceeds the cap.",
          "override_reason_required"
        );
      }
      overrideAuthorizedBy = actorName;
    }

    const preparedChecklist: MandatoryDocumentItem[] =
      Array.isArray(mandatory_docs_checklist) && mandatory_docs_checklist.length > 0
        ? mandatory_docs_checklist
        : proc.mandatory_documents.map((d) => ({ ...d }));

    if (!as_draft) {
      const missingDocs = preparedChecklist.filter((d) => d.is_mandatory && !d.verified);
      if (missingDocs.length > 0) {
        return NextResponse.json(
          {
            error: `Pre-auth submission blocked. Mandatory documents are unverified: ${missingDocs
              .map((d) => d.label)
              .join("; ")}.`,
            code: "MANDATORY_DOCS_INCOMPLETE",
            missing_documents: missingDocs,
          },
          { status: 422 }
        );
      }
    }

    const tpaInitials = tpa_company.split(" ")[0].toUpperCase().slice(0, 4);
    const claimNumber = `CLM-${new Date().getFullYear()}-${tpaInitials}-${Math.floor(
      1000 + Math.random() * 9000
    )}`;
    const initialStatus = as_draft ? "draft" : "pre_auth_submitted";
    const nowIso = new Date().toISOString();

    const auditTrail: any[] = [
      {
        action: as_draft ? "CLAIM_DRAFT_CREATED" : "PRE_AUTH_SUBMITTED",
        timestamp: nowIso,
        by: actorName,
        notes: as_draft
          ? "Claim saved as draft pending document verification."
          : "Pre-auth dossier validated with the mandatory document checklist.",
      },
    ];

    if (isRateOverrun && overrideAuthorizedBy) {
      auditTrail.unshift({
        action: "PACKAGE_RATE_OVERRUN_AUTHORIZED",
        timestamp: nowIso,
        by: overrideAuthorizedBy,
        notes: `Estimate ₹${estAmount} exceeds cap ₹${rateCap}. Reason: ${package_override_reason}`,
      });
    }

    const inserted = await sql`
      INSERT INTO insurance_claims (
        claim_number,
        clinic_slug,
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
        ${clinicSlug},
        ${String(patient_name)},
        ${String(patient_phone)},
        ${String(policy_number)},
        ${String(tpa_company)},
        ${String(procedure_code)},
        ${proc.name},
        ${rateCap},
        ${isRateOverrun},
        NULL,
        ${package_override_reason},
        ${overrideAuthorizedBy},
        ${bed_id ? String(bed_id) : null},
        ${estAmount},
        NULL,
        ${initialStatus},
        ${remarks},
        ${JSON.stringify(preparedChecklist)}::jsonb,
        '{}'::jsonb,
        '{}'::jsonb,
        ${JSON.stringify(auditTrail)}::jsonb
      ) RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: as_draft ? "insurance.claim.draft" : "insurance.claim.submit",
      entity: "insurance_claim",
      entityId: String(inserted[0].id),
      after: {
        claim_number: claimNumber,
        procedure_code,
        tpa_company,
        estimated_amount: estAmount,
        rate_cap: rateCap,
        overrun: isRateOverrun,
      },
      request: req,
    });

    return NextResponse.json({
      success: true,
      claim: inserted[0],
      message: as_draft
        ? "Draft claim saved. Complete document verification before submission."
        : "Pre-authorization validated and submitted to the TPA.",
    });
  } catch (error: any) {
    console.error("POST /api/insurance/claims error:", error);
    return apiError(500, "Failed to submit insurance claim.", "internal_error");
  }
}
