"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";
import { DIAGNOSTIC_LAB_TESTS, DEHRADUN_LABS, DiagnosticLabTest, DiagnosticLabCenter } from "@/data/labTests";
import {
  Search,
  FlaskConical,
  Sparkles,
  MapPin,
  Clock,
  ShieldCheck,
  CheckCircle2,
  Calendar,
  Phone,
  MessageSquare,
  Building2,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  BadgeCheck,
  Home,
  Check,
  X,
  Stethoscope,
  Printer
} from "lucide-react";

export default function LabTestsPage() {
  const allTests = DIAGNOSTIC_LAB_TESTS;
  const labs = DEHRADUN_LABS;

  // Search & Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedLab, setSelectedLab] = useState<DiagnosticLabCenter>(labs[0]);

  // Selected Tests Basket
  const [selectedTests, setSelectedTests] = useState<DiagnosticLabTest[]>([allTests[0]]); // default CBC selected

  // Patient Booking Info
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAddress, setPatientAddress] = useState("Rajpur Road, Dehradun");
  const [slotDate, setSlotDate] = useState("Tomorrow Morning (07:00 AM - 09:00 AM)");
  const [collectionType, setCollectionType] = useState<"home" | "walkin">("home");

  // Issued Lab Voucher Modal
  const [issuedSlip, setIssuedSlip] = useState<{
    token: string;
    date: string;
    lab: DiagnosticLabCenter;
    tests: { name: string; price: number; fasting: string }[];
    total: number;
    homeCollection: boolean;
  } | null>(null);

  // Categories
  const categories = [
    "All",
    "Full Body Checkup",
    "Routine Blood",
    "Diabetes & Metabolic",
    "Heart & Lipid",
    "Liver & Kidney",
    "Vitamins & Hormones"
  ];

  // Filtered Tests
  const filteredTests = useMemo(() => {
    return allTests.filter((test) => {
      const matchesCat = selectedCategory === "All" || test.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        test.name.toLowerCase().includes(q) ||
        test.code.toLowerCase().includes(q) ||
        test.description.toLowerCase().includes(q) ||
        test.sample_report_parameters.some((p) => p.toLowerCase().includes(q));
      return matchesCat && matchesSearch;
    });
  }, [allTests, selectedCategory, searchQuery]);

  // Cart operations
  const toggleTest = (test: DiagnosticLabTest) => {
    setSelectedTests((prev) => {
      const exists = prev.some((t) => t.id === test.id);
      if (exists) {
        return prev.filter((t) => t.id !== test.id);
      } else {
        return [...prev, test];
      }
    });
  };

  const removeTest = (id: string) => {
    setSelectedTests((prev) => prev.filter((t) => t.id !== id));
  };

  // Calculations
  const totalMrp = useMemo(() => {
    return selectedTests.reduce((sum, t) => sum + t.mrp, 0);
  }, [selectedTests]);

  const totalDirectPrice = useMemo(() => {
    return selectedTests.reduce((sum, t) => sum + t.direct_price, 0);
  }, [selectedTests]);

  const totalSavings = totalMrp - totalDirectPrice;

  // Fasting requirement alert
  const requiresFasting = useMemo(() => {
    return selectedTests.some((t) => t.fasting_required);
  }, [selectedTests]);

  // Handle WhatsApp Home Collection Booking with Trojan Horse Partner Hook
  const handleSendWhatsApp = async () => {
    if (!patientName) {
      alert("Please provide patient name before continuing.");
      return;
    }

    const testListStr = selectedTests
      .map((t, idx) => `${idx + 1}. ${t.name} (₹${t.direct_price}) [${t.fasting_required ? "Fasting Req" : "Non-Fasting"}]`)
      .join("\n");

    const message = 
`🔬 *DIAGNOSTIC LAB INQUIRY VIA CLINICOS NETWORK*
--------------------------------------------------
Namaste *${selectedLab.name}*,

A patient booked diagnostic testing through ClinicOS (0% Commission):

👤 *Patient Name:* ${patientName}
📞 *Contact:* ${patientPhone || "Requested on WhatsApp"}
📍 *Address:* ${patientAddress}
🏠 *Service:* ${collectionType === "home" ? "Home Sample Collection Required" : "Visiting Lab Centre"}
⏰ *Preferred Slot:* ${slotDate}

🧪 *Tests Requested:*
${testListStr}

💰 *Est. Direct Price:* ₹${totalDirectPrice} (Zero Commission)
⚠️ *Fasting Note:* ${requiresFasting ? "10-12 hours overnight fasting confirmed" : "No fasting required"}

Please confirm appointment and phlebotomist dispatch details.
--------------------------------------------------
ℹ️ *NOTE TO LAB MANAGER:*
ClinicOS is a 0% commission local healthcare platform connecting Dehradun patients directly to accredited diagnostic labs.

🎁 *Want to receive more direct patient sample requests?*
👉 Claim your free Verified Lab Profile here: http://localhost:3000/partner
(Takes 30 seconds • 100% Free Forever • Verified NABL Partner Badge)`;

    // Log to backend API
    const tokenNum = Math.floor(1000 + Math.random() * 9000);
    const tokenStr = `COS-LAB-${tokenNum}`;

    try {
      await fetch(`/api/marketplace/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry_type: "lab_test",
          patient_name: patientName,
          patient_phone: patientPhone || "+919876543200",
          locality: patientAddress,
          target_entity_name: selectedLab.name,
          target_entity_phone: selectedLab.phone,
          items: selectedTests.map((t) => ({
            name: t.name,
            qty: 1,
            form: "Test",
            price: t.direct_price
          })),
          prescription_preview: `Slot: ${slotDate}`,
          notes: `Home Collection: ${collectionType === "home" ? "Yes" : "No"}`,
          channel: "whatsapp"
        })
      });
    } catch {
      // Offline fallback
    }

    // Show voucher slip
    setIssuedSlip({
      token: tokenStr,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      lab: selectedLab,
      tests: selectedTests.map((t) => ({
        name: t.name,
        price: t.direct_price,
        fasting: t.fasting_instructions
      })),
      total: totalDirectPrice,
      homeCollection: collectionType === "home"
    });

    // Launch WhatsApp
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${selectedLab.whatsapp}?text=${encoded}`, "_blank");
  };

  return (
    <div className="min-h-screen bg-[#ECEEF2] text-[#1D1D1F] dark:bg-[#000000] dark:text-[#F5F5F7]">
      {/* 1. TOP TRANSLUCENT HEADER */}
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
              className="rounded-full px-4 py-1.5 text-xs font-semibold bg-white text-[#1D1D1F] dark:bg-white/10 dark:text-white transition shadow-sm flex items-center gap-1.5"
            >
              <FlaskConical className="h-3.5 w-3.5 text-[#0071E3]" />
              Lab Tests
            </Link>
            <Link
              href="/specialties"
              className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition"
            >
              Specialties
            </Link>
            <Link
              href="/search"
              className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition"
            >
              Find Doctors
            </Link>
            <Link
              href="/partner"
              className="rounded-full px-4 py-1.5 text-xs font-semibold text-[#34C759] hover:text-[#28A745] transition flex items-center gap-1"
            >
              <Sparkles className="h-3 w-3" />
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

      {/* 2. HERO & VALUE BANNER */}
      <section className="relative overflow-hidden pt-10 pb-8 px-4 sm:px-6 lg:px-8 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#0071E3]/20 bg-[#0071E3]/10 px-3.5 py-1 text-xs font-semibold text-[#0071E3] mb-3">
                <ShieldCheck className="h-3.5 w-3.5" />
                NABL Accredited Labs • Free Home Sample Collection • Direct 0% Commission
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-white">
                Book Diagnostic Lab Tests & Health Packages
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[#86868B] dark:text-[#8E8E93] max-w-2xl">
                Get accurate blood, urine, and pathology reports from certified Dehradun diagnostic centers. Certified phlebotomists arrive at your doorstep for painless morning sample collection.
              </p>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-center">
                <Home className="h-4 w-4 text-[#0071E3] mx-auto mb-1" />
                <span className="text-xs font-bold block text-[#1D1D1F] dark:text-white">Home Collection</span>
                <span className="text-[10px] text-[#86868B]">100% Free Service</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-center">
                <Clock className="h-4 w-4 text-[#34C759] mx-auto mb-1" />
                <span className="text-xs font-bold block text-[#1D1D1F] dark:text-white">Same Day Reports</span>
                <span className="text-[10px] text-[#86868B]">Digital PDF on WhatsApp</span>
              </div>
              <div className="p-3.5 rounded-xl bg-white/70 dark:bg-white/[0.05] border border-black/[0.06] dark:border-white/[0.08] text-center col-span-2 sm:col-span-1">
                <BadgeCheck className="h-4 w-4 text-[#0071E3] mx-auto mb-1" />
                <span className="text-xs font-bold block text-[#1D1D1F] dark:text-white">NABL Standards</span>
                <span className="text-[10px] text-[#86868B]">Automated Analyzers</span>
              </div>
            </div>
          </div>

          {/* Search bar */}
          <div className="mt-6 relative">
            <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#86868B]" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search tests (e.g. CBC, Liver Function, Thyroid, HbA1c, Vitamin D, Full Body Checkup)..."
              className="w-full pl-10 pr-10 py-3 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] text-sm text-[#1D1D1F] dark:text-white placeholder-[#86868B] focus:outline-none focus:ring-2 focus:ring-[#0071E3]"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3.5 top-3.5 text-[#86868B] hover:text-[#1D1D1F]"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>

          {/* Category tabs */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`whitespace-nowrap px-3.5 py-1.5 rounded-full text-xs font-semibold transition ${
                  selectedCategory === cat
                    ? "bg-[#0071E3] text-white shadow-sm"
                    : "bg-white/80 dark:bg-white/[0.06] text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white border border-black/[0.04] dark:border-white/[0.06]"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 3. MAIN LAB TEST DIRECTORY + APPOINTMENT BASKET */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Diagnostic Tests List (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-[#0071E3]" />
                Pathology Tests & Packages ({filteredTests.length})
              </h2>
              <span className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                Prices reflect 0% commission direct rates
              </span>
            </div>

            <div className="space-y-4">
              {filteredTests.map((test) => {
                const isSelected = selectedTests.some((t) => t.id === test.id);
                return (
                  <div
                    key={test.id}
                    className={`p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border transition shadow-sm ${
                      isSelected
                        ? "border-[#0071E3] ring-1 ring-[#0071E3]/20"
                        : "border-black/[0.06] dark:border-white/[0.08] hover:shadow-md"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#0071E3]/10 text-[#0071E3]">
                            {test.code}
                          </span>
                          <span className="px-2 py-0.5 rounded text-[10px] font-semibold bg-black/[0.04] dark:bg-white/[0.08] text-[#86868B]">
                            {test.category}
                          </span>
                          {test.popular && (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600">
                              ⭐ High Demand
                            </span>
                          )}
                        </div>

                        <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white mt-1">
                          {test.name}
                        </h3>

                        <p className="mt-1 text-xs text-[#515154] dark:text-[#A1A1A6] line-clamp-2">
                          {test.description}
                        </p>

                        <div className="mt-3 flex items-center gap-3 text-xs text-[#86868B] dark:text-[#8E8E93] flex-wrap">
                          <span className="flex items-center gap-1 font-medium">
                            <Clock className="h-3.5 w-3.5 text-[#34C759]" />
                            {test.turnaround_time}
                          </span>
                          <span>•</span>
                          <span>{test.parameters_count} Parameters Included</span>
                          <span>•</span>
                          <span className={test.fasting_required ? "text-amber-600 font-semibold" : "text-emerald-600"}>
                            {test.fasting_required ? "Fasting Required" : "No Fasting"}
                          </span>
                        </div>

                        {/* Sample parameters preview */}
                        <div className="mt-3 pt-2.5 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center gap-1.5 flex-wrap">
                          <span className="text-[10px] font-bold uppercase text-[#86868B]">Key Markers:</span>
                          {test.sample_report_parameters.slice(0, 4).map((param, idx) => (
                            <span
                              key={idx}
                              className="px-2 py-0.5 rounded-full text-[10px] bg-black/[0.03] dark:bg-white/[0.05] text-[#515154] dark:text-[#A1A1A6]"
                            >
                              {param}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Pricing & Selection Button */}
                      <div className="sm:text-right flex sm:flex-col items-center sm:items-end justify-between gap-3 pt-3 sm:pt-0 border-t sm:border-t-0 border-black/[0.04]">
                        <div>
                          <span className="text-xs text-[#86868B] line-through block">
                            ₹{test.mrp}
                          </span>
                          <span className="text-xl font-extrabold text-[#1D1D1F] dark:text-white block">
                            ₹{test.direct_price}
                          </span>
                          <span className="text-[11px] font-bold text-[#34C759]">
                            Save {test.discount_percent}%
                          </span>
                        </div>

                        <button
                          onClick={() => toggleTest(test)}
                          className={`px-4 py-2 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-[#34C759] text-white shadow-sm"
                              : "bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-sm"
                          }`}
                        >
                          {isSelected ? (
                            <>
                              <Check className="h-3.5 w-3.5" /> Added to Tests
                            </>
                          ) : (
                            <>
                              <Plus className="h-3.5 w-3.5" /> Select Test
                            </>
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Lab Selection & Home Booking Console (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0071E3]" />
                  Select NABL Partner Lab
                </h3>
                <span className="text-[11px] font-semibold text-[#34C759]">Free Sample Pickup</span>
              </div>

              {/* Lab Selector */}
              <div className="mt-4">
                <label className="text-xs font-semibold text-[#86868B] dark:text-[#8E8E93] block mb-1">
                  Accredited Diagnostic Centre in Dehradun:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {labs.map((lab) => {
                    const isSelected = selectedLab.id === lab.id;
                    return (
                      <div
                        key={lab.id}
                        onClick={() => setSelectedLab(lab)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                          isSelected
                            ? "border-[#0071E3] bg-[#0071E3]/5 dark:bg-[#0071E3]/10"
                            : "border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.02]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1D1D1F] dark:text-white">
                            {lab.name}
                          </span>
                          <BadgeCheck className="h-3.5 w-3.5 text-[#34C759]" />
                        </div>
                        <p className="text-[#86868B] text-[11px] mt-0.5">
                          📍 {lab.locality}
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-[#515154] dark:text-[#A1A1A6]">
                          <span>⭐ {lab.rating} ({lab.total_reviews})</span>
                          <span>•</span>
                          <span>Turnaround: {lab.report_turnaround}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Patient Details & Slot */}
              <div className="mt-5 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] space-y-3">
                <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white uppercase tracking-wider">
                  Sample Collection Details
                </h4>

                <div>
                  <label className="text-[11px] font-semibold text-[#86868B] block mb-1">
                    Patient Full Name *
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Rajesh Kumar"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.12] text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#86868B] block mb-1">
                    WhatsApp Mobile Number
                  </label>
                  <input
                    type="text"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.12] text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#86868B] block mb-1">
                    Sample Collection Address
                  </label>
                  <input
                    type="text"
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                    placeholder="House / Flat No, Street, Dehradun"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.12] text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#86868B] block mb-1">
                    Preferred Collection Slot
                  </label>
                  <select
                    value={slotDate}
                    onChange={(e) => setSlotDate(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.12] text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                  >
                    <option>Tomorrow Morning (07:00 AM - 08:30 AM)</option>
                    <option>Tomorrow Morning (08:30 AM - 10:00 AM)</option>
                    <option>Today Afternoon (02:00 PM - 04:00 PM)</option>
                    <option>Day After Tomorrow (07:00 AM - 09:00 AM)</option>
                  </select>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setCollectionType("home")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                      collectionType === "home"
                        ? "bg-[#0071E3] text-white"
                        : "bg-black/[0.04] dark:bg-white/[0.06] text-[#86868B]"
                    }`}
                  >
                    🏠 Home Sample Pickup
                  </button>
                  <button
                    type="button"
                    onClick={() => setCollectionType("walkin")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                      collectionType === "walkin"
                        ? "bg-[#0071E3] text-white"
                        : "bg-black/[0.04] dark:bg-white/[0.06] text-[#86868B]"
                    }`}
                  >
                    🏥 Visit Lab Centre
                  </button>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mt-5 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                    Selected Tests ({selectedTests.length})
                  </span>
                  <div className="text-right">
                    <span className="text-[11px] text-[#86868B] line-through block">
                      MRP: ₹{totalMrp}
                    </span>
                    <span className="text-sm font-bold text-[#0071E3]">
                      Direct: ₹{totalDirectPrice}
                    </span>
                  </div>
                </div>

                {/* Fasting Alert */}
                {requiresFasting && (
                  <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400 mb-3 flex items-start gap-1.5">
                    <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                    <span>
                      <strong>Fasting Required:</strong> 10–12 hours overnight fasting recommended for accurate glucose/lipid profiles.
                    </span>
                  </div>
                )}

                {/* Selected Tests List */}
                <div className="space-y-1.5 max-h-32 overflow-y-auto mb-3">
                  {selectedTests.map((t) => (
                    <div
                      key={t.id}
                      className="flex items-center justify-between text-xs py-1 border-b border-black/[0.02]"
                    >
                      <span className="text-[#1D1D1F] dark:text-white font-medium truncate max-w-[170px]">
                        {t.name}
                      </span>
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[#1D1D1F] dark:text-white">
                          ₹{t.direct_price}
                        </span>
                        <button
                          onClick={() => removeTest(t.id)}
                          className="text-red-500 hover:text-red-600"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Primary Booking Button: Direct WhatsApp with Trojan Horse Partner Invite */}
                <button
                  onClick={handleSendWhatsApp}
                  disabled={selectedTests.length === 0}
                  className="w-full mt-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Book via WhatsApp (0% Fee)
                </button>

                {/* Secondary Call Button */}
                <a
                  href={`tel:${selectedLab.phone}`}
                  className="w-full mt-2 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] text-xs font-semibold text-[#1D1D1F] dark:text-white transition flex items-center justify-center gap-2"
                >
                  <Phone className="h-3.5 w-3.5 text-[#0071E3]" />
                  Call Lab Desk ({selectedLab.name.split(" ")[0]})
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. DIGITAL LAB ORDER VOUCHER SLIP */}
      {issuedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1C1C1E] max-w-md w-full rounded-2xl shadow-2xl border border-black/[0.08] dark:border-white/[0.12] overflow-hidden">
            <div className="p-4 bg-[#0071E3] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5" />
                <span className="font-bold text-sm">ClinicOS Diagnostic Test Voucher</span>
              </div>
              <button onClick={() => setIssuedSlip(null)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-black/[0.06] dark:border-white/[0.08]">
                <div>
                  <span className="text-[10px] text-[#86868B] uppercase tracking-wider block">
                    Voucher Token ID
                  </span>
                  <span className="text-lg font-mono font-bold text-[#0071E3]">
                    #{issuedSlip.token}
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-[#86868B] block">Date</span>
                  <span className="text-xs font-semibold text-[#1D1D1F] dark:text-white">
                    {issuedSlip.date}
                  </span>
                </div>
              </div>

              <div>
                <span className="text-xs font-bold text-[#86868B] block mb-1">
                  Selected Diagnostic Partner:
                </span>
                <p className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                  {issuedSlip.lab.name}
                </p>
                <p className="text-xs text-[#86868B]">
                  {issuedSlip.lab.address} • NABL Certified
                </p>
              </div>

              <div className="border rounded-xl p-3 bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.08]">
                <span className="text-[11px] font-bold text-[#86868B] block mb-2 uppercase">
                  Investigation Checklist
                </span>
                <div className="space-y-1.5 text-xs">
                  {issuedSlip.tests.map((t, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{t.name}</span>
                      <span className="font-semibold">₹{t.price}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t flex justify-between font-bold text-xs">
                  <span>Payable at Collection</span>
                  <span className="text-[#0071E3]">₹{issuedSlip.total}</span>
                </div>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.12] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-black/[0.02]"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Voucher
                </button>
                <button
                  onClick={() => setIssuedSlip(null)}
                  className="flex-1 py-2 rounded-xl bg-[#0071E3] text-white text-xs font-semibold hover:bg-[#0077ED]"
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
