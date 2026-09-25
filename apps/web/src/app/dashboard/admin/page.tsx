"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Stethoscope, 
  Clock, 
  CreditCard, 
  ShieldCheck, 
  Save, 
  CheckCircle2, 
  Users, 
  Sparkles, 
  RefreshCw, 
  Percent, 
  Lock, 
  Unlock, 
  Activity, 
  Layers, 
  Radio, 
  TrendingUp, 
  DollarSign, 
  Server, 
  Printer, 
  Phone, 
  FileText, 
  AlertTriangle, 
  Check, 
  X, 
  ChevronRight, 
  Sliders, 
  BarChart3, 
  Send, 
  Play, 
  Zap, 
  KeyRound, 
  Eye, 
  EyeOff, 
  QrCode, 
  Info, 
  Scale, 
  Coins 
} from "lucide-react";

type AdminTab = "config" | "rbac" | "simulation" | "health" | "finance";

export default function SuperAdminConsolePage() {
  const [activeTab, setActiveTab] = useState<AdminTab>("config");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // 1. Global Config State
  const [globalConfig, setGlobalConfig] = useState<any>({
    clinic_name: "Derma Care Skin & Laser Centre",
    tagline: "Advanced Dermatology, Laser & Aesthetic Surgery",
    reg_number: "UK-CEA-2024-8891",
    gstin: "05AAACD1234F1Z8",
    abdm_facility_id: "IN0510001298",
    nabl_cert_no: "NABL-MC-2026-9912",
    official_helpline: "+91 98765 43210",
    official_email: "contact@dermacare.in",
    address_line: "14, Rajpur Road, Near Ashley Hall",
    city: "Dehradun",
    state: "Uttarakhand",
    postal_code: "248001",
    bank_account_no: "001405009821",
    bank_ifsc: "ICIC0000014",
    bank_name: "ICICI Bank - Rajpur Road Branch",
    upi_vpa: "dermacare@icici",
    default_consultation_fee: 600,
    default_followup_fee: 300,
    default_doctor_split: 80,
    tax_rates: {
      clinical_consultations: 0,
      aesthetic_laser_procedures: 18,
      pharmacy_dispensing: 12
    },
    invoice_header_note: "Govt Recognized Clinical Establishment • NABH Compliant Standards",
    invoice_footer_note: "Computer Generated Tax Invoice. All disputes subject to Dehradun jurisdiction."
  });

  // 2. Discount Tiers State
  const [discountTiers, setDiscountTiers] = useState<any[]>([
    { id: "disc-1", code: "SSP_SURGICAL", label: "Special Surgical Package", discount_pct: 15, applicable_to: "Dermatosurgery / Minor OT", is_active: true },
    { id: "disc-2", code: "SR_CITIZEN", label: "Senior Citizen Welfare (>60y)", discount_pct: 20, applicable_to: "All OPD Consultations", is_active: true },
    { id: "disc-3", code: "CLINIC_STAFF", label: "Clinic Staff & Dependent Proxy", discount_pct: 50, applicable_to: "Consultations & In-house Labs", is_active: true },
    { id: "disc-4", code: "DEFENSE_VET", label: "Armed Forces & Veterans", discount_pct: 25, applicable_to: "Full Clinic Services", is_active: true }
  ]);

  // 3. User & Role Management (RBAC)
  const [rbacMatrix, setRbacMatrix] = useState<any>({});
  const [staffUsers, setStaffUsers] = useState<any[]>([]);
  const [auditLogs, setAuditLogs] = useState<any[]>([]);

  // 4. What-If Simulation State
  const [simFeeDelta, setSimFeeDelta] = useState<number>(200);
  const [simSplitPct, setSimSplitPct] = useState<number>(80);
  const [simMonthlyVolume, setSimMonthlyVolume] = useState<number>(450);
  const [simResult, setSimResult] = useState<any>(null);
  const [simRunning, setSimRunning] = useState(false);

  // 5. System Health & Integrations State
  const [integrations, setIntegrations] = useState<any[]>([]);
  const [syncingTarget, setSyncingTarget] = useState<string | null>(null);

  // 6. Financial Overview State
  const [financeKpis, setFinanceKpis] = useState<any>({
    gross_revenue_mtd: 342600,
    soundbox_upi_inflow: 245000,
    cash_collected: 97600,
    total_expenses_mtd: 158400,
    real_net_profit_mtd: 184200,
    profit_margin_pct: 53.8,
    pending_doctor_payouts: 13240,
    petty_cash_reserve: 1450,
    monthly_expense_breakdown: {
      clinic_lease_rent: 45000,
      staff_salaries: 65000,
      clinical_consumables: 32400,
      power_utilities_internet: 16000
    }
  });

  // Practice Plan state
  const [practiceType, setPracticeType] = useState<"solo" | "clinic">("solo");
  const [isUpgradingPlan, setIsUpgradingPlan] = useState(false);

  // Modal / PIN authorization
  const [pinModalOpen, setPinModalOpen] = useState(false);
  const [pinAction, setPinAction] = useState<string>("");
  const [pinPayload, setPinPayload] = useState<any>(null);
  const [managerPinInput, setManagerPinInput] = useState("");
  const [pinError, setPinError] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  const handleUpgradePlan = async () => {
    try {
      setIsUpgradingPlan(true);
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
      if (!res.ok) throw new Error(data.detail || "Upgrade failed.");

      setPracticeType("clinic");
      const userStr = localStorage.getItem("clinicos_user");
      if (userStr) {
        const u = JSON.parse(userStr);
        u.practice_type = "clinic";
        u.subscription_plan = "multi_clinic";
        localStorage.setItem("clinicos_user", JSON.stringify(u));
      }
      showToast("Practice upgraded to Multi-Doctor Polyclinic (₹1,299/mo). Capacity: 10 Doctors.");
    } catch (e: any) {
      showToast(e.message || "Upgrade failed.");
    } finally {
      setIsUpgradingPlan(false);
    }
  };

  // Fetch admin telemetry on mount
  const fetchAdminData = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/clinic/admin?clinic_slug=derma-care-dehradun");
      if (res.ok) {
        const data = await res.json();
        if (data.global_config) setGlobalConfig(data.global_config);
        if (data.discount_tiers) setDiscountTiers(data.discount_tiers);
        if (data.rbac_matrix) setRbacMatrix(data.rbac_matrix);
        if (data.staff_users) setStaffUsers(data.staff_users);
        if (data.system_integrations) setIntegrations(data.system_integrations);
        if (data.financial_kpis) setFinanceKpis(data.financial_kpis);
        if (data.audit_logs) setAuditLogs(data.audit_logs);
      }
    } catch (err) {
      console.error("Failed to load admin console data:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    try {
      const userStr = localStorage.getItem("clinicos_user");
      if (userStr) {
        const u = JSON.parse(userStr);
        if (u?.practice_type === "clinic" || u?.practice_type === "solo") {
          setPracticeType(u.practice_type);
        }
      }
    } catch (e) {}
    fetchAdminData();
  }, []);

  // Run simulation whenever simulation inputs change
  useEffect(() => {
    const runSimulation = async () => {
      setSimRunning(true);
      try {
        const res = await fetch("/api/clinic/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "run_what_if_simulation",
            fee_delta: simFeeDelta,
            split_pct: simSplitPct,
            monthly_volume: simMonthlyVolume,
            base_fee: globalConfig.default_consultation_fee || 600
          })
        });
        if (res.ok) {
          const data = await res.json();
          setSimResult(data.simulation);
        }
      } catch (e) {
        console.error("Simulation error", e);
      } finally {
        setSimRunning(false);
      }
    };
    runSimulation();
  }, [simFeeDelta, simSplitPct, simMonthlyVolume, globalConfig.default_consultation_fee]);

  // Handle PIN Authorized Actions
  const handleExecutePinAction = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError("");

    if (!managerPinInput.trim()) {
      setPinError("Manager Authorization PIN is required.");
      return;
    }

    try {
      if (pinAction === "toggle_user_lock") {
        const { user_id, is_active } = pinPayload;
        const res = await fetch("/api/clinic/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "toggle_user_lock",
            user_id,
            is_active,
            manager_pin: managerPinInput
          })
        });
        const data = await res.json();
        if (res.ok) {
          setStaffUsers(prev => prev.map(u => u.id === user_id ? { ...u, is_active } : u));
          showToast(data.message);
          setPinModalOpen(false);
        } else {
          setPinError(data.detail || "Action failed");
        }
      }

      if (pinAction === "save_global_config") {
        const res = await fetch("/api/clinic/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "save_global_config",
            global_config: globalConfig,
            discount_tiers: discountTiers,
            manager_pin: managerPinInput
          })
        });
        const data = await res.json();
        if (res.ok) {
          showToast(data.message);
          setPinModalOpen(false);
        } else {
          setPinError(data.detail || "Save failed");
        }
      }

      if (pinAction === "apply_simulation_to_live") {
        const { new_fee, split_pct } = pinPayload;
        const res = await fetch("/api/clinic/admin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "apply_simulation_to_live",
            new_fee,
            split_pct,
            manager_pin: managerPinInput
          })
        });
        const data = await res.json();
        if (res.ok) {
          setGlobalConfig((prev: any) => ({
            ...prev,
            default_consultation_fee: new_fee,
            default_doctor_split: split_pct
          }));
          showToast(data.message);
          setPinModalOpen(false);
        } else {
          setPinError(data.detail || "Simulation apply failed");
        }
      }
    } catch (err: any) {
      setPinError(err.message || "Network error");
    } finally {
      setManagerPinInput("");
    }
  };

  // Trigger system integration sync
  const handleTriggerSync = async (target: string) => {
    setSyncingTarget(target);
    try {
      const res = await fetch("/api/clinic/admin", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "trigger_system_sync",
          target
        })
      });
      const data = await res.json();
      if (res.ok) {
        showToast(data.message);
      }
    } catch (e: any) {
      alert("Sync error: " + e.message);
    } finally {
      setSyncingTarget(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-[16px] bg-[#1D1D1F] px-4 py-3 text-xs font-semibold text-white shadow-2xl dark:bg-white dark:text-[#1D1D1F] border border-white/10 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/60 hover:text-white dark:text-black/60">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER & PILL BADGES */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-purple-50 px-2.5 py-0.5 border border-purple-500/20 text-[11px] font-black uppercase tracking-wider text-purple-700 dark:bg-purple-500/10 dark:text-purple-400">
              <span className="h-2 w-2 rounded-full bg-purple-500 animate-pulse" />
              <span>👑 Clinic System Owner Hub</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-0.5 border border-blue-500/20 text-[10px] font-bold text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              <ShieldCheck className="h-3 w-3" />
              <span>Practice Manager Authorized</span>
            </span>
            <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 border text-[10px] font-bold ${
              practiceType === "solo"
                ? "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
                : "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
            }`}>
              {practiceType === "solo" ? "👨‍⚕️ Solo Practice Pro (1 Doctor · ₹599/mo)" : "🏥 Polyclinic Multi-Doctor (10 Seats · ₹1,299/mo)"}
            </span>
          </div>

          <h1 className="mt-1.5 text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
            ClinicOS Super Admin Console
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5 font-medium">
            Global Configuration • User Roles • System Health • Financial Overview
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => fetchAdminData()}
            className="flex items-center gap-1.5 rounded-[12px] bg-white dark:bg-[#1C1C1E] px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] dark:text-white border border-black/[0.08] dark:border-white/[0.12] hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition shadow-apple-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#0071E3]" : "text-[#86868B] dark:text-[#8E8E93]"}`} />
            <span>Sync Systems</span>
          </button>

          <button 
            onClick={() => {
              setPinAction("save_global_config");
              setPinPayload(null);
              setPinModalOpen(true);
            }}
            className="flex items-center gap-1.5 rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-98"
          >
            <Save className="h-3.5 w-3.5" />
            <span>Save Global Config</span>
          </button>
        </div>
      </div>

      {/* 2. 4 CLINICAL GOVERNANCE PILLARS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-apple-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs">
              <Building2 className="h-4 w-4" />
              <span>Global Config Hub</span>
            </div>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              Master Base
            </span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Centralized practice identity, NABL/CEA credentials, GSTIN, ABDM ID, default tariffs &amp; discount tiers.
          </p>
        </div>

        <div className="rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-apple-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-purple-700 dark:text-purple-400 font-bold text-xs">
              <Users className="h-4 w-4" />
              <span>Dynamic RBAC Matrix</span>
            </div>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-purple-50 text-purple-700 dark:bg-purple-950/60 dark:text-purple-300">
              5 Roles
            </span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Role-based security: Doctors, Receptionists, Lab Techs, and Pharmacists with 1-click account access lock.
          </p>
        </div>

        <div className="rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-apple-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              <TrendingUp className="h-4 w-4" />
              <span>What-If Simulator</span>
            </div>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              Real-Time
            </span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Simulate fee increases and doctor split revisions to project net monthly profit before committing changes.
          </p>
        </div>

        <div className="rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-apple-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <Radio className="h-4 w-4" />
              <span>Bi-Directional Health</span>
            </div>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              5/5 Online
            </span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Live connection telemetry for NHA ABDM, Pharmacy POS, Pathology LIS, Network Thermal Printer &amp; WhatsApp.
          </p>
        </div>
      </div>

      {/* 3. EXECUTIVE QUICK METRICS RIBBON */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">Real Net Profit MTD</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{financeKpis.real_net_profit_mtd?.toLocaleString()}</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">Gross Revenue MTD</span>
          <div className="text-xl sm:text-2xl font-black text-[#0071E3] dark:text-[#2997FF] mt-1">₹{financeKpis.gross_revenue_mtd?.toLocaleString()}</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">Profit Margin</span>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">{financeKpis.profit_margin_pct}%</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">Staff Accounts</span>
          <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white mt-1">
            {staffUsers.filter(u => u.is_active).length} / {staffUsers.length} Active
          </div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">Pending Doctor Splits</span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">₹{financeKpis.pending_doctor_payouts?.toLocaleString()}</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">System Connectors</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">100% Online</div>
        </div>
      </div>

      {/* 4. APPLE SEGMENTED TAB BAR */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-[14px] bg-[#ECEEF2] p-1 dark:bg-white/[0.06] overflow-x-auto w-full md:w-auto">
          {[
            { id: "config", label: "Global Settings", icon: Building2 },
            { id: "rbac", label: "User Roles & Permissions", icon: Users },
            { id: "simulation", label: "What-If Simulator", icon: TrendingUp },
            { id: "health", label: "System Health & APIs", icon: Radio },
            { id: "finance", label: "Financial P&L Overview", icon: DollarSign }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as AdminTab)}
                className={`flex items-center gap-2 rounded-[10px] px-3.5 py-2 text-xs font-semibold transition whitespace-nowrap ${
                  isActive
                    ? "bg-white dark:bg-[#2C2C2E] text-[#1D1D1F] dark:text-white shadow-apple-sm font-bold"
                    : "text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${isActive ? "text-[#0071E3] dark:text-[#2997FF]" : "text-[#86868B] dark:text-[#8E8E93]"}`} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        <div className="text-xs text-[#86868B] dark:text-[#8E8E93] font-mono">
          Security Level: <strong className="text-purple-600 dark:text-purple-400">SUPER_ADMIN_ELEVATED</strong>
        </div>
      </div>

      {/* 5. TAB 1: GLOBAL CONFIGURATION HUB */}
      {activeTab === "config" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-[22px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-apple-card space-y-6">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0071E3]" />
                  Centralized Practice Identity &amp; Legal Configuration
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                  Universal parameters applied across reception check-in, billing soundbox, tax receipts, and ABDM gateway.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setPinAction("save_global_config");
                  setPinPayload(null);
                  setPinModalOpen(true);
                }}
                className="rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] px-4 py-2 text-xs font-bold text-white shadow-apple-sm transition"
              >
                Save Practice Parameters
              </button>
            </div>

            <div className="grid gap-4 sm:grid-cols-3 text-xs">
              <div className="sm:col-span-2">
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Registered Clinic Name</label>
                <input
                  type="text"
                  value={globalConfig.clinic_name}
                  onChange={e => setGlobalConfig({ ...globalConfig, clinic_name: e.target.value })}
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] dark:border-white/[0.12] dark:bg-white/[0.04] p-2.5 font-bold text-[#1D1D1F] dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Clinical Est. Act Reg #</label>
                <input
                  type="text"
                  value={globalConfig.reg_number}
                  onChange={e => setGlobalConfig({ ...globalConfig, reg_number: e.target.value })}
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] dark:border-white/[0.12] dark:bg-white/[0.04] p-2.5 font-mono text-[#1D1D1F] dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">GSTIN (Legal Tax ID)</label>
                <input
                  type="text"
                  value={globalConfig.gstin}
                  onChange={e => setGlobalConfig({ ...globalConfig, gstin: e.target.value })}
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] dark:border-white/[0.12] dark:bg-white/[0.04] p-2.5 font-mono font-bold text-[#0071E3] dark:text-[#2997FF]"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">ABDM Facility Registry ID (HFR)</label>
                <input
                  type="text"
                  value={globalConfig.abdm_facility_id}
                  onChange={e => setGlobalConfig({ ...globalConfig, abdm_facility_id: e.target.value })}
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] dark:border-white/[0.12] dark:bg-white/[0.04] p-2.5 font-mono text-emerald-600 dark:text-emerald-400 font-bold"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">NABL Accreditation #</label>
                <input
                  type="text"
                  value={globalConfig.nabl_cert_no}
                  onChange={e => setGlobalConfig({ ...globalConfig, nabl_cert_no: e.target.value })}
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] dark:border-white/[0.12] dark:bg-white/[0.04] p-2.5 font-mono text-[#1D1D1F] dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Bank Account Number (Payouts)</label>
                <input
                  type="text"
                  value={globalConfig.bank_account_no}
                  onChange={e => setGlobalConfig({ ...globalConfig, bank_account_no: e.target.value })}
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] dark:border-white/[0.12] dark:bg-white/[0.04] p-2.5 font-mono text-[#1D1D1F] dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Bank IFSC Code</label>
                <input
                  type="text"
                  value={globalConfig.bank_ifsc}
                  onChange={e => setGlobalConfig({ ...globalConfig, bank_ifsc: e.target.value })}
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] dark:border-white/[0.12] dark:bg-white/[0.04] p-2.5 font-mono text-[#1D1D1F] dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Counter UPI ID (VPA)</label>
                <input
                  type="text"
                  value={globalConfig.upi_vpa}
                  onChange={e => setGlobalConfig({ ...globalConfig, upi_vpa: e.target.value })}
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] dark:border-white/[0.12] dark:bg-white/[0.04] p-2.5 font-mono text-[#1D1D1F] dark:text-white"
                />
              </div>
            </div>

            {/* Real-Time Tariff & Discount Engine */}
            <div className="pt-4 border-t border-black/[0.06] dark:border-white/[0.08] space-y-4">
              <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <CreditCard className="h-4 w-4 text-emerald-600" />
                Real-Time Tariff Engine &amp; Discount Tiers
              </h4>

              <div className="grid gap-3 sm:grid-cols-4">
                {discountTiers.map((disc, idx) => (
                  <div key={disc.id || idx} className="p-3.5 rounded-[16px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs font-bold text-[#0071E3] dark:text-[#2997FF]">{disc.code}</span>
                      <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">-{disc.discount_pct}%</span>
                    </div>
                    <div className="text-xs font-bold text-[#1D1D1F] dark:text-white">{disc.label}</div>
                    <div className="text-[10px] text-[#86868B] dark:text-[#8E8E93]">{disc.applicable_to}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 2: DYNAMIC ROLE & PERMISSION MATRIX (RBAC) */}
      {activeTab === "rbac" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Active Staff Roster with Account Lock Action */}
          <div className="rounded-[22px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-apple-card space-y-5">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-purple-600" />
                  Clinic User Accounts &amp; Access Controls
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                  Disable user access immediately if staff departs. Zero session leak guarantee.
                </p>
              </div>

              <span className="text-[11px] font-mono font-bold text-purple-700 dark:text-purple-300 bg-purple-50 dark:bg-purple-950/60 px-3 py-1 rounded-full border border-purple-500/20">
                {staffUsers.filter(u => u.is_active).length} Active Accounts
              </span>
            </div>

            {/* Plan Capacity & Upgrade Banner */}
            {practiceType === "solo" ? (
              <div className="rounded-[16px] bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border border-amber-500/20 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-amber-800 dark:text-amber-300">
                    <Sparkles className="h-3.5 w-3.5" />
                    <span>Solo Practice Pro Plan Active (1 Doctor Seat Capacity)</span>
                  </div>
                  <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">
                    Your practice is limited to 1 Doctor. Staff &amp; receptionists are included unlimited at no extra cost. To onboard visiting consultants or run multiple doctor chambers, upgrade to Polyclinic.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleUpgradePlan}
                  disabled={isUpgradingPlan}
                  className="shrink-0 inline-flex items-center gap-1.5 rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-95 disabled:opacity-50"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isUpgradingPlan ? "Upgrading..." : "Upgrade to Polyclinic (₹1,299/mo)"}</span>
                </button>
              </div>
            ) : (
              <div className="rounded-[14px] bg-emerald-500/10 border border-emerald-500/20 p-3 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-emerald-800 dark:text-emerald-300 font-bold">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  <span>Multi-Doctor Polyclinic Plan Active • Capacity: 10 Doctor Seats</span>
                </div>
                <span className="text-[10px] font-mono text-emerald-700 dark:text-emerald-400">₹1,299/month</span>
              </div>
            )}

            <div className="space-y-3">
              {staffUsers.map((user) => (
                <div 
                  key={user.id}
                  className={`p-4 rounded-[18px] border transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    user.is_active
                      ? "bg-white dark:bg-[#1C1C1E] border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm"
                      : "bg-rose-50/40 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/40 opacity-75"
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white">{user.name}</h4>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-black/[0.04] text-[#1D1D1F] dark:bg-white/[0.08] dark:text-[#F5F5F7] font-semibold">
                        {user.role_label}
                      </span>
                      {user.is_active ? (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-2 py-0.5 rounded-full border border-emerald-500/20">
                          <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-[10px] font-bold text-rose-600 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/60 px-2 py-0.5 rounded-full border border-rose-500/20">
                          <Lock className="h-2.5 w-2.5" /> Locked
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">
                      {user.email} • {user.phone} • Assigned: {user.assigned_chamber}
                    </div>
                    <div className="text-[10px] font-mono text-[#86868B] dark:text-[#8E8E93]">
                      Last Login: {user.last_login} • MFA Status: {user.mfa_enabled ? "Enabled (Authenticator)" : "Password Only"}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {user.is_active ? (
                      <button
                        type="button"
                        onClick={() => {
                          setPinAction("toggle_user_lock");
                          setPinPayload({ user_id: user.id, is_active: false });
                          setPinModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-[12px] bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 dark:hover:bg-rose-900/60 text-rose-600 dark:text-rose-400 border border-rose-200 dark:border-rose-900/50 px-3 py-1.5 text-xs font-bold transition"
                      >
                        <Lock className="h-3.5 w-3.5" />
                        <span>Lock Account</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setPinAction("toggle_user_lock");
                          setPinPayload({ user_id: user.id, is_active: true });
                          setPinModalOpen(true);
                        }}
                        className="inline-flex items-center gap-1.5 rounded-[12px] bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:hover:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-900/50 px-3 py-1.5 text-xs font-bold transition"
                      >
                        <Unlock className="h-3.5 w-3.5" />
                        <span>Restore Access</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Dynamic Role Permission Matrix Table */}
          <div className="rounded-[22px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-apple-card space-y-4">
            <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Role-Based Access Control (RBAC) Privilege Enforcement
            </h4>

            <div className="overflow-x-auto rounded-[16px] border border-black/[0.06] dark:border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-[#86868B] dark:text-[#8E8E93] font-semibold border-b border-black/[0.06] dark:border-white/[0.08]">
                  <tr>
                    <th className="p-3">Module Privilege</th>
                    <th className="p-3 text-center">Super Admin</th>
                    <th className="p-3 text-center">Doctor</th>
                    <th className="p-3 text-center">Receptionist</th>
                    <th className="p-3 text-center">Lab Tech</th>
                    <th className="p-3 text-center">Pharmacist</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {[
                    { priv: "Write Prescriptions & Visit Notes", sa: true, doc: true, rec: false, lab: false, pharm: false },
                    { priv: "View Financial Ledgers & Doctor Splits", sa: true, doc: false, rec: false, lab: false, pharm: false },
                    { priv: "Edit Consultation Tariffs & Splits", sa: true, doc: false, rec: false, lab: false, pharm: false },
                    { priv: "Issue Tokens & Collect Cash/UPI", sa: true, doc: false, rec: true, lab: false, pharm: false },
                    { priv: "Unmasked Patient Phone (DPDP)", sa: true, doc: true, rec: true, lab: false, pharm: false },
                    { priv: "Dispense Drugs & Schedule H1", sa: true, doc: false, rec: false, lab: false, pharm: true },
                    { priv: "Access Pathology Lab Vault & QC", sa: true, doc: true, rec: false, lab: true, pharm: false },
                    { priv: "Revoke User Access / Lock Accounts", sa: true, doc: false, rec: false, lab: false, pharm: false }
                  ].map((row, i) => (
                    <tr key={i} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02]">
                      <td className="p-3 font-semibold text-[#1D1D1F] dark:text-white">{row.priv}</td>
                      <td className="p-3 text-center">{row.sa ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" />}</td>
                      <td className="p-3 text-center">{row.doc ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" />}</td>
                      <td className="p-3 text-center">{row.rec ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" />}</td>
                      <td className="p-3 text-center">{row.lab ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" />}</td>
                      <td className="p-3 text-center">{row.pharm ? <Check className="h-4 w-4 text-emerald-500 mx-auto" /> : <X className="h-4 w-4 text-slate-300 dark:text-slate-600 mx-auto" />}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 3: REAL-TIME "WHAT-IF" SIMULATION ENGINE */}
      {activeTab === "simulation" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-[22px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-apple-card space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <TrendingUp className="h-4 w-4 text-emerald-600" />
                  Real-Time &quot;What-If&quot; Financial Scenario Simulator
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                  Test fee hikes and visiting consultant split revisions in a sandbox before saving to live practice.
                </p>
              </div>

              {simResult && (
                <button
                  type="button"
                  onClick={() => {
                    setPinAction("apply_simulation_to_live");
                    setPinPayload({ new_fee: simResult.new_consultation_fee, split_pct: simSplitPct });
                    setPinModalOpen(true);
                  }}
                  className="rounded-[12px] bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-apple-sm transition"
                >
                  Apply Simulation to Live Practice
                </button>
              )}
            </div>

            {/* Interactive Sliders */}
            <div className="grid gap-6 sm:grid-cols-3 text-xs">
              <div className="p-4 rounded-[18px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">Consultation Fee Adjustment</span>
                  <span className="font-mono font-black text-emerald-600 dark:text-emerald-400 text-sm">
                    {simFeeDelta >= 0 ? `+₹${simFeeDelta}` : `-₹${Math.abs(simFeeDelta)}`}
                  </span>
                </div>
                <input
                  type="range"
                  min="-200"
                  max="600"
                  step="50"
                  value={simFeeDelta}
                  onChange={e => setSimFeeDelta(Number(e.target.value))}
                  className="w-full h-2 bg-black/[0.08] dark:bg-white/[0.12] rounded-lg appearance-none cursor-pointer accent-emerald-600"
                />
                <div className="flex justify-between text-[10px] text-[#86868B] dark:text-[#8E8E93] font-mono">
                  <span>-₹200 Discount</span>
                  <span>Base ₹600</span>
                  <span>+₹600 Hike</span>
                </div>
              </div>

              <div className="p-4 rounded-[18px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">Doctor Split Percentage</span>
                  <span className="font-mono font-black text-[#0071E3] dark:text-[#2997FF] text-sm">
                    {simSplitPct}% / {100 - simSplitPct}%
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={simSplitPct}
                  onChange={e => setSimSplitPct(Number(e.target.value))}
                  className="w-full h-2 bg-black/[0.08] dark:bg-white/[0.12] rounded-lg appearance-none cursor-pointer accent-[#0071E3]"
                />
                <div className="flex justify-between text-[10px] text-[#86868B] dark:text-[#8E8E93] font-mono">
                  <span>50/50 Shared</span>
                  <span>75/25 Standard</span>
                  <span>95/5 Lead</span>
                </div>
              </div>

              <div className="p-4 rounded-[18px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-2">
                <div className="flex justify-between items-center">
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">Monthly Patient Volume</span>
                  <span className="font-mono font-black text-purple-600 dark:text-purple-400 text-sm">
                    {simMonthlyVolume} Visits / mo
                  </span>
                </div>
                <input
                  type="range"
                  min="150"
                  max="1200"
                  step="50"
                  value={simMonthlyVolume}
                  onChange={e => setSimMonthlyVolume(Number(e.target.value))}
                  className="w-full h-2 bg-black/[0.08] dark:bg-white/[0.12] rounded-lg appearance-none cursor-pointer accent-purple-600"
                />
                <div className="flex justify-between text-[10px] text-[#86868B] dark:text-[#8E8E93] font-mono">
                  <span>150 Pilot</span>
                  <span>450 Standard</span>
                  <span>1,200 High</span>
                </div>
              </div>
            </div>

            {/* Simulation Results Display */}
            {simResult && (
              <div className="p-5 rounded-[20px] bg-emerald-500/10 border border-emerald-500/20 space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1.5">
                    <Sparkles className="h-4 w-4 text-emerald-600" />
                    <span>Projected Simulation Results</span>
                  </span>
                  <span className={`text-[10px] font-mono font-bold px-2.5 py-0.5 rounded-full border ${
                    simResult.elasticity_risk === "LOW"
                      ? "bg-emerald-100 text-emerald-800 border-emerald-300 dark:bg-emerald-950/80 dark:text-emerald-300"
                      : "bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-950/80 dark:text-amber-300"
                  }`}>
                    Price Risk: {simResult.elasticity_risk} ({simResult.retention_prediction})
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                  <div className="p-3 rounded-[14px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08]">
                    <div className="text-[10px] text-[#86868B] dark:text-[#8E8E93]">New Fee</div>
                    <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-0.5">
                      ₹{simResult.new_consultation_fee}
                    </div>
                    <div className="text-[9px] font-mono text-[#86868B] dark:text-[#8E8E93]">({simResult.fee_hike_percent}% hike)</div>
                  </div>

                  <div className="p-3 rounded-[14px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08]">
                    <div className="text-[10px] text-[#86868B] dark:text-[#8E8E93]">Projected Monthly Gross</div>
                    <div className="text-2xl font-black text-[#1D1D1F] dark:text-white mt-0.5">
                      ₹{simResult.projected_monthly_gross?.toLocaleString()}
                    </div>
                    <div className="text-[9px] font-mono text-emerald-600 dark:text-emerald-400">+₹{simResult.gross_monthly_delta?.toLocaleString()}</div>
                  </div>

                  <div className="p-3 rounded-[14px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08]">
                    <div className="text-[10px] text-[#86868B] dark:text-[#8E8E93]">Clinic Net Profit Gain</div>
                    <div className="text-2xl font-black text-[#0071E3] dark:text-[#2997FF] mt-0.5">
                      {simResult.projected_clinic_net_profit_delta >= 0 ? "+" : ""}₹{simResult.projected_clinic_net_profit_delta?.toLocaleString()}/mo
                    </div>
                    <div className="text-[9px] font-mono text-[#86868B] dark:text-[#8E8E93]">Retained share</div>
                  </div>

                  <div className="p-3 rounded-[14px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08]">
                    <div className="text-[10px] text-[#86868B] dark:text-[#8E8E93]">Doctor Take-Home</div>
                    <div className="text-2xl font-black text-purple-600 dark:text-purple-400 mt-0.5">
                      ₹{simResult.projected_doctor_payout_per_visit?.toFixed(0)}/visit
                    </div>
                    <div className="text-[9px] font-mono text-purple-600 dark:text-purple-400">
                      ({simResult.doctor_payout_per_visit_delta >= 0 ? "+" : ""}₹{simResult.doctor_payout_per_visit_delta?.toFixed(0)})
                    </div>
                  </div>
                </div>

                <div className="p-3 rounded-[12px] bg-white/60 dark:bg-black/30 border border-emerald-500/20 text-xs text-emerald-900 dark:text-emerald-200">
                  <strong>Executive Summary:</strong> {simResult.summary_text}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 8. TAB 4: SYSTEM HEALTH & BI-DIRECTIONAL INTEGRATIONS */}
      {activeTab === "health" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-[22px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-apple-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Radio className="h-4 w-4 text-[#0071E3]" />
                  Live System Health &amp; Bi-Directional Connectors
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                  Sub-second heartbeat telemetry for NHA gateway, dispensary POS, pathology LIS, and counter hardware.
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => handleTriggerSync("run_diagnostics")}
                  disabled={syncingTarget !== null}
                  className="rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] px-3.5 py-2 text-xs font-bold text-white shadow-apple-sm transition"
                >
                  Run Full Diagnostic Ping
                </button>
              </div>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              {integrations.map((conn) => (
                <div key={conn.id} className="p-4 rounded-[18px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-2 shadow-apple-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">{conn.name}</span>
                    <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
                      {conn.status}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">{conn.details}</p>

                  <div className="flex items-center justify-between text-[10px] font-mono text-[#86868B] dark:text-[#8E8E93] pt-1 border-t border-black/[0.04] dark:border-white/[0.06]">
                    <span>Latency: <strong className="text-emerald-600 dark:text-emerald-400">{conn.latency_ms}ms</strong></span>
                    <span>Last Sync: {conn.last_sync}</span>
                  </div>
                </div>
              ))}
            </div>

            {/* Manual Sync Triggers */}
            <div className="p-4 rounded-[18px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
              <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white">Manual Bi-Directional Sync Triggers</h4>
              <div className="flex flex-wrap gap-2.5">
                <button
                  type="button"
                  onClick={() => handleTriggerSync("push_pharmacy")}
                  disabled={syncingTarget !== null}
                  className="rounded-[10px] border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] dark:text-white shadow-apple-sm hover:bg-black/[0.02]"
                >
                  {syncingTarget === "push_pharmacy" ? "Pushing..." : "Force Push Rx to Pharmacy POS"}
                </button>
                <button
                  type="button"
                  onClick={() => handleTriggerSync("resync_lab")}
                  disabled={syncingTarget !== null}
                  className="rounded-[10px] border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] px-3 py-1.5 text-xs font-semibold text-[#1D1D1F] dark:text-white shadow-apple-sm hover:bg-black/[0.02]"
                >
                  {syncingTarget === "resync_lab" ? "Syncing..." : "Re-sync Pathology Lab Ingestion"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 9. TAB 5: FINANCIAL OVERVIEW DASHBOARD */}
      {activeTab === "finance" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-[22px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-apple-card space-y-5">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Clinic Owner Financial Cockpit &amp; P&amp;L Ledger
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                  Real in-hand net profit tracked across soundbox UPI inflows, cash drawers, expenses, and doctor payouts.
                </p>
              </div>

              <Link
                href="/dashboard/finance"
                className="rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] px-4 py-2 text-xs font-bold text-white shadow-apple-sm transition flex items-center gap-1.5"
              >
                <span>Open Full Finance Desk</span>
                <ChevronRight className="h-3.5 w-3.5" />
              </Link>
            </div>

            <div className="grid gap-3 sm:grid-cols-4">
              <div className="p-4 rounded-[18px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
                <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">Gross Collections MTD</div>
                <div className="text-2xl font-black text-[#1D1D1F] dark:text-white mt-1">₹{financeKpis.gross_revenue_mtd?.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 mt-1">UPI: ₹{financeKpis.soundbox_upi_inflow?.toLocaleString()} • Cash: ₹{financeKpis.cash_collected?.toLocaleString()}</div>
              </div>

              <div className="p-4 rounded-[18px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
                <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">Operational Expenses</div>
                <div className="text-2xl font-black text-rose-600 dark:text-rose-400 mt-1">₹{financeKpis.total_expenses_mtd?.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 mt-1">Rent, Salaries, Consumables</div>
              </div>

              <div className="p-4 rounded-[18px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
                <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">Pending Doctor Payouts</div>
                <div className="text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">₹{financeKpis.pending_doctor_payouts?.toLocaleString()}</div>
                <div className="text-[10px] text-slate-500 mt-1">Visiting doctor revenue split share</div>
              </div>

              <div className="p-4 rounded-[18px] bg-emerald-500/10 border border-emerald-500/20">
                <div className="text-[11px] text-emerald-800 dark:text-emerald-300 font-bold">Real Net Profit</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{financeKpis.real_net_profit_mtd?.toLocaleString()}</div>
                <div className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 mt-1">Margin: {financeKpis.profit_margin_pct}%</div>
              </div>
            </div>

            {/* Expense Breakdown Categories */}
            <div className="p-4 rounded-[18px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3">
              <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white">Fixed &amp; Variable Monthly Expense Breakdown</h4>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-[#86868B] dark:text-[#8E8E93] text-[10px]">Clinic Lease Rent</span>
                  <div className="font-mono font-bold text-[#1D1D1F] dark:text-white mt-0.5">₹{financeKpis.monthly_expense_breakdown?.clinic_lease_rent?.toLocaleString()}</div>
                </div>
                <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-[#86868B] dark:text-[#8E8E93] text-[10px]">Staff Salaries</span>
                  <div className="font-mono font-bold text-[#1D1D1F] dark:text-white mt-0.5">₹{financeKpis.monthly_expense_breakdown?.staff_salaries?.toLocaleString()}</div>
                </div>
                <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-[#86868B] dark:text-[#8E8E93] text-[10px]">Clinical Consumables</span>
                  <div className="font-mono font-bold text-[#1D1D1F] dark:text-white mt-0.5">₹{financeKpis.monthly_expense_breakdown?.clinical_consumables?.toLocaleString()}</div>
                </div>
                <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08]">
                  <span className="text-[#86868B] dark:text-[#8E8E93] text-[10px]">Power &amp; Utilities</span>
                  <div className="font-mono font-bold text-[#1D1D1F] dark:text-white mt-0.5">₹{financeKpis.monthly_expense_breakdown?.power_utilities_internet?.toLocaleString()}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PIN AUTHORIZATION MODAL */}
      {pinModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] shadow-apple-modal p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2 font-bold text-sm text-[#1D1D1F] dark:text-white">
                <Lock className="h-4 w-4 text-[#0071E3]" />
                <span>Manager Authorization Required</span>
              </div>
              <button 
                onClick={() => setPinModalOpen(false)}
                className="p-1 rounded-xl text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
              Modifying system owner settings, user locks, or tariff rates requires Practice Manager security authorization.
            </p>

            <form onSubmit={handleExecutePinAction} className="space-y-4 text-xs">
              <div>
                <input
                  type="password"
                  value={managerPinInput}
                  onChange={e => setManagerPinInput(e.target.value)}
                  placeholder="Enter Manager Security PIN"
                  maxLength={6}
                  required
                  autoFocus
                  className="w-full rounded-[12px] border border-black/[0.15] dark:border-white/[0.15] bg-black/[0.02] dark:bg-white/[0.04] p-3 font-mono text-center text-lg font-bold tracking-widest text-[#1D1D1F] dark:text-white focus:outline-none focus:border-[#0071E3]"
                />
              </div>

              {pinError && (
                <div className="p-2.5 rounded-[12px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-medium">
                  {pinError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPinModalOpen(false)}
                  className="rounded-[12px] border border-black/[0.08] dark:border-white/[0.12] px-4 py-2 font-semibold text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] px-5 py-2 font-bold text-white shadow-apple-sm"
                >
                  Authorize &amp; Execute
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
