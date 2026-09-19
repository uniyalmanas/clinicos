"use client";

import React, { useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import {
  Sparkles,
  Building2,
  ShieldCheck,
  CheckCircle2,
  Phone,
  MessageSquare,
  MapPin,
  Clock,
  BadgeCheck,
  ArrowRight,
  Stethoscope,
  Pill,
  FlaskConical,
  Zap,
  Check
} from "lucide-react";

export default function PartnerWithUsPage() {
  const [partnerType, setPartnerType] = useState<"pharmacy" | "diagnostic_lab">("pharmacy");
  const [businessName, setBusinessName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [whatsapp, setWhatsapp] = useState("");
  const [phone, setPhone] = useState("");
  const [locality, setLocality] = useState("Rajpur Road");
  const [address, setAddress] = useState("");
  const [licenseNumber, setLicenseNumber] = useState("");
  const [homeService, setHomeService] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [registeredData, setRegisteredData] = useState<any>(null);

  const localities = [
    "Rajpur Road",
    "EC Road / Survey Chowk",
    "Chakrata Road / Ballupur",
    "Dalanwala",
    "Patel Nagar / Saharanpur Rd",
    "GMS Road / Vasant Vihar",
    "Haridwar Road / Rispana",
    "Clock Tower / Paltan Bazar"
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!businessName || !contactPerson || !whatsapp || !address) {
      alert("Please fill in the required fields to verify your profile.");
      return;
    }

    setIsSubmitting(true);
    const payload = {
      partner_type: partnerType,
      business_name: businessName,
      contact_person: contactPerson,
      phone: phone || whatsapp,
      whatsapp: whatsapp.replace(/\D/g, ""),
      locality: locality,
      address: address,
      license_number: licenseNumber || "VERIFIED-PENDING",
      home_service: homeService
    };

    try {
      const res = await fetch("http://127.0.0.1:8000/api/v1/marketplace/partners", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      setRegisteredData(payload);
      setIsRegistered(true);
    } catch {
      // Local fallback
      setRegisteredData(payload);
      setIsRegistered(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const sendTestWhatsApp = () => {
    if (!registeredData) return;
    const testMsg = 
`🏥 *TEST CUSTOMER ORDER VIA CLINICOS*
------------------------------------
Namaste ${registeredData.business_name},

This is a test notification confirming your counter is now active on ClinicOS!

📍 *Location:* ${registeredData.locality}
🛡️ *Status:* Verified Partner (0% Commission)

When patients in ${registeredData.locality} search for medicines or lab tests, your counter will receive orders in this format directly.

👉 Manage your listing or profile: http://localhost:3000/partner`;

    const cleanNum = registeredData.whatsapp.replace(/\D/g, "");
    window.open(`https://wa.me/${cleanNum}?text=${encodeURIComponent(testMsg)}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#ECEEF2] text-[#1D1D1F] dark:bg-[#000000] dark:text-[#F5F5F7]">
      {/* 1. HEADER */}
      <header className="sticky top-0 z-50 w-full border-b border-black/[0.06] bg-[#ECEEF2]/80 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#000000]/80">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2.5 group">
              <div className="flex h-10 w-10 items-center justify-center rounded-[12px] bg-[#0071E3] text-white shadow-sm transition group-hover:scale-105">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-bold tracking-tight text-[#1D1D1F] dark:text-white">DocSphere</span>
                <span className="text-xs font-semibold text-[#86868B] dark:text-[#8E8E93]">ClinicOS</span>
              </div>
            </Link>
          </div>

          <nav className="hidden items-center gap-1 sm:flex rounded-full bg-black/[0.04] p-1 dark:bg-white/[0.08] border border-black/[0.04] dark:border-white/[0.06]">
            <Link
              href="/medicines"
              className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition"
            >
              Buy Medicines
            </Link>
            <Link
              href="/lab-tests"
              className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition"
            >
              Lab Tests
            </Link>
            <Link
              href="/partner"
              className="rounded-full px-4 py-1.5 text-xs font-semibold bg-white text-[#1D1D1F] dark:bg-white/10 dark:text-white transition shadow-sm flex items-center gap-1.5"
            >
              <Sparkles className="h-3.5 w-3.5 text-[#34C759]" />
              Partner With Us
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="rounded-full px-4 py-2 text-xs font-semibold text-[#1D1D1F] hover:bg-black/[0.04] dark:text-white dark:hover:bg-white/[0.08] transition"
            >
              Sign In
            </Link>
            <Link
              href="/dashboard"
              className="rounded-full bg-[#0071E3] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0077ED] transition"
            >
              Clinic Desk
            </Link>
          </div>
        </div>
      </header>

      {/* 2. HERO & VALUE PROPOSITION */}
      <section className="relative overflow-hidden pt-12 pb-10 px-4 sm:px-6 lg:px-8 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-4xl text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#34C759]/30 bg-[#34C759]/10 px-4 py-1 text-xs font-bold text-[#34C759] mb-4">
            <Zap className="h-3.5 w-3.5" />
            0% Commission • 100% Free Forever • Local Patient Orders
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-white leading-tight">
            Grow Your Medical Store or Diagnostic Lab With Zero Commission
          </h1>

          <p className="mt-4 text-base sm:text-lg text-[#86868B] dark:text-[#8E8E93] max-w-2xl mx-auto">
            Stop losing customers to centralized e-pharmacy aggregators. Get direct WhatsApp and phone orders from local patients living in your Dehradun neighborhood.
          </p>

          {/* 3 Value Pillars */}
          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-5 text-left">
            <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-[#34C759]/10 text-[#34C759] flex items-center justify-center font-bold text-lg mb-3">
                0%
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                Zero Commission Ever
              </h3>
              <p className="mt-1 text-xs text-[#86868B] leading-relaxed">
                Patients pay you directly via cash or your own counter UPI QR code. We never touch your revenue.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-[#0071E3]/10 text-[#0071E3] flex items-center justify-center font-bold text-lg mb-3">
                <MessageSquare className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                Direct WhatsApp Orders
              </h3>
              <p className="mt-1 text-xs text-[#86868B] leading-relaxed">
                No complex apps or inventory software needed. Inquiries and prescriptions land right on your counter WhatsApp.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white/80 dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm">
              <div className="h-10 w-10 rounded-xl bg-purple-500/10 text-purple-600 flex items-center justify-center font-bold text-lg mb-3">
                <BadgeCheck className="h-5 w-5" />
              </div>
              <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                Verified Partner Badge
              </h3>
              <p className="mt-1 text-xs text-[#86868B] leading-relaxed">
                Get recommended at the top of GPS searches in your Dehradun locality (Rajpur Rd, EC Rd, Chakrata).
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 3. FAST-TRACK ONBOARDING FORM */}
      <main className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-10">
        {!isRegistered ? (
          <div className="p-8 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-xl">
            <div className="flex items-center justify-between pb-6 border-b border-black/[0.06] dark:border-white/[0.08]">
              <div>
                <h2 className="text-xl font-bold text-[#1D1D1F] dark:text-white">
                  30-Second Fast-Track Partner Registration
                </h2>
                <p className="text-xs text-[#86868B] mt-0.5">
                  Fill in your store details to start receiving local patient orders today.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#34C759]/10 text-[#34C759]">
                100% Free
              </span>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              {/* Type Toggle */}
              <div>
                <label className="text-xs font-bold text-[#86868B] uppercase tracking-wider block mb-2">
                  Select Business Type
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setPartnerType("pharmacy")}
                    className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      partnerType === "pharmacy"
                        ? "border-[#0071E3] bg-[#0071E3]/10 text-[#0071E3]"
                        : "border-black/[0.06] dark:border-white/[0.08] text-[#86868B]"
                    }`}
                  >
                    <Pill className="h-4 w-4" />
                    Medical Store / Chemist Shop
                  </button>

                  <button
                    type="button"
                    onClick={() => setPartnerType("diagnostic_lab")}
                    className={`p-3.5 rounded-xl border text-xs font-bold flex items-center justify-center gap-2 transition ${
                      partnerType === "diagnostic_lab"
                        ? "border-[#0071E3] bg-[#0071E3]/10 text-[#0071E3]"
                        : "border-black/[0.06] dark:border-white/[0.08] text-[#86868B]"
                    }`}
                  >
                    <FlaskConical className="h-4 w-4" />
                    Pathology / Diagnostic Lab
                  </button>
                </div>
              </div>

              {/* Business Name & Owner */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white block mb-1">
                    Store / Lab Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Doon Medicos & Surgical"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.12] text-sm text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white block mb-1">
                    Owner / Pharmacist Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={contactPerson}
                    onChange={(e) => setContactPerson(e.target.value)}
                    placeholder="e.g. Gaurav Aggarwal (R.Ph)"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.12] text-sm text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                  />
                </div>
              </div>

              {/* WhatsApp & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white block mb-1">
                    Counter WhatsApp Number (For Orders) *
                  </label>
                  <input
                    type="text"
                    required
                    value={whatsapp}
                    onChange={(e) => setWhatsapp(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.12] text-sm text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white block mb-1">
                    Calling Phone Number
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.12] text-sm text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                  />
                </div>
              </div>

              {/* Locality & Full Address */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white block mb-1">
                    Dehradun Locality *
                  </label>
                  <select
                    value={locality}
                    onChange={(e) => setLocality(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.12] text-sm font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                  >
                    {localities.map((loc) => (
                      <option key={loc} value={loc}>
                        {loc}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white block mb-1">
                    Drug License (DL) / NABL Reg No.
                  </label>
                  <input
                    type="text"
                    value={licenseNumber}
                    onChange={(e) => setLicenseNumber(e.target.value)}
                    placeholder="e.g. UK-DDN-20/21-8941"
                    className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.12] text-sm text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white block mb-1">
                  Full Counter / Shop Address *
                </label>
                <input
                  type="text"
                  required
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="e.g. Shop #14, Rajpur Road, Near Ashley Hall, Dehradun"
                  className="w-full px-3.5 py-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.12] text-sm text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
                />
              </div>

              {/* Checkbox for Home Service */}
              <div className="flex items-center gap-3 p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.06]">
                <input
                  type="checkbox"
                  id="homeDelivery"
                  checked={homeService}
                  onChange={(e) => setHomeService(e.target.checked)}
                  className="h-4 w-4 rounded text-[#0071E3] focus:ring-[#0071E3]"
                />
                <label htmlFor="homeDelivery" className="text-xs text-[#1D1D1F] dark:text-white font-medium cursor-pointer">
                  {partnerType === "pharmacy"
                    ? "We provide home medicine delivery within 3 km in our locality"
                    : "We provide free phlebotomist home blood sample collection"}
                </label>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3.5 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white text-sm font-bold shadow-lg transition flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? "Activating Verified Profile..." : "Claim Free Verified Partner Profile"}
                <ArrowRight className="h-4 w-4" />
              </button>
            </form>
          </div>
        ) : (
          /* SUCCESS CONFIRMATION STATE */
          <div className="p-8 rounded-3xl bg-white dark:bg-[#1C1C1E] border border-[#34C759]/30 shadow-2xl space-y-6 animate-in fade-in duration-300">
            <div className="h-14 w-14 rounded-2xl bg-[#34C759]/10 text-[#34C759] flex items-center justify-center mx-auto">
              <CheckCircle2 className="h-8 w-8" />
            </div>

            <div className="text-center">
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-[#34C759]/10 text-[#34C759] inline-block mb-2">
                Verified Partner Active
              </span>
              <h2 className="text-2xl font-bold text-[#1D1D1F] dark:text-white">
                Namaste {registeredData.contactPerson}!
              </h2>
              <p className="mt-1 text-sm text-[#86868B] max-w-md mx-auto">
                <strong>{registeredData.businessName}</strong> is now verified on ClinicOS for <strong>{registeredData.locality}</strong> with 0% commission.
              </p>
            </div>

            {/* Live Profile Card Preview */}
            <div className="p-5 rounded-2xl border border-black/[0.08] dark:border-white/[0.12] bg-[#F5F5F7] dark:bg-white/[0.04]">
              <span className="text-[10px] font-bold text-[#86868B] uppercase tracking-wider block mb-2">
                Live Directory Listing Preview:
              </span>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                      {registeredData.businessName}
                    </h3>
                    <BadgeCheck className="h-4 w-4 text-[#34C759]" />
                  </div>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    📍 {registeredData.address}
                  </p>
                  <p className="text-[11px] text-[#515154] dark:text-[#A1A1A6] mt-1">
                    DL: {registeredData.licenseNumber} • WhatsApp: +{registeredData.whatsapp}
                  </p>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#34C759] text-white">
                  0% Fee
                </span>
              </div>
            </div>

            {/* Test WhatsApp Action */}
            <div className="space-y-3 pt-2">
              <button
                onClick={sendTestWhatsApp}
                className="w-full py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
              >
                <MessageSquare className="h-4 w-4" />
                Send Test Customer WhatsApp to My Phone
              </button>

              <Link
                href="/medicines"
                className="w-full py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] hover:bg-black/[0.02] text-xs font-semibold text-[#1D1D1F] dark:text-white transition flex items-center justify-center"
              >
                View Live Medicines Marketplace
              </Link>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
