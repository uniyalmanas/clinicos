import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const auth = await guard(req, { roles: CLINIC_ROLES });
    if (!auth.ok) return auth.response;

    const clinicId = auth.auth.clinic!.id;

    const rxRows = await sql`
      SELECT id, prescription_number, patient_name, patient_phone,
             doctor_name, clinic_id, items, created_at
      FROM prescriptions
      WHERE clinic_id::text = ${clinicId}::text
      ORDER BY created_at DESC
      LIMIT 20;
    `;

    const queue = rxRows.map((rx: any) => {
      const items = typeof rx.items === "string" ? JSON.parse(rx.items) : rx.items || [];
      return {
        id: rx.id,
        prescription_number: rx.prescription_number,
        patient_name: rx.patient_name,
        patient_phone: rx.patient_phone,
        doctor_name: rx.doctor_name,
        created_at: rx.created_at,
        items,
        items_count: items.length,
      };
    });

    return NextResponse.json({ queue });
  } catch (error: any) {
    console.error("GET /api/pharmacy/prescriptions-queue error:", error);
    return apiError(500, "Failed to load prescriptions queue.", "internal_error");
  }
}
