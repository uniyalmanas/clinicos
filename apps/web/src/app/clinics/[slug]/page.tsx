import React from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  Building2, 
  MapPin, 
  Clock, 
  Phone, 
  CheckCircle2, 
  ShieldCheck, 
  ArrowLeft, 
  Calendar, 
  Stethoscope, 
  Navigation,
  Sparkles,
  FileText
} from "lucide-react";
import ClinicSessionTracker from "@/components/ClinicSessionTracker";

import { notFound } from "next/navigation";
import { getClinicBySlug, getClinics } from "@/lib/clinic-data";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  const clinics = await getClinics();
  return clinics.map(c => ({ slug: c.slug }));
}

export default async function ClinicProfilePage({ params }: Props) {
  const { slug } = await params;
  const clinic = await getClinicBySlug(slug);

  if (!clinic) {
    notFound();
  }

  const fullAddress = `${clinic.address_line}, ${clinic.city}, ${clinic.state}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      <ClinicSessionTracker slug={clinic.slug} />
      {/* Navigation */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-brand-600 dark:text-slate-400">
            <ArrowLeft className="h-4 w-4" /> Back to Home
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
              Verified Healthcare Facility
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-12">
          {/* Main Info */}
          <div className="lg:col-span-8 space-y-6">
            {/* Ambient Hero Banner */}
            <div className="relative h-48 sm:h-64 w-full overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
              <Image
                src={
                  slug.includes("heart")
                    ? "/images/clinical/consultation-room.jpg"
                    : "/images/clinical/clinic-reception.jpg"
                }
                alt={clinic.name}
                fill
                className="object-cover"
                priority
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/40 to-transparent" />
              <div className="absolute bottom-5 left-5 right-5 text-white">
                <span className="rounded-full bg-emerald-500/90 backdrop-blur-sm px-2.5 py-0.5 text-[10px] font-bold text-white uppercase tracking-wider">
                  Live OPD Active
                </span>
                <h1 className="mt-1 text-2xl sm:text-3xl font-black text-white drop-shadow-sm">
                  {clinic.name}
                </h1>
                <p className="text-xs text-white/90 font-medium">
                  {clinic.tagline}
                </p>
              </div>
            </div>

            {/* Address & Facilities Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <p className="text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5 font-medium">
                <MapPin className="h-4 w-4 text-red-500 shrink-0" />
                {fullAddress}
              </p>

              <div className="mt-4 flex flex-wrap gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                {clinic.facilities.map((f: string, idx: number) => (
                  <span
                    key={idx}
                    className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                  >
                    ✓ {f}
                  </span>
                ))}
              </div>
            </div>

            {/* About the Clinic */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                About the Facility
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {clinic.about}
              </p>
            </div>

            {/* Doctors Practicing at this Clinic */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Specialists Practicing Here
              </h2>
              <div className="mt-4 space-y-4">
                {clinic.doctors.map((d: any, idx: number) => {
                  const docPhoto =
                    d.slug === "dr-rahul-sharma"
                      ? "/images/doctors/dr-rahul-sharma.jpg"
                      : d.slug === "dr-aditi-joshi"
                      ? "/images/doctors/dr-aditi-joshi.jpg"
                      : d.slug === "dr-sameer-saxena"
                      ? "/images/doctors/dr-sameer-saxena.jpg"
                      : "/images/doctors/dr-rahul-sharma.jpg";
                  return (
                    <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 hover:border-brand-300 dark:border-slate-800 bg-white dark:bg-[#1C1C1E] shadow-xs">
                      <div className="flex items-center gap-3.5">
                        <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-black/[0.08] dark:border-white/[0.1]">
                          <Image
                            src={docPhoto}
                            alt={d.full_name}
                            fill
                            className="object-cover"
                          />
                        </div>
                        <div>
                          <Link href={`/doctors/${d.slug}`} className="text-sm font-bold text-slate-900 hover:text-brand-600 dark:text-white">
                            {d.full_name}
                          </Link>
                          <p className="text-xs text-slate-500">
                            {d.specialization} • {d.qualification_summary}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="text-xs font-bold text-slate-900 dark:text-white">
                          Fee: ₹{d.consultation_fee}
                        </span>
                        <Link
                          href={`/doctors/${d.slug}`}
                          className="rounded-lg bg-slate-100 dark:bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-200"
                        >
                          Profile
                        </Link>
                        <Link
                          href={`/book?doctor=${d.slug}&clinic=${clinic.slug}`}
                          className="rounded-lg bg-apple-blue px-3 py-1.5 text-xs font-bold text-white hover:bg-[#0077ED]"
                        >
                          Book Token
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Clinical Facility Showcase */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Facility &amp; Chamber Photos
              </h2>
              <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="relative h-32 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <Image src="/images/clinical/clinic-reception.jpg" alt="Waiting Area" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2 text-[10px] font-bold text-white">
                    OPD Waiting Lounge
                  </div>
                </div>
                <div className="relative h-32 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800">
                  <Image src="/images/clinical/consultation-room.jpg" alt="Consultation Chamber" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2 text-[10px] font-bold text-white">
                    Private Doctor Suite
                  </div>
                </div>
                <div className="relative h-32 overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 col-span-2 sm:col-span-1">
                  <Image src="/images/clinical/pharmacy-counter.jpg" alt="Pharmacy" fill className="object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent flex items-end p-2 text-[10px] font-bold text-white">
                    Dispensary Counter
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Sidebar: Timings & Location */}
          <div className="lg:col-span-4 space-y-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-brand-600" /> Clinic Operating Hours
              </h3>
              <div className="mt-4 divide-y divide-slate-100 text-xs dark:divide-slate-800">
                {Object.entries(clinic.opening_hours).map(([days, time], idx) => (
                  <div key={idx} className="flex justify-between py-2">
                    <span className="font-medium text-slate-700 dark:text-slate-300">{days}</span>
                    <span className="text-slate-500">{String(time)}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href={`/book?clinic=${clinic.slug}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl bg-apple-blue py-3 text-xs font-bold text-white shadow-apple-sm hover:bg-[#0077ED] transition"
                >
                  <Calendar className="h-4 w-4" /> Book Appointment / Live Token
                </Link>

                <Link
                  href={`/patient/portal?clinic=${clinic.slug}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-slate-800 py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition"
                >
                  <FileText className="h-4 w-4 text-apple-blue" /> View My Prescriptions &amp; Records
                </Link>

                <a
                  href={`tel:${clinic.phone}`}
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] py-2.5 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-black/[0.05] transition"
                >
                  <Phone className="h-4 w-4 text-apple-teal dark:text-[#30D1BE]" /> Call Clinic Reception
                </a>

                <a
                  href={`https://maps.google.com/?q=${encodeURIComponent(fullAddress)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="flex w-full items-center justify-center gap-2 rounded-xl border border-slate-300 py-2.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                >
                  <Navigation className="h-4 w-4 text-blue-600" /> Open in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
