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
      range_of_motion, 
      exercises_performed, 
      therapist_notes 
    } = body;

    if (!plan_id) {
      return NextResponse.json({ error: "plan_id is required" }, { status: 400 });
    }

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

    // Insert session record safely using db.json
    const session = await db`
      INSERT INTO therapy_sessions (
        plan_id,
        session_number,
        pain_score_before,
        pain_score_after,
        range_of_motion,
        exercises_performed,
        therapist_notes
      ) VALUES (
        ${plan_id},
        ${parseInt(session_number) || 1},
        ${parseInt(pain_score_before) || 5},
        ${parseInt(pain_score_after) || 3},
        ${range_of_motion || "Within functional limits"},
        ${db.json(safeExercises)},
        ${therapist_notes || "Session completed successfully."}
      ) RETURNING *;
    `;

    // Increment completed_sessions in therapy_plans
    await db`
      UPDATE therapy_plans
      SET completed_sessions = completed_sessions + 1
      WHERE id = ${plan_id};
    `;

    return NextResponse.json({ success: true, session: session[0] });
  } catch (error: any) {
    console.error("Log therapy session error:", error);
    return NextResponse.json({ error: error.message || "Failed to log therapy session" }, { status: 500 });
  }
}
