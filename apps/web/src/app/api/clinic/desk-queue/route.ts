import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const doctorSlug = searchParams.get("doctor_slug") || "dr-rahul-sharma";
    const clinicSlug = searchParams.get("clinic_slug");

    // Fetch appointments for today or recent
    let appointments;
    if (clinicSlug) {
      appointments = await sql`
        SELECT * FROM appointments 
        WHERE clinic_id IN (SELECT id FROM clinics WHERE slug = ${clinicSlug})
        ORDER BY token_number ASC;
      `;
    } else {
      appointments = await sql`
        SELECT * FROM appointments 
        ORDER BY token_number ASC;
      `;
    }

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
        time_slot: apt.time_slot,
        fee_amount: Number(apt.fee_amount || 0),
        payment_status: apt.payment_status || "pending",
        payment_mode: apt.payment_mode || "cash",
        is_walk_in: apt.time_slot?.toLowerCase().includes("walk-in") || !apt.time_slot?.includes("-"),
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
    return NextResponse.json({ error: error.message || "Failed to load desk queue" }, { status: 500 });
  }
}
