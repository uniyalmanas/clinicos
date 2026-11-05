import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const appBaseUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : "http://localhost:3000")).replace(/\/$/, "");

/**
 * Build a WhatsApp dispatch link for a prescription.
 *
 * No message is sent server-side; the desk gets a pre-filled link. Recipient
 * details come from the prescription itself unless an attendant number is
 * supplied, and the prescription must belong to the caller's clinic.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const body = await req.json();
    const { recipient_phone, template_type = "standard", custom_note } = body;

    const rxNumber = decodeURIComponent(id || "").trim();
    const clinicId = auth.auth.clinic!.id;

    const rxQuery = await sql`
      SELECT prescription_number, patient_name, patient_phone, doctor_name, clinic_name
      FROM prescriptions
      WHERE (prescription_number = ${rxNumber} OR id::text = ${rxNumber})
        AND clinic_id::text = ${clinicId}::text
      LIMIT 1;
    `;
    if (rxQuery.length === 0) {
      return apiError(404, "Prescription not found in your clinic.", "prescription_not_found");
    }
    const rx = rxQuery[0];

    const targetPhone = String(recipient_phone || rx.patient_phone || "").replace(/[^0-9]/g, "");
    if (targetPhone.length < 10) {
      return apiError(400, "A valid recipient phone is required.", "invalid_phone");
    }

    const rxUrl = `${appBaseUrl()}/p/${rx.prescription_number}`;
    const patientName = rx.patient_name || "Patient";

    let messageText: string;
    if (template_type === "bilingual_hindi") {
      messageText =
        `नमस्ते ${patientName},\n` +
        `${rx.clinic_name} के ${rx.doctor_name} द्वारा आपका पर्चा (Prescription #${rx.prescription_number}) तैयार है।\n\n` +
        `यहाँ देखें: ${rxUrl}\n\n` +
        `कृपया दवाइयाँ डॉक्टर की सलाह के अनुसार लें।`;
    } else if (template_type === "chemist_order") {
      messageText =
        `Chemist order:\n` +
        `Prescription #${rx.prescription_number} for ${patientName}.\n` +
        `Doctor: ${rx.doctor_name} (${rx.clinic_name}).\n` +
        `Verified order: ${rxUrl}`;
    } else {
      messageText =
        `Namaste ${patientName},\n` +
        `Your digital prescription (#${rx.prescription_number}) from ${rx.doctor_name} at ${rx.clinic_name} is ready.\n\n` +
        `View it here: ${rxUrl}\n\n` +
        `Please take the medicines as prescribed.` +
        (custom_note ? `\n\nNote: ${custom_note}` : "");
    }

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "prescription.dispatch.preview",
      entity: "prescription",
      entityId: rx.prescription_number,
      after: { template_type, recipient_phone: targetPhone },
      request: req,
    });

    return NextResponse.json({
      status: "ready",
      recipient_phone: targetPhone,
      whatsapp_url: `https://wa.me/${targetPhone}?text=${encodeURIComponent(messageText)}`,
      message_text: messageText,
    });
  } catch (error: any) {
    console.error("POST /api/prescriptions/[id]/whatsapp-dispatch error:", error);
    return apiError(500, "Failed to prepare the prescription dispatch.", "internal_error");
  }
}
