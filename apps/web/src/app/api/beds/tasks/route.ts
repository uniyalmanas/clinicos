import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINICAL_ROLES, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";

export const dynamic = "force-dynamic";

const clinicBedIds = async (clinicSlug: string) => {
  const rows = await sql`SELECT id FROM clinic_beds WHERE clinic_slug = ${clinicSlug};`;
  return rows.map((r: any) => String(r.id));
};

/**
 * Inpatient clinical tasks, vitals protocol and shift handover.
 *
 * Every read and write is restricted to the caller's clinic. Vitals must be
 * supplied by the nurse recording them — this route never assumes a default.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINICAL_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;
    const actorName = auth.auth.user.full_name;

    const body = await req.json();
    const {
      action = "log_vitals",
      bed_id,
      task_id,
      bp,
      pulse,
      spo2,
      temp,
      pain_scale = null,
      nurse_name,
      acknowledged_by,
      intervention_log,
      rechecked_vitals,
      charge_description,
      charge_amount,
      charge_type = "consumable",
      confirm_duplicate = false,
      task_type,
      task_description,
      due_time = null,
      outgoing_nurse_name,
      incoming_nurse_name,
      shift_name = null,
      ward_id = null,
      handover_notes,
      incoming_esign,
    } = body;

    const now = new Date();
    const nurseName = String(nurse_name || actorName);

    // ── Shift handover ──────────────────────────────────────────────
    if (action === "shift_handover") {
      if (!incoming_nurse_name || !incoming_esign) {
        return apiError(
          400,
          "incoming_nurse_name and incoming_esign are required for handover.",
          "invalid_input"
        );
      }

      const bedIds = await clinicBedIds(clinicSlug);

      const pendingTasks = bedIds.length
        ? await sql`
            SELECT t.*, b.bed_number
            FROM bed_care_tasks t
            JOIN clinic_beds b ON b.id = t.bed_id
            WHERE t.status = 'pending'
              AND b.clinic_slug = ${clinicSlug}
            ORDER BY t.created_at ASC;
          `
        : [];

      const activeBreachBeds = await sql`
        SELECT id, bed_number, vitals_breach_alert, breach_tier, last_vitals_json
        FROM clinic_beds
        WHERE vitals_breach_alert = true
          AND clinic_slug = ${clinicSlug};
      `;

      if (bedIds.length > 0 && pendingTasks.length > 0) {
        await sql`
          UPDATE bed_care_tasks
          SET
            assigned_to = ${String(incoming_nurse_name)},
            shift_carryover_count = COALESCE(shift_carryover_count, 0) + 1,
            carried_over_from_shift = ${shift_name},
            carried_over_to_nurse = ${String(incoming_nurse_name)}
          WHERE status = 'pending'
            AND bed_id = ANY(${bedIds});
        `;
      }

      const handoverId = randomUUID();
      const handoverNotes =
        handover_notes ||
        `${pendingTasks.length} pending task(s) and ${activeBreachBeds.length} breach alert(s) carried over.`;

      await sql`
        INSERT INTO bed_shift_handovers (
          id, clinic_slug, outgoing_nurse_name, incoming_nurse_name, shift_name,
          ward_id, carried_over_tasks_count, active_breach_alerts_count,
          handover_notes, incoming_esign, handed_over_at, tasks_snapshot
        ) VALUES (
          ${handoverId},
          ${clinicSlug},
          ${String(outgoing_nurse_name || actorName)},
          ${String(incoming_nurse_name)},
          ${shift_name},
          ${ward_id},
          ${pendingTasks.length},
          ${activeBreachBeds.length},
          ${handoverNotes},
          ${String(incoming_esign)},
          ${now},
          ${JSON.stringify(pendingTasks)}::jsonb
        );
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "bed.shift.handover",
        entity: "bed_shift_handover",
        entityId: handoverId,
        after: {
          incoming_nurse_name,
          carried_over_tasks: pendingTasks.length,
        },
        request: req,
      });

      return NextResponse.json({
        success: true,
        handover_id: handoverId,
        carried_over_tasks_count: pendingTasks.length,
        active_breach_alerts_count: activeBreachBeds.length,
        message: `Shift handover complete. ${pendingTasks.length} pending task(s) carried over to ${incoming_nurse_name}.`,
        snapshot: pendingTasks,
      });
    }

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

    // ── Vitals ──────────────────────────────────────────────────────
    if (action === "log_vitals") {
      if (
        bp == null ||
        pulse == null ||
        spo2 == null ||
        temp == null ||
        String(bp).trim() === ""
      ) {
        return apiError(
          400,
          "bp, pulse, spo2 and temp are required to log vitals.",
          "vitals_required"
        );
      }

      const parsedPulse = Number(pulse);
      const parsedSpo2 = Number(spo2);
      const parsedTemp = Number(temp);
      if (
        !Number.isFinite(parsedPulse) ||
        !Number.isFinite(parsedSpo2) ||
        !Number.isFinite(parsedTemp)
      ) {
        return apiError(400, "Vital signs must be numeric.", "invalid_vitals");
      }

      const bpParts = String(bp).split("/");
      const sbp = Number(bpParts[0]);
      const dbp = Number(bpParts[1]);
      if (!Number.isFinite(sbp) || !Number.isFinite(dbp)) {
        return apiError(400, "bp must be written as systolic/diastolic.", "invalid_bp");
      }

      let breach = false;
      const breachReasons: string[] = [];

      if (parsedSpo2 < 92) {
        breach = true;
        breachReasons.push(`SpO2 ${parsedSpo2}% (< 92%)`);
      }
      if (sbp > 160 || dbp > 100) {
        breach = true;
        breachReasons.push(`BP ${bp} (> 160/100)`);
      }
      if (parsedTemp > 101.0) {
        breach = true;
        breachReasons.push(`Temperature ${parsedTemp}F (> 101.0F)`);
      }

      const vitalsData = {
        bp,
        pulse: parsedPulse,
        spo2: parsedSpo2,
        temp: parsedTemp,
        pain_scale: pain_scale == null ? null : Number(pain_scale),
        recorded_at: now.toISOString(),
        nurse: nurseName,
        breach,
        breachReasons,
      };

      if (breach) {
        const escalationHistory = [
          {
            tier: 1,
            channel: "Nurse PWA alert",
            target: nurseName,
            dispatched_at: now.toISOString(),
            status: "active_dispatched",
            reasons: breachReasons,
          },
        ];

        await sql`
          UPDATE clinic_beds
          SET
            last_vitals_logged_at = ${now},
            last_vitals_json = ${JSON.stringify(vitalsData)},
            vitals_breach_alert = true,
            breach_tier = 1,
            breach_triggered_at = ${now},
            breach_acknowledged = false,
            breach_acknowledged_at = NULL,
            breach_acknowledged_by = NULL,
            breach_intervention_log = NULL,
            breach_escalation_history = ${JSON.stringify(escalationHistory)}::jsonb
          WHERE id = ${String(bed_id)}
            AND clinic_slug = ${clinicSlug};
        `;

        await logAudit({
          actorId: auth.auth.user.id,
          actorRole: auth.auth.role,
          clinicId,
          action: "bed.vitals.breach",
          entity: "clinic_bed",
          entityId: String(bed.id),
          after: vitalsData,
          request: req,
        });

        return NextResponse.json({
          success: true,
          vitals: vitalsData,
          breach_alert: true,
          breach_tier: 1,
          message: `Critical breach on bed ${bed.bed_number}: ${breachReasons.join("; ")}.`,
        });
      }

      await sql`
        UPDATE clinic_beds
        SET
          last_vitals_logged_at = ${now},
          last_vitals_json = ${JSON.stringify(vitalsData)},
          vitals_breach_alert = false,
          breach_acknowledged = true,
          breach_acknowledged_at = ${now},
          breach_acknowledged_by = ${nurseName}
        WHERE id = ${String(bed_id)}
          AND clinic_slug = ${clinicSlug};
      `;

      return NextResponse.json({
        success: true,
        vitals: vitalsData,
        breach_alert: false,
        message: `Vitals recorded for bed ${bed.bed_number}.`,
      });
    }

    // ── Acknowledge breach ──────────────────────────────────────────
    if (action === "acknowledge_breach") {
      const ackBy = String(acknowledged_by || actorName);
      const logText = String(intervention_log || "").trim();
      if (logText.length < 5) {
        return apiError(
          400,
          "An intervention log of at least 5 characters is required.",
          "intervention_required"
        );
      }

      let currentHistory: any[] = [];
      try {
        currentHistory = Array.isArray(bed.breach_escalation_history)
          ? bed.breach_escalation_history
          : JSON.parse(bed.breach_escalation_history || "[]");
      } catch {
        currentHistory = [];
      }

      currentHistory.push({
        action: "acknowledged_and_cleared",
        channel: "bedside_intervention",
        acknowledged_by: ackBy,
        intervention_log: logText,
        cleared_at: now.toISOString(),
      });

      let updatedVitals = bed.last_vitals_json;
      if (rechecked_vitals) {
        updatedVitals = {
          ...(typeof bed.last_vitals_json === "string"
            ? JSON.parse(bed.last_vitals_json)
            : bed.last_vitals_json),
          ...rechecked_vitals,
          rechecked_at: now.toISOString(),
          rechecked_by: ackBy,
          breach: false,
        };
      }

      await sql`
        UPDATE clinic_beds
        SET
          vitals_breach_alert = false,
          breach_acknowledged = true,
          breach_acknowledged_at = ${now},
          breach_acknowledged_by = ${ackBy},
          breach_intervention_log = ${logText},
          breach_escalation_history = ${JSON.stringify(currentHistory)}::jsonb,
          last_vitals_json = ${JSON.stringify(updatedVitals)}
        WHERE id = ${String(bed_id)}
          AND clinic_slug = ${clinicSlug};
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "bed.breach.acknowledge",
        entity: "clinic_bed",
        entityId: String(bed.id),
        after: { acknowledged_by: ackBy, intervention_log: logText },
        request: req,
      });

      return NextResponse.json({
        success: true,
        message: `Breach on bed ${bed.bed_number} acknowledged by ${ackBy}.`,
        bed_number: bed.bed_number,
        intervention_logged: logText,
      });
    }

    // ── Escalate breach ─────────────────────────────────────────────
    if (action === "escalate_breach") {
      let currentHistory: any[] = [];
      try {
        currentHistory = Array.isArray(bed.breach_escalation_history)
          ? bed.breach_escalation_history
          : JSON.parse(bed.breach_escalation_history || "[]");
      } catch {
        currentHistory = [];
      }

      currentHistory.push({
        tier: 2,
        channel: "Charge nurse SMS and on-call doctor call",
        dispatched_at: now.toISOString(),
        status: "auto_escalated_unacknowledged",
      });

      await sql`
        UPDATE clinic_beds
        SET
          breach_tier = 2,
          breach_escalation_history = ${JSON.stringify(currentHistory)}::jsonb
        WHERE id = ${String(bed_id)}
          AND clinic_slug = ${clinicSlug};
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "bed.breach.escalate",
        entity: "clinic_bed",
        entityId: String(bed.id),
        request: req,
      });

      return NextResponse.json({
        success: true,
        breach_tier: 2,
        message: `Tier 2 escalation fired for bed ${bed.bed_number}.`,
      });
    }

    // ── Bedside consumable charge ───────────────────────────────────
    if (action === "post_charge") {
      const cleanDesc = String(charge_description || "").trim();
      const amount = Number(charge_amount);
      if (!cleanDesc) {
        return apiError(400, "charge_description is required.", "invalid_input");
      }
      if (!Number.isFinite(amount) || amount <= 0) {
        return apiError(400, "charge_amount must be a positive number.", "invalid_amount");
      }

      await sql`
        SELECT id FROM clinic_beds
        WHERE id = ${String(bed_id)}
          AND clinic_slug = ${clinicSlug}
        FOR UPDATE;
      `;

      const recentDuplicates = await sql`
        SELECT * FROM bed_billing_ledger
        WHERE bed_id = ${String(bed_id)}
          AND LOWER(TRIM(description)) = LOWER(${cleanDesc})
          AND posted_at >= NOW() - INTERVAL '60 seconds'
        ORDER BY posted_at DESC
        LIMIT 1;
      `;

      if (recentDuplicates.length > 0 && !confirm_duplicate) {
        return NextResponse.json(
          {
            detail: `An identical charge for "${cleanDesc}" was posted less than 60 seconds ago. Confirm to post a second unit.`,
            code: "potential_double_post",
            duplicate_detected: true,
            previous_charge: recentDuplicates[0],
          },
          { status: 409 }
        );
      }

      const ledgerId = randomUUID();
      await sql`
        INSERT INTO bed_billing_ledger (
          id, admission_id, bed_id, bed_number, charge_type,
          description, amount, source_order_ref, posted_by, posted_at
        ) VALUES (
          ${ledgerId},
          ${bed.admission_id},
          ${bed.id},
          ${bed.bed_number},
          ${charge_type},
          ${cleanDesc},
          ${amount},
          ${`BEDSIDE-${randomUUID().slice(0, 6).toUpperCase()}`},
          ${nurseName},
          ${now}
        );
      `;

      await sql`
        UPDATE clinic_beds
        SET itemized_charges_total = COALESCE(itemized_charges_total, 0) + ${amount}
        WHERE id = ${String(bed_id)}
          AND clinic_slug = ${clinicSlug};
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "bed.charge.post",
        entity: "bed_billing_ledger",
        entityId: ledgerId,
        after: { description: cleanDesc, amount, charge_type },
        request: req,
      });

      return NextResponse.json({
        success: true,
        message: `${amount} for "${cleanDesc}" posted to the admission ledger.`,
        charge_id: ledgerId,
      });
    }

    // ── Complete task ───────────────────────────────────────────────
    if (action === "complete_task" && task_id) {
      const updated = await sql`
        UPDATE bed_care_tasks
        SET
          status = 'completed',
          completed_at = ${now},
          completed_by_esign = ${nurseName}
        WHERE id = ${String(task_id)}
          AND bed_id = ${String(bed.id)}
        RETURNING *;
      `;

      if (updated.length === 0) {
        return apiError(404, "Task not found for this bed.", "task_not_found");
      }

      return NextResponse.json({
        success: true,
        message: "Care task completed with nurse sign-off.",
        task: updated[0],
      });
    }

    // ── Create task ─────────────────────────────────────────────────
    if (action === "create_task") {
      if (!task_type || !task_description) {
        return apiError(
          400,
          "task_type and task_description are required.",
          "invalid_input"
        );
      }
      const taskId = randomUUID();
      await sql`
        INSERT INTO bed_care_tasks (
          id, bed_id, admission_id, task_type, description, due_time, assigned_to
        ) VALUES (
          ${taskId},
          ${bed.id},
          ${bed.admission_id},
          ${String(task_type)},
          ${String(task_description)},
          ${due_time},
          ${nurseName}
        );
      `;

      return NextResponse.json({
        success: true,
        message: "Clinical care task assigned.",
        task_id: taskId,
      });
    }

    return apiError(400, "Invalid action.", "invalid_action");
  } catch (error: any) {
    console.error("Care tasks error:", error);
    return apiError(500, "Failed to process task.", "internal_error");
  }
}

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicSlug = auth.auth.clinic!.slug;
    const { searchParams } = new URL(req.url);
    const bedId = searchParams.get("bed_id");
    const view = searchParams.get("view");

    if (view === "handovers") {
      const handovers = await sql`
        SELECT * FROM bed_shift_handovers
        WHERE clinic_slug = ${clinicSlug}
        ORDER BY handed_over_at DESC
        LIMIT 20;
      `;
      return NextResponse.json({ handovers });
    }

    if (bedId) {
      const owned = await sql`
        SELECT 1 FROM clinic_beds
        WHERE id = ${String(bedId)}
          AND clinic_slug = ${clinicSlug}
        LIMIT 1;
      `;
      if (owned.length === 0) {
        return apiError(404, "Bed not found in your clinic.", "bed_not_found");
      }
    }

    const tasks = bedId
      ? await sql`
          SELECT t.*, b.bed_number
          FROM bed_care_tasks t
          JOIN clinic_beds b ON b.id = t.bed_id
          WHERE t.bed_id = ${String(bedId)}
            AND b.clinic_slug = ${clinicSlug}
          ORDER BY t.created_at DESC;
        `
      : await sql`
          SELECT t.*, b.bed_number
          FROM bed_care_tasks t
          JOIN clinic_beds b ON b.id = t.bed_id
          WHERE b.clinic_slug = ${clinicSlug}
          ORDER BY t.created_at DESC
          LIMIT 100;
        `;

    return NextResponse.json({ tasks });
  } catch (error: any) {
    console.error("GET care tasks error:", error);
    return apiError(500, "Failed to load tasks.", "internal_error");
  }
}
