import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Discharge Order Initiation Gate
 * Freezes stay billing meter, transitions status to OCCUPIED_PENDING_DISCHARGE,
 * and starts the 2-hour escalation clock for clinical sign-off.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bed_id, ordered_by = "Dr. Rahul Sharma", doctor_signoff = false } = body;

    if (!bed_id) {
      return NextResponse.json({ error: "bed_id is required" }, { status: 400 });
    }

    const bedQuery = await sql`SELECT * FROM clinic_beds WHERE id = ${bed_id} LIMIT 1;`;
    if (bedQuery.length === 0) {
      return NextResponse.json({ error: "Bed not found" }, { status: 404 });
    }

    const bed = bedQuery[0];
    if (bed.status !== "OCCUPIED_ACTIVE" && bed.status !== "occupied") {
      return NextResponse.json({
        error: `Cannot initiate discharge: Bed is in ${bed.status} state, not OCCUPIED_ACTIVE.`
      }, { status: 400 });
    }

    const now = new Date();

    const updated = await sql`
      UPDATE clinic_beds
      SET 
        status = 'OCCUPIED_PENDING_DISCHARGE',
        discharge_ordered_at = ${now},
        doctor_discharge_signed = ${Boolean(doctor_signoff)}
      WHERE id = ${bed_id}
      RETURNING *;
    `;

    // Update bed_admissions record
    if (bed.admission_id) {
      await sql`
        UPDATE bed_admissions
        SET 
          status = 'pending_discharge',
          discharge_ordered_at = ${now},
          doctor_signoff = ${Boolean(doctor_signoff)}
        WHERE id = ${bed.admission_id};
      `;
    }

    return NextResponse.json({
      success: true,
      message: `Discharge order registered for Bed ${bed.bed_number}. Billing meter frozen. 2-hour doctor sign-off timer started.`,
      bed: updated[0]
    });
  } catch (error: any) {
    console.error("Discharge order error:", error);
    return NextResponse.json({ error: error.message || "Failed to order discharge" }, { status: 500 });
  }
}
