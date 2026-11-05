"use client";

import React from "react";
import Image from "next/image";
import Link from "next/link";
import { ShieldCheck, Stethoscope, Clock, Zap, CheckCircle2, Ticket } from "lucide-react";

export default function HeroIllustrationShowcase() {
  return (
    <div className="relative mx-auto mt-12 max-w-4xl">
      {/* Background ambient gradient glow */}
      <div className="absolute -inset-4 rounded-[36px] bg-gradient-to-r from-blue-500/20 via-teal-500/20 to-emerald-500/20 blur-2xl dark:from-blue-600/10 dark:via-teal-600/10 dark:to-emerald-600/10" />

      {/* Main Glass Showcase Container */}
      <div className="relative overflow-hidden rounded-[32px] border border-black/[0.08] dark:border-white/[0.1] bg-white/80 dark:bg-[#1C1C1E]/80 backdrop-blur-xl shadow-apple-card p-6 sm:p-10">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          
          {/* Left: Illustrated Clinical Scene */}
          <div className="lg:col-span-7 flex flex-col items-center justify-center relative">
            <div className="relative flex items-end justify-center gap-4 sm:gap-8 h-64 sm:h-72 w-full">
              {/* Doctor Illustration */}
              <div className="relative w-36 sm:w-44 h-full flex items-end animate-fade-in">
                <Image
                  src="/images/illustrations/doctor-standing.svg"
                  alt="DocSphere Consulting Doctor"
                  width={180}
                  height={260}
                  className="object-contain drop-shadow-md select-none"
                  priority
                />
              </div>

              {/* Patient Illustration */}
              <div className="relative w-32 sm:w-40 h-full flex items-end">
                <Image
                  src="/images/illustrations/patient-seated.svg"
                  alt="Patient in OPD Consultation"
                  width={160}
                  height={220}
                  className="object-contain drop-shadow-md select-none"
                  priority
                />
              </div>
            </div>

            {/* Bottom Platform Shadow / Floor */}
            <div className="w-3/4 h-3 bg-gradient-to-r from-transparent via-slate-300/60 dark:via-slate-700/60 to-transparent rounded-full blur-xs mt-1" />
          </div>

          {/* Right: Live Interactive Ticker & Key Guarantees */}
          <div className="lg:col-span-5 space-y-4">
            {/* Live Chamber Pill */}
            <div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#2C2C2E] p-4 shadow-apple-sm">
              <div className="flex items-center justify-between">
                <span className="flex items-center gap-1.5 text-xs font-bold text-slate-900 dark:text-white">
                  <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500 absolute" />
                  <span className="ml-2">Chamber Live Queue</span>
                </span>
                <span className="rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                  Derma Care OPD
                </span>
              </div>

              <div className="mt-3 flex items-center justify-between">
                <div>
                  <div className="text-[10px] uppercase font-bold text-[#86868B]">In Consultation</div>
                  <div className="text-2xl font-black text-[#1D1D1F] dark:text-white tracking-tight">
                    Token #14
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-[10px] uppercase font-bold text-blue-600 dark:text-blue-400">Next Turn</div>
                  <div className="text-sm font-bold text-slate-700 dark:text-slate-300">
                    Token #15 (2 mins)
                  </div>
                </div>
              </div>
            </div>

            {/* Value Highlights */}
            <div className="space-y-2 text-xs">
              <div className="flex items-center gap-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] p-2.5 text-slate-700 dark:text-slate-300">
                <CheckCircle2 className="h-4 w-4 text-emerald-500 shrink-0" />
                <span className="font-medium">100% Direct Clinic Fee — ₹0 Aggregator Markup</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] p-2.5 text-slate-700 dark:text-slate-300">
                <ShieldCheck className="h-4 w-4 text-blue-500 shrink-0" />
                <span className="font-medium">NMC Verified Doctor Councils (UKMC-8942-2012)</span>
              </div>
              <div className="flex items-center gap-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] p-2.5 text-slate-700 dark:text-slate-300">
                <Zap className="h-4 w-4 text-amber-500 shrink-0" />
                <span className="font-medium">Instant Cryptographic WhatsApp Prescription</span>
              </div>
            </div>

            {/* Quick Action */}
            <div className="pt-2">
              <Link
                href="/book?clinic=derma-care-dehradun"
                className="flex items-center justify-center gap-2 w-full rounded-xl bg-apple-blue py-3 text-xs font-bold text-white shadow-apple-sm hover:bg-[#0077ED] active:scale-98 transition"
              >
                <Ticket className="h-4 w-4" />
                <span>Reserve Token for Today&apos;s OPD</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
