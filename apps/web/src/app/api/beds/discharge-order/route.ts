import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Initiate a discharge order.
 *
 * Freezes the stay billing meter, moves the bed to OCCUPIED_PENDING_DISCHARGE
 * and starts the two-hour clinical sign-off clock.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINICAL_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    const body = await req.json();
    const { bed_id, doctor_signoff = false } = body;

    if (!bed_id) {
      return apiError(400, "bed_id is required.", "invalid_input");
    }

    const bedQuery = await sql`
      SELECT * FROM clinic_beds
      WHERE id = ${String(bed_id)}
        AND clinic_slug = ${clinicSlug}
      LIMIT 1;
    `;
    if (bedQuery.length === 0) {
      return apiError(404, "Bed not found in your clinic.", "bed_not_found");
    }

    const bed = bedQuery[0];
    if (bed.status !== "OCCUPIED_ACTIVE" && bed.status !== "occupied") {
      return apiError(
        400,
        `Cannot order discharge: bed is ${bed.status || "unknown"}.`,
        "invalid_state"
      );
    }

    const now = new Date();

    const updated = await sql`
      UPDATE clinic_beds
      SET
        status = 'OCCUPIED_PENDING_DISCHARGE',
        discharge_ordered_at = ${now},
        doctor_discharge_signed = ${Boolean(doctor_signoff)}
      WHERE id = ${String(bed_id)}
        AND clinic_slug = ${clinicSlug}
      RETURNING *;
    `;

    if (bed.admission_id) {
      await sql`
        UPDATE bed_admissions
        SET
          status = 'pending_discharge',
          discharge_ordered_at = ${now},
          doctor_signoff = ${Boolean(doctor_signoff)}
        WHERE id = ${String(bed.admission_id)}
          AND clinic_slug = ${clinicSlug};
      `;
    }

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "bed.discharge.order",
      entity: "clinic_bed",
      entityId: String(bed.id),
      after: { doctor_signoff: Boolean(doctor_signoff) },
      request: req,
    });

    return NextResponse.json({
      success: true,
      message: `Discharge order registered for bed ${bed.bed_number}. Billing meter frozen; two-hour sign-off clock started.`,
      bed: updated[0],
    });
  } catch (error: any) {
    console.error("Discharge order error:", error);
    return apiError(500, "Failed to order discharge.", "internal_error");
  }
}
