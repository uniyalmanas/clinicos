import { sql } from "@/lib/db";

/**
 * Lab orders are not stored with a clinic_id. They inherit their tenant from
 * the appointment or prescription that generated them, so every lookup must
 * join through one of those rows.
 */
export async function findClinicLabOrder(
  clinicId: string,
  orderId: string
): Promise<any | null> {
  const rows = await sql`
    SELECT o.*
    FROM diagnostic_lab_orders o
    WHERE o.id::text = ${String(orderId)}
      AND (
        EXISTS (
          SELECT 1 FROM appointments a
          WHERE a.id::text = o.appointment_id::text
            AND a.clinic_id::text = ${String(clinicId)}
        )
        OR EXISTS (
          SELECT 1 FROM prescriptions p
          WHERE p.id::text = o.prescription_id::text
            AND p.clinic_id::text = ${String(clinicId)}
        )
      )
    LIMIT 1;
  `;
  return rows[0] || null;
}

/**
 * Validate that an appointment or prescription supplied as the origin of a new
 * lab order actually belongs to the caller's clinic. Returns the resolved
 * origin so the order can be linked and later scoped.
 */
export async function resolveLabOrderOrigin(
  clinicId: string,
  appointmentId?: string | null,
  prescriptionId?: string | null
): Promise<
  | { ok: true; appointmentId: string | null; prescriptionId: string | null }
  | { ok: false; error: string }
> {
  if (!appointmentId && !prescriptionId) {
    return {
      ok: false,
      error:
        "An appointment_id or prescription_id is required so the lab order belongs to a patient visit.",
    };
  }

  if (appointmentId) {
    const rows = await sql`
      SELECT id FROM appointments
      WHERE id::text = ${String(appointmentId)}
        AND clinic_id::text = ${String(clinicId)}
      LIMIT 1;
    `;
    if (rows.length === 0) {
      return { ok: false, error: "Appointment not found in your clinic." };
    }
  }

  if (prescriptionId) {
    const rows = await sql`
      SELECT id FROM prescriptions
      WHERE id::text = ${String(prescriptionId)}
        AND clinic_id::text = ${String(clinicId)}
      LIMIT 1;
    `;
    if (rows.length === 0) {
      return { ok: false, error: "Prescription not found in your clinic." };
    }
  }

  return {
    ok: true,
    appointmentId: appointmentId ? String(appointmentId) : null,
    prescriptionId: prescriptionId ? String(prescriptionId) : null,
  };
}
