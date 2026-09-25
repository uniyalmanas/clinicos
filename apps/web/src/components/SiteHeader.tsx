"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { usePatientSession } from "@/lib/patientSession";
import { 
  Stethoscope, 
  ArrowRight, 
  User, 
  Ticket, 
  FileText, 
  LogOut, 
  ChevronDown, 
  Sparkles,
  Building2,
  Clock,
  ExternalLink
} from "lucide-react";

interface SiteHeaderProps {
  showProviderLink?: boolean;
}

export default function SiteHeader({ showProviderLink = true }: SiteHeaderProps) {
  const pathname = usePathname();
  const { session, isLoggedIn, logout } = usePatientSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const navLinks = [
    { label: "Find Doctors", href: "/search" },
    { label: "Specialties", href: "/specialties" },
    { label: "Book Appointment", href: "/book" },
    { label: "My Prescriptions & Reports", href: "/patient/portal" },
  ];

  return (
    <header className="sticky top-0 z-50 apple-glass border-b border-black/[0.06] dark:border-white/[0.08]">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0071E3] text-white shadow-apple-sm group-hover:scale-105 transition">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                DocSphere
                <span className="rounded-full bg-emerald-500/10 px-1.5 py-0.2 text-[9px] font-semibold text-emerald-600 dark:text-emerald-400">
                  Dehradun
                </span>
              </span>
              <span className="text-[10px] text-[#86868B] dark:text-[#8E8E93] font-medium leading-none">
                Zero-Markup Healthcare
              </span>
            </div>
          </Link>
        </div>

        {/* Center: Consumer Navigation Links (Frictionless Discovery) */}
        <nav className="hidden items-center gap-1 md:flex rounded-full bg-black/[0.04] p-1 dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06]">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`rounded-full px-4 py-1.5 text-xs transition ${
                  isActive
                    ? "font-semibold bg-white text-[#1D1D1F] dark:bg-white/10 dark:text-white shadow-xs"
                    : "font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
                }`}
              >
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Right Actions: Patient Account Pill or Doctor Entrance */}
        <div className="flex items-center gap-2.5">
          <ThemeToggle />

          {/* If Patient has registered / booked an appointment: The site becomes their account! */}
          {isLoggedIn && session && (
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/40 px-3.5 py-1.5 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100/80 transition shadow-2xs cursor-pointer"
              >
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-600 text-white text-[10px] font-bold">
                  {(session.full_name?.[0] || "P").toUpperCase()}
                </div>
                <span className="max-w-[110px] truncate">{session.full_name?.split(" ")[0] || "Patient"}</span>

                {/* Active Live Token Pill Badge */}
                {session.active_booking && (
                  <span className="hidden sm:inline-flex items-center gap-1 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white animate-pulse">
                    <span>Token #{session.active_booking.token_number || 1}</span>
                  </span>
                )}

                <ChevronDown className="h-3 w-3 opacity-60" />
              </button>

              {/* Patient Account Dropdown Popover */}
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-72 rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-3 shadow-apple-card z-50 text-xs animate-in fade-in zoom-in-95 duration-150">
                  <div className="border-b border-black/[0.06] dark:border-white/[0.08] pb-2.5 mb-2 px-1">
                    <div className="font-bold text-[#1D1D1F] dark:text-white truncate">
                      {session.full_name || "Patient"}
                    </div>
                    <div className="text-[11px] text-[#86868B] font-mono">
                      {session.phone || ""}
                    </div>
                  </div>

                  {/* Active Booking Card */}
                  {session.active_booking && (
                    <div className="rounded-xl border border-apple-amber/20 bg-apple-amber/10 p-3 mb-2 space-y-1">
                      <div className="flex items-center justify-between text-[11px] font-bold text-[#1D1D1F] dark:text-white">
                        <span>Active OPD Token</span>
                        <span className="font-mono text-apple-amber">#{session.active_booking.token_number || 1}</span>
                      </div>
                      <div className="text-[11px] text-gray-700 dark:text-gray-300 truncate">
                        {session.active_booking.doctor_name || "Doctor Consultation"}
                      </div>
                      <div className="text-[10px] text-[#86868B] flex items-center gap-1 truncate">
                        <Building2 className="h-3 w-3 shrink-0" />
                        <span className="truncate">{session.active_booking.clinic_name || "Clinic"}</span>
                      </div>
                      <Link
                        href={session.active_booking.doctor_slug ? `/book?doctor=${session.active_booking.doctor_slug}` : "/book"}
                        onClick={() => setIsDropdownOpen(false)}
                        className="mt-1 block text-[10px] font-semibold text-apple-blue hover:underline"
                      >
                        Track Chamber Queue →
                      </Link>
                    </div>
                  )}

                  {/* Links */}
                  <div className="space-y-1">
                    <Link
                      href="/patient/portal"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
                    >
                      <Sparkles className="h-4 w-4 text-apple-teal" />
                      <span>My Prescriptions &amp; Reports</span>
                    </Link>

                    <Link
                      href="/book"
                      onClick={() => setIsDropdownOpen(false)}
                      className="flex items-center gap-2 rounded-lg px-2.5 py-2 font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
                    >
                      <Ticket className="h-4 w-4 text-apple-blue" />
                      <span>Book Another Appointment</span>
                    </Link>

                    <button
                      type="button"
                      onClick={() => {
                        logout();
                        setIsDropdownOpen(false);
                      }}
                      className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 transition text-left"
                    >
                      <LogOut className="h-4 w-4" />
                      <span>Switch Patient / Exit</span>
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Discreet Doctor Entrance for Healthcare Providers */}
          {showProviderLink && (
            <Link
              href="/for-doctors"
              className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/30 bg-blue-50/80 px-3.5 py-1.5 text-xs font-bold text-[#0071E3] hover:bg-blue-100 dark:border-blue-500/40 dark:bg-blue-950/40 dark:text-[#2997FF] dark:hover:bg-blue-900/40 transition shadow-2xs group whitespace-nowrap"
            >
              <span>For Doctors</span>
              <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
