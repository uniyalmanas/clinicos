import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

/**
 * Inpatient discharge and billing settlement.
 *
 * Checklist gates must be satisfied: doctor sign-off, pharmacy reconciliation,
 * and billing settlement. Once discharged the bed moves to VACANT_DIRTY and
 * cannot be reused until the dual sanitization workflow completes.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINICAL_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    const body = await req.json();
    const {
      bed_id,
      payment_mode = null,
      doctor_signoff = false,
      pharmacy_reconciled = false,
      billing_settled = false,
      transport_ready = false,
    } = body;

    if (!bed_id) {
      return apiError(400, "bed_id is required.", "invalid_input");
    }

    const bedQuery = await sql`
      SELECT b.*, w.name AS ward_name, w.hourly_rate, w.daily_rate
      FROM clinic_beds b
      LEFT JOIN clinic_wards w ON w.id = b.ward_id
      WHERE b.id = ${String(bed_id)}
        AND b.clinic_slug = ${clinicSlug}
      LIMIT 1;
    `;
    if (bedQuery.length === 0) {
      return apiError(404, "Bed not found in your clinic.", "bed_not_found");
    }

    const bed = bedQuery[0];

    if (!doctor_signoff) {
      return apiError(
        422,
        "Doctor clinical sign-off is required before discharge.",
        "doctor_signoff_pending"
      );
    }
    if (!pharmacy_reconciled) {
      return apiError(
        422,
        "Pharmacy medication reconciliation is required before discharge.",
        "pharmacy_not_reconciled"
      );
    }
    if (!billing_settled) {
      return apiError(
        422,
        "The billing ledger must be settled before the patient leaves.",
        "billing_unsettled"
      );
    }

    if (!bed.admission_timestamp) {
      return apiError(
        409,
        "This bed has no active admission to discharge.",
        "no_active_admission"
      );
    }

    const admittedAt = new Date(bed.admission_timestamp);
    const now = new Date();
    const diffHours = Math.max(
      0.5,
      Math.round(((now.getTime() - admittedAt.getTime()) / (1000 * 60 * 60)) * 10) / 10
    );

    const hourlyRate = bed.hourly_rate == null ? null : Number(bed.hourly_rate);
    const dailyRate = bed.daily_rate == null ? null : Number(bed.daily_rate);

    let roomCharges = 0;
    let billingBasis = "";
    let prorationType = "standard";

    if (diffHours <= 12 && hourlyRate != null) {
      roomCharges = Math.round(diffHours * hourlyRate);
      billingBasis = `${diffHours}h @ ${hourlyRate}/h`;
      prorationType = "hourly";
    } else {
      if (dailyRate == null) {
        return apiError(
          422,
          "Ward daily tariff is not configured, so the stay cannot be billed.",
          "tariff_not_configured"
        );
      }
      const fullDays = Math.floor(diffHours / 24);
      const remainderHours = diffHours % 24;
      const dischargeHour = now.getHours();

      let effectiveDays = fullDays;
      if (remainderHours > 0) {
        if (dischargeHour < 12) {
          effectiveDays += 0.5;
          prorationType = "half_day_proration";
          billingBasis = `${fullDays} full day(s) + 0.5 half-day (before 12:00) @ ${dailyRate}/day`;
        } else {
          effectiveDays += 1;
          prorationType = "full_day_proration";
          billingBasis = `${fullDays + 1} day(s) (after 12:00 cutoff) @ ${dailyRate}/day`;
        }
      } else {
        effectiveDays = Math.max(1, fullDays);
        billingBasis = `${effectiveDays} day(s) @ ${dailyRate}/day`;
      }

      roomCharges = Math.round(effectiveDays * dailyRate);
    }

    const ledgerRows = await sql`
      SELECT * FROM bed_billing_ledger
      WHERE bed_id = ${String(bed.id)}
        OR (admission_id = ${bed.admission_id} AND ${bed.admission_id} IS NOT NULL)
      ORDER BY posted_at ASC;
    `;

    const consumableCharges = ledgerRows
      .filter((r: any) => r.charge_type !== "base_tariff")
      .reduce((acc: number, curr: any) => acc + Number(curr.amount || 0), 0);

    const totalInvoiceAmount = roomCharges + consumableCharges;
    const receiptNumber = `INP-BILL-${bed.bed_number}-${Math.floor(100000 + Math.random() * 900000)}`;

    await sql`
      UPDATE clinic_beds
      SET
        status = 'VACANT_DIRTY',
        current_patient_name = NULL,
        current_patient_phone = NULL,
        assigned_doctor_name = NULL,
        admission_notes = NULL,
        admission_timestamp = NULL,
        admission_id = NULL,
        discharge_ordered_at = NULL,
        doctor_discharge_signed = false,
        sanitization_hk_logged = false,
        sanitization_hk_at = NULL,
        sanitization_hk_by = NULL,
        sanitization_nurse_qa = false,
        sanitization_nurse_at = NULL,
        sanitization_nurse_by = NULL,
        vitals_breach_alert = false,
        itemized_charges_total = 0
      WHERE id = ${String(bed_id)}
        AND clinic_slug = ${clinicSlug};
    `;

    if (bed.admission_id) {
      await sql`
        UPDATE bed_admissions
        SET
          status = 'discharged',
          discharged_at = ${now},
          proration_type = ${prorationType},
          room_charge = ${roomCharges},
          consumables_charge = ${consumableCharges},
          total_bill = ${totalInvoiceAmount},
          discharge_checklist = ${JSON.stringify({
            doctor_signoff: true,
            pharmacy_reconciled: true,
            billing_settled: true,
            transport_ready: Boolean(transport_ready),
          })}
        WHERE id = ${String(bed.admission_id)}
          AND clinic_slug = ${clinicSlug};
      `;
    }

    await logAudit({
      actorId: auth.auth.user.id,
      actorRole: auth.auth.role,
      clinicId,
      action: "bed.discharge",
      entity: "bed_admission",
      entityId: bed.admission_id ? String(bed.admission_id) : String(bed.id),
      after: {
        room_charges: roomCharges,
        consumables_charge: consumableCharges,
        total_bill: totalInvoiceAmount,
      },
      request: req,
    });

    return NextResponse.json({
      status: "success",
      message: `Patient discharged from bed ${bed.bed_number}. Bed moved to VACANT_DIRTY pending sanitization.`,
      invoice: {
        receipt_number: receiptNumber,
        admission_id: bed.admission_id,
        patient_name: bed.current_patient_name,
        patient_phone: bed.current_patient_phone,
        assigned_doctor: bed.assigned_doctor_name,
        bed_number: bed.bed_number,
        ward_name: bed.ward_name || null,
        admission_time: admittedAt.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        discharge_time: now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
        }),
        total_stay_hours: diffHours,
        billing_basis: billingBasis,
        room_charges: roomCharges,
        consumables_charges: consumableCharges,
        itemized_ledger_items: ledgerRows.map((r: any) => ({
          description: r.description,
          amount: Number(r.amount),
          type: r.charge_type,
          time: r.posted_at,
        })),
        total_amount: totalInvoiceAmount,
        payment_mode,
        payment_status: "settled",
        next_bed_state: "VACANT_DIRTY",
      },
    });
  } catch (error: any) {
    console.error("POST /api/beds/discharge error:", error);
    return apiError(500, "Failed to discharge patient.", "internal_error");
  }
}
