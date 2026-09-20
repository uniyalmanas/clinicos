"use client";

import React from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import BrowseSpecialtiesSection from "@/components/BrowseSpecialtiesSection";
import { Stethoscope, ArrowRight } from "lucide-react";

export default function SpecialtiesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#ECEEF2] text-[#1D1D1F] dark:bg-[#000000] dark:text-[#F5F5F7]">
      {/* 1. TOP TRANSLUCENT NAVIGATION BAR */}
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

          <nav className="hidden items-center gap-1 sm:flex rounded-full bg-black/[0.04] p-1 dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06]">
            <Link 
              href="/search" 
              className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition"
            >
              Find Doctors
            </Link>
            <Link 
              href="/specialties" 
              className="rounded-full px-4 py-1.5 text-xs font-semibold bg-white text-[#1D1D1F] dark:bg-white/10 dark:text-white transition shadow-sm"
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
            <Link 
              href="/dashboard" 
              className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition"
            >
              Clinic Desk
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="hidden sm:inline-block rounded-full px-4 py-2 text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.04] dark:text-white dark:hover:bg-white/[0.08] transition"
            >
              Sign In
            </Link>
            <Link
              href="/onboarding"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0071E3] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition"
            >
              Join as Doctor <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN USER-REQUESTED SECTION COMPONENT */}
      <main className="flex-1">
        <BrowseSpecialtiesSection />
      </main>

      {/* 3. MINIMAL COMPLIANT FOOTER */}
      <footer className="border-t border-black/[0.06] bg-[#ECEEF2] py-12 px-4 dark:border-white/[0.08] dark:bg-[#000000] sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-[#86868B] dark:text-[#8E8E93]">
          <div className="flex items-center gap-2">
            <Stethoscope className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
            <span className="font-bold text-[#1D1D1F] dark:text-white">DocSphere ClinicOS</span>
            <span>•</span>
            <span>Direct Healthcare Operating Infrastructure • NMC & ABDM Ready</span>
          </div>

          <div className="flex items-center gap-6 font-medium">
            <Link href="/" className="hover:text-[#1D1D1F] dark:hover:text-white">Home</Link>
            <Link href="/specialties" className="hover:text-[#1D1D1F] dark:hover:text-white font-semibold text-[#0071E3] dark:text-[#2997FF]">Specialties</Link>
            <Link href="/search" className="hover:text-[#1D1D1F] dark:hover:text-white">Find Doctors</Link>
            <Link href="/dashboard" className="hover:text-[#1D1D1F] dark:hover:text-white">Workspace</Link>
            <Link href="/patient/portal" className="hover:text-[#1D1D1F] dark:hover:text-white">Patient Portal</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
