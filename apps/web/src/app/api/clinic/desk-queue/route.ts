import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { clinicToday } from "@/lib/clinic-date";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinic_slug") || auth.auth.clinic!.slug;
    const clinicId = auth.auth.clinic!.id;

    // The desk queue is an operational view: it must show today's tokens, not
    // every token the clinic has ever issued. Without this, the "collected
    // today" totals and the waiting count grow forever, and this morning's
    // queue competes with last month's completed visits. `?date=all` is an
    // explicit opt-in for history/lookup tooling.
    const dateParam = searchParams.get("date");
    const dateFilter = dateParam === "all" ? null : dateParam || clinicToday();
    if (dateFilter !== null && !/^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
      return apiError(400, "date must be YYYY-MM-DD or 'all'.", "invalid_date");
    }

    const appointments = dateFilter
      ? await sql`
          SELECT * FROM appointments
          WHERE clinic_id::text = ${clinicId}::text
            AND appointment_date = ${dateFilter}
          ORDER BY token_number ASC;
        `
      : await sql`
          SELECT * FROM appointments
          WHERE clinic_id::text = ${clinicId}::text
          ORDER BY appointment_date DESC, token_number ASC;
        `;

    // Map status into standard desk status: 'waiting', 'in_consultation', 'completed'
    const formattedQueue = appointments.map((apt: any) => {
      let deskStatus = apt.status;
      if (deskStatus === "confirmed" || deskStatus === "booked") {
        deskStatus = "waiting";
      }
      return {
        id: apt.id,
        appointment_number: apt.appointment_number,
        token_number: apt.token_number,
        patient_name: apt.patient_name,
        patient_phone: apt.patient_phone,
        status: deskStatus,
        appointment_date: apt.appointment_date,
        time_slot: apt.time_slot,
        fee_amount: Number(apt.fee_amount || 0),
        payment_status: apt.payment_status || "pending",
        payment_mode: apt.payment_mode || "cash",
        is_walk_in: Boolean(apt.time_slot?.toLowerCase().includes("walk-in")),
        doctor_name: apt.doctor_name,
        doctor_slug: apt.doctor_slug,
        symptoms_description: apt.symptoms_description,
        created_at: apt.created_at
      };
    });

    // Summary calculations
    const paidAppointments = formattedQueue.filter((q: any) => q.payment_status === "paid");
    const totalCollected = paidAppointments.reduce((acc: number, curr: any) => acc + curr.fee_amount, 0);
    const upiCollected = paidAppointments.filter((q: any) => q.payment_mode === "upi").reduce((acc: number, curr: any) => acc + curr.fee_amount, 0);
    const cashCollected = paidAppointments.filter((q: any) => q.payment_mode === "cash").reduce((acc: number, curr: any) => acc + curr.fee_amount, 0);

    const activeInConsultation = formattedQueue.find((q: any) => q.status === "in_consultation") || null;
    const waitingPatients = formattedQueue.filter((q: any) => q.status === "waiting");
    const completedPatients = formattedQueue.filter((q: any) => q.status === "completed");

    return NextResponse.json({
      queue: formattedQueue,
      active_in_consultation: activeInConsultation,
      waiting_count: waitingPatients.length,
      completed_count: completedPatients.length,
      financials: {
        total_collected: totalCollected,
        upi_collected: upiCollected,
        cash_collected: cashCollected
      }
    });
  } catch (error: any) {
    console.error("GET /api/clinic/desk-queue error:", error);
    return apiError(500, "Failed to load desk queue.", "internal_error");
  }
}
