"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import SiteHeader from "@/components/SiteHeader";
import InteractiveHeroSearch from "@/components/InteractiveHeroSearch";
import HeroIllustrationShowcase from "@/components/HeroIllustrationShowcase";
import DocSphereAIAgent from "@/components/DocSphereAIAgent";
import {
  GeneralPhysicianIcon,
  DermatologyIcon,
  ObstetricsIcon,
  OrthopaedicsIcon,
  EntIcon,
  DiabetologyIcon,
  DentistIcon
} from "@/components/BrowseSpecialtiesSection";
import { 
  Stethoscope, 
  Building2, 
  UserCheck, 
  MapPin, 
  Clock, 
  Calendar, 
  FileText, 
  ShieldCheck, 
  Sparkles, 
  ArrowRight, 
  CheckCircle2, 
  XCircle,
  Smartphone,
  CreditCard,
  ChevronDown, 
  Phone, 
  QrCode, 
  Lock, 
  Zap, 
  Activity,
  Bot,
  Users,
  Search,
  ExternalLink,
  Receipt,
  HeartPulse,
  Baby
} from "lucide-react";

// Professional Pediatrics SVG Icon
function PediatricsIcon() {
  return (
    <svg viewBox="0 0 64 64" fill="none" className="w-9 h-9" xmlns="http://www.w3.org/2000/svg">
      <circle cx="32" cy="22" r="10" stroke="#1D1D1F" strokeWidth="2.5" />
      <path d="M24 16C26 14 38 14 40 16" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" />
      <circle cx="28" cy="20" r="1.5" fill="#1D1D1F" />
      <circle cx="36" cy="20" r="1.5" fill="#1D1D1F" />
      <path d="M29 25C31 27 33 27 35 25" stroke="#EC4899" strokeWidth="2" strokeLinecap="round" />
      <path d="M18 48C18 38 24 34 32 34C40 34 46 38 46 48" stroke="#1D1D1F" strokeWidth="2.5" strokeLinecap="round" />
      <path d="M27 38V45C27 47 37 47 37 45V38" stroke="#0071E3" strokeWidth="2" strokeLinecap="round" />
      <circle cx="37" cy="47" r="2.5" fill="#0071E3" />
    </svg>
  );
}

type FeaturedDoctor = {
  slug: string;
  full_name: string;
  specialization?: string;
  qualification_summary?: string;
  rating?: number;
  total_reviews?: number;
  clinic_name?: string;
  clinic_address?: string;
  consultation_fee?: number;
  opd_timings?: string;
};

function doctorInitials(name: string): string {
  return name
    .replace(/^Dr\.?\s*/i, "")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
}

type FeaturedReview = {
  id: string;
  doctor_slug?: string;
  patient_name?: string;
  rating?: number;
  comment?: string | null;
  is_verified_visit?: boolean;
};

function matchesSpecialty(doctorSpecialty: string, target: string): boolean {
  const s = (doctorSpecialty || "").toLowerCase();
  const t = (target || "").toLowerCase();
  if (t.includes("general physician")) {
    return (
      s.includes("physician") ||
      s.includes("general medicine") ||
      s.includes("internal medicine")
    );
  }
  if (t.includes("dermatology")) return s.includes("derma");
  if (t.includes("dentistry")) return s.includes("dent") || s.includes("oral");
  if (t.includes("pediatrics")) {
    return s.includes("pediatric") || s.includes("paediatric") || s.includes("child");
  }
  if (t.includes("orthopaedics")) return s.includes("ortho");
  if (t.includes("gynae") || t.includes("obstetrics")) {
    return s.includes("gyn") || s.includes("obstet");
  }
  if (t.includes("ent")) return s.includes("ent") || s.includes("otolaryng");
  if (t.includes("diabetology")) return s.includes("diabet");
  return s.includes(t);
}

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isAiAgentOpen, setIsAiAgentOpen] = useState(false);

  // Live doctor roster for the featured cards and specialty counts.
  const [directoryDoctors, setDirectoryDoctors] = useState<FeaturedDoctor[]>([]);
  const [featuredLoading, setFeaturedLoading] = useState(true);
  const [featuredError, setFeaturedError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/doctors", { cache: "no-store" });
        if (!res.ok) throw new Error("Could not load doctors.");
        const json = await res.json().catch(() => []);
        const rows: FeaturedDoctor[] = Array.isArray(json)
          ? json
          : json?.doctors || [];
        const sorted = [...rows].sort(
          (a, b) =>
            (Number(b.rating) || 0) - (Number(a.rating) || 0) ||
            (Number(b.total_reviews) || 0) - (Number(a.total_reviews) || 0)
        );
        if (!cancelled) setDirectoryDoctors(sorted);
      } catch (err: any) {
        if (!cancelled) {
          setFeaturedError(err?.message || "Could not load doctors.");
        }
      } finally {
        if (!cancelled) setFeaturedLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const featuredDoctors = useMemo(
    () => directoryDoctors.slice(0, 3),
    [directoryDoctors]
  );

  // Live patient reviews for the social-proof section.
  const [landingReviews, setLandingReviews] = useState<FeaturedReview[]>([]);
  const [reviewsLoading, setReviewsLoading] = useState(true);
  const [reviewsError, setReviewsError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/reviews", { cache: "no-store" });
        if (!res.ok) throw new Error("Could not load patient reviews.");
        const json = await res.json().catch(() => ({}));
        const rows: FeaturedReview[] = Array.isArray(json?.reviews)
          ? json.reviews
          : [];
        if (!cancelled) setLandingReviews(rows.slice(0, 3));
      } catch (err: any) {
        if (!cancelled) {
          setReviewsError(err?.message || "Could not load patient reviews.");
        }
      } finally {
        if (!cancelled) setReviewsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const topSpecialties = [
    {
      id: "general-physician",
      name: "General Physician",
      desc: "Fever, Infections, BP & Diabetes",
      icon: GeneralPhysicianIcon,
      slug: "general-physician"
    },
    {
      id: "dermatology",
      name: "Dermatology",
      desc: "Acne, Eczema, Hair Fall, Laser",
      icon: DermatologyIcon,
      slug: "dermatologist"
    },
    {
      id: "dentistry",
      name: "Dentistry",
      desc: "Root Canal, Tooth Pain, Braces",
      icon: DentistIcon,
      slug: "dentist"
    },
    {
      id: "pediatrics",
      name: "Pediatrics",
      desc: "Child OPD, Infant Care, Vaccines",
      icon: PediatricsIcon,
      slug: "pediatrician"
    },
    {
      id: "orthopaedics",
      name: "Orthopaedics",
      desc: "Joint Pain, Spine, Fractures",
      icon: OrthopaedicsIcon,
      slug: "orthopaedist"
    },
    {
      id: "obstetrics-gynaecology",
      name: "Obstetrics & Gynae",
      desc: "PCOS, Pregnancy Care, Women's Health",
      icon: ObstetricsIcon,
      slug: "gynaecologist"
    },
    {
      id: "ent",
      name: "ENT Specialist",
      desc: "Ear Pain, Sinus, Tonsils, Vertigo",
      icon: EntIcon,
      slug: "ent-specialist"
    },
    {
      id: "diabetology",
      name: "Diabetology",
      desc: "Sugar Control, Thyroid, Metabolic",
      icon: DiabetologyIcon,
      slug: "diabetologist"
    }
  ];

  const comparisonRows = [
    {
      feature: "Consultation Fee",
      docsphere: "Direct doctor fee (no platform markup)",
      docsphereGood: true,
      aggregators: "Platform commission added to the clinic fee",
      aggregatorsGood: false
    },
    {
      feature: "Doctor Discovery",
      docsphere: "Specialty and proximity search",
      docsphereGood: true,
      aggregators: "Paid 'Sponsored' Listings & Ad Placements",
      aggregatorsGood: false
    },
    {
      feature: "Waiting Room Experience",
      docsphere: "Live Token Counter Ticker on Phone",
      docsphereGood: true,
      aggregators: "Stale slots, 45-min unmanaged queue chaos",
      aggregatorsGood: false
    },
    {
      feature: "Prescription Delivery",
      docsphere: "SHA-256 sealed PDF on WhatsApp",
      docsphereGood: true,
      aggregators: "Locked inside the aggregator's app",
      aggregatorsGood: false
    },
    {
      feature: "Patient Data Privacy",
      docsphere: "Direct doctor-patient relationship",
      docsphereGood: true,
      aggregators: "Contact details handled by a third party",
      aggregatorsGood: false
    }
  ];

  const faqs = [
    {
      q: "How does DocSphere offer zero-markup healthcare?",
      a: "Traditional aggregators charge independent doctors a commission on every appointment, which inflates consultation fees. DocSphere charges doctors a flat software tool fee. Patients pay the doctor's consultation fee directly at the desk or via UPI with no booking markup or convenience fee."
    },
    {
      q: "Do I need to download an application to book or track my token?",
      a: "No app downloads required at all. DocSphere is 100% web-based and runs smoothly on Safari, Chrome, and Firefox on any smartphone. When you reserve a token, your live queue tracker and your signed digital prescription PDF open directly in your browser and are sent straight to your WhatsApp."
    },
    {
      q: "How does the live token queue prevent waiting room crowds?",
      a: "DocSphere links the doctor's chamber directly to your phone. When your doctor calls Token #2, your phone updates in real time with the live token status and estimated wait time. You can wait at home or a nearby cafe and only reach the clinic when your turn is near."
    },
    {
      q: "How do I check a doctor's registration?",
      a: "Each doctor profile shows the State Medical Council registration number and qualifications recorded for that doctor, where the clinic has provided them. Prescriptions are written with the generic molecule name first, in line with NMC prescribing guidance."
    },
    {
      q: "How is my medical data and personal phone number protected?",
      a: "We strictly adhere to India's DPDP Act. We never sell or share patient contact details with third-party marketing companies, tele-pharmacies, or insurance brokers. Signed prescriptions carry a tamper-evident SHA-256 seal and are visible only to you and your consulting doctor."
    },
    {
      q: "How do I pay for my consultation?",
      a: "You pay your doctor directly at the clinic reception counter using your preferred UPI app (Google Pay, PhonePe, Paytm) or cash. There are zero payment gateway processing deductions or hidden convenience surcharges."
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#ECEEF2] text-[#1D1D1F] dark:bg-[#000000] dark:text-[#F5F5F7]">
      {/* ADAPTIVE NAVIGATION BAR */}
      <SiteHeader />

      {/* 1. HERO SECTION: PATIENT-FIRST & ZERO-MARKUP */}
      <section className="relative px-4 pt-12 pb-16 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Eyebrow Pill */}
          <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 py-1.5 text-xs font-semibold text-[#1D1D1F] shadow-apple-sm dark:border-white/[0.12] dark:bg-[#1C1C1E] dark:text-white">
            <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>Dehradun&apos;s Direct Healthcare Network</span>
          </div>

          {/* Grand Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] text-[#1D1D1F] dark:text-white leading-[1.08]">
            Zero-Markup Healthcare <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#0071E3] via-[#00A389] to-[#30D158] bg-clip-text text-transparent">
              in Dehradun.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-lg text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Consult registered doctors directly. Upfront fees, live counter token queues on your phone, and instant WhatsApp prescriptions. Zero aggregator commissions.
          </p>

          {/* Interactive Search Grid */}
          <div className="mt-8">
            <InteractiveHeroSearch />
          </div>

          {/* AI Consultant Agent Callout */}
          <div className="mt-4 flex items-center justify-center">
            <button
              onClick={() => setIsAiAgentOpen(true)}
              className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 hover:bg-blue-500/15 border border-blue-500/20 px-4 py-2 text-xs font-bold text-[#0071E3] dark:text-[#2997FF] transition cursor-pointer active:scale-95"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF]" />
              <span>Not sure which specialist to see? Ask DocSphere Assistant (Voice &amp; Chat) →</span>
            </button>
          </div>

          {/* Primary Action Buttons */}
          <div className="mt-7 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/search"
              className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] px-7 py-3.5 text-sm font-bold text-white shadow-apple-sm hover:bg-[#0077ED] active:scale-95 transition"
            >
              <Search className="h-4 w-4" />
              <span>Find Doctors in Dehradun</span>
            </Link>
            <Link
              href="/book"
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-7 py-3.5 text-sm font-semibold text-[#1D1D1F] shadow-apple-sm hover:bg-black/[0.02] active:scale-95 transition dark:border-white/[0.12] dark:bg-[#1C1C1E] dark:text-white"
            >
              <Calendar className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
              <span>Book Appointment Token</span>
            </Link>
          </div>

          {/* Trust Value Points */}
          <div className="mt-9 flex flex-wrap items-center justify-center gap-5 sm:gap-7 text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Direct Doctor Fee</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Live Counter Token Tracking</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Council Registration on Profile</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Digital Rx on WhatsApp</span>
          </div>

          {/* Interactive Hero Illustration Showcase */}
          <HeroIllustrationShowcase />
        </div>
      </section>

      {/* 2. HOW IT WORKS: PATIENT WORKFLOW (4 STEPS) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] dark:border-white/[0.08] bg-white/50 dark:bg-[#1C1C1E]/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
              Simple 4-Step Patient Journey
            </span>
            <h2 className="mt-2 text-3xl font-black text-[#1D1D1F] dark:text-white sm:text-4xl tracking-tight">
              Healthcare without aggregator friction.
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93]">
              No mandatory app downloads. No surge fees. Just direct clinical access.
            </p>
          </div>

          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {/* Step 1 */}
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between hover:shadow-apple-card-hover transition-all duration-300">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold font-mono text-sm">
                    01
                  </div>
                  <div className="relative h-14 w-14">
                    <Image
                      src="/images/illustrations/doctor-standing.svg"
                      alt="Choose Doctor"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h3 className="mt-4 text-base font-bold text-[#1D1D1F] dark:text-white">
                  Search Registered Doctors
                </h3>
                <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  Browse independent doctors across Rajpur Road, EC Road, and Chakrata Road by specialty, medical council registration where listed, and transparent fee.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.04] text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                Registration details shown where provided
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between hover:shadow-apple-card-hover transition-all duration-300">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-sm">
                    02
                  </div>
                  <div className="relative h-14 w-14">
                    <Image
                      src="/images/illustrations/booking-confirmed.svg"
                      alt="Reserve Token"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h3 className="mt-4 text-base font-bold text-[#1D1D1F] dark:text-white">
                  Reserve Live Token
                </h3>
                <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  Generate your instant appointment token online. No booking surcharges, no hidden convenience fees.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.04] text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                Zero Aggregator Markup
              </div>
            </div>

            {/* Step 3 */}
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between hover:shadow-apple-card-hover transition-all duration-300">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold font-mono text-sm">
                    03
                  </div>
                  <div className="relative h-14 w-14">
                    <Image
                      src="/images/illustrations/patient-waiting.svg"
                      alt="Track OPD"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h3 className="mt-4 text-base font-bold text-[#1D1D1F] dark:text-white">
                  Track Live OPD on Phone
                </h3>
                <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  Watch current tokens progressing in real time. Reach the clinic comfortably without sitting in a crowded waiting hall for hours.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.04] text-[11px] font-semibold text-amber-600 dark:text-amber-400">
                Real-Time Chamber Ticker
              </div>
            </div>

            {/* Step 4 */}
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between hover:shadow-apple-card-hover transition-all duration-300">
              <div>
                <div className="flex items-center justify-between">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold font-mono text-sm">
                    04
                  </div>
                  <div className="relative h-14 w-14">
                    <Image
                      src="/images/illustrations/digital-records.svg"
                      alt="Direct Care"
                      fill
                      className="object-contain"
                    />
                  </div>
                </div>
                <h3 className="mt-4 text-base font-bold text-[#1D1D1F] dark:text-white">
                  Direct Care &amp; WhatsApp Rx
                </h3>
                <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  Consult in person, pay the doctor directly via UPI or cash, and receive your digitally sealed prescription PDF instantly on WhatsApp.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.04] text-[11px] font-semibold text-purple-600 dark:text-purple-400">
                Digital Prescriptions &amp; Bills
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. WHY DOCSPHERE VS. AGGREGATORS (COMPARISON TABLE) */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-5xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
              Direct Patient Protection
            </span>
            <h2 className="mt-2 text-3xl font-black text-[#1D1D1F] dark:text-white sm:text-4xl tracking-tight">
              Why DocSphere vs. Marketplace Aggregators
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93]">
              Healthcare works best as a direct relationship between doctor and patient.
            </p>
          </div>

          <div className="mt-12 overflow-hidden rounded-[24px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] shadow-apple-card">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-black/[0.08] dark:border-white/[0.08] bg-black/[0.02] dark:bg-white/[0.02]">
                    <th className="py-4 px-6 font-bold text-[#1D1D1F] dark:text-white w-1/3">Core Feature</th>
                    <th className="py-4 px-6 font-bold text-[#0071E3] dark:text-[#2997FF] w-1/3 bg-blue-500/5">
                      DocSphere Direct
                    </th>
                    <th className="py-4 px-6 font-bold text-[#86868B] dark:text-[#8E8E93] w-1/3">
                      Traditional Aggregators
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.06] dark:divide-white/[0.06]">
                  {comparisonRows.map((row, idx) => (
                    <tr key={idx} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02] transition">
                      <td className="py-4 px-6 font-bold text-[#1D1D1F] dark:text-white">
                        {row.feature}
                      </td>
                      <td className="py-4 px-6 bg-blue-500/5 font-semibold text-emerald-700 dark:text-emerald-400">
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                          <span>{row.docsphere}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#86868B] dark:text-[#8E8E93]">
                        <div className="flex items-center gap-2">
                          <XCircle className="h-4 w-4 text-red-400 shrink-0" />
                          <span>{row.aggregators}</span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LIVE CLINICS IN DEHRADUN (FEATURED DOCTORS) */}
      <section id="clinics" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] dark:border-white/[0.08] bg-white/50 dark:bg-[#1C1C1E]/50">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF] flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> Dehradun Pilot Deployment
              </span>
              <h2 className="mt-2 text-3xl font-black text-[#1D1D1F] dark:text-white sm:text-4xl tracking-tight">
                Live Clinics Powered by DocSphere
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93]">
                Registered practitioners with synchronized counter token numbers and patient reviews.
              </p>
            </div>
            <Link 
              href="/search" 
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0071E3] hover:underline dark:text-[#2997FF] shrink-0"
            >
              View all {directoryDoctors.length > 0 ? `${directoryDoctors.length} ` : ""}doctors <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {featuredLoading ? (
              <div className="md:col-span-3 rounded-[24px] border border-black/[0.06] bg-white p-10 text-center dark:border-white/[0.08] dark:bg-[#1C1C1E]">
                <div className="mx-auto h-9 w-9 rounded-full border-2 border-[#0071E3]/30 border-t-[#0071E3] animate-spin" />
                <p className="mt-3 text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">
                  Loading doctors…
                </p>
              </div>
            ) : featuredDoctors.length === 0 ? (
              <div className="md:col-span-3 rounded-[24px] border border-black/[0.06] bg-white p-10 text-center dark:border-white/[0.08] dark:bg-[#1C1C1E]">
                <Stethoscope className="mx-auto h-8 w-8 text-[#86868B]" />
                <p className="mt-3 text-sm font-bold text-[#1D1D1F] dark:text-white">
                  No doctors listed yet
                </p>
                <p className="mt-1 text-xs text-[#86868B] dark:text-[#8E8E93]">
                  {featuredError ||
                    "Doctors appear here as soon as a clinic roster is published."}
                </p>
              </div>
            ) : (
              featuredDoctors.map((doctor) => (
                <div
                  key={doctor.slug}
                  className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between hover:shadow-apple-card-hover transition-all duration-300"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3.5">
                        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[#0071E3] to-[#008778] text-base font-black text-white shadow-sm">
                          {doctorInitials(doctor.full_name)}
                        </div>
                        <div>
                          <span className="rounded-full bg-teal-50 dark:bg-teal-950/60 px-2.5 py-0.5 text-[10px] font-bold text-teal-700 dark:text-teal-300">
                            {doctor.specialization || "Specialist"}
                          </span>
                          <h3 className="mt-1 text-base font-bold text-[#1D1D1F] dark:text-white">
                            {doctor.full_name}
                          </h3>
                          {doctor.qualification_summary && (
                            <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">
                              {doctor.qualification_summary}
                            </p>
                          )}
                        </div>
                      </div>
                      {(doctor.total_reviews ?? 0) > 0 && doctor.rating ? (
                        <div className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 shrink-0">
                          {`⭐ ${Number(doctor.rating).toFixed(1)} (${doctor.total_reviews})`}
                        </div>
                      ) : null}
                    </div>

                    <div className="mt-4 space-y-1.5 text-xs text-[#86868B] dark:text-[#8E8E93]">
                      <div className="flex items-center gap-1.5">
                        <Building2 className="h-3.5 w-3.5 shrink-0 text-[#1D1D1F] dark:text-white" />
                        <span>{doctor.clinic_name || "Clinic"}</span>
                      </div>
                      {doctor.clinic_address && (
                        <div className="flex items-center gap-1.5">
                          <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" />
                          <span>{doctor.clinic_address}</span>
                        </div>
                      )}
                    </div>

                    <div className="mt-4 flex items-center justify-between border-t border-black/[0.05] pt-3 text-xs dark:border-white/[0.06]">
                      <div>
                        <span className="text-[10px] uppercase text-[#86868B] block font-bold">
                          Consultation Fee
                        </span>
                        <span className="font-extrabold text-[#1D1D1F] dark:text-white">
                          {doctor.consultation_fee
                            ? `₹${doctor.consultation_fee} (0% markup)`
                            : "Fee at clinic"}
                        </span>
                      </div>
                      <div className="text-right">
                        <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 block font-bold">
                          Direct Booking
                        </span>
                        <span className="font-bold text-emerald-600 dark:text-emerald-400">
                          {doctor.opd_timings ? "OPD open" : "Book today's token"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
                    <Link
                      href={`/doctors/${doctor.slug}`}
                      className="flex-1 rounded-full border border-black/[0.08] py-2.5 text-center text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.03] dark:border-white/[0.12] dark:text-white"
                    >
                      View Profile
                    </Link>
                    <Link
                      href={`/book?doctor=${doctor.slug}`}
                      className="flex-1 rounded-full bg-[#0071E3] py-2.5 text-center text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] transition"
                    >
                      Book Token
                    </Link>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Clinical Facilities Gallery */}
          <div className="mt-16 rounded-[32px] border border-black/[0.06] bg-white p-6 sm:p-8 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-apple-teal dark:text-[#30D1BE]">
                  In-Person Excellence
                </span>
                <h3 className="mt-1 text-xl sm:text-2xl font-bold text-[#1D1D1F] dark:text-white">
                  State-of-the-Art Clinical Environments
                </h3>
                <p className="mt-1 text-xs text-[#86868B] dark:text-[#8E8E93]">
                  Modern facilities equipped with hygienic waiting lounges, private chambers, and automated digital counters.
                </p>
              </div>
              <Link
                href="/clinics"
                className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0071E3] dark:text-[#2997FF] hover:underline"
              >
                Browse clinics <ArrowRight className="h-4 w-4" />
              </Link>
            </div>

            <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="group relative h-44 overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
                <Image
                  src="/images/clinical/clinic-reception.jpg"
                  alt="Modern Clinic Reception"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
                  <span className="text-xs font-semibold text-white">OPD Reception &amp; Token Desk</span>
                </div>
              </div>

              <div className="group relative h-44 overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
                <Image
                  src="/images/clinical/consultation-room.jpg"
                  alt="Doctor Consultation Chamber"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
                  <span className="text-xs font-semibold text-white">Private Doctor Chambers</span>
                </div>
              </div>

              <div className="group relative h-44 overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
                <Image
                  src="/images/clinical/pharmacy-counter.jpg"
                  alt="In-House Clinic Pharmacy"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
                  <span className="text-xs font-semibold text-white">Direct Pharmacy Dispensary</span>
                </div>
              </div>

              <div className="group relative h-44 overflow-hidden rounded-2xl border border-black/[0.06] dark:border-white/[0.08]">
                <Image
                  src="/images/clinical/lab-diagnostics.jpg"
                  alt="Pathology diagnostics"
                  fill
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent flex items-end p-3">
                  <span className="text-xs font-semibold text-white">Digital Diagnostic Vault</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. TOP 8 SPECIALTIES WITH VIEW ALL LINK */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
                Top Specialties in Dehradun
              </span>
              <h2 className="mt-2 text-3xl font-black text-[#1D1D1F] dark:text-white sm:text-4xl tracking-tight">
                Consult by Medical Specialty
              </h2>
              <p className="mt-2 text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93]">
                Find experienced doctors across primary care, dermatology, surgery, and maternal care.
              </p>
            </div>
            <Link
              href="/specialties"
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0071E3] hover:underline dark:text-[#2997FF] shrink-0"
            >
              View all specialties <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-6">
            {topSpecialties.map((spec) => {
              const IconComp = spec.icon;
              return (
                <Link
                  key={spec.id}
                  href={`/search?specialty=${spec.slug}`}
                  className="rounded-[22px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between hover:shadow-apple-modal hover:scale-[1.02] transition cursor-pointer group"
                >
                  <div>
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-black/[0.03] dark:bg-white/[0.06] group-hover:bg-[#0071E3]/10 transition">
                      <IconComp />
                    </div>
                    <h3 className="mt-4 text-sm font-bold text-[#1D1D1F] dark:text-white group-hover:text-[#0071E3] dark:group-hover:text-[#2997FF] transition">
                      {spec.name}
                    </h3>
                    <p className="mt-1 text-[11px] text-[#86868B] dark:text-[#8E8E93] line-clamp-1">
                      {spec.desc}
                    </p>
                  </div>
                  <div className="mt-4 pt-2 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center justify-between text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">
                    <span>
                      {
                        directoryDoctors.filter((doctor) =>
                          matchesSpecialty(doctor.specialization || "", spec.name)
                        ).length
                      }{" "}
                      Doctors
                    </span>
                    <ArrowRight className="h-3 w-3 text-[#0071E3] opacity-0 group-hover:opacity-100 transition" />
                  </div>
                </Link>
              );
            })}
          </div>

          <div className="mt-10 text-center">
            <Link
              href="/specialties"
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-6 py-3 text-xs font-bold text-[#1D1D1F] hover:bg-black/[0.03] dark:border-white/[0.12] dark:bg-[#1C1C1E] dark:text-white shadow-sm transition"
            >
              <span>Explore All Medical Specialties in Dehradun</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. PATIENT EXPERIENCES & VERIFIED COMMUNITY REVIEWS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] dark:border-white/[0.08] bg-white/50 dark:bg-[#1C1C1E]/50">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
              Patient Experiences in Dehradun
            </span>
            <h2 className="mt-2 text-3xl font-black text-[#1D1D1F] dark:text-white sm:text-4xl tracking-tight">
              Real Care. Zero Aggregator Markup.
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93]">
              Read how local families in Dehradun skip crowded waiting rooms and consult doctors directly.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {reviewsLoading ? (
              <div className="md:col-span-3 rounded-[24px] border border-black/[0.06] bg-white p-10 text-center dark:border-white/[0.08] dark:bg-[#1C1C1E]">
                <div className="mx-auto h-9 w-9 rounded-full border-2 border-[#0071E3]/30 border-t-[#0071E3] animate-spin" />
                <p className="mt-3 text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">
                  Loading reviews…
                </p>
              </div>
            ) : landingReviews.length === 0 ? (
              <div className="md:col-span-3 rounded-[24px] border border-black/[0.06] bg-white p-10 text-center dark:border-white/[0.08] dark:bg-[#1C1C1E]">
                <Users className="mx-auto h-8 w-8 text-[#86868B]" />
                <p className="mt-3 text-sm font-bold text-[#1D1D1F] dark:text-white">
                  No reviews yet
                </p>
                <p className="mt-1 text-xs text-[#86868B] dark:text-[#8E8E93]">
                  {reviewsError ||
                    "Reviews from completed visits appear here automatically."}
                </p>
              </div>
            ) : (
              landingReviews.map((review) => {
                const doctor = directoryDoctors.find(
                  (item) => item.slug === review.doctor_slug
                );
                return (
                  <div
                    key={review.id}
                    className="rounded-[24px] border border-black/[0.06] bg-white p-7 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center gap-1 text-amber-500 mb-3 text-sm">
                        {"★".repeat(
                          Math.max(0, Math.min(5, Number(review.rating) || 0))
                        )}
                      </div>
                      <p className="text-xs sm:text-sm text-[#1D1D1F] dark:text-white leading-relaxed italic">
                        &ldquo;{review.comment || "Rated this visit."}&rdquo;
                      </p>
                    </div>
                    <div className="mt-6 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                      <div>
                        <div className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                          {review.patient_name || "Patient"}
                        </div>
                        <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">
                          {doctor?.full_name || review.doctor_slug || "Clinic visit"}
                          {doctor?.specialization ? ` • ${doctor.specialization}` : ""}
                        </div>
                      </div>
                      {review.is_verified_visit && (
                        <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          Verified Visit
                        </span>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </section>

      {/* 7. PATIENT SECURITY, PRIVACY & MEDICAL STANDARDS */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
              Patient First Protection
            </span>
            <h2 className="mt-2 text-3xl font-black text-[#1D1D1F] dark:text-white sm:text-4xl tracking-tight">
              Clinical Integrity You Can Trust
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93]">
              DocSphere is built with rigorous medical council and privacy safeguards.
            </p>
          </div>

          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            <div className="rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF]">
                <ShieldCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-[#1D1D1F] dark:text-white">Registered Doctors</h3>
              <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                Doctors publish their State Medical Council registration number and qualifications on their profile.
              </p>
            </div>

            <div className="rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <Receipt className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-[#1D1D1F] dark:text-white">₹0 Markup Guarantee</h3>
              <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                Pay direct doctor consultation fees via UPI or cash. Zero aggregator commissions and zero booking surcharges.
              </p>
            </div>

            <div className="rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                <Lock className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-[#1D1D1F] dark:text-white">DPDP Act Compliant</h3>
              <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                Your medical data and phone number are confidential. We never sell patient rosters to tele-pharmacies or marketing bots.
              </p>
            </div>

            <div className="rounded-[22px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
              <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
                <QrCode className="h-6 w-6" />
              </div>
              <h3 className="mt-4 text-sm font-bold text-[#1D1D1F] dark:text-white">SHA-256 Sealed Rx</h3>
              <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                Signed digital prescriptions carry a cryptographic seal and a scannable QR code resolving to the record.
              </p>
            </div>
          </div>

          {/* DIGNIFIED PROVIDER CALLOUT BANNER */}
          <div className="mt-14 rounded-[28px] border border-blue-500/20 bg-gradient-to-r from-blue-500/5 via-blue-500/10 to-teal-500/5 p-8 sm:p-10 dark:border-blue-500/30 dark:bg-white/[0.02] flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="max-w-2xl text-center md:text-left">
              <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 px-3 py-1 text-xs font-bold text-[#0071E3] dark:text-[#2997FF] mb-2">
                <Stethoscope className="h-3.5 w-3.5" />
                <span>For Independent Doctors &amp; Polyclinics</span>
              </div>
              <h3 className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white tracking-tight">
                Run your practice with ClinicOS
              </h3>
              <p className="mt-2 text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                Register a patient in 10 seconds. Prescribe in 30. Close your day in one tap. No paperwork, no app downloads. Just your clinic — running better. Starts at ₹599/month.
              </p>
            </div>
            <div className="shrink-0 flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <Link
                href="/for-doctors"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-[#0071E3] px-7 py-3.5 text-xs sm:text-sm font-bold text-white shadow-apple-sm hover:bg-[#0077ED] transition active:scale-95"
              >
                <span>See How It Works</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] dark:border-white/[0.08] bg-white/50 dark:bg-[#1C1C1E]/50">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
              Got Questions?
            </span>
            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
              Frequently Asked Questions
            </h2>
            <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93]">
              Everything you need to know about ClinicOS.
            </p>
          </div>

          <div className="mt-10 divide-y divide-black/[0.06] dark:divide-white/[0.08] rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-4 sm:p-6 shadow-apple-card">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-4 first:pt-0 last:pb-0">
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between text-left text-sm font-bold text-[#1D1D1F] dark:text-white focus:outline-none cursor-pointer"
                >
                  <span className="pr-4">{faq.q}</span>
                  <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-black/[0.04] dark:bg-white/[0.06] transition-transform duration-200 ${
                    openFaq === idx ? "rotate-180 bg-[#0071E3]/10 text-[#0071E3]" : "text-[#86868B]"
                  }`}>
                    <ChevronDown className="h-4 w-4" />
                  </div>
                </button>
                {openFaq === idx && (
                  <p className="mt-3 text-xs leading-relaxed text-[#86868B] dark:text-[#8E8E93] pr-8 animate-in fade-in duration-200">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 9. FOOTER */}
      <footer className="border-t border-black/[0.06] bg-[#ECEEF2] py-12 px-4 dark:border-white/[0.08] dark:bg-[#000000] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#86868B] dark:text-[#8E8E93]">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
              <Link href="/" className="font-bold text-[#1D1D1F] dark:text-white hover:underline">
                ClinicOS
              </Link>
            </div>
            <span className="hidden sm:inline">•</span>
            <span>Simple operating system for independent clinics</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 font-semibold">
            <Link href="/search" className="hover:text-[#1D1D1F] dark:hover:text-white">Find Doctors</Link>
            <Link href="/specialties" className="hover:text-[#1D1D1F] dark:hover:text-white">Specialties</Link>
            <Link href="/book" className="hover:text-[#1D1D1F] dark:hover:text-white">Book Token</Link>
            <Link href="/patient/portal" className="hover:text-[#1D1D1F] dark:hover:text-white">Patient Portal</Link>
            <Link href="/onboarding" className="text-[#0071E3] dark:text-[#2997FF] hover:underline font-bold">For Doctors</Link>
          </div>
        </div>
      </footer>
      {/* GROQ-POWERED PATIENT AI CONSULTANT */}
      <DocSphereAIAgent
        isOpenExternal={isAiAgentOpen}
        onCloseExternal={() => setIsAiAgentOpen(false)}
      />
    </div>
  );
}

