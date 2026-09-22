"use client";

import React, { useState, useMemo, useRef } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import ThemeToggle from "@/components/ThemeToggle";
import { getEnrichedMedicines, EnrichedMedicine } from "@/data/medicines";
import { DEHRADUN_PHARMACIES, LocalPharmacy } from "@/data/pharmacies";
import {
  Search,
  Pill,
  Sparkles,
  Upload,
  Mic,
  MicOff,
  Phone,
  MessageSquare,
  MapPin,
  CheckCircle2,
  Clock,
  ShieldCheck,
  Building2,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
  AlertCircle,
  FileText,
  BadgeCheck,
  Stethoscope,
  X,
  Share2,
  Printer
} from "lucide-react";

export default function BuyMedicinesPage() {
  const allMedicines = useMemo(() => getEnrichedMedicines(), []);
  const pharmacies = DEHRADUN_PHARMACIES;

  // Search & Filtering State
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedLocality, setSelectedLocality] = useState<string>("All Localities");
  const [selectedPharmacy, setSelectedPharmacy] = useState<LocalPharmacy>(pharmacies[0]);

  // Cart / Medicine Selection
  const [cartItems, setCartItems] = useState<{ med: EnrichedMedicine; qty: number }[]>([]);

  // Prescription Upload & AI Scribe state
  const [uploadedFileName, setUploadedFileName] = useState<string | null>(null);
  const [isScanningRx, setIsScanningRx] = useState(false);
  const [rxScanSuccess, setRxScanSuccess] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice Search State
  const [isListening, setIsListening] = useState(false);
  const [voiceTranscript, setVoiceTranscript] = useState("");

  // Patient Info & Digital Token modal
  const [patientName, setPatientName] = useState("");
  const [patientPhone, setPatientPhone] = useState("");
  const [patientAddress, setPatientAddress] = useState("Rajpur Road, Dehradun");
  const [deliveryType, setDeliveryType] = useState<"delivery" | "pickup">("delivery");
  const [issuedSlip, setIssuedSlip] = useState<{
    token: string;
    date: string;
    pharmacy: LocalPharmacy;
    items: { name: string; qty: number; price: number }[];
    total: number;
  } | null>(null);

  // Categories
  const categories = [
    "All",
    "Antibiotics",
    "Analgesic / Anti-pyretic",
    "Gastrointestinal",
    "Dermatology",
    "Cardio-Diabetic",
    "Dental"
  ];

  const localities = [
    "All Localities",
    "Rajpur Road",
    "EC Road",
    "Ballupur / Chakrata Rd",
    "Dalanwala",
    "Patel Nagar / Saharanpur Rd"
  ];

  // Filtered medicines
  const filteredMedicines = useMemo(() => {
    return allMedicines.filter((med) => {
      const matchesCat = selectedCategory === "All" || med.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch =
        !q ||
        med.brand_name.toLowerCase().includes(q) ||
        med.generic_name.toLowerCase().includes(q) ||
        med.common_instructions.toLowerCase().includes(q);
      return matchesCat && matchesSearch;
    });
  }, [allMedicines, selectedCategory, searchQuery]);

  // Filtered pharmacies by locality
  const filteredPharmacies = useMemo(() => {
    if (selectedLocality === "All Localities") return pharmacies;
    return pharmacies.filter((p) => p.locality.toLowerCase().includes(selectedLocality.toLowerCase()));
  }, [pharmacies, selectedLocality]);

  // Cart operations
  const addToCart = (med: EnrichedMedicine) => {
    setCartItems((prev) => {
      const exists = prev.find((item) => item.med.id === med.id);
      if (exists) {
        return prev.map((item) =>
          item.med.id === med.id ? { ...item, qty: item.qty + 1 } : item
        );
      }
      return [...prev, { med, qty: 1 }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems((prev) => prev.filter((item) => item.med.id !== id));
  };

  const cartTotal = useMemo(() => {
    return cartItems.reduce((sum, item) => sum + item.med.direct_price * item.qty, 0);
  }, [cartItems]);

  // Handle Simulated AI Rx Upload
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadedFileName(file.name);
    setIsScanningRx(true);
    setRxScanSuccess(false);

    // Simulate AI OCR processing
    setTimeout(() => {
      setIsScanningRx(false);
      setRxScanSuccess(true);
      // Auto-extract 2 common medicines into cart
      const rxMeds = allMedicines.slice(0, 3);
      setCartItems((prev) => {
        const newItems = [...prev];
        rxMeds.forEach((m) => {
          if (!newItems.find((i) => i.med.id === m.id)) {
            newItems.push({ med: m, qty: 1 });
          }
        });
        return newItems;
      });
    }, 1400);
  };

  // Handle Voice Search
  const toggleVoiceSearch = () => {
    if (isListening) {
      setIsListening(false);
      return;
    }

    if (!("webkitSpeechRecognition" in window) && !("SpeechRecognition" in window)) {
      alert("Speech recognition is not supported in this browser. Please type to search.");
      return;
    }

    try {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognition();
      recognition.lang = "en-IN";
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setVoiceTranscript(transcript);
        setSearchQuery(transcript);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  // Generate WhatsApp message with Trojan Horse partner hook
  const handleSendWhatsApp = async () => {
    if (!patientName) {
      alert("Please provide patient name before continuing.");
      return;
    }

    const itemsSummary = cartItems.length > 0
      ? cartItems.map((i, idx) => `${idx + 1}. ${i.med.brand_name} (${i.med.strength}) - Qty: ${i.qty}`).join("\n")
      : (uploadedFileName ? `Prescription uploaded: ${uploadedFileName}` : "General medicine inquiry");

    const message = 
`🏥 *ORDER INQUIRY VIA CLINICOS HEALTHCARE NETWORK*
--------------------------------------------------
Namaste *${selectedPharmacy.name}*,

A patient found your medical store on ClinicOS with 0% commission:

👤 *Patient Name:* ${patientName}
📞 *Contact:* ${patientPhone || "Requested on WhatsApp"}
📍 *Patient Locality:* ${patientAddress}
🛵 *Fulfillment:* ${deliveryType === "delivery" ? "Home Delivery Request" : "Counter Pickup"}

📋 *Medicines Inquired:*
${itemsSummary}

${uploadedFileName ? `📎 *Prescription:* ${uploadedFileName} (Verified Digital Slip attached)` : ""}
💰 *Est. Total:* ₹${cartTotal || "As per MRP/Bill"}

Could you please confirm availability and deliver / pack this order?
--------------------------------------------------
ℹ️ *NOTE TO PHARMACIST:*
ClinicOS delivers direct neighborhood patient orders to local pharmacies with *0% commission*.

🎁 *Want to receive more direct orders in Dehradun?*
👉 Claim your free Verified Pharmacy Profile here: ${typeof window !== "undefined" ? window.location.origin : "https://clinicos.in"}/partner
(Takes 30 seconds • 100% Free Forever • Verified Partner Badge)`;

    // Log inquiry to backend API
    const tokenNum = Math.floor(1000 + Math.random() * 9000);
    const tokenStr = `COS-MED-${tokenNum}`;

    try {
      await fetch(`${API_BASE_URL}/api/v1/marketplace/inquiries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          inquiry_type: "medicine",
          patient_name: patientName,
          patient_phone: patientPhone || "+919876543200",
          locality: patientAddress,
          target_entity_name: selectedPharmacy.name,
          target_entity_phone: selectedPharmacy.phone,
          items: cartItems.map((i) => ({
            name: i.med.brand_name,
            qty: i.qty,
            form: i.med.dosage_form,
            price: i.med.direct_price
          })),
          prescription_preview: uploadedFileName || "Manual selection",
          notes: `Delivery mode: ${deliveryType}`,
          channel: "whatsapp"
        })
      });
    } catch {
      // Offline fallback
    }

    // Generate slip modal
    setIssuedSlip({
      token: tokenStr,
      date: new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }),
      pharmacy: selectedPharmacy,
      items: cartItems.map((i) => ({
        name: `${i.med.brand_name} ${i.med.strength}`,
        qty: i.qty,
        price: i.med.direct_price
      })),
      total: cartTotal
    });

    // Launch WhatsApp
    const encoded = encodeURIComponent(message);
    window.open(`https://wa.me/${selectedPharmacy.whatsapp}?text=${encoded}`, "_blank");
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
              className="rounded-full px-4 py-1.5 text-xs font-semibold bg-white text-[#1D1D1F] dark:bg-white/10 dark:text-white transition shadow-sm flex items-center gap-1.5"
            >
              <Pill className="h-3.5 w-3.5 text-[#0071E3]" />
              Buy Medicines
            </Link>
            <Link
              href="/lab-tests"
              className="rounded-full px-4 py-1.5 text-xs font-medium text-[#86868B] hover:text-[#1D1D1F] dark:text-[#8E8E93] dark:hover:text-white transition"
            >
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

      {/* 2. HERO SEARCH & ZERO COMMISSION BANNER */}
      <section className="relative overflow-hidden pt-10 pb-8 px-4 sm:px-6 lg:px-8 border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 rounded-full border border-[#0071E3]/20 bg-[#0071E3]/10 px-3.5 py-1 text-xs font-semibold text-[#0071E3] mb-3">
                <ShieldCheck className="h-3.5 w-3.5" />
                0% Commission • 100% Genuine Medicines • Direct Chemist Connect
              </div>
              <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-[#1D1D1F] dark:text-white">
                Buy Medicines from Verified Local Pharmacies
              </h1>
              <p className="mt-2 text-sm sm:text-base text-[#86868B] dark:text-[#8E8E93] max-w-2xl">
                Find medicines at nearby Dehradun chemist counters. Upload your doctor&apos;s prescription or search by brand name to connect directly via WhatsApp or phone for immediate 15-minute pickup or home delivery.
              </p>
            </div>

            {/* Quick Upload Rx Card */}
            <div className="flex flex-col sm:flex-row items-stretch gap-3 bg-white/70 dark:bg-white/[0.05] p-4 rounded-2xl border border-black/[0.06] dark:border-white/[0.08] shadow-sm backdrop-blur-md">
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                accept="image/*,.pdf"
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center justify-center gap-2.5 px-5 py-3 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white font-semibold text-xs transition shadow-sm cursor-pointer"
              >
                <Upload className="h-4 w-4" />
                {isScanningRx ? "AI Scanning Prescription..." : "Upload Prescription (Rx)"}
              </button>
              <button
                onClick={toggleVoiceSearch}
                className={`flex items-center justify-center gap-2 px-4 py-3 rounded-xl border text-xs font-semibold transition ${
                  isListening
                    ? "border-red-500 bg-red-50 text-red-600 animate-pulse dark:bg-red-950/40"
                    : "border-black/[0.08] dark:border-white/[0.12] bg-black/[0.02] dark:bg-white/[0.04] text-[#1D1D1F] dark:text-white hover:bg-black/[0.05]"
                }`}
              >
                {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4 text-[#0071E3]" />}
                {isListening ? "Listening..." : "Speak Medicine"}
              </button>
            </div>
          </div>

          {/* Rx Scanning feedback badge */}
          {rxScanSuccess && uploadedFileName && (
            <div className="mt-4 p-3 rounded-xl bg-[#34C759]/10 border border-[#34C759]/30 text-[#34C759] text-xs font-medium flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 flex-shrink-0" />
                <span>
                  <strong>AI Scan Completed:</strong> Recognized prescription from <em>{uploadedFileName}</em>. 3 medicines added to your inquiry list!
                </span>
              </div>
              <button onClick={() => setRxScanSuccess(false)} className="text-[#34C759] hover:opacity-75">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Search Bar + Locality Filter Bar */}
          <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="md:col-span-2 relative">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#86868B]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search medicine brand (e.g. Augmentin, Dolo 650, Pan-40, Acretin) or generic salt..."
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

            <div className="relative">
              <MapPin className="absolute left-3.5 top-3.5 h-4 w-4 text-[#0071E3]" />
              <select
                value={selectedLocality}
                onChange={(e) => setSelectedLocality(e.target.value)}
                className="w-full pl-10 pr-8 py-3 rounded-xl bg-white dark:bg-[#1C1C1E] border border-black/[0.08] dark:border-white/[0.12] text-sm font-medium text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0071E3] appearance-none"
              >
                {localities.map((loc) => (
                  <option key={loc} value={loc}>
                    📍 {loc}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Category Pills */}
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

      {/* 3. MAIN CONTENT: MEDICINES CATALOG + PHARMACY DISPATCH DRAWER */}
      <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Medicines Catalog (8 Cols) */}
          <div className="lg:col-span-8 space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                <Pill className="h-5 w-5 text-[#0071E3]" />
                Available Medicines ({filteredMedicines.length})
              </h2>
              <span className="text-xs text-[#86868B] dark:text-[#8E8E93]">
                Showing approved Dehradun inventory
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {filteredMedicines.map((med) => {
                const inCart = cartItems.some((i) => i.med.id === med.id);
                return (
                  <div
                    key={med.id}
                    className="p-5 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm hover:shadow-md transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-black/[0.04] dark:bg-white/[0.08] text-[#86868B] dark:text-[#8E8E93] uppercase tracking-wider mb-1">
                            {med.category}
                          </span>
                          <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white leading-tight">
                            {med.brand_name}
                          </h3>
                          <p className="text-xs text-[#86868B] dark:text-[#8E8E93] font-mono mt-0.5">
                            {med.generic_name} • {med.strength}
                          </p>
                        </div>
                        {med.rx_required && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/10 text-amber-600 border border-amber-500/20 flex-shrink-0">
                            Rx Needed
                          </span>
                        )}
                      </div>

                      <div className="mt-3 text-xs text-[#515154] dark:text-[#A1A1A6] line-clamp-2">
                        {med.common_instructions}
                      </div>

                      <div className="mt-3 flex items-center gap-2 text-xs text-[#86868B] dark:text-[#8E8E93]">
                        <span>Pack: {med.pack_size}</span>
                        <span>•</span>
                        <span>Mfr: {med.manufacturer}</span>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
                      <div>
                        <span className="text-xs text-[#86868B] line-through mr-1.5">
                          ₹{med.mrp}
                        </span>
                        <span className="text-base font-bold text-[#1D1D1F] dark:text-white">
                          ₹{med.direct_price}
                        </span>
                        <span className="ml-1 text-[11px] font-semibold text-[#34C759]">
                          {med.discount_percent}% OFF
                        </span>
                      </div>

                      <button
                        onClick={() => addToCart(med)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1 ${
                          inCart
                            ? "bg-[#34C759] text-white"
                            : "bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-sm"
                        }`}
                      >
                        {inCart ? (
                          <>
                            <CheckCircle2 className="h-3.5 w-3.5" /> Added
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" /> Add to Order
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Right Column: Nearest Chemist & WhatsApp Bridge (4 Cols) */}
          <div className="lg:col-span-4 space-y-6">
            {/* Pharmacy Dispatch Card */}
            <div className="p-6 rounded-2xl bg-white dark:bg-[#1C1C1E] border border-black/[0.06] dark:border-white/[0.08] shadow-sm sticky top-24">
              <div className="flex items-center justify-between pb-3 border-b border-black/[0.06] dark:border-white/[0.08]">
                <h3 className="text-sm font-bold text-[#1D1D1F] dark:text-white flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-[#0071E3]" />
                  Select Fulfillment Chemist
                </h3>
                <span className="text-[11px] font-semibold text-[#34C759]">0% Commission</span>
              </div>

              {/* Chemist Selection Dropdown */}
              <div className="mt-4">
                <label className="text-xs font-semibold text-[#86868B] dark:text-[#8E8E93] block mb-1">
                  Nearest Verified Chemist in Dehradun:
                </label>
                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                  {filteredPharmacies.map((pharm) => {
                    const isSelected = selectedPharmacy.id === pharm.id;
                    return (
                      <div
                        key={pharm.id}
                        onClick={() => setSelectedPharmacy(pharm)}
                        className={`p-3 rounded-xl border text-xs cursor-pointer transition ${
                          isSelected
                            ? "border-[#0071E3] bg-[#0071E3]/5 dark:bg-[#0071E3]/10"
                            : "border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.02]"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#1D1D1F] dark:text-white">
                            {pharm.name}
                          </span>
                          {pharm.is_verified_partner && (
                            <BadgeCheck className="h-3.5 w-3.5 text-[#34C759]" />
                          )}
                        </div>
                        <p className="text-[#86868B] text-[11px] mt-0.5">
                          📍 {pharm.locality} ({pharm.distance_km} km away)
                        </p>
                        <div className="mt-1 flex items-center gap-2 text-[10px] text-[#515154] dark:text-[#A1A1A6]">
                          <span>⚡ {pharm.delivery_time_mins}</span>
                          <span>•</span>
                          <span>DL: {pharm.license_number}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Patient Details Form */}
              <div className="mt-5 pt-4 border-t border-black/[0.04] dark:border-white/[0.06] space-y-3">
                <h4 className="text-xs font-bold text-[#1D1D1F] dark:text-white uppercase tracking-wider">
                  Patient Delivery Details
                </h4>

                <div>
                  <label className="text-[11px] font-semibold text-[#86868B] block mb-1">
                    Patient Name *
                  </label>
                  <input
                    type="text"
                    value={patientName}
                    onChange={(e) => setPatientName(e.target.value)}
                    placeholder="e.g. Manas Uniyal"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.12] text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-semibold text-[#86868B] block mb-1">
                    WhatsApp Phone Number
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
                    Delivery Address / Landmark
                  </label>
                  <input
                    type="text"
                    value={patientAddress}
                    onChange={(e) => setPatientAddress(e.target.value)}
                    placeholder="Near Ashley Hall, Rajpur Road"
                    className="w-full px-3 py-2 text-xs rounded-lg bg-black/[0.02] dark:bg-white/[0.04] border border-black/[0.08] dark:border-white/[0.12] text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                  />
                </div>

                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setDeliveryType("delivery")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                      deliveryType === "delivery"
                        ? "bg-[#0071E3] text-white"
                        : "bg-black/[0.04] dark:bg-white/[0.06] text-[#86868B]"
                    }`}
                  >
                    🛵 Home Delivery
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeliveryType("pickup")}
                    className={`flex-1 py-1.5 rounded-lg text-xs font-semibold transition ${
                      deliveryType === "pickup"
                        ? "bg-[#0071E3] text-white"
                        : "bg-black/[0.04] dark:bg-white/[0.06] text-[#86868B]"
                    }`}
                  >
                    🏪 Counter Pickup
                  </button>
                </div>
              </div>

              {/* Order Cart Review */}
              <div className="mt-5 pt-4 border-t border-black/[0.04] dark:border-white/[0.06]">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                    Selected Items ({cartItems.length})
                  </span>
                  <span className="text-xs font-bold text-[#0071E3]">
                    Est. Total: ₹{cartTotal}
                  </span>
                </div>

                {cartItems.length === 0 && !uploadedFileName ? (
                  <p className="text-xs text-[#86868B] py-2 italic text-center">
                    No medicines selected. Add items from the catalog or upload prescription above.
                  </p>
                ) : (
                  <div className="space-y-1.5 max-h-32 overflow-y-auto mb-3">
                    {cartItems.map((item) => (
                      <div
                        key={item.med.id}
                        className="flex items-center justify-between text-xs py-1 border-b border-black/[0.02]"
                      >
                        <span className="text-[#1D1D1F] dark:text-white font-medium truncate max-w-[170px]">
                          {item.med.brand_name} x {item.qty}
                        </span>
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[#1D1D1F] dark:text-white">
                            ₹{item.med.direct_price * item.qty}
                          </span>
                          <button
                            onClick={() => removeFromCart(item.med.id)}
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                    {uploadedFileName && (
                      <div className="flex items-center justify-between text-xs py-1 text-emerald-600 font-medium">
                        <span>📎 {uploadedFileName}</span>
                        <span>Prescription</span>
                      </div>
                    )}
                  </div>
                )}

                {/* Primary Action: Direct WhatsApp Dispatch with Trojan Horse Partner Invite */}
                <button
                  onClick={handleSendWhatsApp}
                  disabled={cartItems.length === 0 && !uploadedFileName}
                  className="w-full mt-2 py-3 rounded-xl bg-[#25D366] hover:bg-[#20bd5a] disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs font-bold transition shadow-sm flex items-center justify-center gap-2"
                >
                  <MessageSquare className="h-4 w-4" />
                  Order on WhatsApp (0% Fee)
                </button>

                {/* Secondary: Direct Call */}
                <a
                  href={`tel:${selectedPharmacy.phone}`}
                  className="w-full mt-2 py-2.5 rounded-xl border border-black/[0.08] dark:border-white/[0.12] hover:bg-black/[0.02] dark:hover:bg-white/[0.04] text-xs font-semibold text-[#1D1D1F] dark:text-white transition flex items-center justify-center gap-2"
                >
                  <Phone className="h-3.5 w-3.5 text-[#0071E3]" />
                  Call Pharmacist ({selectedPharmacy.pharmacist_name})
                </a>

                {/* Partner Invitation Note */}
                <div className="mt-4 p-3 rounded-xl bg-[#F5F5F7] dark:bg-white/[0.04] border border-black/[0.04] dark:border-white/[0.06] text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  <p>
                    💡 <strong>How it works:</strong> You connect directly with the licensed pharmacy. No commission is charged to you or the chemist. Pay directly to the pharmacy upon delivery or pickup.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* 4. DIGITAL CLINICOS PATIENT SLIP / VOUCHER MODAL */}
      {issuedSlip && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="bg-white dark:bg-[#1C1C1E] max-w-md w-full rounded-2xl shadow-2xl border border-black/[0.08] dark:border-white/[0.12] overflow-hidden">
            <div className="p-4 bg-[#0071E3] text-white flex items-center justify-between">
              <div className="flex items-center gap-2">
                <BadgeCheck className="h-5 w-5" />
                <span className="font-bold text-sm">ClinicOS Patient Order Slip</span>
              </div>
              <button onClick={() => setIssuedSlip(null)} className="text-white/80 hover:text-white">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              <div className="flex items-center justify-between border-b pb-3 border-black/[0.06] dark:border-white/[0.08]">
                <div>
                  <span className="text-[10px] text-[#86868B] uppercase tracking-wider block">
                    Order Slip Token
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
                  Destination Pharmacy:
                </span>
                <p className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                  {issuedSlip.pharmacy.name}
                </p>
                <p className="text-xs text-[#86868B]">
                  {issuedSlip.pharmacy.address} • DL: {issuedSlip.pharmacy.license_number}
                </p>
              </div>

              <div className="border rounded-xl p-3 bg-black/[0.02] dark:bg-white/[0.02] border-black/[0.06] dark:border-white/[0.08]">
                <span className="text-[11px] font-bold text-[#86868B] block mb-2 uppercase">
                  Medicine Checklist
                </span>
                <div className="space-y-1 text-xs">
                  {issuedSlip.items.map((i, idx) => (
                    <div key={idx} className="flex justify-between">
                      <span>{i.name} (x{i.qty})</span>
                      <span className="font-semibold">₹{i.price * i.qty}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-2 pt-2 border-t flex justify-between font-bold text-xs">
                  <span>Estimated Total</span>
                  <span className="text-[#0071E3]">₹{issuedSlip.total}</span>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-[11px] text-amber-700 dark:text-amber-400">
                ⭐ <strong>Over-the-Counter Instructions:</strong> Show this slip at the counter or via WhatsApp for priority preparation and zero service charge.
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex-1 py-2 rounded-xl border border-black/[0.08] dark:border-white/[0.12] text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-black/[0.02]"
                >
                  <Printer className="h-3.5 w-3.5" /> Print Slip
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
