import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const slug = searchParams.get("slug");
    const id = searchParams.get("id");

    if (slug || id) {
      const rows = id 
        ? await sql`SELECT * FROM clinics WHERE id::text = ${id}::text LIMIT 1`
        : await sql`SELECT * FROM clinics WHERE lower(slug) = ${slug!.toLowerCase().trim()} LIMIT 1`;

      if (rows.length === 0) {
        return NextResponse.json({ detail: "Clinic not found" }, { status: 404 });
      }
      const clinic = rows[0];
      const doctors = await sql`
        SELECT * FROM doctors 
        WHERE clinic_id::text = ${clinic.id}::text OR lower(clinic_slug) = ${clinic.slug.toLowerCase().trim()}
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

export async function PATCH(req: Request) {
  try {
    const body = await req.json();
    const { 
      id, 
      slug, 
      name, 
      phone, 
      address_line, 
      city, 
      state, 
      postal_code, 
      opening_hours, 
      facilities,
      upi_vpa,
      doctor_split_percentage,
      reg_number,
      tagline,
      consultation_fee,
      followup_fee,
      followup_validity_days,
      doctor_slug
    } = body;

    if (!id && !slug) {
      return NextResponse.json({ detail: "Clinic ID or slug is required" }, { status: 400 });
    }

    // 1. Update clinic profile
    const updatedClinics = id
      ? await sql`
          UPDATE clinics
          SET
            name = COALESCE(${name || null}, name),
            phone = COALESCE(${phone || null}, phone),
            address_line = COALESCE(${address_line || null}, address_line),
            city = COALESCE(${city || null}, city),
            state = COALESCE(${state || null}, state),
            postal_code = COALESCE(${postal_code || null}, postal_code),
            opening_hours = COALESCE(${opening_hours ? JSON.stringify(opening_hours) : null}::json, opening_hours),
            facilities = COALESCE(${facilities ? JSON.stringify(facilities) : null}::json, facilities),
            upi_vpa = COALESCE(${upi_vpa || null}, upi_vpa),
            doctor_split_percentage = COALESCE(${doctor_split_percentage !== undefined ? Number(doctor_split_percentage) : null}, doctor_split_percentage),
            reg_number = COALESCE(${reg_number || null}, reg_number),
            tagline = COALESCE(${tagline || null}, tagline)
          WHERE id::text = ${id}::text
          RETURNING *;
        `
      : await sql`
          UPDATE clinics
          SET
            name = COALESCE(${name || null}, name),
            phone = COALESCE(${phone || null}, phone),
            address_line = COALESCE(${address_line || null}, address_line),
            city = COALESCE(${city || null}, city),
            state = COALESCE(${state || null}, state),
            postal_code = COALESCE(${postal_code || null}, postal_code),
            opening_hours = COALESCE(${opening_hours ? JSON.stringify(opening_hours) : null}::json, opening_hours),
            facilities = COALESCE(${facilities ? JSON.stringify(facilities) : null}::json, facilities),
            upi_vpa = COALESCE(${upi_vpa || null}, upi_vpa),
            doctor_split_percentage = COALESCE(${doctor_split_percentage !== undefined ? Number(doctor_split_percentage) : null}, doctor_split_percentage),
            reg_number = COALESCE(${reg_number || null}, reg_number),
            tagline = COALESCE(${tagline || null}, tagline)
          WHERE lower(slug) = ${slug.toLowerCase().trim()}
          RETURNING *;
        `;

    if (updatedClinics.length === 0) {
      return NextResponse.json({ detail: "Clinic not found" }, { status: 404 });
    }

    const currentClinic = updatedClinics[0];

    // 2. If fees or doctor rules provided, update associated doctor(s)
    if (consultation_fee !== undefined || followup_fee !== undefined || followup_validity_days !== undefined) {
      if (doctor_slug) {
        await sql`
          UPDATE doctors
          SET
            consultation_fee = COALESCE(${consultation_fee !== undefined ? Number(consultation_fee) : null}, consultation_fee),
            followup_fee = COALESCE(${followup_fee !== undefined ? Number(followup_fee) : null}, followup_fee),
            followup_validity_days = COALESCE(${followup_validity_days !== undefined ? Number(followup_validity_days) : null}, followup_validity_days)
          WHERE slug = ${doctor_slug};
        `;
      } else {
        await sql`
          UPDATE doctors
          SET
            consultation_fee = COALESCE(${consultation_fee !== undefined ? Number(consultation_fee) : null}, consultation_fee),
            followup_fee = COALESCE(${followup_fee !== undefined ? Number(followup_fee) : null}, followup_fee),
            followup_validity_days = COALESCE(${followup_validity_days !== undefined ? Number(followup_validity_days) : null}, followup_validity_days)
          WHERE clinic_slug = ${currentClinic.slug} OR clinic_id::text = ${currentClinic.id}::text;
        `;
      }
    }

    // Return full updated profile
    const doctors = await sql`
      SELECT * FROM doctors 
      WHERE clinic_id::text = ${currentClinic.id}::text OR lower(clinic_slug) = ${currentClinic.slug.toLowerCase()}
    `;

    return NextResponse.json({
      success: true,
      clinic: currentClinic,
      doctors
    });
  } catch (error: any) {
    console.error("Clinic update error:", error);
    return NextResponse.json({ detail: error.message }, { status: 500 });
  }
}
