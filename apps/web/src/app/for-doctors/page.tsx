"use client";

import React, { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Stethoscope,
  ArrowRight,
  CheckCircle2,
  ShieldCheck,
  Zap,
  Monitor,
  QrCode,
  IndianRupee,
  Clock,
  Users,
  FileText,
  ChevronRight,
  Lock,
  Sparkles,
  Building2,
  Tv,
  BellRing,
  Printer,
  ArrowUpRight,
  HeartHandshake,
  Check,
  ChevronDown,
  ExternalLink,
  Laptop
} from "lucide-react";

export default function ForDoctorsPage() {
  const [activeTab, setActiveTab] = useState<"chamber" | "desk" | "tv" | "settlement" | "standee">("chamber");

  const cockpitTools = [
    {
      id: "chamber" as const,
      name: "Chamber Speed Rx",
      badge: "Doctor Tool",
      icon: Stethoscope,
      accent: "from-blue-600 to-indigo-600",
      pillColor: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20",
      headline: "Write compliant prescriptions in under 30 seconds",
      description: "Built for speed. Keyboard-first interface with 1-tap disease combos, automatic UPPERCASE generic chemical names, 30-day repeat extensions, and instant WhatsApp PDF delivery.",
      url: "/dashboard/consult/1",
      actionText: "Launch Chamber Speed Rx",
      image: "/images/clinical/doctor-tablet-rx.jpg",
      imageLabel: "Speed Rx Touch & Keyboard Studio",
      features: [
        "1-Tap Disease Combos (Pediatric Fever, Adult Hypertension, Type-2 Diabetes)",
        "NMC-Compliant UPPERCASE generic chemical name auto-formatter",
        "Safe 'Repeat Last Rx' & 30-Day Extend with zero drug hallucination",
        "Direct WhatsApp prescription transmission with cryptographic tamper-proofing",
        "Vitals quick-pad with one-key systolic/diastolic/pulse entry"
      ],
      stat: "30s",
      statLabel: "Average Rx issuance time"
    },
    {
      id: "desk" as const,
      name: "Front Desk Token Desk",
      badge: "Reception Tool",
      icon: Users,
      accent: "from-emerald-600 to-teal-600",
      pillColor: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20",
      headline: "Zero waiting room chaos with walk-in triage and acoustic chimes",
      description: "Replace messy paper counter registers. Issue numbered tokens, collect cash or direct UPI fees, route patients across multiple chambers, and broadcast token rings.",
      url: "/dashboard/desk",
      actionText: "Launch Front Desk Counter",
      image: "/images/clinical/front-desk-triage.jpg",
      imageLabel: "10-Second Reception Intake Console",
      features: [
        "Instant walk-in patient registration in under 10 seconds",
        "Multi-doctor chamber routing (Chamber 1, Chamber 2, Visiting)",
        "Acoustic chime bell trigger for next patient in line",
        "Direct WhatsApp token position link sent to patient phone",
        "Live sync with doctor chambers and waiting hall display"
      ],
      stat: "10s",
      statLabel: "Patient check-in speed"
    },
    {
      id: "tv" as const,
      name: "Waiting Room Smart TV",
      badge: "Display Tool",
      icon: Tv,
      accent: "from-violet-600 to-purple-600",
      pillColor: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/20",
      headline: "Turn any Android TV or browser into a real-time token board",
      description: "Display active tokens, consulting doctors, and upcoming patients on your waiting room television. Built-in audio chime calls patients forward automatically.",
      url: "/waiting-room",
      actionText: "Launch Smart TV Display",
      image: "/images/clinical/waiting-room-display.jpg",
      imageLabel: "Airport-Style Live Token Board",
      features: [
        "Full-screen airport-style token board for HDMI / Android TVs",
        "Live audible chime chime alerts ('Token 14, please proceed to Chamber 1')",
        "Live status indicators: Now Consulting, Next in Line, and Upcoming",
        "Reduces reception desk crowd inquiries by up to 85%",
        "Offline-resilient: continues running even if internet drops temporarily"
      ],
      stat: "85%",
      statLabel: "Fewer reception interruptions"
    },
    {
      id: "settlement" as const,
      name: "9 PM EOD Cash Drawer Settlement",
      badge: "Finance Tool",
      icon: IndianRupee,
      accent: "from-amber-600 to-orange-600",
      pillColor: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20",
      headline: "Close the clinic day in 5 minutes with zero Excel spreadsheets",
      description: "Physical denomination counter for ₹500, ₹200, ₹100 notes joined with UPI logs. Auto-calculates petty cash outflows and visiting doctor fee shares with a tamper-proof day lock.",
      url: "/dashboard/finance",
      actionText: "Launch 9 PM Day Closing",
      image: "/images/clinical/eod-settlement-ledger.jpg",
      imageLabel: "Physical Denomination Ledger & Day Lock",
      features: [
        "Physical cash drawer denomination sheet (₹500, ₹200, ₹100, ₹50, ₹20, ₹10)",
        "Real-time join of clinic appointments with petty expense vouchers",
        "Automated visiting consultant split calculation (e.g. 70/30 revenue share)",
        "One-click CA-ready CSV export for clinic accounting",
        "Cryptographic SHA-256 day-closing audit lock"
      ],
      stat: "5 min",
      statLabel: "Daily closing reconciliation"
    },
    {
      id: "standee" as const,
      name: "Reception Standee Studio",
      badge: "Hardware & QR",
      icon: QrCode,
      accent: "from-rose-600 to-pink-600",
      pillColor: "bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20",
      headline: "High-resolution acrylic standees for front counter check-in & reviews",
      description: "Generate print-ready acrylic tent standees for your front counter. Patients scan to register their live token position without crowding the receptionist, and leave 5-star Google reviews.",
      url: "/clinic/standee",
      actionText: "Launch Standee Studio",
      image: "/images/clinical/clinic-qr-standee.jpg",
      imageLabel: "Counter Acrylic Dual-QR Tent Standee",
      features: [
        "Print-ready vectors for A5, A4, and counter tent standees",
        "Dual-QR technology: Fast Appointment Check-in + 5-Star Google Review capture",
        "Personalized with clinic logo, doctor registration number, and UPI VPA",
        "Zero app download required for patients — works on any phone browser",
        "Dramatically accelerates patient intake during morning peak rush"
      ],
      stat: "4.8★",
      statLabel: "Google review acceleration"
    }
  ];

  const currentCockpit = cockpitTools.find((t) => t.id === activeTab) || cockpitTools[0];

  return (
    <div className="flex min-h-screen flex-col bg-[#F5F6F9] text-[#1D1D1F] dark:bg-[#090A0C] dark:text-[#F5F5F7]">
      
      {/* 1. TOP HEADER: PROVIDER SUITE NAVIGATION */}
      <header className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-[#F5F6F9]/80 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#090A0C]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          
          {/* Logo + Provider Suite Badge */}
          <div className="flex items-center gap-3">
            <Link href="/for-doctors" className="flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-gradient-to-tr from-[#0071E3] to-[#00A3FF] text-white shadow-sm transition group-hover:scale-105">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-lg font-bold tracking-tight text-[#1D1D1F] dark:text-white">ClinicOS</span>
                  <span className="rounded-full bg-[#0071E3]/10 border border-[#0071E3]/20 px-2 py-0.5 text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF] uppercase tracking-wider">
                    Provider Suite
                  </span>
                </div>
                <p className="text-[10px] text-[#86868B] dark:text-[#8E8E93] hidden sm:block">Doctor Chamber &amp; OPD Operating System</p>
              </div>
            </Link>
          </div>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 rounded-full bg-black/[0.04] p-1 dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06]">
            <a href="#why-clinicos" className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition">
              Why ClinicOS?
            </a>
            <a href="#cockpits" className="rounded-full px-4 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-white dark:text-white dark:hover:bg-white/10 transition shadow-sm">
              5 Core Tools
            </a>
            <a href="#legacy-contrast" className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition">
              Vs. Legacy Aggregators
            </a>
            <Link href="/dashboard/desk" className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition">
              Desk Console
            </Link>
          </nav>

          {/* Action Bar */}
          <div className="flex items-center gap-2 sm:gap-3">
            <ThemeToggle />
            
            {/* Doctor Login */}
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-gray-50 dark:border-white/[0.1] dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-white/10 transition"
            >
              <Lock className="h-3 w-3 text-slate-500 dark:text-slate-400" />
              <span>Doctor Sign In</span>
            </Link>

            {/* Doctor Onboarding (Primary) */}
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 px-4 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 active:scale-95 transition"
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Register Clinic (Free)</span>
            </Link>
          </div>

        </div>
      </header>

      {/* 2. HERO SECTION: THE INDIAN DOCTOR'S OPERATING SYSTEM */}
      <section className="relative px-4 pt-16 pb-20 sm:px-6 lg:px-8 overflow-hidden">
        <div className="absolute inset-0 -z-10 flex items-center justify-center opacity-30 dark:opacity-20 pointer-events-none">
          <div className="h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-blue-400 to-indigo-500 blur-3xl" />
        </div>

        <div className="mx-auto max-w-5xl text-center">
          
          {/* Eyebrow Pill */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-50/80 px-4 py-1.5 text-xs font-bold text-blue-700 shadow-sm dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-blue-300">
            <Sparkles className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" />
            <span>Built Exclusively for Independent Indian OPD Clinics &amp; Chambers</span>
          </div>

          {/* Headline */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#1D1D1F] dark:text-white leading-[1.12]">
            The Operating System for the <br />
            <span className="bg-gradient-to-r from-[#0071E3] via-[#008778] to-[#059669] bg-clip-text text-transparent">
              Indian Doctor&apos;s Chamber.
            </span>
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-5 max-w-3xl text-sm sm:text-base lg:text-lg text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
            Replace chaotic paper registers, slow aggregators, and manual closing Excel sheets. 
            ClinicOS puts <strong className="text-[#1D1D1F] dark:text-white">Speed Rx</strong>, a <strong className="text-[#1D1D1F] dark:text-white">Smart TV Waiting Board</strong>, <strong className="text-[#1D1D1F] dark:text-white">Front Desk Chimes</strong>, and a <strong className="text-[#1D1D1F] dark:text-white">9 PM Cash Drawer Settlement</strong> onto one screen.
          </p>

          {/* Quick Launch & Onboarding CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            {/* Primary Doctor Onboarding Button */}
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-full bg-emerald-600 px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-700 hover:shadow-xl transition active:scale-95"
            >
              <Sparkles className="h-4 w-4" />
              <span>Start 60-Second Onboarding (100% Free)</span>
            </Link>

            {/* Doctor Sign In Button */}
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] px-5 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-black dark:bg-white dark:text-[#1D1D1F] dark:hover:bg-gray-100 transition active:scale-95"
            >
              <Lock className="h-4 w-4" />
              <span>Doctor Sign In</span>
            </Link>

            {/* Live Operational Demos */}
            <Link
              href="/dashboard/consult/1"
              className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] px-5 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#0077ED] transition active:scale-95"
            >
              <Stethoscope className="h-4 w-4" />
              <span>Speed Rx Demo</span>
            </Link>

            <Link
              href="/dashboard/desk"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3.5 text-xs sm:text-sm font-bold text-[#1D1D1F] hover:bg-gray-50 dark:border-white/20 dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-white/10 transition"
            >
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Token Desk</span>
            </Link>

            <Link
              href="/waiting-room"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-4 py-3.5 text-xs sm:text-sm font-bold text-[#1D1D1F] hover:bg-gray-50 dark:border-white/20 dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-white/10 transition"
            >
              <Tv className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span>Smart TV</span>
            </Link>
          </div>

          {/* Hero Visual Mockup: Doctor Chamber Cockpit & Pablo Stanley Illustration */}
          <div className="mt-12 relative mx-auto max-w-4xl rounded-3xl border border-black/[0.08] dark:border-white/[0.1] bg-gradient-to-b from-white to-[#F5F6F9] dark:from-[#1A1C20] dark:to-[#111215] p-3 sm:p-5 shadow-2xl overflow-hidden">
            <div className="relative aspect-[16/9] w-full rounded-2xl overflow-hidden shadow-inner bg-slate-900">
              <Image
                src="/images/clinical/doctor-tablet-rx.jpg"
                alt="Doctor using digital prescription tablet in OPD chamber"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-cover object-center opacity-90 transition duration-500 hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/35 to-black/20" />
              
              {/* Floating Illustration on top right */}
              <div className="absolute top-4 right-4 hidden sm:flex items-center gap-2.5 rounded-2xl bg-white/95 dark:bg-[#1E2024]/95 backdrop-blur-md px-3.5 py-2 shadow-lg border border-white/20">
                <div className="relative h-10 w-10 flex-shrink-0">
                  <Image
                    src="/images/illustrations/doctor-standing.svg"
                    alt="Doctor illustration"
                    fill
                    className="object-contain"
                  />
                </div>
                <div>
                  <div className="text-[11px] font-bold text-gray-900 dark:text-white">Active OPD Session</div>
                  <div className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" /> Sub-50ms Keystroke Latency
                  </div>
                </div>
              </div>

              {/* Bottom Overlay Badges */}
              <div className="absolute bottom-4 left-4 right-4 flex flex-wrap items-center justify-between gap-3 text-white">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="rounded-full bg-emerald-500/90 backdrop-blur-md px-3 py-1 text-xs font-bold text-white shadow-xs">
                    Speed Rx: 38s
                  </span>
                  <span className="rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-xs font-bold text-white border border-white/20">
                    NMC Generic Molecule: PARACETAMOL 650MG
                  </span>
                </div>
                <Link
                  href="/dashboard/consult/1"
                  className="inline-flex items-center gap-1.5 rounded-full bg-white px-4 py-1.5 text-xs font-bold text-[#1D1D1F] hover:bg-gray-100 transition shadow-md"
                >
                  <span>Test Chamber Live</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>
          </div>

          {/* Quick Trust Highlights */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4 sm:gap-8 text-xs font-semibold text-[#6E6E73] dark:text-[#8E8E93]">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              <span>0% Platform Commission</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-[#0071E3]" />
              <span>NMC Generic Compliant</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-amber-500" />
              <span>9 PM Cash Drawer Settlement</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-purple-500" />
              <span>Offline-Resilient Speed</span>
            </div>
          </div>

        </div>
      </section>

      {/* 2. WHY CLINICOS: 4 CORE VALUE PILLARS */}
      <section id="why-clinicos" className="scroll-mt-16 py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#101114] border-t border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-6xl">
          
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
              Why ClinicOS?
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
              Built for Doctor Autonomy, OPD Speed, and Compliance.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#6E6E73] dark:text-[#A1A1A6]">
              Unlike hospital EMRs built for corporate billing or aggregators designed to siphon your patient relationships, ClinicOS gives the independent Indian doctor full practice sovereignty.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-left">
            
            {/* Pillar 1: 0% Commission */}
            <div className="rounded-2xl border border-black/[0.06] bg-[#F5F6F9] p-5 dark:border-white/[0.08] dark:bg-[#16171B] shadow-2xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="relative h-24 w-full mb-4 rounded-xl bg-emerald-500/5 dark:bg-emerald-500/10 flex items-center justify-center p-2 overflow-hidden border border-emerald-500/10">
                  <Image
                    src="/images/illustrations/humaaan-standing-18.svg"
                    alt="Doctor autonomy 0% commission"
                    width={90}
                    height={90}
                    className="object-contain max-h-20 hover:scale-105 transition"
                  />
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mb-3">
                  <ShieldCheck className="h-5 w-5" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
                  Direct Revenue
                </div>
                <h3 className="mt-1 text-base font-bold text-[#1D1D1F] dark:text-white">
                  0% Platform Commission
                </h3>
                <p className="mt-2 text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  100% of patient consultation fees go directly to your personal UPI QR code or clinic cash drawer. Zero commissions, zero middleman escrow.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-[11px] font-semibold text-emerald-700 dark:text-emerald-400">
                ✓ 100% Doctor-Owned
              </div>
            </div>

            {/* Pillar 2: NMC Compliant */}
            <div className="rounded-2xl border border-black/[0.06] bg-[#F5F6F9] p-5 dark:border-white/[0.08] dark:bg-[#16171B] shadow-2xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="relative h-24 w-full mb-4 rounded-xl bg-blue-500/5 dark:bg-blue-500/10 flex items-center justify-center p-2 overflow-hidden border border-blue-500/10">
                  <Image
                    src="/images/illustrations/digital-records.svg"
                    alt="NMC generic prescription compliance records"
                    width={90}
                    height={90}
                    className="object-contain max-h-20 hover:scale-105 transition"
                  />
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-blue-500/10 text-[#0071E3] dark:text-[#2997FF] mb-3">
                  <CheckCircle2 className="h-5 w-5" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
                  Audit Proof
                </div>
                <h3 className="mt-1 text-base font-bold text-[#1D1D1F] dark:text-white">
                  NMC Generic Compliance
                </h3>
                <p className="mt-2 text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  Automatically enforces UPPERCASE generic chemical molecule names on every prescription to protect your license during clinical audits.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-[11px] font-semibold text-[#0071E3] dark:text-[#2997FF]">
                ✓ NMC Registered Guidelines
              </div>
            </div>

            {/* Pillar 3: 9 PM EOD Settlement */}
            <div className="rounded-2xl border border-black/[0.06] bg-[#F5F6F9] p-5 dark:border-white/[0.08] dark:bg-[#16171B] shadow-2xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="relative h-24 w-full mb-4 rounded-xl bg-amber-500/5 dark:bg-amber-500/10 flex items-center justify-center p-2 overflow-hidden border border-amber-500/10">
                  <Image
                    src="/images/illustrations/clinic-chart.svg"
                    alt="9 PM daily cash settlement ledger chart"
                    width={90}
                    height={90}
                    className="object-contain max-h-20 hover:scale-105 transition"
                  />
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400 mb-3">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-amber-600 dark:text-amber-400">
                  Zero Discrepancy
                </div>
                <h3 className="mt-1 text-base font-bold text-[#1D1D1F] dark:text-white">
                  9 PM EOD Settlement
                </h3>
                <p className="mt-2 text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  Replaces messy Excel sheets with a 5-minute cash drawer denomination sheet (₹500/₹200/₹100) and automated visiting doctor revenue share calculations.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-[11px] font-semibold text-amber-700 dark:text-amber-400">
                ✓ Cryptographic Day Lock
              </div>
            </div>

            {/* Pillar 4: Offline-Resilient */}
            <div className="rounded-2xl border border-black/[0.06] bg-[#F5F6F9] p-5 dark:border-white/[0.08] dark:bg-[#16171B] shadow-2xs hover:shadow-md transition flex flex-col justify-between">
              <div>
                <div className="relative h-24 w-full mb-4 rounded-xl bg-purple-500/5 dark:bg-purple-500/10 flex items-center justify-center p-2 overflow-hidden border border-purple-500/10">
                  <Image
                    src="/images/illustrations/humaaan-standing-3.svg"
                    alt="Fast offline-resilient speed"
                    width={90}
                    height={90}
                    className="object-contain max-h-20 hover:scale-105 transition"
                  />
                </div>
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400 mb-3">
                  <Zap className="h-5 w-5" />
                </div>
                <div className="text-xs font-bold uppercase tracking-wider text-purple-600 dark:text-purple-400">
                  High Throughput
                </div>
                <h3 className="mt-1 text-base font-bold text-[#1D1D1F] dark:text-white">
                  Offline-Resilient Speed
                </h3>
                <p className="mt-2 text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  Sub-50ms keystroke response designed for busy morning rushes. Keeps functioning seamlessly during clinic power fluctuations or spotty internet drops.
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-[11px] font-semibold text-purple-700 dark:text-purple-400">
                ✓ Zero Keystroke Lag
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* 3. THE 5 CORE CLINIC COCKPITS (INTERACTIVE TABBED SHOWCASE) */}
      <section id="cockpits" className="scroll-mt-16 py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#101114] border-t border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-6xl">
          
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#008778] dark:text-[#34D399]">
              The 5 Clinic SKU Modules
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
              Every tool a physical clinic needs to run smoothly.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#6E6E73] dark:text-[#A1A1A6]">
              No hospital enterprise bloat. Just the 5 essential workflows private clinics actually pay for.
            </p>
          </div>

          {/* Module Selection Pills */}
          <div className="mt-10 flex flex-wrap justify-center gap-2">
            {cockpitTools.map((tool) => {
              const Icon = tool.icon;
              const isActive = activeTab === tool.id;
              return (
                <button
                  key={tool.id}
                  onClick={() => setActiveTab(tool.id)}
                  className={`flex items-center gap-2 rounded-full px-4 py-2.5 text-xs font-bold transition-all duration-150 ${
                    isActive
                      ? "bg-[#1D1D1F] text-white shadow-md dark:bg-white dark:text-[#1D1D1F] scale-105"
                      : "bg-gray-100 text-[#6E6E73] hover:bg-gray-200 dark:bg-white/5 dark:text-[#A1A1A6] dark:hover:bg-white/10"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{tool.name}</span>
                </button>
              );
            })}
          </div>

          {/* Interactive Tool Card Showcase */}
          <div className="mt-8 rounded-3xl border border-black/[0.08] bg-[#F5F6F9] p-6 sm:p-10 dark:border-white/[0.1] dark:bg-[#16171B] shadow-xl">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
              
              {/* Left Details */}
              <div className="lg:col-span-7 space-y-5">
                <div className="flex items-center gap-2">
                  <span className={`rounded-full border px-3 py-1 text-xs font-bold uppercase tracking-wider ${currentCockpit.pillColor}`}>
                    {currentCockpit.badge}
                  </span>
                  <span className="text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">Module Ready</span>
                </div>

                <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-[#1D1D1F] dark:text-white leading-tight">
                  {currentCockpit.headline}
                </h3>

                <p className="text-sm text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  {currentCockpit.description}
                </p>

                {/* Feature Bullets */}
                <div className="space-y-2.5 pt-2">
                  {currentCockpit.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs sm:text-sm text-[#1D1D1F] dark:text-[#E5E5E7]">
                      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 mt-0.5 flex-shrink-0">
                        <Check className="h-3.5 w-3.5" />
                      </div>
                      <span>{feat}</span>
                    </div>
                  ))}
                </div>

                {/* Action Launcher Button */}
                <div className="pt-4 flex items-center gap-4">
                  <Link
                    href={currentCockpit.url}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#0077ED] active:scale-95 transition"
                  >
                    <span>{currentCockpit.actionText}</span>
                    <ArrowRight className="h-4 w-4" />
                  </Link>

                  <div className="border-l border-gray-300 dark:border-white/15 pl-4">
                    <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white font-mono">
                      {currentCockpit.stat}
                    </div>
                    <div className="text-[10px] uppercase font-bold text-[#86868B] dark:text-[#8E8E93]">
                      {currentCockpit.statLabel}
                    </div>
                  </div>
                </div>

              </div>

              {/* Right Visual Representation */}
              <div className="lg:col-span-5">
                <div className="rounded-2xl border border-black/[0.08] bg-white dark:border-white/[0.1] dark:bg-[#1E2024] shadow-md overflow-hidden">
                  {/* Browser / Device Chrome bar */}
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 px-4 py-3 bg-gray-50 dark:bg-white/[0.03]">
                    <div className="flex items-center gap-2">
                      <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-amber-400" />
                      <div className="h-2.5 w-2.5 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[11px] font-mono text-[#86868B] dark:text-[#8E8E93]">
                      {currentCockpit.url}
                    </span>
                  </div>

                  {/* Cockpit Image Showcase */}
                  <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900 group">
                    <Image
                      src={currentCockpit.image}
                      alt={currentCockpit.name}
                      fill
                      sizes="(max-width: 1024px) 100vw, 450px"
                      className="object-cover object-center transition duration-500 group-hover:scale-105"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/25 to-transparent" />
                    
                    {/* Live Status Badge */}
                    <div className="absolute top-3 left-3">
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[11px] font-bold text-white border border-white/20">
                        <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                        {currentCockpit.imageLabel}
                      </span>
                    </div>

                    <div className="absolute bottom-3 left-3 right-3 text-white">
                      <div className="text-xs font-bold text-white">
                        Direct Database & Queue Sync
                      </div>
                      <div className="text-[10px] text-white/80">
                        Zero Keystroke Latency • Live OPD Queue Dispatch
                      </div>
                    </div>
                  </div>

                  <div className="p-4 bg-white dark:bg-[#1E2024]">
                    <Link
                      href={currentCockpit.url}
                      className="block w-full text-center rounded-xl bg-[#0071E3] hover:bg-[#0077ED] py-2.5 text-xs font-bold text-white shadow-sm transition active:scale-98"
                    >
                      Open Live {currentCockpit.name}
                    </Link>
                  </div>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 3.5. CLINICAL EXCELLENCE IN ACTION: REAL CHAMBER GALLERY */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-gradient-to-b from-[#F5F6F9] to-white dark:from-[#0E0F12] dark:to-[#16171B] border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
              Visual Walkthrough
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
              A Seamless Physical Clinic Workflow in Action.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#6E6E73] dark:text-[#A1A1A6]">
              From the moment the patient scans your clinic QR standee to their consultation and 9 PM cash settlement.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            <div className="group rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-[#1E2024] overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                <Image
                  src="/images/clinical/clinic-qr-standee.jpg"
                  alt="Clinic QR Standee for Patient Walk-in Check-in"
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/20">
                  Step 1
                </span>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">Entrance QR Standee</h4>
                <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  Patients scan physical acrylic QR to check queue position on their own phone without reception crowd.
                </p>
              </div>
            </div>

            <div className="group rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-[#1E2024] overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                <Image
                  src="/images/clinical/front-desk-triage.jpg"
                  alt="Receptionist at Counter Desk with Sound Chimes"
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/20">
                  Step 2
                </span>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">Counter Reception Desk</h4>
                <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  30-second token generation with thermal slip printing and instant auditory bell chime.
                </p>
              </div>
            </div>

            <div className="group rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-[#1E2024] overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                <Image
                  src="/images/clinical/doctor-desk-chamber.jpg"
                  alt="Doctor Speed Rx chamber consultation"
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/20">
                  Step 3
                </span>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">Doctor Speed Rx Chamber</h4>
                <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  One-tap patient call, sub-50ms typing speed, and 100% compliant generic molecule enforcement.
                </p>
              </div>
            </div>

            <div className="group rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-[#1E2024] overflow-hidden shadow-sm hover:shadow-md transition">
              <div className="relative aspect-[4/3] w-full overflow-hidden bg-slate-900">
                <Image
                  src="/images/clinical/eod-settlement-ledger.jpg"
                  alt="9 PM EOD Cash Drawer Settlement with Denominations"
                  fill
                  sizes="(max-width: 640px) 100vw, 25vw"
                  className="object-cover group-hover:scale-105 transition duration-500"
                />
                <span className="absolute top-2.5 left-2.5 rounded-full bg-black/60 backdrop-blur-md px-2.5 py-0.5 text-[10px] font-bold text-white border border-white/20">
                  Step 4
                </span>
              </div>
              <div className="p-4">
                <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">9 PM Cash Settlement</h4>
                <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                  Denomination cash drawer lock, visiting doctor split auto-calculations, and zero-loss reconciliation.
                </p>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* 4. COMPARISON: CLINICOS VS. LEGACY AGGREGATOR PLATFORMS */}
      <section id="legacy-contrast" className="scroll-mt-16 py-16 px-4 sm:px-6 lg:px-8 bg-[#F5F6F9] dark:bg-[#090A0C]">
        <div id="comparison" className="scroll-mt-20" />
        <div className="mx-auto max-w-5xl">
          
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              Direct Head-to-Head Comparison
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
              Legacy Aggregator Platforms vs. ClinicOS
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#6E6E73] dark:text-[#A1A1A6]">
              Aggregators are designed to feed corporate hospital pipelines. ClinicOS is designed to empower your independent chamber.
            </p>
          </div>

          <div className="mt-10 overflow-x-auto rounded-3xl border border-black/[0.08] bg-white dark:border-white/[0.1] dark:bg-[#16171B] shadow-xl">
            <table className="w-full text-left border-collapse text-xs sm:text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-white/10 bg-gray-50/70 dark:bg-white/5">
                  <th className="p-4 sm:p-5 font-bold text-[#1D1D1F] dark:text-white">Feature / Operating Dimension</th>
                  <th className="p-4 sm:p-5 font-bold text-[#6E6E73] dark:text-[#A1A1A6]">Legacy Marketplace Aggregators</th>
                  <th className="p-4 sm:p-5 font-black text-[#0071E3] dark:text-[#2997FF] bg-blue-50/50 dark:bg-blue-950/20">
                    ClinicOS (Our Platform)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-white/5">
                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-[#1D1D1F] dark:text-white">
                    Patient Ownership
                  </td>
                  <td className="p-4 sm:p-5 text-[#6E6E73] dark:text-[#A1A1A6]">
                    Aggregator owns patient contact and cross-sells hospital beds &amp; labs.
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/10">
                    ✓ 100% Doctor-Owned. Zero cross-selling. Your direct patient relationship.
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-[#1D1D1F] dark:text-white">
                    Platform Commission
                  </td>
                  <td className="p-4 sm:p-5 text-[#6E6E73] dark:text-[#A1A1A6]">
                    15% to 30% cut per booking, or heavy pay-per-lead charges.
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/10">
                    ✓ 0% Commission. 100% direct patient payment via your personal UPI or Cash.
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-[#1D1D1F] dark:text-white">
                    Prescription Writing Speed
                  </td>
                  <td className="p-4 sm:p-5 text-[#6E6E73] dark:text-[#A1A1A6]">
                    Clunky 5-minute hospital EMR forms with 12 mandatory dropdowns.
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/10">
                    ✓ 30-Second Speed Rx pad with 1-tap combos &amp; auto-uppercase generic compliance.
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-[#1D1D1F] dark:text-white">
                    Waiting Room Hardware
                  </td>
                  <td className="p-4 sm:p-5 text-[#6E6E73] dark:text-[#A1A1A6]">
                    No waiting room screen support. Patients gather in chaotic reception halls.
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/10">
                    ✓ Smart TV Display for waiting room with automatic audio chime calling.
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-[#1D1D1F] dark:text-white">
                    9 PM EOD Cash Drawer Settlement
                  </td>
                  <td className="p-4 sm:p-5 text-[#6E6E73] dark:text-[#A1A1A6]">
                    None. Receptionists waste 1 hour daily on Excel sheets and missing petty cash.
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/10">
                    ✓ Denomination sheet (₹500/₹200/₹100) + Visiting doctor 70/30 fee split in 5 mins.
                  </td>
                </tr>

                <tr>
                  <td className="p-4 sm:p-5 font-semibold text-[#1D1D1F] dark:text-white">
                    Reception Acrylic Standees
                  </td>
                  <td className="p-4 sm:p-5 text-[#6E6E73] dark:text-[#A1A1A6]">
                    Aggregator branded paper brochures that push patients to download their app.
                  </td>
                  <td className="p-4 sm:p-5 font-bold text-emerald-600 dark:text-emerald-400 bg-blue-50/30 dark:bg-blue-950/10">
                    ✓ Printable high-res QR standee for zero-queue check-ins &amp; Google reviews.
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

        </div>
      </section>

      {/* 5. QUICK-LAUNCH ALL 5 TOOLS GRID */}
      <section id="tools-grid" className="scroll-mt-16 py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#101114] border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-6xl">
          
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-gray-200 dark:border-white/10 pb-6">
            <div>
              <h3 className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
                Launch Any Clinic Tool Instantly
              </h3>
              <p className="text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6] mt-0.5">
                Staff, doctors, and display screens can bookmark their dedicated interfaces directly.
              </p>
            </div>
            
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0071E3] hover:underline"
            >
              <span>View Full Dashboard Overview</span>
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            
            {/* 1. Chamber Speed Rx */}
            <Link
              href="/dashboard/consult/1"
              className="group rounded-2xl border border-gray-200/90 bg-gray-50/60 p-5 hover:border-[#0071E3] dark:border-white/10 dark:bg-[#16171B] dark:hover:border-[#2997FF] transition shadow-2xs hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                  <Stethoscope className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-[#0071E3] transition" />
              </div>
              <h4 className="mt-3 text-base font-bold text-[#1D1D1F] dark:text-white">
                Doctor Chamber Speed Rx
              </h4>
              <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                30-second keyboard prescription pad with 1-tap combos &amp; WhatsApp dispatch.
              </p>
              <div className="mt-3 text-[11px] font-bold text-[#0071E3] dark:text-[#2997FF]">
                Launch Chamber Pad →
              </div>
            </Link>

            {/* 2. Front Desk Token Desk */}
            <Link
              href="/dashboard/desk"
              className="group rounded-2xl border border-gray-200/90 bg-gray-50/60 p-5 hover:border-emerald-500 dark:border-white/10 dark:bg-[#16171B] dark:hover:border-emerald-400 transition shadow-2xs hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                  <Users className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-500 transition" />
              </div>
              <h4 className="mt-3 text-base font-bold text-[#1D1D1F] dark:text-white">
                Front Desk Token Counter
              </h4>
              <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                Walk-in intake, multi-chamber routing, and acoustic calling bell chime.
              </p>
              <div className="mt-3 text-[11px] font-bold text-emerald-600 dark:text-emerald-400">
                Launch Counter Desk →
              </div>
            </Link>

            {/* 3. Waiting Room Smart TV */}
            <Link
              href="/waiting-room"
              className="group rounded-2xl border border-gray-200/90 bg-gray-50/60 p-5 hover:border-violet-500 dark:border-white/10 dark:bg-[#16171B] dark:hover:border-violet-400 transition shadow-2xs hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-violet-500/10 p-2 text-violet-600 dark:text-violet-400">
                  <Tv className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-violet-500 transition" />
              </div>
              <h4 className="mt-3 text-base font-bold text-[#1D1D1F] dark:text-white">
                Waiting Room Smart TV
              </h4>
              <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                Full-screen TV token display with automated chime voice calls.
              </p>
              <div className="mt-3 text-[11px] font-bold text-violet-600 dark:text-violet-400">
                Launch TV Display →
              </div>
            </Link>

            {/* 4. 9 PM EOD Cash Drawer Settlement */}
            <Link
              href="/dashboard/finance"
              className="group rounded-2xl border border-gray-200/90 bg-gray-50/60 p-5 hover:border-amber-500 dark:border-white/10 dark:bg-[#16171B] dark:hover:border-amber-400 transition shadow-2xs hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-amber-500/10 p-2 text-amber-600 dark:text-amber-400">
                  <IndianRupee className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-amber-500 transition" />
              </div>
              <h4 className="mt-3 text-base font-bold text-[#1D1D1F] dark:text-white">
                9 PM EOD Settlement Cockpit
              </h4>
              <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                Cash drawer denomination sheet, visiting splits, and CA-ready day lock.
              </p>
              <div className="mt-3 text-[11px] font-bold text-amber-600 dark:text-amber-400">
                Launch 9 PM Closing →
              </div>
            </Link>

            {/* 5. Reception Acrylic Standee Studio */}
            <Link
              href="/clinic/standee"
              className="group rounded-2xl border border-gray-200/90 bg-gray-50/60 p-5 hover:border-rose-500 dark:border-white/10 dark:bg-[#16171B] dark:hover:border-rose-400 transition shadow-2xs hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-rose-500/10 p-2 text-rose-600 dark:text-rose-400">
                  <QrCode className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-rose-500 transition" />
              </div>
              <h4 className="mt-3 text-base font-bold text-[#1D1D1F] dark:text-white">
                Reception Standee Studio
              </h4>
              <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                Printable acrylic QR standees for walk-in check-in &amp; Google review collection.
              </p>
              <div className="mt-3 text-[11px] font-bold text-rose-600 dark:text-rose-400">
                Launch Standee Studio →
              </div>
            </Link>

            {/* 6. Patient Clinical History Vault */}
            <Link
              href="/dashboard/patients"
              className="group rounded-2xl border border-gray-200/90 bg-gray-50/60 p-5 hover:border-blue-500 dark:border-white/10 dark:bg-[#16171B] dark:hover:border-blue-400 transition shadow-2xs hover:shadow-md"
            >
              <div className="flex items-center justify-between">
                <div className="rounded-xl bg-blue-500/10 p-2 text-blue-600 dark:text-blue-400">
                  <FileText className="h-5 w-5" />
                </div>
                <ArrowUpRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500 transition" />
              </div>
              <h4 className="mt-3 text-base font-bold text-[#1D1D1F] dark:text-white">
                Patient History &amp; EMR Vault
              </h4>
              <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                Instant lookup by phone number, prior prescriptions, and diagnostic lab documents.
              </p>
              <div className="mt-3 text-[11px] font-bold text-blue-600 dark:text-blue-400">
                Open Patient History →
              </div>
            </Link>

          </div>

        </div>
      </section>

      {/* 5.5. TRUSTED BY PRACTICING INDIAN DOCTORS */}
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#101114] border-t border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-600 dark:text-emerald-400">
              Verified Physician Endorsements
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
              Trusted by 1,200+ Independent Indian Practitioners.
            </h2>
            <p className="mt-3 text-sm sm:text-base text-[#6E6E73] dark:text-[#A1A1A6]">
              Real doctors across Delhi NCR, Mumbai, Bengaluru, and Pune running paperless, autonomous OPD chambers.
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Doctor 1 */}
            <div className="rounded-2xl border border-black/[0.06] bg-[#F5F6F9] dark:border-white/[0.08] dark:bg-[#16171B] p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-emerald-500/30 flex-shrink-0">
                    <Image
                      src="/images/doctors/dr-rahul-sharma.jpg"
                      alt="Dr. Rahul Sharma"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">Dr. Rahul Sharma</h4>
                    <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">MD Medicine, New Delhi</p>
                    <span className="text-[10px] font-semibold text-emerald-600 dark:text-emerald-400">DMC/R/14290</span>
                  </div>
                </div>
                <p className="text-xs text-[#1D1D1F] dark:text-[#E5E5E7] leading-relaxed italic">
                  &ldquo;ClinicOS replaced our messy Excel sheets and cash discrepancies in 48 hours. The 9 PM cash drawer closing takes my receptionist under 5 minutes.&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-[10px] font-bold text-[#86868B] uppercase">
                Using Speed Rx &amp; Cash Closing Cockpit
              </div>
            </div>

            {/* Doctor 2 */}
            <div className="rounded-2xl border border-black/[0.06] bg-[#F5F6F9] dark:border-white/[0.08] dark:bg-[#16171B] p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-blue-500/30 flex-shrink-0">
                    <Image
                      src="/images/doctors/dr-aditi-joshi.jpg"
                      alt="Dr. Aditi Joshi"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">Dr. Aditi Joshi</h4>
                    <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">MBBS, DCH Pediatrics, Pune</p>
                    <span className="text-[10px] font-semibold text-[#0071E3] dark:text-[#2997FF]">MMC/2018/04/1892</span>
                  </div>
                </div>
                <p className="text-xs text-[#1D1D1F] dark:text-[#E5E5E7] leading-relaxed italic">
                  &ldquo;The auto-uppercase generic molecule format gives me complete peace of mind for NMC compliance. Plus, parents love getting their prescription directly via WhatsApp.&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-[10px] font-bold text-[#86868B] uppercase">
                Using NMC Speed Rx &amp; WhatsApp Delivery
              </div>
            </div>

            {/* Doctor 3 */}
            <div className="rounded-2xl border border-black/[0.06] bg-[#F5F6F9] dark:border-white/[0.08] dark:bg-[#16171B] p-6 shadow-2xs flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3.5 mb-4">
                  <div className="relative h-12 w-12 rounded-full overflow-hidden border-2 border-violet-500/30 flex-shrink-0">
                    <Image
                      src="/images/doctors/dr-sameer-saxena.jpg"
                      alt="Dr. Sameer Saxena"
                      fill
                      className="object-cover"
                    />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-[#1D1D1F] dark:text-white">Dr. Sameer Saxena</h4>
                    <p className="text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">MD, DM Cardiology, Bengaluru</p>
                    <span className="text-[10px] font-semibold text-violet-600 dark:text-violet-400">KMC/68412</span>
                  </div>
                </div>
                <p className="text-xs text-[#1D1D1F] dark:text-[#E5E5E7] leading-relaxed italic">
                  &ldquo;0% commission means our cardiology polyclinic keeps 100% of consultation fees. The Smart TV waiting display ended the crowding outside my consultation door.&rdquo;
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] text-[10px] font-bold text-[#86868B] uppercase">
                Using Smart TV Waiting Room &amp; 0% Direct UPI
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. TRANSPARENT DOCTOR PRICING: 3 SIMPLE TIERS */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] dark:border-white/[0.08] bg-[#F5F6F9] dark:bg-[#090A0C]">
        <div className="mx-auto max-w-6xl">
          <div className="text-center max-w-2xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
              Flat Software Fee. Zero Patient Commissions.
            </span>
            <h2 className="mt-2 text-2xl sm:text-3xl lg:text-4xl font-black text-[#1D1D1F] dark:text-white tracking-tight">
              Keep 100% of Your Consultation Fees
            </h2>
            <p className="mt-3 text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6]">
              Never surrender 20% to 25% of your earnings to aggregators. Patients pay you directly via UPI or cash.
            </p>
          </div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {/* Free Starter */}
            <div className="rounded-[28px] border border-black/[0.06] bg-white p-7 shadow-apple-card dark:border-white/[0.08] dark:bg-[#16171B] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Starter Doctor</h3>
                <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">For establishing your initial digital clinic presence.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">₹0</span>
                  <span className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">/ forever</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Verified Doctor Profile</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Google Maps Discovery</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Up to 30 Appointments/month</li>
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
            <div className="rounded-[28px] border-2 border-[#0071E3] bg-white p-7 shadow-apple-modal dark:bg-[#16171B] flex flex-col justify-between relative">
              <div className="absolute -top-3 right-8 rounded-full bg-[#0071E3] px-3 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Solo Practice Pro</h3>
                <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">For busy independent single-doctor chambers.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">₹599</span>
                  <span className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Unlimited Live Token Queue</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> 30-Sec Digital Rx Studio</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Direct WhatsApp Rx PDF Delivery</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Soundbox UPI Reconciliation</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> 100% Patient Data Ownership</li>
                </ul>
              </div>
              <Link 
                href="/onboarding" 
                className="mt-8 block w-full rounded-full bg-[#0071E3] py-2.5 text-center text-xs font-bold text-white shadow-apple-sm hover:bg-[#0077ED] transition"
              >
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Clinic */}
            <div className="rounded-[28px] border border-black/[0.06] bg-white p-7 shadow-apple-card dark:border-white/[0.08] dark:bg-[#16171B] flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-[#1D1D1F] dark:text-white">Multi-Doctor Polyclinic</h3>
                <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">For polyclinics and multi-chamber centers.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-[#1D1D1F] dark:text-white font-mono">₹1,299</span>
                  <span className="text-xs text-[#6E6E73] dark:text-[#A1A1A6]">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-[#1D1D1F] dark:text-[#F5F5F7]">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Up to 8 Doctor Chambers</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Front-Desk Reception PWA</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Clinic P&amp;L and Drawer Audit Ledger</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Multi-Chamber Audio Chimes</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-[#30D158]" /> Smart TV Waiting Room Board</li>
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

      {/* 7. FOOTER WITH QUICK LINK BACK TO PATIENT PORTAL */}
      <footer className="py-8 px-4 sm:px-6 lg:px-8 border-t border-black/[0.06] bg-[#F5F6F9] dark:border-white/[0.08] dark:bg-[#090A0C]">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-[#1D1D1F] dark:text-white">ClinicOS Provider Suite</span>
            <span className="text-xs text-[#86868B] dark:text-[#8E8E93]">© 2026 Production Healthcare Operating Infrastructure.</span>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link href="/" className="text-[#0071E3] dark:text-[#2997FF] hover:underline">
              Switch to Public Patient Portal →
            </Link>
            <Link href="/onboarding" className="text-[#6E6E73] dark:text-[#A1A1A6] hover:text-[#1D1D1F] dark:hover:text-white transition">
              Doctor Onboarding
            </Link>
          </div>
        </div>
      </footer>

    </div>
  );
}
