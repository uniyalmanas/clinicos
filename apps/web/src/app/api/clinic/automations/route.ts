import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    // Generate automations from recent completed appointments
    const completedApts = await sql`
      SELECT a.*, p.id AS prescription_id, p.prescription_number 
      FROM appointments a
      LEFT JOIN prescriptions p ON p.appointment_number = a.appointment_number
      WHERE a.status = 'completed'
      ORDER BY a.created_at DESC
      LIMIT 10;
    `;

    const automations = [];

    for (const apt of completedApts) {
      const cleanPhone = (apt.patient_phone || "").replace(/[^0-9]/g, "");
      const rxNum = apt.prescription_number || `RX-2026-09-${1000 + apt.token_number}`;

      // 1. Digital Rx Dispatch (Immediate)
      const rxMsg = `Namaste ${apt.patient_name},\nYour digital prescription from ${apt.doctor_name} at ${apt.clinic_name} is ready.\n\n📄 View & Download Rx: http://localhost:3000/p/${rxNum}\n💊 Please take medicines as advised after meals.\n\nWishing you good health!`;
      automations.push({
        id: `auto-rx-${apt.id}`,
        appointment_number: apt.appointment_number,
        patient_name: apt.patient_name,
        patient_phone: apt.patient_phone,
        trigger_type: "rx_dispatch",
        title: "Instant Rx WhatsApp Dispatch",
        badge: "Immediate",
        scheduled_for: "Immediate (0 Min)",
        status: "sent",
        message_text: rxMsg,
        whatsapp_url: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(rxMsg)}`
      });

      // 2. Google 5-Star Review Booster
      const reviewMsg = `Namaste ${apt.patient_name}! We hope you are recovering well after your visit with ${apt.doctor_name} at ${apt.clinic_name}. ⭐\nIf you had a helpful and comforting experience, could you please take 15 seconds to support our clinic with a 5-star Google review? 👉 https://g.page/r/derma-care-dehradun/review`;
      automations.push({
        id: `auto-rev-${apt.id}`,
        appointment_number: apt.appointment_number,
        patient_name: apt.patient_name,
        patient_phone: apt.patient_phone,
        trigger_type: "google_review",
        title: "Google 5-Star Review Booster",
        badge: "Evening Booster",
        scheduled_for: "Today at 19:30 PM",
        status: "scheduled",
        message_text: reviewMsg,
        whatsapp_url: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(reviewMsg)}`
      });

      // 3. Follow-up Validity Expiry Alert (Marley 7-Day Protocol)
      const flwMsg = `Namaste ${apt.patient_name}, gentle reminder from ${apt.clinic_name}:\nYour consultation follow-up validity with ${apt.doctor_name} expires in 48 hours.\nTap here to view queue & reserve your priority token: http://localhost:3000/doctors/${apt.doctor_slug || 'dr-rahul-sharma'}`;
      automations.push({
        id: `auto-flw-${apt.id}`,
        appointment_number: apt.appointment_number,
        patient_name: apt.patient_name,
        patient_phone: apt.patient_phone,
        trigger_type: "followup_reminder",
        title: "Follow-Up Validity Expiry Alert",
        badge: "Day 5 Reminder",
        scheduled_for: "Day 5 Reminder",
        status: "scheduled",
        message_text: flwMsg,
        whatsapp_url: `https://wa.me/${cleanPhone}?text=${encodeURIComponent(flwMsg)}`
      });
    }

    return NextResponse.json({ automations });
  } catch (error: any) {
    console.error("GET /api/clinic/automations error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch automations" }, { status: 500 });
  }
}
