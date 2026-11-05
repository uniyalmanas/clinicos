import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Schedule H1 register (Drugs & Cosmetics Rules). Scoped to the caller's
 * clinic — the register contains patient names and prescriber details.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;

    const logs = await sql`
      SELECT
        id, bill_number, clinic_slug, patient_name, patient_phone,
        patient_address, doctor_name, doctor_reg_number, drug_name,
        batch_number, quantity, pharmacist_name, dispensed_at
      FROM pharmacy_schedule_h1_logs
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY dispensed_at DESC
      LIMIT 100;
    `;

    return NextResponse.json({
      success: true,
      logs,
      total_recorded: logs.length,
    });
  } catch (error: any) {
    console.error("GET /api/pharmacy/schedule-h1 error:", error);
    return apiError(500, "Failed to load Schedule H1 logs.", "internal_error");
  }
}
