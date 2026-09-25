"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";
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
  Plus, 
  Volume2, 
  LogOut,
  ChevronRight,
  ExternalLink,
  Bed,
  Microscope,
  Dumbbell,
  ShieldCheck,
  QrCode,
  Sparkles
} from "lucide-react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [chimePlaying, setChimePlaying] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [practiceMode, setPracticeMode] = useState<"solo" | "clinic">("solo");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeNotification, setUpgradeNotification] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem("clinicos_token");
    if (!token) {
      router.replace(`/login?redirect=${encodeURIComponent(pathname)}`);
      return;
    }
    const userStr = localStorage.getItem("clinicos_user");
    if (userStr) {
      try {
        const parsed = JSON.parse(userStr);
        setCurrentUser(parsed);
        if (parsed.practice_type === "clinic" || parsed.practice_type === "solo") {
          setPracticeMode(parsed.practice_type);
        }
        const role = (parsed?.role || "").toLowerCase();
        // Route protection: prevent reception/staff from opening owner finance, settings or superadmin console
        if (role === "receptionist" || role === "front_desk" || role === "staff") {
          if (pathname.includes("/dashboard/finance") || pathname.includes("/dashboard/admin") || pathname.includes("/dashboard/settings")) {
            router.replace("/dashboard/desk");
            return;
          }
        }
      } catch (e) {}
    }
    setAuthChecked(true);
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("clinicos_token");
    localStorage.removeItem("clinicos_user");
    router.replace("/login");
  };

  const handleUpgradeToClinic = async () => {
    try {
      setIsUpgrading(true);
      const token = localStorage.getItem("clinicos_token");
      const res = await fetch("/api/clinic/admin", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ action: "upgrade_plan", target_plan: "multi_clinic" })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upgrade request failed.");

      setPracticeMode("clinic");
      if (currentUser) {
        const updated = { ...currentUser, practice_type: "clinic", subscription_plan: "multi_clinic" };
        setCurrentUser(updated);
        localStorage.setItem("clinicos_user", JSON.stringify(updated));
      }
      setUpgradeNotification("Upgraded to Polyclinic Plan (₹1,299/mo). Doctor roster unlocked!");
      setTimeout(() => setUpgradeNotification(null), 5000);
    } catch (e: any) {
      alert(e.message || "Failed to upgrade practice plan");
    } finally {
      setIsUpgrading(false);
    }
  };

  // Web Audio chime for quick counter alert (Apple style clean tone)
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
      gain1.gain.setValueAtTime(0.25, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      // Tone 2: 880.00 Hz (A5)
      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(880.00, now + 0.18);
      gain2.gain.setValueAtTime(0.25, now + 0.18);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.75);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.18);
      osc2.stop(now + 0.75);

      setTimeout(() => setChimePlaying(false), 800);
    } catch (e) {
      console.error(e);
      setChimePlaying(false);
    }
  };

  // 1 Doctor Plan Navigation (Solo Practice - ₹599/mo)
  const soloNavItems = [
    { label: "Solo Overview", href: "/dashboard", icon: Stethoscope },
    { label: "Appointments & Queue", href: "/dashboard/desk", icon: UserCheck, badge: "Queue" },
    { label: "Doctor Chamber & Rx", href: "/dashboard/chambers", icon: Stethoscope, badge: "OPD" },
    { label: "Patient Records Vault", href: "/dashboard/patients", icon: Users },
    { label: "Billing & Day Closing", href: "/dashboard/finance", icon: CreditCard, badge: "₹" },
    { label: "ABDM / ABHA Gateway", href: "/dashboard/abdm", icon: QrCode, badge: "Govt" },
    { label: "Front Desk QR Standee", href: "/dashboard/standee", icon: Settings },
    { label: "Practice Settings", href: "/dashboard/settings", icon: Settings },
  ];

  // Multi-Doctor Plan Navigation (Polyclinic - ₹1,299/mo)
  const clinicNavItems = [
    { label: "Polyclinic Overview", href: "/dashboard", icon: Stethoscope },
    { label: "Reception Token Desk", href: "/dashboard/desk", icon: UserCheck, badge: "Live" },
    { label: "Doctor Chambers & OPD", href: "/dashboard/chambers", icon: Stethoscope, badge: "OPD" },
    { label: "Waiting Lounge TV", href: "/waiting-room", icon: Building2, badge: "TV" },
    { label: "Pharmacy & Dispense", href: "/dashboard/pharmacy", icon: Pill, badge: "POS" },
    { label: "Inpatient Beds & Wards", href: "/dashboard/beds", icon: Bed },
    { label: "Pathology & Lab LIS", href: "/dashboard/lab", icon: Microscope, badge: "LIS" },
    { label: "Physio & Rehab", href: "/dashboard/rehab", icon: Dumbbell },
    { label: "TPA & Cashless Claims", href: "/dashboard/insurance", icon: ShieldCheck, badge: "TPA" },
    { label: "ABDM / ABHA Gateway", href: "/dashboard/abdm", icon: QrCode, badge: "Govt" },
    { label: "Settlements & Finance", href: "/dashboard/finance", icon: CreditCard, badge: "EOD" },
    { label: "Master Patient Vault", href: "/dashboard/patients", icon: Users },
    { label: "Front Desk QR Standee", href: "/dashboard/standee", icon: Settings },
    { label: "Clinic Configuration", href: "/dashboard/settings", icon: Settings },
    { label: "Doctors & Staff Admin", href: "/dashboard/admin", icon: ShieldCheck, badge: "Admin" },
  ];

  const activeNavItems = practiceMode === "solo" ? soloNavItems : clinicNavItems;

  const userRole = (currentUser?.role || "super_admin").toLowerCase();
  const isPrivileged = userRole === "super_admin" || userRole === "admin" || userRole === "owner" || userRole === "doctor";

  // Persona-aware navigation: Staff users use operational desks; Doctor/Owner sees finance & admin
  const filteredNavItems = activeNavItems.filter((item) => {
    if (userRole === "super_admin" || userRole === "admin" || userRole === "owner") return true;
    if (userRole === "doctor") {
      return ["/dashboard", "/dashboard/desk", "/dashboard/chambers", "/waiting-room", "/dashboard/finance", "/dashboard/patients", "/dashboard/standee", "/dashboard/admin"].includes(item.href);
    }
    if (userRole === "receptionist" || userRole === "front_desk" || userRole === "staff") {
      return ["/dashboard/desk", "/waiting-room", "/dashboard/patients", "/dashboard/standee"].includes(item.href);
    }
    if (userRole === "pharmacist") {
      return ["/dashboard/pharmacy", "/waiting-room"].includes(item.href);
    }
    if (userRole === "lab_tech") {
      return ["/dashboard/lab", "/waiting-room"].includes(item.href);
    }
    return true;
  });

  const profileInitials = currentUser?.full_name 
    ? currentUser.full_name.split(" ").map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
    : "RS";

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ECEEF2] text-xs text-[#86868B] dark:bg-black dark:text-[#8E8E93]">
        Checking clinic access...
      </div>
    );
  }

  return (
    <div className="flex h-screen overflow-hidden bg-[#ECEEF2] text-[#1D1D1F] dark:bg-[#000000] dark:text-[#F5F5F7]">
      {/* 1. SIDEBAR (APPLE macOS / iPadOS STYLE) */}
      <aside className="hidden lg:flex w-64 flex-col border-r border-black/[0.06] bg-[#ECEEF2] dark:border-white/[0.08] dark:bg-[#000000]">
        {/* Brand & Clinic Roster */}
        <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.08]">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#0071E3] text-white shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div>
              <div className="text-sm font-black text-[#1D1D1F] dark:text-white">DocSphere ClinicOS</div>
              <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93] font-medium">Dehradun Medical Hub</div>
            </div>
          </div>

          {/* Active Clinic Badge */}
          <div className="mt-3 rounded-[14px] bg-white p-2.5 border border-black/[0.06] dark:bg-[#1C1C1E] dark:border-white/[0.08] shadow-apple-sm">
            <div className="flex items-center justify-between text-xs font-bold text-[#1D1D1F] dark:text-white">
              <span className="truncate">{currentUser?.clinic_name || "Derma Care Skin & Laser"}</span>
              <span className="flex h-2 w-2 rounded-full bg-[#30D158] animate-pulse"></span>
            </div>
            <p className="text-[10px] text-[#86868B] dark:text-[#8E8E93] mt-0.5 truncate">
              {currentUser?.full_name ? `${currentUser.full_name} (${currentUser.role || 'Staff'})` : "Active Clinic Workspace"}
            </p>
          </div>

          {/* Practice Mode Switcher (Solo 1-Dr vs Clinic Multi-Dr) */}
          <div className="mt-2.5 rounded-[12px] bg-black/[0.04] p-1 dark:bg-white/[0.06] flex items-center gap-1">
            <button
              type="button"
              onClick={() => setPracticeMode("solo")}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-[9px] text-[10px] font-bold transition ${
                practiceMode === "solo"
                  ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                  : "text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
              }`}
              title="Solo Practice: 1 Doctor (₹599/mo)"
            >
              <span>👨‍⚕️ Solo (₹599)</span>
            </button>
            <button
              type="button"
              onClick={() => setPracticeMode("clinic")}
              className={`flex-1 flex items-center justify-center gap-1 py-1 rounded-[9px] text-[10px] font-bold transition ${
                practiceMode === "clinic"
                  ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                  : "text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white"
              }`}
              title="Polyclinic: Multi-Doctor (₹1,299/mo)"
            >
              <span>🏥 Clinic (₹1,299)</span>
            </button>
          </div>

          {upgradeNotification && (
            <div className="mt-2 rounded-[10px] bg-[#30D158]/15 border border-[#30D158]/30 px-2 py-1 text-[10px] text-[#30D158] font-semibold text-center">
              {upgradeNotification}
            </div>
          )}
        </div>

        {/* Navigation links */}
        <nav className="flex-1 overflow-y-auto p-3 space-y-1">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center justify-between rounded-[12px] px-3.5 py-2.5 text-xs font-semibold transition ${
                  isActive
                    ? "bg-black/[0.08] text-[#1D1D1F] dark:bg-white/[0.12] dark:text-white shadow-sm"
                    : "text-[#86868B] hover:bg-black/[0.04] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:bg-white/[0.06] dark:hover:text-white"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`h-4 w-4 ${isActive ? "text-[#0071E3] dark:text-[#2997FF]" : "text-[#86868B] dark:text-[#8E8E93]"}`} />
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span
                    className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
                      isActive
                        ? "bg-[#0071E3] text-white"
                        : "bg-black/[0.04] text-[#86868B] dark:bg-white/[0.08] dark:text-[#8E8E93]"
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
        <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2">
          {/* Upgrade Callout for Solo Practice */}
          {practiceMode === "solo" && (
            <div className="rounded-[14px] bg-gradient-to-br from-[#0071E3]/10 to-[#5856D6]/10 p-2.5 border border-[#0071E3]/20 dark:border-[#2997FF]/20">
              <div className="flex items-center justify-between text-[11px] font-bold text-[#0071E3] dark:text-[#2997FF]">
                <span className="flex items-center gap-1">
                  <Sparkles className="h-3 w-3" />
                  Solo Practice Pro
                </span>
                <span className="rounded-full bg-[#0071E3]/15 px-1.5 py-0.5 text-[9px] font-bold">1 Doctor</span>
              </div>
              <p className="text-[10px] text-[#86868B] dark:text-[#8E8E93] mt-1 leading-snug">
                Need multiple doctors, fee splits & chamber rosters?
              </p>
              <button
                type="button"
                onClick={handleUpgradeToClinic}
                disabled={isUpgrading}
                className="mt-2 w-full flex items-center justify-center gap-1 rounded-[9px] bg-[#0071E3] py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-[#0077ED] transition active:scale-95 disabled:opacity-50"
              >
                {isUpgrading ? "Upgrading Plan..." : "Upgrade to Polyclinic (₹1,299/mo)"}
              </button>
            </div>
          )}

          <div className="flex items-center justify-between px-2 text-xs">
            <span className="text-[11px] font-medium text-[#86868B] dark:text-[#8E8E93]">Appearance</span>
            <ThemeToggle />
          </div>

          {/* User Profile Card */}
          <Link
            href={isPrivileged ? "/dashboard/admin" : "/dashboard/desk"}
            className="flex items-center justify-between rounded-[14px] bg-white p-2.5 dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm hover:border-[#0071E3]/40 dark:hover:border-[#2997FF]/40 transition group"
          >
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0071E3]/10 text-[#0071E3] text-xs font-bold dark:text-[#2997FF] group-hover:bg-[#0071E3] group-hover:text-white transition">
                {profileInitials}
              </div>
              <div className="text-left min-w-0">
                <div className="text-xs font-bold text-[#1D1D1F] dark:text-white truncate">
                  {currentUser?.full_name || "Dr. Rahul Sharma"}
                </div>
                <div className="text-[10px] text-[#86868B] dark:text-[#8E8E93] truncate">
                  {isPrivileged ? "Medical Director • Clinic Admin" : "Front Desk • Staff Account"}
                </div>
              </div>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-[#86868B] group-hover:text-[#0071E3] dark:group-hover:text-[#2997FF] group-hover:translate-x-0.5 transition" />
          </Link>

          {/* Separate, Isolated Sign Out Action */}
          <button
            onClick={handleLogout}
            type="button"
            className="w-full flex items-center justify-center gap-1.5 rounded-[12px] py-1.5 text-[11px] font-semibold text-[#86868B] hover:text-[#FF453A] hover:bg-[#FF453A]/10 dark:text-[#8E8E93] dark:hover:text-[#FF453A] dark:hover:bg-[#FF453A]/10 transition"
          >
            <LogOut className="h-3.5 w-3.5" />
            <span>Sign Out Session</span>
          </button>
        </div>
      </aside>

      {/* 2. MOBILE DRAWER */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div
            className="fixed inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="relative flex w-72 flex-col bg-[#ECEEF2] dark:bg-[#1C1C1E] p-4 shadow-2xl">
            <div className="flex items-center justify-between pb-4 border-b border-black/[0.06] dark:border-white/[0.08]">
              <span className="font-bold text-[#1D1D1F] dark:text-white">ClinicOS Navigation</span>
              <button
                onClick={() => setSidebarOpen(false)}
                className="rounded-full p-1 text-[#86868B] hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Mobile Practice Mode Switcher */}
            <div className="mt-3 rounded-[12px] bg-black/[0.04] p-1 dark:bg-white/[0.06] flex items-center gap-1">
              <button
                type="button"
                onClick={() => setPracticeMode("solo")}
                className={`flex-1 flex items-center justify-center py-1 rounded-[9px] text-[10px] font-bold transition ${
                  practiceMode === "solo"
                    ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                    : "text-[#86868B] dark:text-[#8E8E93]"
                }`}
              >
                👨‍⚕️ Solo (₹599)
              </button>
              <button
                type="button"
                onClick={() => setPracticeMode("clinic")}
                className={`flex-1 flex items-center justify-center py-1 rounded-[9px] text-[10px] font-bold transition ${
                  practiceMode === "clinic"
                    ? "bg-white text-[#1D1D1F] shadow-sm dark:bg-[#2C2C2E] dark:text-white"
                    : "text-[#86868B] dark:text-[#8E8E93]"
                }`}
              >
                🏥 Clinic (₹1,299)
              </button>
            </div>

            <nav className="mt-3 flex-1 space-y-1 overflow-y-auto">
              {filteredNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center justify-between rounded-[12px] px-3.5 py-2.5 text-xs font-semibold ${
                      isActive
                        ? "bg-black/[0.08] text-[#1D1D1F] dark:bg-white/[0.12] dark:text-white"
                        : "text-[#86868B] hover:bg-black/[0.04] dark:text-[#8E8E93] dark:hover:bg-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </div>
                    {item.badge && (
                      <span className="rounded-full bg-black/[0.04] px-1.5 py-0.5 text-[9px] font-bold text-[#86868B] dark:bg-white/[0.08] dark:text-[#8E8E93]">
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </nav>
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2">
              <ThemeToggle showLabel />
              <Link
                href={isPrivileged ? "/dashboard/admin" : "/dashboard/desk"}
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-between rounded-[12px] bg-white p-2.5 dark:bg-[#2C2C2E] border border-black/[0.06] dark:border-white/[0.08]"
              >
                <div className="flex items-center gap-2">
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-[#0071E3]/10 text-[#0071E3] text-xs font-bold">
                    {profileInitials}
                  </div>
                  <div>
                    <div className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                      {currentUser?.full_name || "Dr. Rahul Sharma"}
                    </div>
                    <div className="text-[10px] text-[#86868B] dark:text-[#8E8E93]">
                      {isPrivileged ? "Medical Director • Clinic Admin" : "Front Desk • Staff Account"}
                    </div>
                  </div>
                </div>
                <ChevronRight className="h-4 w-4 text-[#86868B]" />
              </Link>
              <button
                onClick={() => {
                  setSidebarOpen(false);
                  handleLogout();
                }}
                className="w-full flex items-center justify-center gap-1.5 rounded-[12px] py-2 text-xs font-semibold text-[#FF453A] bg-[#FF453A]/10 hover:bg-[#FF453A]/20 transition"
              >
                <LogOut className="h-3.5 w-3.5" />
                <span>Sign Out Session</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 3. MAIN CONTENT WRAPPER */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* TOP COMMAND HEADER (APPLE TRANSLUCENT MATERIAL) */}
        <header className="h-16 shrink-0 border-b border-black/[0.06] bg-[#ECEEF2]/80 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#000000]/80 flex items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-full p-1.5 text-[#86868B] hover:bg-black/[0.04] dark:hover:bg-white/[0.08]"
            >
              <Menu className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-2 text-xs text-[#86868B] dark:text-[#8E8E93]">
              <span className="font-medium">{currentUser?.clinic_name || "Derma Care Clinic"}</span>
              <ChevronRight className="h-3 w-3 text-[#86868B]" />
              <strong className="text-[#1D1D1F] dark:text-white capitalize">
                {pathname === "/dashboard"
                  ? (practiceMode === "solo" ? "Solo Practice OPD" : "Polyclinic Overview")
                  : pathname.replace("/dashboard/", "").replace("-", " ")}
              </strong>
              <span className="ml-2 hidden sm:inline-flex items-center gap-1 rounded-full bg-[#0071E3]/10 px-2.5 py-0.5 text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20">
                {practiceMode === "solo" ? "👨‍⚕️ Solo (1 Dr · ₹599/mo)" : "🏥 Polyclinic (Multi-Dr · ₹1,299/mo)"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            {/* Quick Chime Sound Test */}
            <button
              onClick={playCounterChime}
              title="Test Counter Audio Chime"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] shadow-apple-sm hover:bg-black/[0.02] active:scale-95 dark:border-white/[0.12] dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-white/[0.04]"
            >
              <Volume2 className={`h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF] ${chimePlaying ? "animate-bounce" : ""}`} />
              <span className="hidden sm:inline">Chime Bell</span>
            </button>

            {/* Quick Admit Walk-in Link */}
            <Link
              href="/dashboard/desk"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0071E3] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Admit Walk-in</span>
            </Link>

            {/* Live Patient Portal shortcut */}
            <Link
              href="/patient/portal"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] shadow-apple-sm hover:bg-black/[0.02] active:scale-95 dark:border-white/[0.12] dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-white/[0.04]"
              title="Open Patient Portal in new tab"
            >
              <span>Patient Portal</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT CONTAINER */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#ECEEF2] dark:bg-[#000000]">
          {children}
        </main>
      </div>
    </div>
  );
}
