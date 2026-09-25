"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import ThemeToggle from "@/components/ThemeToggle";
import { 
  Search, 
  MapPin, 
  Stethoscope, 
  Star, 
  Calendar, 
  Navigation, 
  ShieldCheck, 
  Clock, 
  SlidersHorizontal, 
  ArrowRight, 
  Sparkles, 
  Map as MapIcon, 
  LayoutGrid, 
  Info, 
  Check, 
  X, 
  ThumbsUp, 
  ChevronDown, 
  Layers, 
  Filter, 
  CheckCircle2,
  MessageSquareQuote,
  Languages
} from "lucide-react";
import GoogleTerrainMap, { DoctorMapItem } from "@/components/GoogleTerrainMap";
import { usePatientSession } from "@/lib/patientSession";

// ============================================================================
// COMPREHENSIVE DOCTORS DIRECTORY (Matches Screenshot & Dehradun Topography)
// ============================================================================
const ALL_SEARCH_DOCTORS: DoctorMapItem[] = [
  {
    slug: "dr-rohit-sureka",
    full_name: "Dr Rohit Sureka",
    title: "Dr.",
    specialization: "Gastroenterology/Gi Medicine Specialist",
    qualification_summary: "15 YEARS • MBBS, DNB GENERAL MEDICINE, DNB GASTROENTEROLOGY",
    years_of_experience: 15,
    rating: 4.95,
    total_reviews: 184,
    consultation_fee: 999,
    clinic_name: "DocSphere Direct - Virtual & Clinic",
    clinic_address: "14, Rajpur Road, Near Ashley Hall, Dehradun",
    locality: "Rajpur Road",
    wait_time: "Available in 14 minutes",
    on_time_guarantee: true,
    online_available: true,
    gender: "Male",
    avatar_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80",
    lat: 30.3421,
    lng: 78.0512,
    languages: ["English", "Hindi"],
    services: ["Acid Reflux (GERD)", "Liver Cirrhosis", "Colonoscopy", "Fatty Liver Care"],
    next_available_slot: "Today, 04:30 PM",
    patient_story_snippet: "Dr. Sureka diagnosed my chronic abdominal pain accurately in one consultation. Very calm and reassuring.",
    distance_km: "1.4 km",
    nmc_reg_no: "UK-48912/2009"
  },
  {
    slug: "dr-harish-k-c",
    full_name: "Dr Harish K C",
    title: "Dr.",
    specialization: "Gastroenterology/Gi Medicine Specialist",
    qualification_summary: "15 YEARS • MBBS, MD (GENERAL MEDICINE), DM (GASTROENTEROLOGY)",
    years_of_experience: 15,
    rating: 4.88,
    total_reviews: 125,
    consultation_fee: 1000,
    clinic_name: "DocSphere Clinic, Survey Chowk",
    clinic_address: "42, EC Road, Survey Chowk, Dehradun",
    locality: "EC Road",
    wait_time: "Available in 9 minutes",
    on_time_guarantee: false,
    online_available: true,
    gender: "Male",
    avatar_url: "https://images.unsplash.com/photo-1612349317150-e413f6a5b16d?w=300&auto=format&fit=crop&q=80",
    lat: 30.3204,
    lng: 78.0489,
    languages: ["English", "Hindi", "Kannada"],
    services: ["IBD & Ulcerative Colitis", "Gastritis", "Endoscopy", "Hepatitis Care"],
    next_available_slot: "Today, 05:15 PM",
    patient_story_snippet: "Very empathetic specialist. Provided actionable diet and lifestyle advice rather than rushing into tests.",
    distance_km: "2.1 km",
    nmc_reg_no: "UK-39218/2011"
  },
  {
    slug: "dr-rahul-sharma",
    full_name: "Dr Rahul Sharma",
    title: "Dr.",
    specialization: "Dermatology/Skin & Hair Specialist",
    qualification_summary: "12 YEARS • MBBS, MD (DERMATOLOGY, VENEREOLOGY & LEPROSY)",
    years_of_experience: 12,
    rating: 4.90,
    total_reviews: 142,
    consultation_fee: 600,
    clinic_name: "Derma Care Skin & Laser Centre",
    clinic_address: "14, Rajpur Road, Near Ashley Hall, Dehradun",
    locality: "Rajpur Road",
    wait_time: "Available in 10 minutes",
    on_time_guarantee: true,
    online_available: true,
    gender: "Male",
    avatar_url: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80",
    lat: 30.3255,
    lng: 78.0436,
    languages: ["English", "Hindi"],
    services: ["Acne & Scar Laser", "PRP Hair Loss Therapy", "Eczema Treatment", "Chemical Peels"],
    next_available_slot: "Today, 04:00 PM",
    patient_story_snippet: "Remarkable improvement in my stubborn acne within 3 weeks. Does not push expensive cosmetics.",
    distance_km: "0.8 km",
    nmc_reg_no: "UK-51204/2012"
  },
  {
    slug: "dr-aditi-joshi",
    full_name: "Dr Aditi Joshi",
    title: "Dr.",
    specialization: "Dentistry/Endodontics Specialist",
    qualification_summary: "8 YEARS • BDS, MDS (CONSERVATIVE DENTISTRY & ENDODONTICS)",
    years_of_experience: 8,
    rating: 4.80,
    total_reviews: 98,
    consultation_fee: 400,
    clinic_name: "Smile Craft Multi-Speciality Dental",
    clinic_address: "42, EC Road, Near Survey Chowk, Dehradun",
    locality: "EC Road",
    wait_time: "Available in 5 minutes",
    on_time_guarantee: true,
    online_available: true,
    gender: "Female",
    avatar_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80",
    lat: 30.3218,
    lng: 78.0495,
    languages: ["English", "Hindi", "Garhwali"],
    services: ["Painless Root Canal (RCT)", "Ceramic Crowns", "Teeth Whitening", "Laser Dentistry"],
    next_available_slot: "Today, 03:45 PM",
    patient_story_snippet: "Zero pain during the root canal procedure. Clinic is spotless and maintains exceptional sterilization.",
    distance_km: "1.1 km",
    nmc_reg_no: "UK-61984/2016"
  },
  {
    slug: "dr-vikram-sethi",
    full_name: "Dr Vikram Sethi",
    title: "Dr.",
    specialization: "Paediatrics/Child & Newborn Specialist",
    qualification_summary: "15 YEARS • MBBS, DCH, DNB (PEDIATRICS)",
    years_of_experience: 15,
    rating: 4.95,
    total_reviews: 210,
    consultation_fee: 500,
    clinic_name: "Dron Child & Newborn Health Centre",
    clinic_address: "88, Chakrata Road, Near Ballupur Chowk, Dehradun",
    locality: "Chakrata Road",
    wait_time: "Available in 15 minutes",
    on_time_guarantee: true,
    online_available: true,
    gender: "Male",
    avatar_url: "https://images.unsplash.com/photo-1582750433449-648ed127bb54?w=300&auto=format&fit=crop&q=80",
    lat: 30.3342,
    lng: 78.0125,
    languages: ["English", "Hindi", "Punjabi"],
    services: ["Newborn Care & NICU Followup", "Childhood Immunization", "Asthma & Allergies", "Growth Monitoring"],
    next_available_slot: "Today, 05:00 PM",
    patient_story_snippet: "Dr. Sethi is wonderfully gentle with babies. Never rushes and explains every dose patiently to anxious parents.",
    distance_km: "3.2 km",
    nmc_reg_no: "UK-44129/2009"
  },
  {
    slug: "dr-priya-nair",
    full_name: "Dr Priya Nair",
    title: "Dr.",
    specialization: "Cardiology/Heart & Vascular Specialist",
    qualification_summary: "14 YEARS • MBBS, MD (MEDICINE), DM (CARDIOLOGY), FACC",
    years_of_experience: 14,
    rating: 4.96,
    total_reviews: 167,
    consultation_fee: 800,
    clinic_name: "Himalayan Heart & Vascular Clinic",
    clinic_address: "56, Rajpur Road, Opp. Hotel Madhuban, Dehradun",
    locality: "Rajpur Road",
    wait_time: "Available in 12 minutes",
    on_time_guarantee: true,
    online_available: true,
    gender: "Female",
    avatar_url: "https://images.unsplash.com/photo-1594824813589-38b4d8d1e0d4?w=300&auto=format&fit=crop&q=80",
    lat: 30.3381,
    lng: 78.0512,
    languages: ["English", "Hindi", "Malayalam"],
    services: ["2D Echocardiography", "Preventive Heart Check", "Hypertension Clinic", "Post-Angioplasty Care"],
    next_available_slot: "Today, 04:45 PM",
    patient_story_snippet: "Dr. Nair accurately detected an early arrhythmia that previous doctors overlooked. Extremely competent.",
    distance_km: "1.6 km",
    nmc_reg_no: "UK-47890/2010"
  },
  {
    slug: "dr-arvind-rawat",
    full_name: "Dr Arvind Rawat",
    title: "Dr.",
    specialization: "General Physician/Internal Medicine Specialist",
    qualification_summary: "16 YEARS • MBBS, MD (INTERNAL MEDICINE)",
    years_of_experience: 16,
    rating: 4.92,
    total_reviews: 184,
    consultation_fee: 500,
    clinic_name: "Doon Family Health & Diabetes Care",
    clinic_address: "12, Saharanpur Road, Near Patel Chowk, Dehradun",
    locality: "Saharanpur Road",
    wait_time: "Available in 8 minutes",
    on_time_guarantee: true,
    online_available: true,
    gender: "Male",
    avatar_url: "https://images.unsplash.com/photo-1614608682850-e0d6ed316d47?w=300&auto=format&fit=crop&q=80",
    lat: 30.3152,
    lng: 78.0321,
    languages: ["English", "Hindi", "Garhwali"],
    services: ["Type 2 Diabetes Reversal", "Thyroid Disorders", "Dengue & Viral Fevers", "Elderly Geriatric Care"],
    next_available_slot: "Today, 03:30 PM",
    patient_story_snippet: "Our trusted family physician for over a decade. Prescribes minimum medications and solves problems quickly.",
    distance_km: "2.4 km",
    nmc_reg_no: "UK-38761/2008"
  },
  {
    slug: "dr-meenakshi-sundaram",
    full_name: "Dr Meenakshi Sundaram",
    title: "Dr.",
    specialization: "Obstetrics & Gynaecology Specialist",
    qualification_summary: "15 YEARS • MBBS, MS (OBSTETRICS & GYNECOLOGY), DGO",
    years_of_experience: 15,
    rating: 4.94,
    total_reviews: 195,
    consultation_fee: 600,
    clinic_name: "Motherhood Care & Fertility Clinic",
    clinic_address: "31, Dalanwala, Circular Road, Dehradun",
    locality: "Dalanwala",
    wait_time: "Available in 10 minutes",
    on_time_guarantee: true,
    online_available: true,
    gender: "Female",
    avatar_url: "https://images.unsplash.com/photo-1559839734-2b71ea197ec2?w=300&auto=format&fit=crop&q=80",
    lat: 30.3211,
    lng: 78.0562,
    languages: ["English", "Hindi", "Tamil"],
    services: ["High-Risk Pregnancy", "PCOS / PCOD Reversal", "Infertility Evaluation", "Menopause Care"],
    next_available_slot: "Today, 05:30 PM",
    patient_story_snippet: "Guided me with supreme confidence and calm through an anxious high-risk pregnancy. Forever thankful.",
    distance_km: "1.9 km",
    nmc_reg_no: "UK-42198/2009"
  },
  {
    slug: "dr-rajesh-semwal",
    full_name: "Dr Rajesh Semwal",
    title: "Dr.",
    specialization: "Orthopaedics/Joint & Spine Specialist",
    qualification_summary: "18 YEARS • MBBS, MS (ORTHOPEDICS), MCH (JOINT REPLACEMENT)",
    years_of_experience: 18,
    rating: 4.92,
    total_reviews: 230,
    consultation_fee: 600,
    clinic_name: "Doon Ortho & Joint Spine Clinic",
    clinic_address: "24, Ballupur Chowk, Chakrata Road, Dehradun",
    locality: "Ballupur Chowk",
    wait_time: "Available in 20 minutes",
    on_time_guarantee: false,
    online_available: true,
    gender: "Male",
    avatar_url: "https://images.unsplash.com/photo-1537368910025-700350fe46c7?w=300&auto=format&fit=crop&q=80",
    lat: 30.3395,
    lng: 78.0089,
    languages: ["English", "Hindi"],
    services: ["Robotic Knee Replacement", "Sciatica & Slip Disc", "Sports Ligament (ACL)", "Arthritis Management"],
    next_available_slot: "Tomorrow, 10:00 AM",
    patient_story_snippet: "My mother walked pain-free 12 days after knee replacement. Clear advice without false promises.",
    distance_km: "3.5 km",
    nmc_reg_no: "UK-31298/2006"
  },
  {
    slug: "dr-amit-bansal",
    full_name: "Dr Amit Bansal",
    title: "Dr.",
    specialization: "ENT/Otorhinolaryngology Specialist",
    qualification_summary: "11 YEARS • MBBS, MS (ENT)",
    years_of_experience: 11,
    rating: 4.85,
    total_reviews: 115,
    consultation_fee: 500,
    clinic_name: "Bansal ENT & Micro-Ear Care Centre",
    clinic_address: "18, Subhash Road, Near Clock Tower, Dehradun",
    locality: "Subhash Road",
    wait_time: "Available in 6 minutes",
    on_time_guarantee: true,
    online_available: true,
    gender: "Male",
    avatar_url: "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=300&auto=format&fit=crop&q=80",
    lat: 30.3274,
    lng: 78.0415,
    languages: ["English", "Hindi"],
    services: ["Endoscopic Sinus Surgery", "Tympanoplasty (Ear Drum)", "Tonsillitis & Adenoid", "Vertigo Treatment"],
    next_available_slot: "Today, 04:15 PM",
    patient_story_snippet: "Cured my chronic sinus blockage and vertigo completely. Clear diagnosis and transparent fees.",
    distance_km: "1.0 km",
    nmc_reg_no: "UK-53412/2013"
  }
];

// Fallback Doctor Avatar SVG when image is loading or fails
function DoctorPortrait({ 
  name, 
  avatarUrl, 
  gender,
  className = "h-16 w-16 sm:h-20 sm:w-20"
}: { 
  name: string; 
  avatarUrl?: string; 
  gender?: string;
  className?: string;
}) {
  const [imgError, setImgError] = useState(false);

  if (avatarUrl && !imgError) {
    return (
      <div className={`relative shrink-0 overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-gray-100 shadow-xs ${className}`}>
        <img
          src={avatarUrl}
          alt={name}
          onError={() => setImgError(true)}
          className="h-full w-full object-cover"
        />
      </div>
    );
  }

  // Realistic Doctor SVG Avatar
  return (
    <div className={`relative flex shrink-0 items-center justify-center overflow-hidden rounded-xl border border-gray-200 dark:border-white/10 bg-gradient-to-b from-[#EFF6FF] to-[#DBEAFE] dark:from-[#1E293B] dark:to-[#0F172A] shadow-xs ${className}`}>
      <svg className="h-4/5 w-4/5 text-[#2563EB] dark:text-[#60A5FA]" viewBox="0 0 100 100" fill="none">
        {/* Head */}
        <circle cx="50" cy="35" r="18" fill="#F87171" opacity="0.8" />
        <path d="M 32 30 C 32 18, 68 18, 68 30 Z" fill="#1E293B" />
        {/* White Lab Coat & Stethoscope */}
        <path d="M 22 85 C 22 55, 36 50, 50 50 C 64 50, 78 55, 78 85 Z" fill="#FFFFFF" stroke="#CBD5E1" strokeWidth="2" />
        <path d="M 40 50 L 50 72 L 60 50" fill="#3B82F6" opacity="0.3" />
        <path d="M 38 52 C 38 70, 62 70, 62 52" stroke="#475569" strokeWidth="2.5" fill="none" strokeLinecap="round" />
        <circle cx="50" cy="72" r="3" fill="#64748B" />
      </svg>
      <span className="absolute bottom-0.5 right-0.5 rounded-full bg-emerald-500 p-0.5 ring-1.5 ring-white">
        <Check className="h-2 w-2 text-white" />
      </span>
    </div>
  );
}

function normalizeSpecialty(input: string): string {
  if (!input || input === "All") return "All";
  const s = input.toLowerCase().replace(/[-_]/g, " ").trim();
  
  if (s.includes("gastro") || s.includes("gi medicine") || s.includes("stomach") || s.includes("liver") || s.includes("digest")) {
    return "Gastroenterology";
  }
  if (s.includes("derma") || s.includes("skin") || s.includes("hair") || s.includes("scalp")) {
    return "Dermatology";
  }
  if (s.includes("pediatric") || s.includes("paediatric") || s.includes("child") || s.includes("newborn")) {
    return "Paediatrics";
  }
  if (s.includes("cardio") || s.includes("heart") || s.includes("vascular")) {
    return "Cardiology";
  }
  if (s.includes("dent") || s.includes("teeth") || s.includes("tooth") || s.includes("oral") || s.includes("rct")) {
    return "Dentistry";
  }
  if (s.includes("physician") || s.includes("internal medicine") || s.includes("general medicine")) {
    return "General Physician";
  }
  if (s.includes("gyn") || s.includes("obstetric") || s.includes("women") || s.includes("pregnancy")) {
    return "Gynaecology";
  }
  if (s.includes("ortho") || s.includes("bone") || s.includes("joint") || s.includes("spine")) {
    return "Orthopaedics";
  }
  if (s.includes("ent") || s.includes("ear") || s.includes("nose") || s.includes("throat")) {
    return "ENT";
  }
  if (s.includes("ophthal") || s.includes("eye") || s.includes("vision")) {
    return "Ophthalmology";
  }
  return input;
}

function SearchDiscoveryContent() {
  const { session, isLoggedIn } = usePatientSession();
  const searchParams = useSearchParams();
  const urlSpecialty = searchParams.get("specialty") || searchParams.get("category") || "";
  const urlQuery = searchParams.get("query") || searchParams.get("q") || "";

  // --------------------------------------------------------------------------
  // FILTER STATES (Matching screenshot)
  // --------------------------------------------------------------------------
  const [query, setQuery] = useState(urlQuery);
  const [modeOnline, setModeOnline] = useState(true);
  const [modePhysical, setModePhysical] = useState(false);
  const [cityFilter, setCityFilter] = useState("Dehradun City Dehradun");
  
  // Experience filters: "0-5", "6-10", "11-16", "16+"
  const [expRanges, setExpRanges] = useState<string[]>([]);

  // Fee filters: "100-500", "500-1000", "1000+"
  const [feeRanges, setFeeRanges] = useState<string[]>([]);

  // Gender filters: "Male", "Female"
  const [selectedGenders, setSelectedGenders] = useState<string[]>([]);

  // Specialty filter
  const [selectedSpecialty, setSelectedSpecialty] = useState<string>(
    urlSpecialty ? normalizeSpecialty(urlSpecialty) : "All"
  );

  // Sync URL parameters for ?specialty and ?query
  useEffect(() => {
    if (urlSpecialty) {
      setSelectedSpecialty(normalizeSpecialty(urlSpecialty));
    }
    if (urlQuery) {
      setQuery(urlQuery);
    }
  }, [urlSpecialty, urlQuery]);

  // View Mode: "split" | "list" | "map"
  const [viewMode, setViewMode] = useState<"split" | "list" | "map">("split");

  // Active doctor for Map highlighting & info modal
  const [activeDoctor, setActiveDoctor] = useState<DoctorMapItem | null>(ALL_SEARCH_DOCTORS[0]);
  const [infoModalDoctor, setInfoModalDoctor] = useState<DoctorMapItem | null>(null);

  // Clear all filters handler
  const handleClearAll = () => {
    setQuery("");
    setModeOnline(true);
    setModePhysical(false);
    setCityFilter("Dehradun City Dehradun");
    setExpRanges([]);
    setFeeRanges([]);
    setSelectedGenders([]);
    setSelectedSpecialty("All");
  };

  // Toggle helper for arrays
  const toggleArrayItem = (list: string[], item: string, setter: (val: string[]) => void) => {
    if (list.includes(item)) {
      setter(list.filter((x) => x !== item));
    } else {
      setter([...list, item]);
    }
  };

  // --------------------------------------------------------------------------
  // FILTER LOGIC
  // --------------------------------------------------------------------------
  const filteredDoctors = useMemo(() => {
    return ALL_SEARCH_DOCTORS.filter((doc) => {
      // Keyword search
      if (query.trim()) {
        const q = query.toLowerCase();
        const matchesName = doc.full_name.toLowerCase().includes(q);
        const matchesSpec = doc.specialization.toLowerCase().includes(q);
        const matchesClinic = doc.clinic_name.toLowerCase().includes(q);
        const matchesAddress = doc.clinic_address.toLowerCase().includes(q);
        if (!matchesName && !matchesSpec && !matchesClinic && !matchesAddress) {
          return false;
        }
      }

      // Specialty filter (handles synonyms like gastroenterologist -> Gastroenterology)
      if (selectedSpecialty !== "All") {
        const normSelected = normalizeSpecialty(selectedSpecialty).toLowerCase();
        const normDoc = normalizeSpecialty(doc.specialization).toLowerCase();
        const rawDoc = doc.specialization.toLowerCase();
        const rawSelected = selectedSpecialty.toLowerCase();
        const match =
          rawDoc.includes(rawSelected) ||
          rawSelected.includes(rawDoc) ||
          normDoc === normSelected ||
          rawDoc.includes(normSelected);
        if (!match) {
          return false;
        }
      }

      // Gender filter
      if (selectedGenders.length > 0) {
        if (!doc.gender || !selectedGenders.includes(doc.gender)) {
          return false;
        }
      }

      // Experience ranges
      if (expRanges.length > 0) {
        const exp = doc.years_of_experience;
        const matchesAnyExp = expRanges.some((range) => {
          if (range === "0-5") return exp >= 0 && exp <= 5;
          if (range === "6-10") return exp >= 6 && exp <= 10;
          if (range === "11-16") return exp >= 11 && exp <= 16;
          if (range === "16+") return exp > 16;
          return true;
        });
        if (!matchesAnyExp) return false;
      }

      // Fee ranges
      if (feeRanges.length > 0) {
        const fee = doc.consultation_fee;
        const matchesAnyFee = feeRanges.some((range) => {
          if (range === "100-500") return fee >= 100 && fee <= 500;
          if (range === "500-1000") return fee > 500 && fee <= 1000;
          if (range === "1000+") return fee > 1000;
          return true;
        });
        if (!matchesAnyFee) return false;
      }

      return true;
    });
  }, [query, selectedSpecialty, selectedGenders, expRanges, feeRanges]);

  // Keep active doctor in sync
  useEffect(() => {
    if (filteredDoctors.length > 0) {
      if (!filteredDoctors.some((d) => d.slug === activeDoctor?.slug)) {
        setActiveDoctor(filteredDoctors[0]);
      }
    } else {
      setActiveDoctor(null);
    }
  }, [filteredDoctors]);

  return (
    <div className="h-screen overflow-hidden bg-[#F5F6F8] dark:bg-[#121212] text-[#1D1D1F] dark:text-[#F5F5F7] flex flex-col font-sans">
      {/* =====================================================================
          TOP NAVIGATION BAR (Clean Header with View Mode Switcher)
      ===================================================================== */}
      <header className="h-16 shrink-0 z-40 bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border-b border-black/[0.08] dark:border-white/[0.08]">
        <div className="mx-auto flex h-full max-w-[1720px] items-center justify-between px-3 sm:px-6">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-tr from-[#0071E3] to-[#008778] text-white shadow-sm">
                <Stethoscope className="h-5 w-5" />
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-lg font-black tracking-tight text-[#1D1D1F] dark:text-white">
                  DocSphere
                </span>
                <span className="text-xs font-bold text-[#0071E3] uppercase tracking-wider">
                  Direct Search
                </span>
              </div>
            </Link>

            <div className="hidden md:flex items-center gap-2 text-xs font-semibold text-gray-500">
              <span className="h-4 w-[1px] bg-gray-300 dark:bg-white/20" />
              <MapPin className="h-3.5 w-3.5 text-[#008778]" />
              <span>Dehradun, Uttarakhand • 0% Aggregator Fee</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* View Mode Switcher */}
            <div className="flex items-center rounded-lg bg-gray-100 dark:bg-white/10 p-1 text-xs font-semibold">
              <button
                type="button"
                onClick={() => setViewMode("split")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                  viewMode === "split"
                    ? "bg-white dark:bg-[#2C2C2E] text-[#0071E3] dark:text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
                title="Cards + Terrain Map Side-by-Side"
              >
                <LayoutGrid className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Split View</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("list")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                  viewMode === "list"
                    ? "bg-white dark:bg-[#2C2C2E] text-[#0071E3] dark:text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
                title="Doctors Cards Only"
              >
                <SlidersHorizontal className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">List Only</span>
              </button>

              <button
                type="button"
                onClick={() => setViewMode("map")}
                className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 transition ${
                  viewMode === "map"
                    ? "bg-white dark:bg-[#2C2C2E] text-[#0071E3] dark:text-white shadow-xs"
                    : "text-gray-600 dark:text-gray-400 hover:text-gray-900"
                }`}
                title="Google Maps Terrain Fullscreen"
              >
                <MapIcon className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Terrain Map</span>
              </button>
            </div>

            <ThemeToggle />

            {/* Patient Account Pill (If registered / booked) */}
            {isLoggedIn && session && (
              <Link
                href="/patient/portal"
                className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/30 bg-emerald-50/80 dark:bg-emerald-950/40 px-3 py-1 text-xs font-semibold text-emerald-800 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition shadow-2xs"
                title="Open My Health Vault"
              >
                <div className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-600 text-white text-[9px] font-bold">
                  {(session.full_name?.[0] || "P").toUpperCase()}
                </div>
                <span className="hidden sm:inline max-w-[85px] truncate">{session.full_name?.split(" ")[0] || "Patient"}</span>
                {session.active_booking && (
                  <span className="rounded-full bg-emerald-600 px-1.5 py-0.2 text-[9px] font-bold text-white">
                    #{session.active_booking.token_number || 1}
                  </span>
                )}
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* =====================================================================
          MAIN 3-COLUMN VIEWPORT LAYOUT:
          - LEFT: STICKY FILTERS (Pinned)
          - CENTER: DOCTOR CARDS (The ONLY column that scrolls)
          - RIGHT: GOOGLE TERRAIN MAP (Pinned)
      ===================================================================== */}
      <div className="flex-1 min-h-0 w-full max-w-[1720px] mx-auto px-2 sm:px-4 py-2.5 overflow-hidden">
        <div className="flex flex-col lg:flex-row gap-3 h-full overflow-hidden items-stretch">

          {/* ===================================================================
              LEFT SIDEBAR: FILTERS (PINNED & STICKY ON LEFT - SLIM & COMPACT)
          =================================================================== */}
          <aside className="w-full lg:w-[170px] xl:w-[185px] shrink-0 h-full flex flex-col overflow-hidden">
            <div className="h-full flex flex-col rounded-2xl bg-white dark:bg-[#1C1C1E] border border-[#E5E7EB] dark:border-white/10 shadow-xs overflow-hidden">
              {/* Header: Filters & Clear All */}
              <div className="flex items-center justify-between px-2.5 py-2.5 border-b border-gray-100 dark:border-white/10 shrink-0">
                <h2 className="text-xs font-bold text-gray-900 dark:text-white flex items-center gap-1">
                  <Filter className="h-3 w-3 text-[#0071E3]" />
                  <span>Filters</span>
                </h2>
                <button
                  type="button"
                  onClick={handleClearAll}
                  className="text-[11px] font-bold text-[#0071E3] hover:underline transition"
                >
                  Clear All
                </button>
              </div>

              {/* Scrollable Filter Options */}
              <div className="flex-1 overflow-y-auto px-2.5 py-2.5 space-y-3 scrollbar-thin">
                {/* Active Filter Chips */}
                {(modeOnline || cityFilter || selectedSpecialty !== "All" || expRanges.length > 0) && (
                  <div className="flex flex-wrap gap-1 pb-2 border-b border-gray-100 dark:border-white/10">
                    {modeOnline && (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-[#0071E3] bg-[#EFF6FF] dark:bg-[#0071E3]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#0071E3] dark:text-[#60A5FA]">
                        <span>ONLINE</span>
                        <button type="button" onClick={() => setModeOnline(false)} className="hover:opacity-75">
                          <X className="h-2 w-2" />
                        </button>
                      </span>
                    )}

                    {cityFilter && (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-[#0071E3] bg-[#EFF6FF] dark:bg-[#0071E3]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#0071E3] dark:text-[#60A5FA]">
                        <span className="truncate max-w-[80px]">{cityFilter}</span>
                        <button type="button" onClick={() => setCityFilter("")} className="hover:opacity-75 shrink-0">
                          <X className="h-2 w-2" />
                        </button>
                      </span>
                    )}

                    {selectedSpecialty !== "All" && (
                      <span className="inline-flex items-center gap-0.5 rounded-full border border-[#0071E3] bg-[#EFF6FF] dark:bg-[#0071E3]/20 px-1.5 py-0.2 text-[9px] font-bold text-[#0071E3] dark:text-[#60A5FA]">
                        <span className="truncate max-w-[80px]">{selectedSpecialty}</span>
                        <button type="button" onClick={() => setSelectedSpecialty("All")} className="hover:opacity-75 shrink-0">
                          <X className="h-2 w-2" />
                        </button>
                      </span>
                    )}

                    {expRanges.map((exp) => (
                      <span
                        key={exp}
                        className="inline-flex items-center gap-0.5 rounded-full border border-gray-300 dark:border-white/20 bg-gray-50 dark:bg-white/5 px-1.5 py-0.2 text-[9px] font-semibold text-gray-700 dark:text-gray-300"
                      >
                        <span>{exp} Yrs</span>
                        <button type="button" onClick={() => toggleArrayItem(expRanges, exp, setExpRanges)} className="hover:opacity-75">
                          <X className="h-2 w-2" />
                        </button>
                      </span>
                    ))}
                  </div>
                )}

                {/* 1. Mode of Consult */}
                <div className="space-y-1.5">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Mode of Consult
                  </h3>
                  <div className="space-y-1 text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#0071E3]">
                      <input
                        type="checkbox"
                        checked={modeOnline}
                        onChange={(e) => setModeOnline(e.target.checked)}
                        className="h-3 w-3 rounded border-gray-300 text-[#0071E3] accent-[#0071E3]"
                      />
                      <span>Online Consult</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer hover:text-[#0071E3]">
                      <input
                        type="checkbox"
                        checked={modePhysical}
                        onChange={(e) => setModePhysical(e.target.checked)}
                        className="h-3 w-3 rounded border-gray-300 text-[#0071E3] accent-[#0071E3]"
                      />
                      <span>In-Clinic Visit</span>
                    </label>
                  </div>
                </div>

                {/* 2. Experience (In Years) */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-white/10">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Experience
                  </h3>
                  <div className="space-y-1 text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    {["0-5", "6-10", "11-16"].map((range) => (
                      <label key={range} className="flex items-center gap-1.5 cursor-pointer hover:text-[#0071E3]">
                        <input
                          type="checkbox"
                          checked={expRanges.includes(range)}
                          onChange={() => toggleArrayItem(expRanges, range, setExpRanges)}
                          className="h-3 w-3 rounded border-gray-300 text-[#0071E3] accent-[#0071E3]"
                        />
                        <span>{range} Years</span>
                      </label>
                    ))}
                    <button
                      type="button"
                      onClick={() => toggleArrayItem(expRanges, "16+", setExpRanges)}
                      className={`text-[11px] font-bold transition flex items-center gap-1 ${
                        expRanges.includes("16+") ? "text-[#0071E3]" : "text-[#0071E3] hover:underline"
                      }`}
                    >
                      {expRanges.includes("16+") ? "✓ 16+ Years" : "+ 16+ Years"}
                    </button>
                  </div>
                </div>

                {/* 3. Fees (In Rupees) */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-white/10">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Fee Budget
                  </h3>
                  <div className="space-y-1 text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    {["100-500", "500-1000", "1000+"].map((fee) => (
                      <label key={fee} className="flex items-center gap-1.5 cursor-pointer hover:text-[#0071E3]">
                        <input
                          type="checkbox"
                          checked={feeRanges.includes(fee)}
                          onChange={() => toggleArrayItem(feeRanges, fee, setFeeRanges)}
                          className="h-3 w-3 rounded border-gray-300 text-[#0071E3] accent-[#0071E3]"
                        />
                        <span>₹{fee}</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 4. Gender */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-white/10">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Gender
                  </h3>
                  <div className="space-y-1 text-[11px] font-medium text-gray-700 dark:text-gray-300">
                    {["Male", "Female"].map((gender) => (
                      <label key={gender} className="flex items-center gap-1.5 cursor-pointer hover:text-[#0071E3]">
                        <input
                          type="checkbox"
                          checked={selectedGenders.includes(gender)}
                          onChange={() => toggleArrayItem(selectedGenders, gender, setSelectedGenders)}
                          className="h-3 w-3 rounded border-gray-300 text-[#0071E3] accent-[#0071E3]"
                        />
                        <span>{gender} Doctors</span>
                      </label>
                    ))}
                  </div>
                </div>

                {/* 5. Speciality Selector */}
                <div className="space-y-1.5 pt-2 border-t border-gray-100 dark:border-white/10">
                  <h3 className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    Speciality
                  </h3>
                  <select
                    value={selectedSpecialty}
                    onChange={(e) => setSelectedSpecialty(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 bg-gray-50 px-1.5 py-1 text-[11px] font-medium text-gray-900 focus:border-[#0071E3] focus:outline-none dark:border-white/15 dark:bg-[#2C2C2E] dark:text-white"
                  >
                    <option value="All">All Specialities</option>
                    <option value="Gastroenterology">Gastroenterology</option>
                    <option value="Dermatology">Dermatology</option>
                    <option value="General Physician">General Physician</option>
                    <option value="Paediatrics">Paediatrics</option>
                    <option value="Cardiology">Cardiology</option>
                    <option value="Dentistry">Dentistry</option>
                    <option value="Gynaecology">Gynaecology</option>
                    <option value="Orthopaedics">Orthopaedics</option>
                    <option value="ENT">ENT</option>
                  </select>
                </div>
              </div>

              {/* Direct Booking Promise Footer */}
              <div className="px-2.5 py-1.5 border-t border-gray-100 dark:border-white/10 text-[10px] text-[#008778] font-semibold flex items-center gap-1 shrink-0 bg-gray-50/50 dark:bg-white/5">
                <ShieldCheck className="h-3 w-3 shrink-0" />
                <span>0% Markup Direct Fee</span>
              </div>
            </div>
          </aside>

          {/* ===================================================================
              CENTER COLUMN: DOCTOR CARDS (THE ONLY COLUMN THAT SCROLLS)
          =================================================================== */}
          <main
            className={`${
              viewMode === "split"
                ? "flex-1 min-w-0"
                : viewMode === "list"
                ? "flex-1 min-w-0"
                : "hidden"
            } h-full flex flex-col overflow-hidden`}
          >
            {/* Pinned Top Search Input Box & Result Counter */}
            <div className="shrink-0 space-y-1.5 pb-2">
              <div className="relative">
                <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search doctors, specialities, symptoms (e.g. Gastroenterologist, Acne, Root Canal)..."
                  className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2 text-xs sm:text-sm text-gray-900 placeholder:text-gray-400 shadow-2xs focus:border-[#0071E3] focus:outline-none dark:border-white/10 dark:bg-[#1C1C1E] dark:text-white"
                />
              </div>

              <div className="flex items-center justify-between text-xs font-semibold text-gray-500 px-1">
                <span>
                  Showing <strong className="text-gray-900 dark:text-white">{filteredDoctors.length}</strong> verified specialists
                </span>
                <span className="text-[#008778] text-[11px] font-medium hidden sm:inline">
                  ● Direct Chamber Booking • Zero Platform Markup
                </span>
              </div>
            </div>

            {/* Scrollable Doctor Cards List */}
            <div className="flex-1 overflow-y-auto space-y-2.5 pr-1.5 pb-8 scrollbar-thin">
              {filteredDoctors.length === 0 ? (
                <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center dark:border-white/10 dark:bg-[#1C1C1E]">
                  <Stethoscope className="mx-auto h-8 w-8 text-gray-400" />
                  <h3 className="mt-2 text-sm font-bold text-gray-900 dark:text-white">
                    No doctors match your filters
                  </h3>
                  <p className="mt-1 text-xs text-gray-500">
                    Try clearing your filter chips or search keyword to see all available specialists.
                  </p>
                  <button
                    type="button"
                    onClick={handleClearAll}
                    className="mt-3 rounded-full bg-[#0071E3] px-4 py-1.5 text-xs font-bold text-white shadow-xs hover:bg-[#0077ED] transition"
                  >
                    Reset All Filters
                  </button>
                </div>
              ) : (
                filteredDoctors.map((doc) => {
                  const isSelected = activeDoctor?.slug === doc.slug;

                  return (
                    <div
                      key={doc.slug}
                      onMouseEnter={() => setActiveDoctor(doc)}
                      onClick={() => setActiveDoctor(doc)}
                      className={`group relative rounded-2xl border bg-white dark:bg-[#1C1C1E] p-3 sm:p-3.5 shadow-xs transition-all duration-150 cursor-pointer hover:shadow-md ${
                        isSelected
                          ? "border-[#0071E3] ring-2 ring-[#0071E3]/25 shadow-md"
                          : "border-[#E5E7EB] hover:border-gray-300 dark:border-white/10 dark:hover:border-white/25"
                      }`}
                    >
                      {/* Top Horizontal Section: Doctor Details on Left, Booking Box on Right */}
                      <div className="flex flex-col sm:flex-row items-start justify-between gap-3">
                        {/* Left: Doctor Portrait + Clinical Details */}
                        <div className="flex items-start gap-3 flex-1 min-w-0">
                          {/* Doctor Portrait */}
                          <div className="relative shrink-0">
                            <DoctorPortrait
                              name={doc.full_name}
                              avatarUrl={doc.avatar_url}
                              gender={doc.gender}
                              className="h-16 w-16 sm:h-20 sm:w-20 rounded-xl"
                            />
                            {doc.online_available && (
                              <span className="absolute -bottom-1 -right-1 flex items-center gap-1 rounded-full bg-emerald-600 px-1.5 py-0.5 text-[8.5px] font-bold text-white shadow-xs">
                                <span className="h-1.5 w-1.5 rounded-full bg-white animate-pulse" />
                                <span>Online</span>
                              </span>
                            )}
                          </div>

                          {/* Middle: Doctor Details */}
                          <div className="min-w-0 flex-1 space-y-0.5">
                            {/* Line 1: Doctor Name, Info, NMC Badge, Rating */}
                            <div className="flex items-center gap-1.5 flex-wrap">
                              <h3 className="text-sm sm:text-base font-bold text-gray-900 dark:text-white group-hover:text-[#0071E3] transition truncate">
                                {doc.full_name}
                              </h3>
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setInfoModalDoctor(doc);
                                }}
                                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition p-0.5"
                                title="View medical registration & credentials"
                              >
                                <Info className="h-3.5 w-3.5" />
                              </button>

                              {/* NMC Medical Registration Pill */}
                              {doc.nmc_reg_no && (
                                <span className="inline-flex items-center gap-1 rounded bg-sky-50 dark:bg-sky-950/40 px-1.5 py-0.2 text-[9.5px] font-semibold text-sky-700 dark:text-sky-300 border border-sky-200 dark:border-sky-800/40">
                                  <CheckCircle2 className="h-2 w-2 text-sky-600" />
                                  <span>{doc.nmc_reg_no}</span>
                                </span>
                              )}

                              {/* Patient Satisfaction Rating */}
                              <span className="inline-flex items-center gap-1 text-[10.5px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 px-1.5 py-0.2 rounded border border-emerald-200 dark:border-emerald-800/40">
                                <ThumbsUp className="h-2.5 w-2.5 fill-emerald-600" />
                                <span>{Math.round(doc.rating * 19)}% ({doc.total_reviews} Patients)</span>
                              </span>
                            </div>

                            {/* Line 2: Speciality, Experience & Qualifications */}
                            <div className="flex items-center gap-1.5 flex-wrap text-xs pt-0.5">
                              <span className="font-bold text-[#0071E3] dark:text-[#38BDF8]">
                                {doc.specialization}
                              </span>
                              <span className="text-gray-300 dark:text-white/20">•</span>
                              <span className="font-semibold text-gray-700 dark:text-gray-300">
                                {doc.years_of_experience} Yrs Exp
                              </span>
                              <span className="text-gray-300 dark:text-white/20">•</span>
                              <span className="text-[11px] text-gray-500 dark:text-gray-400 font-medium truncate uppercase tracking-tight max-w-[200px] sm:max-w-xs">
                                {doc.qualification_summary}
                              </span>
                            </div>

                            {/* Line 3: Clinic Location, Distance, Wait Time & Languages */}
                            <div className="flex items-center gap-2 text-[11px] text-gray-600 dark:text-gray-400 flex-wrap pt-0.5">
                              <span className="flex items-center gap-1 font-medium text-gray-800 dark:text-gray-200 truncate max-w-[180px] sm:max-w-xs">
                                <MapPin className="h-3 w-3 text-gray-400 shrink-0" />
                                <span>{doc.clinic_name} ({doc.locality})</span>
                              </span>
                              {doc.distance_km && (
                                <>
                                  <span className="text-gray-300 dark:text-white/20">•</span>
                                  <span className="text-gray-500 font-medium">{doc.distance_km}</span>
                                </>
                              )}
                              <span className="text-gray-300 dark:text-white/20">•</span>
                              <span className="text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                                <span>{doc.wait_time}</span>
                              </span>
                              {doc.languages && doc.languages.length > 0 && (
                                <>
                                  <span className="text-gray-300 dark:text-white/20 hidden md:inline">•</span>
                                  <span className="text-gray-500 dark:text-gray-400 hidden md:inline">
                                    Speaks: {doc.languages.join(", ")}
                                  </span>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Right: Guarantee, Next Slot, Price & Action Button */}
                        <div className="flex sm:flex-col items-end justify-between sm:justify-center gap-1.5 text-right shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-gray-100 dark:border-white/10 w-full sm:w-auto sm:min-w-[145px] xl:min-w-[160px]">
                          {/* Guarantee Badge */}
                          {doc.on_time_guarantee ? (
                            <span className="rounded bg-[#08214D] px-2 py-0.5 text-[8.5px] font-black uppercase tracking-wider text-white">
                              ON TIME GUARANTEE
                            </span>
                          ) : (
                            <span className="rounded bg-emerald-900/90 px-1.5 py-0.5 text-[8.5px] font-bold text-emerald-100">
                              VERIFIED CLINIC
                            </span>
                          )}

                          {/* Next Available Slot Indicator */}
                          <div className="rounded bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200/60 dark:border-emerald-800/40 px-1.5 py-0.5 text-left w-full sm:w-auto">
                            <div className="text-[9px] font-bold text-emerald-800 dark:text-emerald-300 flex items-center gap-1">
                              <Clock className="h-2.5 w-2.5 text-emerald-600" />
                              <span>Next: <strong className="text-emerald-950 dark:text-emerald-200 font-extrabold">{doc.next_available_slot || "Today"}</strong></span>
                            </div>
                          </div>

                          {/* Fee & Zero Markup */}
                          <div className="text-right">
                            <div className="text-base sm:text-lg font-black text-gray-900 dark:text-white font-mono leading-tight">
                              ₹{doc.consultation_fee}
                            </div>
                            <div className="text-[9px] text-gray-400 dark:text-gray-500 font-medium">
                              Zero Platform Fee
                            </div>
                          </div>

                          {/* Action Buttons: Clinic Visit & Video Consult */}
                          <div className="flex items-center sm:flex-col gap-1 w-full">
                            <Link
                              href={`/book?doctor=${doc.slug}`}
                              onClick={(e) => e.stopPropagation()}
                              className="flex-1 sm:w-full inline-flex items-center justify-center rounded-lg bg-[#0071E3] px-3 py-1.5 text-xs font-bold text-white shadow-2xs hover:bg-[#0077ED] transition active:scale-95 text-center"
                            >
                              Book Clinic Visit
                            </Link>
                            {doc.online_available && (
                              <Link
                                href={`/book?doctor=${doc.slug}&mode=video`}
                                onClick={(e) => e.stopPropagation()}
                                className="flex-1 sm:w-full inline-flex items-center justify-center rounded-lg border border-[#0071E3] bg-white px-2 py-1 text-[10.5px] font-bold text-[#0071E3] hover:bg-[#EFF6FF] dark:bg-transparent dark:border-[#38BDF8] dark:text-[#38BDF8] dark:hover:bg-white/5 transition active:scale-95 text-center"
                              >
                                Video Consult
                              </Link>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Bottom Row: Services Tags on Left & Patient Review Quote on Right (Single Horizontal Row) */}
                      {((doc.services && doc.services.length > 0) || doc.patient_story_snippet) && (
                        <div className="mt-2 pt-2 border-t border-gray-100 dark:border-white/10 flex flex-col sm:flex-row sm:items-center justify-between gap-2 overflow-hidden">
                          {/* Left: Horizontal Services Chips */}
                          {doc.services && doc.services.length > 0 && (
                            <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto scrollbar-none py-0.5">
                              <span className="text-[10px] font-bold text-gray-500 dark:text-gray-400 shrink-0">
                                Focus:
                              </span>
                              <div className="flex items-center gap-1 shrink-0">
                                {doc.services.map((service, idx) => (
                                  <span
                                    key={idx}
                                    className="inline-block rounded bg-gray-100 dark:bg-white/5 px-1.5 py-0.5 text-[9.5px] font-medium text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-white/10 whitespace-nowrap"
                                  >
                                    {service}
                                  </span>
                                ))}
                              </div>
                            </div>
                          )}

                          {/* Right: Patient Testimonial Quote in Single Horizontal Line */}
                          {doc.patient_story_snippet && (
                            <div className="flex items-center gap-1.5 text-[11px] text-gray-500 dark:text-gray-400 italic truncate min-w-0 max-w-full sm:max-w-xs md:max-w-sm lg:max-w-md">
                              <MessageSquareQuote className="h-3 w-3 text-[#0071E3] shrink-0 not-italic" />
                              <span className="truncate">"{doc.patient_story_snippet}"</span>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </main>

          {/* ===================================================================
              RIGHT COLUMN: GOOGLE MAPS TERRAIN MODE (PINNED & STICKY ON RIGHT)
          =================================================================== */}
          <aside
            className={`${
              viewMode === "split"
                ? "w-full lg:w-[355px] xl:w-[410px] 2xl:w-[460px] shrink-0"
                : viewMode === "map"
                ? "flex-1 min-w-0"
                : "hidden"
            } h-full flex flex-col overflow-hidden`}
          >
            <div className="flex-1 w-full h-full flex flex-col overflow-hidden">
              <GoogleTerrainMap
                doctors={filteredDoctors}
                activeDoctor={activeDoctor}
                onSelectDoctor={(doc) => setActiveDoctor(doc)}
                className="flex-1 w-full h-full rounded-2xl"
              />

              {/* Helper legend underneath map in Split View */}
              <div className="mt-2 shrink-0 flex items-center justify-between rounded-xl bg-white dark:bg-[#1C1C1E] px-3 py-1.5 border border-gray-200 dark:border-white/10 text-[11px] text-gray-500 shadow-2xs">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full bg-[#188038]" />
                  <span>Google Terrain Elevation: 600m - 1400m</span>
                </span>
                <span className="font-semibold text-gray-900 dark:text-white">
                  Dehradun Medical Grid
                </span>
              </div>
            </div>
          </aside>

        </div>
      </div>

      {/* =====================================================================
          DOCTOR INFO CREDENTIALS MODAL (When clicking ⓘ info icon)
      ===================================================================== */}
      {infoModalDoctor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-[#1C1C1E] border border-gray-200 dark:border-white/10">
            <button
              type="button"
              onClick={() => setInfoModalDoctor(null)}
              className="absolute right-4 top-4 rounded-full p-1 text-gray-400 hover:bg-gray-100 dark:hover:bg-white/10 transition"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="flex items-center gap-3">
              <DoctorPortrait
                name={infoModalDoctor.full_name}
                avatarUrl={infoModalDoctor.avatar_url}
                gender={infoModalDoctor.gender}
              />
              <div>
                <h3 className="text-base font-bold text-gray-900 dark:text-white">
                  {infoModalDoctor.full_name}
                </h3>
                <p className="text-xs text-gray-500">{infoModalDoctor.specialization}</p>
                <div className="mt-1 flex items-center gap-1 text-xs font-bold text-emerald-600">
                  <ShieldCheck className="h-3.5 w-3.5" />
                  <span>NMC Registered & Verified</span>
                </div>
              </div>
            </div>

            <div className="mt-4 space-y-2 border-t border-gray-100 dark:border-white/10 pt-4 text-xs text-gray-600 dark:text-gray-300">
              <p>
                <strong className="text-gray-900 dark:text-white">Qualifications:</strong>{" "}
                {infoModalDoctor.qualification_summary}
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Clinical Experience:</strong>{" "}
                {infoModalDoctor.years_of_experience} Years
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">Clinic Address:</strong>{" "}
                {infoModalDoctor.clinic_address}
              </p>
              <p>
                <strong className="text-gray-900 dark:text-white">DocSphere Promise:</strong> Direct
                booking at doctor's original consultation fee. 0% aggregator surcharge.
              </p>
            </div>

            <div className="mt-6 flex items-center gap-3">
              <Link
                href={`/book?doctor=${infoModalDoctor.slug}`}
                className="flex-1 rounded-xl bg-[#0071E3] py-2.5 text-center text-xs font-bold text-white shadow-sm hover:bg-[#0077ED] transition"
              >
                Book Direct Consultation (₹{infoModalDoctor.consultation_fee})
              </Link>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function SearchDiscoveryPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F5F6F8] dark:bg-[#121212] flex items-center justify-center text-xs font-semibold text-gray-400">
          Loading DocSphere Discovery...
        </div>
      }
    >
      <SearchDiscoveryContent />
    </Suspense>
  );
}
