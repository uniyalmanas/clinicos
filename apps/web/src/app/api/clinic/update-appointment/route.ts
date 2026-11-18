import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { sseBroker } from "@/lib/sse-broker";

export const dynamic = "force-dynamic";

/**
 * Queue-state changes that are not "call next" or "complete".
 *
 * POST /api/clinic/update-appointment
 *   { appointment_number, status: "waiting" | "no_show" }
 *   { appointment_number, target_doctor_slug }
 *
 * Both actions used to exist only in React state on the reception screen: the
 * card changed, then the 15-second poll silently reverted it. Persisting them
 * here keeps reception, the doctor cockpit and the pharmacy on one truth.
 *
 * A transfer re-allocates a token for the target doctor, because token numbers
 * are per doctor per day — keeping the old token would produce two patients
 * with the same number in the destination chamber.
 */

const ALLOWED_STATUS = new Set(["waiting", "no_show"]);

export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const clinicSlug = auth.auth.clinic!.slug;

    const body = await req.json();
    const appointmentNumber = String(body?.appointment_number || "").trim();
    const status = body?.status ? String(body.status) : null;
    const targetDoctorSlug = body?.target_doctor_slug
      ? String(body.target_doctor_slug)
      : null;

    if (!appointmentNumber) {
      return apiError(400, "appointment_number is required.", "invalid_input");
    }
    if (!status && !targetDoctorSlug) {
      return apiError(
        400,
        "Provide either a status or a target_doctor_slug.",
        "invalid_input"
      );
    }
    if (status && !ALLOWED_STATUS.has(status)) {
      return apiError(
        400,
        `status must be one of: ${Array.from(ALLOWED_STATUS).join(", ")}.`,
        "invalid_status"
      );
    }

    const rows = await sql`
      SELECT * FROM appointments
      WHERE appointment_number = ${appointmentNumber}
        AND clinic_id::text = ${clinicId}::text
      LIMIT 1;
    `;
    if (rows.length === 0) {
      return apiError(404, "Appointment not found in your clinic.", "appointment_not_found");
    }
    const appointment = rows[0];

    let updated: any[] = [];

    if (targetDoctorSlug) {
      if (targetDoctorSlug === appointment.doctor_slug) {
        return NextResponse.json({ status: "success", appointment });
      }

      const doctorRows = await sql`
        SELECT id, slug, full_name
        FROM doctors
        WHERE slug = ${targetDoctorSlug}
          AND (clinic_id::text = ${clinicId}::text OR clinic_slug = ${clinicSlug})
        LIMIT 1;
      `;
      if (doctorRows.length === 0) {
        return apiError(404, "Target doctor not found in your clinic.", "doctor_not_found");
      }
      const targetDoctor = doctorRows[0];

      updated = await sql.begin(async (tx) => {
        await tx`SELECT pg_advisory_xact_lock(hashtext(${clinicId}::text || ':' || ${targetDoctor.slug} || ':' || ${appointment.appointment_date}::text));`;
        const tokenRes = await tx`
          SELECT COALESCE(MAX(token_number), 0) + 1 AS next_token
          FROM appointments
          WHERE clinic_id::text = ${clinicId}::text
            AND doctor_slug = ${targetDoctor.slug}
            AND appointment_date = ${appointment.appointment_date};
        `;
        const nextToken = Number(tokenRes[0]?.next_token || 1);

        return await tx`
          UPDATE appointments
          SET doctor_slug = ${targetDoctor.slug},
              doctor_id = ${targetDoctor.id},
              doctor_name = ${targetDoctor.full_name},
              token_number = ${nextToken},
              updated_at = NOW()
          WHERE id::text = ${appointment.id}::text
          RETURNING *;
        `;
      });
    } else {
      updated = await sql`
        UPDATE appointments
        SET status = ${status as string},
            updated_at = NOW()
        WHERE id::text = ${appointment.id}::text
        RETURNING *;
      `;
    }

    if (updated.length === 0) {
      return apiError(404, "Appointment not found in your clinic.", "appointment_not_found");
    }

    sseBroker.broadcast(
      "queue_updated",
      {
        appointment_number: updated[0].appointment_number,
        token_number: updated[0].token_number,
        doctor_slug: updated[0].doctor_slug,
      },
      clinicId
    );

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: targetDoctorSlug ? "appointment.transfer" : "appointment.status",
      entity: "appointment",
      entityId: String(appointment.id),
      before: { status: appointment.status, doctor_slug: appointment.doctor_slug },
      after: {
        status: updated[0].status,
        doctor_slug: updated[0].doctor_slug,
        token_number: updated[0].token_number,
      },
      request: req,
    });

    return NextResponse.json({ status: "success", appointment: updated[0] });
  } catch (error: any) {
    console.error("POST /api/clinic/update-appointment error:", error);
    return apiError(500, "Failed to update the appointment.", "internal_error");
  }
}
