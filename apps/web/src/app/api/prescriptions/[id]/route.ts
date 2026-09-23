import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cleanId = decodeURIComponent(id || "").trim();

    const rxQuery = await sql`
      SELECT * FROM prescriptions 
      WHERE prescription_number = ${cleanId} OR id = ${cleanId}
      LIMIT 1;
    `;

    if (rxQuery.length === 0) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    const rx = rxQuery[0];

    const parsedRx = {
      ...rx,
      vitals: typeof rx.vitals === "string" ? JSON.parse(rx.vitals) : rx.vitals,
      symptoms: typeof rx.symptoms === "string" ? JSON.parse(rx.symptoms) : rx.symptoms,
      items: typeof rx.items === "string" ? JSON.parse(rx.items) : rx.items
    };

    return NextResponse.json(parsedRx);
  } catch (error: any) {
    console.error("GET /api/prescriptions/[id] error:", error);
    return NextResponse.json({ error: error.message || "Failed to load prescription" }, { status: 500 });
  }
}
