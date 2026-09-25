import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPassword, signAccessToken, AUTH_COOKIE_OPTIONS } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const identifier = (body.phone || body.username || body.identifier || "").trim();
    const password = body.password;

    if (!identifier || !password) {
      return NextResponse.json(
        { detail: "Phone number, username, or email and password are required." },
        { status: 400 }
      );
    }

    const cleanIdentifier = identifier;
    const lowerIdentifier = identifier.toLowerCase();

    // Query user account by phone, username, or email
    const users = await sql`
      SELECT id, phone, email, password_hash, full_name, role, is_verified, is_active
      FROM user_accounts
      WHERE (
        phone = ${cleanIdentifier}
        OR lower(phone) = ${lowerIdentifier}
        OR email = ${cleanIdentifier}
        OR lower(email) = ${lowerIdentifier}
      ) AND is_active = true
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { detail: "Invalid username/phone or password." },
        { status: 401 }
      );
    }

    const user = users[0];
    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      return NextResponse.json(
        { detail: "Invalid username/phone or password." },
        { status: 401 }
      );
    }

    // Lookup active clinic membership if applicable
    const memberships = await sql`
      SELECT cm.clinic_id, cm.role, c.name as clinic_name, c.slug as clinic_slug
      FROM clinic_memberships cm
      LEFT JOIN clinics c ON c.id = cm.clinic_id
      WHERE cm.user_id = ${user.id} AND cm.is_active = true
      LIMIT 1
    `;

    const activeRole = user.role === "super_admin" ? "super_admin" : (memberships.length > 0 ? memberships[0].role : user.role);
    const clinicId = memberships.length > 0 ? memberships[0].clinic_id : null;
    const clinicName = memberships.length > 0 ? memberships[0].clinic_name : null;
    const clinicSlug = memberships.length > 0 ? memberships[0].clinic_slug : null;

    const token = signAccessToken({
      sub: user.id,
      role: activeRole,
      clinic_id: clinicId,
      phone: user.phone,
      full_name: user.full_name,
    });

    const response = NextResponse.json({
      access_token: token,
      token_type: "bearer",
      role: activeRole,
      user_id: user.id,
      full_name: user.full_name,
      phone: user.phone,
      clinic_id: clinicId,
      clinic_name: clinicName,
      clinic_slug: clinicSlug,
    });

    // Set standard secure HttpOnly cookie for seamless SSR session & XSS defense
    response.cookies.set({
      ...AUTH_COOKIE_OPTIONS,
      value: token,
    });

    return response;
  } catch (error: any) {
    console.error("Login API route error:", error);
    return NextResponse.json(
      { detail: error.message || "Internal server error during authentication." },
      { status: 500 }
    );
  }
}
