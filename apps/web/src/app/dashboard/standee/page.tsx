"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { 
  Printer, 
  Download, 
  Share2, 
  Sparkles, 
  ArrowLeft, 
  CheckCircle2, 
  Sliders, 
  Wifi, 
  QrCode as QrCodeIcon, 
  Star, 
  Clock, 
  Phone, 
  Building2, 
  Stethoscope, 
  ShieldCheck, 
  Copy, 
  Check, 
  Palette, 
  Maximize2,
  FileText
} from "lucide-react";
import QRCodeDisplay from "@/components/QRCodeDisplay";

type StandeePurpose = "live_queue" | "express_booking" | "google_reviews" | "clinic_wifi" | "custom_url";
type PaperFormat = "a5_tent" | "a4_poster" | "compact_4x6";
type VisualTheme = "sapphire" | "emerald" | "obsidian" | "laser_mono";

export default function StandeeGeneratorPage() {
  // Config state
  const [purpose, setPurpose] = useState<StandeePurpose>("live_queue");
  const [paperFormat, setPaperFormat] = useState<PaperFormat>("a5_tent");
  const [theme, setTheme] = useState<VisualTheme>("sapphire");
  const [showFoldGuides, setShowFoldGuides] = useState<boolean>(true);
  const [isBilingual, setIsBilingual] = useState<boolean>(true);
  const [copiedLink, setCopiedLink] = useState<boolean>(false);

  // Clinic Editable Info
  const [clinicName, setClinicName] = useState("Derma Care Skin & Laser Centre");
  const [tagline, setTagline] = useState("Advanced Clinical Dermatology & Laser Surgery");
  const [doctorName, setDoctorName] = useState("Dr. Rahul Sharma");
  const [doctorDegrees, setDoctorDegrees] = useState("MBBS, MD (Dermatology) • Reg. UKMC-8942");
  const [helpline, setHelpline] = useState("+91 98765 43210");
  const [opdTimings, setOpdTimings] = useState("Morning: 10:00 AM - 01:30 PM | Evening: 05:00 PM - 08:30 PM");
  
  // Wi-Fi Config
  const [wifiSsid, setWifiSsid] = useState("DermaCare_Guest");
  const [wifiPassword, setWifiPassword] = useState("CareClinic2026");

  // Custom Link
  const [customLink, setCustomLink] = useState("https://clinicos.in/p/derma-care");

  // Compute QR Destination URL & Content based on purpose
  const { qrValue, headerTitle, headerHindi, instructionText, instructionHindi, badgeText } = useMemo(() => {
    const origin = typeof window !== "undefined" ? window.location.origin : "https://clinicos.in";

    switch (purpose) {
      case "live_queue":
        return {
          qrValue: `${origin}/waiting-room?clinic=derma-care`,
          headerTitle: "Scan to Track Your Token",
          headerHindi: "अपने मोबाइल पर लाइव टोकन देखें",
          instructionText: "Scan with your phone camera to watch live queue progression. You can relax in your car or a nearby cafe without missing your turn!",
          instructionHindi: "कैमरे से स्कैन करें और बाहर या गाड़ी में आराम से प्रतीक्षा करें। आपकी बारी आने पर सतर्क रहें।",
          badgeText: "ZERO APP DOWNLOAD"
        };
      case "express_booking":
        return {
          qrValue: `${origin}/book?clinic=derma-care`,
          headerTitle: "Skip Front Desk Line & Book Token",
          headerHindi: "बिना लाइन में लगे तुरंत डिजिटल टोकन लें",
          instructionText: "Scan to reserve an immediate priority walk-in consultation token directly on your phone in under 15 seconds.",
          instructionHindi: "15 सेकंड में अपना ओपीडी टोकन बुक करें और लाइन से बचें।",
          badgeText: "INSTANT WALK-IN"
        };
      case "google_reviews":
        return {
          qrValue: "https://g.page/r/derma-care-dehradun/review",
          headerTitle: "How was your Consultation?",
          headerHindi: "डॉक्टर के साथ आपका अनुभव कैसा रहा?",
          instructionText: "Help patients like you discover compassionate clinical care. Take 15 seconds to leave Dr. Rahul Sharma a verified Google review!",
          instructionHindi: "कृपया गूगल पर अपना बहुमूल्य अनुभव साझा करें और 5-स्टार रेटिंग दें।",
          badgeText: "VERIFIED PATIENT REVIEW"
        };
      case "clinic_wifi":
        return {
          qrValue: `WIFI:T:WPA;S:${wifiSsid};P:${wifiPassword};;`,
          headerTitle: "High-Speed Clinic Guest Wi-Fi",
          headerHindi: "मुफ्त क्लिनिक वाई-फाई से जुड़ें",
          instructionText: `Scan with your camera to instantly connect to "${wifiSsid}" without typing the password manually!`,
          instructionHindi: "कैमरा खोलकर स्कैन करें और पासवर्ड टाइप किए बिना तुरंत वाई-फाई से कनेक्ट हों।",
          badgeText: "HIGH SPEED WI-FI"
        };
      case "custom_url":
      default:
        return {
          qrValue: customLink || "https://clinicos.in",
          headerTitle: "Official Digital Clinic Portal",
          headerHindi: "डिजिटल क्लिनिक स्वास्थ्य पोर्टल",
          instructionText: "Scan with your phone to access prescriptions, book appointments, and view verified doctor credentials.",
          instructionHindi: "डिजिटल पर्चे देखने और अपॉइंटमेंट के लिए स्कैन करें।",
          badgeText: "OFFICIAL CLINIC QR"
        };
    }
  }, [purpose, wifiSsid, wifiPassword, customLink]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(qrValue);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 2500);
  };

  const handlePrint = () => {
    window.print();
  };

  // Visual Theme styling rules
  const themeStyles = useMemo(() => {
    switch (theme) {
      case "sapphire":
        return {
          cardBg: "bg-gradient-to-b from-blue-50/50 via-white to-sky-50/30",
          border: "border-blue-600/30",
          headerBg: "bg-gradient-to-r from-[#0071E3] to-[#005bb5]",
          headerText: "text-white",
          accentColor: "#0071E3",
          badgeBg: "bg-[#0071E3]/10 text-[#0071E3] border-[#0071E3]/20",
          footerBg: "bg-slate-900 text-white",
          qrBorder: "border-blue-500/30 shadow-blue-500/10"
        };
      case "emerald":
        return {
          cardBg: "bg-gradient-to-b from-emerald-50/50 via-white to-teal-50/30",
          border: "border-emerald-600/30",
          headerBg: "bg-gradient-to-r from-emerald-700 to-teal-800",
          headerText: "text-white",
          accentColor: "#059669",
          badgeBg: "bg-emerald-600/10 text-emerald-700 border-emerald-600/20",
          footerBg: "bg-emerald-950 text-white",
          qrBorder: "border-emerald-500/30 shadow-emerald-500/10"
        };
      case "obsidian":
        return {
          cardBg: "bg-gradient-to-b from-[#18181B] via-[#101014] to-[#0A0A0C]",
          border: "border-amber-500/30",
          headerBg: "bg-gradient-to-r from-[#27272A] to-[#18181B]",
          headerText: "text-amber-300",
          accentColor: "#F59E0B",
          badgeBg: "bg-amber-500/15 text-amber-300 border-amber-500/30",
          footerBg: "bg-black text-slate-300 border-t border-white/10",
          qrBorder: "border-amber-500/40 shadow-amber-500/20",
          textColor: "text-white",
          subTextColor: "text-slate-300"
        };
      case "laser_mono":
      default:
        return {
          cardBg: "bg-white",
          border: "border-black",
          headerBg: "bg-black",
          headerText: "text-white",
          accentColor: "#000000",
          badgeBg: "bg-black/5 text-black border-black/20",
          footerBg: "bg-black text-white",
          qrBorder: "border-black shadow-none",
          laserPrintMode: true
        };
    }
  }, [theme]);

  // Dimension scaling for the preview & print
  const formatDimensions = useMemo(() => {
    switch (paperFormat) {
      case "a4_poster":
        return "w-full max-w-[560px] min-h-[790px]";
      case "compact_4x6":
        return "w-full max-w-[420px] min-h-[600px]";
      case "a5_tent":
      default:
        return "w-full max-w-[480px] min-h-[680px]";
    }
  }, [paperFormat]);

  return (
    <div className="min-h-screen bg-[#ECEEF2] dark:bg-[#000000] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col">
      {/* 1. TOP BAR (HIDDEN IN PRINT) */}
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-[#ECEEF2]/80 backdrop-blur-2xl dark:border-white/[0.08] dark:bg-[#000000]/80 print:hidden">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
          <div className="flex items-center gap-3">
            <Link
              href="/dashboard/desk"
              className="inline-flex items-center gap-1.5 rounded-full p-2 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition"
            >
              <ArrowLeft className="h-4 w-4" />
              <span className="text-xs font-semibold">Front Desk</span>
            </Link>
            <div className="h-4 w-[1px] bg-black/10 dark:bg-white/10" />
            <div className="flex items-center gap-2">
              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0071E3] text-white">
                <QrCodeIcon className="h-4 w-4" />
              </span>
              <div>
                <h1 className="text-sm font-bold text-[#1D1D1F] dark:text-white">
                  Front Desk Acrylic Standee Studio
                </h1>
                <p className="text-[10px] text-[#86868B]">
                  Printable Tabletop Tent Cards & Lounge Posters for Clinics
                </p>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleCopyLink}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] px-3.5 py-1.5 text-xs font-semibold text-[#1D1D1F] dark:text-white shadow-apple-sm hover:bg-black/[0.02] transition active:scale-95"
            >
              {copiedLink ? (
                <>
                  <Check className="h-3.5 w-3.5 text-emerald-600" />
                  <span className="text-emerald-600">Copied QR URL!</span>
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 text-[#86868B]" />
                  <span>Copy QR Link</span>
                </>
              )}
            </button>

            <button
              onClick={handlePrint}
              className="inline-flex items-center gap-2 rounded-full bg-[#0071E3] hover:bg-[#0077ED] px-5 py-2 text-xs font-bold text-white shadow-apple-sm active:scale-95 transition"
            >
              <Printer className="h-3.5 w-3.5" />
              <span>Print Acrylic Standee</span>
            </button>
          </div>
        </div>
      </header>

      {/* 2. MAIN LAYOUT: CONTROLS (LEFT) + LIVE STAND SHEET (RIGHT) */}
      <div className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 grid grid-cols-1 lg:grid-cols-12 gap-6 print:p-0 print:m-0 print:block">
        
        {/* LEFT COLUMN: CUSTOMIZATION CONTROLS (HIDDEN IN PRINT) */}
        <aside className="lg:col-span-5 space-y-5 print:hidden">
          
          {/* Card 1: Purpose Selection */}
          <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-5 shadow-apple-card space-y-3">
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#86868B] flex items-center gap-1.5">
                <QrCodeIcon className="h-3.5 w-3.5 text-[#0071E3]" />
                <span>1. Standee Purpose & Action</span>
              </span>
              <span className="rounded-full bg-[#0071E3]/10 text-[#0071E3] text-[10px] font-bold px-2 py-0.5">
                Target Action
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              {[
                { id: "live_queue", title: "Live Token Queue", desc: "Wait in car/cafe", icon: Clock },
                { id: "express_booking", title: "Express Walk-in", desc: "Skip reception line", icon: Sparkles },
                { id: "google_reviews", title: "Google Review", desc: "5-Star rating booster", icon: Star },
                { id: "clinic_wifi", title: "Clinic Wi-Fi", desc: "1-Tap instant join", icon: Wifi },
              ].map((p) => {
                const IconComponent = p.icon;
                const isSelected = purpose === p.id;
                return (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => setPurpose(p.id as StandeePurpose)}
                    className={`rounded-2xl p-3 text-left border transition-all ${
                      isSelected
                        ? "border-[#0071E3] bg-[#0071E3]/[0.06] dark:bg-[#0071E3]/20 shadow-sm"
                        : "border-black/[0.06] dark:border-white/[0.08] bg-[#ECEEF2]/40 dark:bg-white/[0.02] hover:border-black/20"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <IconComponent className={`h-4 w-4 ${isSelected ? "text-[#0071E3]" : "text-[#86868B]"}`} />
                      {isSelected && <span className="h-2 w-2 rounded-full bg-[#0071E3]" />}
                    </div>
                    <div className="text-xs font-bold text-[#1D1D1F] dark:text-white mt-1.5">
                      {p.title}
                    </div>
                    <div className="text-[10px] text-[#86868B] mt-0.5">
                      {p.desc}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Special Wi-Fi Fields */}
            {purpose === "clinic_wifi" && (
              <div className="mt-3 rounded-2xl bg-[#ECEEF2]/60 dark:bg-white/[0.04] p-3 space-y-2 border border-black/[0.04] dark:border-white/[0.06] animate-in fade-in duration-150">
                <div className="text-[11px] font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                  <Wifi className="h-3.5 w-3.5 text-[#0071E3]" />
                  <span>Wi-Fi Network Credentials (Auto-joins phone):</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="text-[10px] text-[#86868B] block">Network (SSID)</label>
                    <input
                      type="text"
                      value={wifiSsid}
                      onChange={(e) => setWifiSsid(e.target.value)}
                      className="w-full mt-1 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] text-[#86868B] block">Wi-Fi Password</label>
                    <input
                      type="text"
                      value={wifiPassword}
                      onChange={(e) => setWifiPassword(e.target.value)}
                      className="w-full mt-1 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] p-2 text-xs font-semibold font-mono focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                    />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Card 2: Paper Format & Theme */}
          <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-5 shadow-apple-card space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#86868B] flex items-center gap-1.5">
                <Palette className="h-3.5 w-3.5 text-[#0071E3]" />
                <span>2. Format & Aesthetics</span>
              </span>
              <span className="text-[10px] text-[#86868B] font-medium">
                Acrylic Stand Standards
              </span>
            </div>

            {/* Paper Size selector */}
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white block mb-1.5">
                Physical Print Dimension:
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "a5_tent", title: "A5 Tent Card", sub: "148 × 210 mm" },
                  { id: "a4_poster", title: "A4 Poster", sub: "210 × 297 mm" },
                  { id: "compact_4x6", title: "4×6\" Card", sub: "102 × 152 mm" },
                ].map((f) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setPaperFormat(f.id as PaperFormat)}
                    className={`rounded-xl p-2.5 text-center border transition ${
                      paperFormat === f.id
                        ? "border-[#0071E3] bg-[#0071E3]/10 text-[#0071E3] font-bold"
                        : "border-black/[0.06] dark:border-white/[0.08] bg-[#ECEEF2]/40 dark:bg-white/[0.02] text-[#86868B]"
                    }`}
                  >
                    <div className="text-xs">{f.title}</div>
                    <div className="text-[9px] mt-0.5 opacity-80">{f.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Visual Theme selector */}
            <div>
              <label className="text-xs font-semibold text-[#1D1D1F] dark:text-white block mb-1.5">
                Visual Theme & Ink Profile:
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "sapphire", label: "Sapphire", color: "bg-blue-600" },
                  { id: "emerald", label: "Emerald", color: "bg-emerald-600" },
                  { id: "obsidian", label: "Obsidian", color: "bg-slate-900" },
                  { id: "laser_mono", label: "Eco Mono", color: "bg-black" },
                ].map((t) => (
                  <button
                    key={t.id}
                    type="button"
                    onClick={() => setTheme(t.id as VisualTheme)}
                    className={`rounded-xl p-2 flex items-center gap-2 border transition ${
                      theme === t.id
                        ? "border-[#0071E3] bg-[#0071E3]/5 font-bold text-[#1D1D1F] dark:text-white"
                        : "border-black/[0.06] dark:border-white/[0.08] text-[#86868B]"
                    }`}
                  >
                    <span className={`h-3.5 w-3.5 rounded-full ${t.color}`} />
                    <span className="text-[11px]">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Toggles */}
            <div className="flex items-center justify-between pt-2 border-t border-black/[0.04] dark:border-white/[0.06] text-xs">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isBilingual}
                  onChange={(e) => setIsBilingual(e.target.checked)}
                  className="rounded border-gray-300 text-[#0071E3] focus:ring-[#0071E3]"
                />
                <span className="text-[#1D1D1F] dark:text-white font-medium">Bilingual Instructions (English + Hindi)</span>
              </label>

              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={showFoldGuides}
                  onChange={(e) => setShowFoldGuides(e.target.checked)}
                  className="rounded border-gray-300 text-[#0071E3] focus:ring-[#0071E3]"
                />
                <span className="text-[#1D1D1F] dark:text-white font-medium">Acrylic Trim / Fold Marks</span>
              </label>
            </div>
          </div>

          {/* Card 3: Clinic Information Editor */}
          <div className="rounded-[24px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-5 shadow-apple-card space-y-3">
            <div className="flex items-center justify-between border-b border-black/[0.04] dark:border-white/[0.06] pb-3">
              <span className="text-xs font-bold uppercase tracking-wider text-[#86868B] flex items-center gap-1.5">
                <Building2 className="h-3.5 w-3.5 text-[#0071E3]" />
                <span>3. Clinic Details on Standee</span>
              </span>
            </div>

            <div className="space-y-2.5 text-xs">
              <div>
                <label className="text-[11px] font-semibold text-[#86868B] block">Clinic Name</label>
                <input
                  type="text"
                  value={clinicName}
                  onChange={(e) => setClinicName(e.target.value)}
                  className="w-full mt-1 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] p-2 text-xs font-bold focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#86868B] block">Doctor Name & Qualifications</label>
                <div className="grid grid-cols-2 gap-2 mt-1">
                  <input
                    type="text"
                    value={doctorName}
                    onChange={(e) => setDoctorName(e.target.value)}
                    placeholder="Doctor Name"
                    className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                  />
                  <input
                    type="text"
                    value={doctorDegrees}
                    onChange={(e) => setDoctorDegrees(e.target.value)}
                    placeholder="MBBS, MD..."
                    className="rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#86868B] block">Reception Helpline</label>
                  <input
                    type="text"
                    value={helpline}
                    onChange={(e) => setHelpline(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-[#86868B] block">OPD Working Timings</label>
                  <input
                    type="text"
                    value={opdTimings}
                    onChange={(e) => setOpdTimings(e.target.value)}
                    className="w-full mt-1 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] p-2 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
                  />
                </div>
              </div>
            </div>
          </div>
        </aside>

        {/* RIGHT COLUMN: 1:1 REAL-TIME PRINTABLE STANDEE CANVAS */}
        <main className="lg:col-span-7 flex flex-col items-center justify-start print:p-0 print:m-0 print:w-full">
          
          {/* Printable Sheet Wrapper */}
          <div className="relative flex flex-col items-center w-full">
            
            {/* Guide markers reminder (hidden in print) */}
            <div className="w-full flex items-center justify-between px-2 mb-3 text-xs text-[#86868B] print:hidden">
              <span className="flex items-center gap-1.5 font-medium">
                <Maximize2 className="h-3.5 w-3.5 text-[#0071E3]" />
                <span>Live Canvas & Print Preview &bull; {paperFormat === "a5_tent" ? "A5 Acrylic Tent Card" : paperFormat === "a4_poster" ? "A4 Clinic Wall Poster" : "4x6 Inch Counter Badge"}</span>
              </span>
              <span className="font-mono text-[11px]">300 DPI Vector SVG</span>
            </div>

            {/* THE PHYSICAL PRINTABLE SHEET */}
            <div 
              id="standee-print-sheet"
              className={`relative overflow-hidden rounded-[28px] border-2 ${themeStyles.border} ${themeStyles.cardBg} ${formatDimensions} p-6 sm:p-8 shadow-apple-card flex flex-col justify-between transition-all duration-200 print:rounded-none print:border-none print:shadow-none print:p-6 print:m-0 print:w-full print:max-w-none`}
            >
              {/* Optional Acrylic Trim / Fold Line Markers */}
              {showFoldGuides && (
                <div className="absolute inset-0 pointer-events-none border border-dashed border-black/10 dark:border-white/10 m-2 rounded-[22px] print:border-gray-300">
                  <span className="absolute top-1 left-2 text-[8px] font-mono text-black/30 dark:text-white/30 uppercase tracking-widest print:text-gray-400">
                    Acrylic Stand Insert Margin
                  </span>
                </div>
              )}

              {/* SECTION A: TOP CLINIC BRANDING HEADER */}
              <div className="text-center space-y-1.5 border-b border-black/[0.08] dark:border-white/[0.08] pb-4">
                <div className="inline-flex items-center justify-center gap-2">
                  <div className={`flex h-9 w-9 items-center justify-center rounded-xl ${themeStyles.headerBg} ${themeStyles.headerText} shadow-sm`}>
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <h2 className="text-xl sm:text-2xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
                    {clinicName}
                  </h2>
                </div>

                <div className="text-xs font-semibold text-[#0071E3] tracking-wide">
                  {tagline}
                </div>

                <div className="pt-1 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 text-xs text-[#86868B] font-medium">
                  <span className="font-bold text-[#1D1D1F] dark:text-white">{doctorName}</span>
                  <span>&bull;</span>
                  <span>{doctorDegrees}</span>
                </div>
              </div>

              {/* SECTION B: CENTRAL CALL-TO-ACTION & HERO QR CODE */}
              <div className="my-auto py-5 flex flex-col items-center text-center space-y-3.5">
                
                {/* Badge Chip */}
                <div className={`inline-flex items-center gap-1.5 rounded-full px-3.5 py-1 text-[11px] font-black uppercase tracking-wider border ${themeStyles.badgeBg}`}>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{badgeText}</span>
                </div>

                {/* Primary CTA Title */}
                <div>
                  <h3 className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white tracking-tight">
                    {headerTitle}
                  </h3>
                  {isBilingual && (
                    <div className="text-sm font-bold text-slate-600 dark:text-slate-300 mt-0.5">
                      {headerHindi}
                    </div>
                  )}
                </div>

                {/* HIGH RESOLUTION VECTOR QR CODE */}
                <div className={`p-3 rounded-2xl bg-white border-2 ${themeStyles.qrBorder} shadow-lg print:border-black print:shadow-none`}>
                  <QRCodeDisplay
                    value={qrValue}
                    size={210}
                    level="H"
                    fgColor="#000000"
                    bgColor="#FFFFFF"
                    centerBadgeText="ClinicOS"
                  />
                </div>

                {/* Camera Scan Prompt Box */}
                <div className="rounded-xl bg-black/[0.03] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] p-3 max-w-sm text-center print:border-gray-300">
                  <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-[#1D1D1F] dark:text-white">
                    <span>📱 Point Phone Camera to Scan</span>
                  </div>
                  <p className="text-[11px] text-[#86868B] dark:text-[#A1A1A6] mt-1 leading-snug">
                    {instructionText}
                  </p>
                  {isBilingual && (
                    <p className="text-[10px] text-[#86868B] dark:text-[#A1A1A6] mt-0.5 leading-snug">
                      {instructionHindi}
                    </p>
                  )}
                </div>
              </div>

              {/* SECTION C: RECEPTION DESK FOOTER & TIMINGS */}
              <div className={`rounded-2xl ${themeStyles.footerBg} p-3.5 sm:p-4 text-xs flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left print:bg-black print:text-white`}>
                <div className="space-y-0.5">
                  <div className="flex items-center justify-center sm:justify-start gap-1.5 font-bold">
                    <Phone className="h-3.5 w-3.5 text-emerald-400" />
                    <span>Desk Helpline: {helpline}</span>
                  </div>
                  <div className="text-[10px] text-slate-300">
                    {opdTimings}
                  </div>
                </div>

                <div className="text-right">
                  <span className="inline-flex items-center gap-1 rounded-full bg-white/10 px-2.5 py-0.5 text-[9px] font-mono uppercase tracking-widest text-slate-200">
                    <ShieldCheck className="h-3 w-3 text-emerald-400" />
                    <span>NMC Verified &bull; ClinicOS</span>
                  </span>
                </div>
              </div>
            </div>

            {/* Quick Actions Footer Underneath Card (Hidden in Print) */}
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 print:hidden">
              <button
                onClick={handlePrint}
                className="inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] dark:bg-white text-white dark:text-[#1D1D1F] px-6 py-2.5 text-xs font-bold shadow-apple-sm hover:opacity-90 active:scale-95 transition"
              >
                <Printer className="h-4 w-4" />
                <span>Print Standee (A5 / A4)</span>
              </button>

              <button
                onClick={handleCopyLink}
                className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] px-4 py-2.5 text-xs font-semibold text-[#1D1D1F] dark:text-white shadow-apple-sm hover:bg-black/[0.02] active:scale-95 transition"
              >
                <Share2 className="h-3.5 w-3.5 text-[#0071E3]" />
                <span>Share QR Link</span>
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* PRINT CSS OVERRIDES TO ENSURE CLEAN 300-DPI STANDEE PRINT */}
      <style jsx global>{`
        @media print {
          body {
            background-color: #ffffff !important;
            color: #000000 !important;
            margin: 0 !important;
            padding: 0 !important;
          }
          header, aside, button, nav, .print\\:hidden {
            display: none !important;
          }
          #standee-print-sheet {
            page-break-inside: avoid;
            box-shadow: none !important;
            border: 2px solid #000000 !important;
            width: 100% !important;
            max-width: 148mm !important;
            margin: 0 auto !important;
            padding: 12mm 10mm !important;
          }
          @page {
            size: portrait;
            margin: 10mm;
          }
        }
      `}</style>
    </div>
  );
}
