import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    return NextResponse.json({
      status: "sent",
      automation_id: id,
      triggered_at: new Date().toISOString()
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message || "Failed to trigger automation" }, { status: 500 });
  }
}
