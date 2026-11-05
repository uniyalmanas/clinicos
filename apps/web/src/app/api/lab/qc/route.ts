import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Levey-Jennings quality control runs.
 *
 * Every run is stored against the caller's clinic. Values must be supplied by
 * the technician; no analyzer, lot, or control statistics are assumed.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINICAL_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;

    const runs = await sql`
      SELECT * FROM lis_quality_control_runs
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY run_at DESC
      LIMIT 20;
    `;

    const failedRuns = runs.filter((r: any) =>
      String(r.westgard_status || "").includes("REJECTED")
    );

    return NextResponse.json({
      success: true,
      qc_status: failedRuns.length === 0 ? "CALIBRATED_PASSED" : "QC_FAILED_BLOCKED",
      failed_count: failedRuns.length,
      total_runs: runs.length,
      runs,
    });
  } catch (error: any) {
    console.error("GET QC runs error:", error);
    return apiError(500, "Failed to load QC runs.", "internal_error");
  }
}

export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINICAL_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    const body = await req.json();
    const {
      analyzer_name,
      test_category,
      control_lot_number,
      level,
      target_mean,
      target_sd,
      measured_value,
    } = body;

    if (
      !analyzer_name ||
      !test_category ||
      !control_lot_number ||
      !level ||
      target_mean == null ||
      target_sd == null ||
      measured_value == null
    ) {
      return apiError(
        400,
        "analyzer_name, test_category, control_lot_number, level, target_mean, target_sd and measured_value are required.",
        "invalid_input"
      );
    }

    const mean = Number(target_mean);
    const sd = Number(target_sd);
    const measured = Number(measured_value);
    if (!Number.isFinite(mean) || !Number.isFinite(measured)) {
      return apiError(400, "Control values must be numeric.", "invalid_values");
    }
    if (!Number.isFinite(sd) || sd <= 0) {
      return apiError(400, "target_sd must be greater than zero.", "invalid_sd");
    }

    const zScore = Math.round(((measured - mean) / sd) * 100) / 100;
    const absZ = Math.abs(zScore);

    let westgardStatus = "PASSED (within 1 SD)";
    if (absZ > 3.0) {
      westgardStatus = "1-3s REJECTED: out of control (> 3 SD random error)";
    } else if (absZ > 2.0) {
      westgardStatus = "2-2s WARNING: exceeds 2 SD threshold";
    } else if (absZ > 1.0) {
      westgardStatus = "1-2s WARNING: acceptable variation (1-2 SD)";
    }

    const runId = randomUUID();
    const newRun = await sql`
      INSERT INTO lis_quality_control_runs (
        id, clinic_slug, analyzer_name, test_category, control_lot_number, level,
        target_mean, target_sd, measured_value, z_score, westgard_status,
        calibrated_by, run_at
      ) VALUES (
        ${runId}, ${clinicSlug}, ${String(analyzer_name)}, ${String(test_category)},
        ${String(control_lot_number)}, ${String(level)},
        ${mean}, ${sd}, ${measured}, ${zScore}, ${westgardStatus},
        ${auth.auth.user.full_name}, NOW()
      )
      RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "lab.qc.run",
      entity: "lis_quality_control_run",
      entityId: runId,
      after: { analyzer_name, z_score: zScore, westgard_status: westgardStatus },
      request: req,
    });

    return NextResponse.json({
      success: true,
      z_score: zScore,
      westgard_status: westgardStatus,
      passed: !westgardStatus.includes("REJECTED"),
      run: newRun[0],
      message: westgardStatus.includes("REJECTED")
        ? `QC rejection: measured ${measured} violated the 1-3s rule (Z=${zScore}). Analyzer blocked until recalibration.`
        : `Levey-Jennings QC passed for ${analyzer_name} (Z=${zScore}).`,
    });
  } catch (error: any) {
    console.error("POST QC run error:", error);
    return apiError(500, "Failed to record QC run.", "internal_error");
  }
}
