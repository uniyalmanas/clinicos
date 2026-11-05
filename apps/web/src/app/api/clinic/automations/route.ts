import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

const appUrl = () =>
  (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, "");

/**
 * Follow-up automation drafts built from this clinic's completed visits.
 *
 * Nothing is marked "sent" here: these are previews of the WhatsApp messages
 * the desk can dispatch, so the status is always "draft".
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const clinicSlug = auth.auth.clinic!.slug;

    const completedApts = await sql`
      SELECT a.*, p.prescription_number
      FROM appointments a
      LEFT JOIN prescriptions p ON p.appointment_number = a.appointment_number
      WHERE a.clinic_id::text = ${clinicId}::text
        AND a.status = 'completed'
      ORDER BY a.created_at DESC
      LIMIT 10;
    `;

    const googleReviewUrl = process.env.GOOGLE_REVIEW_URL || null;
    const baseUrl = appUrl();

    const automations: any[] = [];

    for (const apt of completedApts) {
      const cleanPhone = String(apt.patient_phone || "").replace(/[^0-9]/g, "").slice(-10);
      if (!cleanPhone) continue;

      const rxNum = apt.prescription_number || null;

      if (rxNum) {
        const rxMsg =
          `Namaste ${apt.patient_name},\n` +
          `Your prescription from ${apt.doctor_name} at ${apt.clinic_name} is ready.\n\n` +
          `View it here: ${baseUrl}/p/${rxNum}\n\n` +
          `Please take the medicines as advised. Wishing you a speedy recovery.`;
        automations.push({
          id: `auto-rx-${apt.id}`,
          appointment_number: apt.appointment_number,
          patient_name: apt.patient_name,
          patient_phone: apt.patient_phone,
          trigger_type: "rx_dispatch",
          title: "Prescription dispatch",
          badge: "Immediate",
          scheduled_for: null,
          status: "draft",
          message_text: rxMsg,
          whatsapp_url: `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(rxMsg)}`,
        });
      }

      if (googleReviewUrl) {
        const reviewMsg =
          `Namaste ${apt.patient_name}, thank you for visiting ${apt.clinic_name}.\n` +
          `If your experience was helpful, you can leave a review here: ${googleReviewUrl}`;
        automations.push({
          id: `auto-rev-${apt.id}`,
          appointment_number: apt.appointment_number,
          patient_name: apt.patient_name,
          patient_phone: apt.patient_phone,
          trigger_type: "review_request",
          title: "Review request",
          badge: "Evening",
          scheduled_for: null,
          status: "draft",
          message_text: reviewMsg,
          whatsapp_url: `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(reviewMsg)}`,
        });
      }

      const flwMsg =
        `Namaste ${apt.patient_name}, a reminder from ${apt.clinic_name}:\n` +
        `If you need a follow-up with ${apt.doctor_name}, you can book here: ` +
        `${baseUrl}/doctors/${apt.doctor_slug || ""}`;
      automations.push({
        id: `auto-flw-${apt.id}`,
        appointment_number: apt.appointment_number,
        patient_name: apt.patient_name,
        patient_phone: apt.patient_phone,
        trigger_type: "followup_reminder",
        title: "Follow-up reminder",
        badge: "Day 5",
        scheduled_for: null,
        status: "draft",
        message_text: flwMsg,
        whatsapp_url: `https://wa.me/91${cleanPhone}?text=${encodeURIComponent(flwMsg)}`,
      });
    }

    return NextResponse.json({ clinic_slug: clinicSlug, automations });
  } catch (error: any) {
    console.error("GET /api/clinic/automations error:", error);
    return apiError(500, "Failed to load automations.", "internal_error");
  }
}
