"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  LayoutGrid
} from "lucide-react";
import InteractiveClinicMap from "@/components/InteractiveClinicMap";

// Pre-seeded Dehradun Doctors Directory
const DEHRADUN_DOCTORS = [
  {
    slug: "dr-rahul-sharma",
    full_name: "Dr. Rahul Sharma",
    title: "Dr.",
    specialization: "Dermatologist",
    qualification_summary: "MBBS, MD (Dermatology)",
    years_of_experience: 12,
    rating: 4.9,
    total_reviews: 142,
    consultation_fee: 600,
    clinic_name: "Derma Care Skin & Laser Centre",
    clinic_slug: "derma-care-dehradun",
    clinic_address: "14, Rajpur Road, Near Ashley Hall, Dehradun",
    locality: "Rajpur Road",
    services: ["Acne & Scar Laser", "Eczema Therapy", "PRP Hair Loss", "Chemical Peels"],
    next_token: 4,
    wait_time: "10-15 mins",
    lat: 30.3255,
    lng: 78.0436
  },
  {
    slug: "dr-aditi-joshi",
    full_name: "Dr. Aditi Joshi",
    title: "Dr.",
    specialization: "Dentist",
    qualification_summary: "BDS, MDS (Endodontics)",
    years_of_experience: 8,
    rating: 4.8,
    total_reviews: 98,
    consultation_fee: 400,
    clinic_name: "Smile Craft Multi-Speciality Dental",
    clinic_slug: "smile-craft-dental",
    clinic_address: "42, EC Road, Near Survey Chowk, Dehradun",
    locality: "EC Road",
    services: ["Single Sitting RCT", "Invisible Braces", "Teeth Whitening", "Dental Implants"],
    next_token: 2,
    wait_time: "5-10 mins",
    lat: 30.3204,
    lng: 78.0489
  },
  {
    slug: "dr-vikram-sethi",
    full_name: "Dr. Vikram Sethi",
    title: "Dr.",
    specialization: "Pediatrician",
    qualification_summary: "MBBS, DCH, DNB (Pediatrics)",
    years_of_experience: 15,
    rating: 4.95,
    total_reviews: 210,
    consultation_fee: 500,
    clinic_name: "Dron Child & Newborn Health Centre",
    clinic_slug: "dron-child-clinic",
    clinic_address: "88, Chakrata Road, Near Ballupur Chowk, Dehradun",
    locality: "Chakrata Road",
    services: ["Newborn Care", "Vaccination Schedule", "Childhood Asthma", "Milestones"],
    next_token: 5,
    wait_time: "15-20 mins",
    lat: 30.3342,
    lng: 78.0125
  }
];

export default function SearchDiscoveryPage() {
  const [query, setQuery] = useState("");
  const [selectedLocality, setSelectedLocality] = useState("All");
  const [selectedSpecialty, setSelectedSpecialty] = useState("All");
  const [maxFee, setMaxFee] = useState<number>(1000);
  const [filteredDoctors, setFilteredDoctors] = useState(DEHRADUN_DOCTORS);
  const [activeDoctorOnMap, setActiveDoctorOnMap] = useState<any>(DEHRADUN_DOCTORS[0]);
  const [viewMode, setViewMode] = useState<"split" | "list" | "map">("split");

  // Filter effect
  useEffect(() => {
    let list = DEHRADUN_DOCTORS;

    if (query.trim()) {
      const qLower = query.toLowerCase();
      list = list.filter(d => 
        d.full_name.toLowerCase().includes(qLower) ||
        d.specialization.toLowerCase().includes(qLower) ||
        d.clinic_name.toLowerCase().includes(qLower) ||
        d.services.some(s => s.toLowerCase().includes(qLower)) ||
        d.clinic_address.toLowerCase().includes(qLower)
      );
    }

    if (selectedLocality !== "All") {
      list = list.filter(d => d.locality.toLowerCase() === selectedLocality.toLowerCase());
    }

    if (selectedSpecialty !== "All") {
      list = list.filter(d => d.specialization.toLowerCase() === selectedSpecialty.toLowerCase());
    }

    list = list.filter(d => d.consultation_fee <= maxFee);

    setFilteredDoctors(list);
    if (list.length > 0) {
      setActiveDoctorOnMap(list[0]);
    }
  }, [query, selectedLocality, selectedSpecialty, maxFee]);

  const quickTags = [
    { label: "Acne & Skin", q: "Acne" },
    { label: "Painless Root Canal", q: "Root Canal" },
    { label: "Child Vaccination", q: "Vaccination" },
    { label: "Rajpur Road Clinics", loc: "Rajpur Road" },
    { label: "EC Road Clinics", loc: "EC Road" }
  ];

  return (
    <div className="min-h-screen bg-[#ECEEF2] text-[#1D1D1F] dark:bg-black dark:text-[#F5F5F7] flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 apple-glass border-b border-black/[0.06] dark:border-white/[0.08]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-apple-blue text-white shadow-sm">
              <Stethoscope className="h-5 w-5" />
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-base font-bold text-[#1D1D1F] dark:text-white">DocSphere</span>
              <span className="text-xs font-semibold text-[#86868B]">Discovery</span>
            </div>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-1.5 text-xs font-medium text-[#86868B] dark:text-[#8E8E93]">
              <MapPin className="h-3.5 w-3.5 text-apple-teal" />
              <span>Location: <strong className="text-[#1D1D1F] dark:text-white font-medium">Dehradun, Uttarakhand</strong></span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Search & Discovery Section */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 lg:px-8">
        {/* Search & Filter Bar */}
        <div className="rounded-[24px] border border-black/[0.06] bg-white p-5 shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-[#86868B]" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search doctors, specializations, symptoms (e.g. acne, root canal, pediatrician)..."
                className="w-full rounded-xl border border-black/[0.08] bg-[#ECEEF2]/70 pl-10 pr-4 py-2.5 text-xs text-[#1D1D1F] placeholder:text-[#86868B] focus:border-apple-blue focus:outline-none focus:ring-2 focus:ring-apple-blue/20 dark:border-white/[0.1] dark:bg-black/40 dark:text-white"
              />
            </div>

            {/* Locality Selector */}
            <select
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
              className="rounded-xl border border-black/[0.08] bg-[#ECEEF2]/70 px-3 py-2.5 text-xs text-[#1D1D1F] focus:border-apple-blue focus:outline-none focus:ring-2 focus:ring-apple-blue/20 dark:border-white/[0.1] dark:bg-black/40 dark:text-[#F5F5F7]"
            >
              <option value="All">All Dehradun Localities</option>
              <option value="Rajpur Road">Rajpur Road</option>
              <option value="EC Road">EC Road</option>
              <option value="Chakrata Road">Chakrata Road</option>
            </select>

            {/* Specialty Selector */}
            <select
              value={selectedSpecialty}
              onChange={(e) => setSelectedSpecialty(e.target.value)}
              className="rounded-xl border border-black/[0.08] bg-[#ECEEF2]/70 px-3 py-2.5 text-xs text-[#1D1D1F] focus:border-apple-blue focus:outline-none focus:ring-2 focus:ring-apple-blue/20 dark:border-white/[0.1] dark:bg-black/40 dark:text-[#F5F5F7]"
            >
              <option value="All">All Specialties</option>
              <option value="Dermatologist">Dermatology</option>
              <option value="Dentist">Dentistry</option>
              <option value="Pediatrician">Pediatrics</option>
            </select>
          </div>

          {/* Quick Filter Pills */}
          <div className="mt-3.5 flex flex-wrap items-center gap-2 pt-3 border-t border-black/[0.04] dark:border-white/[0.06]">
            <span className="text-[11px] font-semibold text-[#86868B] flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-apple-blue" /> Quick:
            </span>
            {quickTags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (tag.q) setQuery(tag.q);
                  if (tag.loc) setSelectedLocality(tag.loc);
                }}
                className="rounded-full border border-black/[0.04] bg-[#ECEEF2]/60 px-3 py-1 text-[11px] font-medium text-[#1D1D1F] hover:bg-white dark:border-white/[0.06] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] dark:hover:bg-[#3A3A3C] transition active:scale-95"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Switcher Header */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs font-semibold text-[#86868B]">
            <span>Showing {filteredDoctors.length} verified doctors in Dehradun • Live Token Queue</span>
          </div>

          <div className="flex items-center gap-1 rounded-full border border-black/[0.04] bg-black/[0.03] p-1 dark:border-white/[0.06] dark:bg-white/[0.06]">
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                viewMode === "split"
                  ? "bg-white text-[#1D1D1F] shadow-apple-sm dark:bg-[#2C2C2E] dark:text-white"
                  : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                viewMode === "list"
                  ? "bg-white text-[#1D1D1F] shadow-apple-sm dark:bg-[#2C2C2E] dark:text-white"
                  : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">List Only</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1 rounded-full px-3 py-1 text-xs font-semibold transition ${
                viewMode === "map"
                  ? "bg-white text-[#1D1D1F] shadow-apple-sm dark:bg-[#2C2C2E] dark:text-white"
                  : "text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
              }`}
            >
              <MapIcon className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Map Only</span>
            </button>
          </div>
        </div>

        {/* Results Layout: Dynamic Split, Full List, or Full Map */}
        <div className="mt-4 grid gap-6 lg:grid-cols-12">
          {/* Doctors List Column */}
          {viewMode !== "map" && (
            <div className={`${viewMode === "list" ? "lg:col-span-12" : "lg:col-span-7"} space-y-4`}>
              {filteredDoctors.length === 0 ? (
                <div className="rounded-[24px] border border-black/[0.06] bg-white p-12 text-center shadow-apple-card dark:border-white/[0.08] dark:bg-[#1C1C1E]">
                  <Stethoscope className="mx-auto h-8 w-8 text-[#86868B]" />
                  <h3 className="mt-2 text-sm font-bold text-[#1D1D1F] dark:text-white">No doctors match your search</h3>
                  <p className="mt-1 text-xs text-[#86868B]">Try broadening your search keyword or clearing the locality filter.</p>
                  <button
                    onClick={() => { setQuery(""); setSelectedLocality("All"); setSelectedSpecialty("All"); }}
                    className="mt-4 rounded-full bg-apple-blue px-4 py-2 text-xs font-semibold text-white shadow-apple-sm hover:bg-[#0077ED] active:scale-95 transition"
                  >
                    Reset Filters
                  </button>
                </div>
              ) : (
                filteredDoctors.map((doc) => (
                  <div
                    key={doc.slug}
                    onMouseEnter={() => setActiveDoctorOnMap(doc)}
                    onClick={() => setActiveDoctorOnMap(doc)}
                    className={`cursor-pointer rounded-[24px] border bg-white p-5 shadow-apple-card transition-all hover:shadow-apple-modal dark:bg-[#1C1C1E] ${
                      activeDoctorOnMap?.slug === doc.slug ? "border-apple-blue ring-1 ring-apple-blue" : "border-black/[0.06] dark:border-white/[0.08]"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-apple-teal/10 text-apple-teal dark:bg-apple-teal/20 dark:text-[#30D1BE] font-bold text-base">
                          {doc.full_name.split(" ")[1]?.[0] || "D"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/doctors/${doc.slug}`} className="text-base font-bold text-[#1D1D1F] hover:text-apple-blue dark:text-white transition">
                              {doc.full_name}
                            </Link>
                            <span className="flex items-center gap-1 rounded-full bg-apple-teal/10 px-2.5 py-0.5 text-[10px] font-semibold text-apple-teal dark:bg-apple-teal/20 dark:text-[#30D1BE]">
                              <ShieldCheck className="h-3 w-3" /> NMC Verified
                            </span>
                          </div>
                          <p className="text-xs text-[#86868B]">
                            {doc.specialization} • {doc.qualification_summary} ({doc.years_of_experience} yrs exp)
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center sm:justify-end gap-1 text-xs font-bold text-[#1D1D1F] dark:text-white font-mono">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {doc.rating}
                          <span className="text-[11px] font-normal text-[#86868B]">({doc.total_reviews})</span>
                        </div>
                        <div className="text-xs font-bold text-[#1D1D1F] dark:text-white mt-1 font-mono">
                          ₹{doc.consultation_fee} <span className="text-[10px] font-normal text-[#86868B]">fee</span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-[#86868B] flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-[#86868B] shrink-0" />
                      <strong className="text-[#1D1D1F] dark:text-white font-medium">{doc.clinic_name}</strong> — {doc.clinic_address}
                    </p>

                    {/* Services tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {doc.services.map((s: string, idx: number) => (
                        <span key={idx} className="rounded-full bg-[#ECEEF2]/70 px-2.5 py-0.5 text-[10px] font-medium text-[#1D1D1F] border border-black/[0.04] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] dark:border-white/[0.06]">
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Live Token Status & Action Footer */}
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-black/[0.04] dark:border-white/[0.06] pt-3 text-xs">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1.5 font-semibold text-[#30D158]">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#30D158] opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-[#30D158]"></span>
                          </span>
                          Next Token: #{doc.next_token}
                        </span>
                        <span className="text-[#86868B]">•</span>
                        <span className="text-[#86868B] flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> Wait: {doc.wait_time}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(doc.clinic_address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-full border border-black/[0.08] bg-white px-3.5 py-1.5 text-xs font-medium text-[#1D1D1F] hover:bg-black/[0.02] dark:border-white/[0.12] dark:bg-[#2C2C2E] dark:text-white active:scale-95 transition"
                        >
                          <Navigation className="inline h-3 w-3 text-apple-blue mr-1" /> Directions
                        </a>
                        <Link
                          href={`/book?doctor=${doc.slug}`}
                          className="apple-btn rounded-full bg-apple-blue hover:bg-[#0077ED] px-4 py-1.5 text-xs font-semibold text-white shadow-apple-sm active:scale-95 transition"
                        >
                          Book Token #{doc.next_token}
                        </Link>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          )}

          {/* Interactive Map Column */}
          {viewMode !== "list" && (
            <div className={`${viewMode === "map" ? "lg:col-span-12" : "lg:col-span-5"}`}>
              <div className="sticky top-24 rounded-[24px] overflow-hidden border border-black/[0.06] dark:border-white/[0.08] shadow-apple-card">
                <InteractiveClinicMap
                  doctors={filteredDoctors}
                  activeDoctor={activeDoctorOnMap}
                  onSelectDoctor={setActiveDoctorOnMap}
                />
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
