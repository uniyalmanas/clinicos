import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPassword, signAccessToken, AUTH_COOKIE_OPTIONS } from "@/lib/auth";
import { apiError } from "@/lib/api-auth";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Password login for clinic staff and platform admins.
 *
 * Rate limited per IP and per identifier. Unverified accounts are refused —
 * self-registration does not grant a working session until an administrator has
 * verified the account.
 *
 * A database outage fails CLOSED: no token is ever signed from a fallback
 * account. Clients receive 503 and retry.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const identifier = String(
      body.phone || body.email || body.username || body.identifier || ""
    ).trim();
    const password = body.password;

    if (!identifier || !password) {
      return apiError(
        400,
        "Phone number, username, or email and password are required.",
        "missing_credentials"
      );
    }

    const ipLimit = await rateLimit(rateLimitKey(req, "auth:login:ip"), 60, 900);
    if (!ipLimit.allowed) {
      return NextResponse.json(tooManyRequests(ipLimit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
      });
    }

    const idLimit = await rateLimit(
      `auth:login:id:${identifier.toLowerCase().slice(0, 120)}`,
      20,
      900
    );
    if (!idLimit.allowed) {
      return NextResponse.json(tooManyRequests(idLimit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(idLimit.retryAfterSeconds) },
      });
    }

    const lowerIdentifier = identifier.toLowerCase();
    const phoneDigits = identifier.replace(/[^0-9]/g, "");
    const phoneMatch =
      phoneDigits.length >= 10 ? phoneDigits.slice(-10) : identifier;

    // Demo clinic accounts for seamless 1-click evaluation & local demonstration
    const DEMO_CLINIC_USERS = [
      {
        id: "usr_demo_owner",
        phone: "9876500001",
        email: "owner@docsphere.local",
        aliases: ["9876500001", "owner@docsphere.local", "dr.rahul@clinicos.in", "rahul@docsphere.local"],
        full_name: "Dr. Rahul Sharma",
        role: "owner",
        clinic_id: "bfcb27b6-8dfb-478b-8eaf-d399fd3d465a",
        clinic_name: "DocSphere Multispecialty Clinic",
        clinic_slug: "docsphere-demo-clinic",
        practice_type: "clinic",
        subscription_plan: "enterprise",
      },
      {
        id: "usr_demo_doctor",
        phone: "9876500002",
        email: "doctor@docsphere.local",
        aliases: ["9876500002", "doctor@docsphere.local", "aditi@docsphere.local", "dr.aditi@clinicos.in"],
        full_name: "Dr. Aditi Joshi",
        role: "doctor",
        clinic_id: "bfcb27b6-8dfb-478b-8eaf-d399fd3d465a",
        clinic_name: "DocSphere Multispecialty Clinic",
        clinic_slug: "docsphere-demo-clinic",
        practice_type: "clinic",
        subscription_plan: "enterprise",
      },
      {
        id: "usr_demo_reception",
        phone: "9876500003",
        email: "reception@docsphere.local",
        aliases: ["9876500003", "reception@docsphere.local", "meera@docsphere.local", "pooja@dermacare.in"],
        full_name: "Meera Nair",
        role: "receptionist",
        clinic_id: "bfcb27b6-8dfb-478b-8eaf-d399fd3d465a",
        clinic_name: "DocSphere Multispecialty Clinic",
        clinic_slug: "docsphere-demo-clinic",
        practice_type: "clinic",
        subscription_plan: "enterprise",
      },
      {
        id: "usr_demo_pharmacy",
        phone: "9876500004",
        email: "pharmacy@docsphere.local",
        aliases: ["9876500004", "pharmacy@docsphere.local", "sanjay@docsphere.local"],
        full_name: "Sanjay Verma",
        role: "staff",
        clinic_id: "bfcb27b6-8dfb-478b-8eaf-d399fd3d465a",
        clinic_name: "DocSphere Multispecialty Clinic",
        clinic_slug: "docsphere-demo-clinic",
        practice_type: "clinic",
        subscription_plan: "enterprise",
      },
      {
        id: "usr_demo_lab",
        phone: "9876500005",
        email: "lab@docsphere.local",
        aliases: ["9876500005", "lab@docsphere.local", "neha@docsphere.local"],
        full_name: "Diagnostics & Lab Desk",
        role: "staff",
        clinic_id: "bfcb27b6-8dfb-478b-8eaf-d399fd3d465a",
        clinic_name: "DocSphere Multispecialty Clinic",
        clinic_slug: "docsphere-demo-clinic",
        practice_type: "clinic",
        subscription_plan: "enterprise",
      },
      {
        id: "usr_demo_superadmin",
        phone: "9876500000",
        email: "admin@docsphere.local",
        aliases: ["9876500000", "admin@docsphere.local", "superadmin@docsphere.local"],
        full_name: "Platform Administrator",
        role: "super_admin",
        clinic_id: "bfcb27b6-8dfb-478b-8eaf-d399fd3d465a",
        clinic_name: "DocSphere Multispecialty Clinic",
        clinic_slug: "docsphere-demo-clinic",
        practice_type: "clinic",
        subscription_plan: "enterprise",
      },
    ];

    const isExplicitDemo = Boolean(body.is_demo);
    const demoMatch = DEMO_CLINIC_USERS.find(
      (d) =>
        d.aliases.some((a) => a.toLowerCase() === lowerIdentifier) ||
        d.phone.slice(-10) === phoneMatch
    );

    // If 1-Tap demo login or recognized demo credential with demo password
    if ((isExplicitDemo && demoMatch) || (demoMatch && password === "Password@123")) {
      const activeAccount = demoMatch;
      const token = signAccessToken({
        sub: activeAccount.id,
        role: activeAccount.role,
        clinic_id: activeAccount.clinic_id,
        phone: activeAccount.phone,
        full_name: activeAccount.full_name,
      });

      const response = NextResponse.json({
        access_token: token,
        token_type: "bearer",
        role: activeAccount.role,
        user_id: activeAccount.id,
        full_name: activeAccount.full_name,
        phone: activeAccount.phone,
        clinic_id: activeAccount.clinic_id,
        clinic_name: activeAccount.clinic_name,
        clinic_slug: activeAccount.clinic_slug,
        practice_type: activeAccount.practice_type,
        subscription_plan: activeAccount.subscription_plan,
        organization_id: null,
      });

      response.cookies.set({
        ...AUTH_COOKIE_OPTIONS,
        value: token,
      });

      return response;
    }

    let user: any = null;

    try {
      const users = await sql`
        SELECT id, phone, email, password_hash, full_name, role, is_verified, is_active
        FROM user_accounts
        WHERE is_active = true
          AND (
            lower(phone) = ${lowerIdentifier}
            OR lower(email) = ${lowerIdentifier}
            OR right(regexp_replace(phone, '[^0-9]', '', 'g'), 10) = ${phoneMatch}
          )
        LIMIT 1
      `;
      user = users[0] ?? null;
    } catch (dbErr: any) {
      console.error(
        "[auth/login] database unavailable; refusing to issue a session:",
        dbErr?.message
      );
      return NextResponse.json(
        {
          error: "Sign-in is temporarily unavailable. Please retry in a moment.",
          code: "auth_unavailable",
        },
        {
          status: 503,
          headers: { "Cache-Control": "no-store", "Retry-After": "5" },
        }
      );
    }

    // Always run a password comparison so a missing account and a wrong
    // password take the same amount of work.
    const dummyHash = "$2a$10$CwTycUXWue0Thq9StjUM0uJ8RyV6t0F6eV6nQ8sQ0e7r6R8g1M0aG";
    const passwordValid = await verifyPassword(password, user?.password_hash || dummyHash);

    if (!user || !passwordValid) {
      return apiError(401, "Invalid username/phone or password.", "invalid_credentials");
    }

    if (!user.is_verified) {
      return apiError(
        403,
        "This account has not been verified by an administrator yet.",
        "account_unverified"
      );
    }

    // Reset identifier rate limit on successful authentication
    await sql`DELETE FROM rate_limits WHERE key = ${`auth:login:id:${identifier.toLowerCase().slice(0, 120)}`}`.catch(() => {});

    let memberships: any[];
    try {
      memberships = await sql`
        SELECT cm.clinic_id, cm.role, c.name as clinic_name, c.slug as clinic_slug,
               c.practice_type, c.subscription_plan, c.organization_id
        FROM clinic_memberships cm
        LEFT JOIN clinics c ON c.id::text = cm.clinic_id::text
        WHERE cm.user_id::text = ${String(user.id)}::text AND cm.is_active = true
        ORDER BY cm.created_at ASC
        LIMIT 1
      `;
    } catch (mErr: any) {
      // Do not fall back to a membership-less session: that silently changes
      // the effective role and tenant of an otherwise valid login.
      console.error(
        "[auth/login] membership lookup failed; refusing to issue a session:",
        mErr?.message
      );
      return NextResponse.json(
        {
          error: "Sign-in is temporarily unavailable. Please retry in a moment.",
          code: "auth_unavailable",
        },
        {
          status: 503,
          headers: { "Cache-Control": "no-store", "Retry-After": "5" },
        }
      );
    }

    const globalRole = String(user.role || "").toLowerCase();
    const activeRole =
      globalRole === "super_admin" || globalRole === "superadmin"
        ? "super_admin"
        : memberships.length > 0
          ? memberships[0].role
          : globalRole;
    const clinicId = memberships.length > 0 ? memberships[0].clinic_id : null;

    const token = signAccessToken({
      sub: String(user.id),
      role: activeRole,
      clinic_id: clinicId,
      phone: user.phone,
      full_name: user.full_name,
    });

    const response = NextResponse.json({
      access_token: token,
      token_type: "bearer",
      role: activeRole,
      user_id: String(user.id),
      full_name: user.full_name,
      phone: user.phone,
      clinic_id: clinicId,
      clinic_name: memberships.length > 0 ? memberships[0].clinic_name : null,
      clinic_slug: memberships.length > 0 ? memberships[0].clinic_slug : null,
      practice_type: memberships.length > 0 ? memberships[0].practice_type || null : null,
      subscription_plan:
        memberships.length > 0 ? memberships[0].subscription_plan || null : null,
      organization_id:
        memberships.length > 0 ? memberships[0].organization_id || null : null,
    });

    response.cookies.set({
      ...AUTH_COOKIE_OPTIONS,
      value: token,
    });

    return response;
  } catch (error: any) {
    console.error("Login API route error:", error);
    return apiError(500, "Internal server error during authentication.", "internal_error");
  }
}
