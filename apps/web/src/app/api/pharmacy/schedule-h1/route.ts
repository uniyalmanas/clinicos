import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Schedule H1 Tracking (Mandatory Indian Drug Law - Drugs & Cosmetics Rules)
 * Fetches compliance register for controlled narcotics, antibiotics, and habit-forming drugs.
 */
export async function GET(req: NextRequest) {
  try {
    const logs = await sql`
      SELECT 
        id, bill_number, clinic_slug, patient_name, patient_phone,
        patient_address, doctor_name, doctor_reg_number, drug_name,
        batch_number, quantity, pharmacist_name, dispensed_at
      FROM pharmacy_schedule_h1_logs
      ORDER BY dispensed_at DESC
      LIMIT 100;
    `;

    return NextResponse.json({
      success: true,
      logs,
      total_recorded: logs.length
    });
  } catch (error: any) {
    console.error("Schedule H1 GET error:", error);
    return NextResponse.json({ error: error.message || "Failed to load Schedule H1 logs" }, { status: 500 });
  }
}
