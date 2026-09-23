"use client";

import React, { useState, useEffect } from "react";
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
  Check
} from "lucide-react";

export default function DashboardSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedToast, setSavedToast] = useState(false);
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

  // Doctor & Fee State
  const [fee, setFee] = useState(600);
  const [followupFee, setFollowupFee] = useState(300);
  const [validityDays, setValidityDays] = useState(7);
  const [morningShift, setMorningShift] = useState("10:00 AM - 02:00 PM");
  const [eveningShift, setEveningShift] = useState("05:00 PM - 08:30 PM");
  const [doctorSplit, setDoctorSplit] = useState(80); // Default 80% to doctor, 20% to clinic
  const [doctorsList, setDoctorsList] = useState<any[]>([]);

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
          if (data.doctors && data.doctors.length > 0) {
            setDoctorsList(data.doctors);
            const leadDoctor = data.doctors[0];
            if (leadDoctor.consultation_fee) setFee(Number(leadDoctor.consultation_fee));
            if (leadDoctor.followup_fee) setFollowupFee(Number(leadDoctor.followup_fee));
            if (leadDoctor.followup_validity_days) setValidityDays(Number(leadDoctor.followup_validity_days));
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

  const handleSave = async (e: React.FormEvent) => {
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
        doctor_split_percentage: doctorSplit,
        phone,
        address_line: address,
        city,
        state,
        postal_code: postalCode,
        opening_hours: {
          morning: morningShift,
          evening: eveningShift
        },
        consultation_fee: fee,
        followup_fee: followupFee,
        followup_validity_days: validityDays
      };

      const res = await fetch("/api/clinics", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        // Sync local storage user cache
        const userStr = localStorage.getItem("clinicos_user");
        if (userStr) {
          const user = JSON.parse(userStr);
          user.clinic_name = clinicName;
          localStorage.setItem("clinicos_user", JSON.stringify(user));
        }
        setSavedToast(true);
        setTimeout(() => setSavedToast(false), 4000);
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

  const bookingUrl = `https://clinicos.in/clinics/${clinicSlug}`;

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 text-xs font-bold mb-1 border border-blue-200/50 dark:border-blue-900/50">
            <ShieldCheck className="h-3.5 w-3.5" /> Clinic Owner & Administrator Console
          </div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Clinic Master Configuration & Roster Settings
          </h1>
          <p className="text-xs text-slate-500">
            Full administrative control: Practice location, consultation tariff, visiting doctor splits, and token QR standees.
          </p>
        </div>

        {savedToast && (
          <div className="flex items-center gap-2 rounded-2xl bg-emerald-600 px-4 py-2.5 text-xs font-bold text-white shadow-xl animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-white" />
            <span>Settings Saved & Synchronized Live to Supabase!</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* SETTINGS FORM */}
        <form onSubmit={handleSave} className="lg:col-span-8 space-y-6">
          {/* 1. Practice Identity */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="h-4 w-4 text-brand-600" />
                Practice Profile & Contact Identity
              </h2>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400">
                Tenant Slug: {clinicSlug}
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
          </div>

          {/* 2. OPD Consultation Tariff & Visiting Doctor Splits */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              OPD Consultation Fees & Doctor Split Rules
            </h2>

            <div className="grid gap-4 sm:grid-cols-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Standard Consultation Fee (₹)</label>
                <input
                  type="number"
                  value={fee}
                  onChange={e => setFee(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono text-sm font-bold text-emerald-600 shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-emerald-400"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Follow-up Review Fee (₹)</label>
                <input
                  type="number"
                  value={followupFee}
                  onChange={e => setFollowupFee(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Free Follow-up Window (Days)</label>
                <input
                  type="number"
                  value={validityDays}
                  onChange={e => setValidityDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            {/* Doctor Revenue Share Payout Rules */}
            <div className="mt-2 rounded-2xl bg-slate-50 p-4 border border-slate-100 dark:bg-slate-950/60 dark:border-slate-800/80">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Percent className="h-3.5 w-3.5 text-blue-500" />
                  Visiting Consultant Revenue Split
                </span>
                <span className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
                  {doctorSplit}% Doctor / {100 - doctorSplit}% Clinic
                </span>
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
              <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                <span>50/50 Shared</span>
                <span>70/30 Standard</span>
                <span>80/20 Specialist</span>
                <span>95/5 Roster Lead</span>
              </div>
            </div>
          </div>

          {/* 3. OPD Chamber Shift Hours */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              OPD Consultation Shifts & Timing
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Morning Shift Hours</label>
                <input
                  type="text"
                  value={morningShift}
                  onChange={e => setMorningShift(e.target.value)}
                  placeholder="10:00 AM - 02:00 PM"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Evening Shift Hours</label>
                <input
                  type="text"
                  value={eveningShift}
                  onChange={e => setEveningShift(e.target.value)}
                  placeholder="05:00 PM - 08:30 PM"
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* SUBMIT BUTTON */}
          <div className="flex items-center gap-4">
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-2xl bg-blue-600 px-6 py-3.5 text-xs font-bold text-white shadow-md hover:bg-blue-700 disabled:opacity-50 transition"
            >
              {saving ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? "Saving Changes to Database..." : "Save & Synchronize All Settings"}
            </button>
            <span className="text-[11px] text-slate-400">
              Changes reflect immediately on your public microsite, reception desk, and digital prescriptions.
            </span>
          </div>
        </form>

        {/* PRINTABLE COUNTER QR & PUBLIC MICROSITE PREVIEW */}
        <div className="lg:col-span-4 space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Official Counter QR Acrylic Stand
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Print and place this QR on your reception counter for patient walk-in self check-in.
            </p>

            <div className="mx-auto my-6 flex h-48 w-48 items-center justify-center rounded-2xl bg-white p-4 border border-slate-200 shadow-inner dark:bg-white dark:border-slate-800">
              <QrCode className="h-40 w-40 text-slate-900" />
            </div>

            <div className="rounded-xl bg-slate-100 p-2.5 text-[11px] font-mono font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200 truncate">
              {bookingUrl}
            </div>

            <button
              onClick={() => window.print()}
              className="mt-5 w-full rounded-2xl bg-slate-900 py-3 text-xs font-bold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 transition flex items-center justify-center gap-2"
            >
              <Printer className="h-4 w-4" /> Print Acrylic Counter Stand (A5)
            </button>
          </div>

          {/* ACTIVE CLINIC DOCTORS ROSTER */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-3">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Users className="h-4 w-4 text-blue-500" />
                Active Doctors in Practice
              </h4>
              <span className="text-[10px] font-bold text-slate-400">
                {doctorsList.length} Registered
              </span>
            </div>

            <div className="space-y-2">
              {doctorsList.map((doc, idx) => (
                <div key={idx} className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 dark:bg-slate-950/60 border border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <div className="font-bold text-slate-900 dark:text-white">{doc.full_name}</div>
                    <div className="text-[10px] text-slate-500">{doc.specialization} • ₹{doc.consultation_fee}</div>
                  </div>
                  <span className="flex h-2 w-2 rounded-full bg-emerald-500"></span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
