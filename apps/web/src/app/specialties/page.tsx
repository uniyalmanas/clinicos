import React from "react";
import Link from "next/link";
import { Stethoscope } from "lucide-react";
import BrowseSpecialtiesSection from "@/components/BrowseSpecialtiesSection";
import SiteHeader from "@/components/SiteHeader";

export default function SpecialtiesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-[#ECEEF2] text-[#1D1D1F] dark:bg-[#000000] dark:text-[#F5F5F7]">
      {/* 1. ADAPTIVE NAVIGATION BAR (JIT Patient Session + Provider Entrance) */}
      <SiteHeader />

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
