import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { createHash, randomUUID } from "crypto";
import { guard, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { findClinicLabOrder } from "@/lib/lab-scope";

export const dynamic = "force-dynamic";

// Critical value thresholds per NABL / clinical pathology safety standards.
interface CriticalRule {
  param: string;
  isCritical: (val: number) => boolean;
  alertMsg: (val: number) => string;
}

const CRITICAL_RULES: CriticalRule[] = [
  {
    param: "Hemoglobin",
    isCritical: (v) => v < 7.0 || v > 20.0,
    alertMsg: (v) =>
      v < 7.0
        ? `CRITICAL SEVERE ANEMIA: Hb ${v} g/dL (< 7.0 g/dL, transfusion risk)`
        : `CRITICAL POLYCYTHEMIA: Hb ${v} g/dL (> 20.0 g/dL)`,
  },
  {
    param: "Platelet Count",
    isCritical: (v) => v < 20000 || v > 1000000,
    alertMsg: (v) =>
      v < 20000
        ? `CRITICAL THROMBOCYTOPENIA: Platelets ${v} /cumm (< 20,000 /cumm, hemorrhage risk)`
        : `CRITICAL THROMBOCYTOSIS: Platelets ${v} /cumm`,
  },
  {
    param: "Total Leukocyte Count (TLC)",
    isCritical: (v) => v < 2000 || v > 30000,
    alertMsg: (v) =>
      v < 2000
        ? `CRITICAL LEUKOPENIA: TLC ${v} /cumm (< 2,000, sepsis risk)`
        : `CRITICAL LEUKOCYTOSIS: TLC ${v} /cumm (> 30,000)`,
  },
  {
    param: "Fasting Blood Sugar (FBS)",
    isCritical: (v) => v < 50 || v > 400,
    alertMsg: (v) =>
      v < 50
        ? `CRITICAL HYPOGLYCEMIA: Glucose ${v} mg/dL (< 50, coma risk)`
        : `CRITICAL HYPERGLYCEMIA: Glucose ${v} mg/dL (> 400, DKA risk)`,
  },
  {
    param: "Post-Prandial Blood Sugar",
    isCritical: (v) => v < 50 || v > 450,
    alertMsg: (v) => `CRITICAL GLUCOSE SPIKE: ${v} mg/dL`,
  },
  {
    param: "Potassium",
    isCritical: (v) => v < 2.8 || v > 6.0,
    alertMsg: (v) =>
      v < 2.8
        ? `CRITICAL HYPOKALEMIA: K+ ${v} mmol/L (< 2.8, cardiac arrhythmia)`
        : `CRITICAL HYPERKALEMIA: K+ ${v} mmol/L (> 6.0, cardiac arrest risk)`,
  },
  {
    param: "Serum Creatinine",
    isCritical: (v) => v > 5.0,
    alertMsg: (v) => `CRITICAL ACUTE RENAL INJURY: Creatinine ${v} mg/dL (> 5.0)`,
  },
  {
    param: "Bilirubin Total",
    isCritical: (v) => v > 15.0,
    alertMsg: (v) => `CRITICAL HYPERBILIRUBINEMIA: Total Bilirubin ${v} mg/dL (> 15.0)`,
  },
];

/**
 * Sign off a lab report.
 *
 * The order must belong to the caller's clinic (via its originating
 * appointment or prescription). The verifying pathologist's registration
 * number is required — a report is never signed with an invented identity.
 * QC verification is only recorded when a passing QC run actually exists for
 * this clinic.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINICAL_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const clinicSlug = auth.auth.clinic!.slug;

    const body = await req.json();
    const {
      order_id,
      results,
      pathologist_notes = null,
      verified_by,
      pathologist_reg_no,
    } = body;

    if (!order_id || !Array.isArray(results) || results.length === 0) {
      return apiError(
        400,
        "order_id and a non-empty results array are required.",
        "invalid_input"
      );
    }

    const verifiedByName = String(verified_by || auth.auth.user.full_name || "").trim();
    const regNo = String(pathologist_reg_no || "").trim();
    if (!verifiedByName) {
      return apiError(400, "verified_by is required.", "verifier_required");
    }
    if (!regNo) {
      return apiError(
        422,
        "The signing pathologist's registration number is required on a lab report.",
        "registration_required"
      );
    }

    const order = await findClinicLabOrder(clinicId, order_id);
    if (!order) {
      return apiError(404, "Lab order not found in your clinic.", "order_not_found");
    }

    for (const r of results) {
      if (!r || !r.parameter || r.value === undefined || r.value === null || r.value === "") {
        return apiError(
          400,
          "Each result needs a parameter and a value.",
          "invalid_result"
        );
      }
    }

    // Evaluate quantitative values against critical thresholds.
    let hasCritical = false;
    const criticalParams: string[] = [];

    const processedResults = results.map((r: any) => {
      const numVal = parseFloat(String(r.value).replace(/[^0-9.]/g, ""));
      let status = r.status || "normal";

      if (!isNaN(numVal)) {
        for (const rule of CRITICAL_RULES) {
          if (String(r.parameter).toLowerCase().includes(rule.param.toLowerCase())) {
            if (rule.isCritical(numVal)) {
              status = "critical";
              hasCritical = true;
              criticalParams.push(rule.alertMsg(numVal));
            }
            break;
          }
        }
      }

      return { ...r, status };
    });

    // Tamper-evident seal over the server-authoritative payload.
    const verificationTimestamp = new Date().toISOString();
    const rawPayload = `${order.id}-${order.order_number}-${JSON.stringify(
      processedResults
    )}-${verifiedByName}-${regNo}-${verificationTimestamp}`;
    const reportSha256 = createHash("sha256").update(rawPayload).digest("hex");

    // QC is only "verified" if the clinic actually has a passing run on record.
    const qcRuns = await sql`
      SELECT westgard_status FROM lis_quality_control_runs
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY run_at DESC
      LIMIT 1;
    `;
    const qcVerified =
      qcRuns.length > 0 &&
      !String(qcRuns[0].westgard_status || "").includes("REJECTED");

    if (hasCritical) {
      const existingAlert = await sql`
        SELECT id FROM lis_critical_alert_logs
        WHERE order_id = ${order.id}
          AND parameter_name = ${criticalParams.join("; ")}
        LIMIT 1;
      `;
      if (existingAlert.length === 0) {
        await sql`
          INSERT INTO lis_critical_alert_logs (
            id, order_id, order_number, patient_name, doctor_name,
            doctor_phone, parameter_name, critical_value, reference_limit, channel
          ) VALUES (
            ${randomUUID()},
            ${order.id},
            ${order.order_number},
            ${order.patient_name},
            ${order.doctor_name},
            ${order.patient_phone},
            ${criticalParams.join("; ")},
            'CRITICAL_VALUE_BREACH',
            'NABL_SAFETY_LIMIT',
            'manual_log'
          );
        `;
      }
    }

    const updated = await sql`
      UPDATE diagnostic_lab_orders
      SET
        results = ${JSON.stringify(processedResults)}::jsonb,
        pathologist_notes = ${pathologist_notes},
        verified_by = ${verifiedByName},
        pathologist_reg_no = ${regNo},
        verified_at = NOW(),
        status = 'completed',
        critical_value_alert = ${hasCritical},
        critical_parameters = ${JSON.stringify(criticalParams)}::jsonb,
        report_sha256 = ${reportSha256},
        qc_verified = ${qcVerified},
        updated_at = NOW()
      WHERE id = ${String(order.id)}
      RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "lab.results.sign",
      entity: "diagnostic_lab_order",
      entityId: String(order.id),
      after: {
        critical_value_alert: hasCritical,
        critical_parameters: criticalParams,
        verified_by: verifiedByName,
        pathologist_reg_no: regNo,
        report_sha256: reportSha256,
        qc_verified: qcVerified,
      },
      request: req,
    });

    return NextResponse.json({
      success: true,
      critical_value_alert: hasCritical,
      critical_reasons: criticalParams,
      qc_verified: qcVerified,
      report_sha256: reportSha256,
      message: hasCritical
        ? `Report signed with critical values: ${criticalParams.join(
            ". "
          )}. Notify the ordering doctor and record the read-back.`
        : `Diagnostic report signed by ${verifiedByName} (${regNo}). SHA-256: ${reportSha256.substring(
            0,
            16
          )}…`,
      order: updated[0],
    });
  } catch (error: any) {
    console.error("POST /api/lab/results error:", error);
    return apiError(500, "Failed to save lab results.", "internal_error");
  }
}
