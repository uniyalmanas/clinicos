import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET() {
  try {
    const plans = await db`
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
              'range_of_motion', s.range_of_motion,
              'exercises_performed', s.exercises_performed,
              'therapist_notes', s.therapist_notes
            ) ORDER BY s.session_number ASC
          ) FILTER (WHERE s.id IS NOT NULL),
          '[]'::json
        ) as sessions
      FROM therapy_plans p
      LEFT JOIN therapy_sessions s ON s.plan_id = p.id
      GROUP BY p.id
      ORDER BY p.created_at DESC;
    `;

    return NextResponse.json({ plans });
  } catch (error: any) {
    console.error("Fetch therapy plans error:", error);
    return NextResponse.json({ error: error.message || "Failed to load therapy plans" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { 
      patient_name, 
      patient_phone, 
      therapist_name, 
      condition_diagnosed, 
      target_sessions, 
      goals 
    } = body;

    if (!patient_name || !patient_phone || !condition_diagnosed) {
      return NextResponse.json({ error: "patient_name, patient_phone, and condition_diagnosed are required" }, { status: 400 });
    }

    const inserted = await db`
      INSERT INTO therapy_plans (
        patient_name,
        patient_phone,
        therapist_name,
        condition_diagnosed,
        target_sessions,
        completed_sessions,
        status,
        goals
      ) VALUES (
        ${patient_name},
        ${patient_phone},
        ${therapist_name || "Dr. Sneha Verma (PT)"},
        ${condition_diagnosed},
        ${parseInt(target_sessions) || 10},
        0,
        'active',
        ${goals || "Pain reduction and restoration of functional range of motion."}
      ) RETURNING *;
    `;

    return NextResponse.json({ success: true, plan: inserted[0] });
  } catch (error: any) {
    console.error("Create therapy plan error:", error);
    return NextResponse.json({ error: error.message || "Failed to create therapy plan" }, { status: 500 });
  }
}
