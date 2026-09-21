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
import { DOCTORS_MAP, DEHRADUN_DOCTORS } from "@/data/doctors";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return DEHRADUN_DOCTORS.map(d => ({ slug: d.slug }));
}

export default async function DoctorProfilePage({ params }: Props) {
  const { slug } = await params;
  const doctor = DOCTORS_MAP[slug];

  if (!doctor) {
    notFound();
  }

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
    <div className="min-h-screen bg-[#ECEEF2] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7]">
      {/* JSON-LD for Google SEO */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Navigation */}
      <header className="sticky top-0 z-40 apple-glass border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href={`/clinics/${doctor.clinic_slug}`}
              className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-3.5 py-1.5 text-xs font-semibold text-apple-blue hover:bg-black/[0.08] dark:hover:bg-white/[0.12] transition active:scale-[0.98]"
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
            <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card transition-all">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full bg-apple-blue/10 dark:bg-apple-blue/15 px-3 py-1 text-xs font-semibold text-apple-blue">
                      {doctor.specialization}
                    </span>
                    <span className="flex items-center gap-1 rounded-full bg-apple-teal/10 dark:bg-apple-teal/15 px-3 py-1 text-xs font-medium text-apple-teal dark:text-[#30D1BE]">
                      <ShieldCheck className="h-3.5 w-3.5" /> Verified NMC Doctor
                    </span>
                  </div>
                  <h1 className="mt-3 text-3xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
                    {doctor.full_name}
                  </h1>
                  <p className="mt-1 text-sm font-normal text-[#86868B]">
                    {doctor.qualification_summary}
                  </p>
                </div>

                {/* Rating Badge */}
                <div className="rounded-[20px] bg-[#ECEEF2]/70 dark:bg-[#2C2C2E] border border-black/[0.04] dark:border-white/[0.06] p-4 text-center min-w-[120px]">
                  <div className="flex items-center justify-center gap-1 text-lg font-bold text-[#1D1D1F] dark:text-white font-mono">
                    <Star className="h-4 w-4 fill-amber-400 text-amber-400" /> {doctor.rating}
                  </div>
                  <div className="text-[11px] text-[#86868B] mt-0.5">{doctor.total_reviews} verified reviews</div>
                </div>
              </div>

              {/* Registration & Clinic metadata */}
              <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-black/[0.04] dark:border-white/[0.06] pt-6 text-xs text-[#86868B]">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-apple-teal dark:text-[#30D1BE]" />
                  <span>Reg: <strong className="text-[#1D1D1F] dark:text-white font-medium">{doctor.medical_council_reg_number}</strong> ({doctor.medical_council_state})</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-apple-blue" />
                  <span>Experience: <strong className="text-[#1D1D1F] dark:text-white font-medium">{doctor.years_of_experience} Years</strong></span>
                </div>
                <div className="flex items-center gap-2 sm:col-span-2">
                  <MapPin className="h-4 w-4 text-[#86868B]" />
                  <span>{doctor.clinic_address}</span>
                </div>
              </div>
            </div>

            {/* About & Bio */}
            <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card">
              <h2 className="text-base font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
                About the Doctor
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#515154] dark:text-[#A1A1A6]">
                {doctor.bio}
              </p>
            </div>

            {/* Services & Treatment Options */}
            <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-8 shadow-apple-card">
              <h2 className="text-base font-semibold tracking-tight text-[#1D1D1F] dark:text-white">
                Services & Clinical Procedures
              </h2>
              <div className="mt-4 divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                {doctor.services_offered.map((s: any, idx: number) => (
                  <div key={idx} className="flex items-center justify-between py-3.5">
                    <span className="text-xs font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                      {s.name}
                    </span>
                    <span className="text-xs font-semibold text-[#1D1D1F] dark:text-white font-mono">
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
            <div className="sticky top-24 rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 sm:p-7 shadow-apple-card space-y-6">
              <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-4">
                <span className="text-xs font-normal text-[#86868B]">In-Clinic Consultation</span>
                <span className="text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-mono">₹{doctor.consultation_fee}</span>
              </div>

              <div className="space-y-2.5 text-xs text-[#86868B]">
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-apple-blue" />
                  <span>{doctor.opd_timings}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-apple-blue" />
                  <span>{doctor.clinic_name}</span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="space-y-3 pt-2">
                <Link
                  href={`/book?doctor=${doctor.slug}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full bg-apple-blue hover:bg-[#0077ED] py-3.5 text-xs font-semibold text-white shadow-apple-sm transition active:scale-[0.98]"
                >
                  <Calendar className="h-4 w-4" /> Book Appointment / Token
                </Link>

                <a
                  href={`tel:${doctor.phone}`}
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] py-3 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-[0.98] transition"
                >
                  <Phone className="h-4 w-4 text-apple-teal dark:text-[#30D1BE]" /> Call Clinic Directly
                </a>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(doctor.clinic_address)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] py-3 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-[0.98] transition"
                >
                  <Navigation className="h-4 w-4 text-apple-blue" /> Get Directions
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
