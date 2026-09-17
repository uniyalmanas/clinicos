"use client";

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import InteractiveHeroSearch from "@/components/InteractiveHeroSearch";
import InteractivePlayground from "@/components/InteractivePlayground";
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
  HeartHandshake,
  Pill,
  Microscope,
  ChevronDown,
  Phone,
  QrCode
} from "lucide-react";

export default function HomePage() {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqs = [
    {
      q: "How is DocSphere different from Practo or generic listing directories?",
      a: "Practo operates as an aggregator marketplace where they own your patient relationships and charge up to 20-30% commissions on consultations. DocSphere is a self-hosted B2B operating layer: you own your patients, get your own branded subdomain, retain 100% of consultation fees directly in your bank account via UPI, and pay a flat tool fee."
    },
    {
      q: "Do patients need to download an application to book or view prescriptions?",
      a: "No! 0% patient app downloads required. Patients receive their live token position, payment links, and tamper-proof digital prescription PDFs directly on WhatsApp or SMS via a secure, passwordless web link."
    },
    {
      q: "Is DocSphere compliant with National Medical Commission (NMC) regulations?",
      a: "Yes. All digital prescriptions enforce UPPERCASE generic chemical names, display verified State Medical Council registration numbers prominently, and embed a SHA-256 cryptographic signature to guarantee tamper-proofing."
    },
    {
      q: "What hardware does the Reception Desk require?",
      a: "Any desktop computer, laptop, tablet, or mobile phone with a modern web browser. The counter console works as an offline-resilient Progressive Web App (PWA) with built-in Web Audio chime call bells."
    },
    {
      q: "How does the Dehradun pilot network operate?",
      a: "Independent practitioners along Rajpur Road, EC Road, and Chakrata Road have live profiles with synchronized counter token numbers, verified NMC badges, and local patient discovery."
    }
  ];

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 dark:bg-slate-950">
      {/* 1. NAVIGATION BAR */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md dark:border-slate-800 dark:bg-slate-900/90">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-brand-600 text-white shadow-md shadow-brand-600/20">
                <Stethoscope className="h-6 w-6" />
              </div>
              <div>
                <span className="text-xl font-bold tracking-tight text-slate-900 dark:text-white">DocSphere</span>
                <span className="ml-1.5 rounded-full bg-brand-100 px-2 py-0.5 text-xs font-semibold text-brand-800 dark:bg-brand-900/50 dark:text-brand-300">ClinicOS</span>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-6 lg:flex">
            <Link href="/search" className="text-xs font-semibold text-slate-600 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
              Find Doctors
            </Link>
            <Link href="/clinic/desk" className="text-xs font-semibold text-slate-600 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
              Reception Desk
            </Link>
            <Link href="/doctor/queue" className="text-xs font-semibold text-slate-600 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
              Doctor OPD
            </Link>
            <a href="#features" className="text-xs font-semibold text-slate-600 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
              Features
            </a>
            <a href="#pilot-clinics" className="text-xs font-semibold text-slate-600 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
              Dehradun Pilot
            </a>
            <a href="#pricing" className="text-xs font-semibold text-slate-600 transition hover:text-brand-600 dark:text-slate-400 dark:hover:text-brand-400">
              Pricing
            </a>
          </nav>

          <div className="flex items-center gap-2.5">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-lg px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
            >
              Sign In
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm transition hover:bg-brand-700"
            >
              Join as Doctor <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative overflow-hidden border-b border-slate-200 bg-gradient-to-b from-teal-50/40 via-white to-slate-50/50 px-4 py-16 dark:border-slate-800 dark:from-slate-900 dark:via-slate-950 dark:to-slate-950 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-brand-200 bg-brand-50 px-4 py-1.5 text-xs font-semibold text-brand-800 dark:border-brand-900/50 dark:bg-brand-950 dark:text-brand-300">
            <Sparkles className="h-3.5 w-3.5" /> Built for Independent Indian Clinics & Doctors
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-slate-900 dark:text-white sm:text-6xl">
            Your Clinic. Online. <br className="hidden sm:inline" />
            <span className="text-brand-600">Organized. Connected.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-3xl text-base text-slate-600 dark:text-slate-300 sm:text-lg">
            Everything independent doctors and clinics need: verified branded subdomains, walk-in token queues with counter chimes, 30-second digital prescriptions, and zero-commission WhatsApp delivery.
          </p>

          {/* INTERACTIVE HERO SEARCH COMPONENT */}
          <InteractiveHeroSearch />

          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-brand-600/25 transition hover:bg-brand-700 hover:shadow-brand-600/35"
            >
              <Stethoscope className="h-4 w-4" /> Join as a Doctor (<span className="underline decoration-brand-300 underline-offset-2">&lt; 60s AI Setup</span>)
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-800 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-800"
            >
              <UserCheck className="h-4 w-4 text-brand-600" /> 1-Click Interactive Demo Login
            </Link>
          </div>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-6 text-xs font-medium text-slate-500 dark:text-slate-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-brand-600" /> Zero Practo Commissions</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-brand-600" /> WhatsApp Rx PDF Delivery</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-brand-600" /> 100% Doctor-Owned Subdomain</span>
            <span className="flex items-center gap-1.5"><CheckCircle2 className="h-4 w-4 text-brand-600" /> DPDP & NMC Compliant</span>
          </div>
        </div>

        {/* 3. INTERACTIVE PLAYGROUND (All 5 Modules Test Drive) */}
        <InteractivePlayground />
      </section>

      {/* 4. THREE CORE PILLARS */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">Complete Healthcare Operating Layer</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
              Engineered for Ground-Level Indian OPD Reality
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* For Doctors */}
            <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-brand-600 dark:bg-teal-950">
                <Stethoscope className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">For Independent Doctors</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Stop being an interchangeable row on aggregators. Get your own branded digital portal with 30-second prescription templates, Google Maps local ranking, and direct patient relationships.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> AI-Synthesized Profile in &lt; 60 seconds</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> 1-Click Common Prescription Kits</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> Tamper-Proof Cryptographic Signatures</li>
              </ul>
              <Link href="/doctor/queue" className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-brand-600 hover:underline">
                Explore Doctor Chamber <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* For Clinics */}
            <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-600 dark:bg-blue-950">
                <Building2 className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">For Clinics & Polyclinics</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                A streamlined front-desk PWA for your counter PC. Eliminate waiting room chaos with live token calling, soundbox UPI reconciliation, and multi-doctor rosters.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" /> Reception PWA with 1-tap Token Calling</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" /> Daily Cash & Soundbox UPI Ledger</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-blue-600" /> Strict Staff vs Doctor Privacy Gate</li>
              </ul>
              <Link href="/clinic/desk" className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-blue-600 hover:underline">
                Explore Counter Console <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            {/* For Patients */}
            <div className="relative rounded-2xl border border-slate-200 bg-white p-8 shadow-sm transition hover:shadow-md dark:border-slate-800 dark:bg-slate-900">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-950">
                <UserCheck className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900 dark:text-white">For Patients</h3>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
                Zero app downloads required. Patients receive their live token status, official prescription PDFs, and appointment reminders directly on WhatsApp.
              </p>
              <ul className="mt-6 space-y-2.5 text-xs text-slate-600 dark:text-slate-300">
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-600" /> Live Queue Waiting Tracker on Phone</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-600" /> Permanent Digital Health Locker</li>
                <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-amber-600" /> Verified Medical Council Credentials</li>
              </ul>
              <Link href="/p/RX-2026-09-0014" className="mt-6 inline-flex items-center gap-1 text-xs font-bold text-amber-600 hover:underline">
                Explore Patient Locker <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 5. PHARMACY & DIAGNOSTICS LOCAL ECOSYSTEM */}
      <section className="border-t border-slate-200 bg-white py-16 px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <div className="inline-flex items-center gap-1.5 rounded-full bg-emerald-50 px-3 py-1 text-xs font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                <Pill className="h-3.5 w-3.5" /> Local Medical Ecosystem
              </div>
              <h2 className="mt-3 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
                Connecting Clinics, Pharmacies & Diagnostic Labs
              </h2>
              <p className="mt-4 text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                When a doctor signs a prescription in DocSphere, patients can immediately route generic medicines to their trusted local chemist (e.g., Apollo Pharmacy or neighborhood stores along Rajpur Road) or book home sample collection with certified labs (Dr. Lal PathLabs, Thyrocare).
              </p>
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <Pill className="h-5 w-5 text-emerald-600 mb-2" />
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Partner Chemist Pickup</div>
                  <div className="text-[11px] text-slate-500 mt-1">Direct generic drug availability cross-check without middlemen cuts.</div>
                </div>
                <div className="rounded-xl border border-slate-200 p-4 dark:border-slate-800">
                  <Microscope className="h-5 w-5 text-blue-600 mb-2" />
                  <div className="font-bold text-xs text-slate-900 dark:text-white">Diagnostic Home Collection</div>
                  <div className="text-[11px] text-slate-500 mt-1">1-tap lab test booking linked directly to the provisional diagnosis.</div>
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-slate-800 dark:bg-slate-950">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-3">Live Integration Preview</div>
              <div className="rounded-xl bg-white p-4 shadow-sm border border-slate-200 dark:bg-slate-900 dark:border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-bold text-slate-900 dark:text-white">Rx #RX-2026-09-0014</span>
                  <span className="rounded bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">Ready for Fulfillment</span>
                </div>
                <div className="text-xs text-slate-600 dark:text-slate-300">
                  Prescribed: <strong>TAB CETIRIZINE 10MG (5 strips), CAP DOXYCYCLINE 100MG (10 caps)</strong>
                </div>
                <div className="flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                  <button className="flex-1 rounded-lg bg-emerald-600 py-1.5 text-xs font-bold text-white hover:bg-emerald-700">
                    Forward to Chemist
                  </button>
                  <button className="flex-1 rounded-lg border border-slate-200 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200">
                    Order Lab Tests
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 6. PILOT CLINICS SHOWCASE (Dehradun Testbed) */}
      <section id="pilot-clinics" className="border-t border-slate-200 bg-slate-100/60 py-20 px-4 dark:border-slate-800 dark:bg-slate-900/50 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-brand-600">
                <MapPin className="h-4 w-4" /> Live Dehradun Pilot Network
              </div>
              <h2 className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white">
                Independent Clinics Powered by DocSphere
              </h2>
            </div>
            <Link href="/search" className="inline-flex items-center gap-1.5 text-sm font-semibold text-brand-600 hover:text-brand-700">
              View all 20+ Dehradun doctors <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {/* Card 1: Derma Care */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block rounded-md bg-teal-50 px-2.5 py-1 text-xs font-medium text-teal-700 dark:bg-teal-950 dark:text-teal-300">Dermatology</span>
                    <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Derma Care Skin & Laser</h3>
                    <p className="text-xs text-slate-500">Dr. Rahul Sharma (MD Derm)</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">⭐ 4.9</div>
                </div>
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                  14, Rajpur Road, Near Ashley Hall, Dehradun
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300">Fee: ₹600</span>
                  <span className="text-emerald-600 font-bold">OPD Active: Token #2</span>
                </div>
              </div>
              <div className="mt-6 flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/doctors/dr-rahul-sharma"
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Doctor Profile
                </Link>
                <Link
                  href="/book?doctor=dr-rahul-sharma"
                  className="flex-1 rounded-lg bg-brand-600 py-2 text-center text-xs font-bold text-white shadow-sm hover:bg-brand-700"
                >
                  Book Token
                </Link>
              </div>
            </div>

            {/* Card 2: Smile Craft */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block rounded-md bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 dark:bg-blue-950 dark:text-blue-300">Dentistry</span>
                    <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Smile Craft Dental</h3>
                    <p className="text-xs text-slate-500">Dr. Aditi Joshi (MDS Endodontics)</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">⭐ 4.8</div>
                </div>
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                  42, EC Road, Near Survey Chowk, Dehradun
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300">Fee: ₹400</span>
                  <span className="text-emerald-600 font-bold">OPD Active: Token #1</span>
                </div>
              </div>
              <div className="mt-6 flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/doctors/dr-aditi-joshi"
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Doctor Profile
                </Link>
                <Link
                  href="/book?doctor=dr-aditi-joshi"
                  className="flex-1 rounded-lg bg-brand-600 py-2 text-center text-xs font-bold text-white shadow-sm hover:bg-brand-700"
                >
                  Book Token
                </Link>
              </div>
            </div>

            {/* Card 3: Dron Child Clinic */}
            <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between">
                  <div>
                    <span className="inline-block rounded-md bg-amber-50 px-2.5 py-1 text-xs font-medium text-amber-700 dark:bg-amber-950 dark:text-amber-300">Pediatrics</span>
                    <h3 className="mt-2 text-lg font-bold text-slate-900 dark:text-white">Dron Child & Newborn</h3>
                    <p className="text-xs text-slate-500">Dr. Vikram Sethi (DNB Pediatrics)</p>
                  </div>
                  <div className="rounded-lg bg-emerald-50 px-2 py-1 text-xs font-bold text-emerald-700">⭐ 4.95</div>
                </div>
                <p className="mt-3 text-xs text-slate-600 dark:text-slate-400">
                  88, Chakrata Road, Ballupur, Dehradun
                </p>
                <div className="mt-4 flex items-center justify-between border-t border-slate-100 pt-4 text-xs font-medium dark:border-slate-800">
                  <span className="text-slate-700 dark:text-slate-300">Fee: ₹500</span>
                  <span className="text-amber-600 font-bold">OPD Slot: Next 11:30 AM</span>
                </div>
              </div>
              <div className="mt-6 flex gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/doctors/dr-vikram-sethi"
                  className="flex-1 rounded-lg border border-slate-200 py-2 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200"
                >
                  Doctor Profile
                </Link>
                <Link
                  href="/book?doctor=dr-vikram-sethi"
                  className="flex-1 rounded-lg bg-brand-600 py-2 text-center text-xs font-bold text-white shadow-sm hover:bg-brand-700"
                >
                  Book Token
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 7. PRICING SECTION */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">Transparent Indian Clinic Pricing</h2>
            <p className="mt-2 text-3xl font-extrabold text-slate-900 dark:text-white sm:text-4xl">
              Pay a Flat Tool Fee. Zero Patient Commissions.
            </p>
            <p className="mx-auto mt-4 max-w-2xl text-sm text-slate-600 dark:text-slate-400">
              Never pay 15% to 25% cuts on consultations. Keep 100% of your earnings via direct bank-to-bank UPI.
            </p>
          </div>

          <div className="mt-16 grid gap-8 md:grid-cols-3">
            {/* Tier 1: Free */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Starter Doctor</h3>
                <p className="mt-2 text-xs text-slate-500">For new independent practices establishing their first digital presence.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹0</span>
                  <span className="text-xs text-slate-500">/ forever</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> Verified Doctor Profile</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> Google Maps Listing</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> Basic Appointment Link</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> Up to 30 Appointments/mo</li>
                </ul>
              </div>
              <Link href="/onboarding" className="mt-8 block w-full rounded-lg border border-slate-300 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200">
                Get Started Free
              </Link>
            </div>

            {/* Tier 2: Pro */}
            <div className="relative rounded-2xl border-2 border-brand-600 bg-white p-8 shadow-xl shadow-brand-600/10 dark:bg-slate-900 flex flex-col justify-between">
              <div className="absolute -top-3.5 right-6 rounded-full bg-brand-600 px-3 py-0.5 text-[11px] font-bold uppercase tracking-wider text-white">
                Most Popular
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Solo Practice Pro</h3>
                <p className="mt-2 text-xs text-slate-500">Complete operating suite for independent clinics and single practitioners.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹499</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> Everything in Starter</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> Unlimited Live Token Queue</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> 30-Second Prescription Builder</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> WhatsApp PDF Receipts & Rx Links</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> Receptionist PWA Counter Mode</li>
                </ul>
              </div>
              <Link href="/onboarding" className="mt-8 block w-full rounded-lg bg-brand-600 py-2.5 text-center text-xs font-semibold text-white shadow-sm hover:bg-brand-700">
                Start 14-Day Free Trial
              </Link>
            </div>

            {/* Tier 3: Clinic */}
            <div className="rounded-2xl border border-slate-200 bg-white p-8 dark:border-slate-800 dark:bg-slate-900 flex flex-col justify-between">
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-white">Multi-Doctor Clinic</h3>
                <p className="mt-2 text-xs text-slate-500">For polyclinics, dental setups, and multi-speciality medical centres.</p>
                <div className="mt-6 flex items-baseline gap-1">
                  <span className="text-4xl font-extrabold text-slate-900 dark:text-white">₹1,999</span>
                  <span className="text-xs text-slate-500">/ month</span>
                </div>
                <ul className="mt-6 space-y-3 text-xs text-slate-600 dark:text-slate-300">
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> Multiple Doctor Rosters & Splits</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> Reception Staff Accounts</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> Daily Cashflow & Expense P&L</li>
                  <li className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-brand-600" /> Custom Domain Integration</li>
                </ul>
              </div>
              <Link href="/onboarding" className="mt-8 block w-full rounded-lg border border-slate-300 py-2.5 text-center text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-200">
                Upgrade to ClinicOS
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* 8. FAQ ACCORDION SECTION */}
      <section className="border-t border-slate-200 bg-white py-16 px-4 dark:border-slate-800 dark:bg-slate-900 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <div className="text-center">
            <h2 className="text-xs font-bold uppercase tracking-wider text-brand-600">Frequently Asked Questions</h2>
            <p className="mt-2 text-2xl font-extrabold text-slate-900 dark:text-white sm:text-3xl">
              Everything You Need to Know About DocSphere
            </p>
          </div>

          <div className="mt-10 space-y-3">
            {faqs.map((faq, idx) => {
              const isOpen = openFaq === idx;
              return (
                <div
                  key={idx}
                  className="overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 dark:border-slate-800 dark:bg-slate-950/50 transition"
                >
                  <button
                    onClick={() => setOpenFaq(isOpen ? null : idx)}
                    className="flex w-full items-center justify-between p-4 text-left text-xs font-bold text-slate-900 dark:text-white"
                  >
                    <span>{faq.q}</span>
                    <ChevronDown className={`h-4 w-4 text-slate-400 transition-transform ${isOpen ? "rotate-180" : ""}`} />
                  </button>
                  {isOpen && (
                    <div className="px-4 pb-4 text-xs text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-850 pt-3">
                      {faq.a}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* 9. TRUST & COMPLIANCE FOOTER */}
      <footer id="trust" className="border-t border-slate-200 bg-slate-900 py-12 px-4 text-white dark:border-slate-800 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="grid gap-8 md:grid-cols-4">
            <div className="md:col-span-2">
              <div className="flex items-center gap-2 text-xl font-bold">
                <Stethoscope className="h-6 w-6 text-brand-400" /> DocSphere ClinicOS
              </div>
              <p className="mt-3 max-w-md text-xs text-slate-400">
                The digital operating layer for independent healthcare in India. Compliant with National Medical Commission (NMC) Telemedicine Guidelines and Digital Personal Data Protection (DPDP) Act.
              </p>
              <div className="mt-4 flex items-center gap-3 text-xs text-slate-400">
                <ShieldCheck className="h-4 w-4 text-brand-400" /> Non-Autonomous Clinical AI (Human-in-the-Loop)
              </div>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Quick Links</h4>
              <ul className="mt-3 space-y-2 text-xs text-slate-400">
                <li><Link href="/onboarding" className="hover:text-white">Doctor AI Onboarding</Link></li>
                <li><Link href="/search" className="hover:text-white">Find a Doctor Nearby</Link></li>
                <li><Link href="/clinic/desk" className="hover:text-white">Reception Desk Console</Link></li>
                <li><Link href="/doctor/queue" className="hover:text-white">Doctor OPD Chamber</Link></li>
                <li><Link href="/clinic/expenses" className="hover:text-white">Clinic P&L Ledger</Link></li>
                <li><Link href="/admin/analytics" className="hover:text-white text-brand-400 font-medium">Founder SaaS Analytics</Link></li>
                <li><Link href="/admin/verifications" className="hover:text-white text-red-400 font-medium">Doctor Council Verifications</Link></li>
              </ul>
            </div>

            <div>
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-300">Pilot Testbed</h4>
              <p className="mt-3 text-xs text-slate-400">
                Dehradun Medical Hub<br />
                Rajpur Road • EC Road • Chakrata Road<br />
                Uttarakhand, India
              </p>
            </div>
          </div>

          <div className="mt-12 border-t border-slate-800 pt-6 text-center text-xs text-slate-500">
            © 2026 DocSphere / ClinicOS. All rights reserved. Built for independent doctors and healthcare providers.
          </div>
        </div>
      </footer>
    </div>
  );
}
