import { NextRequest, NextResponse } from "next/server";
import { guard } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, {
      allowPlatformScope: true,
      requireClinic: false,
    });

    if (!auth.ok) {
      return NextResponse.json(
        { detail: "Authentication token missing or invalid." },
        { status: 401 }
      );
    }

    const { user, role, clinic, membership } = auth.auth;

    return NextResponse.json({
      id: user.id,
      phone: user.phone,
      email: user.email,
      full_name: user.full_name,
      role: role,
      is_verified: true,
      clinic_id: clinic?.id || (membership ? membership.clinic_id : null),
      clinic_name: clinic?.name || null,
      clinic_slug: clinic?.slug || null,
      subscription_status: clinic?.subscription_status || "active",
    });
  } catch (error: any) {
    console.error("Auth /me API route error:", error);
    return NextResponse.json(
      { detail: error.message || "Failed to retrieve user profile." },
      { status: 500 }
    );
  }
}
