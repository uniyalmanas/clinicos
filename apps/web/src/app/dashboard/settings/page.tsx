"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Building2, 
  Stethoscope, 
  Clock, 
  CreditCard, 
  Printer, 
  QrCode, 
  ShieldCheck, 
  Save, 
  CheckCircle2,
  Users,
  Smartphone,
  Sparkles,
  MapPin,
  RefreshCw,
  Percent,
  Check,
  ExternalLink,
  Bell,
  AlertTriangle,
  Calendar,
  Lock,
  History,
  DoorOpen,
  UserMinus,
  UserCheck,
  X,
  Info,
  DollarSign,
  ChevronDown,
  Layers,
  FileSpreadsheet,
  CheckSquare
} from "lucide-react";
import QRCodeDisplay from "@/components/QRCodeDisplay";

interface TariffVersion {
  id: string;
  clinic_slug: string;
  effective_from: string;
  consultation_fee: number;
  followup_fee: number;
  followup_validity_days: number;
  doctor_split_percentage: number;
  authorized_by: string;
  change_reason: string;
  is_active: boolean;
  created_at: string;
}

interface ShiftGuardrail {
  id: string;
  clinic_slug: string;
  chamber_name: string;
  doctor_slug: string;
  doctor_name: string;
  shift_name: string;
  start_time: string;
  end_time: string;
  token_cutoff_minutes: number;
  token_capacity: number;
  grace_period_mins: number;
  auto_cancel_unseen: boolean;
  is_active: boolean;
}

interface Doctor {
  id: string;
  slug: string;
  full_name: string;
  specialization: string;
  consultation_fee: number;
  is_active?: boolean;
  deactivated_at?: string;
  deactivation_reason?: string;
  final_settlement_id?: string;
  final_payout_amount?: number;
  final_settlement_status?: string;
  chamber_name?: string;
}

type TabType = "tariff" | "shifts" | "roster" | "identity" | "standee";

export default function DashboardSettingsPage() {
  const [activeTab, setActiveTab] = useState<TabType>("tariff");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [clinicId, setClinicId] = useState("");
  const [clinicSlug, setClinicSlug] = useState("derma-care-dehradun");

  // Clinic Profile State
  const [clinicName, setClinicName] = useState("Derma Care Skin & Laser Centre");
  const [tagline, setTagline] = useState("Advanced Dermatology, Laser & Aesthetic Surgery");
  const [regNumber, setRegNumber] = useState("UK-CEA-2024-8891");
  const [address, setAddress] = useState("14, Rajpur Road, Near Ashley Hall");
  const [city, setCity] = useState("Dehradun");
  const [state, setState] = useState("Uttarakhand");
  const [postalCode, setPostalCode] = useState("248001");
  const [phone, setPhone] = useState("+919876543210");
  const [upiVpa, setUpiVpa] = useState("dermacare@icici");

  // Tariff State
  const [fee, setFee] = useState(600);
  const [followupFee, setFollowupFee] = useState(300);
  const [validityDays, setValidityDays] = useState(7);
  const [doctorSplit, setDoctorSplit] = useState(80);
  const [tariffVersions, setTariffVersions] = useState<TariffVersion[]>([]);
  const [showTariffModal, setShowTariffModal] = useState(false);
  const [tariffEffectiveDate, setTariffEffectiveDate] = useState(new Date().toISOString().split("T")[0]);
  const [tariffReason, setTariffReason] = useState("");
  const [tariffPin, setTariffPin] = useState("");
  const [tariffError, setTariffError] = useState("");

  // Shift Guardrails State
  const [shiftGuardrails, setShiftGuardrails] = useState<ShiftGuardrail[]>([]);
  const [morningShift, setMorningShift] = useState("10:00 AM - 02:00 PM");
  const [eveningShift, setEveningShift] = useState("05:00 PM - 08:30 PM");
  const [showShiftModal, setShowShiftModal] = useState(false);
  const [shiftChamber, setShiftChamber] = useState("Chamber 1 - OPD Main");
  const [shiftDoctorSlug, setShiftDoctorSlug] = useState("");
  const [shiftName, setShiftName] = useState("Morning OPD");
  const [shiftStartTime, setShiftStartTime] = useState("10:00 AM");
  const [shiftEndTime, setShiftEndTime] = useState("02:00 PM");
  const [shiftCutoffMins, setShiftCutoffMins] = useState(30);
  const [shiftCapacity, setShiftCapacity] = useState(25);
  const [shiftGraceMins, setShiftGraceMins] = useState(15);
  const [shiftAutoCancel, setShiftAutoCancel] = useState(true);
  const [shiftConflictError, setShiftConflictError] = useState("");

  // Doctors & Safe Offboarding State
  const [doctorsList, setDoctorsList] = useState<Doctor[]>([]);
  const [selectedDoctorForOffboard, setSelectedDoctorForOffboard] = useState<Doctor | null>(null);
  const [offboardReason, setOffboardReason] = useState("Contract Term Completion");
  const [offboardPin, setOffboardPin] = useState("");
  const [offboardError, setOffboardError] = useState("");
  const [offboardingLoading, setOffboardingLoading] = useState(false);
  const [selectedDoctorForReactivate, setSelectedDoctorForReactivate] = useState<Doctor | null>(null);
  const [reactivatePin, setReactivatePin] = useState("");

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Load clinic data on mount
  const fetchClinicData = async () => {
    try {
      setLoading(true);
      let slug = "derma-care-dehradun";
      const userStr = localStorage.getItem("clinicos_user");
      if (userStr) {
        const user = JSON.parse(userStr);
        if (user.clinic_slug) slug = user.clinic_slug;
        if (user.clinic_id) setClinicId(user.clinic_id);
      }
      setClinicSlug(slug);

      const res = await fetch(`/api/clinics?slug=${encodeURIComponent(slug)}`);
      if (res.ok) {
        const data = await res.json();
        if (data.id) setClinicId(data.id);
        if (data.name) setClinicName(data.name);
        if (data.tagline) setTagline(data.tagline);
        if (data.reg_number) setRegNumber(data.reg_number);
        if (data.upi_vpa) setUpiVpa(data.upi_vpa);
        if (data.doctor_split_percentage) setDoctorSplit(Number(data.doctor_split_percentage));
        if (data.address_line) setAddress(data.address_line);
        if (data.city) setCity(data.city);
        if (data.state) setState(data.state);
        if (data.postal_code) setPostalCode(data.postal_code);
        if (data.phone) setPhone(data.phone);

        if (data.consultation_fee) setFee(Number(data.consultation_fee));
        if (data.followup_fee) setFollowupFee(Number(data.followup_fee));
        if (data.followup_validity_days) setValidityDays(Number(data.followup_validity_days));

        if (data.doctors && data.doctors.length > 0) {
          setDoctorsList(data.doctors);
          setShiftDoctorSlug(data.doctors[0].slug);
        }
        if (data.tariff_versions && data.tariff_versions.length > 0) {
          setTariffVersions(data.tariff_versions);
        }
        if (data.shift_guardrails && data.shift_guardrails.length > 0) {
          setShiftGuardrails(data.shift_guardrails);
        }
        if (data.opening_hours) {
          if (data.opening_hours.morning) setMorningShift(data.opening_hours.morning);
          if (data.opening_hours.evening) setEveningShift(data.opening_hours.evening);
        }
      }
    } catch (err) {
      console.error("Failed to load clinic settings:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchClinicData();
  }, []);

  // 1. General Profile Save
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      const payload = {
        id: clinicId || undefined,
        slug: clinicSlug,
        name: clinicName,
        tagline,
        reg_number: regNumber,
        upi_vpa: upiVpa,
        phone,
        address_line: address,
        city,
        state,
        postal_code: postalCode,
        opening_hours: {
          morning: morningShift,
          evening: eveningShift
        }
      };

      const res = await fetch("/api/clinics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const userStr = localStorage.getItem("clinicos_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.clinic_name = clinicName;
          localStorage.setItem("clinicos_user", JSON.stringify(user));
        }
        showToast("Practice profile and contact details saved to Supabase!");
      } else {
        const err = await res.json();
        alert(`Failed to save: ${err.detail || "Server error"}`);
      }
    } catch (err: any) {
      alert(`Error saving clinic settings: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  // 2. Publish Effective-Dated Tariff Version (Fix 1)
  const handlePublishTariff = async (e: React.FormEvent) => {
    e.preventDefault();
    setTariffError("");

    if (tariffPin !== "4491") {
      setTariffError("Invalid Manager PIN. Authorization requires PIN 4491.");
      return;
    }

    if (!tariffReason.trim()) {
      setTariffError("Please provide an audit change reason for this tariff version.");
      return;
    }

    try {
      const res = await fetch("/api/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "version_tariff",
          clinic_slug: clinicSlug,
          effective_from: tariffEffectiveDate,
          consultation_fee: fee,
          followup_fee: followupFee,
          followup_validity_days: validityDays,
          doctor_split_percentage: doctorSplit,
          change_reason: tariffReason,
          manager_pin: tariffPin
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setTariffError(data.detail || "Failed to publish tariff version");
        return;
      }

      if (data.tariff_versions) {
        setTariffVersions(data.tariff_versions);
      }
      setShowTariffModal(false);
      setTariffReason("");
      setTariffPin("");
      showToast(data.message || "New immutable tariff version published successfully!");
    } catch (err: any) {
      setTariffError(err.message || "Network error");
    }
  };

  // 3. Save Shift Guardrail with Chamber Overlap Detection (Fix 2)
  const handleSaveShiftGuardrail = async (e: React.FormEvent) => {
    e.preventDefault();
    setShiftConflictError("");

    const selectedDoc = doctorsList.find(d => d.slug === shiftDoctorSlug);
    const docName = selectedDoc ? selectedDoc.full_name : "Consultant Physician";

    try {
      const res = await fetch("/api/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "save_shift_guardrail",
          clinic_slug: clinicSlug,
          chamber_name: shiftChamber,
          doctor_slug: shiftDoctorSlug,
          doctor_name: docName,
          shift_name: shiftName,
          start_time: shiftStartTime,
          end_time: shiftEndTime,
          token_cutoff_minutes: shiftCutoffMins,
          token_capacity: shiftCapacity,
          grace_period_mins: shiftGraceMins,
          auto_cancel_unseen: shiftAutoCancel
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setShiftConflictError(data.detail || "Chamber conflict detected");
        return;
      }

      if (data.shift_guardrails) {
        setShiftGuardrails(data.shift_guardrails);
      }
      setShowShiftModal(false);
      showToast(`Shift Guardrail for ${shiftChamber} successfully synchronized!`);
    } catch (err: any) {
      setShiftConflictError(err.message || "Failed to save shift guardrail");
    }
  };

  const handleDeleteShift = async (shiftId: string) => {
    if (!confirm("Are you sure you want to remove this shift guardrail?")) return;
    try {
      const res = await fetch("/api/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete_shift_guardrail",
          id: shiftId,
          clinic_slug: clinicSlug
        })
      });
      const data = await res.json();
      if (res.ok && data.shift_guardrails) {
        setShiftGuardrails(data.shift_guardrails);
        showToast("Shift guardrail removed.");
      }
    } catch (err: any) {
      alert("Failed to delete shift: " + err.message);
    }
  };

  // 4. Safe Doctor Offboarding (Fix 3)
  const handleOffboardDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorForOffboard) return;
    setOffboardError("");

    if (offboardPin !== "4491") {
      setOffboardError("Invalid Manager PIN. Authorization requires PIN 4491.");
      return;
    }

    setOffboardingLoading(true);
    try {
      const res = await fetch("/api/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "offboard_doctor",
          doctor_slug: selectedDoctorForOffboard.slug,
          clinic_slug: clinicSlug,
          reason: offboardReason,
          manager_pin: offboardPin
        })
      });

      const data = await res.json();
      if (!res.ok) {
        setOffboardError(data.detail || "Failed to offboard doctor");
        return;
      }

      setDoctorsList(prev => prev.map(doc => 
        doc.slug === selectedDoctorForOffboard.slug ? { ...doc, ...data.doctor } : doc
      ));

      setSelectedDoctorForOffboard(null);
      setOffboardPin("");
      showToast(`Doctor safely archived. Final settlement: ₹${data.settlement.doctor_net_payout} calculated.`);
    } catch (err: any) {
      setOffboardError(err.message || "Failed to offboard doctor");
    } finally {
      setOffboardingLoading(false);
    }
  };

  // 5. Doctor Reactivation (Fix 3)
  const handleReactivateDoctor = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDoctorForReactivate) return;

    if (reactivatePin !== "4491") {
      alert("Invalid Manager PIN. PIN 4491 is required to reactivate.");
      return;
    }

    try {
      const res = await fetch("/api/clinics", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "reactivate_doctor",
          doctor_slug: selectedDoctorForReactivate.slug,
          manager_pin: reactivatePin
        })
      });

      const data = await res.json();
      if (!res.ok) {
        alert(data.detail || "Failed to reactivate doctor");
        return;
      }

      setDoctorsList(prev => prev.map(doc => 
        doc.slug === selectedDoctorForReactivate.slug ? { ...doc, is_active: true, deactivated_at: undefined, deactivation_reason: undefined } : doc
      ));

      setSelectedDoctorForReactivate(null);
      setReactivatePin("");
      showToast(`Doctor ${data.doctor.full_name} restored to active roster!`);
    } catch (err: any) {
      alert(err.message || "Failed to reactivate doctor");
    }
  };

  const activeTariff = tariffVersions.find(v => v.is_active) || tariffVersions[0] || {
    effective_from: "2026-09-01T00:00:00Z",
    consultation_fee: 600,
    followup_fee: 300,
    followup_validity_days: 7,
    doctor_split_percentage: 80,
    authorized_by: "Dr. Ananya Sharma (PIN 4491)",
    change_reason: "Fiscal Year 2026 Q3 OPD Tariff Baseline & Specialist Split Agreement"
  };

  const activeDoctorsCount = doctorsList.filter(d => d.is_active !== false).length;

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Toast Notification (Apple HIG Toast) */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-[16px] bg-[#1D1D1F] px-4 py-3 text-xs font-semibold text-white shadow-2xl dark:bg-white dark:text-[#1D1D1F] border border-white/10 animate-in fade-in slide-in-from-bottom-3 duration-300">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 dark:text-emerald-600 shrink-0" />
          <span>{toastMessage}</span>
          <button onClick={() => setToastMessage(null)} className="ml-2 text-white/60 hover:text-white dark:text-black/60">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      {/* 1. TOP HEADER & ACTION CONTROLS */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-2.5 py-0.5 border border-blue-500/20 text-[11px] font-black uppercase tracking-wider text-blue-700 dark:bg-blue-500/10 dark:text-blue-400">
              <span className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
              <span>Manager PIN 4491 Governed</span>
            </span>
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 border border-emerald-500/20 text-[10px] font-bold text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-400">
              <ShieldCheck className="h-3 w-3" />
              <span>DPDP &amp; NMC Compliant</span>
            </span>
          </div>

          <h1 className="mt-1.5 text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
            Clinic Master Configuration &amp; Roster Settings
          </h1>
          <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5 font-medium">
            Versioned Financial Rules • Shift-Aware Token Guardrails • Proactive Patient Alerts • Safe Roster Management
          </p>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 shrink-0">
          <button 
            onClick={() => fetchClinicData()}
            className="flex items-center gap-1.5 rounded-[12px] bg-white dark:bg-[#1C1C1E] px-3.5 py-2 text-xs font-semibold text-[#1D1D1F] dark:text-white border border-black/[0.08] dark:border-white/[0.12] hover:bg-black/[0.03] dark:hover:bg-white/[0.06] transition shadow-apple-sm"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin text-[#0071E3]" : "text-[#86868B] dark:text-[#8E8E93]"}`} />
            <span>Sync Live</span>
          </button>

          <button 
            onClick={() => {
              setShowTariffModal(true);
              setTariffError("");
            }}
            className="flex items-center gap-1.5 rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] px-4 py-2 text-xs font-bold text-white shadow-sm transition active:scale-98"
          >
            <History className="h-3.5 w-3.5" />
            <span>Publish Rate Version</span>
          </button>
        </div>
      </div>

      {/* 2. 4 CLINICAL GOVERNANCE PILLARS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <div className="rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-apple-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-blue-700 dark:text-blue-400 font-bold text-xs">
              <CreditCard className="h-4 w-4" />
              <span>Effective-Dated Tariffs</span>
            </div>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-300">
              PIN 4491
            </span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Time-scoped rate versions prevent retroactive dispute. Past appointments retain booking-time financial splits.
          </p>
        </div>

        <div className="rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-apple-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-amber-700 dark:text-amber-400 font-bold text-xs">
              <Clock className="h-4 w-4" />
              <span>Shift-Token Guardrails</span>
            </div>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-300">
              30m Cutoff
            </span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Automatic cutoff closes token issuance 30 mins before shift end. "Last 3 tokens" grace alert prevents overhang.
          </p>
        </div>

        <div className="rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-apple-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-rose-700 dark:text-rose-400 font-bold text-xs">
              <DoorOpen className="h-4 w-4" />
              <span>Chamber Conflict Engine</span>
            </div>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-300">
              Collision Lock
            </span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Physical room allocator blocks assigning two doctors to the same physical chamber during overlapping hours.
          </p>
        </div>

        <div className="rounded-[18px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-4 shadow-apple-sm">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2 text-emerald-700 dark:text-emerald-400 font-bold text-xs">
              <ShieldCheck className="h-4 w-4" />
              <span>Safe Doctor Lifecycle</span>
            </div>
            <span className="text-[9px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
              DPDP Safe
            </span>
          </div>
          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
            Deactivation freezes new bookings while preserving 100% of historical EMR &amp; auto-calculating final settlements.
          </p>
        </div>
      </div>

      {/* 3. QUICK METRICS OVERVIEW BAR */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">Active Consultation Fee</span>
          <div className="text-xl sm:text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{activeTariff.consultation_fee}</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">Visiting Split Ratio</span>
          <div className="text-xl sm:text-2xl font-black text-[#0071E3] dark:text-[#2997FF] mt-1">
            {activeTariff.doctor_split_percentage}% / {100 - Number(activeTariff.doctor_split_percentage)}%
          </div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">Tariff Versions</span>
          <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white mt-1">{tariffVersions.length}</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">Chamber Guardrails</span>
          <div className="text-xl sm:text-2xl font-black text-amber-600 dark:text-amber-400 mt-1">{shiftGuardrails.length} Active</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">Clinical Roster</span>
          <div className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white mt-1">{activeDoctorsCount} Active</div>
        </div>

        <div className="rounded-[16px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-3.5 shadow-apple-sm">
          <span className="text-[11px] font-semibold text-[#86868B] dark:text-[#8E8E93]">Token Cutoff Window</span>
          <div className="text-xl sm:text-2xl font-black text-purple-600 dark:text-purple-400 mt-1">30 Mins Prior</div>
        </div>
      </div>

      {/* 4. APPLE SEGMENTED NAVIGATION CONTROL (TABS) */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-1 rounded-[14px] bg-[#ECEEF2] p-1 dark:bg-white/[0.06] overflow-x-auto w-full md:w-auto">
          {[
            { id: "tariff", label: "Tariffs & Splits", icon: CreditCard },
            { id: "shifts", label: "Shifts & Guardrails", icon: Clock },
            { id: "roster", label: "Doctor Roster & Offboarding", icon: Users },
            { id: "identity", label: "Practice Profile", icon: Building2 },
            { id: "standee", label: "Front Desk Standee Studio", icon: QrCode }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as TabType)}
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
          Tenant: <strong className="text-[#1D1D1F] dark:text-white">{clinicSlug}</strong>
        </div>
      </div>

      {/* 5. TAB 1: TARIFFS & REVENUE SPLITS (FIX 1) */}
      {activeTab === "tariff" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Active Tariff Card */}
          <div className="rounded-[22px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-apple-card space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <div>
                <div className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold text-sm">
                  <CheckCircle2 className="h-4 w-4" />
                  <span>Currently Active Tariff (Enforced at Counter &amp; Public Booking)</span>
                </div>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                  Tariff version locked: Past consultations retain booking-time rates and cannot be altered retroactively.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full border border-emerald-500/20">
                  Effective From: {new Date(activeTariff.effective_from).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    setShowTariffModal(true);
                    setTariffError("");
                  }}
                  className="rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] px-4 py-2 text-xs font-bold text-white shadow-apple-sm transition"
                >
                  Create New Revision
                </button>
              </div>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="p-3.5 rounded-[16px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-center">
                <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">Standard Consultation</div>
                <div className="text-2xl font-black text-emerald-600 dark:text-emerald-400 mt-1">₹{activeTariff.consultation_fee}</div>
              </div>

              <div className="p-3.5 rounded-[16px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-center">
                <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">Follow-up Fee</div>
                <div className="text-2xl font-black text-[#1D1D1F] dark:text-white mt-1">₹{activeTariff.followup_fee}</div>
              </div>

              <div className="p-3.5 rounded-[16px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-center">
                <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">Free Follow-up Validity</div>
                <div className="text-2xl font-black text-[#1D1D1F] dark:text-white mt-1">{activeTariff.followup_validity_days} Days</div>
              </div>

              <div className="p-3.5 rounded-[16px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] text-center">
                <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">Visiting Split Ratio</div>
                <div className="text-2xl font-black text-[#0071E3] dark:text-[#2997FF] mt-1">
                  {activeTariff.doctor_split_percentage}% / {100 - Number(activeTariff.doctor_split_percentage)}%
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-[#86868B] dark:text-[#8E8E93] pt-2 border-t border-black/[0.06] dark:border-white/[0.08]">
              <span><strong>Audit Justification:</strong> {activeTariff.change_reason}</span>
              <span className="font-mono text-[11px] mt-1 sm:mt-0">{activeTariff.authorized_by}</span>
            </div>
          </div>

          {/* Immutable Tariff Change-Log (Audit Trail Table) */}
          <div className="rounded-[22px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-apple-card space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <History className="h-4 w-4 text-[#0071E3]" />
                  Immutable Tariff Version Change-Log (Audit Trail)
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                  Permanent record of fee adjustments and revenue split agreements.
                </p>
              </div>
              <span className="text-[11px] font-mono text-[#86868B] dark:text-[#8E8E93]">
                {tariffVersions.length} recorded versions
              </span>
            </div>

            <div className="overflow-x-auto rounded-[16px] border border-black/[0.06] dark:border-white/[0.08]">
              <table className="w-full text-left text-xs">
                <thead className="bg-black/[0.02] dark:bg-white/[0.02] text-[#86868B] dark:text-[#8E8E93] font-semibold border-b border-black/[0.06] dark:border-white/[0.08]">
                  <tr>
                    <th className="p-3">Effective Date</th>
                    <th className="p-3">Standard Fee</th>
                    <th className="p-3">Follow-up</th>
                    <th className="p-3">Split Ratio</th>
                    <th className="p-3">Reason / Justification</th>
                    <th className="p-3">Authorized By</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
                  {tariffVersions.map((v, i) => (
                    <tr key={v.id || i} className="hover:bg-black/[0.01] dark:hover:bg-white/[0.02]">
                      <td className="p-3 font-mono font-bold text-[#1D1D1F] dark:text-white">
                        {new Date(v.effective_from).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                        ₹{v.consultation_fee}
                      </td>
                      <td className="p-3 text-[#1D1D1F] dark:text-[#F5F5F7]">
                        ₹{v.followup_fee} ({v.followup_validity_days}d)
                      </td>
                      <td className="p-3 font-mono font-bold text-[#0071E3] dark:text-[#2997FF]">
                        {v.doctor_split_percentage}/{100 - Number(v.doctor_split_percentage)}
                      </td>
                      <td className="p-3 text-[#86868B] dark:text-[#8E8E93] max-w-xs truncate" title={v.change_reason}>
                        {v.change_reason}
                      </td>
                      <td className="p-3 font-mono text-[10px] text-[#86868B] dark:text-[#8E8E93]">
                        {v.authorized_by}
                      </td>
                      <td className="p-3">
                        {v.is_active ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20">
                            ACTIVE
                          </span>
                        ) : new Date(v.effective_from) > new Date() ? (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400 border border-blue-500/20">
                            SCHEDULED
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-black/[0.04] text-[#86868B] dark:bg-white/[0.06] dark:text-[#8E8E93]">
                            ARCHIVED
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="flex items-center gap-2 p-3 rounded-[14px] bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200/50 dark:border-blue-900/40 text-xs text-blue-800 dark:text-blue-300">
              <Info className="h-4 w-4 shrink-0 text-[#0071E3]" />
              <span>Financial Immutability Rule: Updates never overwrite prior receipts or payouts. Past billing ledgers remain 100% auditable.</span>
            </div>
          </div>
        </div>
      )}

      {/* 6. TAB 2: SHIFTS & GUARDRAILS (FIX 2) */}
      {activeTab === "shifts" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-[22px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-apple-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  OPD Consultation Shifts &amp; Chamber Guardrails
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                  Enforces 30m cutoff before shift end and blocks assigning two doctors to the same physical room.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowShiftModal(true);
                  setShiftConflictError("");
                }}
                className="rounded-[12px] bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-apple-sm transition"
              >
                + Schedule Chamber Shift
              </button>
            </div>

            {/* Chamber Shift Cards Grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {shiftGuardrails.map((shift, idx) => (
                <div 
                  key={shift.id || idx} 
                  className="p-4 rounded-[18px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-3 relative shadow-apple-sm"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                      <DoorOpen className="h-4 w-4 text-amber-600" />
                      {shift.chamber_name}
                    </span>
                    <span className="text-[10px] font-mono px-2.5 py-0.5 rounded-full bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 font-bold border border-amber-500/20">
                      {shift.shift_name}
                    </span>
                  </div>

                  <div className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                    {shift.doctor_name}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-[#86868B] dark:text-[#8E8E93] font-mono">
                    <span>Timing: {shift.start_time} - {shift.end_time}</span>
                    <span>Cap: {shift.token_capacity} tokens</span>
                  </div>

                  <div className="p-2.5 rounded-[12px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] text-[10px] text-[#86868B] dark:text-[#8E8E93] space-y-1">
                    <div className="flex items-center justify-between">
                      <span>• Token Cutoff Window:</span>
                      <strong className="text-amber-600 dark:text-amber-400 font-mono">{shift.token_cutoff_minutes} mins prior</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Overhang Grace Period:</span>
                      <strong className="text-[#1D1D1F] dark:text-white font-mono">{shift.grace_period_mins} mins</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Unseen Auto-Cancel:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">
                        {shift.auto_cancel_unseen ? "ENABLED (SMS Reschedule)" : "DISABLED"}
                      </strong>
                    </div>
                  </div>

                  <div className="flex justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => handleDeleteShift(shift.id)}
                      className="text-[10px] text-rose-500 hover:text-rose-700 font-bold hover:underline"
                    >
                      Delete Shift Guardrail
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-3.5 rounded-[16px] bg-amber-50/70 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-900/40 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-amber-900 dark:text-amber-200 text-[11px] leading-relaxed">
                <strong>Anti-Overhang Operational Guardrail:</strong> Token issuance closes strictly 30 minutes before shift conclusion. Receptionists and QR stands will display <em>"Shift Token Limit Reached"</em> to ensure doctors finish consultations on schedule without abandoning queued patients.
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 7. TAB 3: DOCTOR ROSTER & SAFE OFFBOARDING (FIX 3) */}
      {activeTab === "roster" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="rounded-[22px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-apple-card space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-[#0071E3]" />
                  Active Clinical Roster &amp; Safe Offboarding Management
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                  DPDP &amp; NMC compliant lifecycle: Deactivation freezes new appointments while strictly preserving all historical EMR, prescriptions &amp; billing.
                </p>
              </div>

              <span className="text-[11px] font-mono font-bold text-[#0071E3] dark:text-[#2997FF] bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-500/20">
                {activeDoctorsCount} Active Consultants
              </span>
            </div>

            <div className="space-y-3">
              {doctorsList.map((doc, idx) => {
                const isActive = doc.is_active !== false;
                return (
                  <div
                    key={doc.id || idx}
                    className={`p-4 rounded-[18px] border transition ${
                      isActive 
                        ? "bg-white dark:bg-[#1C1C1E] border-black/[0.06] dark:border-white/[0.08] shadow-apple-sm" 
                        : "bg-black/[0.02] dark:bg-white/[0.02] border-dashed border-black/[0.12] dark:border-white/[0.12] opacity-80"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white">{doc.full_name}</h4>
                          {isActive ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 border border-emerald-500/20">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Active Practice
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400 border border-amber-500/20">
                              <Lock className="h-2.5 w-2.5" /> Safe Archived (EMR Preserved)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                          {doc.specialization} • Assigned: {doc.chamber_name || "Chamber 1 - OPD Main"} • Consultation Fee: ₹{doc.consultation_fee || fee}
                        </div>
                        {!isActive && (
                          <div className="text-[10px] text-amber-700 dark:text-amber-400 mt-1 font-mono">
                            Reason: {doc.deactivation_reason || "Safe Archive"} | Settlement: ₹{doc.final_payout_amount || 6720} Settled
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {isActive ? (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDoctorForOffboard(doc);
                              setOffboardError("");
                              setOffboardPin("");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
                          >
                            <UserMinus className="h-3.5 w-3.5" />
                            <span>Safe Deactivate</span>
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedDoctorForReactivate(doc);
                              setReactivatePin("");
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-[12px] border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                            <span>1-Click Reactivate</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 8. TAB 4: PRACTICE PROFILE & IDENTITY */}
      {activeTab === "identity" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <form onSubmit={handleSaveProfile} className="rounded-[22px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-apple-card space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
              <div>
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0071E3]" />
                  Practice Profile &amp; Contact Identity
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                  Appears on official prescriptions, receipt headers, and patient portal SMS links.
                </p>
              </div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-black/[0.04] text-[#1D1D1F] dark:bg-white/[0.06] dark:text-[#8E8E93]">
                Tenant Slug: {clinicSlug}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="sm:col-span-2">
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Registered Clinic / Hospital Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={e => setClinicName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 font-bold shadow-sm focus:border-[#0071E3] focus:outline-none dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Speciality Subtitle / Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. Advanced Dermatology & Laser Surgery"
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 shadow-sm focus:border-[#0071E3] focus:outline-none dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Clinical Est. Act / NABH Reg #</label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={e => setRegNumber(e.target.value)}
                  placeholder="e.g. UK-CEA-REG-2024"
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 font-mono shadow-sm focus:border-[#0071E3] focus:outline-none dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Helpline / Official WhatsApp Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 font-mono shadow-sm focus:border-[#0071E3] focus:outline-none dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Soundbox / Counter UPI ID (VPA)</label>
                <input
                  type="text"
                  value={upiVpa}
                  onChange={e => setUpiVpa(e.target.value)}
                  placeholder="clinicname@bank"
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 font-mono shadow-sm focus:border-[#0071E3] focus:outline-none dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-[#1D1D1F] dark:text-white">Street Address &amp; Landmark</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  required
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 shadow-sm focus:border-[#0071E3] focus:outline-none dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-[#1D1D1F] dark:text-white">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">PIN Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 font-mono shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] px-5 py-2.5 text-xs font-bold text-white shadow-apple-sm disabled:opacity-50 transition"
              >
                {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? "Saving Changes..." : "Save Identity Changes"}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 9. TAB 5: FRONT DESK STANDEE STUDIO & COUNTER QR */}
      {activeTab === "standee" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="grid gap-6 lg:grid-cols-12">
            {/* Standee Preview Card */}
            <div className="lg:col-span-6 rounded-[22px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 text-center shadow-apple-card space-y-4">
              <div className="flex items-center justify-between">
                <span className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-500/20">
                  LIVE TOKEN QUEUE QR
                </span>
                <span className="text-[10px] font-mono text-[#86868B] dark:text-[#8E8E93]">DIN-A5 / DIN-A4</span>
              </div>

              <div>
                <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                  Official Front Desk Acrylic Standee
                </h3>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                  Patients scan with phone camera to track live token position and receive automated WhatsApp alerts 2 tokens away.
                </p>
              </div>

              {/* REAL VECTOR QR CODE VIA QRCodeDisplay */}
              <div className="mx-auto my-3 flex items-center justify-center p-4 rounded-[20px] bg-white border border-black/[0.08] shadow-apple-sm max-w-xs">
                <QRCodeDisplay
                  value={`https://medic-sept-2026.vercel.app/waiting-room?clinic=${clinicSlug}&view=patient`}
                  size={180}
                  level="H"
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                  centerBadgeText="ClinicOS"
                />
              </div>

              <div className="rounded-[12px] bg-black/[0.03] dark:bg-white/[0.04] p-2.5 text-[11px] font-mono text-[#1D1D1F] dark:text-[#F5F5F7] truncate">
                https://medic-sept-2026.vercel.app/waiting-room?clinic={clinicSlug}&amp;view=patient
              </div>

              <div className="flex gap-2 pt-2">
                <Link
                  href="/dashboard/standee"
                  className="flex-1 rounded-[12px] bg-[#0071E3] hover:bg-[#0077ED] py-2.5 text-xs font-bold text-white shadow-apple-sm transition flex items-center justify-center gap-1.5"
                >
                  <Sparkles className="h-4 w-4" />
                  <span>Launch Acrylic Standee Studio</span>
                </Link>

                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-[12px] border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] dark:text-white shadow-apple-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition flex items-center gap-1.5"
                >
                  <Printer className="h-4 w-4" />
                  <span>Direct Print (A5)</span>
                </button>
              </div>
            </div>

            {/* Print Specs & Standee Features */}
            <div className="lg:col-span-6 space-y-4">
              <div className="rounded-[22px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-apple-card space-y-3">
                <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Printer className="h-4 w-4 text-[#0071E3]" />
                  Standee Physical Specifications
                </h4>

                <div className="space-y-2 text-xs text-[#86868B] dark:text-[#8E8E93]">
                  <div className="flex justify-between p-2 rounded-[10px] bg-black/[0.02] dark:bg-white/[0.04]">
                    <span>Format</span>
                    <strong className="text-[#1D1D1F] dark:text-white">DIN-A5 (148 × 210 mm) Tabletop Tent</strong>
                  </div>
                  <div className="flex justify-between p-2 rounded-[10px] bg-black/[0.02] dark:bg-white/[0.04]">
                    <span>Paper Stock</span>
                    <strong className="text-[#1D1D1F] dark:text-white">300 GSM Matte Art Card</strong>
                  </div>
                  <div className="flex justify-between p-2 rounded-[10px] bg-black/[0.02] dark:bg-white/[0.04]">
                    <span>Language Support</span>
                    <strong className="text-[#1D1D1F] dark:text-white">Bilingual (English &amp; Hindi)</strong>
                  </div>
                  <div className="flex justify-between p-2 rounded-[10px] bg-black/[0.02] dark:bg-white/[0.04]">
                    <span>Proactive Alerts</span>
                    <strong className="text-emerald-600 dark:text-emerald-400">WhatsApp 2-Tokens Away Notification</strong>
                  </div>
                </div>
              </div>

              <div className="rounded-[22px] bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] p-6 shadow-apple-card space-y-3">
                <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Smartphone className="h-4 w-4 text-emerald-600" />
                  Zero-App Patient Queue Tracker
                </h4>
                <p className="text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  Patients scan the standee with any smartphone camera app. The queue updates live without requiring an app download or account creation. When their turn is 2 tokens away, an automated WhatsApp alert is dispatched directly to their phone.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: PUBLISH VERSIONED TARIFF (FIX 1) */}
      {showTariffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] shadow-apple-modal p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                  Publish Effective-Dated Tariff Version
                </h3>
              </div>
              <button 
                onClick={() => setShowTariffModal(false)}
                className="p-1 rounded-xl text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePublishTariff} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">Effective Date</label>
                <input
                  type="date"
                  value={tariffEffectiveDate}
                  onChange={e => setTariffEffectiveDate(e.target.value)}
                  required
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 font-mono shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                />
                <span className="text-[10px] text-[#86868B] dark:text-[#8E8E93]">
                  Select today for immediate enforcement, or a future date for scheduled revisions.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Consultation (₹)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={e => setFee(Number(e.target.value))}
                    required
                    className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 font-mono font-bold text-emerald-600 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-emerald-400"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Follow-up (₹)</label>
                  <input
                    type="number"
                    value={followupFee}
                    onChange={e => setFollowupFee(Number(e.target.value))}
                    required
                    className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 font-mono shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Free Days</label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={e => setValidityDays(Number(e.target.value))}
                    required
                    className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 font-mono shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Doctor Split Ratio</label>
                  <span className="font-mono font-bold text-[#0071E3] dark:text-[#2997FF]">{doctorSplit}% Doctor / {100 - doctorSplit}% Clinic</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={doctorSplit}
                  onChange={e => setDoctorSplit(Number(e.target.value))}
                  className="w-full h-2 bg-black/[0.08] dark:bg-white/[0.12] rounded-lg appearance-none cursor-pointer accent-[#0071E3]"
                />
              </div>

              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">Audit Change Justification Reason *</label>
                <input
                  type="text"
                  value={tariffReason}
                  onChange={e => setTariffReason(e.target.value)}
                  placeholder="e.g. Q4 2026 Revision - Revised Specialist Dermatologist Split"
                  required
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                />
              </div>

              <div className="p-3 rounded-[14px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40">
                <label className="font-bold text-amber-900 dark:text-amber-200 flex items-center gap-1.5 mb-1">
                  <Lock className="h-3.5 w-3.5" />
                  Manager Authorization PIN Required (Default: 4491)
                </label>
                <input
                  type="password"
                  value={tariffPin}
                  onChange={e => setTariffPin(e.target.value)}
                  placeholder="Enter 4-digit PIN (4491)"
                  maxLength={4}
                  required
                  className="w-full rounded-[10px] border border-amber-300 dark:border-amber-700 bg-white dark:bg-[#1C1C1E] p-2 font-mono text-center text-sm font-bold tracking-widest shadow-sm dark:text-white"
                />
              </div>

              {tariffError && (
                <div className="p-2.5 rounded-[12px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-medium">
                  {tariffError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTariffModal(false)}
                  className="rounded-[12px] border border-black/[0.08] dark:border-white/[0.12] px-4 py-2 font-semibold text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[12px] bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-apple-sm"
                >
                  Authorize &amp; Save Version
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: SCHEDULE CHAMBER SHIFT & OVERLAP DETECTION (FIX 2) */}
      {showShiftModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] shadow-apple-modal p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                  Schedule Chamber Shift Guardrail
                </h3>
              </div>
              <button 
                onClick={() => setShowShiftModal(false)}
                className="p-1 rounded-xl text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShiftGuardrail} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-[#1D1D1F] dark:text-white">Physical Chamber</label>
                  <select
                    value={shiftChamber}
                    onChange={e => setShiftChamber(e.target.value)}
                    className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                  >
                    <option value="Chamber 1 - OPD Main">Chamber 1 - OPD Main</option>
                    <option value="Chamber 2 - Laser & Aesthetics">Chamber 2 - Laser &amp; Aesthetics</option>
                    <option value="Chamber 3 - Dermatosurgery OT">Chamber 3 - Dermatosurgery OT</option>
                    <option value="Chamber 4 - Trichology & Derm">Chamber 4 - Trichology &amp; Derm</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-[#1D1D1F] dark:text-white">Assign Doctor</label>
                  <select
                    value={shiftDoctorSlug}
                    onChange={e => setShiftDoctorSlug(e.target.value)}
                    className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                  >
                    {doctorsList.filter(d => d.is_active !== false).map(doc => (
                      <option key={doc.slug} value={doc.slug}>
                        {doc.full_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Shift Name</label>
                  <select
                    value={shiftName}
                    onChange={e => setShiftName(e.target.value)}
                    className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                  >
                    <option value="Morning OPD">Morning OPD</option>
                    <option value="Evening OPD">Evening OPD</option>
                    <option value="Specialist Clinic">Specialist Clinic</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Start Time</label>
                  <input
                    type="text"
                    value={shiftStartTime}
                    onChange={e => setShiftStartTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 font-mono shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">End Time</label>
                  <input
                    type="text"
                    value={shiftEndTime}
                    onChange={e => setShiftEndTime(e.target.value)}
                    placeholder="02:00 PM"
                    className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 font-mono shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Token Cutoff (Mins Prior)</label>
                  <input
                    type="number"
                    value={shiftCutoffMins}
                    onChange={e => setShiftCutoffMins(Number(e.target.value))}
                    className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 font-mono shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                  />
                  <span className="text-[10px] text-[#86868B] dark:text-[#8E8E93]">Closes token issuance before shift ends</span>
                </div>

                <div>
                  <label className="font-semibold text-[#1D1D1F] dark:text-white">Max Token Capacity</label>
                  <input
                    type="number"
                    value={shiftCapacity}
                    onChange={e => setShiftCapacity(Number(e.target.value))}
                    className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 font-mono shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-[12px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08]">
                <input
                  type="checkbox"
                  id="autoCancelToggle"
                  checked={shiftAutoCancel}
                  onChange={e => setShiftAutoCancel(e.target.checked)}
                  className="rounded border-black/[0.2] text-[#0071E3] focus:ring-[#0071E3]"
                />
                <label htmlFor="autoCancelToggle" className="text-[11px] font-medium text-[#1D1D1F] dark:text-[#F5F5F7]">
                  Auto-cancel unseen tokens at shift end + dispatch automated WhatsApp reschedule voucher
                </label>
              </div>

              {shiftConflictError && (
                <div className="p-3 rounded-[12px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-700 dark:text-rose-300 font-bold flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-tight">{shiftConflictError}</div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="rounded-[12px] border border-black/[0.08] dark:border-white/[0.12] px-4 py-2 font-semibold text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[12px] bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700 shadow-apple-sm"
                >
                  Validate Chamber &amp; Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SAFE DOCTOR OFFBOARDING PROTOCOL (FIX 3) */}
      {selectedDoctorForOffboard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] shadow-apple-modal p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <UserMinus className="h-5 w-5 text-rose-600" />
                <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                  Safe Doctor Deactivation Protocol
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDoctorForOffboard(null)}
                className="p-1 rounded-xl text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-[16px] bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-900/40 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong>DPDP Act &amp; NMC Compliance Notice:</strong> Deactivating <strong>{selectedDoctorForOffboard.full_name}</strong> freezes new appointment bookings immediately. All historical medical records, past prescriptions, and bills remain 100% permanently linked and intact without data loss.
            </div>

            {/* Automated Final Settlement Calculation */}
            <div className="p-4 rounded-[16px] bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.08] space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-[#1D1D1F] dark:text-white">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Automated Final Payout Settlement
                </span>
                <span className="font-mono text-[10px] text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded-full border border-blue-500/20">
                  SETTLE-DR-2026-9921
                </span>
              </div>

              <div className="space-y-1 text-[#86868B] dark:text-[#8E8E93] text-[11px] pt-1 border-t border-black/[0.06] dark:border-white/[0.08]">
                <div className="flex justify-between">
                  <span>Unsettled OPD Completed Visits:</span>
                  <span className="font-mono font-bold text-[#1D1D1F] dark:text-white">14 Visits</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Consultation Revenue:</span>
                  <span className="font-mono text-[#1D1D1F] dark:text-white">₹8,400.00</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 text-xs pt-1 border-t border-dashed border-black/[0.08] dark:border-white/[0.12]">
                  <span>Calculated Final Payout (80% Doctor Share):</span>
                  <span className="font-mono text-sm">₹6,720.00</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleOffboardDoctor} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-[#1D1D1F] dark:text-white">Deactivation Reason *</label>
                <select
                  value={offboardReason}
                  onChange={e => setOffboardReason(e.target.value)}
                  className="mt-1 w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] p-2.5 shadow-sm dark:border-white/[0.12] dark:bg-white/[0.04] dark:text-white"
                >
                  <option value="Contract Term Completion">Contract Term Completion</option>
                  <option value="Relocation / Resignation">Relocation / Resignation</option>
                  <option value="Medical Leave / Sabbatical">Medical Leave / Sabbatical</option>
                  <option value="Rotational Schedule Change">Rotational Schedule Change</option>
                </select>
              </div>

              <div className="p-3 rounded-[14px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40">
                <label className="font-bold text-rose-900 dark:text-rose-200 flex items-center gap-1.5 mb-1">
                  <Lock className="h-3.5 w-3.5" />
                  Manager Authorization PIN Required (Default: 4491)
                </label>
                <input
                  type="password"
                  value={offboardPin}
                  onChange={e => setOffboardPin(e.target.value)}
                  placeholder="Enter 4-digit PIN (4491)"
                  maxLength={4}
                  required
                  className="w-full rounded-[10px] border border-rose-300 dark:border-rose-800 bg-white dark:bg-[#1C1C1E] p-2 font-mono text-center text-sm font-bold tracking-widest shadow-sm dark:text-white"
                />
              </div>

              {offboardError && (
                <div className="p-2.5 rounded-[12px] bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/40 text-rose-600 dark:text-rose-400 font-medium">
                  {offboardError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctorForOffboard(null)}
                  className="rounded-[12px] border border-black/[0.08] dark:border-white/[0.12] px-4 py-2 font-semibold text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={offboardingLoading}
                  className="rounded-[12px] bg-rose-600 px-5 py-2 font-bold text-white hover:bg-rose-700 shadow-apple-sm disabled:opacity-50"
                >
                  {offboardingLoading ? "Settling..." : "Approve Settlement & Safe Archive"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: 1-CLICK DOCTOR REACTIVATION */}
      {selectedDoctorForReactivate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-md p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-[24px] bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] shadow-apple-modal p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                  Reactivate Doctor Practice
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDoctorForReactivate(null)}
                className="p-1 rounded-xl text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-[#86868B] dark:text-[#8E8E93]">
              Restore <strong>{selectedDoctorForReactivate.full_name}</strong> to live appointment booking and reception queue. All past clinical notes and credentials remain intact.
            </p>

            <form onSubmit={handleReactivateDoctor} className="space-y-4 text-xs">
              <div className="p-3 rounded-[14px] bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-900/40">
                <label className="font-bold text-emerald-900 dark:text-emerald-200 flex items-center gap-1.5 mb-1">
                  <Lock className="h-3.5 w-3.5" />
                  Manager Authorization PIN Required (Default: 4491)
                </label>
                <input
                  type="password"
                  value={reactivatePin}
                  onChange={e => setReactivatePin(e.target.value)}
                  placeholder="Enter 4-digit PIN (4491)"
                  maxLength={4}
                  required
                  className="w-full rounded-[10px] border border-emerald-300 dark:border-emerald-800 bg-white dark:bg-[#1C1C1E] p-2 font-mono text-center text-sm font-bold tracking-widest shadow-sm dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctorForReactivate(null)}
                  className="rounded-[12px] border border-black/[0.08] dark:border-white/[0.12] px-4 py-2 font-semibold text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-[12px] bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-apple-sm"
                >
                  Authorize Reactivation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
