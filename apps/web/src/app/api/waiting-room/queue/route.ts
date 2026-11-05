import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Public read-only queue for waiting room TV displays.
 *
 * Returns today's appointments for a clinic, sorted by token number.
 * No authentication required — scoped by clinic_slug.
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

    const todayStr = new Date().toISOString().split("T")[0];

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

    // Build query
    let query = sql`
      SELECT id, appointment_number, token_number, doctor_slug, doctor_name,
             patient_name, patient_phone, appointment_date, time_slot,
             status, fee_amount, payment_status, payment_mode,
             symptoms_description, created_at
      FROM appointments
      WHERE clinic_id::text = ${clinicId}::text
        AND appointment_date = ${todayStr}
    `;

    // Note: We can't conditionally add to a tagged template easily,
    // so we fetch all and filter in JS if doctor_slug is provided.
    const rows = await query;

    let appointments = rows.map((row: any) => ({
      id: row.id,
      appointment_number: row.appointment_number,
      token_number: Number(row.token_number),
      doctor_slug: row.doctor_slug,
      doctor_name: row.doctor_name,
      patient_name: row.patient_name,
      patient_phone: row.patient_phone,
      appointment_date: row.appointment_date,
      time_slot: row.time_slot,
      status: row.status,
      fee_amount: Number(row.fee_amount || 0),
      payment_status: row.payment_status,
      payment_mode: row.payment_mode,
      symptoms_description: row.symptoms_description,
      created_at: row.created_at,
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
