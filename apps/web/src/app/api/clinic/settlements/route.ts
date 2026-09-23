import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinic_slug") || "derma-care-dehradun";

    const closings = await sql`
      SELECT * FROM clinic_eod_closings
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY closing_date DESC, closed_at DESC
      LIMIT 30;
    `;

    return NextResponse.json({
      settlements: closings
    });
  } catch (error: any) {
    console.error("GET /api/clinic/settlements error:", error);
    return NextResponse.json({ error: error.message || "Failed to fetch settlements" }, { status: 500 });
  }
}
