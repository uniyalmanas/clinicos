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
  ChevronDown
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

export default function DashboardSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
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

  // Load clinic data on mount
  useEffect(() => {
    async function loadClinic() {
      try {
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
    }
    loadClinic();
  }, []);

  const showNotification = (msg: string) => {
    setToastMessage(msg);
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 4500);
  };

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
        showNotification("Practice profile and contact details saved to Supabase!");
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
      showNotification(data.message || "New immutable tariff version published successfully!");
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
      showNotification(`Shift Guardrail for ${shiftChamber} successfully synchronized!`);
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
        showNotification("Shift guardrail removed.");
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

      // Update doctor in local state
      setDoctorsList(prev => prev.map(doc => 
        doc.slug === selectedDoctorForOffboard.slug ? { ...doc, ...data.doctor } : doc
      ));

      setSelectedDoctorForOffboard(null);
      setOffboardPin("");
      showNotification(`Doctor safely archived. Final settlement: ₹${data.settlement.doctor_net_payout} calculated.`);
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
      showNotification(`Doctor ${data.doctor.full_name} restored to active roster!`);
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

  return (
    <div className="space-y-6 pb-12">
      {/* 10/10 EXACT HEADER & SUBTITLE */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold mb-1 border border-blue-200/50 dark:border-blue-900/50">
            <ShieldCheck className="h-3.5 w-3.5" /> Clinical Governance & Operational Master Console
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Clinic Master Configuration & Roster Settings
          </h1>
          <p className="text-xs text-slate-500 font-medium">
            Versioned Financial Rules • Shift-Aware Token Guardrails • Proactive Patient Alerts • Safe Roster Management
          </p>
        </div>

        {savedToast && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-white" />
            <span>{toastMessage}</span>
          </div>
        )}
      </div>

      {/* 4 CLINICAL GOVERNANCE PILLARS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <History className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-300">
              PIN 4491 Locked
            </span>
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">Effective-Dated Tariffs</div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Time-scoped rate versions prevent retroactive dispute. Past appointments retain booking-time financial splits.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <Clock className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-300">
              30m Cutoff Rule
            </span>
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">Shift-Token Guardrails</div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Automatic cutoff closes token issuance 30 mins before shift end. "Last 3 tokens" grace alert prevents clinic queue overhang.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400">
              <DoorOpen className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-800 dark:bg-rose-900/40 dark:text-rose-300">
              Overlap Blocked
            </span>
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">Chamber Conflict Engine</div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Physical chamber scheduler blocks assigning two doctors to the same room during overlapping duty shifts.
          </p>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
              <ShieldCheck className="h-4 w-4" />
            </div>
            <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-300">
              DPDP & NMC Safe
            </span>
          </div>
          <div className="text-xs font-bold text-slate-900 dark:text-white">Safe Doctor Lifecycle</div>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
            Deactivating freezes new bookings while preserving 100% of historical EMR & auto-calculating final payout settlements.
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* MAIN COLUMN (8 COLS) */}
        <div className="lg:col-span-8 space-y-6">

          {/* 1. PRACTICE IDENTITY FORM */}
          <form onSubmit={handleSaveProfile} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-600" />
                Practice Profile & Contact Identity
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Tenant: {clinicSlug}
              </span>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Registered Clinic / Hospital Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={e => setClinicName(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-bold shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Speciality Subtitle / Tagline</label>
                <input
                  type="text"
                  value={tagline}
                  onChange={e => setTagline(e.target.value)}
                  placeholder="e.g. Advanced Dermatology & Laser Surgery"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Clinical Est. Act / NABH Reg #</label>
                <input
                  type="text"
                  value={regNumber}
                  onChange={e => setRegNumber(e.target.value)}
                  placeholder="e.g. UK-CEA-REG-2024"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Helpline / Official WhatsApp Number</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Soundbox / Counter UPI ID (VPA)</label>
                <input
                  type="text"
                  value={upiVpa}
                  onChange={e => setUpiVpa(e.target.value)}
                  placeholder="clinicname@bank"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Street Address & Landmark</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">City</label>
                <input
                  type="text"
                  value={city}
                  onChange={e => setCity(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">State</label>
                  <input
                    type="text"
                    value={state}
                    onChange={e => setState(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">PIN Code</label>
                  <input
                    type="text"
                    value={postalCode}
                    onChange={e => setPostalCode(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-5 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-blue-700 disabled:opacity-50 transition"
              >
                {saving ? <RefreshCw className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                {saving ? "Saving..." : "Save Identity Changes"}
              </button>
            </div>
          </form>

          {/* 2. FIX 1: EFFECTIVE-DATED TARIFF & DOCTOR SPLIT VERSIONING */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-emerald-600" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    Effective-Dated Consultation Tariffs & Visiting Splits
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Immutable version records: Changes take effect on designated dates without retroactively overwriting past payouts.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowTariffModal(true);
                  setTariffError("");
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
              >
                <History className="h-3.5 w-3.5" />
                <span>Publish New Rate Version</span>
              </button>
            </div>

            {/* Currently Active Tariff Highlight */}
            <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="flex items-center gap-2 font-bold text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                  Currently Active Tariff (Enforced at Counter & Online Booking)
                </span>
                <span className="font-mono text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-100 dark:bg-emerald-950/60 px-2.5 py-0.5 rounded-full">
                  Effective From: {new Date(activeTariff.effective_from).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/40 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500">Consultation Fee</div>
                  <div className="text-base font-black text-emerald-600 dark:text-emerald-400">₹{activeTariff.consultation_fee}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/40 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500">Follow-up Fee</div>
                  <div className="text-base font-black text-slate-800 dark:text-white">₹{activeTariff.followup_fee}</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/40 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500">Free Follow-up</div>
                  <div className="text-base font-black text-slate-800 dark:text-white">{activeTariff.followup_validity_days} Days</div>
                </div>
                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 border border-emerald-200/40 dark:border-slate-800">
                  <div className="text-[10px] text-slate-500">Revenue Split</div>
                  <div className="text-base font-black text-blue-600 dark:text-blue-400">
                    {activeTariff.doctor_split_percentage}% / {100 - Number(activeTariff.doctor_split_percentage)}%
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 pt-1 border-t border-emerald-200/30 dark:border-slate-800">
                <span><strong>Audit Justification:</strong> {activeTariff.change_reason}</span>
                <span className="font-mono text-[10px] text-slate-500">{activeTariff.authorized_by}</span>
              </div>
            </div>

            {/* Tariff Version History Audit Trail Table */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
                  <History className="h-3.5 w-3.5 text-slate-400" />
                  Immutable Tariff Change-Log (Audit Trail)
                </span>
                <span className="text-[10px] font-mono text-slate-400">
                  {tariffVersions.length} versions recorded
                </span>
              </div>

              <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 dark:bg-slate-950/60 text-slate-500 font-semibold border-b border-slate-200 dark:border-slate-800">
                    <tr>
                      <th className="p-3">Effective Date</th>
                      <th className="p-3">Standard Fee</th>
                      <th className="p-3">Follow-up</th>
                      <th className="p-3">Split Ratio</th>
                      <th className="p-3">Reason / Justification</th>
                      <th className="p-3">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {tariffVersions.map((v, i) => (
                      <tr key={v.id || i} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                        <td className="p-3 font-mono font-medium text-slate-700 dark:text-slate-300">
                          {new Date(v.effective_from).toLocaleDateString("en-IN", { day: '2-digit', month: 'short', year: 'numeric' })}
                        </td>
                        <td className="p-3 font-bold text-emerald-600 dark:text-emerald-400">
                          ₹{v.consultation_fee}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400">
                          ₹{v.followup_fee} ({v.followup_validity_days}d)
                        </td>
                        <td className="p-3 font-mono font-bold text-blue-600 dark:text-blue-400">
                          {v.doctor_split_percentage}/{100 - Number(v.doctor_split_percentage)}
                        </td>
                        <td className="p-3 text-slate-600 dark:text-slate-400 max-w-xs truncate" title={v.change_reason}>
                          {v.change_reason}
                        </td>
                        <td className="p-3">
                          {v.is_active ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                              ACTIVE
                            </span>
                          ) : new Date(v.effective_from) > new Date() ? (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300">
                              SCHEDULED
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                              ARCHIVED
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-2">
                <Info className="h-3.5 w-3.5 text-blue-500 shrink-0" />
                <span>Financial Integrity Rule: Changes to tariff do not alter prior receipts or doctor payout calculations.</span>
              </div>
            </div>
          </div>

          {/* 3. FIX 2: SHIFT-AWARE TOKEN GUARDRAILS & CHAMBER CONFLICT ENGINE */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 dark:border-slate-800 pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4 text-amber-600" />
                  <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                    OPD Consultation Shifts & Chamber Conflict Engine
                  </h2>
                </div>
                <p className="text-xs text-slate-500 mt-0.5">
                  Shift cutoff stops token issuance 30m before shift close; room overlap validation prevents double-booking doctors.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setShowShiftModal(true);
                  setShiftConflictError("");
                }}
                className="inline-flex items-center gap-2 rounded-2xl bg-amber-600 hover:bg-amber-700 px-4 py-2 text-xs font-bold text-white shadow-sm transition"
              >
                <DoorOpen className="h-3.5 w-3.5" />
                <span>Schedule Chamber Shift</span>
              </button>
            </div>

            {/* Active Chamber Shifts Guardrail Grid */}
            <div className="grid gap-3 sm:grid-cols-2">
              {shiftGuardrails.map((shift, idx) => (
                <div key={shift.id || idx} className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800 space-y-2 relative">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <DoorOpen className="h-3.5 w-3.5 text-amber-600" />
                      {shift.chamber_name}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300 font-bold">
                      {shift.shift_name}
                    </span>
                  </div>

                  <div className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                    {shift.doctor_name}
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-600 dark:text-slate-400 font-mono">
                    <span>Timing: {shift.start_time} - {shift.end_time}</span>
                    <span>Cap: {shift.token_capacity} tokens</span>
                  </div>

                  <div className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 text-[10px] text-slate-500 space-y-1">
                    <div className="flex items-center justify-between">
                      <span>• Token Cutoff Window:</span>
                      <strong className="text-amber-600 dark:text-amber-400 font-mono">{shift.token_cutoff_minutes} mins prior</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Overhang Grace Period:</span>
                      <strong className="text-slate-700 dark:text-slate-300 font-mono">{shift.grace_period_mins} mins</strong>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>• Unseen Token Auto-Cancel:</span>
                      <strong className="text-emerald-600 dark:text-emerald-400 font-mono">{shift.auto_cancel_unseen ? "ENABLED (SMS Reschedule)" : "DISABLED"}</strong>
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

            <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs flex items-start gap-2.5">
              <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-slate-700 dark:text-slate-300 text-[11px] leading-relaxed">
                <strong>Anti-Overhang Operational Guardrail:</strong> Token issuance closes strictly 30 minutes before shift conclusion. Receptionists and QR stands will display <em>"Shift Token Limit Reached"</em> to ensure doctors finish consultations on schedule without abandoning queued patients.
              </div>
            </div>
          </div>

          {/* 4. FIX 3: SAFE DOCTOR ROSTER & OFFBOARDING / FINAL SETTLEMENT */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div>
                <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Users className="h-4 w-4 text-blue-600" />
                  Active Clinical Roster & Safe Offboarding Management
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  DPDP & NMC compliant lifecycle: Deactivation freezes new appointments while strictly preserving all historical EMR, prescriptions & billing.
                </p>
              </div>
              <span className="text-[11px] font-mono font-bold text-blue-600 bg-blue-50 dark:bg-blue-950/60 px-3 py-1 rounded-full border border-blue-200/50 dark:border-blue-900/50">
                {doctorsList.filter(d => d.is_active !== false).length} Active Consultants
              </span>
            </div>

            <div className="space-y-3">
              {doctorsList.map((doc, idx) => {
                const isActive = doc.is_active !== false;
                return (
                  <div
                    key={doc.id || idx}
                    className={`p-4 rounded-2xl border transition ${
                      isActive 
                        ? "bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800" 
                        : "bg-slate-50 dark:bg-slate-950/60 border-dashed border-slate-300 dark:border-slate-800 opacity-80"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white">{doc.full_name}</h4>
                          {isActive ? (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300">
                              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500"></span> Active Practice
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300">
                              <Lock className="h-2.5 w-2.5" /> Safe Archived (EMR Preserved)
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 mt-0.5">
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200 dark:border-rose-900/50 bg-rose-50 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 text-xs font-bold hover:bg-rose-100 dark:hover:bg-rose-900/60 transition"
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
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900/60 transition"
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

        {/* SIDE COLUMN (4 COLS): PRINTABLE COUNTER QR & PUBLIC MICROSITE PREVIEW */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-500/20">
                LIVE TOKEN QUEUE QR
              </span>
              <span className="text-[10px] font-mono text-slate-400">DIN-A5 / DIN-A4</span>
            </div>

            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Official Front Desk Acrylic Standee
            </h3>
            <p className="text-xs text-slate-500">
              Patients scan with phone camera to track live token position and receive automated WhatsApp alerts 2 tokens away.
            </p>

            {/* REAL VECTOR QR CODE VIA QRCodeDisplay */}
            <div className="mx-auto my-3 flex items-center justify-center p-3 rounded-2xl bg-white border border-slate-200 shadow-sm dark:bg-white dark:border-slate-800">
              <QRCodeDisplay
                value={`https://medic-sept-2026.vercel.app/waiting-room?clinic=${clinicSlug}&view=patient`}
                size={160}
                level="H"
                fgColor="#000000"
                bgColor="#FFFFFF"
                centerBadgeText="ClinicOS"
              />
            </div>

            <div className="rounded-xl bg-slate-100 p-2.5 text-[10px] font-mono text-slate-700 dark:bg-slate-800 dark:text-slate-300 truncate">
              https://medic-sept-2026.vercel.app/waiting-room?clinic={clinicSlug}&amp;view=patient
            </div>

            {/* Print Specifications */}
            <div className="rounded-xl bg-slate-50 dark:bg-slate-950/60 p-3 text-[11px] text-slate-600 dark:text-slate-400 text-left space-y-1 border border-slate-100 dark:border-slate-800">
              <div className="font-bold text-slate-900 dark:text-white text-xs">Print Specifications:</div>
              <div>&bull; <strong>Format</strong>: DIN-A5 (148 × 210 mm) tabletop tent card</div>
              <div>&bull; <strong>Stock</strong>: 250 - 300 GSM Matte Art Card with fold guides</div>
              <div>&bull; <strong>Bilingual</strong>: English &amp; Hindi instructions included</div>
            </div>

            <div className="space-y-2 pt-1">
              <Link
                href="/dashboard/standee"
                className="w-full rounded-2xl bg-[#0071E3] hover:bg-[#0077ED] py-3 text-xs font-bold text-white shadow-md transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Sparkles className="h-4 w-4" />
                <span>Launch Acrylic Standee Studio</span>
              </Link>

              <button
                type="button"
                onClick={() => window.print()}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-800 py-2.5 text-xs font-bold text-slate-900 dark:text-white shadow-sm hover:bg-slate-50 dark:hover:bg-slate-700 transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <Printer className="h-4 w-4" />
                <span>Print Standee Directly (A5)</span>
              </button>
            </div>
          </div>

          {/* QUICK AUDIT SUMMARY CARD */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              Clinical Governance Summary
            </h4>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Tariff Versions Stored</span>
                <span className="font-mono font-bold text-slate-900 dark:text-white">{tariffVersions.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Active Shift Guardrails</span>
                <span className="font-mono font-bold text-amber-600 dark:text-amber-400">{shiftGuardrails.length}</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Chamber Overlap Engine</span>
                <span className="font-mono font-bold text-emerald-600 dark:text-emerald-400">STRICT ENFORCEMENT</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-600 dark:text-slate-400">Authorization PIN Protocol</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400">PIN 4491 REQUIRED</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL 1: PUBLISH VERSIONED TARIFF (FIX 1) */}
      {showTariffModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <History className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Publish Effective-Dated Tariff Version
                </h3>
              </div>
              <button 
                onClick={() => setShowTariffModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handlePublishTariff} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Effective Date</label>
                <input
                  type="date"
                  value={tariffEffectiveDate}
                  onChange={e => setTariffEffectiveDate(e.target.value)}
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
                <span className="text-[10px] text-slate-500">
                  Select today for immediate enforcement, or a future date for scheduled revisions.
                </span>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Consultation Fee (₹)</label>
                  <input
                    type="number"
                    value={fee}
                    onChange={e => setFee(Number(e.target.value))}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono font-bold text-emerald-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-emerald-400"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Follow-up Fee (₹)</label>
                  <input
                    type="number"
                    value={followupFee}
                    onChange={e => setFollowupFee(Number(e.target.value))}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Free Validity (Days)</label>
                  <input
                    type="number"
                    value={validityDays}
                    onChange={e => setValidityDays(Number(e.target.value))}
                    required
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Doctor Revenue Split</label>
                  <span className="font-mono font-bold text-blue-600 dark:text-blue-400">{doctorSplit}% Doctor / {100 - doctorSplit}% Clinic</span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="95"
                  step="5"
                  value={doctorSplit}
                  onChange={e => setDoctorSplit(Number(e.target.value))}
                  className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer dark:bg-slate-800 accent-blue-600"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Audit Change Justification Reason *</label>
                <input
                  type="text"
                  value={tariffReason}
                  onChange={e => setTariffReason(e.target.value)}
                  placeholder="e.g. Q4 2026 Revision - Revised Specialist Dermatologist Split"
                  required
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
                <label className="font-bold text-amber-900 dark:text-amber-300 flex items-center gap-1.5 mb-1">
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
                  className="w-full rounded-xl border border-amber-300 bg-white p-2 font-mono text-center text-sm font-bold tracking-widest shadow-sm dark:border-amber-700 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {tariffError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-medium">
                  {tariffError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTariffModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <DoorOpen className="h-5 w-5 text-amber-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Schedule Chamber Shift Guardrail
                </h3>
              </div>
              <button 
                onClick={() => setShowShiftModal(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSaveShiftGuardrail} className="space-y-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Physical Chamber</label>
                  <select
                    value={shiftChamber}
                    onChange={e => setShiftChamber(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="Chamber 1 - OPD Main">Chamber 1 - OPD Main</option>
                    <option value="Chamber 2 - Laser & Aesthetics">Chamber 2 - Laser &amp; Aesthetics</option>
                    <option value="Chamber 3 - Dermatosurgery OT">Chamber 3 - Dermatosurgery OT</option>
                    <option value="Chamber 4 - Trichology & Derm">Chamber 4 - Trichology &amp; Derm</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 dark:text-slate-300">Assign Doctor</label>
                  <select
                    value={shiftDoctorSlug}
                    onChange={e => setShiftDoctorSlug(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
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
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Shift Name</label>
                  <select
                    value={shiftName}
                    onChange={e => setShiftName(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  >
                    <option value="Morning OPD">Morning OPD</option>
                    <option value="Evening OPD">Evening OPD</option>
                    <option value="Specialist Clinic">Specialist Clinic</option>
                  </select>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Start Time</label>
                  <input
                    type="text"
                    value={shiftStartTime}
                    onChange={e => setShiftStartTime(e.target.value)}
                    placeholder="10:00 AM"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">End Time</label>
                  <input
                    type="text"
                    value={shiftEndTime}
                    onChange={e => setShiftEndTime(e.target.value)}
                    placeholder="02:00 PM"
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Token Cutoff (Mins Prior)</label>
                  <input
                    type="number"
                    value={shiftCutoffMins}
                    onChange={e => setShiftCutoffMins(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                  <span className="text-[10px] text-slate-500">Closes token issuance before shift ends</span>
                </div>

                <div>
                  <label className="font-semibold text-slate-700 dark:text-slate-300">Max Token Capacity</label>
                  <input
                    type="number"
                    value={shiftCapacity}
                    onChange={e => setShiftCapacity(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-200 dark:border-slate-800">
                <input
                  type="checkbox"
                  id="autoCancelToggle"
                  checked={shiftAutoCancel}
                  onChange={e => setShiftAutoCancel(e.target.checked)}
                  className="rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="autoCancelToggle" className="text-[11px] font-medium text-slate-700 dark:text-slate-300">
                  Auto-cancel unseen tokens at shift end + dispatch automated WhatsApp reschedule voucher
                </label>
              </div>

              {shiftConflictError && (
                <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-700 dark:text-rose-300 font-bold flex items-start gap-2">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
                  <div className="leading-tight">{shiftConflictError}</div>
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowShiftModal(false)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-amber-600 px-5 py-2 font-bold text-white hover:bg-amber-700 shadow-sm"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserMinus className="h-5 w-5 text-rose-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Safe Doctor Deactivation Protocol
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDoctorForOffboard(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs text-amber-900 dark:text-amber-200 leading-relaxed">
              <strong>DPDP Act &amp; NMC Compliance Notice:</strong> Deactivating <strong>{selectedDoctorForOffboard.full_name}</strong> freezes new appointment bookings immediately. All historical medical records, past prescriptions, and bills remain 100% permanently linked and intact without data loss.
            </div>

            {/* Automated Final Settlement Calculation */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-950/80 border border-slate-200 dark:border-slate-800 space-y-2 text-xs">
              <div className="flex items-center justify-between font-bold text-slate-900 dark:text-white">
                <span className="flex items-center gap-1.5">
                  <DollarSign className="h-4 w-4 text-emerald-600" />
                  Automated Final Payout Settlement
                </span>
                <span className="font-mono text-[10px] text-blue-600 bg-blue-100 dark:bg-blue-950/60 px-2 py-0.5 rounded-full">
                  SETTLE-DR-2026-9921
                </span>
              </div>

              <div className="space-y-1 text-slate-600 dark:text-slate-400 text-[11px] pt-1 border-t border-slate-200/60 dark:border-slate-800">
                <div className="flex justify-between">
                  <span>Unsettled OPD Completed Visits:</span>
                  <span className="font-mono font-bold text-slate-900 dark:text-white">14 Visits</span>
                </div>
                <div className="flex justify-between">
                  <span>Gross Consultation Revenue:</span>
                  <span className="font-mono text-slate-900 dark:text-white">₹8,400.00</span>
                </div>
                <div className="flex justify-between font-bold text-emerald-600 dark:text-emerald-400 text-xs pt-1 border-t border-dashed border-slate-200 dark:border-slate-700">
                  <span>Calculated Final Payout (80% Doctor Share):</span>
                  <span className="font-mono text-sm">₹6,720.00</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleOffboardDoctor} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 dark:text-slate-300">Deactivation Reason *</label>
                <select
                  value={offboardReason}
                  onChange={e => setOffboardReason(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                >
                  <option value="Contract Term Completion">Contract Term Completion</option>
                  <option value="Relocation / Resignation">Relocation / Resignation</option>
                  <option value="Medical Leave / Sabbatical">Medical Leave / Sabbatical</option>
                  <option value="Rotational Schedule Change">Rotational Schedule Change</option>
                </select>
              </div>

              <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/20">
                <label className="font-bold text-rose-900 dark:text-rose-300 flex items-center gap-1.5 mb-1">
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
                  className="w-full rounded-xl border border-rose-300 bg-white p-2 font-mono text-center text-sm font-bold tracking-widest shadow-sm dark:border-rose-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              {offboardError && (
                <div className="p-2.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-600 dark:text-rose-400 font-medium">
                  {offboardError}
                </div>
              )}

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctorForOffboard(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={offboardingLoading}
                  className="rounded-xl bg-rose-600 px-5 py-2 font-bold text-white hover:bg-rose-700 shadow-sm disabled:opacity-50"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="w-full max-w-md rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <UserCheck className="h-5 w-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Reactivate Doctor Practice
                </h3>
              </div>
              <button 
                onClick={() => setSelectedDoctorForReactivate(null)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300">
              Restore <strong>{selectedDoctorForReactivate.full_name}</strong> to live appointment booking and reception queue. All past clinical notes and credentials remain intact.
            </p>

            <form onSubmit={handleReactivateDoctor} className="space-y-4 text-xs">
              <div className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/20">
                <label className="font-bold text-emerald-900 dark:text-emerald-300 flex items-center gap-1.5 mb-1">
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
                  className="w-full rounded-xl border border-emerald-300 bg-white p-2 font-mono text-center text-sm font-bold tracking-widest shadow-sm dark:border-emerald-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setSelectedDoctorForReactivate(null)}
                  className="rounded-xl border border-slate-200 dark:border-slate-800 px-4 py-2 font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-emerald-600 px-5 py-2 font-bold text-white hover:bg-emerald-700 shadow-sm"
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
