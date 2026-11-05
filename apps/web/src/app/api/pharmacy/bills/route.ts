import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;

    const bills = await sql`
      SELECT * FROM pharmacy_dispenses
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY created_at DESC
      LIMIT 50;
    `;

    const parsedBills = bills.map((b: any) => ({
      ...b,
      items: typeof b.items === "string" ? JSON.parse(b.items) : b.items || [],
      subtotal: Number(b.subtotal || 0),
      discount: Number(b.discount || 0),
      gst_amount: Number(b.gst_amount || 0),
      total_amount: Number(b.total_amount || 0),
    }));

    return NextResponse.json({ bills: parsedBills });
  } catch (error: any) {
    console.error("GET /api/pharmacy/bills error:", error);
    return apiError(500, "Failed to load past bills.", "internal_error");
  }
}
