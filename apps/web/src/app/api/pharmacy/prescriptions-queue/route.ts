import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const rxRows = await sql`
      SELECT * FROM prescriptions 
      ORDER BY created_at DESC 
      LIMIT 20;
    `;

    const queue = rxRows.map((rx: any) => {
      const items = typeof rx.items === "string" ? JSON.parse(rx.items) : (rx.items || []);
      return {
        id: rx.id,
        prescription_number: rx.prescription_number,
        patient_name: rx.patient_name,
        patient_phone: rx.patient_phone,
        doctor_name: rx.doctor_name,
        created_at: rx.created_at,
        items: items,
        items_count: items.length
      };
    });

    return NextResponse.json({ queue });
  } catch (error: any) {
    console.error("GET /api/pharmacy/prescriptions-queue error:", error);
    return NextResponse.json({ error: error.message || "Failed to load prescriptions queue" }, { status: 500 });
  }
}
