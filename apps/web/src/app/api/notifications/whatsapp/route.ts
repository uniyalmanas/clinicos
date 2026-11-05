import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { sendMessage } from "@/lib/notifications";

export const dynamic = "force-dynamic";

const appBaseUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")).replace(/\/$/, "");

/**
 * Send a prescription-ready WhatsApp message.
 *
 * This is a staff action, so it requires a clinic session. Patient name, phone,
 * doctor and clinic all come from the prescription row — the route never
 * substitutes a sample doctor or "Patient". If no messaging provider is
 * configured the response is an honest `ready` wa.me link, not a claimed
 * delivery.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;

    const body = await req.json();
    const {
      prescription_number = null,
      recipient_phone = null,
      custom_message = null,
    } = body;

    if (!prescription_number) {
      return apiError(
        400,
        "prescription_number is required so patient and doctor details can be verified.",
        "prescription_required"
      );
    }

    const rxRows = await sql`
      SELECT prescription_number, patient_name, patient_phone, doctor_name, clinic_name
      FROM prescriptions
      WHERE (prescription_number = ${String(prescription_number)} OR id::text = ${String(prescription_number)})
        AND clinic_id::text = ${clinicId}::text
      LIMIT 1;
    `;
    if (rxRows.length === 0) {
      return apiError(404, "Prescription not found in your clinic.", "prescription_not_found");
    }
    const rx = rxRows[0];

    const targetPhone = String(recipient_phone || rx.patient_phone || "")
      .replace(/[^0-9]/g, "")
      .slice(-10);
    if (targetPhone.length !== 10) {
      return apiError(
        400,
        "The prescription has no valid patient phone. Supply recipient_phone.",
        "invalid_phone"
      );
    }

    const patientName = String(rx.patient_name || "").trim();
    const doctorName = String(rx.doctor_name || "").trim();
    const clinicName = String(rx.clinic_name || auth.auth.clinic!.name || "").trim();
    const rxUrl = `${appBaseUrl()}/p/${rx.prescription_number}`;

    const messageText = custom_message
      ? String(custom_message).slice(0, 2000)
      : `Namaste ${patientName || "there"},\n` +
        `Your digital prescription (#${rx.prescription_number})` +
        (doctorName ? ` from ${doctorName}` : "") +
        (clinicName ? ` at ${clinicName}` : "") +
        ` is ready.\n\nView it here: ${rxUrl}\n\nPlease take the medicines as prescribed.`;

    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(messageText)}`;

    let delivery: "sent" | "ready" = "ready";
    let providerError: string | null = null;
    if (!custom_message || process.env.WHATSAPP_TOKEN) {
      try {
        await sendMessage(targetPhone, messageText);
        delivery = "sent";
      } catch (sendError: any) {
        providerError =
          sendError?.message || "Messaging provider is not configured.";
      }
    }

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: delivery === "sent" ? "whatsapp.message.sent" : "whatsapp.message.prepared",
      entity: "prescription",
      entityId: rx.prescription_number,
      after: { recipient_phone: targetPhone, delivery },
      request: req,
    });

    return NextResponse.json({
      status: delivery === "sent" ? "sent" : "ready",
      delivery_mode: delivery === "sent" ? "whatsapp_cloud_api" : "wa_link",
      recipient: targetPhone,
      whatsapp_url: whatsappUrl,
      message_preview: messageText,
      provider_error: delivery === "sent" ? null : providerError,
    });
  } catch (error: any) {
    console.error("POST /api/notifications/whatsapp error:", error);
    return apiError(500, "Failed to prepare the WhatsApp message.", "internal_error");
  }
}
