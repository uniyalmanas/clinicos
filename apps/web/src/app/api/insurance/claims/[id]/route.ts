import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { status, approved_amount, approval_ref, remarks } = body;

    const updated = await db`
      UPDATE insurance_claims
      SET 
        status = COALESCE(${status}, status),
        approved_amount = COALESCE(${approved_amount !== undefined ? parseFloat(approved_amount) : null}, approved_amount),
        approval_ref = COALESCE(${approval_ref}, approval_ref),
        remarks = COALESCE(${remarks}, remarks)
      WHERE id = ${id}
      RETURNING *;
    `;

    if (updated.length === 0) {
      return NextResponse.json({ error: "Claim not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true, claim: updated[0] });
  } catch (error: any) {
    console.error("Update insurance claim error:", error);
    return NextResponse.json({ error: error.message || "Failed to update claim" }, { status: 500 });
  }
}
