import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const specialization = searchParams.get("specialization");

    if (slug) {
      const rows = await sql`
        SELECT * FROM doctors WHERE lower(slug) = ${slug.toLowerCase().trim()} LIMIT 1
      `;
      if (rows.length === 0) {
        return NextResponse.json({ detail: "Doctor not found" }, { status: 404 });
      }
      return NextResponse.json(rows[0]);
    }

    let rows;
    if (specialization) {
      rows = await sql`
        SELECT * FROM doctors 
        WHERE lower(specialization) ILIKE ${`%${specialization.toLowerCase()}%`}
        ORDER BY full_name
      `;
    } else {
      rows = await sql`SELECT * FROM doctors ORDER BY full_name`;
    }

    return NextResponse.json(rows);
  } catch (error: any) {
    console.error("Doctors API error:", error);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
