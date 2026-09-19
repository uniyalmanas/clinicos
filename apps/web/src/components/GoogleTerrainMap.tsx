"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { 
  Maximize2, 
  Minimize2, 
  Compass, 
  Plus, 
  Minus, 
  ChevronDown, 
  Check, 
  X, 
  Navigation, 
  Calendar, 
  Star, 
  Clock, 
  ShieldCheck, 
  Stethoscope,
  Layers
} from "lucide-react";

export interface DoctorMapItem {
  slug: string;
  full_name: string;
  title: string;
  specialization: string;
  qualification_summary: string;
  years_of_experience: number;
  rating: number;
  total_reviews: number;
  consultation_fee: number;
  clinic_name: string;
  clinic_address: string;
  locality: string;
  wait_time: string;
  on_time_guarantee?: boolean;
  online_available?: boolean;
  avatar_url?: string;
  gender?: string;
  lat: number;
  lng: number;
}

interface Props {
  doctors: DoctorMapItem[];
  activeDoctor: DoctorMapItem | null;
  onSelectDoctor: (doc: DoctorMapItem) => void;
  className?: string;
}

export default function GoogleTerrainMap({
  doctors,
  activeDoctor,
  onSelectDoctor,
  className = ""
}: Props) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<{ [slug: string]: any }>({});
  const tileLayerRef = useRef<any>(null);

  const [mapType, setMapType] = useState<"terrain" | "satellite" | "roadmap">("terrain");
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMapReady, setIsMapReady] = useState(false);

  // Initialize Leaflet Map with Google Maps Terrain Mode
  useEffect(() => {
    let isMounted = true;

    async function initMap() {
      if (!mapContainerRef.current) return;
      if (mapInstanceRef.current) return;

      // Dynamic import of Leaflet to ensure SSR safety in Next.js
      const L = (await import("leaflet")).default;

      // Fix default Leaflet icon paths
      delete (L.Icon.Default.prototype as any)._getIconUrl;
      L.Icon.Default.mergeOptions({
        iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
        iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
        shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
      });

      if (!isMounted || !mapContainerRef.current) return;

      // Dehradun center: Clock Tower (Ghanta Ghar)
      const dehradunCenter: [number, number] = [30.3255, 78.0436];

      const map = L.map(mapContainerRef.current, {
        center: dehradunCenter,
        zoom: 13,
        zoomControl: false, // We use custom Google Maps styled controls
        attributionControl: false, // Custom Google Maps footer
        maxZoom: 20,
        minZoom: 10
      });

      mapInstanceRef.current = map;

      // Google Maps Terrain Mode Tile Layer (lyrs=p provides authentic terrain, topography, hillshading & contours)
      const terrainLayer = L.tileLayer("https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}", {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        attribution: "Map data ©2026 Google"
      });

      terrainLayer.addTo(map);
      tileLayerRef.current = terrainLayer;

      setIsMapReady(true);
    }

    initMap();

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update Tile Layer when user switches between Terrain, Satellite, and Roadmap
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    import("leaflet").then((LModule) => {
      const L = LModule.default;
      mapInstanceRef.current.removeLayer(tileLayerRef.current);

      let tileUrl = "https://{s}.google.com/vt/lyrs=p&x={x}&y={y}&z={z}"; // Terrain
      if (mapType === "satellite") {
        tileUrl = "https://{s}.google.com/vt/lyrs=y&x={x}&y={y}&z={z}"; // Satellite Hybrid
      } else if (mapType === "roadmap") {
        tileUrl = "https://{s}.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"; // Standard Roadmap
      }

      const newLayer = L.tileLayer(tileUrl, {
        maxZoom: 20,
        subdomains: ["mt0", "mt1", "mt2", "mt3"],
        attribution: "Map data ©2026 Google"
      });

      newLayer.addTo(mapInstanceRef.current);
      tileLayerRef.current = newLayer;
    });
  }, [mapType]);

  // Render & update Doctor Markers on the Terrain Map
  useEffect(() => {
    if (!mapInstanceRef.current || !isMapReady) return;

    import("leaflet").then((LModule) => {
      const L = LModule.default;
      const map = mapInstanceRef.current;

      // Clear existing markers
      Object.values(markersRef.current).forEach((marker: any) => marker.remove());
      markersRef.current = {};

      // Create Custom Google Maps Price Pill Marker for each doctor
      doctors.forEach((doc) => {
        const isSelected = activeDoctor?.slug === doc.slug;

        // Custom HTML for the Google Maps Marker Pill
        const markerHtml = `
          <div class="google-marker-wrapper group cursor-pointer transition-all duration-200 select-none ${
            isSelected ? "z-50 scale-110" : "z-10 hover:scale-105"
          }">
            <div class="flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-bold shadow-md transition-all ${
              isSelected
                ? "bg-[#1a73e8] text-white ring-4 ring-[#1a73e8]/30 shadow-xl"
                : "bg-white text-[#202124] border border-[#dadce0] hover:bg-[#f8f9fa] hover:border-[#1a73e8]"
            }">
              <svg class="h-3 w-3 ${isSelected ? "text-white" : "text-[#188038]"}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
                <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
                <circle cx="20" cy="10" r="2"/>
              </svg>
              <span class="tracking-tight">₹${doc.consultation_fee}</span>
              ${doc.on_time_guarantee ? `<span class="text-[8px] font-black uppercase px-1 py-0.2 rounded ${isSelected ? "bg-white/20 text-white" : "bg-blue-100 text-[#0d2a58]"}">OTG</span>` : ""}
            </div>
            <!-- Pointer needle -->
            <div class="mx-auto h-2 w-2 rotate-45 -mt-1 ${isSelected ? "bg-[#1a73e8]" : "bg-white border-r border-b border-[#dadce0]"}"></div>
          </div>
        `;

        const customIcon = L.divIcon({
          html: markerHtml,
          className: "google-terrain-custom-icon",
          iconSize: [85, 34],
          iconAnchor: [42, 34],
          popupAnchor: [0, -36]
        });

        const marker = L.marker([doc.lat, doc.lng], { icon: customIcon });

        // Authentic Google Maps InfoWindow Popup
        const popupContent = `
          <div class="google-infowindow p-1 text-[#3c4043] font-sans" style="min-width: 250px; max-width: 280px;">
            <div class="flex items-start gap-3">
              <div class="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-gray-100 border border-gray-200">
                <img src="${doc.avatar_url || "https://images.unsplash.com/photo-1622253692010-333f2da6031d?w=150"}" alt="${doc.full_name}" class="h-full w-full object-cover" />
              </div>
              <div class="min-w-0 flex-1">
                <div class="flex items-center gap-1">
                  <h4 class="text-xs font-bold text-[#202124] truncate">${doc.full_name}</h4>
                  ${doc.on_time_guarantee ? '<span class="bg-[#08214D] text-white text-[8px] font-black uppercase px-1 rounded">OTG</span>' : ""}
                </div>
                <p class="text-[11px] text-gray-500 font-medium truncate">${doc.specialization}</p>
                <div class="flex items-center gap-1 text-[10px] font-bold text-amber-700 mt-0.5">
                  <span>★ ${doc.rating}</span>
                  <span class="text-gray-400 font-normal">(${doc.total_reviews})</span>
                  <span class="text-gray-300">•</span>
                  <span class="text-[#188038]">₹${doc.consultation_fee} Fee</span>
                </div>
              </div>
            </div>
            <div class="mt-2 pt-2 border-t border-gray-100 text-[10px] text-gray-500 space-y-0.5">
              <p class="truncate">📍 ${doc.clinic_name}</p>
              <p class="text-[#188038] font-semibold">🕒 ${doc.wait_time} • 0% Markup</p>
            </div>
            <div class="mt-2.5 flex items-center gap-2">
              <a href="https://maps.google.com/?q=${encodeURIComponent(doc.clinic_name + ", " + doc.clinic_address)}" target="_blank" rel="noreferrer" class="flex-1 text-center py-1 text-[11px] font-semibold text-[#1a73e8] border border-[#dadce0] rounded-md hover:bg-gray-50">
                Directions
              </a>
              <a href="/book?doctor=${doc.slug}" class="flex-1 text-center py-1 text-[11px] font-bold text-white bg-[#1a73e8] rounded-md hover:bg-[#1557b0]">
                Book Consult
              </a>
            </div>
          </div>
        `;

        marker.bindPopup(popupContent, {
          closeButton: true,
          className: "google-maps-popup-card"
        });

        marker.on("click", () => {
          onSelectDoctor(doc);
        });

        marker.addTo(map);
        markersRef.current[doc.slug] = marker;
      });
    });
  }, [doctors, isMapReady]);

  // Fly to active doctor and open popup
  useEffect(() => {
    if (!mapInstanceRef.current || !activeDoctor || !isMapReady) return;

    const map = mapInstanceRef.current;
    map.flyTo([activeDoctor.lat, activeDoctor.lng], 15, {
      duration: 0.8,
      easeLinearity: 0.25
    });

    const marker = markersRef.current[activeDoctor.slug];
    if (marker) {
      marker.openPopup();
    }
  }, [activeDoctor?.slug, isMapReady]);

  // Reset to default Dehradun bounds
  const handleResetNorth = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.flyTo([30.3255, 78.0436], 13, { duration: 0.8 });
  };

  const handleZoomIn = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomIn();
  };

  const handleZoomOut = () => {
    if (!mapInstanceRef.current) return;
    mapInstanceRef.current.zoomOut();
  };

  return (
    <div
      className={`relative overflow-hidden font-sans border border-[#D1D5DB] dark:border-white/10 shadow-lg ${
        isFullscreen
          ? "fixed inset-0 z-50 h-screen w-screen rounded-none"
          : "h-[620px] w-full rounded-2xl"
      } ${className}`}
    >
      {/* =======================================================================
          1. GOOGLE MAPS BRAND & LAYER SELECTOR (TOP-LEFT)
      ======================================================================= */}
      <div className="absolute top-3 left-3 z-[1000] flex items-center gap-2">
        {/* Main Map / Satellite / Terrain Switcher */}
        <div className="flex items-center rounded-md bg-white dark:bg-[#202124] shadow-md border border-[#dadce0] dark:border-[#5f6368] text-xs font-medium text-[#3c4043] dark:text-[#e8eaed] overflow-hidden">
          <button
            type="button"
            onClick={() => setMapType("terrain")}
            className={`flex items-center gap-1.5 px-3 py-2 transition ${
              mapType === "terrain"
                ? "bg-[#1a73e8] text-white font-bold"
                : "hover:bg-[#f1f3f4] dark:hover:bg-[#303134]"
            }`}
          >
            <span>Terrain</span>
          </button>

          <button
            type="button"
            onClick={() => setMapType("roadmap")}
            className={`flex items-center gap-1 px-3 py-2 transition border-l border-[#dadce0] dark:border-[#5f6368] ${
              mapType === "roadmap"
                ? "bg-[#1a73e8] text-white font-bold"
                : "hover:bg-[#f1f3f4] dark:hover:bg-[#303134]"
            }`}
          >
            <span>Roadmap</span>
          </button>

          <button
            type="button"
            onClick={() => setMapType("satellite")}
            className={`flex items-center gap-1 px-3 py-2 transition border-l border-[#dadce0] dark:border-[#5f6368] ${
              mapType === "satellite"
                ? "bg-[#1a73e8] text-white font-bold"
                : "hover:bg-[#f1f3f4] dark:hover:bg-[#303134]"
            }`}
          >
            <span>Satellite</span>
          </button>

          <button
            type="button"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
            className="p-2 transition border-l border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#303134]"
            title="Terrain Layer Options"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
        </div>

        {/* Active Mode Indicator */}
        {mapType === "terrain" && (
          <div className="hidden sm:flex items-center gap-1.5 rounded-md bg-white/95 dark:bg-[#202124]/95 backdrop-blur-sm px-2.5 py-1.5 text-[11px] font-bold text-[#188038] dark:text-[#81c995] border border-[#dadce0] dark:border-[#5f6368] shadow-sm">
            <span className="h-2 w-2 rounded-full bg-[#188038] dark:bg-[#81c995] animate-pulse" />
            <span>Google Terrain Mode (Elevation & Shaded Relief)</span>
          </div>
        )}
      </div>

      {/* Layer Options Dropdown */}
      {isMenuOpen && (
        <div className="absolute top-14 left-3 z-[1001] w-64 rounded-xl bg-white dark:bg-[#202124] p-3 shadow-2xl border border-[#dadce0] dark:border-[#5f6368] text-xs text-[#3c4043] dark:text-[#e8eaed] animate-in fade-in slide-in-from-top-2">
          <div className="flex items-center justify-between pb-2 border-b border-gray-100 dark:border-white/10 font-bold">
            <span className="text-xs uppercase tracking-wider text-gray-500">Google Map Modes</span>
            <button
              type="button"
              onClick={() => setIsMenuOpen(false)}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-white"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>

          <div className="mt-2.5 space-y-2">
            <button
              type="button"
              onClick={() => {
                setMapType("terrain");
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2 rounded text-left transition ${
                mapType === "terrain" ? "bg-[#e8f0fe] text-[#1a73e8] font-bold" : "hover:bg-gray-100 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🏔️</span>
                <div>
                  <p className="font-semibold leading-tight">Terrain Mode</p>
                  <p className="text-[10px] text-gray-500 font-normal">Topography, contour lines & relief</p>
                </div>
              </div>
              {mapType === "terrain" && <Check className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setMapType("roadmap");
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2 rounded text-left transition ${
                mapType === "roadmap" ? "bg-[#e8f0fe] text-[#1a73e8] font-bold" : "hover:bg-gray-100 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🗺️</span>
                <div>
                  <p className="font-semibold leading-tight">Standard Roadmap</p>
                  <p className="text-[10px] text-gray-500 font-normal">Crisp vector roads & avenues</p>
                </div>
              </div>
              {mapType === "roadmap" && <Check className="h-4 w-4" />}
            </button>

            <button
              type="button"
              onClick={() => {
                setMapType("satellite");
                setIsMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between p-2 rounded text-left transition ${
                mapType === "satellite" ? "bg-[#e8f0fe] text-[#1a73e8] font-bold" : "hover:bg-gray-100 dark:hover:bg-white/5"
              }`}
            >
              <div className="flex items-center gap-2">
                <span className="text-sm">🛰️</span>
                <div>
                  <p className="font-semibold leading-tight">Satellite Hybrid</p>
                  <p className="text-[10px] text-gray-500 font-normal">Photographic aerial imagery</p>
                </div>
              </div>
              {mapType === "satellite" && <Check className="h-4 w-4" />}
            </button>
          </div>
        </div>
      )}

      {/* =======================================================================
          2. TOP-RIGHT CONTROLS: FULLSCREEN TOGGLE
      ======================================================================= */}
      <div className="absolute top-3 right-3 z-[1000] flex items-center gap-2">
        <button
          type="button"
          onClick={() => setIsFullscreen(!isFullscreen)}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-white dark:bg-[#202124] text-[#5f6368] dark:text-[#dadce0] shadow-md border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition"
          title={isFullscreen ? "Exit Fullscreen" : "Fullscreen Map"}
        >
          {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
        </button>
      </div>

      {/* =======================================================================
          3. BOTTOM-RIGHT CONTROLS: COMPASS, PEGMAN & ZOOM
      ======================================================================= */}
      <div className="absolute bottom-8 right-3 z-[1000] flex flex-col items-center gap-2">
        {/* Reset Center / Compass */}
        <button
          type="button"
          onClick={handleResetNorth}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-white dark:bg-[#202124] shadow-md border border-[#dadce0] dark:border-[#5f6368] text-[#ea4335] hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition"
          title="Reset to Center (Clock Tower)"
        >
          <div className="relative flex flex-col items-center">
            <span className="text-[9px] font-black leading-none text-[#ea4335]">N</span>
            <Compass className="h-4 w-4 text-[#5f6368] dark:text-[#e8eaed]" />
          </div>
        </button>

        {/* Google Street View Pegman */}
        <button
          type="button"
          onClick={() => alert("DocSphere Street View: Virtual clinic navigation active for Dehradun!")}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-white dark:bg-[#202124] shadow-md border border-[#dadce0] dark:border-[#5f6368] hover:bg-[#fef7e0] transition group"
          title="Street View Pegman"
        >
          <svg className="h-5 w-5 fill-[#fbbc04] group-hover:scale-110 transition-transform" viewBox="0 0 24 24">
            <circle cx="12" cy="4.5" r="2.5" />
            <path d="M15 8.5H9c-.8 0-1.5.7-1.5 1.5v4.5h2V21h2v-5.5h1V21h2v-6.5h2V10c0-.8-.7-1.5-1.5-1.5z" />
          </svg>
        </button>

        {/* Zoom Stack */}
        <div className="flex flex-col rounded-md bg-white dark:bg-[#202124] shadow-md border border-[#dadce0] dark:border-[#5f6368] overflow-hidden text-[#5f6368] dark:text-[#e8eaed]">
          <button
            type="button"
            onClick={handleZoomIn}
            className="flex h-8 w-8 items-center justify-center hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition border-b border-[#dadce0] dark:border-[#5f6368]"
            title="Zoom in"
          >
            <Plus className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={handleZoomOut}
            className="flex h-8 w-8 items-center justify-center hover:bg-[#f1f3f4] dark:hover:bg-[#303134] transition"
            title="Zoom out"
          >
            <Minus className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* =======================================================================
          4. LEAFLET MAP CONTAINER (REAL GOOGLE MAPS TERRAIN TILES)
      ======================================================================= */}
      <div ref={mapContainerRef} className="h-full w-full bg-[#E5EBD9]" />

      {/* =======================================================================
          5. GOOGLE MAPS BOTTOM ATTRIBUTION & SCALE
      ======================================================================= */}
      <div className="absolute bottom-1.5 left-2 z-[1000] flex items-center gap-3 text-[10px] text-[#5f6368] dark:text-[#9aa0a6] pointer-events-none">
        <div className="flex items-center gap-1 bg-white/85 dark:bg-black/70 px-2 py-0.5 rounded shadow-xs font-mono text-[9px] border border-black/5 dark:border-white/10">
          <span>1 km</span>
          <span className="inline-block w-8 border-b-2 border-[#5f6368]" />
        </div>
        <div className="hidden sm:flex items-center gap-2 bg-white/85 dark:bg-black/70 px-2.5 py-0.5 rounded shadow-xs text-[9px]">
          <span>DocSphere Maps</span>
          <span>•</span>
          <span>Google Terrain Mode</span>
          <span>•</span>
          <span>Imagery ©2026 CNES / Airbus</span>
          <span>•</span>
          <span className="pointer-events-auto hover:underline cursor-pointer">Terms</span>
        </div>
      </div>
    </div>
  );
}
