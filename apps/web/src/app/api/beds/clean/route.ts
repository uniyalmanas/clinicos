import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { bed_id } = body;

    if (!bed_id) {
      return NextResponse.json({ error: "bed_id is required" }, { status: 400 });
    }

    const updated = await sql`
      UPDATE clinic_beds 
      SET status = 'vacant'
      WHERE id = ${bed_id}
      RETURNING *;
    `;

    return NextResponse.json({ status: "success", bed: updated[0] });
  } catch (error: any) {
    console.error("POST /api/beds/clean error:", error);
    return NextResponse.json({ error: error.message || "Failed to mark bed as cleaned" }, { status: 500 });
  }
}
