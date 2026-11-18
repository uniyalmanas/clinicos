import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { clinicToday } from "@/lib/clinic-date";

export const dynamic = "force-dynamic";

export interface PrescribedExercise {
  name: string;
  sets: number;
  reps: string;
  frequency: string;
  resistance: string;
  rest_seconds?: number;
  video_url?: string;
  precautions?: string;
}

export interface ProtocolVersionEntry {
  version: string;
  created_at: string;
  created_by: string;
  approved_by: string;
  change_summary: string;
  status: "active" | "pending_approval" | "superseded";
}

type Json = Record<string, unknown> | unknown[] | null;

function parseJsonArray(value: Json | string): unknown[] {
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

/**
 * Structural normalisation only. No clinical values are invented here: any
 * field the therapist has not recorded comes back as an empty value so the UI
 * can show an honest empty state instead of fabricated patient data.
 */
function sanitizePlans(plans: any[]) {
  return plans.map((p) => {
    const sessions = parseJsonArray(p.sessions)
      .filter((s): s is Record<string, any> => Boolean(s) && typeof s === "object")
      .map((s) => ({
        id: String(s.id || ""),
        session_number: Number(s.session_number) || 0,
        session_date: s.session_date || null,
        pain_score_before:
          s.pain_score_before == null ? null : Number(s.pain_score_before),
        pain_score_after:
          s.pain_score_after == null ? null : Number(s.pain_score_after),
        rom_joint: String(s.rom_joint || ""),
        rom_plane: String(s.rom_plane || ""),
        rom_degrees: s.rom_degrees == null ? null : Number(s.rom_degrees),
        rom_method: String(s.rom_method || ""),
        rom_laterality: String(s.rom_laterality || ""),
        range_of_motion: String(s.range_of_motion || ""),
        modality_applied: String(s.modality_applied || ""),
        tolerance_rating: String(s.tolerance_rating || ""),
        exercises_performed: parseJsonArray(s.exercises_performed),
        homework_assigned: parseJsonArray(s.homework_assigned),
        escalation_flag: Boolean(s.escalation_flag),
        escalation_note: String(s.escalation_note || ""),
        therapist_notes: String(s.therapist_notes || ""),
      }));

    const prescribed = parseJsonArray(p.prescribed_exercises);
    const versionHistory = parseJsonArray(p.version_history);

    const latestSession =
      sessions.length > 0 ? sessions[sessions.length - 1] : null;

    const currentRom =
      latestSession?.rom_degrees != null
        ? latestSession.rom_degrees
        : p.current_rom != null
          ? Number(p.current_rom)
          : p.baseline_rom != null
            ? Number(p.baseline_rom)
            : null;

    const currentVas =
      latestSession?.pain_score_after != null
        ? latestSession.pain_score_after
        : p.current_vas != null
          ? Number(p.current_vas)
          : null;

    // Stagnation detection across the last three recorded sessions.
    let computedStagnation = Boolean(p.stagnation_alert);
    if (sessions.length >= 3) {
      const last3 = sessions.slice(-3);
      const romDiff = Math.abs(
        Number(last3[2].rom_degrees ?? 0) - Number(last3[0].rom_degrees ?? 0)
      );
      if (romDiff <= 2) computedStagnation = true;
    }

    // Pain escalation detection on the latest session.
    let computedPainEscalation = Boolean(p.pain_escalation_alert);
    if (latestSession && latestSession.pain_score_before != null) {
      const before = Number(latestSession.pain_score_before);
      const after = Number(latestSession.pain_score_after ?? before);
      if (after - before > 2 || before >= 8) computedPainEscalation = true;
    }

    return {
      id: String(p.id || ""),
      clinic_slug: String(p.clinic_slug || ""),
      patient_name: String(p.patient_name || ""),
      patient_phone: String(p.patient_phone || ""),
      referring_doctor: String(p.referring_doctor || ""),
      therapist_name: String(p.therapist_name || ""),
      approved_by: String(p.approved_by || ""),
      modification_status: p.modification_status || "approved",
      current_version: String(p.current_version || "1.0"),
      consecutive_pain_spikes: Number(p.consecutive_pain_spikes) || 0,
      doctor_escalated: Boolean(p.doctor_escalated),
      doctor_escalation_reason: String(p.doctor_escalation_reason || ""),
      condition_diagnosed: String(p.condition_diagnosed || ""),
      target_sessions: Number(p.target_sessions) || 0,
      completed_sessions: Number(p.completed_sessions) || sessions.length,
      start_date: p.start_date || null,
      review_date: p.review_date || null,
      end_date: p.end_date || null,
      status: ["completed", "paused"].includes(p.status) ? p.status : "active",
      goals: String(p.goals || ""),
      target_joint: String(p.target_joint || ""),
      movement_plane: String(p.movement_plane || ""),
      baseline_rom: p.baseline_rom == null ? null : Number(p.baseline_rom),
      target_rom: p.target_rom == null ? null : Number(p.target_rom),
      current_rom: currentRom,
      baseline_vas: p.baseline_vas == null ? null : Number(p.baseline_vas),
      target_vas: p.target_vas == null ? null : Number(p.target_vas),
      current_vas: currentVas,
      stagnation_alert: computedStagnation,
      pain_escalation_alert: computedPainEscalation,
      version_history: versionHistory,
      prescribed_exercises: prescribed,
      sessions,
    };
  });
}

export async function GET(req: NextRequest) {
  const auth = await guard(req, { roles: CLINIC_ROLES });
  if (!auth.ok) return auth.response;

  const clinicSlug = auth.auth.clinic!.slug;

  try {
    const rawPlans = await db`
      SELECT
        p.*,
        COALESCE(
          json_agg(
            json_build_object(
              'id', s.id,
              'session_number', s.session_number,
              'session_date', s.session_date,
              'pain_score_before', s.pain_score_before,
              'pain_score_after', s.pain_score_after,
              'rom_joint', s.rom_joint,
              'rom_plane', s.rom_plane,
              'rom_degrees', s.rom_degrees,
              'rom_method', s.rom_method,
              'rom_laterality', s.rom_laterality,
              'range_of_motion', s.range_of_motion,
              'modality_applied', s.modality_applied,
              'tolerance_rating', s.tolerance_rating,
              'exercises_performed', s.exercises_performed,
              'homework_assigned', s.homework_assigned,
              'escalation_flag', s.escalation_flag,
              'escalation_note', s.escalation_note,
              'therapist_notes', s.therapist_notes
            ) ORDER BY s.session_number ASC
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) as sessions
      FROM therapy_plans p
      LEFT JOIN therapy_sessions s
        ON s.plan_id = p.id AND s.clinic_slug = ${clinicSlug}
      WHERE p.clinic_slug = ${clinicSlug}
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;

    return NextResponse.json({ plans: sanitizePlans(rawPlans) });
  } catch (error: any) {
    console.error("GET /api/rehab/plans error:", error);
    return apiError(500, "Failed to load therapy plans.", "internal_error");
  }
}

export async function POST(req: NextRequest) {
  const auth = await guard(req, { roles: CLINIC_ROLES });
  if (!auth.ok) return auth.response;

  const clinicId = auth.auth.clinic!.id;
  const clinicSlug = auth.auth.clinic!.slug;

  try {
    const body = await req.json();
    const {
      patient_name,
      patient_phone,
      referring_doctor,
      therapist_name,
      approved_by,
      condition_diagnosed,
      target_sessions,
      start_date,
      review_date,
      end_date,
      goals,
      target_joint,
      movement_plane,
      baseline_rom,
      target_rom,
      baseline_vas,
      target_vas,
      prescribed_exercises,
    } = body;

    if (!patient_name || !patient_phone || !condition_diagnosed) {
      return apiError(
        400,
        "patient_name, patient_phone, and condition_diagnosed are required.",
        "invalid_input"
      );
    }

    const safeExercises =
      Array.isArray(prescribed_exercises) && prescribed_exercises.length > 0
        ? prescribed_exercises
        : [];

    const initialHistory: ProtocolVersionEntry[] = [
      {
        version: "1.0",
        created_at: new Date().toISOString(),
        created_by: String(therapist_name || auth.auth.user.full_name || ""),
        approved_by: String(approved_by || ""),
        change_summary: "Initial intake clinical protocol authorised.",
        status: "active",
      },
    ];

    const today = clinicToday();

    const inserted = await db`
      INSERT INTO therapy_plans (
        clinic_id,
        clinic_slug,
        patient_name,
        patient_phone,
        referring_doctor,
        therapist_name,
        approved_by,
        modification_status,
        current_version,
        condition_diagnosed,
        target_sessions,
        completed_sessions,
        start_date,
        review_date,
        end_date,
        status,
        goals,
        target_joint,
        movement_plane,
        baseline_rom,
        target_rom,
        baseline_vas,
        target_vas,
        stagnation_alert,
        pain_escalation_alert,
        doctor_escalated,
        prescribed_exercises,
        version_history
      ) VALUES (
        ${clinicId},
        ${clinicSlug},
        ${patient_name},
        ${patient_phone},
        ${referring_doctor || null},
        ${therapist_name || auth.auth.user.full_name},
        ${approved_by || null},
        'approved',
        '1.0',
        ${condition_diagnosed},
        ${parseInt(target_sessions) || 10},
        0,
        ${start_date || today},
        ${review_date || null},
        ${end_date || null},
        'active',
        ${goals || null},
        ${target_joint || null},
        ${movement_plane || null},
        ${baseline_rom == null ? null : Number(baseline_rom)},
        ${target_rom == null ? null : Number(target_rom)},
        ${baseline_vas == null ? null : Number(baseline_vas)},
        ${target_vas == null ? null : Number(target_vas)},
        false,
        false,
        false,
        ${db.json(safeExercises)},
        ${db.json(initialHistory as any)}
      ) RETURNING *;
    `;

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "rehab.plan.create",
      entity: "therapy_plan",
      entityId: String(inserted[0].id),
      after: {
        patient_name,
        condition_diagnosed,
        target_sessions: parseInt(target_sessions) || 10,
      },
      request: req,
    });

    return NextResponse.json({ success: true, plan: sanitizePlans([inserted[0]])[0] });
  } catch (error: any) {
    console.error("POST /api/rehab/plans error:", error);
    return apiError(500, "Failed to create therapy plan.", "internal_error");
  }
}

export async function PUT(req: NextRequest) {
  const auth = await guard(req, { roles: CLINIC_ROLES });
  if (!auth.ok) return auth.response;

  const clinicId = auth.auth.clinic!.id;
  const clinicSlug = auth.auth.clinic!.slug;

  try {
    const body = await req.json();
    const {
      plan_id,
      action,
      approved_by,
      change_summary,
      discharge_notes,
      prescribed_exercises,
    } = body;

    if (!plan_id) {
      return apiError(400, "plan_id is required.", "invalid_input");
    }

    const plan = await db`
      SELECT * FROM therapy_plans
      WHERE id = ${plan_id} AND clinic_slug = ${clinicSlug}
      LIMIT 1;
    `;
    if (!plan || plan.length === 0) {
      return apiError(404, "Therapy plan not found in your clinic.", "plan_not_found");
    }

    let updated: any[] = [];

    // 1. Propose protocol modification (bumps version, awaits senior PT approval).
    if (action === "propose_modification") {
      const currentVer = plan[0].current_version || "1.0";
      const parts = String(currentVer).split(".");
      const nextVer = `${parts[0]}.${parseInt(parts[1] || "0", 10) + 1}`;

      const vHistory = parseJsonArray(plan[0].version_history) as ProtocolVersionEntry[];
      vHistory.push({
        version: nextVer,
        created_at: new Date().toISOString(),
        created_by: String(body.created_by || auth.auth.user.full_name || ""),
        approved_by: "Pending Senior PT e-sign",
        change_summary:
          change_summary || "Protocol adjusted: exercises/resistance modified.",
        status: "pending_approval",
      });

      updated = await db`
        UPDATE therapy_plans
        SET
          current_version = ${nextVer},
          modification_status = 'pending_senior_review',
          prescribed_exercises = ${db.json(
            Array.isArray(prescribed_exercises)
              ? prescribed_exercises
              : parseJsonArray(plan[0].prescribed_exercises)
          )},
          version_history = ${db.json(vHistory as any)},
          updated_at = NOW()
        WHERE id = ${plan_id} AND clinic_slug = ${clinicSlug}
        RETURNING *;
      `;
    }

    // 2. Approve protocol modifications (senior PT sign-off).
    else if (action === "approve_modifications") {
      let vHistory = parseJsonArray(plan[0].version_history) as ProtocolVersionEntry[];
      vHistory = vHistory.map((v, idx) => {
        if (idx === vHistory.length - 1) {
          return {
            ...v,
            approved_by: String(approved_by || auth.auth.user.full_name || ""),
            status: "active" as const,
          };
        }
        return { ...v, status: "superseded" as const };
      });

      updated = await db`
        UPDATE therapy_plans
        SET
          modification_status = 'approved',
          approved_by = ${approved_by || null},
          stagnation_alert = false,
          pain_escalation_alert = false,
          consecutive_pain_spikes = 0,
          version_history = ${db.json(vHistory as any)},
          updated_at = NOW()
        WHERE id = ${plan_id} AND clinic_slug = ${clinicSlug}
        RETURNING *;
      `;
    }

    // 3. Escalate to the referring doctor.
    else if (action === "escalate_to_doctor") {
      updated = await db`
        UPDATE therapy_plans
        SET
          doctor_escalated = true,
          doctor_escalation_reason = ${String(
            body.reason ||
              "Clinical plateau / consecutive pain escalation flagged. Case referral dispatched to referring doctor."
          )},
          updated_at = NOW()
        WHERE id = ${plan_id} AND clinic_slug = ${clinicSlug}
        RETURNING *;
      `;
    }

    // 4. Complete / discharge the plan.
    else if (action === "complete_plan") {
      const note = String(
        discharge_notes ||
          "Functional goals met successfully with restored anatomical ROM and VAS <= 2."
      );
      updated = await db`
        UPDATE therapy_plans
        SET
          status = 'completed',
          goals = COALESCE(NULLIF(goals, ''), 'Discharge audit') || ' | DISCHARGE AUDIT: ' || ${note},
          updated_at = NOW()
        WHERE id = ${plan_id} AND clinic_slug = ${clinicSlug}
        RETURNING *;
      `;
    }

    // 5. Dismiss clinical alerts.
    else if (action === "dismiss_alert") {
      updated = await db`
        UPDATE therapy_plans
        SET
          stagnation_alert = false,
          pain_escalation_alert = false,
          consecutive_pain_spikes = 0,
          updated_at = NOW()
        WHERE id = ${plan_id} AND clinic_slug = ${clinicSlug}
        RETURNING *;
      `;
    } else {
      return apiError(400, "Invalid action.", "invalid_action");
    }

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: `rehab.plan.${action}`,
      entity: "therapy_plan",
      entityId: String(plan_id),
      after: { action },
      request: req,
    });

    return NextResponse.json({
      success: true,
      plan: sanitizePlans(updated)[0],
    });
  } catch (error: any) {
    console.error("PUT /api/rehab/plans error:", error);
    return apiError(500, "Failed to update therapy plan.", "internal_error");
  }
}
