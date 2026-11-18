"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Sparkles,
  Stethoscope,
  Building2,
  ArrowRight,
  RotateCw,
  Edit3,
  Check,
  MapPin,
  Clock,
  X,
  Camera,
  ShieldCheck,
} from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import BackButton from "@/components/BackButton";

export default function OnboardingPage() {
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

  const [rawText, setRawText] = useState("");
  const [phone, setPhone] = useState("");
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [extractionIssues, setExtractionIssues] = useState<string[]>([]);
  const [editableBio, setEditableBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [practiceType, setPracticeType] = useState<"solo" | "clinic">("solo");
  const [publishedResult, setPublishedResult] = useState<any>(null);

  // Phone verification + credential state. Publishing requires a verified
  // patient OTP session for the same phone number.
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

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
        setExtractionIssues(json.missing_fields || []);
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
    // Never invent a doctor identity or registration number when extraction
    // fails. Ask the user to retry or paste more detail instead.
    setExtractedData(null);
    setExtractionIssues([]);
    setFormError(
      "Automatic extraction is unavailable right now. Nothing was filled in for you. Please try again, or paste your details again in a moment."
    );
  };

  const normalisePhone = (value: string) => value.replace(/[^0-9]/g, "").slice(-10);

  const handleRequestOtp = async () => {
    setFormError(null);
    if (normalisePhone(phone).length !== 10) {
      setFormError("Enter a valid 10-digit mobile number first.");
      return;
    }
    setIsSendingOtp(true);
    try {
      const res = await fetch("/api/onboarding/request-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(json.error || json.detail || "Could not send a verification code.");
        return;
      }
      setOtpSent(true);
      setPhoneVerified(false);
    } catch {
      setFormError("Could not send a verification code. Please try again.");
    } finally {
      setIsSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    setFormError(null);
    if (otp.replace(/\D/g, "").length !== 6) {
      setFormError("Enter the 6-digit code sent to your mobile number.");
      return;
    }
    setIsVerifyingOtp(true);
    try {
      const res = await fetch("/api/onboarding/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, otp }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setFormError(json.error || json.detail || "Verification failed.");
        return;
      }
      setPhoneVerified(true);
    } catch {
      setFormError("Verification failed. Please try again.");
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Submit for verification. No session is issued here: a platform
  // administrator must approve the clinic before the owner can sign in.
  const handlePublish = async () => {
    if (!extractedData) return;
    setFormError(null);

    if (!phoneVerified) {
      setFormError("Verify your mobile number with the one-time code before submitting.");
      return;
    }
    if (password.length < 12) {
      setFormError("Choose a password of at least 12 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setFormError("Passwords do not match.");
      return;
    }
    if (extractionIssues.length > 0) {
      setFormError(
        `Add the missing details to your text and extract again before submitting: ${extractionIssues.join(", ")}.`
      );
      return;
    }

    setIsPublishing(true);

    try {
      const res = await fetch("/api/onboarding/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone,
          password: password,
          practice_type: practiceType,
          doctor: extractedData.doctor,
          clinic: extractedData.clinic,
          ai_bio: editableBio,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (res.ok) {
        setPublishedResult(json);
      } else {
        setFormError(json.error || json.detail || "Submission failed. Please check your details.");
      }
    } catch (e: any) {
      setFormError(e.message || "Failed to submit your clinic for verification.");
    } finally {
      setIsPublishing(false);
    }
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
                  Clinic Onboarding
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

            <div className="inline-flex items-center gap-2 rounded-full bg-amber-500/10 border border-amber-500/20 px-3.5 py-1 text-xs font-bold text-amber-700 dark:text-amber-400">
              <ShieldCheck className="h-4 w-4" />
              <span>Submitted for review</span>
            </div>

            <h1 className="mt-4 text-2xl sm:text-4xl font-black text-[#1D1D1F] dark:text-white tracking-tight">
              Your clinic is pending approval
            </h1>

            <p className="mt-3 text-sm text-[#6E6E73] dark:text-[#A1A1A6] max-w-xl mx-auto leading-relaxed">
              {publishedResult.message}
            </p>

            {/* Submission summary */}
            <div className="mt-8 rounded-2xl border border-slate-200 bg-slate-50/70 p-5 text-left dark:border-white/[0.08] dark:bg-white/[0.02]">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-[10px] text-[#86868B] uppercase font-bold block">
                    Clinic
                  </span>
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">
                    {extractedData?.clinic?.name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#86868B] uppercase font-bold block">
                    Doctor
                  </span>
                  <span className="font-semibold text-[#1D1D1F] dark:text-white">
                    {extractedData?.doctor?.full_name}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#86868B] uppercase font-bold block">
                    Sign-in phone
                  </span>
                  <span className="font-mono font-semibold text-[#1D1D1F] dark:text-white">
                    {phone}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] text-[#86868B] uppercase font-bold block">
                    Status
                  </span>
                  <span className="font-semibold text-amber-700 dark:text-amber-400">
                    Awaiting platform review
                  </span>
                </div>
              </div>
              <p className="mt-4 text-[11px] leading-relaxed text-[#6E6E73] dark:text-[#A1A1A6]">
                Your clinic is not bookable yet. A platform administrator will review your
                registration details and approve the clinic. Once approved, sign in with the
                phone number and password you just set.
              </p>
            </div>

            <div className="mt-8 flex justify-center">
              <Link
                href="/login"
                className="inline-flex items-center gap-2 rounded-full bg-[#1D1D1F] px-8 py-3.5 text-sm font-bold text-white shadow-lg hover:bg-black dark:bg-white dark:text-[#1D1D1F] transition active:scale-95"
              >
                <span>Go to sign in</span>
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
                <span>60-Second Setup • Platform Review Before Going Live</span>
              </div>
              <h1 className="mt-3 text-3xl sm:text-4xl lg:text-5xl font-black text-[#1D1D1F] dark:text-white tracking-tight">
                Set Up Your Digital Chamber
              </h1>
              <p className="mt-3 text-xs sm:text-sm text-[#6E6E73] dark:text-[#A1A1A6] max-w-2xl mx-auto leading-relaxed">
                Paste your clinical details, choose a test preset, or snap your visiting card. Your text is turned into a draft profile you can review, then submitted for platform review before it goes live.
              </p>

              {/* 1-Click Test Presets */}
              <div className="mt-6 flex flex-wrap items-center justify-center gap-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#86868B] mr-1">
                  Instant Presets (sample data):
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

                  {/* Mobile Number + OTP verification */}
                  <div>
                    <label className="block text-xs font-bold text-[#1D1D1F] dark:text-white mb-1">
                      Doctor&apos;s Mobile Number (For Login &amp; OTP)
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={phone}
                        onChange={(e) => {
                          setPhone(e.target.value);
                          setOtpSent(false);
                          setPhoneVerified(false);
                        }}
                        placeholder="+919876543299"
                        disabled={phoneVerified}
                        className="w-full rounded-xl border border-black/[0.08] bg-[#F5F6F9] px-3.5 py-2.5 text-xs font-semibold focus:border-[#0071E3] focus:outline-none disabled:opacity-60 dark:border-white/[0.1] dark:bg-[#101114] dark:text-white"
                      />
                      <button
                        type="button"
                        onClick={handleRequestOtp}
                        disabled={phoneVerified || isSendingOtp}
                        className="shrink-0 rounded-xl bg-[#1D1D1F] px-3.5 py-2.5 text-[11px] font-bold text-white transition hover:bg-black disabled:opacity-50 dark:bg-white dark:text-[#1D1D1F]"
                      >
                        {phoneVerified
                          ? "Verified"
                          : isSendingOtp
                            ? "Sending…"
                            : otpSent
                              ? "Resend code"
                              : "Send code"}
                      </button>
                    </div>

                    {phoneVerified ? (
                      <p className="mt-1.5 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                        ✓ Mobile number verified
                      </p>
                    ) : otpSent ? (
                      <div className="mt-2 flex gap-2">
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          value={otp}
                          onChange={(e) => setOtp(e.target.value.replace(/[^0-9]/g, ""))}
                          placeholder="6-digit code"
                          className="w-full rounded-xl border border-black/[0.08] bg-[#F5F6F9] px-3.5 py-2.5 text-xs font-semibold tracking-widest focus:border-[#0071E3] focus:outline-none dark:border-white/[0.1] dark:bg-[#101114] dark:text-white"
                        />
                        <button
                          type="button"
                          onClick={handleVerifyOtp}
                          disabled={isVerifyingOtp}
                          className="shrink-0 rounded-xl bg-emerald-600 px-3.5 py-2.5 text-[11px] font-bold text-white transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isVerifyingOtp ? "Verifying…" : "Verify"}
                        </button>
                      </div>
                    ) : (
                      <p className="mt-1.5 text-[10px] text-[#86868B]">
                        We will send a one-time code to prove this number before the clinic is submitted.
                      </p>
                    )}
                  </div>

                  {/* Account password */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-[#1D1D1F] dark:text-white mb-1">
                        Create password (min 12 characters)
                      </label>
                      <input
                        type="password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-black/[0.08] bg-[#F5F6F9] px-3.5 py-2.5 text-xs font-semibold focus:border-[#0071E3] focus:outline-none dark:border-white/[0.1] dark:bg-[#101114] dark:text-white"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-[#1D1D1F] dark:text-white mb-1">
                        Confirm password
                      </label>
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        autoComplete="new-password"
                        className="w-full rounded-xl border border-black/[0.08] bg-[#F5F6F9] px-3.5 py-2.5 text-xs font-semibold focus:border-[#0071E3] focus:outline-none dark:border-white/[0.1] dark:bg-[#101114] dark:text-white"
                      />
                    </div>
                  </div>

                  {formError && (
                    <div className="rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-2.5 text-[11px] font-semibold text-rose-700 dark:border-rose-900/40 dark:bg-rose-950/30 dark:text-rose-300">
                      {formError}
                    </div>
                  )}

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
                          Draft extracted from your text
                        </span>
                      </div>
                      <span className="rounded-full bg-blue-500/10 px-2.5 py-0.5 text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF] uppercase">
                        {extractedData.doctor.specialization || "Specialty not provided"}
                      </span>
                    </div>

                    {extractionIssues.length > 0 && (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-3 text-[11px] leading-relaxed text-amber-800 dark:border-amber-900/50 dark:bg-amber-950/40 dark:text-amber-200">
                        <strong>Missing from your text:</strong> {extractionIssues.join(", ")}.
                        Add these details to the text and extract again before submitting.
                      </div>
                    )}

                    {/* Doctor Info */}
                    <div>
                      <h2 className="text-xl sm:text-2xl font-black text-[#1D1D1F] dark:text-white">
                        {extractedData.doctor.full_name || "Doctor name not provided"}
                      </h2>
                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[#6E6E73] dark:text-[#A1A1A6]">
                        <span className="font-semibold text-[#1D1D1F] dark:text-white">
                          {extractedData.doctor.qualifications || "Qualifications not provided"}
                        </span>
                        {extractedData.doctor.years_of_experience > 0 && (
                          <>
                            <span>•</span>
                            <span>{extractedData.doctor.years_of_experience}+ Years Experience</span>
                          </>
                        )}
                      </div>

                      {/* Reg & Fee Badges */}
                      <div className="mt-3 flex flex-wrap gap-2 text-xs">
                        {extractedData.doctor.medical_council_reg_number ? (
                          <span className="rounded-full bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 font-bold text-emerald-700 dark:text-emerald-300">
                            Reg: {extractedData.doctor.medical_council_reg_number}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 font-bold text-amber-700 dark:text-amber-300">
                            Registration not provided
                          </span>
                        )}
                        {extractedData.doctor.consultation_fee > 0 ? (
                          <span className="rounded-full bg-blue-500/10 border border-blue-500/20 px-3 py-1 font-bold text-[#0071E3] dark:text-[#2997FF]">
                            Consultation: ₹{extractedData.doctor.consultation_fee}
                          </span>
                        ) : (
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 font-bold text-amber-700 dark:text-amber-300">
                            Consultation fee not provided
                          </span>
                        )}
                        {extractedData.doctor.followup_fee > 0 && (
                          <span className="rounded-full bg-amber-500/10 border border-amber-500/20 px-3 py-1 font-bold text-amber-700 dark:text-amber-300">
                            Follow-up: ₹{extractedData.doctor.followup_fee} (7 Days)
                          </span>
                        )}
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
                        {extractedData.doctor.services.length > 0 ? (
                          extractedData.doctor.services.map((srv: string, idx: number) => (
                            <span
                              key={idx}
                              className="rounded-lg bg-gray-100 px-2.5 py-1 text-[11px] font-semibold text-[#1D1D1F] dark:bg-white/10 dark:text-white"
                            >
                              ✓ {srv}
                            </span>
                          ))
                        ) : (
                          <span className="text-[11px] text-[#86868B]">No services listed in your text.</span>
                        )}
                      </div>
                    </div>

                    {/* Clinic Address & Hours */}
                    <div className="rounded-2xl border border-black/[0.04] bg-gray-50/50 dark:border-white/[0.06] dark:bg-[#101114] p-4">
                      <div className="flex items-center gap-2 font-bold text-xs text-[#1D1D1F] dark:text-white">
                        <Building2 className="h-4 w-4 text-[#0071E3]" />
                        <span>{extractedData.clinic.name || "Clinic name not provided"}</span>
                      </div>
                      <p className="mt-1 text-xs text-[#6E6E73] dark:text-[#A1A1A6] flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-gray-400" />
                        <span>
                          {[extractedData.clinic.address_line, extractedData.clinic.city, extractedData.clinic.state]
                            .filter(Boolean)
                            .join(", ") || "Clinic address not provided"}
                        </span>
                      </p>
                      {(extractedData.clinic.opening_hours?.morning || extractedData.clinic.opening_hours?.evening) && (
                        <div className="mt-2 text-[11px] text-[#6E6E73] dark:text-[#A1A1A6] flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-gray-400" />
                          <span>
                            OPD Timings: {[extractedData.clinic.opening_hours?.morning, extractedData.clinic.opening_hours?.evening]
                              .filter(Boolean)
                              .join(" & ")}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Approve & Publish CTA */}
                    <div className="pt-2">
                      <button
                        type="button"
                        onClick={handlePublish}
                        disabled={isPublishing || !phoneVerified}
                        className="w-full rounded-full bg-emerald-600 hover:bg-emerald-700 py-4 text-xs sm:text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition active:scale-98 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isPublishing ? (
                          <>
                            <RotateCw className="h-4 w-4 animate-spin" />
                            <span>Submitting for verification...</span>
                          </>
                        ) : (
                          <>
                            <Check className="h-4 w-4" />
                            <span>Submit Clinic for Review (Free)</span>
                          </>
                        )}
                      </button>
                      <p className="mt-2 text-center text-[10px] text-[#86868B]">
                        A platform administrator reviews every clinic before it goes live. No
                        credit card required.
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
                      You will see your credentials, registration details, consultation fee, and clinic page constructed in real-time.
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
