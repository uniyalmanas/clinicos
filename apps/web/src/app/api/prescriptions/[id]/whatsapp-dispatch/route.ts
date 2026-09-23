import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const {
      recipient_phone,
      recipient_type = "patient",
      attendant_name,
      template_type = "standard",
      custom_note
    } = body;

    const rxNumber = decodeURIComponent(id || "").trim();

    // Look up prescription
    const rxQuery = await sql`
      SELECT * FROM prescriptions 
      WHERE prescription_number = ${rxNumber} OR id = ${rxNumber}
      LIMIT 1;
    `;

    const rx = rxQuery[0];
    const targetPhone = (recipient_phone || rx?.patient_phone || "").replace(/[^0-9]/g, "");
    const doctorName = rx?.doctor_name || "Dr. Rahul Sharma";
    const clinicName = rx?.clinic_name || "Derma Care Skin & Laser Centre";
    const patientName = rx?.patient_name || "Patient";

    let messageText = "";

    if (template_type === "bilingual_hindi") {
      messageText = `नमस्ते ${patientName},\n${clinicName} से ${doctorName} द्वारा जारी डिजिटल पर्चा (Prescription #${rxNumber}) तैयार है।\n\n📄 पर्चा देखें और डाउनलोड करें:\nhttp://localhost:3000/p/${rxNumber}\n\n💊 कृपया दवाइयां डॉक्टर के निर्देशानुसार भोजन के बाद लें।\nस्वास्थ्य लाभ की मंगलकामनाएं!`;
    } else if (template_type === "chemist_order") {
      messageText = `Chemist Order Alert:\nPrescription #${rxNumber} for patient ${patientName} (${targetPhone}).\nDoctor: ${doctorName} (${clinicName}).\nView verified Rx order & batch dispense here:\nhttp://localhost:3000/p/${rxNumber}`;
    } else {
      messageText = `Namaste ${patientName},\nYour official digital prescription (#${rxNumber}) from ${doctorName} at ${clinicName} is ready.\n\n📄 View & Download Rx PDF:\nhttp://localhost:3000/p/${rxNumber}\n\n💊 Take medicines as prescribed.\n${custom_note ? `\nNote: ${custom_note}` : ""}\n\nWishing you speedy recovery!`;
    }

    const whatsappUrl = `https://wa.me/${targetPhone}?text=${encodeURIComponent(messageText)}`;

    return NextResponse.json({
      status: "dispatched",
      recipient_phone: targetPhone,
      whatsapp_url: whatsappUrl,
      message_text: messageText
    });
  } catch (error: any) {
    console.error("POST /api/prescriptions/[id]/whatsapp-dispatch error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch WhatsApp Rx" }, { status: 500 });
  }
}
