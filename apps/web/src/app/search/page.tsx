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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex flex-col">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-slate-800 dark:bg-slate-900/95">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <Link href="/" className="flex items-center gap-2 font-bold text-slate-900 dark:text-white">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-white">
              <Stethoscope className="h-5 w-5" />
            </div>
            DocSphere <span className="text-xs font-semibold text-brand-600">Discovery</span>
          </Link>
          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
              <MapPin className="h-4 w-4 text-brand-600" />
              Location: <strong className="text-slate-900 dark:text-white">Dehradun, Uttarakhand</strong>
            </div>
          </div>
        </div>
      </header>

      {/* Main Search & Discovery Section */}
      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 lg:px-8">
        {/* Search & Filter Bar */}
        <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search doctors, specializations, symptoms (e.g. acne, root canal, pediatrician)..."
                className="w-full rounded-xl border border-slate-300 pl-10 pr-4 py-2.5 text-xs text-slate-900 shadow-sm focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
              />
            </div>

            {/* Locality Selector */}
            <select
              value={selectedLocality}
              onChange={(e) => setSelectedLocality(e.target.value)}
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-700 bg-white focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
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
              className="rounded-xl border border-slate-300 px-3 py-2.5 text-xs text-slate-700 bg-white focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-slate-300"
            >
              <option value="All">All Specialties</option>
              <option value="Dermatologist">Dermatology</option>
              <option value="Dentist">Dentistry</option>
              <option value="Pediatrician">Pediatrics</option>
            </select>
          </div>

          {/* Quick Filter Pills */}
          <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-[11px] font-semibold text-slate-500 flex items-center gap-1">
              <Sparkles className="h-3 w-3 text-brand-600" /> Quick:
            </span>
            {quickTags.map((tag, idx) => (
              <button
                key={idx}
                onClick={() => {
                  if (tag.q) setQuery(tag.q);
                  if (tag.loc) setSelectedLocality(tag.loc);
                }}
                className="rounded-lg bg-slate-100 px-2.5 py-1 text-[11px] font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700 dark:bg-slate-800 dark:text-slate-300"
              >
                {tag.label}
              </button>
            ))}
          </div>
        </div>

        {/* View Mode Switcher Header */}
        <div className="mt-6 flex items-center justify-between">
          <div className="text-xs font-semibold text-slate-500">
            <span>Showing {filteredDoctors.length} verified doctors in Dehradun • Live Token Queue</span>
          </div>

          <div className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white p-1 shadow-sm dark:border-slate-800 dark:bg-slate-900">
            <button
              onClick={() => setViewMode("split")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "split"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <LayoutGrid className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Split View</span>
            </button>
            <button
              onClick={() => setViewMode("list")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "list"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
              }`}
            >
              <SlidersHorizontal className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">List Only</span>
            </button>
            <button
              onClick={() => setViewMode("map")}
              className={`flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-semibold transition ${
                viewMode === "map"
                  ? "bg-brand-600 text-white shadow-sm"
                  : "text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
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
                <div className="rounded-2xl border border-slate-200 bg-white p-12 text-center shadow-sm dark:border-slate-800 dark:bg-slate-900">
                  <Stethoscope className="mx-auto h-8 w-8 text-slate-400" />
                  <h3 className="mt-2 text-sm font-bold text-slate-900 dark:text-white">No doctors match your search</h3>
                  <p className="mt-1 text-xs text-slate-500">Try broadening your search keyword or clearing the locality filter.</p>
                  <button
                    onClick={() => { setQuery(""); setSelectedLocality("All"); setSelectedSpecialty("All"); }}
                    className="mt-4 rounded-lg bg-brand-600 px-4 py-2 text-xs font-semibold text-white"
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
                    className={`cursor-pointer rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-900 ${
                      activeDoctorOnMap?.slug === doc.slug ? "border-brand-500 ring-1 ring-brand-500" : "border-slate-200 dark:border-slate-800"
                    }`}
                  >
                    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="flex items-center gap-3">
                        <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-teal-50 text-brand-600 dark:bg-teal-950 font-bold text-base">
                          {doc.full_name.split(" ")[1]?.[0] || "D"}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <Link href={`/doctors/${doc.slug}`} className="text-base font-bold text-slate-900 hover:text-brand-600 dark:text-white">
                              {doc.full_name}
                            </Link>
                            <span className="flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-950 dark:text-emerald-300">
                              <ShieldCheck className="h-3 w-3" /> NMC Verified
                            </span>
                          </div>
                          <p className="text-xs text-slate-500">
                            {doc.specialization} • {doc.qualification_summary} ({doc.years_of_experience} yrs exp)
                          </p>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="flex items-center sm:justify-end gap-1 text-xs font-bold text-slate-900 dark:text-white">
                          <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400" /> {doc.rating}
                          <span className="text-[11px] font-normal text-slate-500">({doc.total_reviews})</span>
                        </div>
                        <div className="text-xs font-black text-slate-900 dark:text-white mt-1">
                          ₹{doc.consultation_fee} <span className="text-[10px] font-normal text-slate-500">fee</span>
                        </div>
                      </div>
                    </div>

                    <p className="mt-3 text-xs text-slate-600 dark:text-slate-400 flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <strong>{doc.clinic_name}</strong> — {doc.clinic_address}
                    </p>

                    {/* Services tags */}
                    <div className="mt-3 flex flex-wrap gap-1.5">
                      {doc.services.map((s: string, idx: number) => (
                        <span key={idx} className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
                          {s}
                        </span>
                      ))}
                    </div>

                    {/* Live Token Status & Action Footer */}
                    <div className="mt-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-t border-slate-100 pt-3 text-xs dark:border-slate-800">
                      <div className="flex items-center gap-2">
                        <span className="flex items-center gap-1 font-semibold text-emerald-600 dark:text-emerald-400">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                          </span>
                          Next Token: #{doc.next_token}
                        </span>
                        <span className="text-slate-400">•</span>
                        <span className="text-slate-500 flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5" /> Wait: {doc.wait_time}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        <a
                          href={`https://maps.google.com/?q=${encodeURIComponent(doc.clinic_address)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                        >
                          <Navigation className="inline h-3 w-3 text-blue-600 mr-1" /> Directions
                        </a>
                        <Link
                          href={`/book?doctor=${doc.slug}`}
                          className="rounded-lg bg-brand-600 px-3.5 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-brand-700"
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
              <div className="sticky top-24">
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
