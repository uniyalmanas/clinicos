import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword } from "@/lib/auth";
import { apiError } from "@/lib/api-auth";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";
import crypto from "crypto";

export const dynamic = "force-dynamic";

/**
 * Public self-registration.
 *
 * Creates an unverified patient account only. Role and clinic membership are
 * never accepted from the client, and no session is issued: an administrator
 * must verify the account before it can log in. Staff accounts are provisioned
 * by their clinic owner, not by this endpoint.
 */
export async function POST(req: NextRequest) {
  try {
    const limit = await rateLimit(rateLimitKey(req, "auth:register"), 3, 3600);
    if (!limit.allowed) {
      return NextResponse.json(tooManyRequests(limit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const body = await req.json().catch(() => ({}));
    const fullName = String(body.full_name || "").trim();
    const password = String(body.password || "");
    const rawPhone = String(body.phone || "").replace(/[^0-9]/g, "");
    const email = body.email ? String(body.email).trim().toLowerCase() : null;

    if (!fullName || !rawPhone || !password) {
      return apiError(
        400,
        "Phone number, full name, and password are required.",
        "missing_fields"
      );
    }
    if (rawPhone.length < 10 || rawPhone.length > 13) {
      return apiError(400, "Enter a valid mobile number.", "invalid_phone");
    }
    if (password.length < 8) {
      return apiError(400, "Password must be at least 8 characters.", "weak_password");
    }
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return apiError(400, "Enter a valid email address.", "invalid_email");
    }

    const phone = `+91${rawPhone.slice(-10)}`;

    const existing = await sql`
      SELECT id FROM user_accounts WHERE phone = ${phone} OR lower(phone) = ${phone.toLowerCase()} LIMIT 1
    `;
    if (existing.length > 0) {
      return apiError(400, "A user with this phone number already exists.", "duplicate_phone");
    }

    if (email) {
      const existingEmail = await sql`
        SELECT id FROM user_accounts WHERE lower(email) = ${email} LIMIT 1
      `;
      if (existingEmail.length > 0) {
        return apiError(400, "A user with this email already exists.", "duplicate_email");
      }
    }

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    await sql`
      INSERT INTO user_accounts (
        id, phone, email, password_hash, full_name, role,
        is_verified, is_active, created_at
      ) VALUES (
        ${userId}, ${phone}, ${email}, ${passwordHash}, ${fullName},
        'patient', false, true, NOW()
      )
    `;

    return NextResponse.json(
      {
        status: "pending_verification",
        user_id: userId,
        phone,
        message:
          "Account created. An administrator must verify it before you can sign in. Patients can use the patient portal with a one-time code immediately.",
      },
      { status: 202 }
    );
  } catch (error: any) {
    console.error("Register API route error:", error);
    return apiError(500, "Registration failed.", "internal_error");
  }
}
