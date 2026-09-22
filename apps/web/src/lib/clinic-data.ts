import { supabase, supabaseReady } from "@/lib/supabase";
import { DEHRADUN_DOCTORS, DoctorProfile } from "@/data/doctors";
import { DEHRADUN_CLINICS, ClinicProfile } from "@/data/clinics";

const fallbackDoctors = DEHRADUN_DOCTORS;
const fallbackClinics = DEHRADUN_CLINICS;

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

  return {
    slug: toString(row?.slug, toString(row?.id, "doctor-slug")),
    full_name: toString(row?.full_name, "Dr. Doctor"),
    title: toString(row?.title, "Dr."),
    specialization: toString(row?.specialization, "General Physician"),
    category: toString(row?.category, row?.specialization || "General Medicine"),
    category_color: toString(row?.category_color, "blue"),
    qualification_summary: toString(
      row?.qualification_summary,
      "Verified medical specialist"
    ),
    medical_council_reg_number: toString(row?.medical_council_reg_number, "VERIFIED"),
    medical_council_state: toString(row?.medical_council_state, "Uttarakhand"),
    years_of_experience: toNumber(row?.years_of_experience, 0),
    languages_spoken: Array.isArray(row?.languages_spoken)
      ? row.languages_spoken.map((item: unknown) => toString(item, "English"))
      : ["English", "Hindi"],
    bio: toString(row?.bio, "Verified medical professional."),
    consultation_fee: toNumber(row?.consultation_fee, 500),
    followup_fee: toNumber(row?.followup_fee, 200),
    followup_validity_days: toNumber(row?.followup_validity_days, 7),
    services,
    services_offered: servicesOffered,
    symptoms: Array.isArray(row?.symptoms) ? row.symptoms.map((item: unknown) => toString(item, "consultation")) : [],
    rating: toNumber(row?.rating, 4.9),
    total_reviews: toNumber(row?.total_reviews, 0),
    clinic_name: toString(row?.clinic_name, "Clinic"),
    clinic_slug: toString(row?.clinic_slug, row?.clinic_id || "clinic"),
    clinic_address: toString(row?.clinic_address, "Dehradun"),
    locality: toString(row?.locality, "Dehradun"),
    opd_timings: toString(row?.opd_timings, "Mon - Sat: 10:00 AM - 08:00 PM"),
    next_token: toNumber(row?.next_token, 1),
    wait_time: toString(row?.wait_time, "Available today"),
    phone: toString(row?.phone, "+919999999999"),
    lat: toNumber(row?.lat, 30.3165),
    lng: toNumber(row?.lng, 78.0322),
    verified: row?.verified ?? true,
    avatar_seed: row?.avatar_seed || undefined
  };
};

const normalizeClinic = (row: any): ClinicProfile => ({
  slug: toString(row?.slug, toString(row?.id, "clinic-slug")),
  name: toString(row?.name, "Clinic"),
  tagline: toString(row?.tagline, "Healthcare facility"),
  about: toString(row?.about, "Healthcare facility."),
  address_line: toString(row?.address_line, "Dehradun"),
  locality: toString(row?.locality, "Dehradun"),
  city: toString(row?.city, "Dehradun"),
  state: toString(row?.state, "Uttarakhand"),
  postal_code: toString(row?.postal_code, "248001"),
  phone: toString(row?.phone, "+919999999999"),
  whatsapp_number: toString(row?.whatsapp_number, "+919999999999"),
  facilities: Array.isArray(row?.facilities) ? row.facilities.map((item: unknown) => toString(item, "Facility")) : [],
  opening_hours:
    typeof row?.opening_hours === "object" && row?.opening_hours
      ? row.opening_hours
      : {
          "Monday - Saturday": "10:00 AM - 08:00 PM",
          Sunday: "Closed"
        },
  doctors: Array.isArray(row?.doctors) ? row.doctors.map((item: any) => ({
      full_name: toString(item?.full_name, "Doctor"),
      slug: toString(item?.slug, "doctor-slug"),
      specialization: toString(item?.specialization, "General Physician"),
      qualification_summary: toString(item?.qualification_summary, "Verified specialist"),
      consultation_fee: toNumber(item?.consultation_fee, 500)
    })) : []
});

export async function getDoctors(): Promise<DoctorProfile[]> {
  if (!supabaseReady || !supabase) {
    return fallbackDoctors;
  }

  const { data, error } = await supabase.from("doctors").select("*").order("full_name");
  if (error || !Array.isArray(data)) {
    return fallbackDoctors;
  }

  return data.map(normalizeDoctor);
}

export async function getDoctorBySlug(slug: string): Promise<DoctorProfile | undefined> {
  const doctors = await getDoctors();
  return doctors.find((doctor) => doctor.slug.toLowerCase() === slug.toLowerCase());
}

export async function getClinics(): Promise<ClinicProfile[]> {
  if (!supabaseReady || !supabase) {
    return fallbackClinics;
  }

  const { data: clinicsData, error: clinicsError } = await supabase.from("clinics").select("*");
  if (clinicsError || !Array.isArray(clinicsData)) {
    return fallbackClinics;
  }

  const { data: doctorsData } = await supabase.from("doctors").select("*");
  const doctorRows = Array.isArray(doctorsData) ? doctorsData : [];

  return clinicsData.map((clinicRow: any) => {
    const relatedDoctors = doctorRows
      .filter((doctorRow: any) => {
        const sameClinicSlug = toString(doctorRow?.clinic_slug, "") === toString(clinicRow?.slug, "");
        const sameClinicId = toString(doctorRow?.clinic_id, "") === toString(clinicRow?.id, "");
        return sameClinicSlug || sameClinicId;
      })
      .map((doctorRow: any) => ({
        full_name: toString(doctorRow?.full_name, "Doctor"),
        slug: toString(doctorRow?.slug, doctorRow?.id || "doctor-slug"),
        specialization: toString(doctorRow?.specialization, "General Physician"),
        qualification_summary: toString(doctorRow?.qualification_summary, "Verified specialist"),
        consultation_fee: toNumber(doctorRow?.consultation_fee, 500)
      }));

    return {
      ...normalizeClinic(clinicRow),
      doctors: relatedDoctors.length > 0 ? relatedDoctors : normalizeClinic(clinicRow).doctors
    };
  });
}

export async function getClinicBySlug(slug: string): Promise<ClinicProfile | undefined> {
  const clinics = await getClinics();
  return clinics.find((clinic) => clinic.slug.toLowerCase() === slug.toLowerCase());
}
