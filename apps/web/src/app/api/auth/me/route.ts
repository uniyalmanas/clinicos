import { NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { verifyAccessToken, extractAuthToken } from "@/lib/auth";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    let token = extractAuthToken(req);

    // Fallback to cookie
    if (!token) {
      const cookieHeader = req.headers.get("cookie") || "";
      const match = cookieHeader.match(/clinicos_token=([^;]+)/);
      if (match) {
        token = decodeURIComponent(match[1]);
      }
    }

    if (!token) {
      return NextResponse.json(
        { detail: "Authentication token missing." },
        { status: 401 }
      );
    }

    const payload = verifyAccessToken(token);
    if (!payload || !payload.sub) {
      return NextResponse.json(
        { detail: "Invalid or expired token." },
        { status: 401 }
      );
    }

    const users = await sql`
      SELECT id, phone, email, full_name, role, is_verified, is_active
      FROM user_accounts
      WHERE id = ${payload.sub} AND is_active = true
      LIMIT 1
    `;

    if (users.length === 0) {
      return NextResponse.json(
        { detail: "User account not found." },
        { status: 404 }
      );
    }

    const user = users[0];

    const memberships = await sql`
      SELECT cm.clinic_id, cm.role, c.name as clinic_name, c.slug as clinic_slug, c.subscription_status
      FROM clinic_memberships cm
      LEFT JOIN clinics c ON c.id = cm.clinic_id
      WHERE cm.user_id = ${user.id} AND cm.is_active = true
      LIMIT 1
    `;

    const membership = memberships[0] || null;

    return NextResponse.json({
      id: user.id,
      phone: user.phone,
      email: user.email,
      full_name: user.full_name,
      role: membership ? membership.role : user.role,
      is_verified: user.is_verified,
      clinic_id: membership ? membership.clinic_id : payload.clinic_id || null,
      clinic_name: membership ? membership.clinic_name : null,
      clinic_slug: membership ? membership.clinic_slug : null,
      subscription_status: membership ? membership.subscription_status : "active",
    });
  } catch (error: any) {
    console.error("Auth /me API route error:", error);
    return NextResponse.json(
      { detail: error.message || "Failed to retrieve user profile." },
      { status: 500 }
    );
  }
}
