import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { hashPassword, signAccessToken } from "@/lib/auth";
import crypto from "crypto";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { phone, password, full_name, email, role = "patient", clinic_id } = body;

    if (!phone || !password || !full_name) {
      return NextResponse.json(
        { detail: "Phone number, full name, and password are required." },
        { status: 400 }
      );
    }

    const cleanPhone = phone.trim();

    // Check if phone already registered
    const existing = await sql`
      SELECT id FROM user_accounts WHERE phone = ${cleanPhone} LIMIT 1
    `;

    if (existing.length > 0) {
      return NextResponse.json(
        { detail: "A user with this phone number already exists." },
        { status: 400 }
      );
    }

    const userId = crypto.randomUUID();
    const passwordHash = await hashPassword(password);

    await sql`
      INSERT INTO user_accounts (id, phone, email, password_hash, full_name, role, is_verified, is_active, created_at)
      VALUES (${userId}, ${cleanPhone}, ${email || null}, ${passwordHash}, ${full_name.trim()}, ${role}, false, true, NOW())
    `;

    if (clinic_id) {
      const membershipId = crypto.randomUUID();
      await sql`
        INSERT INTO clinic_memberships (id, user_id, clinic_id, role, is_active, created_at)
        VALUES (${membershipId}, ${userId}, ${clinic_id}, ${role}, true, NOW())
      `;
    }

    const token = signAccessToken({
      sub: userId,
      role: role,
      clinic_id: clinic_id || null,
      phone: cleanPhone,
      full_name: full_name.trim(),
    });

    const response = NextResponse.json({
      access_token: token,
      token_type: "bearer",
      role: role,
      user_id: userId,
      full_name: full_name.trim(),
      phone: cleanPhone,
      clinic_id: clinic_id || null,
    });

    response.cookies.set({
      name: "clinicos_token",
      value: token,
      httpOnly: false,
      path: "/",
      maxAge: 60 * 60 * 24 * 7,
      sameSite: "lax",
    });

    return response;
  } catch (error: any) {
    console.error("Register API route error:", error);
    return NextResponse.json(
      { detail: error.message || "Registration failed." },
      { status: 500 }
    );
  }
}
