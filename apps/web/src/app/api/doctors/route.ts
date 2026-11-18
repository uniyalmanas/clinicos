import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";
import { demoDataAllowed, getDemoDoctors } from "@/lib/demo-data";
import { databaseUnavailable } from "@/lib/require-db";

export const dynamic = "force-dynamic";

/**
 * Doctor directory.
 *
 * Public callers receive profile fields only — never settlement payouts,
 * deactivation notes, or council registration numbers. Signed-in clinic staff
 * receive the full record for doctors in their own clinic.
 *
 * Only approved, active doctors are listed publicly. Unverified doctors created
 * by onboarding stay hidden until a super admin approves the clinic.
 */
const PUBLIC_FIELDS = `
  id, slug, title, full_name, specialization,
  qualification_summary, years_of_experience, languages_spoken, bio,
  consultation_fee, followup_fee, followup_validity_days, services_offered,
  rating, total_reviews, clinic_id, clinic_name, clinic_slug, clinic_address,
  opd_timings, chamber_name, is_active, verification_status
`;

const PUBLIC_VISIBILITY = `
  COALESCE(is_active, true) = true
  AND COALESCE(verification_status, 'verified') = 'verified'
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
            `SELECT ${PUBLIC_FIELDS} FROM doctors
             WHERE lower(slug) = $1 AND ${PUBLIC_VISIBILITY}
             LIMIT 1`,
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
               WHERE lower(specialization) ILIKE $1 AND ${PUBLIC_VISIBILITY}
               ORDER BY full_name`,
              [`%${specialization.toLowerCase()}%`]
            )
      );
    }

    return NextResponse.json(
      canSeeFull
        ? await sql`SELECT * FROM doctors ORDER BY full_name;`
        : await sql.unsafe(
            `SELECT ${PUBLIC_FIELDS} FROM doctors WHERE ${PUBLIC_VISIBILITY} ORDER BY full_name`
          )
    );
  } catch (error: any) {
    console.error("GET /api/doctors failed:", error?.message);

    // Demo fixtures are a development-only aid and require an explicit opt-in.
    if (demoDataAllowed()) {
      const { searchParams } = new URL(req.url);
      const slug = searchParams.get("slug");
      const doctors = getDemoDoctors();
      if (slug) {
        const match = doctors.find(
          (d) => d.slug.toLowerCase() === slug.toLowerCase().trim()
        );
        if (match) return NextResponse.json(match);
        return apiError(404, "Doctor not found.", "doctor_not_found");
      }
      return NextResponse.json(doctors);
    }

    return databaseUnavailable();
  }
}
