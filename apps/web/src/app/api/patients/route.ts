import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get("q")?.toLowerCase();

    // 1. Fetch appointments
    const apts = await sql`
      SELECT * FROM appointments 
      ORDER BY created_at DESC;
    `;

    // 2. Fetch prescriptions
    const rxs = await sql`
      SELECT * FROM prescriptions 
      ORDER BY created_at DESC;
    `;

    // Map prescriptions by appointment_number and phone
    const rxByApt = new Map<string, any>();
    const rxByPhone = new Map<string, any[]>();

    for (const rx of rxs) {
      if (rx.appointment_number) rxByApt.set(rx.appointment_number, rx);
      const cleanP = (rx.patient_phone || "").replace(/[^0-9]/g, "").slice(-10);
      if (cleanP) {
        const arr = rxByPhone.get(cleanP) || [];
        arr.push(rx);
        rxByPhone.set(cleanP, arr);
      }
    }

    // Group appointments by patient phone
    const patientsMap = new Map<string, any>();

    for (const apt of apts) {
      const cleanPhone = (apt.patient_phone || "").replace(/[^0-9]/g, "").slice(-10);
      if (!cleanPhone) continue;

      const linkedRx = rxByApt.get(apt.appointment_number) || null;
      const rxItems = linkedRx ? (typeof linkedRx.items === "string" ? JSON.parse(linkedRx.items) : (linkedRx.items || [])) : [];
      const rxVitals = linkedRx ? (typeof linkedRx.vitals === "string" ? JSON.parse(linkedRx.vitals) : (linkedRx.vitals || {})) : {};

      const visitObj = {
        visit_id: apt.appointment_number,
        visit_date: apt.appointment_date || apt.created_at?.toISOString().split("T")[0] || "Today",
        doctor_name: apt.doctor_name || linkedRx?.doctor_name || "Dr. Rahul Sharma",
        doctor_specialization: "Dermatology & Skin Care",
        clinic_name: apt.clinic_name || linkedRx?.clinic_name || "Derma Care Skin & Laser Centre",
        provisional_diagnosis: linkedRx?.provisional_diagnosis || apt.symptoms_description || "Outpatient Consultation",
        vitals: Object.keys(rxVitals).length > 0 ? rxVitals : { bp: "118/76", pulse: 74, temp: 98.4, weight: 64, spo2: 99 },
        medications_summary: rxItems.length > 0 ? rxItems.map((m: any) => `${m.medicine_name} (${m.dosage_frequency || '1-0-1'})`) : ["Consultation Conducted"],
        followup_advice: linkedRx?.instructions || "Follow prescribed medical advice",
        prescription_number: linkedRx?.prescription_number || null,
        fee_amount: Number(apt.fee_amount || 0),
        payment_status: apt.payment_status || "paid"
      };

      if (!patientsMap.has(cleanPhone)) {
        patientsMap.set(cleanPhone, {
          id: `pt-${cleanPhone}`,
          full_name: apt.patient_name || linkedRx?.patient_name || "Patient",
          phone: apt.patient_phone,
          gender: linkedRx?.patient_gender || "Male",
          age: linkedRx?.patient_age || 26,
          blood_group: "O+",
          chronic_allergies: [],
          known_conditions: [linkedRx?.provisional_diagnosis || apt.symptoms_description || "Dermatitis"].filter(Boolean),
          registered_at: apt.appointment_date || apt.created_at?.toISOString().split("T")[0] || "Recent",
          total_visits: 1,
          visits: [visitObj]
        });
      } else {
        const existing = patientsMap.get(cleanPhone);
        existing.total_visits += 1;
        existing.visits.push(visitObj);
        if (linkedRx?.provisional_diagnosis && !existing.known_conditions.includes(linkedRx.provisional_diagnosis)) {
          existing.known_conditions.push(linkedRx.provisional_diagnosis);
        }
      }
    }

    // Convert map to array
    let patients = Array.from(patientsMap.values());

    // Apply search filter if query is present
    if (query) {
      patients = patients.filter(p =>
        p.full_name.toLowerCase().includes(query) ||
        p.phone.includes(query) ||
        p.known_conditions.some((c: string) => c.toLowerCase().includes(query))
      );
    }

    return NextResponse.json({ patients });
  } catch (error: any) {
    console.error("GET /api/patients error:", error);
    return NextResponse.json({ error: error.message || "Failed to load patients" }, { status: 500 });
  }
}
