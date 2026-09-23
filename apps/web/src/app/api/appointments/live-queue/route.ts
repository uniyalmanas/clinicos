import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorSlug = searchParams.get("doctor_slug") || "dr-rahul-sharma";
    const todayStr = new Date().toISOString().split("T")[0];

    // Find current active token (status = 'in_consultation')
    const activeTokenRes = await sql`
      SELECT token_number, patient_name 
      FROM appointments 
      WHERE doctor_slug = ${doctorSlug} 
        AND (appointment_date = ${todayStr} OR appointment_date IS NULL)
        AND status = 'in_consultation'
      ORDER BY token_number DESC 
      LIMIT 1;
    `;

    // Find max token number today to determine next token available
    const maxTokenRes = await sql`
      SELECT COALESCE(MAX(token_number), 0) AS max_token 
      FROM appointments 
      WHERE doctor_slug = ${doctorSlug} 
        AND (appointment_date = ${todayStr} OR appointment_date IS NULL);
    `;

    // Count patients waiting
    const waitingCountRes = await sql`
      SELECT COUNT(*) AS waiting_count 
      FROM appointments 
      WHERE doctor_slug = ${doctorSlug} 
        AND (appointment_date = ${todayStr} OR appointment_date IS NULL)
        AND status IN ('confirmed', 'waiting', 'booked');
    `;

    const currentActiveToken = activeTokenRes[0]?.token_number ?? 1;
    const maxToken = Number(maxTokenRes[0]?.max_token ?? 1);
    const nextTokenAvailable = maxToken + 1;
    const waitingCount = Number(waitingCountRes[0]?.waiting_count ?? 0);
    const avgConsultMins = 12;

    return NextResponse.json({
      doctor_slug: doctorSlug,
      current_active_token: currentActiveToken,
      next_token_available: nextTokenAvailable,
      waiting_patient_count: waitingCount,
      estimated_wait_minutes_per_patient: avgConsultMins,
      estimated_wait_minutes: Math.max(5, waitingCount * avgConsultMins)
    });
  } catch (error: any) {
    console.error("GET /api/appointments/live-queue error:", error);
    return NextResponse.json({
      current_active_token: 1,
      next_token_available: 2,
      estimated_wait_minutes_per_patient: 12,
      estimated_wait_minutes: 15
    });
  }
}
