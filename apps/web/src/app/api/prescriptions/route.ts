import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { CLINIC_TIME_ZONE, clinicToday } from "@/lib/clinic-date";

export const dynamic = "force-dynamic";

/**
 * Clinic prescription register.
 *
 * Powers the doctor's prescription archive. Every field comes from the real
 * prescriptions row plus its appointment (token, fee, payment status) and the
 * doctor's specialty. Nothing is fabricated: an empty clinic returns an empty
 * register.
 */

const parseJson = (value: any, fallback: any) => {
  if (value == null) return fallback;
  if (typeof value === "string") {
    try {
      const parsed = JSON.parse(value);
      // Legacy rows stored JSON.stringify(...) inside a jsonb column, so the
      // first parse yields a string that itself needs parsing.
      if (typeof parsed === "string") {
        try {
          return JSON.parse(parsed);
        } catch {
          return fallback;
        }
      }
      return parsed;
    } catch {
      return fallback;
    }
  }
  return value;
};

const DATE_LABEL = new Intl.DateTimeFormat("en-IN", {
  timeZone: CLINIC_TIME_ZONE,
  day: "2-digit",
  month: "short",
  year: "numeric",
});

const ISO_DATE = new Intl.DateTimeFormat("en-CA", {
  timeZone: CLINIC_TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});

const formatMedication = (item: any) => {
  const name = String(item.medicine_name || item.name || "").trim();
  if (!name) return "";
  const strength = String(item.strength || "").trim();
  const frequency = String(item.dosage_frequency || item.frequency || "").trim();
  const duration = item.duration_days ?? item.duration ?? null;
  const parts: string[] = [];
  if (frequency) parts.push(frequency);
  if (duration) parts.push(`${duration} days`);
  const detail = parts.join(" • ");
  return `${name}${strength ? ` ${strength}` : ""}${detail ? ` (${detail})` : ""}`;
};

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const { searchParams } = new URL(req.url);
    const requestedDate = (searchParams.get("date") || "").trim();
    const limitParam = parseInt(searchParams.get("limit") || "200", 10);
    const limit = Number.isFinite(limitParam)
      ? Math.min(Math.max(limitParam, 1), 500)
      : 200;

    const dateFilter =
      requestedDate && requestedDate !== "all"
        ? sql`AND (rx.created_at AT TIME ZONE ${CLINIC_TIME_ZONE})::date = ${requestedDate}::date`
        : sql``;

    const rows = await sql`
      SELECT
        rx.id,
        rx.prescription_number,
        rx.appointment_number,
        rx.patient_name,
        rx.patient_phone,
        rx.patient_age,
        rx.patient_gender,
        rx.doctor_name,
        COALESCE(rx.doctor_slug, a.doctor_slug) AS doctor_slug,
        rx.provisional_diagnosis,
        rx.instructions,
        rx.followup_date,
        rx.items,
        rx.dispensed_status,
        rx.created_at,
        d.specialization,
        a.token_number,
        a.fee_amount,
        a.payment_status,
        a.appointment_date
      FROM prescriptions rx
      LEFT JOIN appointments a
        ON a.appointment_number = rx.appointment_number
      LEFT JOIN doctors d
        ON d.slug = COALESCE(rx.doctor_slug, a.doctor_slug)
       AND d.clinic_id::text = rx.clinic_id::text
      WHERE rx.clinic_id::text = ${clinicId}::text
        ${dateFilter}
      ORDER BY rx.created_at DESC
      LIMIT ${limit};
    `;

    const prescriptions = rows.map((rx: any) => {
      const items = parseJson(rx.items, []);
      const itemList = Array.isArray(items) ? items : [];
      const createdAt = rx.created_at ? new Date(rx.created_at) : null;
      const dateIso =
        rx.appointment_date != null
          ? String(rx.appointment_date).slice(0, 10)
          : createdAt
            ? ISO_DATE.format(createdAt)
            : "";

      return {
        rx_id: rx.prescription_number,
        id: rx.id,
        prescription_number: rx.prescription_number,
        appointment_number: rx.appointment_number,
        date: createdAt ? DATE_LABEL.format(createdAt) : dateIso,
        date_iso: dateIso,
        token_number: rx.token_number ?? null,
        patient_name: rx.patient_name,
        patient_phone: rx.patient_phone,
        age: rx.patient_age ?? null,
        gender: rx.patient_gender ?? null,
        doctor_name: rx.doctor_name,
        doctor_slug: rx.doctor_slug,
        specialization: rx.specialization || "",
        provisional_diagnosis: rx.provisional_diagnosis || "",
        medications: itemList.map(formatMedication).filter(Boolean),
        items: itemList,
        instructions: rx.instructions || "",
        followup_date: rx.followup_date
          ? String(rx.followup_date).slice(0, 10)
          : null,
        dispensed_status: rx.dispensed_status || "pending",
        fee_amount: rx.fee_amount != null ? Number(rx.fee_amount) : null,
        payment_status: rx.payment_status || null,
        created_at: rx.created_at || null,
      };
    });

    return NextResponse.json({
      prescriptions,
      count: prescriptions.length,
      today: clinicToday(),
      time_zone: CLINIC_TIME_ZONE,
    });
  } catch (error: any) {
    console.error("GET /api/prescriptions error:", error);
    return apiError(500, "Failed to load prescriptions.", "internal_error");
  }
}
