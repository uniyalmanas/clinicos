import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  try {
    const bills = await sql`
      SELECT * FROM pharmacy_dispenses 
      ORDER BY created_at DESC 
      LIMIT 50;
    `;

    const parsedBills = bills.map((b: any) => ({
      ...b,
      items: typeof b.items === "string" ? JSON.parse(b.items) : (b.items || []),
      subtotal: Number(b.subtotal || 0),
      discount: Number(b.discount || 0),
      gst_amount: Number(b.gst_amount || 0),
      total_amount: Number(b.total_amount || 0)
    }));

    return NextResponse.json({ bills: parsedBills });
  } catch (error: any) {
    console.error("GET /api/pharmacy/bills error:", error);
    return NextResponse.json({ error: error.message || "Failed to load past bills" }, { status: 500 });
  }
}
