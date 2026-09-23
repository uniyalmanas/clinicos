import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      recipient_phone,
      template_type = "rx_ready",
      patient_name = "Patient",
      doctor_name = "Dr. Rahul Sharma",
      prescription_url,
      custom_message
    } = body;

    const cleanPhone = (recipient_phone || "").replace(/[^0-9]/g, "");
    if (!cleanPhone) {
      return NextResponse.json({ error: "recipient_phone is required" }, { status: 400 });
    }

    const defaultMessage = custom_message || `Namaste ${patient_name},\nYour digital prescription from ${doctor_name} is ready.\n📄 View Rx: ${prescription_url || 'http://localhost:3000'}\nWishing you good health!`;

    // 1. Check for Meta WhatsApp Cloud API credentials in environment
    const waToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (waToken && waPhoneId) {
      try {
        const metaRes = await fetch(`https://graph.facebook.com/v20.0/${waPhoneId}/messages`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${waToken}`
          },
          body: JSON.stringify({
            messaging_product: "whatsapp",
            to: cleanPhone,
            type: "text",
            text: { body: defaultMessage }
          })
        });

        if (metaRes.ok) {
          const metaJson = await metaRes.json();
          return NextResponse.json({
            status: "delivered_via_cloud_api",
            message_id: metaJson.messages?.[0]?.id,
            recipient: cleanPhone
          });
        }
      } catch (err) {
        console.warn("WhatsApp Cloud API failed, falling back to instant wa.me:", err);
      }
    }

    // 2. Universal wa.me delivery payload
    const waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(defaultMessage)}`;

    return NextResponse.json({
      status: "dispatched",
      delivery_mode: "instant_wa_link",
      whatsapp_url: waUrl,
      recipient: cleanPhone,
      message_preview: defaultMessage
    });
  } catch (error: any) {
    console.error("POST /api/notifications/whatsapp error:", error);
    return NextResponse.json({ error: error.message || "Failed to dispatch WhatsApp" }, { status: 500 });
  }
}
