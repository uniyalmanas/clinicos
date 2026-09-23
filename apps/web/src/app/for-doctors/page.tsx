"use client";

import React, { useState } from "react";
import Link from "next/link";
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
      url: "/clinic/desk",
      actionText: "Launch Front Desk Counter",
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
      url: "/display/waiting-room",
      actionText: "Launch Smart TV Display",
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
      url: "/clinic/settlement",
      actionText: "Launch 9 PM Day Closing",
      features: [
        "Physical cash drawer denomination sheet (₹500, ₹200, ₹100, ₹50, ₹20, ₹10)",
        "Real-time join of SQLite appointments with petty expense vouchers",
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
            <a href="#cockpits" className="rounded-full px-4 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-white dark:text-white dark:hover:bg-white/10 transition shadow-sm">
              5 Core Tools
            </a>
            <a href="#comparison" className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition">
              Why ClinicOS?
            </a>
            <a href="#legacy-contrast" className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition">
              Vs. Legacy Aggregators
            </a>
            <Link href="/clinic/desk" className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition">
              Desk Console
            </Link>
          </nav>

          {/* Action Bar */}
          <div className="flex items-center gap-3">
            <ThemeToggle />
            
            {/* Back to Patient Portal */}
            <Link
              href="/"
              className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-medium text-[#6E6E73] hover:text-[#1D1D1F] hover:bg-gray-50 dark:border-white/[0.1] dark:bg-[#1C1C1E] dark:text-[#A1A1A6] dark:hover:text-white transition"
              title="Return to public patient discovery site"
            >
              <span>← Patient Portal</span>
            </Link>

            {/* Quick Launch Chamber */}
            <Link
              href="/dashboard/consult/1"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0071E3] px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition"
            >
              <span>Open Chamber</span>
              <ArrowRight className="h-3.5 w-3.5" />
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

          {/* Quick Launch CTA Buttons */}
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/dashboard/consult/1"
              className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] px-6 py-3.5 text-xs sm:text-sm font-bold text-white shadow-md hover:bg-[#0077ED] hover:shadow-lg transition active:scale-95"
            >
              <Stethoscope className="h-4 w-4" />
              <span>Launch Chamber Speed Rx</span>
            </Link>

            <Link
              href="/clinic/desk"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-3.5 text-xs sm:text-sm font-bold text-[#1D1D1F] hover:bg-gray-50 dark:border-white/20 dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-white/10 transition"
            >
              <Users className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
              <span>Reception Token Desk</span>
            </Link>

            <Link
              href="/display/waiting-room"
              className="inline-flex items-center gap-2 rounded-full border border-gray-300 bg-white px-5 py-3.5 text-xs sm:text-sm font-bold text-[#1D1D1F] hover:bg-gray-50 dark:border-white/20 dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-white/10 transition"
            >
              <Tv className="h-4 w-4 text-violet-600 dark:text-violet-400" />
              <span>Waiting Room TV Board</span>
            </Link>
          </div>

          {/* 4 Trust Badges */}
          <div className="mt-12 grid grid-cols-2 sm:grid-cols-4 gap-3 text-left">
            <div className="rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-white/[0.08] dark:bg-[#161618] shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-[#0071E3] dark:text-[#2997FF]">
                <CheckCircle2 className="h-4 w-4" /> NMC Compliant
              </div>
              <p className="mt-1 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] leading-snug">
                UPPERCASE generic chemical names enforced automatically.
              </p>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-black/[0.08] dark:bg-[#161618] shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="h-4 w-4" /> 0% Platform Commission
              </div>
              <p className="mt-1 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] leading-snug">
                100% of patient fees go directly to your personal UPI or cash drawer.
              </p>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-black/[0.08] dark:bg-[#161618] shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400">
                <IndianRupee className="h-4 w-4" /> 9 PM EOD Settlement
              </div>
              <p className="mt-1 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] leading-snug">
                Physical denomination counting &amp; visiting consultant splits.
              </p>
            </div>

            <div className="rounded-2xl border border-black/[0.06] bg-white p-4 dark:border-black/[0.08] dark:bg-[#161618] shadow-2xs">
              <div className="flex items-center gap-2 text-xs font-bold text-purple-600 dark:text-purple-400">
                <Zap className="h-4 w-4" /> Offline-Resilient
              </div>
              <p className="mt-1 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] leading-snug">
                Works seamlessly through spotty internet and clinic power drops.
              </p>
            </div>
          </div>

        </div>
      </section>

      {/* 3. THE 5 CORE CLINIC COCKPITS (INTERACTIVE TABBED SHOWCASE) */}
      <section id="cockpits" className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#101114] border-t border-b border-black/[0.06] dark:border-white/[0.08]">
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
                <div className="rounded-2xl border border-black/[0.08] bg-white p-6 dark:border-white/[0.1] dark:bg-[#1E2024] shadow-md space-y-4">
                  <div className="flex items-center justify-between border-b border-gray-100 dark:border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full bg-red-400" />
                      <div className="h-3 w-3 rounded-full bg-amber-400" />
                      <div className="h-3 w-3 rounded-full bg-emerald-400" />
                    </div>
                    <span className="text-[11px] font-mono text-[#86868B] dark:text-[#8E8E93]">
                      {currentCockpit.url}
                    </span>
                  </div>

                  <div className="space-y-3 py-2">
                    <div className="p-3 rounded-xl bg-gray-50 dark:bg-white/5 border border-gray-200/60 dark:border-white/5">
                      <div className="flex items-center justify-between text-xs font-bold text-[#1D1D1F] dark:text-white">
                        <span>Active Session</span>
                        <span className="inline-flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" /> Live Operational
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                        Directly mapped to your clinic SQLite database and local queue dispatch engine.
                      </p>
                    </div>

                    <div className="p-3 rounded-xl bg-blue-50/50 dark:bg-blue-950/20 border border-blue-200/40 dark:border-blue-900/30">
                      <div className="text-xs font-bold text-[#0071E3] dark:text-[#2997FF]">
                        Zero Latency Guarantee
                      </div>
                      <p className="mt-1 text-[11px] text-blue-900/80 dark:text-blue-200/80">
                        Designed to function with instant keystroke response even under high patient footfall.
                      </p>
                    </div>
                  </div>

                  <Link
                    href={currentCockpit.url}
                    className="block w-full text-center rounded-xl bg-gray-100 py-2.5 text-xs font-bold text-[#1D1D1F] hover:bg-gray-200 dark:bg-white/10 dark:text-white dark:hover:bg-white/15 transition"
                  >
                    Open Live Interface in New View
                  </Link>
                </div>
              </div>

            </div>
          </div>

        </div>
      </section>

      {/* 4. COMPARISON: CLINICOS VS. LEGACY AGGREGATOR PLATFORMS */}
      <section id="legacy-contrast" className="py-16 px-4 sm:px-6 lg:px-8 bg-[#F5F6F9] dark:bg-[#090A0C]">
        <div className="mx-auto max-w-5xl">
          
          <div className="text-center max-w-3xl mx-auto">
            <span className="text-xs font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400">
              The Fundamental Difference
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
      <section className="py-16 px-4 sm:px-6 lg:px-8 bg-white dark:bg-[#101114] border-t border-black/[0.06] dark:border-white/[0.08]">
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
              href="/clinic/desk"
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
              href="/display/waiting-room"
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
              href="/clinic/settlement"
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

      {/* 6. FOOTER WITH QUICK LINK BACK TO PATIENT PORTAL */}
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
