import React from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { notFound } from "next/navigation";
import { 
  Stethoscope, 
  MapPin, 
  Clock, 
  CheckCircle2, 
  Star, 
  Calendar, 
  Phone, 
  Navigation, 
  ShieldCheck, 
  ArrowLeft,
  Building2,
  Sparkles
} from "lucide-react";
import DoctorReviewsSection from "@/components/DoctorReviewsSection";
import AIReceptionistWidget from "@/components/AIReceptionistWidget";

// Server-side seed data map
const SEED_DOCTORS: Record<string, any> = {
  "dr-rahul-sharma": {
    slug: "dr-rahul-sharma",
    title: "Dr.",
    full_name: "Dr. Rahul Sharma",
    medical_council_reg_number: "UKMC-8942-2012",
    medical_council_state: "Uttarakhand Medical Council",
    qualification_summary: "MBBS, MD (Dermatology, Venereology & Leprosy)",
    specialization: "Dermatologist",
    sub_specializations: ["Acne Specialist", "Cosmetic Laser Surgery", "Hair Loss Therapy"],
    years_of_experience: 12,
    languages_spoken: ["English", "Hindi"],
    bio: "Dr. Rahul Sharma is a senior consultant dermatologist with over 12 years of clinical expertise in treating chronic acne, psoriasis, and laser aesthetic procedures. Committed to personalized, evidence-based skincare.",
    consultation_fee: 600,
    followup_fee: 300,
    followup_validity_days: 7,
    services_offered: [
      { name: "Skin & Scalp Consultation", fee: 600 },
      { name: "Chemical Peel & Acne Treatment", fee: 1500 },
      { name: "Laser Scar Reduction", fee: 2500 },
      { name: "PRP Hair Loss Therapy", fee: 3500 }
    ],
    verification_status: "verified",
    rating: 4.9,
    total_reviews: 142,
    clinic_name: "Derma Care Skin & Laser Centre",
    clinic_slug: "derma-care-dehradun",
    clinic_address: "14, Rajpur Road, Near Ashley Hall, Dehradun",
    opd_timings: "Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM",
    phone: "+919876543210"
  },
  "dr-aditi-joshi": {
    slug: "dr-aditi-joshi",
    title: "Dr.",
    full_name: "Dr. Aditi Joshi",
    medical_council_reg_number: "UDC-4120-2016",
    medical_council_state: "Uttarakhand Dental Council",
    qualification_summary: "BDS, MDS (Conservative Dentistry & Endodontics)",
    specialization: "Dentist",
    sub_specializations: ["Painless Root Canal", "Cosmetic Veneers", "Dental Implants"],
    years_of_experience: 8,
    languages_spoken: ["English", "Hindi", "Garhwali"],
    bio: "Dr. Aditi Joshi is a leading endodontist known for painless single-sitting root canals and digital smile design in Dehradun.",
    consultation_fee: 400,
    followup_fee: 0,
    followup_validity_days: 7,
    services_offered: [
      { name: "Dental Checkup & Digital X-Ray", fee: 400 },
      { name: "Single Sitting Painless RCT", fee: 3000 },
      { name: "Teeth Whitening", fee: 3500 },
      { name: "Dental Implants Consultation", fee: 800 }
    ],
    verification_status: "verified",
    rating: 4.8,
    total_reviews: 98,
    clinic_name: "Smile Craft Multi-Speciality Dental",
    clinic_slug: "smile-craft-dental",
    clinic_address: "42, EC Road, Near Survey Chowk, Dehradun",
    opd_timings: "Mon - Sat: 10:00 AM - 01:30 PM, 04:30 PM - 08:00 PM",
    phone: "+919876543211"
  },
  "dr-vikram-sethi": {
    slug: "dr-vikram-sethi",
    title: "Dr.",
    full_name: "Dr. Vikram Sethi",
    medical_council_reg_number: "UKMC-6214-2009",
    medical_council_state: "Uttarakhand Medical Council",
    qualification_summary: "MBBS, DCH, DNB (Pediatrics)",
    specialization: "Pediatrician",
    sub_specializations: ["Newborn Intensive Care", "Childhood Asthma", "Vaccination"],
    years_of_experience: 15,
    languages_spoken: ["English", "Hindi"],
    bio: "Senior child specialist providing gentle, compassionate pediatric healthcare, newborn care, and complete childhood immunization schedules.",
    consultation_fee: 500,
    followup_fee: 200,
    followup_validity_days: 5,
    services_offered: [
      { name: "Child OPD Consultation", fee: 500 },
      { name: "Vaccination Administration", fee: 200 },
      { name: "Growth & Milestones Assessment", fee: 600 }
    ],
    verification_status: "verified",
    rating: 4.95,
    total_reviews: 210,
    clinic_name: "Dron Child & Newborn Health Centre",
    clinic_slug: "dron-child-clinic",
    clinic_address: "88, Chakrata Road, Near Ballupur Chowk, Dehradun",
    opd_timings: "Mon - Sat: 09:30 AM - 01:00 PM, 05:00 PM - 08:30 PM",
    phone: "+919876543212"
  }
};

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return [
    { slug: "dr-rahul-sharma" },
    { slug: "dr-aditi-joshi" },
    { slug: "dr-vikram-sethi" },
  ];
}

export default async function DoctorProfilePage({ params }: Props) {
  const { slug } = await params;
  const doctor = SEED_DOCTORS[slug] || {
    slug: slug,
    title: "Dr.",
    full_name: "Dr. Rahul Sharma",
    specialization: "Dermatologist",
    qualification_summary: "MBBS, MD (Dermatology)",
    years_of_experience: 12,
    rating: 4.9,
    total_reviews: 142,
    consultation_fee: 600,
    bio: "Senior consultant specialist providing modern healthcare in Dehradun.",
    medical_council_reg_number: "UKMC-8942-2012",
    medical_council_state: "Uttarakhand Medical Council",
    clinic_name: "Derma Care Skin Centre",
    clinic_slug: "derma-care-dehradun",
    clinic_address: "14, Rajpur Road, Dehradun",
    opd_timings: "Mon - Sat: 10:00 AM - 02:00 PM, 05:00 PM - 08:30 PM",
    services_offered: [
      { name: "Consultation", fee: 600 },
      { name: "Specialized Therapy", fee: 1500 }
    ],
    phone: "+919876543210"
  };

  // Schema.org MedicalBusiness / Physician JSON-LD
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Physician",
    "name": doctor.full_name,
    "medicalSpecialty": doctor.specialization,
    "description": doctor.bio,
    "address": {
      "@type": "PostalAddress",
      "streetAddress": doctor.clinic_address,
      "addressLocality": "Dehradun",
      "addressRegion": "Uttarakhand",
      "addressCountry": "IN"
    },
    "telephone": doctor.phone,
    "priceRange": `₹${doctor.consultation_fee}`
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* JSON-LD for Google SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 dark:text-slate-400">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href={`/clinics/${doctor.clinic_slug}`}
              className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline"
            >
              <Building2 className="h-3.5 w-3.5" /> Visit {doctor.clinic_name}
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Profile Info */}
          <div className="lg:col-span-8 space-y-6">
            {/* Header Profile Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-bold text-brand-700 dark:bg-brand-950 dark:text-brand-300">
                      {doctor.specialization}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified NMC Doctor
                    </span>
                  </div>
                  <h1 className="mt-3 text-3xl font-black text-slate-900 dark:text-white">
                    {doctor.full_name}
                  </h1>
                  <p className="mt-1 text-sm font-medium text-slate-600 dark:text-slate-400">
                    {doctor.qualification_summary}
                  </p>
                </div>

                {/* Rating Badge */}
                <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 text-center dark:border-slate-800 dark:bg-slate-950">
                  <div className="flex items-center justify-center gap-1 text-base font-black text-slate-900 dark:text-white">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {doctor.rating}
                  </div>
                  <div className="text-[11px] text-slate-500">{doctor.total_reviews} verified reviews</div>
                </div>
              </div>

              {/* Registration & Clinic metadata */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-slate-100 pt-6 text-xs text-slate-600 dark:border-slate-800 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Reg: <strong className="text-slate-900 dark:text-white">{doctor.medical_council_reg_number}</strong> ({doctor.medical_council_state})
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-600" />
                  Experience: <strong className="text-slate-900 dark:text-white">{doctor.years_of_experience} Years</strong>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <MapPin className="h-4 w-4 text-slate-400" />
                  {doctor.clinic_address}
                </div>
              </div>
            </div>

            {/* About & Bio */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                About the Doctor
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {doctor.bio}
              </p>
            </div>

            {/* Services & Treatment Options */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Services & Clinical Procedures
              </h2>
              <div className="mt-4 divide-y divide-slate-100 dark:divide-slate-800">
                {doctor.services_offered.map((s: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-3">
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      • {s.name}
                    </span>
                    <span className="text-xs font-bold text-slate-900 dark:text-white">
                      ₹{s.fee}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Patient Reviews & Rating System */}
            <DoctorReviewsSection doctorSlug={doctor.slug} doctorName={doctor.full_name} />
          </div>

          {/* Right Sidebar: Booking & Action Box */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border-2 border-brand-600 bg-white p-6 shadow-lg shadow-brand-600/10 dark:bg-slate-900">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
                <span className="text-xs font-medium text-slate-500">In-Clinic Consultation</span>
                <span className="text-2xl font-black text-slate-900 dark:text-white">₹{doctor.consultation_fee}</span>
              </div>

              <div className="mt-4 space-y-2 text-xs text-slate-600 dark:text-slate-400">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-brand-600" />
                  <span>{doctor.opd_timings}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-brand-600" />
                  <span>{doctor.clinic_name}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-6 space-y-3">
                <Link
                  href={`/book?doctor=${doctor.slug}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-xs font-bold text-white shadow-md hover:bg-brand-700"
                >
                  <Calendar className="h-4 w-4" /> Book Appointment / Token
                </Link>

                <a
                  href={`tel:${doctor.phone}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  <Phone className="h-4 w-4 text-emerald-600" /> Call Clinic Directly
                </a>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(doctor.clinic_address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  <Navigation className="h-4 w-4 text-blue-600" /> Get Directions
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* Floating AI Receptionist Widget */}
        <AIReceptionistWidget
          doctorName={doctor.full_name}
          doctorSlug={doctor.slug}
          specialization={doctor.specialization}
          clinicName={doctor.clinic_name}
          clinicAddress={doctor.clinic_address}
          consultationFee={doctor.consultation_fee}
          opdTimings={doctor.opd_timings}
          phone={doctor.phone}
        />
      </main>
    </div>
  );
}
