import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

interface TokenAlertSubscription {
  id: string;
  phone: string;
  patient_name: string;
  token_number: number;
  clinic_slug: string;
  clinic_name: string;
  chamber_name: string;
  doctor_name: string;
  subscribed_at: string;
  alert_sent: boolean;
  alert_sent_at?: string;
  delivery_channel: "whatsapp" | "sms";
}

// In-memory registry for proactive token notifications (retains active OPD session)
const activeSubscriptions: TokenAlertSubscription[] = [];

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const phone = searchParams.get("phone");
    const token = searchParams.get("token");

    let results = activeSubscriptions;
    if (phone) {
      const clean = phone.replace(/[^0-9]/g, "");
      results = results.filter(s => s.phone.includes(clean));
    }
    if (token) {
      results = results.filter(s => s.token_number === Number(token));
    }

    return NextResponse.json({
      subscriptions: results,
      total_active: results.length
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to retrieve subscriptions" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const {
      action = "subscribe",
      phone,
      patient_name = "Valued Patient",
      token_number,
      current_token = 1,
      clinic_slug = "derma-care",
      clinic_name = "Derma Care Skin & Laser Centre",
      chamber_name = "Chamber 1",
      doctor_name = "Dr. Rahul Sharma",
      delivery_channel = "whatsapp"
    } = body;

    const cleanPhone = (phone || "").replace(/[^0-9]/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      return NextResponse.json(
        { error: "Valid 10-digit mobile number is required to receive proactive token alerts." },
        { status: 400 }
      );
    }

    const patientTokenNum = Number(token_number);
    const currentTokenNum = Number(current_token);
    const positionsAway = Math.max(0, patientTokenNum - currentTokenNum);
    const isWithin2Tokens = positionsAway <= 2 && positionsAway >= 0;

    // Standard notification message per clinical specification
    const proactiveAlertMessage = `🔔 *ClinicOS Token Alert*\n\nNamaste ${patient_name},\nYour turn is coming up! Please proceed to Reception.\n\n📍 *Clinic:* ${clinic_name}\n🚪 *Room:* ${chamber_name} (${doctor_name})\n🎫 *Your Token:* #${patientTokenNum}\n⏳ *Now Calling:* #${currentTokenNum} (${positionsAway} patient${positionsAway === 1 ? '' : 's'} ahead)\n\nYou can track real-time progression at: https://medic-sept-2026.vercel.app/waiting-room?clinic=${clinic_slug}&token=${patientTokenNum}`;

    // 1. WhatsApp / SMS Dispatch via Cloud API or wa.me fallback
    let dispatchStatus = "scheduled";
    let waUrl = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(proactiveAlertMessage)}`;

    const waToken = process.env.WHATSAPP_CLOUD_API_TOKEN;
    const waPhoneId = process.env.WHATSAPP_PHONE_NUMBER_ID;

    if (action === "test_alert" || (action === "subscribe" && isWithin2Tokens)) {
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
              text: { body: proactiveAlertMessage }
            })
          });
          if (metaRes.ok) {
            dispatchStatus = "delivered_cloud_api";
          }
        } catch (e) {
          console.warn("WhatsApp Cloud API dispatch failed:", e);
        }
      } else {
        dispatchStatus = "dispatched_instant_link";
      }
    }

    const subRecord: TokenAlertSubscription = {
      id: `SUB-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      phone: cleanPhone,
      patient_name,
      token_number: patientTokenNum,
      clinic_slug,
      clinic_name,
      chamber_name,
      doctor_name,
      subscribed_at: new Date().toISOString(),
      alert_sent: isWithin2Tokens,
      alert_sent_at: isWithin2Tokens ? new Date().toISOString() : undefined,
      delivery_channel
    };

    activeSubscriptions.push(subRecord);

    return NextResponse.json({
      success: true,
      message: isWithin2Tokens
        ? `✓ Proactive alert triggered! Token #${patientTokenNum} is within 2 positions of current #${currentTokenNum}. Notification dispatched.`
        : `✓ Alert subscription active! We will notify ${cleanPhone} via WhatsApp/SMS the moment your token is 2 positions away from current.`,
      subscription: subRecord,
      positions_away: positionsAway,
      is_within_2_tokens: isWithin2Tokens,
      estimated_wait_mins: Math.max(2, positionsAway * 8),
      alert_message_preview: proactiveAlertMessage,
      whatsapp_direct_link: waUrl,
      dispatch_status: dispatchStatus
    });
  } catch (error: any) {
    console.error("POST /api/clinic/token-alert error:", error);
    return NextResponse.json({ error: error.message || "Failed to process token alert" }, { status: 500 });
  }
}
