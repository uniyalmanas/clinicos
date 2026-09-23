import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");

    if (slug) {
      const rows = await sql`
        SELECT * FROM clinics WHERE lower(slug) = ${slug.toLowerCase().trim()} LIMIT 1
      `;
      if (rows.length === 0) {
        return NextResponse.json({ detail: "Clinic not found" }, { status: 404 });
      }
      const clinic = rows[0];
      const doctors = await sql`
        SELECT * FROM doctors WHERE clinic_id = ${clinic.id} OR lower(clinic_slug) = ${slug.toLowerCase().trim()}
      `;
      return NextResponse.json({ ...clinic, doctors });
    }

    const clinics = await sql`SELECT * FROM clinics ORDER BY name`;
    return NextResponse.json(clinics);
  } catch (error: any) {
    console.error("Clinics API error:", error);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
