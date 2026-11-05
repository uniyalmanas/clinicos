/**
 * Notification adapters.
 *
 * The only requirement today is OTP and queue alerts. Keep every provider
 * behind this interface so switching from WhatsApp → SMS → a BSP is a
 * one-file change.
 */

export interface Delivery {
  channel: "console" | "whatsapp" | "sms";
  delivered: boolean;
}

const devMode = () =>
  process.env.OTP_DEV_MODE === "true" ||
  (process.env.NODE_ENV !== "production" && process.env.OTP_DEV_MODE !== "false");

async function whatsappSend(toPhone: string, text: string): Promise<Delivery> {
  const token = process.env.WHATSAPP_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId) {
    throw new Error("No messaging provider is configured.");
  }

  const res = await fetch(
    `https://graph.facebook.com/v21.0/${phoneNumberId}/messages`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        to: `91${toPhone}`,
        type: "text",
        text: { body: text },
      }),
    }
  );

  if (!res.ok) {
    console.error("[notify] WhatsApp delivery failed", res.status, await res.text());
    throw new Error("Could not deliver the message.");
  }
  return { channel: "whatsapp", delivered: true };
}

export async function sendOtp(phone: string, code: string): Promise<Delivery> {
  if (devMode()) {
    console.log(`[otp] ${phone} → ${code} (dev mode, not sent)`);
    return { channel: "console", delivered: true };
  }
  return whatsappSend(
    phone,
    `${code} is your ClinicOS verification code. It expires in 5 minutes. Never share it with anyone.`
  );
}

/** Free-form operational message (queue alerts, reminders). */
export async function sendMessage(phone: string, text: string): Promise<Delivery> {
  if (devMode()) {
    console.log(`[notify] ${phone} → ${text} (dev mode, not sent)`);
    return { channel: "console", delivered: true };
  }
  return whatsappSend(phone, text);
}

export function isOtpDevMode(): boolean {
  return devMode();
}
