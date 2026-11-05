import { NextRequest, NextResponse } from "next/server";
import { randomUUID } from "crypto";
import { sql } from "@/lib/db";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { isOtpDevMode, sendOtp } from "@/lib/notifications";
import { normalisePhone } from "@/lib/api-auth";
import {
  generateOtp,
  hashOtp,
  OTP_MAX_ATTEMPTS,
  OTP_RESEND_COOLDOWN_SECONDS,
  OTP_TTL_SECONDS,
} from "@/lib/otp";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = normalisePhone(body.phone);
    if (phone.length !== 10) {
      return NextResponse.json(
        { error: "A valid 10-digit mobile number is required.", code: "invalid_phone" },
        { status: 400 }
      );
    }

    const cooldown = await rateLimit(
      `otp:cooldown:${phone}`,
      1,
      OTP_RESEND_COOLDOWN_SECONDS
    );
    if (!cooldown.allowed) {
      return NextResponse.json(tooManyRequests(cooldown.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(cooldown.retryAfterSeconds) },
      });
    }

    const hourly = await rateLimit(`otp:hour:${phone}`, 3, 3600);
    if (!hourly.allowed) {
      return NextResponse.json(tooManyRequests(hourly.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(hourly.retryAfterSeconds) },
      });
    }

    const code = generateOtp();
    const id = randomUUID();
    const expiresAt = new Date(Date.now() + OTP_TTL_SECONDS * 1000);

    await sql`
      INSERT INTO patient_otp_challenges (id, phone, otp_hash, expires_at)
      VALUES (${id}, ${phone}, ${hashOtp(phone, code)}, ${expiresAt.toISOString()});
    `;

    await sendOtp(phone, code);

    // Generic response: never reveal whether the phone exists in the system.
    return NextResponse.json({
      ok: true,
      message: "If this number can receive messages, a verification code has been sent.",
      expires_in: OTP_TTL_SECONDS,
      ...(isOtpDevMode() && process.env.OTP_DEV_MODE === "true" ? { dev_otp: code } : {}),
    });
  } catch (error: any) {
    console.error("POST /api/patient/auth/request-otp error:", error);
    return NextResponse.json(
      { error: "Could not send a verification code. Please try again.", code: "otp_send_failed" },
      { status: 502 }
    );
  }
}
