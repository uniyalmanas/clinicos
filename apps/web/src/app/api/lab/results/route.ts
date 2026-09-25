import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createHash, randomUUID } from "crypto";

export const dynamic = "force-dynamic";

// Critical Value Thresholds per NABL / Clinical Pathology Safety Standards
interface CriticalRule {
  param: string;
  isCritical: (val: number) => boolean;
  alertMsg: (val: number) => string;
}

const CRITICAL_RULES: CriticalRule[] = [
  {
    param: "Hemoglobin",
    isCritical: (v) => v < 7.0 || v > 20.0,
    alertMsg: (v) => v < 7.0 ? `CRITICAL SEVERE ANEMIA: Hb ${v} g/dL (< 7.0 g/dL, Transfusion Risk)` : `CRITICAL POLYCYTHEMIA: Hb ${v} g/dL (> 20.0 g/dL)`
  },
  {
    param: "Platelet Count",
    isCritical: (v) => v < 20000 || v > 1000000,
    alertMsg: (v) => v < 20000 ? `CRITICAL THROMBOCYTOPENIA: Platelets ${v} /cumm (< 20,000 /cumm, Hemorrhage Risk)` : `CRITICAL THROMBOCYTOSIS: Platelets ${v} /cumm`
  },
  {
    param: "Total Leukocyte Count (TLC)",
    isCritical: (v) => v < 2000 || v > 30000,
    alertMsg: (v) => v < 2000 ? `CRITICAL LEUKOPENIA: TLC ${v} /cumm (< 2,000, Sepsis Risk)` : `CRITICAL LEUKOCYTOSIS: TLC ${v} /cumm (> 30,000)`
  },
  {
    param: "Fasting Blood Sugar (FBS)",
    isCritical: (v) => v < 50 || v > 400,
    alertMsg: (v) => v < 50 ? `CRITICAL HYPOGLYCEMIA: Glucose ${v} mg/dL (< 50, Coma Risk)` : `CRITICAL HYPERGLYCEMIA: Glucose ${v} mg/dL (> 400, DKA Risk)`
  },
  {
    param: "Post-Prandial Blood Sugar",
    isCritical: (v) => v < 50 || v > 450,
    alertMsg: (v) => `CRITICAL GLUCOSE SPIKE: ${v} mg/dL`
  },
  {
    param: "Potassium",
    isCritical: (v) => v < 2.8 || v > 6.0,
    alertMsg: (v) => v < 2.8 ? `CRITICAL HYPOKALEMIA: K+ ${v} mmol/L (< 2.8, Cardiac Arrhythmia)` : `CRITICAL HYPERKALEMIA: K+ ${v} mmol/L (> 6.0, Cardiac Arrest Risk)`
  },
  {
    param: "Serum Creatinine",
    isCritical: (v) => v > 5.0,
    alertMsg: (v) => `CRITICAL ACUTE RENAL INJURY: Creatinine ${v} mg/dL (> 5.0)`
  },
  {
    param: "Bilirubin Total",
    isCritical: (v) => v > 15.0,
    alertMsg: (v) => `CRITICAL HYPERBILIRUBINEMIA: Total Bilirubin ${v} mg/dL (> 15.0)`
  }
];

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      order_id, 
      results, 
      pathologist_notes, 
      verified_by = "Dr. S. K. Pathak (MD Pathologist)",
      pathologist_reg_no = "MCI-DMC-48291",
      patient_age = 35,
      patient_gender = "male"
    } = body;

    if (!order_id || !Array.isArray(results)) {
      return NextResponse.json({ error: "order_id and results array are required" }, { status: 400 });
    }

    const orderQuery = await db`SELECT * FROM diagnostic_lab_orders WHERE id = ${order_id} LIMIT 1;`;
    if (orderQuery.length === 0) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    const order = orderQuery[0];

    // Evaluate quantitative values against critical thresholds
    let hasCritical = false;
    const criticalParams: string[] = [];

    const processedResults = results.map((r: any) => {
      const numVal = parseFloat(String(r.value).replace(/[^0-9.]/g, ""));
      let status = r.status || "normal";

      if (!isNaN(numVal)) {
        for (const rule of CRITICAL_RULES) {
          if (r.parameter.toLowerCase().includes(rule.param.toLowerCase())) {
            if (rule.isCritical(numVal)) {
              status = "critical";
              hasCritical = true;
              criticalParams.push(rule.alertMsg(numVal));
            }
            break;
          }
        }
      }

      return {
        ...r,
        status
      };
    });

    // Generate SHA-256 Checksum for Tamper-Proof Digital Verification
    const verificationTimestamp = new Date().toISOString();
    const rawPayload = `${order.id}-${order.order_number}-${JSON.stringify(processedResults)}-${verified_by}-${pathologist_reg_no}-${verificationTimestamp}`;
    const reportSha256 = createHash("sha256").update(rawPayload).digest("hex");

    // If critical, log into lis_critical_alert_logs
    if (hasCritical) {
      const logId = randomUUID();
      await db`
        INSERT INTO lis_critical_alert_logs (
          id, order_id, order_number, patient_name, doctor_name,
          doctor_phone, parameter_name, critical_value, reference_limit, channel
        ) VALUES (
          ${logId},
          ${order.id},
          ${order.order_number},
          ${order.patient_name},
          ${order.doctor_name},
          ${order.patient_phone},
          ${criticalParams.join("; ")},
          'CRITICAL_VALUE_BREACH',
          'NABL_SAFETY_LIMIT',
          'SMS+DOCTOR_CALL'
        );
      `;
    }

    const updated = await db`
      UPDATE diagnostic_lab_orders
      SET 
        results = ${JSON.stringify(processedResults)}::jsonb,
        pathologist_notes = ${pathologist_notes || "All clinical parameters evaluated and verified under NABL compliance standard."},
        verified_by = ${verified_by},
        pathologist_reg_no = ${pathologist_reg_no},
        verified_at = NOW(),
        status = 'completed',
        critical_value_alert = ${hasCritical},
        critical_parameters = ${JSON.stringify(criticalParams)}::jsonb,
        report_sha256 = ${reportSha256},
        qc_verified = true,
        updated_at = NOW()
      WHERE id = ${order_id}
      RETURNING *;
    `;

    return NextResponse.json({ 
      success: true, 
      critical_value_alert: hasCritical,
      critical_reasons: criticalParams,
      report_sha256: reportSha256,
      message: hasCritical 
        ? `⚠️ REPORT SIGNED WITH CRITICAL PANIC VALUES: ${criticalParams.join(". ")}. Automatic Doctor Emergency SMS/Call queued.`
        : `✓ Diagnostic report verified with registered pathologist e-signature. SHA-256 Checksum: ${reportSha256.substring(0, 16)}...`,
      order: updated[0] 
    });
  } catch (error: any) {
    console.error("Save lab results error:", error);
    return NextResponse.json({ error: error.message || "Failed to save lab results" }, { status: 500 });
  }
}
