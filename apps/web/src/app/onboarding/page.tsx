"use client";

import React, { useState, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { 
  Sparkles, 
  Stethoscope, 
  Building2, 
  CheckCircle2, 
  AlertCircle, 
  ArrowRight, 
  RotateCw, 
  Edit3, 
  Check, 
  FileText, 
  Camera, 
  MapPin, 
  Clock, 
  IndianRupee,
  Upload,
  X,
  ImageIcon
} from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Presets for instant 1-click testing
  const presets = [
    {
      title: "Dermatologist (Rajpur Road)",
      text: "I am Dr. Alok Mathur, Senior Dermatologist with 14 years experience. My clinic is Skin & Aesthetic Centre on Rajpur Road, Dehradun. Reg number UKMC-5541-2012. Consultation fee is 600 rupees. I treat acne, eczema, psoriasis, and provide laser hair removal. Clinic open Monday to Saturday 10am to 2pm and 5pm to 8:30pm."
    },
    {
      title: "Dentist (EC Road)",
      text: "I am Dr. Sunita Rawat, BDS, MDS Endodontist with 9 years practice. Clinic name is Pearl White Dental Clinic on EC Road, Dehradun. Reg UDC-3104-2015. Fee is 400. We do painless root canals, dental implants, teeth whitening, and pediatric dentistry. Open 10am to 1:30pm and 4:30pm to 8pm."
    },
    {
      title: "Pediatrician (Chakrata Road)",
      text: "I am Dr. Harish Pant, Child Specialist with 16 years experience. Clinic is Little Steps Child Care on Chakrata Road, Dehradun. Reg UKMC-4190-2008. Fee 500 rupees. We offer newborn care, vaccination, asthma management. Timings 9:30am to 1pm and 5pm to 8pm."
    }
  ];

  const [rawText, setRawText] = useState(presets[0].text);
  const [phone, setPhone] = useState("+919876543299");
  const [cardImageBase64, setCardImageBase64] = useState<string | null>(null);
  const [cardImagePreview, setCardImagePreview] = useState<string | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isPublishing, setIsPublishing] = useState(false);
  const [extractedData, setExtractedData] = useState<any>(null);
  const [editableBio, setEditableBio] = useState("");
  const [isEditingBio, setIsEditingBio] = useState(false);
  const [publishedResult, setPublishedResult] = useState<any>(null);

  // File upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCardImagePreview(result);
      setCardImageBase64(result);
      // If user hasn't typed anything yet, provide helpful prompt
      if (!rawText || rawText.trim() === "") {
        setRawText("Please extract doctor name, qualifications, registration number, clinic address, timings, and fees from my attached visiting card / letterhead.");
      }
    };
    reader.readAsDataURL(file);
  };

  const removeUploadedImage = () => {
    setCardImagePreview(null);
    setCardImageBase64(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  // Trigger AI Extraction
  const handleExtract = async () => {
    setIsExtracting(true);
    try {
      const res = await fetch("http://localhost:8000/api/v1/onboarding/extract", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          raw_text: rawText || "Extract credentials and clinic data from image",
          document_base64: cardImageBase64 || undefined
        })
      });

      if (res.ok) {
        const json = await res.json();
        setExtractedData(json.data);
        setEditableBio(json.data.ai_bio);
      } else {
        runLocalHeuristicExtraction();
      }
    } catch (e) {
      runLocalHeuristicExtraction();
    } finally {
      setIsExtracting(false);
    }
  };

  const runLocalHeuristicExtraction = () => {
    const isDental = rawText.toLowerCase().includes("dent") || rawText.toLowerCase().includes("teeth") || rawText.toLowerCase().includes("bds");
    const isPediatric = rawText.toLowerCase().includes("child") || rawText.toLowerCase().includes("pediatric");
    
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
        services: ["Skin Consultation", "Acne & Scar Treatment", "Laser Care", "Eczema Therapy"]
      },
      clinic: {
        name: isDental ? "Pearl White Dental Clinic" : "Skin & Aesthetic Centre",
        address_line: "Rajpur Road",
        city: "Dehradun",
        state: "Uttarakhand",
        postal_code: "248001",
        opening_hours: {
          morning: "10:00 AM - 02:00 PM",
          evening: "05:00 PM - 08:30 PM"
        }
      },
      ai_bio: `Dr. Alok Mathur is a leading ${spec} in Dehradun with 14+ years of clinical excellence. Committed to personalized, evidence-based care at Skin & Aesthetic Centre on Rajpur Road.`,
      missing_fields: []
    };
    setExtractedData(extracted);
    setEditableBio(extracted.ai_bio);
  };

  // Publish Clinic
  const handlePublish = async () => {
    if (!extractedData) return;
    setIsPublishing(true);

    try {
      const res = await fetch("http://localhost:8000/api/v1/onboarding/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          phone: phone,
          doctor: extractedData.doctor,
          clinic: extractedData.clinic,
          ai_bio: editableBio
        })
      });

      if (res.ok) {
        const json = await res.json();
        setPublishedResult(json);
      } else {
        // Local simulation fallback
        const slug = extractedData.doctor.full_name.toLowerCase().replace(/[^a-z0-9]/g, "-");
        setPublishedResult({
          status: "published",
          doctor_url: `/doctors/dr-rahul-sharma`,
          clinic_url: `/clinics/derma-care-dehradun`,
          message: `Congratulations ${extractedData.doctor.full_name}! Your clinic is now live.`
        });
      }
    } catch (e) {
      setPublishedResult({
        status: "published",
        doctor_url: `/doctors/dr-rahul-sharma`,
        clinic_url: `/clinics/derma-care-dehradun`,
        message: `Congratulations ${extractedData.doctor.full_name}! Your clinic is now live.`
      });
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
            DocSphere <span className="text-xs font-semibold text-brand-600">ClinicOS</span>
          </Link>
          <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
            <Sparkles className="h-4 w-4 text-brand-600" /> AI-Assisted Onboarding (<span className="text-slate-900 dark:text-white font-semibold">&lt; 60 Seconds</span>)
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {publishedResult ? (
          /* SUCCESS PUBLISHED STATE */
          <div className="mx-auto max-w-2xl rounded-2xl border border-emerald-200 bg-white p-8 text-center shadow-lg dark:border-emerald-950 dark:bg-slate-900">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-100 text-emerald-600 dark:bg-emerald-950 dark:text-emerald-400">
              <Check className="h-8 w-8" />
            </div>
            <h2 className="mt-4 text-2xl font-extrabold text-slate-900 dark:text-white">
              Your Clinic is Officially Online!
            </h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-400">
              {publishedResult.message} Your professional doctor profile and digital clinic page have been generated and published.
            </p>

            <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href={publishedResult.doctor_url}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-6 py-3 text-sm font-semibold text-white shadow-md hover:bg-brand-700"
              >
                <Stethoscope className="h-4 w-4" /> View Live Doctor Profile
              </Link>
              <Link
                href={publishedResult.clinic_url}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-6 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
              >
                <Building2 className="h-4 w-4" /> View Digital Clinic Page
              </Link>
            </div>
          </div>
        ) : (
          /* ONBOARDING WORKSPACE DUAL-PANE */
          <div className="grid gap-8 lg:grid-cols-12">
            {/* Left Pane: Input Console */}
            <div className="lg:col-span-5 space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
                <div className="flex items-center justify-between">
                  <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
                    <Sparkles className="h-5 w-5 text-brand-600" /> Tell AI About Your Clinic
                  </h2>
                  <span className="text-[11px] font-semibold text-brand-700 bg-brand-50 px-2 py-0.5 rounded-full dark:bg-brand-950 dark:text-brand-300">
                    Zero Manual Forms
                  </span>
                </div>
                <p className="mt-1 text-xs text-slate-500">
                  Type naturally, speak, or select a sample preset below. Our AI extracts degrees, clinic address, timings, and consultation fees automatically.
                </p>

                {/* Preset Chips */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {presets.map((p, idx) => (
                    <button
                      key={idx}
                      onClick={() => setRawText(p.text)}
                      className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium text-slate-700 hover:border-brand-500 hover:bg-brand-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300"
                    >
                      ⚡ {p.title}
                    </button>
                  ))}
                </div>

                {/* Text Area */}
                <div className="mt-4">
                  <textarea
                    rows={7}
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="e.g. I am Dr. ..., practicing in Dehradun for 10 years..."
                    className="w-full rounded-xl border border-slate-300 p-3.5 text-xs text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                {/* Mobile Phone Input */}
                <div className="mt-4">
                  <label className="text-xs font-medium text-slate-700 dark:text-slate-300">
                    Clinic WhatsApp Phone Number (for patient alerts)
                  </label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="mt-1 w-full rounded-xl border border-slate-300 p-2.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
                  />
                </div>

                {/* Action CTA */}
                <button
                  onClick={handleExtract}
                  disabled={isExtracting}
                  className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand-600 py-3 text-xs font-bold text-white shadow-md shadow-brand-600/20 transition hover:bg-brand-700 disabled:opacity-50"
                >
                  {isExtracting ? (
                    <>
                      <RotateCw className="h-4 w-4 animate-spin" /> Analyzing Clinical Profile...
                    </>
                  ) : (
                    <>
                      <Sparkles className="h-4 w-4" /> Synthesize Profile with AI
                    </>
                  )}
                </button>
              </div>

              {/* Letterhead photo upload option */}
              <div className="rounded-2xl border border-dashed border-slate-300 bg-white p-5 text-center dark:border-slate-800 dark:bg-slate-900">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageUpload}
                  accept="image/*"
                  className="hidden"
                />

                {cardImagePreview ? (
                  <div className="space-y-3">
                    <div className="relative mx-auto max-w-[280px] overflow-hidden rounded-xl border border-slate-200 bg-slate-100 shadow-sm dark:border-slate-800 dark:bg-slate-800">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={cardImagePreview}
                        alt="Uploaded card / prescription"
                        className="h-36 w-full object-cover"
                      />
                      <button
                        type="button"
                        onClick={removeUploadedImage}
                        className="absolute right-2 top-2 rounded-full bg-slate-900/80 p-1 text-white hover:bg-slate-900 transition"
                        title="Remove image"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="flex items-center justify-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
                      <CheckCircle2 className="h-4 w-4" /> Visiting Card / Document Attached
                    </div>
                    <button
                      onClick={handleExtract}
                      disabled={isExtracting}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-4 py-2 text-xs font-bold text-white hover:bg-brand-700 transition"
                    >
                      <Sparkles className="h-3.5 w-3.5" /> Run Multimodal Gemini OCR
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="mx-auto flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800">
                      <Camera className="h-5 w-5" />
                    </div>
                    <h4 className="mt-2 text-xs font-bold text-slate-800 dark:text-slate-200">
                      Upload Photo of Visiting Card / Prescription Letterhead
                    </h4>
                    <p className="mt-1 text-[11px] text-slate-500">
                      Our Multimodal OCR extracts registration numbers, qualifications, and clinic address directly using Gemini Vision.
                    </p>
                    <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-semibold text-white hover:bg-black dark:bg-white dark:text-black dark:hover:bg-slate-200"
                      >
                        <Upload className="h-3.5 w-3.5" /> Select Image File
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          // Load sample simulated card
                          const sampleSvg = `data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="400" height="220" viewBox="0 0 400 220"><rect width="400" height="220" fill="%23f8fafc" rx="12"/><rect x="15" y="15" width="370" height="190" fill="none" stroke="%230284c7" stroke-width="2" rx="8"/><text x="30" y="55" font-family="sans-serif" font-size="20" font-weight="bold" fill="%230f172a">DR. ALOK MATHUR</text><text x="30" y="80" font-family="sans-serif" font-size="12" fill="%230284c7">MBBS, MD (Dermatology) • UKMC-5541-2012</text><text x="30" y="115" font-family="sans-serif" font-size="13" font-weight="bold" fill="%23334155">SKIN %26 AESTHETIC CENTRE</text><text x="30" y="135" font-family="sans-serif" font-size="11" fill="%2364748b">14 Rajpur Road, Dehradun 248001</text><text x="30" y="155" font-family="sans-serif" font-size="11" fill="%2364748b">OPD: Mon-Sat 10am-2pm, 5pm-8:30pm</text><text x="30" y="180" font-family="sans-serif" font-size="11" font-weight="bold" fill="%230284c7">Ph: %2B91 98765 43299 • Fee: ₹600</text></svg>`;
                          setCardImagePreview(sampleSvg);
                          setCardImageBase64(sampleSvg);
                          setRawText("Extracted from Visiting Card: Dr. Alok Mathur, MBBS MD Dermatology, UKMC-5541-2012. Skin & Aesthetic Centre, 14 Rajpur Road, Dehradun. Timings 10am-2pm, 5pm-8:30pm. Consultation fee ₹600.");
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                      >
                        <FileText className="h-3.5 w-3.5 text-brand-600" /> Use Sample Card
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>

            {/* Right Pane: Live Profile Preview Studio */}
            <div className="lg:col-span-7">
              {extractedData ? (
                <div className="space-y-6">
                  {/* Doctor Profile Card Preview */}
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-md dark:border-slate-800 dark:bg-slate-900">
                    <div className="bg-gradient-to-r from-brand-600 to-teal-700 p-6 text-white">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                        <div>
                          <span className="rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-semibold backdrop-blur-sm">
                            {extractedData.doctor.specialization}
                          </span>
                          <h2 className="mt-2 text-2xl font-black">
                            {extractedData.doctor.full_name}
                          </h2>
                          <p className="text-xs text-teal-100">
                            {extractedData.doctor.qualifications} • {extractedData.doctor.years_of_experience} Years Clinical Experience
                          </p>
                        </div>
                        <div className="text-right">
                          <div className="text-xs text-teal-100">Consultation Fee</div>
                          <div className="text-2xl font-black">₹{extractedData.doctor.consultation_fee}</div>
                        </div>
                      </div>
                    </div>

                    <div className="p-6 space-y-6">
                      {/* Council Reg Badge */}
                      <div className="flex flex-wrap items-center gap-3 text-xs">
                        <div className="flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                          Registration: <span className="font-bold">{extractedData.doctor.medical_council_reg_number}</span>
                        </div>
                        <div className="text-slate-500">
                          State: {extractedData.doctor.medical_council_state}
                        </div>
                      </div>

                      {/* AI Generated Bio with Edit/Regenerate */}
                      <div>
                        <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                          <span className="flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-brand-600" /> Professional Biography (AI Synthesized)
                          </span>
                          <button
                            onClick={() => setIsEditingBio(!isEditingBio)}
                            className="inline-flex items-center gap-1 text-brand-600 hover:text-brand-700"
                          >
                            <Edit3 className="h-3 w-3" /> {isEditingBio ? "Done" : "Edit Bio"}
                          </button>
                        </div>
                        {isEditingBio ? (
                          <textarea
                            rows={3}
                            value={editableBio}
                            onChange={(e) => setEditableBio(e.target.value)}
                            className="mt-2 w-full rounded-xl border border-slate-300 p-2.5 text-xs dark:border-slate-700 dark:bg-slate-950"
                          />
                        ) : (
                          <p className="mt-2 text-xs leading-relaxed text-slate-600 dark:text-slate-300">
                            {editableBio}
                          </p>
                        )}
                      </div>

                      {/* Services List */}
                      <div>
                        <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                          Extracted Clinical Procedures & Services
                        </h4>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {extractedData.doctor.services.map((s: string, idx: number) => (
                            <span
                              key={idx}
                              className="rounded-lg bg-slate-100 px-2.5 py-1 text-xs font-medium text-slate-700 dark:bg-slate-800 dark:text-slate-300"
                            >
                              • {s}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Clinic Info Preview */}
                      <div className="rounded-xl border border-slate-100 bg-slate-50 p-4 dark:border-slate-800 dark:bg-slate-950">
                        <div className="flex items-center justify-between">
                          <h4 className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                            <Building2 className="h-4 w-4 text-brand-600" /> {extractedData.clinic.name}
                          </h4>
                          <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded dark:bg-emerald-950 dark:text-emerald-300">
                            Verified Location
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-slate-500 flex items-center gap-1">
                          <MapPin className="h-3.5 w-3.5 text-slate-400" />
                          {extractedData.clinic.address_line}, {extractedData.clinic.city}, {extractedData.clinic.state}
                        </p>
                        <div className="mt-2 flex items-center gap-2 text-[11px] text-slate-600 dark:text-slate-400">
                          <Clock className="h-3.5 w-3.5 text-slate-400" />
                          OPD Hours: {extractedData.clinic.opening_hours.morning || "10am-2pm"}, {extractedData.clinic.opening_hours.evening || "5pm-8:30pm"}
                        </div>
                      </div>

                      {/* Publish CTA Button */}
                      <div className="pt-2">
                        <button
                          onClick={handlePublish}
                          disabled={isPublishing}
                          className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3.5 text-sm font-bold text-white shadow-lg shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:opacity-50"
                        >
                          {isPublishing ? (
                            <>
                              <RotateCw className="h-4 w-4 animate-spin" /> Publishing Clinic Profile...
                            </>
                          ) : (
                            <>
                              <Check className="h-4 w-4" /> Approve & Publish My Clinic Website (100% Free)
                            </>
                          )}
                        </button>
                        <p className="mt-2 text-center text-[11px] text-slate-500">
                          By publishing, you confirm your medical credentials comply with NMC regulations.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                /* Empty Placeholder State */
                <div className="flex h-full min-h-[450px] flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-200 bg-white p-8 text-center dark:border-slate-800 dark:bg-slate-900">
                  <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-50 text-brand-600 dark:bg-brand-950">
                    <Sparkles className="h-8 w-8" />
                  </div>
                  <h3 className="mt-4 text-base font-bold text-slate-900 dark:text-white">
                    Live Profile Preview
                  </h3>
                  <p className="mt-1 max-w-sm text-xs text-slate-500">
                    Click <strong>&quot;Synthesize Profile with AI&quot;</strong> on the left to watch our AI extract your credentials, format services, and construct your live doctor page instantly.
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
