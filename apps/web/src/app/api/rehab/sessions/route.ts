import { NextResponse } from "next/server";
import { db } from "@/lib/db";

// Strict anatomical physiological limits per joint
const ANATOMICAL_LIMITS: Record<string, { max: number; min: number }> = {
  "shoulder": { min: 0, max: 180 },
  "knee": { min: -10, max: 150 },
  "lumbar spine": { min: 0, max: 75 },
  "cervical spine": { min: 0, max: 85 },
  "hip": { min: 0, max: 130 },
  "ankle": { min: 0, max: 55 },
  "elbow": { min: 0, max: 150 },
  "wrist": { min: 0, max: 90 }
};

export async function POST(request: Request) {
  try {
    const body = await request.json();
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
      therapist_notes 
    } = body;

    if (!plan_id) {
      return NextResponse.json({ error: "plan_id is required" }, { status: 400 });
    }

    // FIX 3: Add Input Validation Rules (Anatomical Physiological Limits)
    if (!rom_method || !rom_method.trim()) {
      return NextResponse.json({ 
        error: "Input Rejected: Measurement method field (Universal Goniometer / Sensor) is mandatory under clinical audit standards." 
      }, { status: 400 });
    }

    const degrees = Number(rom_degrees);
    const jointKey = (rom_joint || "shoulder").toLowerCase().trim();
    const matchedLimit = Object.entries(ANATOMICAL_LIMITS).find(([k]) => jointKey.includes(k));

    if (matchedLimit) {
      const { min, max } = matchedLimit[1];
      if (degrees > max || degrees < min) {
        return NextResponse.json({ 
          error: `Input Rejected: ${degrees}° exceeds physiological anatomical limit for ${rom_joint} (Max: ${max}°, Min: ${min}°). Entry blocked to preserve clinical data integrity.` 
        }, { status: 400 });
      }
    }

    // FIX 4: Close the Loop on Session Logs (Gated Session Closure)
    let safeExercises = exercises_performed;
    if (typeof safeExercises === "string") {
      try { safeExercises = JSON.parse(safeExercises); } catch { safeExercises = []; }
    }
    if (!Array.isArray(safeExercises) || safeExercises.length === 0) {
      return NextResponse.json({ 
        error: "Gated Session Closure Error: Session closure blocked. No exercises recorded in session execution log." 
      }, { status: 400 });
    }

    // Verify all exercises are marked Complete, Modified, or Skipped
    for (const ex of safeExercises) {
      const status = ex.status || (ex.checked ? "complete" : "skipped");
      if (status === "skipped" && (!ex.reason_code || !ex.reason_code.trim())) {
        return NextResponse.json({ 
          error: `Gated Session Closure Error: Exercise "${ex.name}" was marked Skipped without a mandatory Reason Code. Every skipped exercise requires clinical justification.` 
        }, { status: 400 });
      }
    }

    // Defensive parsing for homework_assigned
    let safeHomework = homework_assigned;
    if (typeof safeHomework === "string") {
      try { safeHomework = JSON.parse(safeHomework); } catch { safeHomework = []; }
    }
    if (!Array.isArray(safeHomework)) safeHomework = [];

    const preVas = Number(pain_score_before) ?? 5;
    const postVas = Number(pain_score_after) ?? 3;

    // Fetch current plan to check consecutive pain spikes
    const currentPlan = await db`SELECT * FROM therapy_plans WHERE id = ${plan_id}`;
    let consecutiveSpikes = currentPlan && currentPlan[0] ? (currentPlan[0].consecutive_pain_spikes || 0) : 0;

    // FIX 2: Specify Alert Triggers (Auto-alert if Post-Session VAS > Pre-Session VAS +2 points for 2 consecutive sessions)
    const isSingleSpike = (postVas - preVas > 2) || (postVas >= 8 && preVas < 6);
    if (isSingleSpike) {
      consecutiveSpikes += 1;
    } else {
      consecutiveSpikes = Math.max(0, consecutiveSpikes - 1);
    }

    const isCriticalPainEscalation = consecutiveSpikes >= 2;
    let escalationFlag = isSingleSpike;
    let escalationNote = "";

    if (isCriticalPainEscalation) {
      escalationNote = `CRITICAL PAIN ESCALATION: Post-Session VAS jumped by >2 points for ${consecutiveSpikes} consecutive sessions. Auto-escalated to referring doctor (${currentPlan[0]?.referring_doctor || "Orthopedic Consultant"}) for immediate protocol review.`;
    } else if (isSingleSpike) {
      escalationNote = `Pain Surge Alert: Post-session VAS increased from ${preVas} to ${postVas} (+${postVas - preVas} pts). Immediate 15-min cryotherapy indicated; Senior PT review logged.`;
    }

    // Stagnation Detection across prior sessions
    const priorSessions = await db`
      SELECT session_number, rom_degrees, pain_score_after 
      FROM therapy_sessions 
      WHERE plan_id = ${plan_id} 
      ORDER BY session_number DESC 
      LIMIT 2;
    `;

    let isStagnation = false;
    if (priorSessions.length >= 2) {
      const prev1 = priorSessions[0];
      const prev2 = priorSessions[1];
      if (Math.abs(degrees - prev1.rom_degrees) <= 1 && Math.abs(prev1.rom_degrees - prev2.rom_degrees) <= 1) {
        isStagnation = true;
        escalationFlag = true;
        escalationNote = escalationNote 
          ? `${escalationNote} | Clinical Stagnation: Zero ROM progression over 3 consecutive sessions. Auto-escalated to referring doctor.`
          : `Clinical Stagnation: Zero ROM progression over 3 consecutive sessions (${degrees}°). Auto-escalated to referring doctor for arthrogenic review.`;
      }
    }

    // Insert structured session record
    const session = await db`
      INSERT INTO therapy_sessions (
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
        ${plan_id},
        ${parseInt(session_number) || 1},
        ${preVas},
        ${postVas},
        ${rom_joint || "Shoulder"},
        ${rom_plane || "Abduction"},
        ${degrees},
        ${rom_method || "Universal Goniometer (360°)"},
        ${rom_laterality || "Right"},
        ${range_of_motion || `${rom_plane || "Flexion"}: ${degrees}°`},
        ${modality_applied || "TENS + Cryotherapy"},
        ${tolerance_rating || "Good (Grade 3/4)"},
        ${db.json(safeExercises)},
        ${db.json(safeHomework)},
        ${escalationFlag},
        ${escalationNote},
        ${therapist_notes || "Gated session closure completed."}
      ) RETURNING *;
    `;

    // Update plan completed sessions, consecutive spikes, and alert flags
    await db`
      UPDATE therapy_plans
      SET 
        completed_sessions = completed_sessions + 1,
        consecutive_pain_spikes = ${consecutiveSpikes},
        stagnation_alert = ${isStagnation},
        pain_escalation_alert = ${isSingleSpike},
        doctor_escalated = ${isCriticalPainEscalation || isStagnation},
        doctor_escalation_reason = COALESCE(NULLIF(${escalationNote}, ''), doctor_escalation_reason)
      WHERE id = ${plan_id};
    `;

    return NextResponse.json({ 
      success: true, 
      session: session[0],
      gated_closure_passed: true,
      consecutive_pain_spikes: consecutiveSpikes,
      doctor_escalated: isCriticalPainEscalation || isStagnation,
      escalation_note: escalationNote
    });
  } catch (error: any) {
    console.error("Log structured therapy session error:", error);
    return NextResponse.json({ error: error.message || "Failed to log clinical therapy session" }, { status: 500 });
  }
}
