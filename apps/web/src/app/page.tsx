"use client";

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import InteractiveHeroSearch from "@/components/InteractiveHeroSearch";
import InteractivePlayground from "@/components/InteractivePlayground";
import BrowseSpecialtiesSection from "@/components/BrowseSpecialtiesSection";
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
  Smartphone,
  CreditCard,
  Pill,
  Microscope,
  FlaskConical,
  ChevronDown,
  Phone,
  QrCode,
  Lock,
  Zap,
  Activity
} from "lucide-react";

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How is DocSphere different from Practo or generic listing directories?",
      a: "Practo operates as an aggregator marketplace where they own your patient relationships and charge heavy commissions on consultations. DocSphere is a direct operating system: you own your patients, get your own branded subdomain, retain 100% of consultation fees directly via UPI, and pay a flat tool fee."
    },
    {
      q: "Do patients need to download an application to book or view prescriptions?",
      a: "No app downloads required. Patients receive their live token position, payment links, and tamper-proof digital prescription PDFs directly on WhatsApp or SMS via a secure, passwordless web link."
    },
    {
      q: "Is DocSphere compliant with National Medical Commission (NMC) regulations?",
      a: "Yes. All digital prescriptions enforce UPPERCASE generic chemical names, display verified State Medical Council registration numbers prominently, and embed a SHA-256 cryptographic signature to guarantee tamper-proofing."
    },
    {
      q: "What hardware does the Reception Desk require?",
      a: "Any desktop computer, laptop, iPad/tablet, or mobile phone with a modern web browser. The counter console works as an offline-resilient Progressive Web App (PWA) with built-in acoustic chime call bells."
    },
    {
      q: "How does the Dehradun pilot network operate?",
      a: "Independent practitioners along Rajpur Road, EC Road, and Chakrata Road have live profiles with synchronized counter token numbers, verified NMC badges, and local patient discovery."
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#ECEEF2] text-[#1D1D1F] dark:bg-[#000000] dark:text-[#F5F5F7]">
      {/* 1. APPLE TRANSLUCENT NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-[#ECEEF2]/80 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#000000]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#0071E3] text-white shadow-sm transition group-hover:scale-105">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold tracking-tight text-[#1D1D1F] dark:text-white">DocSphere</span>
                <span className="text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">ClinicOS</span>
              </div>
            </Link>
          </div>

          {/* Patient-Centric Navigation */}
          <nav className="hidden items-center gap-1 sm:flex rounded-full bg-black/[0.04] p-1 dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06]">
            <Link 
              href="/search" 
              className="rounded-full px-4 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-white dark:text-white dark:hover:bg-white/10 transition shadow-sm"
            >
              Find Doctors
            </Link>
            <Link 
              href="/specialties" 
              className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition"
            >
              Specialties
            </Link>
            <Link 
              href="/book" 
              className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition"
            >
              Book Appointment
            </Link>
            <Link 
              href="/patient/portal" 
              className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition"
            >
              My Prescriptions &amp; Reports
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {/* Direct Switch to Provider Suite */}
            <Link
              href="/for-doctors"
              className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-50/80 px-4 py-2 text-xs font-bold text-[#0071E3] hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-[#2997FF] dark:hover:bg-blue-900/40 transition shadow-2xs group"
            >
              <span>For Doctors &amp; Clinics</span>
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. APPLE HERO SECTION */}
      <section className="relative px-4 pt-16 pb-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl text-center">
          {/* Eyebrow Pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-black/[0.06] bg-white px-4 py-1.5 text-xs font-semibold text-[#1D1D1F] shadow-apple-sm dark:border-white/[0.12] dark:bg-[#1C1C1E] dark:text-white">
            <Sparkles className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF]" />
            <span>The Operating Infrastructure for Independent Doctors</span>
          </div>

          {/* Apple Grand Headline */}
          <h1 className="text-5xl font-black tracking-[-0.04em] text-[#1D1D1F] dark:text-white sm:text-7xl lg:text-8xl leading-[1.04]">
            Your clinic. <br className="hidden sm:inline" />
            <span className="bg-gradient-to-r from-[#0071E3] via-[#00A389] to-[#30D158] bg-clip-text text-transparent">
              Online. Connected.
            </span>
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-base text-[#86868B] dark:text-[#8E8E93] sm:text-xl leading-relaxed">
            Everything an independent practice needs: verified digital presence, live token queues with counter chimes, 30-second prescriptions, and direct WhatsApp delivery. Zero aggregator commissions.
          </p>

          {/* Interactive Search Grid */}
          <div className="mt-8">
            <InteractiveHeroSearch />
          </div>

          {/* Apple Pill Action Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3.5">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] px-7 py-3.5 text-sm font-bold text-white shadow-apple-sm hover:bg-[#0077ED] active:scale-95 transition"
            >
              <Stethoscope className="h-4 w-4" />
              <span>Join as Doctor (&lt; 60s AI Setup)</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full border border-black/[0.08] bg-white px-7 py-3.5 text-sm font-semibold text-[#1D1D1F] shadow-apple-sm hover:bg-black/[0.02] active:scale-95 transition dark:border-white/[0.12] dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-white/[0.04]"
            >
              <UserCheck className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
              <span>1-Click Interactive Demo</span>
            </Link>
          </div>

          {/* Trust Value Points */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> 0% Aggregator Commission</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> WhatsApp Rx PDF Delivery</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> 100% Doctor-Owned Brand</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> NMC & DPDP Act Compliant</span>
          </div>
        </div>

        {/* 3. INTERACTIVE PLAYGROUND TEST-DRIVE */}
        <div className="mt-12">
          <InteractivePlayground />
        </div>
      </section>

      {/* 3.5 BROWSE BY SPECIALTIES & WHY BOOK DIRECT */}
      <BrowseSpecialtiesSection />

      {/* 4. APPLE BENTO-GRID FEATURE PILLARS */}
      <section id="features" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
              Architecture Overview
            </span>
            <h2 className="mt-2 text-3xl font-black text-[#1D1D1F] dark:text-white sm:text-5xl tracking-tight">
              Engineered for ground-level Indian OPD reality.
            </h2>
            <p className="mt-4 text-sm sm:text-base text-[#86868B] dark:text-[#8E8E93]">
              Simple enough for a 10-second front desk check-in. Powerful enough to run your entire practice.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {/* Card 1: For Doctors */}
            <div className="rounded-[28px] border border-black/[0.06] bg-white p-8 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between hover:shadow-apple-modal transition">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF]">
                  <Stethoscope className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                  For Independent Doctors
                </h3>
                <p className="mt-2 text-sm text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  Stop being an interchangeable search row. Get your own branded digital presence, 30-second prescription kits, and verified Google Maps ranking.
                </p>

                <ul className="mt-6 space-y-3 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#30D158]" />
                    <span>AI-synthesized profile in &lt; 60 seconds</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#30D158]" />
                    <span>1-click specialty prescription presets</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#30D158]" />
                    <span>Tamper-proof SHA-256 digital signatures</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-black/[0.05] dark:border-white/[0.06]">
                <Link 
                  href="/doctor/queue" 
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0071E3] hover:underline dark:text-[#2997FF]"
                >
                  Explore Doctor Chamber <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 2: For Front Desk */}
            <div className="rounded-[28px] border border-black/[0.06] bg-white p-8 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between hover:shadow-apple-modal transition">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#00A389]/10 text-[#00A389] dark:text-[#30D1BE]">
                  <Building2 className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                  For Front-Desk Reception
                </h3>
                <p className="mt-2 text-sm text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  A high-speed counter PWA for laptop or iPad. Eliminate waiting room chaos with live token calling, acoustic counter chimes, and Soundbox UPI reconciliation.
                </p>

                <ul className="mt-6 space-y-3 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#30D158]" />
                    <span>10-second walk-in token generator</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#30D158]" />
                    <span>Dual-tone Web Audio acoustic chime</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#30D158]" />
                    <span>Soundbox UPI & cash daily day-book</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-black/[0.05] dark:border-white/[0.06]">
                <Link 
                  href="/clinic/desk" 
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#00A389] hover:underline dark:text-[#30D1BE]"
                >
                  Explore Counter Console <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Card 3: For Patients */}
            <div className="rounded-[28px] border border-black/[0.06] bg-white p-8 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between hover:shadow-apple-modal transition">
              <div>
                <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[#FF9500]/10 text-[#FF9500] dark:text-[#FF9F0A]">
                  <UserCheck className="h-6 w-6" />
                </div>
                <h3 className="mt-6 text-xl font-bold text-[#1D1D1F] dark:text-white tracking-tight">
                  For Patients
                </h3>
                <p className="mt-2 text-sm text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  Zero friction. Zero app store downloads. Patients receive their live token position, verified prescription PDF, and dosage alarms directly on WhatsApp.
                </p>

                <ul className="mt-6 space-y-3 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#30D158]" />
                    <span>Live phone queue tracker with wait times</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#30D158]" />
                    <span>Passwordless prescriptions &amp; reports on WhatsApp</span>
                  </li>
                  <li className="flex items-center gap-2.5">
                    <CheckCircle2 className="h-4 w-4 text-[#30D158]" />
                    <span>Verified Medical Council credentials</span>
                  </li>
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-black/[0.05] dark:border-white/[0.06]">
                <Link 
                  href="/patient/portal" 
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-[#FF9500] hover:underline dark:text-[#FF9F0A]"
                >
                  View Prescriptions &amp; Reports <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PILOT CLINICS SHOWCASE (Dehradun Pilot) */}
      <section id="pilot-clinics" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF] flex items-center gap-1.5">
                <MapPin className="h-4 w-4" /> Ground Deployment
              </span>
              <h2 className="mt-2 text-3xl font-black text-[#1D1D1F] dark:text-white sm:text-4xl tracking-tight">
                Live Clinics Powered by DocSphere
              </h2>
            </div>
            <Link 
              href="/search" 
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[#0071E3] hover:underline dark:text-[#2997FF]"
            >
              View all 20+ Dehradun doctors <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {/* Clinic 1 */}
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-semibold text-[#1D1D1F] dark:bg-white/[0.08] dark:text-white">
                      Dermatology
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-[#1D1D1F] dark:text-white">Derma Care Skin & Laser</h3>
                    <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">Dr. Rahul Sharma (MD Derm)</p>
                  </div>
                  <div className="rounded-full bg-[#30D158]/10 px-2.5 py-1 text-xs font-bold text-[#34C759] dark:text-[#30D158]">
                    ⭐ 4.9
                  </div>
                </div>

                <p className="mt-3 text-xs text-[#86868B] dark:text-[#8E8E93]">
                  14, Rajpur Road, Near Ashley Hall, Dehradun
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-black/[0.05] pt-3 text-xs dark:border-white/[0.06]">
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">Fee: ₹600</span>
                  <span className="text-[#34C759] dark:text-[#30D158] font-bold">OPD Active: Token #2</span>
                </div>
              </div>

              <div className="mt-5 flex gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
                <Link
                  href="/doctors/dr-rahul-sharma"
                  className="flex-1 rounded-full border border-black/[0.08] py-2 text-center text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.03] dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.05]"
                >
                  Profile
                </Link>
                <Link
                  href="/book?doctor=dr-rahul-sharma"
                  className="flex-1 rounded-full bg-[#0071E3] py-2 text-center text-xs font-bold text-white shadow-sm hover:bg-[#0077ED]"
                >
                  Book Token
                </Link>
              </div>
            </div>

            {/* Clinic 2 */}
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-semibold text-[#1D1D1F] dark:bg-white/[0.08] dark:text-white">
                      Dentistry
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-[#1D1D1F] dark:text-white">Smile Craft Dental</h3>
                    <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">Dr. Aditi Joshi (MDS Endodontics)</p>
                  </div>
                  <div className="rounded-full bg-[#30D158]/10 px-2.5 py-1 text-xs font-bold text-[#34C759] dark:text-[#30D158]">
                    ⭐ 4.8
                  </div>
                </div>

                <p className="mt-3 text-xs text-[#86868B] dark:text-[#8E8E93]">
                  42, EC Road, Near Survey Chowk, Dehradun
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-black/[0.05] pt-3 text-xs dark:border-white/[0.06]">
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">Fee: ₹400</span>
                  <span className="text-[#34C759] dark:text-[#30D158] font-bold">OPD Active: Token #1</span>
                </div>
              </div>

              <div className="mt-5 flex gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
                <Link
                  href="/doctors/dr-aditi-joshi"
                  className="flex-1 rounded-full border border-black/[0.08] py-2 text-center text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.03] dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.05]"
                >
                  Profile
                </Link>
                <Link
                  href="/book?doctor=dr-aditi-joshi"
                  className="flex-1 rounded-full bg-[#0071E3] py-2 text-center text-xs font-bold text-white shadow-sm hover:bg-[#0077ED]"
                >
                  Book Token
                </Link>
              </div>
            </div>

            {/* Clinic 3 */}
            <div className="rounded-[24px] border border-black/[0.06] bg-white p-6 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="rounded-full bg-black/[0.04] px-2.5 py-1 text-[11px] font-semibold text-[#1D1D1F] dark:bg-white/[0.08] dark:text-white">
                      Pediatrics
                    </span>
                    <h3 className="mt-3 text-lg font-bold text-[#1D1D1F] dark:text-white">Dron Child & Newborn</h3>
                    <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">Dr. Vikram Sethi (DNB Pediatrics)</p>
                  </div>
                  <div className="rounded-full bg-[#30D158]/10 px-2.5 py-1 text-xs font-bold text-[#34C759] dark:text-[#30D158]">
                    ⭐ 4.95
                  </div>
                </div>

                <p className="mt-3 text-xs text-[#86868B] dark:text-[#8E8E93]">
                  88, Chakrata Road, Ballupur, Dehradun
                </p>

                <div className="mt-4 flex items-center justify-between border-t border-black/[0.05] pt-3 text-xs dark:border-white/[0.06]">
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">Fee: ₹500</span>
                  <span className="text-[#FF9500] dark:text-[#FF9F0A] font-bold">OPD Slot: Next 11:30 AM</span>
                </div>
              </div>

              <div className="mt-5 flex gap-2 pt-3 border-t border-black/[0.05] dark:border-white/[0.06]">
                <Link
                  href="/doctors/dr-vikram-sethi"
                  className="flex-1 rounded-full border border-black/[0.08] py-2 text-center text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.03] dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.05]"
                >
                  Profile
                </Link>
                <Link
                  href="/book?doctor=dr-vikram-sethi"
                  className="flex-1 rounded-full bg-[#0071E3] py-2 text-center text-xs font-bold text-white shadow-sm hover:bg-[#0077ED]"
                >
                  Book Token
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. APPLE HIG PRICING SECTION */}
      <section id="pricing" className="py-24 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-7xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
              Simple Transparent Pricing
            </span>
            <h2 className="mt-2 text-3xl font-black text-[#1D1D1F] dark:text-white sm:text-4xl tracking-tight">
              Flat tool fee. Zero patient commissions.
            </h2>
            <p className="mt-3 text-sm text-[#86868B] dark:text-[#8E8E93]">
              Never surrender 20% of your earnings. Keep 100% of patient fees via direct UPI.
            </p>
          </div>

          <div className="mt-16 grid gap-6 md:grid-cols-3">
            {/* Free */}
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
                Get Started
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
                Start 14-Day Trial
              </Link>
            </div>

            {/* Clinic */}
            <div className="rounded-[28px] border border-black/[0.06] bg-white p-8 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Multi-Doctor Clinic</h3>
                <p className="mt-1 text-xs text-[#86868B] dark:text-[#8E8E93]">For polyclinics and multi-chamber centers.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">₹1,999</span>
                  <span className="text-xs text-[#86868B] dark:text-[#8E8E93]">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Up to 8 Doctor Chambers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Front-Desk Reception PWA</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Clinic P&L and Expense Ledger</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Multi-Chamber Audio Chimes</li>
                </ul>
              </div>
              <Link 
                href="/onboarding" 
                className="mt-8 block w-full rounded-full border border-black/[0.08] py-2.5 text-center text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.03] dark:border-white/[0.12] dark:text-white dark:hover:bg-white/[0.05]"
              >
                Upgrade to Clinic
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 7. APPLE CLEAN FAQ ACCORDION */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-3xl">
          <div className="text-center">
            <h2 className="text-3xl font-black tracking-tight text-[#1D1D1F] dark:text-white">Frequently Asked Questions</h2>
            <p className="mt-2 text-xs text-[#86868B] dark:text-[#8E8E93]">Everything you need to know about DocSphere ClinicOS</p>
          </div>

          <div className="mt-10 divide-y divide-black/[0.06] dark:divide-white/[0.08]">
            {faqs.map((faq, idx) => (
              <div key={idx} className="py-5">
                <button
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="flex w-full items-center justify-between text-left text-sm font-semibold text-[#1D1D1F] dark:text-white focus:outline-none"
                >
                  <span>{faq.q}</span>
                  <ChevronDown
                    className={`h-4 w-4 text-[#86868B] transition-transform duration-200 ${
                      openFaq === idx ? "rotate-180 text-[#0071E3]" : ""
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <p className="mt-3 text-xs leading-relaxed text-[#86868B] dark:text-[#8E8E93]">
                    {faq.a}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 7.5 DEDICATED CALLOUT: ARE YOU A DOCTOR OR CLINIC OWNER? */}
      <section className="px-4 py-12 sm:px-6 lg:px-8 bg-gradient-to-r from-blue-900 via-indigo-950 to-slate-950 text-white border-t border-b border-black/[0.08]">
        <div className="mx-auto max-w-6xl flex flex-col md:flex-row items-center justify-between gap-8 rounded-3xl p-6 sm:p-10 bg-white/5 border border-white/10 backdrop-blur-xl">
          <div className="max-w-2xl space-y-3 text-left">
            <div className="inline-flex items-center gap-2 rounded-full bg-blue-500/20 border border-blue-400/30 px-3 py-1 text-[11px] font-bold text-blue-300 uppercase tracking-wider">
              <Stethoscope className="h-3.5 w-3.5" />
              <span>For Doctors, Clinic Owners &amp; Receptionists</span>
            </div>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Run your clinic on ClinicOS — Speed Rx, Token Desk, Smart TV &amp; 9 PM Close.
            </h3>
            <p className="text-xs sm:text-sm text-blue-100/80 leading-relaxed">
              Tired of aggregators taking 25% commissions? ClinicOS is the dedicated operating system for your physical chamber. 30-second prescriptions, waiting room TV boards, acoustic calling chimes, and automatic visiting doctor fee splits.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 flex-shrink-0 w-full md:w-auto">
            <Link
              href="/for-doctors"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3.5 text-xs sm:text-sm font-bold text-[#0071E3] hover:bg-blue-50 active:scale-95 transition shadow-lg"
            >
              <span>Explore Provider Suite</span>
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/consult/1"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-full border border-white/25 bg-white/10 px-5 py-3.5 text-xs sm:text-sm font-semibold text-white hover:bg-white/20 transition"
            >
              <span>Open Chamber Demo</span>
            </Link>
          </div>
        </div>
      </section>

      {/* 8. APPLE MINIMAL FOOTER */}
      <footer className="border-t border-black/[0.06] bg-[#ECEEF2] py-12 px-4 dark:border-white/[0.08] dark:bg-[#000000] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#86868B] dark:text-[#8E8E93]">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
            <span className="font-bold text-[#1D1D1F] dark:text-white">DocSphere ClinicOS</span>
            <span>•</span>
            <span>Digital Infrastructure for Independent Healthcare</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/search" className="hover:text-[#1D1D1F] dark:hover:text-white">Find Doctors</Link>
            <Link href="/for-doctors" className="hover:text-[#0071E3] dark:hover:text-[#2997FF] font-bold">For Doctors &amp; Clinics</Link>
            <Link href="/patient/portal" className="hover:text-[#1D1D1F] dark:hover:text-white">Patient Portal</Link>
            <Link href="/onboarding" className="hover:text-[#1D1D1F] dark:hover:text-white">Doctor Setup</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
