import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Inpatient Bed Matrix & Wards State Machine API
 *
 * States: VACANT_CLEAN, VACANT_DIRTY, OCCUPIED_ACTIVE,
 * OCCUPIED_PENDING_DISCHARGE, MAINTENANCE.
 *
 * All data is scoped to the caller's clinic. Nothing is invented: a missing
 * admission id, vitals snapshot, or tariff is returned as null.
 */
export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;

    // 1. Fetch wards
    const wardsRows = await sql`
      SELECT * FROM clinic_wards
      WHERE clinic_slug = ${clinicSlug}
      ORDER BY name ASC;
    `;

    // 2. Fetch beds joined with ward
    const bedsRows = await sql`
      SELECT
        b.id, b.clinic_slug, b.ward_id, b.bed_number, b.status,
        b.admission_id, b.current_patient_name, b.current_patient_phone,
        b.assigned_doctor_name, b.admission_notes, b.admission_timestamp,
        b.discharge_ordered_at, b.doctor_discharge_signed,
        b.sanitization_hk_logged, b.sanitization_hk_at, b.sanitization_hk_by,
        b.sanitization_nurse_qa, b.sanitization_nurse_at, b.sanitization_nurse_by,
        b.active_vitals_protocol, b.last_vitals_logged_at, b.last_vitals_json,
        b.vitals_breach_alert, b.itemized_charges_total, b.created_at,
        b.breach_tier, b.breach_triggered_at, b.breach_acknowledged,
        b.breach_acknowledged_at, b.breach_acknowledged_by,
        b.breach_intervention_log, b.breach_escalation_history,
        w.name AS ward_name, w.ward_type, w.daily_rate, w.hourly_rate
      FROM clinic_beds b
      LEFT JOIN clinic_wards w ON w.id = b.ward_id
      WHERE b.clinic_slug = ${clinicSlug}
      ORDER BY b.bed_number ASC;
    `;

    const bedIds = bedsRows.map((b: any) => String(b.id));

    // 3. Ledger charges and care tasks, limited to this clinic's beds.
    const ledgerRows = bedIds.length
      ? await sql`
          SELECT bed_id, COALESCE(SUM(amount), 0) AS total_itemized_charges,
                 COUNT(*) AS charge_items_count
          FROM bed_billing_ledger
          WHERE bed_id = ANY(${bedIds})
          GROUP BY bed_id;
        `
      : [];
    const ledgerMap = new Map<string, { total: number; count: number }>();
    for (const row of ledgerRows) {
      ledgerMap.set(String(row.bed_id), {
        total: Number(row.total_itemized_charges || 0),
        count: Number(row.charge_items_count || 0),
      });
    }

    const tasksRows = bedIds.length
      ? await sql`
          SELECT bed_id, COUNT(*) AS total_tasks,
            COUNT(*) FILTER (WHERE status = 'pending') AS pending_tasks,
            COUNT(*) FILTER (WHERE status = 'completed') AS completed_tasks
          FROM bed_care_tasks
          WHERE bed_id = ANY(${bedIds})
          GROUP BY bed_id;
        `
      : [];
    const tasksMap = new Map<string, { total: number; pending: number; completed: number }>();
    for (const t of tasksRows) {
      tasksMap.set(String(t.bed_id), {
        total: Number(t.total_tasks || 0),
        pending: Number(t.pending_tasks || 0),
        completed: Number(t.completed_tasks || 0),
      });
    }

    const now = new Date();

    const beds = bedsRows.map((b: any) => {
      let stayHours = 0;
      let accruedBaseCharge = 0;
      const hourlyRate = b.hourly_rate == null ? null : Number(b.hourly_rate);
      const dailyRate = b.daily_rate == null ? null : Number(b.daily_rate);

      const isOccupied = b.status === "OCCUPIED_ACTIVE" || b.status === "occupied";
      const isPendingDischarge =
        b.status === "OCCUPIED_PENDING_DISCHARGE" || b.status === "discharge_pending";

      // Base tariff accrual, prorated around the 12:00 checkpoint.
      if (
        (isOccupied || isPendingDischarge) &&
        b.admission_timestamp &&
        (hourlyRate != null || dailyRate != null)
      ) {
        const admittedAt = new Date(b.admission_timestamp);
        const effectiveEnd =
          isPendingDischarge && b.discharge_ordered_at
            ? new Date(b.discharge_ordered_at)
            : now;

        const diffMs = Math.max(0, effectiveEnd.getTime() - admittedAt.getTime());
        stayHours = Math.round((diffMs / (1000 * 60 * 60)) * 10) / 10;

        if (stayHours <= 12 && hourlyRate != null) {
          accruedBaseCharge = Math.round(stayHours * hourlyRate);
        } else if (dailyRate != null) {
          const fullDays = Math.floor(stayHours / 24);
          const remainderHours = stayHours % 24;
          let dayCount = fullDays;
          if (remainderHours > 0) {
            dayCount += effectiveEnd.getHours() >= 12 ? 1 : 0.5;
          }
          accruedBaseCharge = Math.round(dayCount * dailyRate);
        }
      }

      let isEscalated = false;
      let escalationMinutes = 0;
      if (isPendingDischarge && b.discharge_ordered_at && !b.doctor_discharge_signed) {
        const orderedAt = new Date(b.discharge_ordered_at);
        const mins = Math.round((now.getTime() - orderedAt.getTime()) / (1000 * 60));
        if (mins > 120) {
          isEscalated = true;
          escalationMinutes = mins;
        }
      }

      const ledger = ledgerMap.get(String(b.id)) || { total: 0, count: 0 };
      const tasks = tasksMap.get(String(b.id)) || { total: 0, pending: 0, completed: 0 };

      let normalizedStatus:
        | "VACANT_CLEAN"
        | "VACANT_DIRTY"
        | "OCCUPIED_ACTIVE"
        | "OCCUPIED_PENDING_DISCHARGE"
        | "MAINTENANCE" = "VACANT_CLEAN";
      const raw = String(b.status || "").toUpperCase();
      if (raw === "OCCUPIED_ACTIVE" || raw === "OCCUPIED") normalizedStatus = "OCCUPIED_ACTIVE";
      else if (raw === "OCCUPIED_PENDING_DISCHARGE" || raw === "DISCHARGE_PENDING")
        normalizedStatus = "OCCUPIED_PENDING_DISCHARGE";
      else if (raw === "VACANT_DIRTY") normalizedStatus = "VACANT_DIRTY";
      else if (raw === "MAINTENANCE") normalizedStatus = "MAINTENANCE";
      else normalizedStatus = "VACANT_CLEAN";

      return {
        id: b.id,
        clinic_slug: b.clinic_slug,
        ward_id: b.ward_id,
        ward_name: b.ward_name || null,
        ward_type: b.ward_type || null,
        bed_number: b.bed_number,
        status: normalizedStatus,
        admission_id: b.admission_id || null,
        current_patient_name: b.current_patient_name || null,
        current_patient_phone: b.current_patient_phone || null,
        assigned_doctor_name: b.assigned_doctor_name || null,
        admission_notes: b.admission_notes || null,
        admission_timestamp: b.admission_timestamp || null,
        discharge_ordered_at: b.discharge_ordered_at || null,
        doctor_discharge_signed: Boolean(b.doctor_discharge_signed),
        is_escalated: isEscalated,
        escalation_minutes: escalationMinutes,
        daily_rate: dailyRate,
        hourly_rate: hourlyRate,
        stay_hours: stayHours,
        accrued_base_charge: accruedBaseCharge,
        itemized_ledger_charge: ledger.total,
        accrued_charge: accruedBaseCharge + ledger.total,
        sanitization_hk_logged: Boolean(b.sanitization_hk_logged),
        sanitization_hk_at: b.sanitization_hk_at,
        sanitization_hk_by: b.sanitization_hk_by,
        sanitization_nurse_qa: Boolean(b.sanitization_nurse_qa),
        sanitization_nurse_at: b.sanitization_nurse_at,
        sanitization_nurse_by: b.sanitization_nurse_by,
        active_vitals_protocol: b.active_vitals_protocol || null,
        last_vitals_logged_at: b.last_vitals_logged_at,
        last_vitals: b.last_vitals_json
          ? typeof b.last_vitals_json === "string"
            ? JSON.parse(b.last_vitals_json)
            : b.last_vitals_json
          : null,
        vitals_breach_alert: Boolean(b.vitals_breach_alert),
        breach_tier: b.breach_tier == null ? null : Number(b.breach_tier),
        breach_triggered_at: b.breach_triggered_at,
        breach_acknowledged: Boolean(b.breach_acknowledged),
        breach_acknowledged_at: b.breach_acknowledged_at,
        breach_acknowledged_by: b.breach_acknowledged_by,
        breach_intervention_log: b.breach_intervention_log,
        breach_escalation_history: b.breach_escalation_history
          ? typeof b.breach_escalation_history === "string"
            ? JSON.parse(b.breach_escalation_history)
            : b.breach_escalation_history
          : [],
        pending_care_tasks_count: tasks.pending,
        completed_care_tasks_count: tasks.completed,
      };
    });

    const wards = wardsRows.map((w: any) => {
      const wardBeds = beds.filter((b: any) => String(b.ward_id) === String(w.id));
      return {
        id: w.id,
        name: w.name,
        ward_type: w.ward_type,
        daily_rate: w.daily_rate == null ? null : Number(w.daily_rate),
        hourly_rate: w.hourly_rate == null ? null : Number(w.hourly_rate),
        total_beds: wardBeds.length,
        occupied_beds: wardBeds.filter(
          (b: any) =>
            b.status === "OCCUPIED_ACTIVE" || b.status === "OCCUPIED_PENDING_DISCHARGE"
        ).length,
      };
    });

    const totalBeds = beds.length;
    const occupiedActiveCount = beds.filter((b: any) => b.status === "OCCUPIED_ACTIVE").length;
    const pendingDischargeCount = beds.filter(
      (b: any) => b.status === "OCCUPIED_PENDING_DISCHARGE"
    ).length;
    const vacantCleanCount = beds.filter((b: any) => b.status === "VACANT_CLEAN").length;
    const vacantDirtyCount = beds.filter((b: any) => b.status === "VACANT_DIRTY").length;
    const maintenanceCount = beds.filter((b: any) => b.status === "MAINTENANCE").length;
    const activeOccupied = occupiedActiveCount + pendingDischargeCount;
    const occupancyRate =
      totalBeds > 0 ? parseFloat(((activeOccupied / totalBeds) * 100).toFixed(1)) : 0;
    const estDailyRev = beds
      .filter((b: any) => b.status === "OCCUPIED_ACTIVE")
      .reduce((acc: number, curr: any) => acc + Number(curr.daily_rate || 0), 0);

    return NextResponse.json({
      beds,
      wards,
      metrics: {
        total_beds: totalBeds,
        occupied_count: activeOccupied,
        occupied_active_count: occupiedActiveCount,
        discharge_pending_count: pendingDischargeCount,
        vacant_clean_count: vacantCleanCount,
        vacant_dirty_count: vacantDirtyCount,
        vacant_count: vacantCleanCount + vacantDirtyCount,
        maintenance_count: maintenanceCount,
        occupancy_rate_percent: occupancyRate,
        estimated_daily_revenue: estDailyRev,
      },
    });
  } catch (error: any) {
    console.error("GET /api/beds error:", error);
    return apiError(500, "Failed to load inpatient beds.", "internal_error");
  }
}
