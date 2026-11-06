import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { randomUUID } from "crypto";
import { guard, CLINICAL_ROLES, apiError } from "@/lib/api-auth";
import { logAudit } from "@/lib/audit";
import { findClinicLabOrder } from "@/lib/lab-scope";

export const dynamic = "force-dynamic";

/**
 * Critical value notification and read-back log.
 *
 * This endpoint records that a clinician was alerted and that the value was
 * read back. It does not itself send SMS or place calls; the channel is stored
 * as a manual log so the audit trail reflects exactly what happened.
 */
export async function POST(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINICAL_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;
    const body = await req.json();
    const {
      order_id,
      action = "confirm_read_back",
      doctor_name,
      doctor_phone = null,
      read_back_nurse,
      read_back_notes,
    } = body;

    if (!order_id) {
      return apiError(400, "order_id is required.", "invalid_input");
    }

    const order = await findClinicLabOrder(clinicId, order_id);
    if (!order) {
      return apiError(404, "Lab order not found in your clinic.", "order_not_found");
    }

    if (action === "notify_doctor") {
      const notifiedDoctor = String(doctor_name || order.doctor_name || "").trim();
      if (!notifiedDoctor) {
        return apiError(
          400,
          "doctor_name is required — the ordering doctor is not recorded on this order.",
          "doctor_required"
        );
      }

      await sql`
        INSERT INTO lis_critical_alert_logs (
          id, order_id, order_number, patient_name, doctor_name,
          doctor_phone, parameter_name, critical_value, channel
        ) VALUES (
          ${randomUUID()},
          ${order.id},
          ${order.order_number},
          ${order.patient_name},
          ${notifiedDoctor},
          ${doctor_phone},
          ${JSON.stringify(order.critical_parameters || [])},
          'CRITICAL_VALUE_FLAGGED',
          'manual_log'
        );
      `;

      const updated = await sql`
        UPDATE diagnostic_lab_orders
        SET
          doctor_notified_at = NOW(),
          doctor_notified_name = ${notifiedDoctor}
        WHERE id = ${String(order.id)}
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "lab.critical.notify",
        entity: "diagnostic_lab_order",
        entityId: String(order.id),
        after: { doctor_name: notifiedDoctor, doctor_phone },
        request: req,
      });

      return NextResponse.json({
        success: true,
        message: `Critical alert recorded against ${notifiedDoctor}. Read-back confirmation still pending.`,
        order: updated[0],
      });
    }

    if (action === "confirm_read_back") {
      const nurse = String(read_back_nurse || auth.auth.user.full_name);
      const notes = String(read_back_notes || "").trim();
      if (!notes) {
        return apiError(
          400,
          "read_back_notes are required to close a critical alert.",
          "notes_required"
        );
      }

      const notation = `[Critical value read-back] ${notes}`;
      const updated = await sql`
        UPDATE diagnostic_lab_orders
        SET
          doctor_read_back_confirmed = true,
          doctor_notified_at = COALESCE(doctor_notified_at, NOW()),
          doctor_notified_name = COALESCE(${doctor_name || null}, doctor_notified_name),
          pathologist_notes = ${notation},
          updated_at = NOW()
        WHERE id = ${String(order.id)}
        RETURNING *;
      `;

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "lab.critical.read_back",
        entity: "diagnostic_lab_order",
        entityId: String(order.id),
        after: { read_back_nurse: nurse, read_back_notes: notes },
        request: req,
      });

      return NextResponse.json({
        success: true,
        message: `Critical value read-back recorded by ${nurse}.`,
        order: updated[0],
      });
    }

    if (action === "dispatch_whatsapp") {
      const recipientPhone = String(doctor_phone || order.doctor_phone || "").replace(/[^0-9]/g, "").slice(-10);
      const recipientDoctor = String(doctor_name || order.doctor_name || "Doctor").trim();
      const paramsList = Array.isArray(order.critical_parameters)
        ? order.critical_parameters.join(", ")
        : (order.critical_parameters ? String(order.critical_parameters) : "Critical flagged parameters");

      const alertMessage =
        `⚠️ *CRITICAL LAB ALERT* — Urgent clinical notification:\n\n` +
        `Patient: *${order.patient_name}*\n` +
        `Order Ref: #${order.order_number}\n` +
        `Flagged: ${paramsList}\n\n` +
        `Please review the lab portal immediately and confirm read-back.\n` +
        `Reported by: ${auth.auth.user.full_name} (${auth.auth.clinic?.name || "Clinic Lab"})`;

      const whatsappUrl = recipientPhone
        ? `https://wa.me/91${recipientPhone}?text=${encodeURIComponent(alertMessage)}`
        : null;

      try {
        await sql`
          INSERT INTO lis_critical_alert_logs (
            id, order_id, order_number, patient_name, doctor_name,
            doctor_phone, parameter_name, critical_value, channel
          ) VALUES (
            ${randomUUID()},
            ${order.id},
            ${order.order_number},
            ${order.patient_name},
            ${recipientDoctor},
            ${recipientPhone || null},
            ${JSON.stringify(order.critical_parameters || [])},
            'CRITICAL_VALUE_WHATSAPP_DISPATCH',
            'whatsapp'
          );
        `;
      } catch (logErr) {
        console.warn("Failed to write to lis_critical_alert_logs:", logErr);
      }

      await logAudit({
        actorId: auth.auth.user.id,
        actorRole: auth.auth.role,
        clinicId,
        action: "lab.critical.whatsapp_dispatch",
        entity: "diagnostic_lab_order",
        entityId: String(order.id),
        after: { doctor_name: recipientDoctor, doctor_phone: recipientPhone },
        request: req,
      });

      return NextResponse.json({
        success: true,
        message: recipientPhone
          ? `Critical alert prepared for WhatsApp dispatch to Dr. ${recipientDoctor}.`
          : `Critical alert logged. No phone number recorded on order to open WhatsApp.`,
        whatsapp_url: whatsappUrl,
        message_text: alertMessage,
        order,
      });
    }

    return apiError(400, "Invalid action.", "invalid_action");
  } catch (error: any) {
    console.error("Critical alert error:", error);
    return apiError(500, "Failed to process critical alert.", "internal_error");
  }
}
