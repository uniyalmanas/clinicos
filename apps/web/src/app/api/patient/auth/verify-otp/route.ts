import { NextRequest, NextResponse } from "next/server";
import { createHash, randomUUID } from "crypto";
import { sql } from "@/lib/db";
import { rateLimit, tooManyRequests } from "@/lib/rate-limit";
import {
  normalisePhone,
  patientCookieOptions,
  signPatientToken,
} from "@/lib/api-auth";
import { hashOtp, OTP_MAX_ATTEMPTS, safeEqualHex } from "@/lib/otp";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const phone = normalisePhone(body.phone);
    const code = String(body.otp || body.code || "").replace(/\D/g, "");

    if (phone.length !== 10 || code.length !== 6) {
      return NextResponse.json(
        { error: "A valid phone number and 6-digit code are required.", code: "invalid_input" },
        { status: 400 }
      );
    }

    const attemptLimit = await rateLimit(`otp:verify:${phone}`, 15, 900);
    if (!attemptLimit.allowed) {
      return NextResponse.json(tooManyRequests(attemptLimit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(attemptLimit.retryAfterSeconds) },
      });
    }

    const rows = await sql`
      SELECT id, otp_hash, attempts, max_attempts, expires_at, consumed_at
      FROM patient_otp_challenges
      WHERE phone = ${phone}
        AND consumed_at IS NULL
      ORDER BY created_at DESC
      LIMIT 1;
    `;

    const challenge = rows[0];
    if (!challenge || new Date(challenge.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        { error: "This code has expired. Request a new one.", code: "otp_expired" },
        { status: 401 }
      );
    }

    const maxAttempts = Number(challenge.max_attempts || OTP_MAX_ATTEMPTS);
    if (Number(challenge.attempts) >= maxAttempts) {
      return NextResponse.json(
        { error: "Too many incorrect attempts. Request a new code.", code: "otp_locked" },
        { status: 429 }
      );
    }

    // Record the attempt first so brute-force is bounded even on a crash.
    await sql`
      UPDATE patient_otp_challenges
      SET attempts = attempts + 1
      WHERE id = ${challenge.id};
    `;

    if (!safeEqualHex(String(challenge.otp_hash), hashOtp(phone, code))) {
      const remaining = Math.max(0, maxAttempts - (Number(challenge.attempts) + 1));
      return NextResponse.json(
        {
          error: "Incorrect verification code.",
          code: "otp_invalid",
          attempts_remaining: remaining,
        },
        { status: 401 }
      );
    }

    // Single-use: only the first successful verification wins.
    const consumed = await sql`
      UPDATE patient_otp_challenges
      SET consumed_at = now()
      WHERE id = ${challenge.id} AND consumed_at IS NULL
      RETURNING id;
    `;
    if (consumed.length === 0) {
      return NextResponse.json(
        { error: "This code has already been used.", code: "otp_consumed" },
        { status: 401 }
      );
    }

    const sessionId = randomUUID();
    const token = signPatientToken(phone, sessionId);
    const tokenHash = createHash("sha256").update(token).digest("hex");
    const expiresAt = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await sql`
      INSERT INTO patient_sessions (id, phone, token_hash, expires_at, user_agent, ip)
      VALUES (
        ${sessionId},
        ${phone},
        ${tokenHash},
        ${expiresAt.toISOString()},
        ${req.headers.get("user-agent")},
        ${req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || null}
      );
    `;

    const response = NextResponse.json({
      ok: true,
      access_token: token,
      token_type: "bearer",
      phone,
      expires_in: 30 * 24 * 60 * 60,
    });
    response.cookies.set({ ...patientCookieOptions(), value: token });
    return response;
  } catch (error: any) {
    console.error("POST /api/patient/auth/verify-otp error:", error);
    return NextResponse.json(
      { error: "Verification failed. Please try again.", code: "otp_verify_failed" },
      { status: 500 }
    );
  }
}
