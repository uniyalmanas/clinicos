import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      appointment_number,
      patient_name,
      patient_phone,
      doctor_name = "Dr. Rahul Sharma",
      doctor_slug = "dr-rahul-sharma",
      clinic_name = "Derma Care Skin & Laser Centre",
      prescription_id,
      followup_days = 7
    } = body;

    const cleanPh = (patient_phone || "").replace(/[^0-9]/g, "");
    const rxUrl = `http://localhost:3000/p/${prescription_id || appointment_number}`;

    const automations = [
      {
        id: `auto-rx-${Date.now()}`,
        appointment_number,
        patient_name,
        patient_phone,
        trigger_type: "rx_dispatch",
        title: "Instant Rx WhatsApp Dispatch",
        badge: "Immediate (0 Min)",
        status: "sent",
        message_text: `Namaste ${patient_name},\nYour digital prescription from ${doctor_name} at ${clinic_name} is ready.\n\n📄 View & Download Rx: ${rxUrl}\n💊 Please take medicines as advised after meals.\n\nWishing you good health!`,
        whatsapp_url: `https://wa.me/${cleanPh}?text=${encodeURIComponent(`Namaste ${patient_name},\nYour digital prescription is ready: ${rxUrl}`)}`
      },
      {
        id: `auto-rev-${Date.now() + 1}`,
        appointment_number,
        patient_name,
        patient_phone,
        trigger_type: "google_review",
        title: "Google 5-Star Review Booster",
        badge: "Today at 19:30 PM",
        status: "scheduled",
        message_text: `Namaste ${patient_name}! We hope you are recovering well after your visit with ${doctor_name} at ${clinic_name}. ⭐\nIf you had a reassuring experience, could you take 15 seconds to support our doctor with a 5-star Google review? 👉 https://g.page/r/derma-care-dehradun/review`,
        whatsapp_url: `https://wa.me/${cleanPh}?text=${encodeURIComponent(`Namaste ${patient_name}! If you had a good experience, please leave us a 5-star Google review: https://g.page/r/derma-care-dehradun/review`)}`
      },
      {
        id: `auto-flw-${Date.now() + 2}`,
        appointment_number,
        patient_name,
        patient_phone,
        trigger_type: "followup_reminder",
        title: "Follow-Up Validity Expiry Alert",
        badge: `Day ${Math.max(1, followup_days - 2)} Reminder`,
        status: "scheduled",
        message_text: `Namaste ${patient_name}, gentle reminder from ${clinic_name}:\nYour consultation follow-up validity with ${doctor_name} expires in 48 hours.\nTap here to view queue & reserve your priority token: http://localhost:3000/doctors/${doctor_slug}`,
        whatsapp_url: `https://wa.me/${cleanPh}?text=${encodeURIComponent(`Namaste ${patient_name}, your follow-up validity expires in 48h. Reserve token: http://localhost:3000/doctors/${doctor_slug}`)}`
      }
    ];

    return NextResponse.json({ status: "success", automations });
  } catch (error: any) {
    console.error("POST /api/clinic/schedule-automations error:", error);
    return NextResponse.json({ error: error.message || "Failed to schedule automations" }, { status: 500 });
  }
}
