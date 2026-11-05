import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guardPatient, patientCookieOptions } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const auth = await guardPatient(req);
  if (auth.ok) {
    await sql`
      UPDATE patient_sessions
      SET revoked_at = now()
      WHERE id = ${auth.auth.session_id} AND revoked_at IS NULL;
    `;
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set({ ...patientCookieOptions(), value: "", maxAge: 0 });
  return response;
}
