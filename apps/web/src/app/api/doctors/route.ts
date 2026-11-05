import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Doctor directory.
 *
 * Public callers receive profile fields only — never settlement payouts,
 * deactivation notes, or council registration numbers. Signed-in clinic staff
 * receive the full record for doctors in their own clinic.
 */
const PUBLIC_FIELDS = `
  id, slug, title, full_name, specialization, sub_specializations,
  qualification_summary, years_of_experience, languages_spoken, bio,
  consultation_fee, followup_fee, followup_validity_days, services_offered,
  rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address,
  opd_timings, chamber_name, is_active, verification_status
`;

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const specialization = searchParams.get("specialization");

    const auth = await guard(req, { roles: CLINIC_ROLES, requireClinic: false });
    const canSeeFull = auth.ok && Boolean(auth.auth.clinic);

    if (slug) {
      const rows = canSeeFull
        ? await sql`
            SELECT * FROM doctors
            WHERE lower(slug) = ${slug.toLowerCase().trim()}
            LIMIT 1;
          `
        : await sql.unsafe(
            `SELECT ${PUBLIC_FIELDS} FROM doctors WHERE lower(slug) = $1 LIMIT 1`,
            [slug.toLowerCase().trim()]
          );
      if (rows.length === 0) {
        return apiError(404, "Doctor not found.", "doctor_not_found");
      }
      return NextResponse.json(rows[0]);
    }

    if (specialization) {
      return NextResponse.json(
        canSeeFull
          ? await sql`
              SELECT * FROM doctors
              WHERE lower(specialization) ILIKE ${`%${specialization.toLowerCase()}%`}
              ORDER BY full_name;
            `
          : await sql.unsafe(
              `SELECT ${PUBLIC_FIELDS} FROM doctors
               WHERE lower(specialization) ILIKE $1
               ORDER BY full_name`,
              [`%${specialization.toLowerCase()}%`]
            )
      );
    }

    return NextResponse.json(
      canSeeFull
        ? await sql`SELECT * FROM doctors ORDER BY full_name;`
        : await sql.unsafe(`SELECT ${PUBLIC_FIELDS} FROM doctors ORDER BY full_name`)
    );
  } catch (error: any) {
    console.error("Doctors API error:", error);
    return apiError(500, "Failed to load doctors.", "internal_error");
  }
}
