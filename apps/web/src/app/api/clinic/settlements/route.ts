import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * End-of-day settlement history for the caller's clinic. The clinic is always
 * taken from the session — a clinic_slug query parameter may only confirm it.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const { searchParams } = new URL(req.url);
    const requestedSlug = searchParams.get("clinic_slug");
    if (requestedSlug && requestedSlug !== clinicSlug) {
      return apiError(403, "Clinic tenant mismatch.", "tenant_mismatch");
    }

    const closings = await sql`
      SELECT * FROM clinic_eod_closings
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY closing_date DESC, closed_at DESC
      LIMIT 30;
    `;

    return NextResponse.json({ settlements: closings });
  } catch (error: any) {
    console.error("GET /api/clinic/settlements error:", error);
    return apiError(500, "Failed to fetch settlements.", "internal_error");
  }
}
