"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  MapPin, 
  Navigation, 
  Star, 
  Calendar, 
  Clock, 
  ShieldCheck, 
  Layers, 
  Crosshair, 
  Maximize2,
  Minimize2,
  Stethoscope
} from "lucide-react";

export interface MapDoctor {
  slug: string;
  full_name: string;
  specialization: string;
  rating: number;
  total_reviews: number;
  consultation_fee: number;
  clinic_name: string;
  clinic_address: string;
  locality: string;
  next_token: number;
  wait_time: string;
  lat: number;
  lng: number;
}

interface Props {
  doctors: MapDoctor[];
  activeDoctor: MapDoctor | null;
  onSelectDoctor: (doc: MapDoctor) => void;
}

export default function InteractiveClinicMap({ doctors, activeDoctor, onSelectDoctor }: Props) {
  const [showTraffic, setShowTraffic] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1);

  // Approximate relative canvas coordinates for Dehradun map simulation
  // Center: Clock Tower (lat: 30.3255, lng: 78.0436)
  const getMapCoordinates = (doc: MapDoctor) => {
    const loc = (doc.locality || "").toLowerCase();
    if (loc.includes("rajpur")) {
      return { x: 58, y: 28, distance: "1.2 km (4 mins)" };
    } else if (loc.includes("ec road")) {
      return { x: 68, y: 62, distance: "0.9 km (3 mins)" };
    } else if (loc.includes("chakrata")) {
      return { x: 28, y: 44, distance: "2.6 km (8 mins)" };
    } else if (loc.includes("ballupur")) {
      return { x: 22, y: 36, distance: "3.5 km (11 mins)" };
    } else if (loc.includes("dalanwala")) {
      return { x: 74, y: 42, distance: "1.8 km (5 mins)" };
    } else if (loc.includes("saharanpur")) {
      return { x: 42, y: 78, distance: "3.1 km (10 mins)" };
    } else if (loc.includes("subhash")) {
      return { x: 52, y: 45, distance: "0.8 km (2 mins)" };
    } else if (loc.includes("haridwar")) {
      return { x: 72, y: 84, distance: "4.2 km (12 mins)" };
    } else if (loc.includes("gms road")) {
      return { x: 32, y: 65, distance: "3.8 km (10 mins)" };
    } else if (loc.includes("patel nagar")) {
      return { x: 40, y: 68, distance: "2.9 km (8 mins)" };
    } else if (loc.includes("vasant vihar")) {
      return { x: 24, y: 55, distance: "3.4 km (9 mins)" };
    }
    return { x: 50, y: 50, distance: "1.5 km" };
  };

  return (
    <div className="relative flex flex-col overflow-hidden rounded-3xl border border-slate-200 bg-slate-900 shadow-xl dark:border-[#1E2638] h-[580px]">
      {/* Top Map Control Bar */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between pointer-events-none">
        <div className="flex items-center gap-2 pointer-events-auto rounded-2xl bg-slate-900/90 backdrop-blur-md px-3.5 py-2 text-xs font-bold text-white border border-slate-700/60 shadow-lg">
          <Crosshair className="h-4 w-4 text-teal-400" />
          <span>Dehradun Medical Grid</span>
          <span className="rounded-full bg-teal-500/20 px-2 py-0.5 text-[10px] text-teal-300 border border-teal-500/40">
            {doctors.length} Verified Chambers
          </span>
        </div>

        <div className="flex items-center gap-2 pointer-events-auto">
          <button
            onClick={() => setShowTraffic(!showTraffic)}
            className={`rounded-xl px-3 py-1.5 text-xs font-semibold backdrop-blur-md border transition ${
              showTraffic
                ? "bg-amber-500 text-slate-950 border-amber-400"
                : "bg-slate-900/90 text-slate-300 border-slate-700 hover:bg-slate-800"
            }`}
          >
            Traffic Overlay
          </button>
          <div className="flex items-center rounded-xl bg-slate-900/90 border border-slate-700 text-slate-300 text-xs font-bold overflow-hidden">
            <button
              onClick={() => setZoomLevel(Math.max(0.8, zoomLevel - 0.2))}
              className="px-2.5 py-1.5 hover:bg-slate-800"
            >
              -
            </button>
            <span className="px-1 text-[11px] text-slate-400 font-mono">{Math.round(zoomLevel * 100)}%</span>
            <button
              onClick={() => setZoomLevel(Math.min(1.4, zoomLevel + 0.2))}
              className="px-2.5 py-1.5 hover:bg-slate-800"
            >
              +
            </button>
          </div>
        </div>
      </div>

      {/* SVG Canvas Map */}
      <div className="relative w-full h-full flex items-center justify-center overflow-hidden select-none bg-[#0B0F17]">
        {/* Grid pattern background */}
        <div 
          className="absolute inset-0 bg-[radial-gradient(#1E2638_1.5px,transparent_1.5px)] [background-size:24px_24px] opacity-70"
          style={{ transform: `scale(${zoomLevel})` }}
        ></div>

        {/* Road arterial representations */}
        <svg 
          className="absolute inset-0 w-full h-full"
          style={{ transform: `scale(${zoomLevel})`, transformOrigin: "center center" }}
        >
          {/* Rajpur Road Arterial */}
          <path
            d="M 280 20 L 320 280 L 360 480"
            fill="none"
            stroke={showTraffic ? "#f59e0b" : "#24324f"}
            strokeWidth={showTraffic ? "4" : "3"}
            strokeDasharray={showTraffic ? "6,3" : "none"}
          />
          {/* EC Road / Survey Chowk Arterial */}
          <path
            d="M 320 280 L 450 360 L 520 450"
            fill="none"
            stroke="#24324f"
            strokeWidth="3"
          />
          {/* Chakrata Road Arterial */}
          <path
            d="M 320 280 L 120 240 L 40 220"
            fill="none"
            stroke="#24324f"
            strokeWidth="3"
          />
          {/* Haridwar Bypass / Rispana Bridge */}
          <path
            d="M 80 480 Q 320 400 520 450"
            fill="none"
            stroke="#1B2436"
            strokeWidth="2"
          />
        </svg>

        {/* Landmarks */}
        <div 
          className="absolute z-10 flex flex-col items-center pointer-events-none"
          style={{ left: "50%", top: "48%", transform: `translate(-50%, -50%) scale(${zoomLevel})` }}
        >
          <div className="h-3 w-3 rounded-full bg-blue-500 ring-4 ring-blue-500/30 animate-pulse"></div>
          <span className="mt-1 rounded bg-slate-900/90 px-1.5 py-0.5 text-[9px] font-bold text-blue-400 border border-blue-500/40">
            📍 Dehradun Clock Tower (Center)
          </span>
        </div>

        {/* Doctor & Clinic Map Pins */}
        {doctors.map((doc) => {
          const coords = getMapCoordinates(doc);
          const isSelected = activeDoctor?.slug === doc.slug;

          return (
            <div
              key={doc.slug}
              onClick={() => onSelectDoctor(doc)}
              className="absolute z-20 cursor-pointer transition-all duration-300"
              style={{
                left: `${coords.x}%`,
                top: `${coords.y}%`,
                transform: `translate(-50%, -50%) scale(${isSelected ? zoomLevel * 1.15 : zoomLevel})`
              }}
            >
              {/* Pin Callout */}
              <div
                className={`group flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold shadow-2xl transition ${
                  isSelected
                    ? "bg-teal-500 text-slate-950 ring-4 ring-teal-400/30 shadow-teal-500/50 scale-110"
                    : "bg-slate-900/95 text-white border border-slate-700 hover:border-teal-400 hover:text-teal-300"
                }`}
              >
                <Stethoscope className="h-3.5 w-3.5 shrink-0" />
                <span className="whitespace-nowrap">{doc.clinic_name.split(" ")[0]}</span>
                <span className="rounded-full bg-slate-950/40 px-1.5 py-0.2 text-[9px] font-mono">
                  #{doc.next_token}
                </span>
              </div>

              {/* Pin Pointer Tip */}
              <div
                className={`mx-auto h-2 w-2 rotate-45 ${
                  isSelected ? "bg-teal-500" : "bg-slate-900 border-r border-b border-slate-700"
                }`}
              ></div>
            </div>
          );
        })}
      </div>

      {/* Bottom Floating Active Doctor Card */}
      {activeDoctor && (
        <div className="absolute bottom-4 left-4 right-4 z-30 animate-in fade-in slide-in-from-bottom-3">
          <div className="rounded-2xl border border-slate-700/80 bg-slate-900/95 backdrop-blur-md p-4 text-white shadow-2xl">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-teal-500/20 text-teal-400 border border-teal-500/40 font-bold text-base">
                  {activeDoctor.full_name.split(" ")[1]?.[0] || "D"}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-bold text-white">{activeDoctor.full_name}</h4>
                    <span className="flex items-center gap-0.5 rounded-full bg-emerald-950 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-800/60">
                      <ShieldCheck className="h-3 w-3" /> NMC Verified
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {activeDoctor.specialization} • {activeDoctor.clinic_name} ({activeDoctor.locality})
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-4 text-right">
                <div>
                  <div className="flex items-center justify-end gap-1 text-xs font-bold text-amber-400">
                    <Star className="h-3.5 w-3.5 fill-amber-400" /> {activeDoctor.rating}
                    <span className="text-[10px] text-slate-400">({activeDoctor.total_reviews})</span>
                  </div>
                  <div className="text-xs font-black text-white mt-0.5">
                    ₹{activeDoctor.consultation_fee} <span className="text-[10px] text-slate-400 font-normal">OPD Fee</span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`https://maps.google.com/?q=${encodeURIComponent(activeDoctor.clinic_address)}`}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800/80 px-3 py-2 text-xs font-semibold text-slate-300 hover:bg-slate-700 transition"
                  >
                    <Navigation className="h-3.5 w-3.5 text-blue-400" />
                    <span className="hidden sm:inline">Directions</span>
                  </a>
                  <Link
                    href={`/book?doctor=${activeDoctor.slug}`}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-500 px-4 py-2 text-xs font-black text-slate-950 shadow-lg shadow-teal-500/25 hover:bg-teal-400 transition"
                  >
                    <Calendar className="h-3.5 w-3.5" />
                    <span>Book Token #{activeDoctor.next_token}</span>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
