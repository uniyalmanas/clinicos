import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { randomUUID } from "crypto";

export const dynamic = "force-dynamic";

let tableEnsured = false;
async function ensureTable() {
  if (tableEnsured) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS doctor_schedules (
        id            TEXT PRIMARY KEY,
        clinic_id     TEXT NOT NULL,
        clinic_slug   TEXT NOT NULL,
        doctor_slug   TEXT NOT NULL,
        doctor_name   TEXT NOT NULL,
        specialization TEXT,
        chamber_name  TEXT,
        working_days  JSONB NOT NULL DEFAULT '[]'::jsonb,
        start_time    TEXT NOT NULL DEFAULT '09:00',
        end_time      TEXT NOT NULL DEFAULT '17:00',
        slot_duration INTEGER NOT NULL DEFAULT 15,
        is_active     BOOLEAN NOT NULL DEFAULT true,
        created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (clinic_id, doctor_slug)
      );
      CREATE INDEX IF NOT EXISTS idx_ds_clinic ON doctor_schedules (clinic_id);
    `;
    tableEnsured = true;
  } catch (e) {
    console.warn("ensureTable doctor_schedules:", e);
  }
}

/** List all schedules for the authenticated clinic's doctors. */
export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    await ensureTable();

    const rows = await sql`
      SELECT * FROM doctor_schedules
      WHERE clinic_id = ${auth.auth.clinic!.id}
      ORDER BY doctor_name ASC;
    `;

    return NextResponse.json({ schedules: rows });
  } catch (error: any) {
    console.error("GET /api/doctors/schedules error:", error);
    return apiError(500, "Failed to load schedules.", "internal_error");
  }
}

/** Upsert a doctor schedule for the authenticated clinic. */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId   = auth.auth.clinic!.id;
    const clinicSlug = auth.auth.clinic!.slug;

    const body = await req.json().catch(() => ({}));
    const {
      doctor_slug, doctor_name, specialization, chamber_name,
      working_days, start_time, end_time, slot_duration, is_active,
    } = body;

    if (!doctor_slug || !doctor_name) {
      return apiError(400, "doctor_slug and doctor_name are required.", "invalid_input");
    }
    if (!Array.isArray(working_days) || working_days.length === 0) {
      return apiError(400, "working_days must be a non-empty array.", "invalid_input");
    }

    await ensureTable();

    const id = randomUUID();
    const rows = await sql`
      INSERT INTO doctor_schedules
        (id, clinic_id, clinic_slug, doctor_slug, doctor_name, specialization,
         chamber_name, working_days, start_time, end_time, slot_duration, is_active, updated_at)
      VALUES
        (${id}, ${clinicId}, ${clinicSlug}, ${String(doctor_slug)}, ${String(doctor_name)},
         ${specialization || null}, ${chamber_name || null},
         ${JSON.stringify(working_days)}::jsonb,
         ${start_time || "09:00"}, ${end_time || "17:00"},
         ${Number(slot_duration) || 15}, ${is_active !== false}, NOW())
      ON CONFLICT (clinic_id, doctor_slug) DO UPDATE SET
        doctor_name    = EXCLUDED.doctor_name,
        specialization = EXCLUDED.specialization,
        chamber_name   = EXCLUDED.chamber_name,
        working_days   = EXCLUDED.working_days,
        start_time     = EXCLUDED.start_time,
        end_time       = EXCLUDED.end_time,
        slot_duration  = EXCLUDED.slot_duration,
        is_active      = EXCLUDED.is_active,
        updated_at     = NOW()
      RETURNING *;
    `;

    await logAudit({
      actorId:  auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "doctor_schedule.upsert",
      entity: "doctor_schedule",
      entityId: String(doctor_slug),
      after: { doctor_slug, working_days, start_time, end_time },
      request: req,
    });

    return NextResponse.json({ status: "success", schedule: rows[0] });
  } catch (error: any) {
    console.error("POST /api/doctors/schedules error:", error);
    return apiError(500, "Failed to save schedule.", "internal_error");
  }
}
