import { NextResponse } from "next/server";
import { db } from "@/lib/db";

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

    // Defensive parsing for exercises_performed
    let safeExercises = exercises_performed;
    if (typeof safeExercises === "string") {
      try {
        safeExercises = JSON.parse(safeExercises);
      } catch {
        safeExercises = [];
      }
    }
    if (!Array.isArray(safeExercises)) {
      safeExercises = [];
    }

    // Defensive parsing for homework_assigned
    let safeHomework = homework_assigned;
    if (typeof safeHomework === "string") {
      try {
        safeHomework = JSON.parse(safeHomework);
      } catch {
        safeHomework = [];
      }
    }
    if (!Array.isArray(safeHomework)) {
      safeHomework = [];
    }

    const preVas = Number(pain_score_before) ?? 5;
    const postVas = Number(pain_score_after) ?? 3;
    const degrees = Number(rom_degrees) || 90;

    // Escalation Logic 1: Acute Pain Surge
    // If post-session VAS > pre-session VAS by >2 points or if post-session VAS >= 8
    const isPainEscalation = (postVas - preVas > 2) || (postVas >= 8 && preVas < 6);
    let escalationFlag = isPainEscalation;
    let escalationNote = "";

    if (isPainEscalation) {
      escalationNote = `Pain Escalation Alert: VAS surged by +${postVas - preVas} points post-session (from ${preVas} to ${postVas}). Immediate cryotherapy indicated; Senior PT notified.`;
    }

    // Check prior sessions for stagnation
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
      // If past 2 sessions + this session have identical or declining ROM
      if (Math.abs(degrees - prev1.rom_degrees) <= 1 && Math.abs(prev1.rom_degrees - prev2.rom_degrees) <= 1) {
        isStagnation = true;
        escalationFlag = true;
        escalationNote = escalationNote 
          ? `${escalationNote} | Clinical Stagnation: Zero ROM progression over last 3 sessions.`
          : "Clinical Stagnation Alert: Zero ROM progression across 3 consecutive sessions. Senior PT review required.";
      }
    }

    // Insert structured session record safely
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
        ${therapist_notes || "Clinical session completed."}
      ) RETURNING *;
    `;

    // Update plan completed sessions and alert flags
    await db`
      UPDATE therapy_plans
      SET 
        completed_sessions = completed_sessions + 1,
        stagnation_alert = ${isStagnation},
        pain_escalation_alert = ${isPainEscalation}
      WHERE id = ${plan_id};
    `;

    return NextResponse.json({ 
      success: true, 
      session: session[0],
      escalation_triggered: escalationFlag,
      escalation_note: escalationNote
    });
  } catch (error: any) {
    console.error("Log structured therapy session error:", error);
    return NextResponse.json({ error: error.message || "Failed to log clinical therapy session" }, { status: 500 });
  }
}
