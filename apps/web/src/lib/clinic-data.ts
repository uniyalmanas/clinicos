import { sql } from "@/lib/db";
import { demoDataAllowed, getDemoClinics, getDemoDoctors } from "@/lib/demo-data";
import { DoctorProfile } from "@/data/doctors";
import { ClinicProfile } from "@/data/clinics";

const toString = (value: unknown, fallback = "") => {
  if (typeof value === "string" && value.trim()) return value;
  if (typeof value === "number" || typeof value === "boolean") return String(value);
  return fallback;
};

const toNumber = (value: unknown, fallback = 0) => {
  const numeric = Number(value ?? fallback);
  return Number.isFinite(numeric) ? numeric : fallback;
};

const normalizeDoctor = (row: any): DoctorProfile => {
  const services = Array.isArray(row?.services)
    ? row.services.map((item: any) => toString(item, "Service"))
    : Array.isArray(row?.services_offered)
      ? row.services_offered.map((service: any) =>
          typeof service === "string" ? service : toString(service?.name, "Service")
        )
      : [];

  const servicesOffered = Array.isArray(row?.services_offered)
    ? row.services_offered.map((service: any) => ({
        name: typeof service === "string" ? service : toString(service?.name, "Service"),
        fee: toNumber(typeof service === "string" ? 0 : service?.fee, 0)
      }))
    : [];

  // Missing profile fields stay missing. A placeholder registration number,
  // rating, phone or fee would be indistinguishable from a real credential to
  // the patient reading this page, so nothing is substituted.
  return {
    slug: toString(row?.slug, toString(row?.id, "")),
    full_name: toString(row?.full_name, ""),
    title: toString(row?.title, "Dr."),
    specialization: toString(row?.specialization, ""),
    category: toString(row?.category, row?.specialization || ""),
    category_color: toString(row?.category_color, "blue"),
    qualification_summary: toString(row?.qualification_summary, ""),
    medical_council_reg_number: toString(row?.medical_council_reg_number, ""),
    medical_council_state: toString(row?.medical_council_state, ""),
    years_of_experience: toNumber(row?.years_of_experience, 0),
    languages_spoken: Array.isArray(row?.languages_spoken)
      ? row.languages_spoken.map((item: unknown) => toString(item, ""))
      : [],
    bio: toString(row?.bio, ""),
    consultation_fee: toNumber(row?.consultation_fee, 0),
    followup_fee: toNumber(row?.followup_fee, 0),
    followup_validity_days: toNumber(row?.followup_validity_days, 0),
    services,
    services_offered: servicesOffered,
    symptoms: Array.isArray(row?.symptoms) ? row.symptoms.map((item: unknown) => toString(item, "consultation")) : [],
    rating: toNumber(row?.rating, 0),
    total_reviews: toNumber(row?.total_reviews, 0),
    clinic_name: toString(row?.clinic_name, ""),
    clinic_slug: toString(row?.clinic_slug, ""),
    clinic_address: toString(row?.clinic_address, ""),
    locality: toString(row?.locality, ""),
    opd_timings: toString(row?.opd_timings, ""),
    next_token: toNumber(row?.next_token, 0),
    wait_time: toString(row?.wait_time, ""),
    phone: toString(row?.phone, ""),
    lat: toNumber(row?.lat, 0),
    lng: toNumber(row?.lng, 0),
    // Derive the badge from the doctor's actual verification status. A missing
    // value is never treated as verified.
    verified:
      typeof row?.verified === "boolean"
        ? row.verified
        : toString(row?.verification_status, "").toLowerCase() === "verified",
    avatar_seed: row?.avatar_seed || undefined
  };
};

const normalizeClinic = (row: any): ClinicProfile => ({
  slug: toString(row?.slug, toString(row?.id, "")),
  name: toString(row?.name, ""),
  tagline: toString(row?.tagline, ""),
  about: toString(row?.about, ""),
  address_line: toString(row?.address_line, ""),
  locality: toString(row?.locality, ""),
  city: toString(row?.city, ""),
  state: toString(row?.state, ""),
  postal_code: toString(row?.postal_code, ""),
  phone: toString(row?.phone, ""),
  whatsapp_number: toString(row?.whatsapp_number, ""),
  facilities: Array.isArray(row?.facilities) ? row.facilities.map((item: unknown) => toString(item, "Facility")) : [],
  opening_hours:
    typeof row?.opening_hours === "object" && row?.opening_hours
      ? row?.opening_hours
      : {},
  doctors: Array.isArray(row?.doctors) ? row.doctors.map((item: any) => ({
      full_name: toString(item?.full_name, ""),
      slug: toString(item?.slug, ""),
      specialization: toString(item?.specialization, ""),
      qualification_summary: toString(item?.qualification_summary, ""),
      consultation_fee: toNumber(item?.consultation_fee, 0)
    })) : []
});

export async function getDoctors(): Promise<DoctorProfile[]> {
  try {
    const data = await sql`
      SELECT * FROM doctors
      WHERE COALESCE(is_active, true) = true
        AND verification_status = 'verified'
      ORDER BY full_name
    `;
    return Array.isArray(data) ? data.map(normalizeDoctor) : [];
  } catch (err) {
    console.error("Direct DB fetch for doctors failed:", err);
    return demoDataAllowed() ? getDemoDoctors() : [];
  }
}

export async function getDoctorBySlug(slug: string): Promise<DoctorProfile | undefined> {
  const cleanSlug = slug.toLowerCase().trim();
  try {
    const rows = await sql`
      SELECT * FROM doctors
      WHERE lower(slug) = ${cleanSlug}
        AND COALESCE(is_active, true) = true
        AND verification_status = 'verified'
      LIMIT 1
    `;
    if (rows && rows.length > 0) {
      return normalizeDoctor(rows[0]);
    }
    return undefined;
  } catch (err) {
    console.error("Direct DB fetch for doctor by slug failed:", err);
    if (!demoDataAllowed()) return undefined;
    return getDemoDoctors().find((doctor) => doctor.slug.toLowerCase() === cleanSlug);
  }
}

export async function getClinics(): Promise<ClinicProfile[]> {
  try {
    const clinicsData = await sql`
      SELECT * FROM clinics
      WHERE COALESCE(status, 'active') = 'active'
        AND is_verified = true
      ORDER BY name
    `;
    const doctorRows = await sql`
      SELECT * FROM doctors
      WHERE COALESCE(is_active, true) = true
        AND verification_status = 'verified'
    `;
    return (Array.isArray(clinicsData) ? clinicsData : []).map((clinicRow: any) => {
      const relatedDoctors = (Array.isArray(doctorRows) ? doctorRows : [])
        .filter((doctorRow: any) => {
          const sameClinicSlug = toString(doctorRow?.clinic_slug, "") === toString(clinicRow?.slug, "");
          const sameClinicId = toString(doctorRow?.clinic_id, "") === toString(clinicRow?.id, "");
          return sameClinicSlug || sameClinicId;
        })
        .map((doctorRow: any) => ({
          full_name: toString(doctorRow?.full_name, ""),
          slug: toString(doctorRow?.slug, doctorRow?.id || ""),
          specialization: toString(doctorRow?.specialization, ""),
          qualification_summary: toString(doctorRow?.qualification_summary, ""),
          consultation_fee: toNumber(doctorRow?.consultation_fee, 0)
        }));

      return {
        ...normalizeClinic(clinicRow),
        doctors: relatedDoctors.length > 0 ? relatedDoctors : normalizeClinic(clinicRow).doctors
      };
    });
  } catch (err) {
    console.error("Direct DB fetch for clinics failed:", err);
    return demoDataAllowed() ? getDemoClinics() : [];
  }
}

export async function getClinicBySlug(slug: string): Promise<ClinicProfile | undefined> {
  const cleanSlug = slug.toLowerCase().trim();
  try {
    const rows = await sql`
      SELECT * FROM clinics
      WHERE lower(slug) = ${cleanSlug}
        AND COALESCE(status, 'active') = 'active'
        AND is_verified = true
      LIMIT 1
    `;
    if (rows && rows.length > 0) {
      const clinicRow = rows[0];
      const relatedDoctors = await sql`
        SELECT * FROM doctors
        WHERE (lower(clinic_slug) = ${cleanSlug} OR clinic_id = ${clinicRow.id})
          AND COALESCE(is_active, true) = true
          AND verification_status = 'verified'
      `;
      return {
        ...normalizeClinic(clinicRow),
        doctors: relatedDoctors.map((d: any) => ({
          full_name: toString(d.full_name, ""),
          slug: toString(d.slug, d.id || ""),
          specialization: toString(d.specialization, ""),
          qualification_summary: toString(d.qualification_summary, ""),
          consultation_fee: toNumber(d.consultation_fee, 0)
        }))
      };
    }
    return undefined;
  } catch (err) {
    console.error("Direct DB fetch for clinic by slug failed:", err);
    if (!demoDataAllowed()) return undefined;
    return getDemoClinics().find((clinic) => clinic.slug.toLowerCase() === cleanSlug);
  }
}
