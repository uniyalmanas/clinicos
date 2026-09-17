"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
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
  Sparkles
} from "lucide-react";

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
          <div className="flex items-center gap-2 text-xs font-medium text-slate-600 dark:text-slate-300">
            <MapPin className="h-4 w-4 text-brand-600" />
            Location: <strong className="text-slate-900 dark:text-white">Dehradun, Uttarakhand</strong>
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

        {/* Results Layout: Split List & Interactive Map */}
        <div className="mt-6 grid gap-6 lg:grid-cols-12">
          {/* Doctors List (7 Cols) */}
          <div className="lg:col-span-7 space-y-4">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-500">
              <span>Showing {filteredDoctors.length} verified doctors in Dehradun</span>
              <span>Available Today • Live Token Queue</span>
            </div>

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
                  className={`rounded-2xl border bg-white p-5 shadow-sm transition hover:shadow-md dark:bg-slate-900 ${
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

          {/* Interactive Map & Locality Guide (5 Cols) */}
          <div className="lg:col-span-5 space-y-6">
            <div className="sticky top-24 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-800 dark:bg-slate-900">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-brand-600" /> Dehradun Clinic Map
                </h3>
                <span className="text-[11px] text-brand-600 font-semibold">Active Pilot Testbed</span>
              </div>

              {/* Simulated Map Visual Canvas */}
              <div className="relative h-64 w-full overflow-hidden rounded-xl border border-slate-200 bg-slate-100 dark:border-slate-800 dark:bg-slate-950 flex flex-col justify-between p-4">
                <div className="absolute inset-0 bg-[radial-gradient(#0d9488_1px,transparent_1px)] [background-size:16px_16px] opacity-25"></div>

                <div className="relative z-10 flex justify-between items-start text-[11px] text-slate-500 font-medium">
                  <span className="rounded bg-white/90 px-2 py-0.5 shadow-sm dark:bg-slate-900">📍 Dehradun City Centre</span>
                  <span className="rounded bg-emerald-100 text-emerald-800 px-2 py-0.5 font-bold dark:bg-emerald-950 dark:text-emerald-300">3 Hubs Online</span>
                </div>

                {/* Simulated Pins */}
                <div className="relative z-10 flex flex-col items-center justify-center gap-2">
                  <div className="rounded-xl border border-brand-500 bg-white/95 p-3 text-center shadow-lg dark:bg-slate-900">
                    <div className="text-xs font-black text-brand-600">
                      {activeDoctorOnMap?.clinic_name || "Derma Care Centre"}
                    </div>
                    <div className="text-[11px] text-slate-600 dark:text-slate-400">
                      {activeDoctorOnMap?.locality} • {activeDoctorOnMap?.full_name}
                    </div>
                    <div className="mt-1.5 inline-block rounded bg-emerald-50 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
                      🎟️ Live Token #{activeDoctorOnMap?.next_token || 4} Ready
                    </div>
                  </div>
                </div>

                <div className="relative z-10 text-center text-[10px] text-slate-400">
                  Click any doctor card on the left to highlight on map
                </div>
              </div>

              {/* External Google Maps launch */}
              <div className="mt-4 text-center">
                <a
                  href={`https://maps.google.com/?q=clinics+doctors+dehradun+rajpur+road`}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 hover:underline"
                >
                  <Navigation className="h-3.5 w-3.5" /> Open Dehradun Medical Hub in Google Maps
                </a>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
