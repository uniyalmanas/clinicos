"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { Button, Card, Badge, DESIGN_TOKENS } from "@/components/design-system";
import {
  Stethoscope,
  LayoutDashboard,
  Users,
  CalendarDays,
  Calendar,
  Ticket,
  FileText,
  CreditCard,
  BarChart3,
  Smartphone,
  Settings,
  UserCog,
  BriefcaseMedical,
  DoorOpen,
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
  Banknote,
  Building2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────
// NAVIGATION DEFINITION
// ─────────────────────────────────────────────────────────

const SOLO_NAV = [
  { label: "Today",          href: "/dashboard/today",     icon: LayoutDashboard, badge: "Live" },
  { label: "Reception",      href: "/dashboard/reception", icon: Users,         badge: "Desk" },
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
  { label: "Today",          href: "/dashboard/today",     icon: LayoutDashboard, badge: "Live" },
  { label: "Reception",      href: "/dashboard/reception", icon: Users,         badge: "Desk" },
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
  { label: "Doctor Schedule", href: "/dashboard/doctors/schedule", icon: Calendar },
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
  receptionist: ["/dashboard/reception", "/dashboard/today", "/dashboard/patients", "/dashboard/desk", "/dashboard/chambers", "/patient/portal"],
  front_desk:   ["/dashboard/reception", "/dashboard/today", "/dashboard/patients", "/dashboard/desk", "/dashboard/chambers", "/patient/portal"],
  staff:        ["/dashboard/reception", "/dashboard/today", "/dashboard/patients", "/dashboard/desk", "/dashboard/chambers", "/patient/portal"],
  pharmacist:   ["/dashboard/pharmacy", "/dashboard/patients"],
  lab_tech:     ["/dashboard/patients"],
  doctor:       ["/dashboard", "/dashboard/today", "/dashboard/patients", "/dashboard/desk", "/dashboard/chambers",
                 "/doctor/consult", "/dashboard/consult", "/dashboard/finance", "/patient/portal",
                 "/dashboard/doctors/schedule"],
};

// ─────────────────────────────────────────────────────────
// NAV ITEM COMPONENT
// ─────────────────────────────────────────────────────────

interface NavItemProps {
  item: { label: string; href: string; icon: any; badge?: string; optional?: boolean };
  isActive: boolean;
  isCollapsed?: boolean;
  onClick?: () => void;
}

function NavItem({ item, isActive, isCollapsed, onClick }: NavItemProps) {
  const Icon = item.icon;

  if (isCollapsed) {
    return (
      <div className="relative group flex justify-center py-0.5">
        <Link
          href={item.href}
          onClick={onClick}
          className={`flex h-9 w-9 items-center justify-center rounded-lg transition-colors relative ${
            isActive
              ? "bg-[#0071E3] text-white shadow-xs font-semibold"
              : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-white/[0.08] dark:hover:text-white"
          }`}
          title={item.label}
        >
          <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : ""}`} />
          {item.badge && (
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-[#0071E3] ring-2 ring-white dark:ring-black" />
          )}
        </Link>

        {/* Floating Tooltip */}
        <div className="absolute left-full ml-2.5 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none animate-in fade-in duration-100">
          <div className="bg-slate-900 text-white dark:bg-[#1C1C1E] border border-slate-800 dark:border-white/[0.1] rounded-md px-2 py-1 shadow-md">
            <div className="flex items-center gap-1.5">
              <span className="text-[11px] font-medium whitespace-nowrap">{item.label}</span>
              {item.badge && (
                <span className="px-1 py-0.2 rounded text-[9px] font-semibold bg-white/20 text-white">{item.badge}</span>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`group flex items-center justify-between rounded-lg px-2.5 py-1.5 text-[12px] font-medium transition-colors ${
        isActive
          ? "bg-[#0071E3] text-white shadow-xs font-semibold"
          : "text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-300 dark:hover:bg-white/[0.06] dark:hover:text-white"
      }`}
    >
      <div className="flex items-center gap-2.5 min-w-0">
        <Icon className={`h-4 w-4 shrink-0 ${isActive ? "text-white" : "text-slate-400 group-hover:text-slate-700 dark:text-slate-500 dark:group-hover:text-slate-200"}`} />
        <span className="flex-1 truncate">{item.label}</span>
      </div>
      {item.badge && (
        <span className={`px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0 ${
          isActive
            ? "bg-white/20 text-white"
            : item.optional
            ? "bg-amber-50 text-amber-700 border border-amber-200/60 dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40"
            : "bg-blue-50 text-[#0071E3] border border-blue-200/60 dark:bg-blue-950/40 dark:text-[#2997FF] dark:border-blue-900/40"
        }`}>
          {item.badge}
        </span>
      )}
    </Link>
  );
}

// ─────────────────────────────────────────────────────────
// SECTION LABEL
// ─────────────────────────────────────────────────────────

function SectionLabel({ label, isCollapsed }: { label: string; isCollapsed?: boolean }) {
  if (isCollapsed) {
    return <div className="my-1.5 mx-auto w-5 h-px bg-slate-200 dark:bg-white/[0.08]" />;
  }
  return (
    <div className="px-2.5 pt-3 pb-1">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400 dark:text-slate-500">
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SIDEBAR CONTENT
// ─────────────────────────────────────────────────────────

interface SidebarContentProps {
  pathname: string;
  currentUser: any;
  practiceMode: "solo" | "clinic";
  isCollapsed?: boolean;
  onToggleCollapse?: () => void;
  onClose?: () => void;
  onLogout: () => void;
  onUpgrade: () => void;
  isUpgrading: boolean;
  upgradeNote: string | null;
}

function SidebarContent({
  pathname,
  currentUser,
  practiceMode,
  isCollapsed,
  onToggleCollapse,
  onClose,
  onLogout,
  onUpgrade,
  isUpgrading,
  upgradeNote,
}: SidebarContentProps) {
  const [futureOpen, setFutureOpen] = useState(false);
  const userRole = (currentUser?.role || "").toLowerCase();
  const allowlist = ROLE_ALLOWLIST[userRole];
  const isSolo = practiceMode === "solo";

  const filterItems = (items: typeof SOLO_NAV) =>
    allowlist ? items.filter((i) => allowlist.includes(i.href)) : items;

  const profileInitials = currentUser?.full_name
    ? currentUser.full_name.split(" ").map((w: string) => w[0]).filter(Boolean).slice(0, 2).join("").toUpperCase()
    : "CL";

  const isPrivileged = ["owner", "clinic_admin", "superadmin", "admin"].includes(userRole);

  return (
    <div className="flex h-full flex-col">
      {/* ── Brand Header ── */}
      <div className={`border-b border-slate-200/80 dark:border-white/[0.08] ${isCollapsed ? "p-2 flex flex-col items-center gap-2" : "p-3.5"}`}>
        {isCollapsed ? (
          <button
            onClick={onToggleCollapse}
            className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#0071E3] text-white shadow-xs hover:bg-[#0077ED] transition group relative"
            title="Expand Sidebar"
          >
            <Menu className="h-4 w-4" />
            <div className="absolute left-full ml-2.5 hidden group-hover:flex items-center z-50 pointer-events-none">
              <div className="bg-slate-900 text-white rounded-md px-2 py-1 text-[10px] font-medium whitespace-nowrap shadow-md">
                Expand Sidebar
              </div>
            </div>
          </button>
        ) : (
          <>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0071E3] text-white shadow-xs">
                  <Stethoscope className="h-4 w-4" />
                </div>
                <div>
                  <div className="text-[13px] font-bold text-slate-900 dark:text-white tracking-tight leading-none">ClinicOS</div>
                  <div className="text-[10px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                    {isSolo ? "Solo Practice" : "Polyclinic Edition"}
                  </div>
                </div>
              </div>

              {onToggleCollapse && (
                <button
                  onClick={onToggleCollapse}
                  className="rounded-md p-1 text-slate-400 hover:bg-slate-100 hover:text-slate-700 dark:hover:bg-white/[0.06] dark:hover:text-slate-200 transition"
                  title="Collapse sidebar"
                >
                  <Menu className="h-4 w-4" />
                </button>
              )}
            </div>

            {/* Clinic Card */}
            <div className="mt-2.5 p-2 rounded-lg bg-slate-50 dark:bg-white/[0.03] border border-slate-200/70 dark:border-white/[0.06]">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[150px]">
                  {currentUser?.clinic_name || "Your Clinic"}
                </span>
                <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 shrink-0" />
              </div>
              <p className="text-[10px] text-slate-500 dark:text-slate-400 mt-0.5 truncate">
                {currentUser?.full_name || "Staff"} · {currentUser?.role || "Staff"}
              </p>
            </div>
          </>
        )}
      </div>

      {/* ── Navigation ── */}
      <nav className={`flex-1 overflow-y-auto space-y-0.5 ${isCollapsed ? "px-2 py-2" : "px-3 py-2"}`}>
        {/* SOLO PLAN */}
        {isSolo && (
          <>
            {filterItems(SOLO_NAV).map((item) => (
              <NavItem key={item.href + item.label} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} onClick={onClose} />
            ))}
          </>
        )}

        {/* CLINIC PLAN */}
        {!isSolo && (
          <>
            {/* Core */}
            {filterItems(CLINIC_CORE_NAV).map((item) => (
              <NavItem key={item.href + item.label} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} onClick={onClose} />
            ))}

            {/* Clinic Management group (owner/admin only) */}
            {isPrivileged && (
              <>
                <SectionLabel label="Clinic Management" isCollapsed={isCollapsed} />
                {CLINIC_MGMT_NAV.map((item) => (
                  <NavItem key={item.href + item.label} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} onClick={onClose} />
                ))}
              </>
            )}

            {/* Bottom group */}
            <SectionLabel label="More" isCollapsed={isCollapsed} />
            {filterItems(CLINIC_BOTTOM_NAV).map((item) => (
              <NavItem key={item.href + item.label} item={item} isActive={pathname === item.href} isCollapsed={isCollapsed} onClick={onClose} />
            ))}
          </>
        )}

        {/* ── FUTURE MODULES (collapsed, locked) ── */}
        <div className="pt-2">
          {isCollapsed ? (
            <div className="relative group flex justify-center py-1">
              <button
                type="button"
                className="flex h-10 w-10 items-center justify-center rounded-[12px] text-[#86868B] hover:bg-white/[0.05] dark:text-[#636366] dark:hover:bg-white/[0.07] transition"
                title="Coming Soon Modules"
              >
                <Lock className="h-4 w-4" />
                <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                  <Card variant="default" padding="sm">
                    <span className="text-[10px] font-semibold whitespace-nowrap">Coming Soon Modules</span>
                  </Card>
                </div>
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onClick={() => setFutureOpen((p) => !p)}
                className="w-full flex items-center justify-between rounded-[12px] px-3 py-2 text-[11px] font-semibold text-[#86868B] dark:text-[#636366] hover:bg-white/[0.04] dark:hover:bg-white/[0.05] transition"
              >
                <div className="flex items-center gap-2">
                  <Lock className="h-3.5 w-3.5" />
                  <span>Coming Soon</span>
                </div>
                <ChevronDown className={`h-3.5 w-3.5 transition-transform ${futureOpen ? "rotate-180" : ""}`} />
              </button>

              {futureOpen && (
                <div className="mt-1 rounded-[12px] border border-white/[0.05] px-3 py-2.5 space-y-2 bg-white/[0.03] dark:bg-white/[0.04]">
                  {FUTURE_MODULES.map((name) => (
                    <div key={name} className="flex items-center justify-between">
                      <span className="text-[11px] text-[#86868B] dark:text-[#636366]">{name}</span>
                      <span className="text-[9px] font-bold uppercase tracking-wider text-[#86868B]/60 dark:text-[#636366]/60 px-1.5 py-0.5 rounded-full bg-white/[0.04] dark:bg-white/[0.06]">
                        Soon
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </nav>

      {/* ── Footer ── */}
      <div className={`border-t border-black/[0.06] dark:border-white/[0.08] ${isCollapsed ? "p-2 flex flex-col items-center gap-2" : "p-3 space-y-2"}`}>
        {isCollapsed ? (
          <>
            <div className="relative group flex justify-center py-1">
              <ThemeToggle />
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                <Card variant="default" padding="sm">
                  <span className="text-[10px] font-semibold whitespace-nowrap">Theme</span>
                </Card>
              </div>
            </div>

            {/* Profile avatar button with tooltip */}
            <div className="relative group flex justify-center py-1">
              <Link
                href={isPrivileged ? "/dashboard/settings" : "/dashboard/reception"}
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0071E3]/10 text-[#0071E3] text-xs font-bold dark:text-[#2997FF] hover:bg-[#0071E3] hover:text-white transition"
              >
                {profileInitials}
              </Link>
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                <Card variant="default" padding="sm">
                  <span className="text-[10px] font-semibold whitespace-nowrap">
                    {currentUser?.full_name || "Profile"} ({currentUser?.role || "Staff"})
                  </span>
                </Card>
              </div>
            </div>

            {/* Sign Out with tooltip */}
            <div className="relative group flex justify-center py-1">
              <button
                onClick={onLogout}
                type="button"
                className="flex h-9 w-9 items-center justify-center rounded-xl text-[#86868B] hover:text-[#FF453A] hover:bg-[#FF453A]/10 dark:text-[#636366] dark:hover:text-[#FF453A] transition"
                title="Sign Out"
              >
                <LogOut className="h-4 w-4" />
              </button>
              <div className="absolute left-full ml-3 top-1/2 -translate-y-1/2 hidden group-hover:flex items-center z-50 pointer-events-none">
                <Card variant="default" padding="sm">
                  <span className="text-[10px] font-semibold whitespace-nowrap">Sign Out</span>
                </Card>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center justify-between px-1">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Appearance</span>
              <ThemeToggle />
            </div>

            {/* Profile card */}
            <Link
              href={isPrivileged ? "/dashboard/settings" : "/dashboard/reception"}
              onClick={onClose}
              className="flex items-center justify-between rounded-[12px] bg-[#F8F9FA] dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-2.5 shadow-xs hover:border-[#0071E3]/40 dark:hover:border-[#2997FF]/40 transition group"
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

            <Button variant="outline" onClick={onLogout} fullWidth className="text-xs">
              <LogOut className="h-3.5 w-3.5" />
              Sign Out
            </Button>
          </>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// MAIN LAYOUT
// ─────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [practiceMode, setPracticeMode] = useState<"solo" | "clinic">("solo");
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [upgradeNote, setUpgradeNote] = useState<string | null>(null);
  const [chimePlaying, setChimePlaying] = useState(false);

  // Restore collapsed state from localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem("clinicos_sidebar_collapsed");
      if (saved === "true") setIsCollapsed(true);
    } catch {}
  }, []);

  const toggleCollapse = () => {
    setIsCollapsed((prev) => {
      const next = !prev;
      try {
        localStorage.setItem("clinicos_sidebar_collapsed", String(next));
      } catch {}
      return next;
    });
  };

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

        // Redirect from generic /dashboard to role-appropriate page
        if (pathname === "/dashboard") {
          const role = (parsed?.role || "").toLowerCase();
          if (role === "doctor" || role === "owner" || role === "clinic_admin") {
            router.replace("/dashboard/today");
            return;
          }
          if (role === "receptionist" || role === "front_desk" || role === "staff") {
            router.replace("/dashboard/reception");
            return;
          }
          router.replace("/dashboard/today");
          return;
        }

        // Role-based redirect guards
        const role = (parsed?.role || "").toLowerCase();
        const isDoctor = role === "doctor" || role === "owner" || role === "clinic_admin";
        const isFrontDesk = role === "receptionist" || role === "front_desk" || role === "staff";

        if (isFrontDesk) {
          if (
            !pathname.includes("/dashboard/reception") &&
            !pathname.includes("/dashboard/today") &&
            !pathname.includes("/dashboard/patients") &&
            !pathname.includes("/dashboard/chambers") &&
            !pathname.includes("/patient/portal")
          ) {
            router.replace("/dashboard/reception");
            return;
          }
          if (
            pathname.includes("/dashboard/finance") ||
            pathname.includes("/dashboard/admin") ||
            pathname.includes("/dashboard/settings") ||
            pathname.includes("/clinic/settlement")
          ) {
            router.replace("/dashboard/reception");
            return;
          }
        }

        if (isDoctor) {
          if (
            !pathname.includes("/dashboard/today") &&
            !pathname.includes("/dashboard/patients") &&
            !pathname.includes("/dashboard/desk") &&
            !pathname.includes("/dashboard/chambers") &&
            !pathname.includes("/doctor/consult") &&
            !pathname.includes("/dashboard/consult") &&
            !pathname.includes("/patient/portal")
          ) {
            router.replace("/dashboard/today");
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
    isCollapsed,
    onToggleCollapse: toggleCollapse,
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
      <aside className={`hidden lg:flex flex-col border-r border-slate-200/80 bg-white dark:border-white/[0.08] dark:bg-[#111113] transition-all duration-200 ease-in-out shrink-0 ${isCollapsed ? "w-[64px]" : "w-[250px]"} shadow-xs`}>
        <SidebarContent {...sharedSidebarProps} />
      </aside>

      {/* ── MOBILE DRAWER ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden">
          <div className="fixed inset-0 bg-black/40 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <div className="relative flex w-[250px] flex-col bg-white dark:bg-[#111113] shadow-2xl">
            <div className="flex items-center justify-between px-3.5 py-3 border-b border-slate-200/80 dark:border-white/[0.08]">
              <span className="text-sm font-bold text-slate-900 dark:text-white">ClinicOS</span>
              <button onClick={() => setSidebarOpen(false)} className="rounded-md p-1 text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/[0.08]">
                <X className="h-4 w-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <SidebarContent {...sharedSidebarProps} isCollapsed={false} onClose={() => setSidebarOpen(false)} />
            </div>
          </div>
        </div>
      )}

      {/* ── MAIN CONTENT ── */}
      <div className="flex flex-1 flex-col min-w-0 overflow-hidden">

        {/* TOP HEADER (Standardised 64px) */}
        <header className="h-16 shrink-0 flex items-center justify-between border-b border-slate-200/80 bg-white/90 dark:border-white/[0.08] dark:bg-[#0C0D0E]/90 backdrop-blur-md px-3.5 sm:px-6 gap-2">
          <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
            {/* Mobile Drawer Trigger */}
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden rounded-lg p-1.5 text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-white/[0.08] shrink-0"
              title="Open Navigation"
              aria-label="Open Navigation Drawer"
            >
              <Menu className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-1.5 sm:gap-2 text-xs min-w-0">
              <span className="text-slate-500 truncate max-w-[110px] sm:max-w-[160px]">{currentUser?.clinic_name || "ClinicOS"}</span>
              <ChevronRight className="h-3 w-3 text-slate-400 shrink-0" />
              <strong className="text-slate-900 dark:text-white capitalize font-semibold truncate">{pageName}</strong>
              <span className="ml-1 hidden md:inline-flex items-center gap-1 rounded-md bg-blue-50 border border-blue-200/60 px-2 py-0.5 text-[10px] font-medium text-[#0071E3] dark:bg-blue-950/40 dark:border-blue-900/40 dark:text-[#2997FF] shrink-0">
                {practiceMode === "solo" ? (
                  <>
                    <Stethoscope className="h-3 w-3" />
                    <span>Solo Mode</span>
                  </>
                ) : (
                  <>
                    <Building2 className="h-3 w-3" />
                    <span>Clinic Mode</span>
                  </>
                )}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
            <button
              onClick={playChime}
              title="Test Chime"
              className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-2 sm:px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-white/[0.1] dark:bg-[#151618] dark:text-slate-200"
            >
              <Volume2 className={`h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF] ${chimePlaying ? "animate-bounce" : ""}`} />
              <span className="hidden sm:inline">Chime</span>
            </button>

            <Link
              href="/dashboard/reception"
              className="inline-flex items-center gap-1.5 rounded-lg bg-[#0071E3] px-2.5 sm:px-3 py-1.5 text-xs font-semibold text-white shadow-xs hover:bg-[#0077ED] transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>Walk-in</span>
            </Link>

            <Link
              href="/patient/portal"
              target="_blank"
              className="hidden lg:inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-white/[0.1] dark:bg-[#151618] dark:text-slate-200"
            >
              <span>Portal</span>
              <ExternalLink className="h-3 w-3 text-slate-400" />
            </Link>
          </div>
        </header>

        {/* PAGE CONTENT */}
        <main className="flex-1 overflow-y-auto min-w-0 p-3.5 sm:p-5 lg:p-6 bg-[#F8F9FA] dark:bg-[#0C0D0E]">
          {children}
        </main>
      </div>
    </div>
  );
}
