import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

// Strict anatomical physiological limits per joint.
const ANATOMICAL_LIMITS: Record<string, { max: number; min: number }> = {
  shoulder: { min: 0, max: 180 },
  knee: { min: -10, max: 150 },
  "lumbar spine": { min: 0, max: 75 },
  "cervical spine": { min: 0, max: 85 },
  hip: { min: 0, max: 130 },
  ankle: { min: 0, max: 55 },
  elbow: { min: 0, max: 150 },
  wrist: { min: 0, max: 90 },
};

function parseArray(value: unknown): unknown[] {
  let parsed: unknown = value;
  if (typeof parsed === "string") {
    try {
      parsed = JSON.parse(parsed);
    } catch {
      return [];
    }
  }
  return Array.isArray(parsed) ? parsed : [];
}

export async function POST(req: NextRequest) {
  const auth = await guard(req, { roles: CLINIC_ROLES });
  if (!auth.ok) return auth.response;

  const clinicId = auth.auth.clinic!.id;
  const clinicSlug = auth.auth.clinic!.slug;

  try {
    const body = await req.json();
    const {
      plan_id,
      session_number,
      pain_score_before,
      pain_score_after,
      rom_joint,
      rom_plane,
      rom_degrees,
      rom_method,
      rom_laterality,
      range_of_motion,
      exercises_performed,
      modality_applied,
      tolerance_rating,
      homework_assigned,
      therapist_notes,
    } = body;

    if (!plan_id) {
      return apiError(400, "plan_id is required.", "invalid_input");
    }

    // The plan must belong to the caller's clinic before any session is logged.
    const currentPlan = await db`
      SELECT * FROM therapy_plans
      WHERE id = ${plan_id} AND clinic_slug = ${clinicSlug}
      LIMIT 1;
    `;
    if (!currentPlan || currentPlan.length === 0) {
      return apiError(404, "Therapy plan not found in your clinic.", "plan_not_found");
    }

    // Clinical audit: the measurement method is mandatory.
    if (!rom_method || !String(rom_method).trim()) {
      return apiError(
        400,
        "Input Rejected: Measurement method field (Universal Goniometer / Sensor) is mandatory under clinical audit standards.",
        "rom_method_required"
      );
    }

    const degrees = Number(rom_degrees);
    const jointKey = String(rom_joint || "shoulder").toLowerCase().trim();
    const matchedLimit = Object.entries(ANATOMICAL_LIMITS).find(([k]) =>
      jointKey.includes(k)
    );

    if (matchedLimit) {
      const { min, max } = matchedLimit[1];
      if (degrees > max || degrees < min) {
        return apiError(
          400,
          `Input Rejected: ${degrees}° exceeds physiological anatomical limit for ${rom_joint} (Max: ${max}°, Min: ${min}°). Entry blocked to preserve clinical data integrity.`,
          "rom_out_of_bounds"
        );
      }
    }

    // Gated session closure: exercises must be recorded and justified.
    const safeExercises = parseArray(exercises_performed);
    if (safeExercises.length === 0) {
      return apiError(
        400,
        "Gated Session Closure Error: Session closure blocked. No exercises recorded in session execution log.",
        "exercises_required"
      );
    }

    for (const ex of safeExercises as any[]) {
      const status = ex?.status || (ex?.checked ? "complete" : "skipped");
      if (status === "skipped" && (!ex?.reason_code || !String(ex.reason_code).trim())) {
        return apiError(
          400,
          `Gated Session Closure Error: Exercise "${ex?.name || "unnamed"}" was marked Skipped without a mandatory Reason Code. Every skipped exercise requires clinical justification.`,
          "skip_reason_required"
        );
      }
    }

    const safeHomework = parseArray(homework_assigned);

    const preVas = pain_score_before == null ? null : Number(pain_score_before);
    const postVas = pain_score_after == null ? null : Number(pain_score_after);

    let consecutiveSpikes = Number(currentPlan[0].consecutive_pain_spikes) || 0;

    // Auto-alert when post-session VAS rises by >2 points (or is severe) twice in a row.
    const isSingleSpike =
      preVas != null &&
      postVas != null &&
      (postVas - preVas > 2 || (postVas >= 8 && preVas < 6));
    if (isSingleSpike) {
      consecutiveSpikes += 1;
    } else {
      consecutiveSpikes = Math.max(0, consecutiveSpikes - 1);
    }

    const isCriticalPainEscalation = consecutiveSpikes >= 2;
    let escalationFlag = Boolean(isSingleSpike);
    let escalationNote = "";

    if (isCriticalPainEscalation) {
      escalationNote = `CRITICAL PAIN ESCALATION: Post-Session VAS jumped by >2 points for ${consecutiveSpikes} consecutive sessions. Auto-escalated to referring doctor (${currentPlan[0]?.referring_doctor || "Orthopedic Consultant"}) for immediate protocol review.`;
    } else if (isSingleSpike) {
      escalationNote = `Pain Surge Alert: Post-session VAS increased from ${preVas} to ${postVas} (+${Number(postVas) - Number(preVas)} pts). Immediate 15-min cryotherapy indicated; Senior PT review logged.`;
    }

    // Stagnation detection across prior sessions in this clinic.
    const priorSessions = await db`
      SELECT session_number, rom_degrees, pain_score_after
      FROM therapy_sessions
      WHERE plan_id = ${plan_id} AND clinic_slug = ${clinicSlug}
      ORDER BY session_number DESC
      LIMIT 2;
    `;

    let isStagnation = false;
    if (priorSessions.length >= 2) {
      const prev1 = priorSessions[0];
      const prev2 = priorSessions[1];
      if (
        Math.abs(degrees - Number(prev1.rom_degrees)) <= 1 &&
        Math.abs(Number(prev1.rom_degrees) - Number(prev2.rom_degrees)) <= 1
      ) {
        isStagnation = true;
        escalationFlag = true;
        escalationNote = escalationNote
          ? `${escalationNote} | Clinical Stagnation: Zero ROM progression over 3 consecutive sessions. Auto-escalated to referring doctor.`
          : `Clinical Stagnation: Zero ROM progression over 3 consecutive sessions (${degrees}°). Auto-escalated to referring doctor for arthrogenic review.`;
      }
    }

    const session = await db`
      INSERT INTO therapy_sessions (
        clinic_slug,
        plan_id,
        session_number,
        pain_score_before,
        pain_score_after,
        rom_joint,
        rom_plane,
        rom_degrees,
        rom_method,
        rom_laterality,
        range_of_motion,
        modality_applied,
        tolerance_rating,
        exercises_performed,
        homework_assigned,
        escalation_flag,
        escalation_note,
        therapist_notes
      ) VALUES (
        ${clinicSlug},
        ${plan_id},
        ${parseInt(session_number) || (Number(currentPlan[0].completed_sessions) || 0) + 1},
        ${preVas},
        ${postVas},
        ${rom_joint || null},
        ${rom_plane || null},
        ${Number.isFinite(degrees) ? degrees : null},
        ${rom_method},
        ${rom_laterality || null},
        ${range_of_motion || (Number.isFinite(degrees) ? `${rom_plane || "Flexion"}: ${degrees}°` : null)},
        ${modality_applied || null},
        ${tolerance_rating || null},
        ${db.json(safeExercises as any)},
        ${db.json(safeHomework as any)},
        ${escalationFlag},
        ${escalationNote || null},
        ${therapist_notes || null}
      ) RETURNING *;
    `;

    await db`
      UPDATE therapy_plans
      SET
        completed_sessions = completed_sessions + 1,
        consecutive_pain_spikes = ${consecutiveSpikes},
        stagnation_alert = ${isStagnation},
        pain_escalation_alert = ${Boolean(isSingleSpike)},
        doctor_escalated = ${isCriticalPainEscalation || isStagnation},
        doctor_escalation_reason = COALESCE(NULLIF(${escalationNote}, ''), doctor_escalation_reason),
        updated_at = NOW()
      WHERE id = ${plan_id} AND clinic_slug = ${clinicSlug};
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "rehab.session.create",
      entity: "therapy_session",
      entityId: String(session[0].id),
      after: {
        plan_id,
        session_number: session[0].session_number,
        escalation_flag: escalationFlag,
      },
      request: req,
    });

    return NextResponse.json({
      success: true,
      session: session[0],
      gated_closure_passed: true,
      consecutive_pain_spikes: consecutiveSpikes,
      doctor_escalated: isCriticalPainEscalation || isStagnation,
      escalation_note: escalationNote,
    });
  } catch (error: any) {
    console.error("POST /api/rehab/sessions error:", error);
    return apiError(500, "Failed to log therapy session.", "internal_error");
  }
}
