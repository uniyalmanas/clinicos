import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json();
    const { new_stock } = body;

    if (new_stock === undefined) {
      return NextResponse.json({ error: "new_stock is required" }, { status: 400 });
    }

    const updated = await sql`
      UPDATE pharmacy_items 
      SET current_stock = ${Number(new_stock)}
      WHERE id = ${id}
      RETURNING *;
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({
      status: "success",
      item: updated[0]
    });
  } catch (error: any) {
    console.error("PUT /api/pharmacy/inventory/[id]/stock error:", error);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
