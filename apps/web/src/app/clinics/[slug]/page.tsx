import React from "react";
import Link from "next/link";
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
  Sparkles
} from "lucide-react";

import { notFound } from "next/navigation";
import { DEHRADUN_CLINICS, CLINICS_MAP } from "@/data/clinics";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return DEHRADUN_CLINICS.map(c => ({ slug: c.slug }));
}

export default async function ClinicProfilePage({ params }: Props) {
  const { slug } = await params;
  const clinic = CLINICS_MAP[slug];

  if (!clinic) {
    notFound();
  }

  const fullAddress = `${clinic.address_line}, ${clinic.city}, ${clinic.state}`;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
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
            {/* Header Box */}
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-50 text-brand-600 dark:bg-brand-950">
                  <Building2 className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-2xl font-black text-slate-900 dark:text-white">
                    {clinic.name}
                  </h1>
                  <p className="text-xs text-brand-600 font-medium">
                    {clinic.tagline}
                  </p>
                </div>
              </div>

              <p className="mt-4 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1.5">
                <MapPin className="h-4 w-4 text-slate-400 shrink-0" />
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
                {clinic.doctors.map((d: any, idx: number) => (
                  <div key={idx} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-xl border border-slate-100 p-4 hover:border-brand-300 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-teal-50 text-brand-600 dark:bg-teal-950">
                        <Stethoscope className="h-5 w-5" />
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
                        className="rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-brand-700"
                      >
                        View Profile
                      </Link>
                    </div>
                  </div>
                ))}
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
