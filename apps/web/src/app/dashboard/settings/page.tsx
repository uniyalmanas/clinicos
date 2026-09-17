"use client";

import React, { useState } from "react";
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
  Smartphone
} from "lucide-react";

export default function DashboardSettingsPage() {
  const [clinicName, setClinicName] = useState("Derma Care Skin & Laser Centre");
  const [address, setAddress] = useState("14, Rajpur Road, Near Ashley Hall, Dehradun");
  const [phone, setPhone] = useState("+919876543210");
  const [fee, setFee] = useState(600);
  const [followupFee, setFollowupFee] = useState(300);
  const [validityDays, setValidityDays] = useState(7);
  const [morningShift, setMorningShift] = useState("10:00 AM - 02:00 PM");
  const [eveningShift, setEveningShift] = useState("05:00 PM - 08:30 PM");
  const [savedToast, setSavedToast] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    setSavedToast(true);
    setTimeout(() => setSavedToast(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Clinic Configuration & Roster Settings
          </h1>
          <p className="text-xs text-slate-500">
            Configure consultation fees, OPD shift timings, and printable counter stand QRs
          </p>
        </div>

        {savedToast && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xl animate-in fade-in">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            <span>Settings Saved & Synchronized Across App</span>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-12">
        {/* SETTINGS FORM */}
        <form onSubmit={handleSave} className="lg:col-span-8 space-y-6">
          {/* Clinic Details */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Building2 className="h-4 w-4 text-brand-600" />
              Practice Profile & Location
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Clinic Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={e => setClinicName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Helpline Phone (WhatsApp)</label>
                <input
                  type="text"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="font-semibold text-slate-700 dark:text-slate-300">Address (Dehradun Pilot Hub)</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* OPD Fees & Follow-up Rules */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-emerald-600" />
              OPD Consultation Fees & Follow-up Rules
            </h2>

            <div className="grid gap-4 sm:grid-cols-3 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">New Consultation Fee (₹)</label>
                <input
                  type="number"
                  value={fee}
                  onChange={e => setFee(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Follow-up Fee (₹)</label>
                <input
                  type="number"
                  value={followupFee}
                  onChange={e => setFollowupFee(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Follow-up Validity (Days)</label>
                <input
                  type="number"
                  value={validityDays}
                  onChange={e => setValidityDays(Number(e.target.value))}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* OPD Shift Timings */}
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900 space-y-4">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-600" />
              Chamber OPD Roster Hours
            </h2>

            <div className="grid gap-4 sm:grid-cols-2 text-xs">
              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Morning OPD Shift</label>
                <input
                  type="text"
                  value={morningShift}
                  onChange={e => setMorningShift(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>

              <div>
                <label className="font-semibold text-slate-700 dark:text-slate-300">Evening OPD Shift</label>
                <input
                  type="text"
                  value={eveningShift}
                  onChange={e => setEveningShift(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-slate-200 bg-white p-2.5 font-mono shadow-sm dark:border-slate-800 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>
          </div>

          <button
            type="submit"
            className="inline-flex items-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition"
          >
            <Save className="h-4 w-4" /> Save Practice Settings
          </button>
        </form>

        {/* PRINTABLE QR PREVIEW */}
        <div className="lg:col-span-4 rounded-3xl border border-slate-200 bg-white p-6 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white">
            Counter Stand QR Generator
          </h3>
          <p className="text-xs text-slate-500 mt-1">
            Print and display this acrylic stand at your reception counter for patient walk-in self check-in
          </p>

          <div className="mx-auto my-6 flex h-48 w-48 items-center justify-center rounded-2xl bg-slate-50 p-4 border border-slate-200 dark:bg-slate-950 dark:border-slate-800">
            <QrCode className="h-40 w-40 text-slate-900 dark:text-white" />
          </div>

          <div className="rounded-xl bg-brand-50 p-3 text-xs font-mono font-bold text-brand-800 dark:bg-brand-950 dark:text-brand-300">
            clinicos.in/book?doctor=dr-rahul-sharma
          </div>

          <button
            onClick={() => window.print()}
            className="mt-6 w-full rounded-xl bg-slate-900 py-2.5 text-xs font-bold text-white shadow-sm hover:bg-slate-800 dark:bg-white dark:text-slate-900 transition"
          >
            <Printer className="inline h-3.5 w-3.5 mr-1.5" /> Print A5 Counter Acrylic Stand
          </button>
        </div>
      </div>
    </div>
  );
}
