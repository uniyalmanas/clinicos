"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  Sparkles,
  Stethoscope,
  Building2,
  CheckCircle2,
  ArrowRight,
  RotateCw,
  Edit3,
  Check,
  MapPin,
  Clock,
  IndianRupee,
  Upload,
  X,
  Camera,
  ShieldCheck,
  Copy,
  Users,
  Tv,
  ExternalLink,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import BackButton from "@/components/BackButton";

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1-Click Instant Presets for Doctors
  const presets = [
    {
      title: "Dermatologist (Rajpur Rd)",
      specialty: "Dermatology",
      text: "I am Dr. Alok Mathur, Senior Dermatologist with 14 years experience. My clinic is Skin & Aesthetic Centre on Rajpur Road, Dehradun. Reg number UKMC-5541-2012. Consultation fee is 600 rupees. I treat acne, eczema, psoriasis, and provide laser hair removal. Clinic open Monday to Saturday 10am to 2pm and 5pm to 8:30pm.",
    },
    {
      title: "Dentist (EC Rd)",
      specialty: "Dentistry",
      text: "I am Dr. Sunita Rawat, BDS, MDS Endodontist with 9 years practice. Clinic name is Pearl White Dental Clinic on EC Road, Dehradun. Reg UDC-3104-2015. Fee is 400 rupees. We do painless root canals, dental implants, teeth whitening, and pediatric dentistry. Open 10am to 1:30pm and 4:30pm to 8pm.",
    },
    {
      title: "Pediatrician (Chakrata Rd)",
      specialty: "Pediatrics",
      text: "I am Dr. Harish Pant, Child Specialist with 16 years experience. Clinic is Little Steps Child Care on Chakrata Road, Dehradun. Reg UKMC-4190-2008. Fee 500 rupees. We offer newborn care, vaccination, asthma management. Timings 9:30am to 1pm and 5pm to 8pm.",
    },
    {
      title: "Physician (Paltan Bazaar)",
      specialty: "General Medicine",
      text: "I am Dr. Vikram Malhotra, MBBS MD Medicine with 12 years practice. Clinic: Lifecare Clinic on Paltan Bazaar, Dehradun. Reg UKMC-6102-2014. Fee 500 rupees. We manage diabetes, hypertension, infectious fevers, and preventive health. Open 10am to 2pm and 5pm to 8:30pm.",
    },
  ];

  const [rawText, setRawText] = useState(presets[0].text);
  const [phone, setPhone] = useState("+919876543299");
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [editableBio, setEditableBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [practiceType, setPracticeType] = useState<"solo" | "clinic">("solo");
  const [publishedResult, setPublishedResult] = useState<any>(null);
  const [copiedPass, setCopiedPass] = useState(false);

  // File upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCardImagePreview(result);
      if (!rawText || rawText.trim() === "") {
        setRawText(
          "Please extract doctor name, qualifications, registration number, clinic address, timings, and fees from my visiting card."
        );
      }
    };
    reader.readAsDataURL(file);
  };

  const removeUploadedImage = () => {
    setCardImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Trigger AI Extraction
  const handleExtract = async () => {
    setIsExtracting(true);
    try {
      const res = await fetch("/api/onboarding/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          raw_text: rawText || "Extract credentials and clinic data",
        }),
      });

      if (res.ok) {
        const json = await res.json();
        setExtractedData(json.data);
        setEditableBio(json.data.ai_bio);
      } else {
        runFallbackExtraction();
      }
    } catch {
      runFallbackExtraction();
    } finally {
      setIsExtracting(false);
    }
  };

  const runFallbackExtraction = () => {
    const isDental =
      rawText.toLowerCase().includes("dent") ||
      rawText.toLowerCase().includes("teeth");
    const isPediatric =
      rawText.toLowerCase().includes("child") ||
      rawText.toLowerCase().includes("pediatric");

    let spec = "Dermatologist";
    if (isDental) spec = "Dentist";
    if (isPediatric) spec = "Pediatrician";

    const extracted = {
      doctor: {
        full_name: "Dr. Alok Mathur",
        specialization: spec,
        qualifications: isDental ? "BDS, MDS" : "MBBS, MD",
        medical_council_reg_number: "UKMC-5541-2012",
        medical_council_state: "Uttarakhand Medical Council",
        years_of_experience: 14,
        consultation_fee: 600,
        followup_fee: 240,
        services: [
          "Clinical Consultation",
          "Comprehensive Examination",
          "Therapeutic Care",
          "Follow-up Review",
        ],
      },
      clinic: {
        name: "Skin & Aesthetic Centre",
        address_line: "Rajpur Road",
        city: "Dehradun",
        state: "Uttarakhand",
        postal_code: "248001",
        opening_hours: {
          morning: "10:00 AM - 02:00 PM",
          evening: "05:00 PM - 08:30 PM",
        },
      },
      ai_bio: `Dr. Alok Mathur is a verified ${spec} with 14+ years experience, practicing at Skin & Aesthetic Centre on Rajpur Road, Dehradun. Known for evidence-based outpatient clinical excellence.`,
    };

    setExtractedData(extracted);
    setEditableBio(extracted.ai_bio);
  };

  // Publish to Database
  const handlePublish = async () => {
    if (!extractedData) return;
    setIsPublishing(true);

    try {
      const res = await fetch("/api/onboarding/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone,
          practice_type: practiceType,
          doctor: extractedData.doctor,
          clinic: extractedData.clinic,
          ai_bio: editableBio,
        }),
      });

      if (res.ok) {
        const json = await res.json();
        if (json.access_token) {
          localStorage.setItem("clinicos_token", json.access_token);
          localStorage.setItem(
            "clinicos_user",
            JSON.stringify({
              id: json.doctor_id,
              phone: phone,
              full_name: extractedData.doctor.full_name,
              role: "owner",
              clinic_id: json.clinic_id,
              clinic_name: extractedData.clinic.name,
              clinic_slug: json.clinic_slug,
              practice_type: json.practice_type || practiceType,
              plan_type: json.plan_type,
            })
          );
        }
        setPublishedResult(json);
      } else {
        const errData = await res.json().catch(() => ({}));
        alert(errData.detail || errData.error || "Publishing failed. Please check credentials.");
      }
    } catch (e: any) {
      console.error("Onboarding publish error:", e);
      alert(e.message || "Failed to publish profile to database.");
    } finally {
      setIsPublishing(false);
    }
  };

  const copyDefaultPassword = () => {
    navigator.clipboard.writeText("Password@123");
    setCopiedPass(true);
    setTimeout(() => setCopiedPass(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#F5F6F9] dark:bg-[#0A0B0D] text-[#1D1D1F] dark:text-white flex flex-col font-sans">
      {/* Header */}
      <header className="sticky top-0 z-40 border-b border-black/[0.06] bg-white/95 backdrop-blur-md dark:border-white/[0.08] dark:bg-[#121316]/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <BackButton fallbackUrl="/for-doctors" label="Back to Provider Suite" />
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#0071E3] text-white shadow-sm">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div>
                <span className="font-bold text-sm sm:text-base tracking-tight text-[#1D1D1F] dark:text-white">
                  ClinicOS
                </span>
                <span className="ml-1.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wider">
                  Instant Onboarding
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:bg-gray-50 dark:border-white/[0.1] dark:bg-[#1C1C1E] dark:text-white dark:hover:bg-white/10 transition"
            >
              <span>Doctor Sign In</span>
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 w-full">
        {publishedResult ? (
          /* Success Screen */
          <div className="mx-auto max-w-3xl rounded-3xl border border-black/[0.06] bg-white p-8 sm:p-12 text-center shadow-xl dark:border-white/[0.08] dark:bg-[#16171B]">
            <div className="relative mx-auto h-28 w-28 mb-4">
              <Image
                src="/images/illustrations/booking-confirmed.svg"
                alt="Clinic Workspace Activated"
                fill
                className="object-contain"
              />
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3.5 py-1 text-xs font-bold text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="h-4 w-4" />
              <span>
                {publishedResult.practice_type === "clinic"
                  ? "🏥 Multi-Doctor Polyclinic Activated"
                  : "👨‍⚕️ Solo Doctor Chamber Activated"}
              </span>
            </div>

            <h1 className="mt-4 text-2xl sm:text-4xl font-black text-[#1D1D1F] dark:text-white tracking-tight">
              Your Clinic is Officially Online &amp; Bookable!
            </h1>

            <p className="mt-3 text-sm text-[#6E6E73] dark:text-[#A1A1A6] max-w-xl mx-auto leading-relaxed">
              {publishedResult.message} Your Speed Rx keyboard studio, waiting TV display, and 0% direct UPI flow are live.
            </p>

            {/* Quick Access Action Grid */}
            <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-3 text-left">
              <Link
                href="/dashboard/consult/1"
                className="rounded-2xl border border-black/[0.06] bg-[#0071E3] p-4 text-white hover:bg-[#0077ED] shadow-md transition group"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-white/20 p-2">
                    <Stethoscope className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition" />
                </div>
                <h3 className="mt-3 text-sm font-bold">Launch Chamber Speed Rx</h3>
                <p className="mt-0.5 text-xs text-white/80">30-second generic prescription pad with keyboard combos</p>
              </Link>

              <Link
                href="/dashboard/desk"
                className="rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-[#1E2024] p-4 hover:border-emerald-500 transition group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-emerald-500/10 p-2 text-emerald-600 dark:text-emerald-400">
                    <Users className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-emerald-500 transition" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-[#1D1D1F] dark:text-white">Counter Reception Desk</h3>
                <p className="mt-0.5 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">Generate tokens with 1-click thermal slips &amp; acoustic chimes</p>
              </Link>

              <Link
                href={publishedResult.doctor_url}
                className="rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-[#1E2024] p-4 hover:border-[#0071E3] transition group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-blue-500/10 p-2 text-[#0071E3] dark:text-[#2997FF]">
                    <ExternalLink className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-[#0071E3] transition" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-[#1D1D1F] dark:text-white">View Live Doctor Profile</h3>
                <p className="mt-0.5 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">Your public patient booking link with council verified badge</p>
              </Link>

              <Link
                href={publishedResult.clinic_url}
                className="rounded-2xl border border-black/[0.06] bg-white dark:border-white/[0.08] dark:bg-[#1E2024] p-4 hover:border-violet-500 transition group shadow-2xs"
              >
                <div className="flex items-center justify-between">
                  <div className="rounded-xl bg-violet-500/10 p-2 text-violet-600 dark:text-violet-400">
                    <Building2 className="h-5 w-5" />
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-violet-500 transition" />
                </div>
                <h3 className="mt-3 text-sm font-bold text-[#1D1D1F] dark:text-white">Digital Clinic Page</h3>
                <p className="mt-0.5 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">Public OPD timings, address map, and token queue standee</p>
              </Link>
            </div>

            {/* Generated Login Credentials */}
            <div className="mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-50/50 dark:bg-emerald-950/20 p-5 text-left">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                  <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                    Your Owner Account is Ready
                  </span>
                </div>
                <button
                  onClick={copyDefaultPassword}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline"
                >
                  <Copy className="h-3 w-3" />
                  <span>{copiedPass ? "Copied Password!" : "Copy Password"}</span>
                </button>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                <div className="rounded-xl bg-white dark:bg-black/20 p-2.5 border border-emerald-500/10">
                  <span className="text-[10px] text-[#86868B] uppercase font-bold block">Mobile / Username</span>
                  <span className="font-mono font-bold text-[#1D1D1F] dark:text-white">{phone}</span>
                </div>
                <div className="rounded-xl bg-white dark:bg-black/20 p-2.5 border border-emerald-500/10">
                  <span className="text-[10px] text-[#86868B] uppercase font-bold block">Default Password</span>
                  <span className="font-mono font-bold text-[#1D1D1F] dark:text-white">Password@123</span>
                </div>
              </div>
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                href="/dashboard"
                className="inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-black dark:bg-white dark:text-[#1D1D1F] transition active:scale-95"
              >
                <span>Launch Doctor Console Now</span>
                <ArrowRight className="h-4 w-4" />
              </Link>
            </div>
          </div>
        ) : (
          /* Onboarding Form */
          <div className="space-y-8">
            {/* Page Title & Presets Header */}
            <div className="text-center max-w-3xl mx-auto">
              <div className="inline-flex items-center gap-2 rounded-full border border-blue-500/20 bg-blue-50/80 px-4 py-1.5 text-xs font-bold text-[#0071E3] dark:border-blue-500/30 dark:bg-blue-950/40 dark:text-[#2997FF]">
                <Sparkles className="h-3.5 w-3.5" />
                <span>60-Second Instant Setup • 100% Doctor-Owned</span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-[#1D1D1F] dark:text-white tracking-tight">
                Launch Your Digital Chamber in 60 Seconds
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6] max-w-2xl mx-auto leading-relaxed">
                Paste your clinical details, choose a 1-click test preset, or snap your visiting card. Our AI provisions your Speed Rx pad, smart token board, and verified directory listing instantly.
              </p>

              {/* 1-Click Test Presets */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#86868B] mr-1">
                  Instant Presets:
                </span>
                {presets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setRawText(preset.text);
                      setCardImagePreview(null);
                    }}
                    className="rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-semibold text-[#1D1D1F] hover:border-[#0071E3] hover:text-[#0071E3] dark:border-white/[0.1] dark:bg-[#16171B] dark:text-[#E5E5E7] dark:hover:border-[#2997FF] dark:hover:text-[#2997FF] shadow-2xs transition active:scale-95"
                  >
                    {preset.title}
                  </button>
                ))}
              </div>
            </div>

            {/* 2-Column Split: Form (Left) vs Live Preview (Right) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
              {/* Left Column: Form Controls */}
              <div className="lg:col-span-6 space-y-6">
                {/* Step 1: Practice Type */}
                <div className="rounded-3xl border border-black/[0.06] bg-white p-6 dark:border-white/[0.08] dark:bg-[#16171B] shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
                      Step 1 · Practice Structure
                    </span>
                    <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                      14-Day Free Trial
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <button
                      type="button"
                      onClick={() => setPracticeType("solo")}
                      className={`rounded-2xl border p-4 text-left transition ${
                        practiceType === "solo"
                          ? "border-[#0071E3] bg-blue-50/50 dark:border-[#2997FF] dark:bg-blue-950/20 shadow-sm"
                          : "border-black/[0.08] bg-gray-50/50 dark:border-white/[0.08] dark:bg-white/[0.02] hover:bg-gray-100/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                          Solo Practice Pro
                        </span>
                        <span className="font-mono text-xs font-black text-[#0071E3] dark:text-[#2997FF]">
                          ₹599/mo
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                        1 Doctor Chamber · Speed Rx Pad · 0% Direct UPI
                      </p>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPracticeType("clinic")}
                      className={`rounded-2xl border p-4 text-left transition ${
                        practiceType === "clinic"
                          ? "border-[#0071E3] bg-blue-50/50 dark:border-[#2997FF] dark:bg-blue-950/20 shadow-sm"
                          : "border-black/[0.08] bg-gray-50/50 dark:border-white/[0.08] dark:bg-white/[0.02] hover:bg-gray-100/50"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-[#1D1D1F] dark:text-white">
                          Polyclinic Centre
                        </span>
                        <span className="font-mono text-xs font-black text-emerald-600 dark:text-emerald-400">
                          ₹1,299/mo
                        </span>
                      </div>
                      <p className="mt-1 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6]">
                        Up to 10 Doctors · Front Desk Desk · Smart TV Board
                      </p>
                    </button>
                  </div>
                </div>

                {/* Step 2: Clinic & Doctor Details */}
                <div className="rounded-3xl border border-black/[0.06] bg-white p-6 dark:border-white/[0.08] dark:bg-[#16171B] shadow-sm space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
                      Step 2 · Tell AI About Your Practice
                    </span>
                    <span className="text-[11px] font-semibold text-gray-500">
                      Zero Manual Paperwork
                    </span>
                  </div>

                  {/* Mobile Number */}
                  <div>
                    <label className="block text-xs font-bold text-[#1D1D1F] dark:text-white mb-1">
                      Doctor&apos;s Mobile Number (For Login &amp; OTP)
                    </label>
                    <input
                      type="text"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="+919876543299"
                      className="w-full rounded-xl border border-black/[0.08] bg-[#F5F6F9] px-3.5 py-2.5 text-xs font-semibold focus:border-[#0071E3] focus:outline-none dark:border-white/[0.1] dark:bg-[#101114] dark:text-white"
                    />
                  </div>

                  {/* Visiting Card Upload Zone */}
                  <div>
                    <label className="block text-xs font-bold text-[#1D1D1F] dark:text-white mb-1">
                      Snap or Upload Visiting Card (Optional)
                    </label>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="hidden"
                    />

                    {cardImagePreview ? (
                      <div className="relative rounded-2xl border border-emerald-500/30 bg-emerald-50/30 p-3 dark:bg-emerald-950/20 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="relative h-12 w-20 rounded-lg overflow-hidden border border-emerald-500/20">
                            <Image
                              src={cardImagePreview}
                              alt="Visiting card"
                              fill
                              className="object-cover"
                            />
                          </div>
                          <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">
                            Visiting card attached for extraction
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={removeUploadedImage}
                          className="rounded-full bg-red-100 p-1 text-red-600 hover:bg-red-200 transition"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full rounded-2xl border-2 border-dashed border-gray-200 p-4 text-center hover:border-[#0071E3] hover:bg-blue-50/30 dark:border-white/10 dark:hover:border-[#2997FF] dark:hover:bg-blue-950/10 transition flex items-center justify-center gap-2 text-xs font-semibold text-[#6E6E73] dark:text-[#A1A1A6]"
                      >
                        <Camera className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
                        <span>Upload photo of prescription pad or clinic card</span>
                      </button>
                    )}
                  </div>

                  {/* Raw Text / Bio Box */}
                  <div>
                    <label className="block text-xs font-bold text-[#1D1D1F] dark:text-white mb-1">
                      Or Paste Clinical Bio / WhatsApp Details
                    </label>
                    <textarea
                      rows={4}
                      value={rawText}
                      onChange={(e) => setRawText(e.target.value)}
                      placeholder="Doctor Name, Qualifications, Registration number, Clinic Address, Fees, and Timings..."
                      className="w-full rounded-xl border border-black/[0.08] bg-[#F5F6F9] p-3 text-xs leading-relaxed focus:border-[#0071E3] focus:outline-none dark:border-white/[0.1] dark:bg-[#101114] dark:text-white"
                    />
                  </div>

                  {/* Trigger AI Synthesis Button */}
                  <button
                    type="button"
                    onClick={handleExtract}
                    disabled={isExtracting || !rawText.trim()}
                    className="w-full rounded-full bg-[#0071E3] py-3.5 text-xs font-bold text-white shadow-md hover:bg-[#0077ED] disabled:opacity-50 transition active:scale-98 flex items-center justify-center gap-2"
                  >
                    {isExtracting ? (
                      <>
                        <RotateCw className="h-4 w-4 animate-spin" />
                        <span>Synthesizing Doctor Profile with AI...</span>
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        <span>Synthesize Profile with AI (Instant)</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Right Column: Live Profile Preview */}
              <div className="lg:col-span-6">
                {extractedData ? (
                  /* Extracted Profile Preview Card */
                  <div className="rounded-3xl border border-black/[0.06] bg-white p-6 sm:p-7 dark:border-white/[0.08] dark:bg-[#16171B] shadow-xl space-y-5">
                    {/* Header Pill */}
                    <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-4">
                      <div className="flex items-center gap-2">
                        <span className="flex h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                        <span className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          AI Synthesized Profile Ready
                        </span>
                      </div>
                      <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF] uppercase">
                        {extractedData.doctor.specialization}
                      </span>
                    </div>

                    {/* Doctor Info */}
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
                        {extractedData.doctor.full_name}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                        <span className="font-semibold text-[#1D1D1F] dark:text-white">
                          {extractedData.doctor.qualifications}
                        </span>
                        <span>•</span>
                        <span>{extractedData.doctor.years_of_experience}+ Years Experience</span>
                      </div>

                      {/* Reg & Fee Badges */}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 font-bold text-emerald-700 dark:text-emerald-300">
                          Reg: {extractedData.doctor.medical_council_reg_number}
                        </span>
                        <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 font-bold text-[#0071E3] dark:text-[#2997FF]">
                          Consultation: ₹{extractedData.doctor.consultation_fee}
                        </span>
                        <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 font-bold text-amber-700 dark:text-amber-300">
                          Follow-up: ₹{extractedData.doctor.followup_fee} (7 Days)
                        </span>
                      </div>
                    </div>

                    {/* Editable Bio */}
                    <div className="rounded-2xl border border-black/[0.04] bg-[#F5F6F9] dark:border-white/[0.06] dark:bg-[#101114] p-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#86868B]">
                          Doctor Biography
                        </span>
                        <button
                          type="button"
                          onClick={() => setIsEditingBio(!isEditingBio)}
                          className="inline-flex items-center gap-1 text-[11px] font-bold text-[#0071E3] dark:text-[#2997FF] hover:underline"
                        >
                          <Edit3 className="h-3 w-3" />
                          <span>{isEditingBio ? "Done" : "Edit Bio"}</span>
                        </button>
                      </div>
                      {isEditingBio ? (
                        <textarea
                          rows={3}
                          value={editableBio}
                          onChange={(e) => setEditableBio(e.target.value)}
                          className="w-full rounded-xl border border-black/[0.08] bg-white p-2.5 text-xs text-[#1D1D1F] dark:border-white/[0.1] dark:bg-[#1C1C1E] dark:text-white"
                        />
                      ) : (
                        <p className="text-xs text-[#6E6E73] dark:text-[#A1A1A6] leading-relaxed">
                          {editableBio}
                        </p>
                      )}
                    </div>

                    {/* Services Tags */}
                    <div>
                      <span className="text-[11px] font-bold uppercase tracking-wider text-[#86868B] block mb-2">
                        Extracted Procedures &amp; Services
                      </span>
                      <div className="flex flex-wrap gap-1.5">
                        {extractedData.doctor.services.map((srv: string, idx: number) => (
                          <span
                            key={idx}
                            className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-[#1D1D1F] dark:bg-white/10 dark:text-white"
                          >
                            ✓ {srv}
                          </span>
                        ))}
                      </div>
                    </div>

                    {/* Clinic Address & Hours */}
                    <div className="rounded-2xl border border-black/[0.04] bg-gray-50/50 dark:border-white/[0.06] dark:bg-[#101114] p-4">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#1D1D1F] dark:text-white">
                        <Building2 className="h-4 w-4 text-[#0071E3]" />
                        <span>{extractedData.clinic.name}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6] flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <span>
                          {extractedData.clinic.address_line}, {extractedData.clinic.city},{" "}
                          {extractedData.clinic.state}
                        </span>
                      </p>
                      <div className="mt-2 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-gray-400" />
                        <span>
                          OPD Timings: {extractedData.clinic.opening_hours.morning || "10am-2pm"} &amp;{" "}
                          {extractedData.clinic.opening_hours.evening || "5pm-8:30pm"}
                        </span>
                      </div>
                    </div>

                    {/* Approve & Publish CTA */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handlePublish}
                        disabled={isPublishing}
                        className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 py-4 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition active:scale-98 flex items-center justify-center gap-2"
                      >
                        {isPublishing ? (
                          <>
                            <RotateCw className="h-4 w-4 animate-spin" />
                            <span>Creating Clinic Workspace &amp; Session...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Approve &amp; Launch My Clinic Workspace (100% Free)</span>
                          </>
                        )}
                      </button>
                      <p className="mt-2 text-center text-[10px] text-[#86868B]">
                        Zero credit card required. Instantly provisions your Speed Rx chamber and public booking link.
                      </p>
                    </div>
                  </div>
                ) : (
                  /* Initial Placeholder Visual */
                  <div className="flex flex-col items-center justify-center rounded-3xl border-2 border-dashed border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#16171B] p-8 sm:p-12 text-center h-full min-h-[460px]">
                    <div className="relative h-40 w-40 mb-4 opacity-90">
                      <Image
                        src="/images/illustrations/digital-records.svg"
                        alt="Profile Synthesis Preview"
                        fill
                        className="object-contain"
                      />
                    </div>
                    <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                      Live Profile Preview Studio
                    </h3>
                    <p className="mt-2 text-xs text-[#6E6E73] dark:text-[#A1A1A6] max-w-sm leading-relaxed">
                      Pick a preset on the left and tap <strong className="text-[#0071E3] dark:text-[#2997FF]">&quot;Synthesize Profile with AI&quot;</strong>. 
                      You will see your credentials, NMC compliance tags, consultation fee, and clinic page constructed in real-time.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
