import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const maskName = (name: string | null | undefined) => {
  const value = String(name || "").trim();
  if (!value) return null;
  const parts = value.split(/\s+/);
  return parts
    .map((part, index) =>
      index === 0 ? part : `${part.charAt(0).toUpperCase()}${".".repeat(Math.max(1, part.length - 1))}`
    )
    .join(" ");
};

/**
 * Public waiting-room queue for a single doctor.
 *
 * Read-only and intentionally minimal: token numbers, counts, and a masked
 * patient name. No phone numbers, diagnoses, or fee data are exposed.
 */
export async function GET(req: NextRequest) {
  try {
    const doctorSlug = new URL(req.url).searchParams.get("doctor_slug");
    if (!doctorSlug) {
      return apiError(400, "doctor_slug is required.", "missing_doctor");
    }

    const todayStr = new Date().toISOString().split("T")[0];

    const activeTokenRes = await sql`
      SELECT token_number, patient_name
      FROM appointments
      WHERE doctor_slug = ${doctorSlug}
        AND appointment_date = ${todayStr}
        AND status = 'in_consultation'
      ORDER BY token_number DESC
      LIMIT 1;
    `;

    const maxTokenRes = await sql`
      SELECT COALESCE(MAX(token_number), 0) AS max_token
      FROM appointments
      WHERE doctor_slug = ${doctorSlug}
        AND appointment_date = ${todayStr};
    `;

    const waitingCountRes = await sql`
      SELECT COUNT(*) AS waiting_count
      FROM appointments
      WHERE doctor_slug = ${doctorSlug}
        AND appointment_date = ${todayStr}
        AND status IN ('confirmed', 'waiting', 'booked');
    `;

    const currentActiveToken = activeTokenRes[0]?.token_number ?? null;
    const maxToken = Number(maxTokenRes[0]?.max_token ?? 0);
    const waitingCount = Number(waitingCountRes[0]?.waiting_count ?? 0);
    const avgConsultMins = 12;

    return NextResponse.json({
      doctor_slug: doctorSlug,
      date: todayStr,
      current_active_token: currentActiveToken,
      current_patient_name: maskName(activeTokenRes[0]?.patient_name),
      next_token_available: maxToken + 1,
      waiting_patient_count: waitingCount,
      estimated_wait_minutes_per_patient: avgConsultMins,
      estimated_wait_minutes: waitingCount > 0 ? Math.max(5, waitingCount * avgConsultMins) : 0,
    });
  } catch (error: any) {
    console.error("GET /api/appointments/live-queue error:", error);
    return apiError(500, "Failed to load the live queue.", "internal_error");
  }
}
