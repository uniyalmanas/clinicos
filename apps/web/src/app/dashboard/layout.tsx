"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Stethoscope,
  LayoutDashboard,
  Users,
  CalendarDays,
  Ticket,
  ClipboardList,
  FileText,
  CreditCard,
  BarChart3,
  Smartphone,
  Settings,
  UserCog,
  BriefcaseMedical,
  DoorOpen,
  Banknote,
  Pill,
  Menu,
  X,
  Plus,
  Volume2,
  LogOut,
  ChevronRight,
  ExternalLink,
  Sparkles,
  Lock,
  ChevronDown,
} from "lucide-react";

// ─────────────────────────────────────────────
// NAVIGATION DEFINITION
// ─────────────────────────────────────────────

const SOLO_NAV = [
  { label: "Dashboard",      href: "/dashboard",           icon: LayoutDashboard },
  { label: "Patients",       href: "/dashboard/patients",  icon: Users },
  { label: "Appointments",   href: "/dashboard/desk",      icon: CalendarDays, badge: "Live" },
  { label: "Queue",          href: "/dashboard/chambers",  icon: Ticket,        badge: "OPD" },
  { label: "Consultation",   href: "/doctor/consult",      icon: Stethoscope },
  { label: "Prescriptions",  href: "/dashboard/consult",   icon: FileText },
  { label: "Billing",        href: "/dashboard/finance",   icon: CreditCard,    badge: "₹" },
  { label: "Finance",        href: "/clinic/settlement",   icon: Banknote },
  { label: "Patient Portal", href: "/patient/portal",      icon: Smartphone },
  { label: "Clinic Admin",   href: "/dashboard/settings",  icon: Settings },
];

const CLINIC_CORE_NAV = [
  { label: "Dashboard",      href: "/dashboard",           icon: LayoutDashboard },
  { label: "Patients",       href: "/dashboard/patients",  icon: Users },
  { label: "Appointments",   href: "/dashboard/desk",      icon: CalendarDays,  badge: "Live" },
  { label: "Queue",          href: "/dashboard/chambers",  icon: Ticket,        badge: "OPD" },
  { label: "Consultation",   href: "/doctor/consult",      icon: Stethoscope },
  { label: "Prescriptions",  href: "/dashboard/consult",   icon: FileText },
  { label: "Billing",        href: "/dashboard/finance",   icon: CreditCard,    badge: "₹" },
  { label: "Finance",        href: "/clinic/settlement",   icon: Banknote },
];

const CLINIC_MGMT_NAV = [
  { label: "Doctors",         href: "/dashboard/admin",    icon: BriefcaseMedical },
  { label: "Staff",           href: "/dashboard/settings", icon: UserCog },
  { label: "Rooms / Chambers",href: "/dashboard/chambers", icon: DoorOpen },
  { label: "Reports",         href: "/dashboard/finance",  icon: BarChart3 },
  { label: "Settlements",     href: "/clinic/expenses",    icon: Banknote,      badge: "EOD" },
];

const CLINIC_BOTTOM_NAV = [
  { label: "Patient Portal",  href: "/patient/portal",     icon: Smartphone },
  { label: "Pharmacy",        href: "/dashboard/pharmacy", icon: Pill, badge: "Optional", optional: true },
  { label: "Clinic Admin",    href: "/dashboard/settings", icon: Settings },
];

const FUTURE_MODULES = [
  "ABDM / ABHA",
  "Laboratory",
  "Insurance",
  "IPD / Beds",
  "Rehab",
  "Marketplace",
  "Advanced AI",
];

// Role-based route allowlist
const ROLE_ALLOWLIST: Record<string, string[]> = {
  receptionist: ["/dashboard/desk", "/dashboard/patients", "/dashboard/chambers", "/patient/portal"],
  front_desk:   ["/dashboard/desk", "/dashboard/patients", "/dashboard/chambers", "/patient/portal"],
  staff:        ["/dashboard/desk", "/dashboard/patients", "/dashboard/chambers", "/patient/portal"],
  pharmacist:   ["/dashboard/pharmacy", "/dashboard/patients"],
  lab_tech:     ["/dashboard/patients"],
  doctor:       ["/dashboard", "/dashboard/patients", "/dashboard/desk", "/dashboard/chambers",
                 "/doctor/consult", "/dashboard/consult", "/dashboard/finance", "/patient/portal"],
};

// ─────────────────────────────────────────────
// NAV ITEM COMPONENT
// ─────────────────────────────────────────────
function NavItem({
  item,
  isActive,
  onClick,
}: {
  item: { label: string; href: string; icon: any; badge?: string; optional?: boolean };
  isActive: boolean;
  onClick?: () => void;
}) {
  const Icon = item.icon;
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group flex items-center justify-between rounded-[12px] px-3 py-2.5 text-[12px] font-semibold transition-all ${
        isActive
          ? "bg-[#0071E3] text-white shadow-sm"
          : "text-[#444] hover:bg-black/[0.05] hover:text-[#1D1D1F] dark:text-[#A1A1A6] dark:hover:bg-white/[0.07] dark:hover:text-white"
      }`}
    >
      <div className="flex items-center gap-2.5">
        <Icon className={`h-[15px] w-[15px] shrink-0 ${isActive ? "text-white" : "text-[#86868B] group-hover:text-[#0071E3] dark:text-[#636366] dark:group-hover:text-[#2997FF]"}`} />
        <span>{item.label}</span>
      </div>
      {item.badge && (
        <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${
          isActive
            ? "bg-white/20 text-white"
            : item.optional
            ? "bg-[#FF9F0A]/15 text-[#FF9F0A]"
            : "bg-black/[0.05] text-[#86868B] dark:bg-white/[0.07] dark:text-[#636366]"
        }`}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="px-3 pt-3 pb-1">
      <span className="text-[10px] font-bold uppercase tracking-widest text-[#86868B] dark:text-[#636366]">
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────
// SIDEBAR CONTENT
// ─────────────────────────────────────────────
function SidebarContent({
  pathname,
  currentUser,
  practiceMode,
  onClose,
  onLogout,
  onUpgrade,
  isUpgrading,
  upgradeNote,
}: {
  pathname: string;
  currentUser: any;
  practiceMode: "solo" | "clinic";
  onClose?: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
  isUpgrading: boolean;
  upgradeNote: string | null;
}) {
  const [futureOpen, setFutureOpen] = useState(false);
  const userRole = (currentUser?.role || "").toLowerCase();
  const allowlist = ROLE_ALLOWLIST[userRole];
  const isSolo = practiceMode === "solo";

  // Filter nav items based on role
  const filterItems = (items: typeof SOLO_NAV) =>
    allowlist ? items.filter((i) => allowlist.includes(i.href)) : items;

  const profileInitials = currentUser?.full_name
    ? currentUser.full_name.split(" ").map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
    : "CL";

  const isPrivileged = ["owner", "clinic_admin", "superadmin", "admin"].includes(userRole);

  return (
    <div className="flex h-full flex-col">
      {/* ── Brand Header ── */}
      <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.07]">
        <div className="flex items-center gap-2.5">
          <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#0071E3] text-white shadow-sm">
            <Stethoscope className="h-5 w-5" />
          </div>
          <div>
            <div className="text-[13px] font-black text-[#1D1D1F] dark:text-white tracking-tight">Clinicos</div>
            <div className="text-[10px] text-[#86868B] dark:text-[#636366] font-medium">
              {isSolo ? "Solo Practice" : "Clinic Plan"}
            </div>
          </div>
        </div>

        {/* Clinic card */}
        <div className="mt-3 rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.07] px-3 py-2.5 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-[#1D1D1F] dark:text-white truncate max-w-[140px]">
              {currentUser?.clinic_name || "Your Clinic"}
            </span>
            <span className="flex h-2 w-2 rounded-full bg-[#30D158] animate-pulse shrink-0" />
          </div>
          <p className="text-[10px] text-[#86868B] dark:text-[#636366] mt-0.5 truncate">
            {currentUser?.full_name || "Clinic Staff"} · {currentUser?.role || "Staff"}
          </p>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-2 space-y-0.5">

        {/* SOLO PLAN */}
        {isSolo && (
          <>
            {filterItems(SOLO_NAV).map((item) => (
              <NavItem key={item.href + item.label} item={item} isActive={pathname === item.href} onClick={onClose} />
            ))}
          </>
        )}

        {/* CLINIC PLAN */}
        {!isSolo && (
          <>
            {/* Core */}
            {filterItems(CLINIC_CORE_NAV).map((item) => (
              <NavItem key={item.href + item.label} item={item} isActive={pathname === item.href} onClick={onClose} />
            ))}

            {/* Clinic Management group (owner/admin only) */}
            {isPrivileged && (
              <>
                <SectionLabel label="Clinic Management" />
                {CLINIC_MGMT_NAV.map((item) => (
                  <NavItem key={item.href + item.label} item={item} isActive={pathname === item.href} onClick={onClose} />
                ))}
              </>
            )}

            {/* Bottom group */}
            <SectionLabel label="More" />
            {filterItems(CLINIC_BOTTOM_NAV).map((item) => (
              <NavItem key={item.href + item.label} item={item} isActive={pathname === item.href} onClick={onClose} />
            ))}
          </>
        )}

        {/* ── FUTURE MODULES (collapsed, locked) ── */}
        <div className="pt-2">
          <button
            type="button"
            onClick={() => setFutureOpen((p) => !p)}
            className="w-full flex items-center justify-between rounded-[12px] px-3 py-2 text-[11px] font-semibold text-[#86868B] dark:text-[#636366] hover:bg-black/[0.04] dark:hover:bg-white/[0.05] transition"
          >
            <div className="flex items-center gap-2">
              <Lock className="h-3.5 w-3.5" />
              <span>Coming Soon</span>
            </div>
            <ChevronDown className={`h-3.5 w-3.5 transition-transform ${futureOpen ? "rotate-180" : ""}`} />
          </button>

          {futureOpen && (
            <div className="mt-1 rounded-[12px] bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.05] dark:border-white/[0.06] px-3 py-2.5 space-y-2">
              {FUTURE_MODULES.map((name) => (
                <div key={name} className="flex items-center justify-between">
                  <span className="text-[11px] text-[#86868B] dark:text-[#636366]">{name}</span>
                  <span className="text-[9px] font-bold uppercase tracking-wider text-[#86868B]/60 dark:text-[#636366]/60 bg-black/[0.04] dark:bg-white/[0.06] px-1.5 py-0.5 rounded-full">
                    Soon
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.07] space-y-2">

        {/* Upgrade callout — solo only */}
        {isSolo && isPrivileged && (
          <div className="rounded-[12px] bg-gradient-to-br from-[#0071E3]/10 to-[#5856D6]/10 border border-[#0071E3]/20 dark:border-[#2997FF]/20 p-2.5">
            <div className="flex items-center gap-1 text-[11px] font-bold text-[#0071E3] dark:text-[#2997FF]">
              <Sparkles className="h-3 w-3" />
              Upgrade to Clinic Plan
            </div>
            <p className="text-[10px] text-[#86868B] dark:text-[#636366] mt-1 leading-snug">
              Unlock multi-doctor rosters, chambers, settlements & more.
            </p>
            <button
              type="button"
              onClick={onUpgrade}
              disabled={isUpgrading}
              className="mt-2 w-full flex items-center justify-center gap-1 rounded-[9px] bg-[#0071E3] py-1.5 text-[10px] font-bold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition disabled:opacity-50"
            >
              {isUpgrading ? "Upgrading..." : "Upgrade · ₹1,299/mo"}
            </button>
            {upgradeNote && (
              <p className="mt-1.5 text-center text-[10px] text-[#30D158] font-semibold">{upgradeNote}</p>
            )}
          </div>
        )}

        <div className="flex items-center justify-between px-1">
          <span className="text-[10px] text-[#86868B] dark:text-[#636366]">Appearance</span>
          <ThemeToggle />
        </div>

        {/* Profile card */}
        <Link
          href={isPrivileged ? "/dashboard/settings" : "/dashboard/desk"}
          onClick={onClose}
          className="flex items-center justify-between rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.07] p-2.5 shadow-sm hover:border-[#0071E3]/40 dark:hover:border-[#2997FF]/40 transition group"
        >
          <div className="flex items-center gap-2 min-w-0">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[11px] font-bold dark:text-[#2997FF] group-hover:bg-[#0071E3] group-hover:text-white transition">
              {profileInitials}
            </div>
            <div className="min-w-0">
              <div className="text-[11px] font-bold text-[#1D1D1F] dark:text-white truncate">
                {currentUser?.full_name || "Clinic User"}
              </div>
              <div className="text-[10px] text-[#86868B] dark:text-[#636366] truncate capitalize">
                {currentUser?.role || "Staff"}
              </div>
            </div>
          </div>
          <ChevronRight className="h-4 w-4 shrink-0 text-[#86868B] group-hover:text-[#0071E3] dark:group-hover:text-[#2997FF] transition" />
        </Link>

        <button
          onClick={onLogout}
          type="button"
          className="w-full flex items-center justify-center gap-1.5 rounded-[12px] py-1.5 text-[11px] font-semibold text-[#86868B] hover:text-[#FF453A] hover:bg-[#FF453A]/10 dark:text-[#636366] dark:hover:text-[#FF453A] dark:hover:bg-[#FF453A]/10 transition"
        >
          <LogOut className="h-3.5 w-3.5" />
          Sign Out
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────
// MAIN LAYOUT
// ─────────────────────────────────────────────
export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [practiceMode, setPracticeMode] = useState<"solo" | "clinic">("solo");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeNote, setUpgradeNote] = useState<string | null>(null);
  const [chimePlaying, setChimePlaying] = useState(false);

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
        const pt = parsed.practice_type;
        if (pt === "clinic" || pt === "solo") setPracticeMode(pt);

        // Role-based redirect guards
        const role = (parsed?.role || "").toLowerCase();
        if (role === "receptionist" || role === "front_desk" || role === "staff") {
          if (
            pathname.includes("/dashboard/finance") ||
            pathname.includes("/dashboard/admin") ||
            pathname.includes("/dashboard/settings") ||
            pathname.includes("/clinic/settlement")
          ) {
            router.replace("/dashboard/desk");
            return;
          }
        }
      } catch {}
    }
    setAuthChecked(true);
  }, [pathname, router]);

  const handleLogout = () => {
    localStorage.removeItem("clinicos_token");
    localStorage.removeItem("clinicos_user");
    router.replace("/login");
  };

  const handleUpgrade = async () => {
    try {
      setIsUpgrading(true);
      const token = localStorage.getItem("clinicos_token");
      const res = await fetch("/api/clinic/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
        body: JSON.stringify({ action: "upgrade_plan", target_plan: "multi_clinic" }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.detail || "Upgrade failed.");
      setPracticeMode("clinic");
      const updated = { ...currentUser, practice_type: "clinic", subscription_plan: "multi_clinic" };
      setCurrentUser(updated);
      localStorage.setItem("clinicos_user", JSON.stringify(updated));
      setUpgradeNote("✅ Upgraded to Clinic Plan!");
      setTimeout(() => setUpgradeNote(null), 4000);
    } catch (e: any) {
      alert(e.message || "Failed to upgrade.");
    } finally {
      setIsUpgrading(false);
    }
  };

  const playChime = () => {
    try {
      setChimePlaying(true);
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = ctx.currentTime;
      [[587.33, now], [880, now + 0.18]].forEach(([freq, start]) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.25, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.6);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.6);
      });
      setTimeout(() => setChimePlaying(false), 800);
    } catch {
      setChimePlaying(false);
    }
  };

  if (!authChecked) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#ECEEF2] dark:bg-black text-xs text-[#86868B]">
        Checking clinic access...
      </div>
    );
  }

  const sharedSidebarProps = {
    pathname,
    currentUser,
    practiceMode,
    onLogout: handleLogout,
    onUpgrade: handleUpgrade,
    isUpgrading,
    upgradeNote,
  };

  const pageName = pathname === "/dashboard"
    ? (practiceMode === "solo" ? "Dashboard" : "Dashboard")
    : pathname.split("/").pop()?.replace(/-/g, " ") || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-[#ECEEF2] text-[#1D1D1F] dark:bg-black dark:text-[#F5F5F7]">

      {/* ── DESKTOP SIDEBAR ── */}
      <aside className="hidden lg:flex w-60 flex-col border-r border-black/[0.06] bg-[#ECEEF2] dark:border-white/[0.07] dark:bg-black">
        <SidebarContent {...sharedSidebarProps} />
      </aside>

      {/* ── MOBILE DRAWER ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-64 flex-col bg-[#ECEEF2] dark:bg-[#111111] shadow-2xl">
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.07]">
              <span className="text-sm font-black text-[#1D1D1F] dark:text-white">Clinicos</span>
              <button onClick={() => setSidebarOpen(false)} className="rounded-full p-1 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]">
                <X className="h-5 w-5 text-[#86868B]" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent {...sharedSidebarProps} onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 flex-col overflow-hidden">

        {/* TOP HEADER */}
        <header className="h-14 shrink-0 flex items-center justify-between border-b border-black/[0.06] bg-[#ECEEF2]/80 dark:border-white/[0.07] dark:bg-black/80 backdrop-blur-2xl px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-full p-1.5 hover:bg-black/[0.05] dark:hover:bg-white/[0.08]"
            >
              <Menu className="h-5 w-5 text-[#86868B]" />
            </button>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-[#86868B] dark:text-[#636366]">{currentUser?.clinic_name || "Clinicos"}</span>
              <ChevronRight className="h-3 w-3 text-[#86868B]" />
              <strong className="text-[#1D1D1F] dark:text-white capitalize">{pageName}</strong>
              <span className="ml-1 hidden sm:inline-flex items-center rounded-full bg-[#0071E3]/10 border border-[#0071E3]/20 px-2 py-0.5 text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF]">
                {practiceMode === "solo" ? "👨‍⚕️ Solo" : "🏥 Clinic"}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={playChime}
              title="Test Chime"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] shadow-sm hover:bg-black/[0.02] active:scale-95 dark:border-white/[0.12] dark:bg-[#1C1C1E] dark:text-white"
            >
              <Volume2 className={`h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF] ${chimePlaying ? "animate-bounce" : ""}`} />
              <span className="hidden sm:inline">Chime</span>
            </button>

            <Link
              href="/dashboard/desk"
              className="inline-flex items-center gap-1.5 rounded-full bg-[#0071E3] px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Walk-in</span>
            </Link>

            <Link
              href="/patient/portal"
              target="_blank"
              className="hidden md:inline-flex items-center gap-1 rounded-full border border-black/[0.08] bg-white px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] shadow-sm hover:bg-black/[0.02] active:scale-95 dark:border-white/[0.12] dark:bg-[#1C1C1E] dark:text-white"
            >
              <span>Patient Portal</span>
              <ExternalLink className="h-3 w-3" />
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#ECEEF2] dark:bg-black">
          {children}
        </main>
      </div>
    </div>
  );
}
