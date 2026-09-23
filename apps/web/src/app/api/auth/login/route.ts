import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyPassword, signAccessToken } from "@/lib/auth";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, password } = body;

    if (!phone || !password) {
      return NextResponse.json(
        { detail: "Phone number and password are required." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();

    // Query user account
    const users = await sql`
      SELECT id, phone, email, password_hash, full_name, role, is_verified, is_active
      FROM user_accounts
      WHERE phone = ${cleanPhone} AND is_active = true
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { detail: "Invalid phone number or password." },
        { status: 401 }
      );
    }

    const user = users[0];
    const passwordValid = await verifyPassword(password, user.password_hash);

    if (!passwordValid) {
      return NextResponse.json(
        { detail: "Invalid phone number or password." },
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

    const activeRole = memberships.length > 0 ? memberships[0].role : user.role;
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

    // Also set standard HttpOnly cookie for seamless SSR session
    response.cookies.set({
      name: "clinicos_token",
      value: token,
      httpOnly: false, // Accessible to client-side localStorage sync
      path: "/",
      maxAge: 60 * 60 * 24 * 7, // 7 days
      sameSite: "lax",
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
