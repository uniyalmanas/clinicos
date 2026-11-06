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
      CREATE TABLE IF NOT EXISTS clinic_sent_automations (
        id          TEXT PRIMARY KEY,
        clinic_id   TEXT NOT NULL,
        clinic_slug TEXT NOT NULL,
        appointment_number TEXT,
        patient_name TEXT,
        patient_phone TEXT NOT NULL,
        trigger_type TEXT NOT NULL,
        message_text TEXT NOT NULL,
        whatsapp_url TEXT,
        sent_by      TEXT NOT NULL,
        sent_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
      CREATE INDEX IF NOT EXISTS idx_csa_clinic ON clinic_sent_automations (clinic_id, sent_at DESC);
    `;
    tableEnsured = true;
  } catch (e) {
    console.warn("ensureTable clinic_sent_automations:", e);
  }
}

/** Record that an automation was dispatched (the actual WA link is opened client-side). */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId   = auth.auth.clinic!.id;
    const clinicSlug = auth.auth.clinic!.slug;
    const sentBy     = auth.auth.user.full_name;

    const body = await req.json().catch(() => ({}));
    const {
      automation_id,
      appointment_number,
      patient_name,
      patient_phone,
      trigger_type,
      message_text,
      whatsapp_url,
    } = body;

    const phone = String(patient_phone || "").replace(/[^0-9]/g, "").slice(-10);
    if (!phone || !trigger_type || !message_text) {
      return apiError(400, "patient_phone, trigger_type, and message_text are required.", "invalid_input");
    }

    await ensureTable();

    const id = randomUUID();
    const inserted = await sql`
      INSERT INTO clinic_sent_automations
        (id, clinic_id, clinic_slug, appointment_number, patient_name, patient_phone,
         trigger_type, message_text, whatsapp_url, sent_by)
      VALUES
        (${id}, ${clinicId}, ${clinicSlug}, ${appointment_number || null},
         ${patient_name || null}, ${phone}, ${String(trigger_type)},
         ${String(message_text)}, ${whatsapp_url || null}, ${sentBy})
      RETURNING *;
    `;

    await logAudit({
      actorId:  auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "automation.sent",
      entity: "clinic_sent_automation",
      entityId: id,
      after: { trigger_type, patient_phone: phone },
      request: req,
    });

    return NextResponse.json({ status: "success", sent: inserted[0] });
  } catch (error: any) {
    console.error("POST /api/clinic/schedule-automations error:", error);
    return apiError(500, "Failed to record automation.", "internal_error");
  }
}

/** List sent automations for the clinic (last 100). */
export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;

    await ensureTable();

    const rows = await sql`
      SELECT * FROM clinic_sent_automations
      WHERE clinic_id = ${clinicId}
      ORDER BY sent_at DESC
      LIMIT 100;
    `;

    return NextResponse.json({ status: "success", sent_automations: rows });
  } catch (error: any) {
    console.error("GET /api/clinic/schedule-automations error:", error);
    return apiError(500, "Failed to load sent automations.", "internal_error");
  }
}
