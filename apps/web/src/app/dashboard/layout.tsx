"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  Stethoscope, 
  Building2, 
  UserCheck, 
  CreditCard, 
  Users, 
  Pill, 
  Settings, 
  Menu, 
  X, 
  Bell, 
  Plus, 
  ArrowLeft, 
  Volume2, 
  Sparkles, 
  LogOut,
  QrCode,
  CheckCircle2,
  ChevronRight,
  ExternalLink
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chimePlaying, setChimePlaying] = useState(false);
  const [selectedDoctor, setSelectedDoctor] = useState("dr-rahul");

  // Web Audio chime for quick counter alert
  const playCounterChime = () => {
    try {
      setChimePlaying(true);
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Tone 1: 587.33 Hz (D5)
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.type = "sine";
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Tone 2: 880.00 Hz (A5)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.00, now + 0.2);
      gain2.gain.setValueAtTime(0.3, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.8);

      setTimeout(() => setChimePlaying(false), 900);
    } catch (e) {
      console.error(e);
      setChimePlaying(false);
    }
  };

  const navItems = [
    { label: "OPD Overview", href: "/dashboard", icon: Building2 },
    { label: "Reception Counter Desk", href: "/dashboard/desk", icon: UserCheck, badge: "Chime PWA" },
    { label: "Doctor Chambers", href: "/dashboard/chambers", icon: Stethoscope, badge: "Live OPD" },
    { label: "Patient EMR Records", href: "/dashboard/patients", icon: Users },
    { label: "Clinic Cashflow & P&L", href: "/dashboard/finance", icon: CreditCard },
    { label: "Pharmacy & Lab Orders", href: "/dashboard/pharmacy", icon: Pill },
    { label: "Clinic Settings & QR", href: "/dashboard/settings", icon: Settings },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100 dark:bg-[#0B0F17]">
      {/* 1. SIDEBAR (DESKTOP) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-slate-200 bg-white dark:border-[#1E2638] dark:bg-[#0E1422]">
        {/* Brand & Clinic Roster */}
        <div className="p-4 border-b border-slate-100 dark:border-[#1E2638]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-600 text-white shadow-sm shadow-brand-600/20">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black text-slate-900 dark:text-white">DocSphere ClinicOS</div>
              <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium">Dehradun Medical Hub</div>
            </div>
          </div>

          {/* Active Clinic Switcher */}
          <div className="mt-3 rounded-xl bg-slate-50 p-2 border border-slate-200/80 dark:bg-[#131B2E] dark:border-[#1E2638]">
            <div className="flex items-center justify-between text-[11px] font-bold text-slate-900 dark:text-white">
              <span>Derma Care Skin & Laser</span>
              <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>
            <p className="text-[10px] text-slate-500 dark:text-slate-400">14, Rajpur Road • 2 Doctors Active</p>
          </div>
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-brand-600 text-white shadow-md shadow-brand-600/25"
                    : "text-slate-600 hover:bg-slate-50 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-[#161F36] dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? "text-white" : "text-slate-400 dark:text-slate-400"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      isActive
                        ? "bg-white/20 text-white"
                        : "bg-brand-50 text-brand-700 dark:bg-brand-950/70 dark:text-brand-300 border border-brand-200/30 dark:border-brand-800/40"
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
        <div className="p-3 border-t border-slate-100 dark:border-[#1E2638] space-y-2">
          <div className="flex items-center justify-between px-2 text-xs">
            <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Theme & Mode</span>
            <ThemeToggle />
          </div>

          <div className="flex items-center justify-between rounded-xl bg-slate-50 p-2.5 dark:bg-[#131B2E] border border-transparent dark:border-[#1E2638]">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-full bg-brand-100 text-brand-800 text-xs font-bold dark:bg-brand-950 dark:text-brand-300">
                RS
              </div>
              <div className="text-left">
                <div className="text-xs font-bold text-slate-900 dark:text-white">Dr. Rahul Sharma</div>
                <div className="text-[10px] text-slate-500 dark:text-slate-400">Dermatologist • Admin</div>
              </div>
            </div>
            <Link
              href="/"
              title="Return to Public Home"
              className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <LogOut className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </aside>

      {/* 2. MOBILE DRAWER */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative flex w-72 flex-col bg-white dark:bg-slate-900 p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <span className="font-bold text-slate-900 dark:text-white">ClinicOS Navigation</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-lg p-1 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <nav className="mt-4 flex-1 space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-xs font-semibold ${
                      isActive
                        ? "bg-brand-600 text-white"
                        : "text-slate-700 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-slate-100 dark:border-slate-800">
              <ThemeToggle showLabel />
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT WRAPPER */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOP COMMAND HEADER */}
        <header className="h-16 shrink-0 border-b border-slate-200 bg-white dark:border-[#1E2638] dark:bg-[#0E1422]/90 dark:backdrop-blur-md flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-[#161F36]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span>Derma Care Clinic</span>
              <ChevronRight className="h-3.5 w-3.5 text-slate-400" />
              <strong className="text-slate-900 dark:text-white capitalize">
                {pathname === "/dashboard"
                  ? "Daily OPD Overview"
                  : pathname.replace("/dashboard/", "").replace("-", " ")}
              </strong>
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Quick Chime Sound Test */}
            <button
              onClick={playCounterChime}
              title="Test Counter Audio Chime"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 dark:border-[#1E2638] dark:bg-[#131B2E] dark:text-slate-200 dark:hover:bg-[#18233C]"
            >
              <Volume2 className={`h-3.5 w-3.5 text-brand-600 dark:text-brand-400 ${chimePlaying ? "animate-bounce" : ""}`} />
              <span className="hidden sm:inline">Chime Bell</span>
            </button>

            {/* Quick Admit Walk-in Link */}
            <Link
              href="/dashboard/desk"
              className="inline-flex items-center gap-1 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition shadow-brand-600/20"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Admit Walk-in</span>
            </Link>

            {/* Live Patient Portal shortcut */}
            <Link
              href="/patient/portal"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-50 dark:border-[#1E2638] dark:bg-[#131B2E] dark:text-slate-300 dark:hover:bg-[#18233C]"
              title="Open Patient Portal in new tab"
            >
              <span>Patient Portal</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-slate-50 dark:bg-[#0B0F17]">
          {children}
        </main>
      </div>
    </div>
  );
}
