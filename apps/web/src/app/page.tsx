"use client";

import React, { useState } from "react";
import Link from "next/link";
import SiteHeader from "@/components/SiteHeader";
import InteractiveHeroSearch from "@/components/InteractiveHeroSearch";
import InteractivePlayground from "@/components/InteractivePlayground";
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

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(0);
  const [isAiAgentOpen, setIsAiAgentOpen] = useState(false);

  const topSpecialties = [
    {
      id: "general-physician",
      name: "General Physician",
      desc: "Fever, Infections, BP & Diabetes",
      icon: GeneralPhysicianIcon,
      doctorsCount: 18,
      slug: "general-physician"
    },
    {
      id: "dermatology",
      name: "Dermatology",
      desc: "Acne, Eczema, Hair Fall, Laser",
      icon: DermatologyIcon,
      doctorsCount: 12,
      slug: "dermatologist"
    },
    {
      id: "dentistry",
      name: "Dentistry",
      desc: "Root Canal, Tooth Pain, Braces",
      icon: DentistIcon,
      doctorsCount: 14,
      slug: "dentist"
    },
    {
      id: "pediatrics",
      name: "Pediatrics",
      desc: "Child OPD, Infant Care, Vaccines",
      icon: PediatricsIcon,
      doctorsCount: 10,
      slug: "pediatrician"
    },
    {
      id: "orthopaedics",
      name: "Orthopaedics",
      desc: "Joint Pain, Spine, Fractures",
      icon: OrthopaedicsIcon,
      doctorsCount: 15,
      slug: "orthopaedist"
    },
    {
      id: "obstetrics-gynaecology",
      name: "Obstetrics & Gynae",
      desc: "PCOS, Pregnancy Care, Women's Health",
      icon: ObstetricsIcon,
      doctorsCount: 11,
      slug: "gynaecologist"
    },
    {
      id: "ent",
      name: "ENT Specialist",
      desc: "Ear Pain, Sinus, Tonsils, Vertigo",
      icon: EntIcon,
      doctorsCount: 9,
      slug: "ent-specialist"
    },
    {
      id: "diabetology",
      name: "Diabetology",
      desc: "Sugar Control, Thyroid, Metabolic",
      icon: DiabetologyIcon,
      doctorsCount: 8,
      slug: "diabetologist"
    }
  ];

  const comparisonRows = [
    {
      feature: "Consultation Fee",
      docsphere: "100% Direct Doctor Fee (₹0 Markup)",
      docsphereGood: true,
      aggregators: "15% – 25% Commission added to clinic fee",
      aggregatorsGood: false
    },
    {
      feature: "Doctor Discovery",
      docsphere: "Pure Clinical Merit & Dehradun Proximity",
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
      docsphere: "Tamper-proof SHA-256 PDF on WhatsApp",
      docsphereGood: true,
      aggregators: "Locked inside proprietary app store app",
      aggregatorsGood: false
    },
    {
      feature: "Patient Data Privacy",
      docsphere: "Confidential Doctor-Patient relationship",
      docsphereGood: true,
      aggregators: "Phone numbers shared with third-party vendors",
      aggregatorsGood: false
    }
  ];

  const faqs = [
    {
      q: "How does DocSphere offer zero-markup healthcare?",
      a: "Traditional aggregators charge independent doctors 15% to 25% commission on every appointment, which pushes up patient fees. DocSphere charges doctors a simple flat software tool fee (from ₹0 to ₹499/mo). Patients pay the doctor's exact consultation fee directly via UPI or cash at the desk with zero commission or convenience surcharges."
    },
    {
      q: "Do I need to download an application to book or track my token?",
      a: "No app downloads required. When you book a consultation on DocSphere, your live token number, clinic address, and real-time wait time are delivered directly to your web browser and WhatsApp. You can track your position in the OPD queue from anywhere in Dehradun."
    },
    {
      q: "How does the live token queue prevent waiting room crowds?",
      a: "DocSphere links the doctor's consulting room directly to your phone. When Dr. Rahul Sharma or Dr. Aditi Joshi calls Token #2, your phone updates instantly with the expected wait time (~15 min). You only need to reach the counter when your token is near."
    },
    {
      q: "Are all doctors on DocSphere verified medical practitioners?",
      a: "Yes. Every doctor profile displays verified State Medical Council registration credentials (e.g. NMC Reg. UKMC-8942-2012 / Uttarakhand Dental Council UDC-4120-2016) and qualification degrees. All digital prescriptions include UPPERCASE generic drug names per NMC guidelines."
    },
    {
      q: "How does a clinic or polyclinic join the DocSphere network?",
      a: "Independent practitioners along Rajpur Road, EC Road, Chakrata Road, and Haridwar Road can onboard their practice in under 60 seconds. DocSphere ClinicOS provides their front desk with acoustic chime calling, 30-second prescriptions, and automated 9 PM cash drawer closing reconciliation."
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
            <span>Dehradun&apos;s Verified Direct Healthcare Network</span>
          </div>

          {/* Grand Headline */}
          <h1 className="text-4xl sm:text-6xl lg:text-7xl font-black tracking-[-0.04em] text-[#1D1D1F] dark:text-white leading-[1.08]">
            Zero-Markup Healthcare <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#0071E3] via-[#00A389] to-[#30D158] bg-clip-text text-transparent">
              in Dehradun.
            </span>
          </h1>

          <p className="mx-auto mt-5 max-w-2xl text-sm sm:text-lg text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Consult top verified doctors directly. Upfront fees, live counter token queues on your phone, and instant WhatsApp prescriptions. Zero aggregator commissions.
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
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> 100% Direct Doctor Fee</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Live Counter Token Tracking</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Verified Council Credentials</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Digital Rx on WhatsApp</span>
          </div>
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
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-400 font-bold font-mono text-sm">
                  01
                </div>
                <h3 className="mt-4 text-base font-bold text-[#1D1D1F] dark:text-white">
                  Search Verified Doctors
                </h3>
                <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  Browse independent doctors across Rajpur Road, EC Road, and Chakrata Road by specialty, medical council license, and transparent fee.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.04] text-[11px] font-semibold text-blue-600 dark:text-blue-400">
                100% Licensed Practitioners
              </div>
            </div>

            {/* Step 2 */}
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 font-bold font-mono text-sm">
                  02
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
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 font-bold font-mono text-sm">
                  03
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
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 font-bold font-mono text-sm">
                  04
                </div>
                <h3 className="mt-4 text-base font-bold text-[#1D1D1F] dark:text-white">
                  Direct Care &amp; WhatsApp Rx
                </h3>
                <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  Consult in person, pay the doctor directly via UPI or cash, and receive your tamper-proof prescription PDF instantly on WhatsApp.
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
                Verified practitioners with synchronized counter token numbers and genuine patient ratings.
              </p>
            </div>
            <Link 
              href="/search" 
              className="inline-flex items-center gap-1.5 text-xs sm:text-sm font-bold text-[#0071E3] hover:underline dark:text-[#2997FF] shrink-0"
            >
              View all 20+ Dehradun doctors <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {/* Doctor 1 */}
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-full bg-teal-50 dark:bg-teal-950/60 px-2.5 py-1 text-[11px] font-bold text-teal-700 dark:text-teal-300">
                      Dermatology &amp; Laser
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-[#1D1D1F] dark:text-white">
                      Dr. Rahul Sharma
                    </h3>
                    <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                      MD (Dermatology) • NMC Reg. UKMC-8942-2012
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ⭐ 4.9 (142 reviews)
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-[#86868B] dark:text-[#8E8E93]">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-[#1D1D1F] dark:text-white" />
                    <span>Derma Care Skin &amp; Laser Centre</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    <span>14, Rajpur Road, Near Ashley Hall, Dehradun</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-black/[0.05] pt-3 text-xs dark:border-white/[0.06]">
                  <div>
                    <span className="text-[10px] uppercase text-[#86868B] block font-bold">Consultation Fee</span>
                    <span className="font-extrabold text-[#1D1D1F] dark:text-white">₹600 (0% markup)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 block font-bold">Live Counter OPD</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Token #2 in room</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
                <Link
                  href="/doctors/dr-rahul-sharma"
                  className="flex-1 rounded-full border border-black/[0.08] py-2.5 text-center text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.03] dark:border-white/[0.12] dark:text-white"
                >
                  View Profile
                </Link>
                <Link
                  href="/book?doctor=dr-rahul-sharma"
                  className="flex-1 rounded-full bg-[#0071E3] py-2.5 text-center text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] transition"
                >
                  Book Token
                </Link>
              </div>
            </div>

            {/* Doctor 2 */}
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-full bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 text-[11px] font-bold text-blue-700 dark:text-blue-300">
                      Dental &amp; Oral Surgery
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-[#1D1D1F] dark:text-white">
                      Dr. Aditi Joshi
                    </h3>
                    <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                      MDS (Endodontics) • UDC-4120-2016
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ⭐ 4.8 (98 reviews)
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-[#86868B] dark:text-[#8E8E93]">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-[#1D1D1F] dark:text-white" />
                    <span>Smile Craft Dental Studio</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    <span>42, EC Road, Near Survey Chowk, Dehradun</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-black/[0.05] pt-3 text-xs dark:border-white/[0.06]">
                  <div>
                    <span className="text-[10px] uppercase text-[#86868B] block font-bold">Consultation Fee</span>
                    <span className="font-extrabold text-[#1D1D1F] dark:text-white">₹400 (0% markup)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-emerald-600 dark:text-emerald-400 block font-bold">Live Counter OPD</span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">Token #1 in room</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
                <Link
                  href="/doctors/dr-aditi-joshi"
                  className="flex-1 rounded-full border border-black/[0.08] py-2.5 text-center text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.03] dark:border-white/[0.12] dark:text-white"
                >
                  View Profile
                </Link>
                <Link
                  href="/book?doctor=dr-aditi-joshi"
                  className="flex-1 rounded-full bg-[#0071E3] py-2.5 text-center text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] transition"
                >
                  Book Token
                </Link>
              </div>
            </div>

            {/* Doctor 3 */}
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-full bg-purple-50 dark:bg-purple-950/60 px-2.5 py-1 text-[11px] font-bold text-purple-700 dark:text-purple-300">
                      Pediatrics &amp; Child OPD
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-[#1D1D1F] dark:text-white">
                      Dr. Vikram Sethi
                    </h3>
                    <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                      DNB (Pediatrics) • UKMC Reg. 7312
                    </p>
                  </div>
                  <div className="rounded-full bg-emerald-500/10 px-2.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                    ⭐ 4.95 (165 reviews)
                  </div>
                </div>

                <div className="mt-4 space-y-1.5 text-xs text-[#86868B] dark:text-[#8E8E93]">
                  <div className="flex items-center gap-1.5">
                    <Building2 className="h-3.5 w-3.5 shrink-0 text-[#1D1D1F] dark:text-white" />
                    <span>Dron Child &amp; Newborn Clinic</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <MapPin className="h-3.5 w-3.5 shrink-0 text-red-500" />
                    <span>88, Chakrata Road, Ballupur, Dehradun</span>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between border-t border-black/[0.05] pt-3 text-xs dark:border-white/[0.06]">
                  <div>
                    <span className="text-[10px] uppercase text-[#86868B] block font-bold">Consultation Fee</span>
                    <span className="font-extrabold text-[#1D1D1F] dark:text-white">₹500 (0% markup)</span>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase text-amber-600 dark:text-amber-400 block font-bold">Morning OPD</span>
                    <span className="font-bold text-amber-600 dark:text-amber-400">Next Slot 11:30 AM</span>
                  </div>
                </div>
              </div>

              <div className="mt-6 flex gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
                <Link
                  href="/doctors/dr-vikram-sethi"
                  className="flex-1 rounded-full border border-black/[0.08] py-2.5 text-center text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.03] dark:border-white/[0.12] dark:text-white"
                >
                  View Profile
                </Link>
                <Link
                  href="/book?doctor=dr-vikram-sethi"
                  className="flex-1 rounded-full bg-[#0071E3] py-2.5 text-center text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] transition"
                >
                  Book Token
                </Link>
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
              View all 24 specialties <ArrowRight className="h-4 w-4" />
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
                    <span>{spec.doctorsCount} Doctors</span>
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
              <span>Explore All 24 Medical Specialties in Dehradun</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </section>

      {/* 6. FOR DOCTORS & POLYCLINICS (DOCSPHERE CLINICOS PLATFORM) */}
      <section id="for-doctors" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] dark:border-white/[0.08] bg-gradient-to-b from-transparent to-black/[0.02] dark:to-white/[0.02]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/10 border border-blue-500/20 px-3.5 py-1 text-xs font-bold text-[#0071E3] dark:text-[#2997FF] mb-3">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>DocSphere ClinicOS for Providers</span>
            </div>
            <h2 className="text-3xl font-black text-[#1D1D1F] dark:text-white sm:text-5xl tracking-tight">
              The operating infrastructure for independent practices.
            </h2>
            <p className="mt-4 text-xs sm:text-base text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
              Tired of aggregators taking 20% to 25% commissions and owning your patient roster? DocSphere ClinicOS runs your physical clinic: 30-second digital Rx, acoustic counter token chimes, waiting room TV wall displays, and 9 PM cash drawer closing reconciliation.
            </p>
          </div>

          {/* 3 Core Provider Pillars */}
          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {/* Pillar 1 */}
            <div className="rounded-[28px] border border-black/[0.06] bg-white p-7 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF]">
                  <FileText className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#1D1D1F] dark:text-white">
                  30-Second Prescription Pad
                </h3>
                <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  Fastest consultation tool in India. Generic drug enforcement, verified State Medical Council license, and tamper-proof SHA-256 digital signature dispatched to patient WhatsApp instantly.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-black/[0.05] dark:border-white/[0.06]">
                <Link href="/dashboard/consult/1" className="text-xs font-bold text-[#0071E3] hover:underline flex items-center gap-1">
                  Try Prescription Pad Demo <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-[28px] border border-black/[0.06] bg-white p-7 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-[#00A389]/10 text-[#00A389] dark:text-[#30D1BE]">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#1D1D1F] dark:text-white">
                  Front Desk Counter Console PWA
                </h3>
                <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  10-second walk-in admitting, dual-tone Web Audio acoustic calling chime, and 9 PM cash drawer reconciliation that locks against physical currency counts.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-black/[0.05] dark:border-white/[0.06]">
                <Link href="/clinic/desk" className="text-xs font-bold text-[#00A389] hover:underline flex items-center gap-1">
                  Explore Counter Console <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-[28px] border border-black/[0.06] bg-white p-7 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
                  <Activity className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-[#1D1D1F] dark:text-white">
                  Simultaneous Multi-Doctor Chambers
                </h3>
                <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  Run multi-doctor polyclinics with independent room rosters, waiting room Smart TV wall displays, and automated fee splits for visiting consultants.
                </p>
              </div>
              <div className="mt-6 pt-4 border-t border-black/[0.05] dark:border-white/[0.06]">
                <Link href="/dashboard/chambers" className="text-xs font-bold text-purple-600 hover:underline flex items-center gap-1">
                  View Multi-Chamber Hub <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Interactive Playground Simulator (Placed for Providers) */}
          <div className="mt-14">
            <InteractivePlayground />
          </div>

          {/* Doctor Onboarding CTA */}
          <div className="mt-12 text-center flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] px-8 py-3.5 text-xs sm:text-sm font-bold text-white shadow-apple-sm hover:bg-[#0077ED] active:scale-95 transition"
            >
              <Stethoscope className="h-4 w-4" />
              <span>Join as Doctor (&lt; 60s AI Setup)</span>
            </Link>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-6 py-3.5 text-xs sm:text-sm font-semibold text-[#1D1D1F] hover:bg-black/[0.02] dark:border-white/[0.12] dark:bg-[#1C1C1E] dark:text-white shadow-sm"
            >
              <span>Explore Provider Suite</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 7. PRICING: 3 SIMPLE TIERS */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
              Transparent Doctor Pricing
            </span>
            <h2 className="mt-2 text-3xl font-black text-[#1D1D1F] dark:text-white sm:text-4xl tracking-tight">
              Flat software fee. Zero patient commissions.
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#86868B] dark:text-[#8E8E93]">
              Never surrender 20% of your clinical earnings. Keep 100% of patient fees via direct UPI.
            </p>
          </div>

          <div className="mt-14 grid gap-6 md:grid-cols-3">
            {/* Free Starter */}
            <div className="rounded-[28px] border border-black/[0.06] bg-white p-8 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Starter Doctor</h3>
                <p className="mt-1 text-xs text-[#86868B] dark:text-[#8E8E93]">For setting up your initial digital clinic presence.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">₹0</span>
                  <span className="text-xs text-[#86868B] dark:text-[#8E8E93]">/ forever</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Verified Doctor Profile</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Google Maps Discovery</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Up to 30 Appointments/mo</li>
                </ul>
              </div>
              <Link 
                href="/onboarding" 
                className="mt-8 block w-full rounded-full border border-black/[0.08] py-2.5 text-center text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.03] dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.05]"
              >
                Get Started Free
              </Link>
            </div>

            {/* Solo Pro */}
            <div className="rounded-[28px] border-2 border-[#0071E3] bg-white p-8 shadow-apple-modal dark:bg-[#1C1C1E] flex flex-col justify-between relative">
              <div className="absolute -top-3 right-8 rounded-full bg-[#0071E3] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Solo Practice Pro</h3>
                <p className="mt-1 text-xs text-[#86868B] dark:text-[#8E8E93]">For busy independent single-doctor chambers.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">₹499</span>
                  <span className="text-xs text-[#86868B] dark:text-[#8E8E93]">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Unlimited Live Token Queue</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> 30-Sec Digital Rx Studio</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Direct WhatsApp Rx PDF Delivery</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Soundbox UPI Reconciliation</li>
                </ul>
              </div>
              <Link 
                href="/onboarding" 
                className="mt-8 block w-full rounded-full bg-[#0071E3] py-2.5 text-center text-xs font-bold text-white shadow-apple-sm hover:bg-[#0077ED]"
              >
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Clinic */}
            <div className="rounded-[28px] border border-black/[0.06] bg-white p-8 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Multi-Doctor Polyclinic</h3>
                <p className="mt-1 text-xs text-[#86868B] dark:text-[#8E8E93]">For polyclinics and multi-chamber centers.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">₹1,999</span>
                  <span className="text-xs text-[#86868B] dark:text-[#8E8E93]">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Up to 8 Doctor Chambers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Front-Desk Reception PWA</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Clinic P&amp;L and Drawer Audit Ledger</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Multi-Chamber Audio Chimes</li>
                </ul>
              </div>
              <Link 
                href="/onboarding" 
                className="mt-8 block w-full rounded-full border border-black/[0.08] py-2.5 text-center text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.03] dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.05]"
              >
                Upgrade to Polyclinic
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
              Everything you need to know about DocSphere zero-markup healthcare.
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

      {/* 9. APPLE MINIMAL FOOTER */}
      <footer className="border-t border-black/[0.06] bg-[#ECEEF2] py-12 px-4 dark:border-white/[0.08] dark:bg-[#000000] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col md:flex-row items-center justify-between gap-6 text-xs text-[#86868B] dark:text-[#8E8E93]">
          <div className="flex flex-col sm:flex-row items-center gap-2 sm:gap-3 text-center sm:text-left">
            <div className="flex items-center gap-2">
              <Stethoscope className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
              <Link href="https://medic-sept-2026.vercel.app/" className="font-bold text-[#1D1D1F] dark:text-white hover:underline">
                DocSphere
              </Link>
            </div>
            <span className="hidden sm:inline">•</span>
            <span>Zero-Markup Healthcare Infrastructure for Dehradun, Uttarakhand</span>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-5 font-semibold">
            <Link href="/search" className="hover:text-[#1D1D1F] dark:hover:text-white">Find Doctors</Link>
            <Link href="/specialties" className="hover:text-[#1D1D1F] dark:hover:text-white">Specialties</Link>
            <Link href="/book" className="hover:text-[#1D1D1F] dark:hover:text-white">Book Token</Link>
            <Link href="/patient/portal" className="hover:text-[#1D1D1F] dark:hover:text-white">Prescriptions &amp; Bills</Link>
            <Link href="/onboarding" className="text-[#0071E3] dark:text-[#2997FF] hover:underline font-bold">For Doctors (ClinicOS)</Link>
          </div>
        </div>
      </footer>

      {/* MULTI-TASK DOCSPHERE AI CONSULTANT AGENT */}
      <DocSphereAIAgent
        isOpenExternal={isAiAgentOpen}
        onCloseExternal={() => setIsAiAgentOpen(false)}
      />
    </div>
  );
}
