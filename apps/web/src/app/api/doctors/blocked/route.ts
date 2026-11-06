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
      CREATE TABLE IF NOT EXISTS doctor_blocked_slots (
        id          TEXT PRIMARY KEY,
        clinic_id   TEXT NOT NULL,
        clinic_slug TEXT NOT NULL,
        doctor_slug TEXT NOT NULL,
        date        TEXT NOT NULL,
        start_time  TEXT,
        end_time    TEXT,
        reason      TEXT NOT NULL,
        type        TEXT NOT NULL DEFAULT 'blocked',
        created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_dbs_clinic ON doctor_blocked_slots (clinic_id, date DESC);
      CREATE INDEX IF NOT EXISTS idx_dbs_doctor ON doctor_blocked_slots (doctor_slug, date DESC);
    `;
    tableEnsured = true;
  } catch (e) {
    console.warn("ensureTable doctor_blocked_slots:", e);
  }
}

/** List all blocked slots for the authenticated clinic. */
export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const doctorSlug = searchParams.get("doctor_slug");

    await ensureTable();

    const rows = doctorSlug
      ? await sql`
          SELECT * FROM doctor_blocked_slots
          WHERE clinic_id = ${auth.auth.clinic!.id}
            AND doctor_slug = ${doctorSlug}
          ORDER BY date DESC, start_time ASC;
        `
      : await sql`
          SELECT * FROM doctor_blocked_slots
          WHERE clinic_id = ${auth.auth.clinic!.id}
          ORDER BY date DESC, start_time ASC;
        `;

    return NextResponse.json({ blocked: rows });
  } catch (error: any) {
    console.error("GET /api/doctors/blocked error:", error);
    return apiError(500, "Failed to load blocked slots.", "internal_error");
  }
}

/** Create a blocked slot for a doctor. */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId   = auth.auth.clinic!.id;
    const clinicSlug = auth.auth.clinic!.slug;

    const body = await req.json().catch(() => ({}));
    const { doctor_slug, date, start_time, end_time, reason, type } = body;

    if (!doctor_slug || !date || !reason) {
      return apiError(400, "doctor_slug, date, and reason are required.", "invalid_input");
    }

    const validTypes = ["leave", "blocked", "emergency"];
    const slotType = validTypes.includes(type) ? type : "blocked";

    await ensureTable();

    const id = randomUUID();
    const rows = await sql`
      INSERT INTO doctor_blocked_slots
        (id, clinic_id, clinic_slug, doctor_slug, date, start_time, end_time, reason, type)
      VALUES
        (${id}, ${clinicId}, ${clinicSlug}, ${String(doctor_slug)}, ${String(date)},
         ${start_time || null}, ${end_time || null}, ${String(reason)}, ${slotType})
      RETURNING *;
    `;

    await logAudit({
      actorId:  auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "doctor_blocked_slot.create",
      entity: "doctor_blocked_slot",
      entityId: id,
      after: { doctor_slug, date, reason, type: slotType },
      request: req,
    });

    return NextResponse.json({ status: "success", blocked: rows[0] });
  } catch (error: any) {
    console.error("POST /api/doctors/blocked error:", error);
    return apiError(500, "Failed to block date.", "internal_error");
  }
}

/** Delete a blocked slot by id. */
export async function DELETE(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");
    if (!id) return apiError(400, "id is required.", "invalid_input");

    await ensureTable();

    const deleted = await sql`
      DELETE FROM doctor_blocked_slots
      WHERE id = ${id} AND clinic_id = ${auth.auth.clinic!.id}
      RETURNING id;
    `;

    if (deleted.length === 0) {
      return apiError(404, "Blocked slot not found.", "not_found");
    }

    await logAudit({
      actorId:  auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId: auth.auth.clinic!.id,
      action: "doctor_blocked_slot.delete",
      entity: "doctor_blocked_slot",
      entityId: id,
      request: req,
    });

    return NextResponse.json({ status: "success", deleted_id: id });
  } catch (error: any) {
    console.error("DELETE /api/doctors/blocked error:", error);
    return apiError(500, "Failed to remove blocked slot.", "internal_error");
  }
}
