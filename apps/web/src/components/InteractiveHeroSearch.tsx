"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Search, MapPin, ArrowRight } from "lucide-react";

export default function InteractiveHeroSearch() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?query=${encodeURIComponent(query.trim())}`);
    } else {
      router.push("/search");
    }
  };

  const handleQuickTag = (tag: string) => {
    router.push(`/search?query=${encodeURIComponent(tag)}`);
  };

  return (
    <div className="mx-auto mt-8 max-w-2xl">
      <form onSubmit={handleSearch} className="relative flex items-center">
        <div className="relative w-full">
          <Search className="absolute left-4 top-4 h-5 w-5 text-[#86868B] dark:text-[#8E8E93]" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doctors, specialities, symptoms (e.g. Acne, Dental, Paediatrician)..."
            className="w-full rounded-[22px] border border-black/[0.08] bg-white py-3.5 pl-12 pr-32 text-sm text-[#1D1D1F] shadow-apple-card focus:border-[#0071E3] focus:outline-none focus:ring-2 focus:ring-[#0071E3]/20 dark:border-white/[0.12] dark:bg-[#1C1C1E] dark:text-white"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 inline-flex items-center gap-1.5 rounded-full bg-[#0071E3] px-4 py-2 text-xs font-semibold text-white shadow-sm hover:bg-[#0077ED] active:scale-95 transition"
          >
            Find Doctor <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="font-medium text-[#86868B] dark:text-[#8E8E93]">Popular in Dehradun:</span>
        <button
          onClick={() => handleQuickTag("Dermatology")}
          className="rounded-full border border-black/[0.06] bg-white/80 px-3 py-1 text-xs font-medium text-[#1D1D1F] shadow-apple-sm hover:bg-white dark:border-white/[0.08] dark:bg-[#1C1C1E]/80 dark:text-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition active:scale-95"
        >
          ✨ Acne & Skin
        </button>
        <button
          onClick={() => handleQuickTag("Dentist")}
          className="rounded-full border border-black/[0.06] bg-white/80 px-3 py-1 text-xs font-medium text-[#1D1D1F] shadow-apple-sm hover:bg-white dark:border-white/[0.08] dark:bg-[#1C1C1E]/80 dark:text-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition active:scale-95"
        >
          🦷 Painless Root Canal
        </button>
        <button
          onClick={() => handleQuickTag("Paediatrics")}
          className="rounded-full border border-black/[0.06] bg-white/80 px-3 py-1 text-xs font-medium text-[#1D1D1F] shadow-apple-sm hover:bg-white dark:border-white/[0.08] dark:bg-[#1C1C1E]/80 dark:text-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition active:scale-95"
        >
          👶 Child Vaccination
        </button>
        <button
          onClick={() => handleQuickTag("Rajpur Road")}
          className="rounded-full border border-black/[0.06] bg-white/80 px-3 py-1 text-xs font-medium text-[#1D1D1F] shadow-apple-sm hover:bg-white dark:border-white/[0.08] dark:bg-[#1C1C1E]/80 dark:text-[#F5F5F7] dark:hover:bg-[#2C2C2E] transition active:scale-95"
        >
          📍 Rajpur Road
        </button>
      </div>
    </div>
  );
}
