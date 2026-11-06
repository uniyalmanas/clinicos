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

/**
 * Trigger a specific automation by its computed id (e.g. "auto-rx-APT-xxx").
 * Records the dispatch in clinic_sent_automations and returns the WhatsApp URL
 * so the frontend can open it.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId   = auth.auth.clinic!.id;
    const clinicSlug = auth.auth.clinic!.slug;
    const sentBy     = auth.auth.user.full_name;
    const { id }     = await params;

    const body = await req.json().catch(() => ({}));
    const {
      patient_phone,
      patient_name,
      trigger_type,
      message_text,
      whatsapp_url,
      appointment_number,
    } = body;

    const phone = String(patient_phone || "").replace(/[^0-9]/g, "").slice(-10);
    if (!phone || !message_text) {
      return apiError(400, "patient_phone and message_text are required.", "invalid_input");
    }

    await ensureTable();

    const rowId = randomUUID();
    await sql`
      INSERT INTO clinic_sent_automations
        (id, clinic_id, clinic_slug, appointment_number, patient_name, patient_phone,
         trigger_type, message_text, whatsapp_url, sent_by)
      VALUES
        (${rowId}, ${clinicId}, ${clinicSlug},
         ${appointment_number || null}, ${patient_name || null}, ${phone},
         ${String(trigger_type || "manual")}, ${String(message_text)},
         ${whatsapp_url || null}, ${sentBy})
      ON CONFLICT (id) DO NOTHING;
    `;

    await logAudit({
      actorId:  auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "automation.triggered",
      entity: "clinic_sent_automation",
      entityId: id,
      after: { trigger_type, patient_phone: phone },
      request: req,
    });

    return NextResponse.json({
      status: "success",
      message: "Automation triggered",
      automation_id: id,
      whatsapp_url: whatsapp_url || null,
    });
  } catch (error: any) {
    console.error(`POST /api/clinic/trigger-automation/${(await params)?.id} error:`, error);
    return apiError(500, "Failed to trigger automation.", "internal_error");
  }
}
