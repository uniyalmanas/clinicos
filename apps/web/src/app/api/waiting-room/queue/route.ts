import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { rateLimit, rateLimitKey } from "@/lib/rate-limit";
import { maskPatientName } from "@/lib/privacy";
import { clinicToday } from "@/lib/clinic-date";

export const dynamic = "force-dynamic";

/**
 * Public read-only queue for waiting room TV displays.
 *
 * Returns today's appointments for a clinic, sorted by token number.
 * No authentication required — scoped by clinic_slug.
 *
 * Privacy: this endpoint is public, so it only exposes the token, doctor,
 * status and time slot, plus a masked display name. Phone numbers, symptoms,
 * fees, payment state and internal appointment ids never leave the server.
 *
 * Query params:
 *   clinic_slug (required) — clinic slug
 *   doctor_slug   (optional) — filter by specific doctor
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limit: 60 reads per minute per IP
    const ipLimit = await rateLimit(rateLimitKey(req, "waitingroom:queue"), 60, 60);
    if (!ipLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded.", code: "too_many_requests" }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinic_slug") || "";
    const doctorSlug = searchParams.get("doctor_slug") || null;

    if (!clinicSlug) {
      return new Response(
        JSON.stringify({ error: "clinic_slug is required.", code: "missing_clinic" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const todayStr = clinicToday();

    // Resolve clinic
    const clinics = await sql`
      SELECT id, name, slug
      FROM clinics
      WHERE slug = ${String(clinicSlug)}
      LIMIT 1;
    `;
    if (clinics.length === 0) {
      return new Response(
        JSON.stringify({ error: "Clinic not found.", code: "clinic_not_found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const clinicId = clinics[0].id;

    // Build query. Only non-identifying columns are selected; the display name
    // is masked below before it crosses the boundary.
    const rows = await sql`
      SELECT token_number, doctor_slug, doctor_name, patient_name,
             appointment_date, time_slot, status
      FROM appointments
      WHERE clinic_id::text = ${clinicId}::text
        AND appointment_date = ${todayStr}
    `;

    let appointments = rows.map((row: any) => ({
      token_number: Number(row.token_number),
      doctor_slug: row.doctor_slug,
      doctor_name: row.doctor_name,
      patient_display: maskPatientName(row.patient_name),
      appointment_date: row.appointment_date,
      time_slot: row.time_slot,
      status: row.status,
    }));

    if (doctorSlug) {
      appointments = appointments.filter((a) => a.doctor_slug === doctorSlug);
    }

    // Sort by token number
    appointments.sort((a, b) => a.token_number - b.token_number);

    // Compute summary
    const waiting = appointments.filter(
      (a) => a.status === "waiting" || a.status === "confirmed" || a.status === "arrived"
    );
    const inConsultation = appointments.find((a) => a.status === "in_consultation");
    const completed = appointments.filter((a) => a.status === "completed");

    return NextResponse.json({
      clinic: {
        id: clinicId,
        name: clinics[0].name,
        slug: clinics[0].slug,
      },
      date: todayStr,
      queue: appointments,
      active_in_consultation: inConsultation || null,
      waiting_count: waiting.length,
      completed_count: completed.length,
      total_count: appointments.length,
    });
  } catch (err: any) {
    console.error("Waiting room queue error:", err);
    return new Response(
      JSON.stringify({ error: "Failed to load queue.", code: "internal_error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
