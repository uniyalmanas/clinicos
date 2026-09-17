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
          <Search className="absolute left-4 top-3.5 h-5 w-5 text-slate-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search doctors, specialities, symptoms (e.g. Acne, Dental, Paediatrician, Rajpur Rd)..."
            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-12 pr-28 text-sm text-slate-900 shadow-xl shadow-slate-200/50 focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-500/20 dark:border-[#1E2638] dark:bg-[#111726] dark:text-white dark:shadow-[0_4px_25px_-5px_rgba(0,0,0,0.6)]"
          />
          <button
            type="submit"
            className="absolute right-2 top-2 inline-flex items-center gap-1 rounded-xl bg-brand-600 px-4 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition"
          >
            Find Doctor <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </form>

      <div className="mt-3 flex flex-wrap items-center justify-center gap-2 text-xs">
        <span className="font-semibold text-slate-500 dark:text-slate-400">Popular in Dehradun:</span>
        <button
          onClick={() => handleQuickTag("Dermatology")}
          className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-slate-700 hover:border-brand-500 hover:text-brand-600 dark:border-[#1E2638] dark:bg-[#111726] dark:text-slate-300 dark:hover:border-teal-500/50 dark:hover:text-teal-300 transition"
        >
          ✨ Acne & Skin
        </button>
        <button
          onClick={() => handleQuickTag("Dentist")}
          className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-slate-700 hover:border-brand-500 hover:text-brand-600 dark:border-[#1E2638] dark:bg-[#111726] dark:text-slate-300 dark:hover:border-teal-500/50 dark:hover:text-teal-300 transition"
        >
          🦷 Painless Root Canal
        </button>
        <button
          onClick={() => handleQuickTag("Paediatrics")}
          className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-slate-700 hover:border-brand-500 hover:text-brand-600 dark:border-[#1E2638] dark:bg-[#111726] dark:text-slate-300 dark:hover:border-teal-500/50 dark:hover:text-teal-300 transition"
        >
          👶 Child Vaccination
        </button>
        <button
          onClick={() => handleQuickTag("Rajpur Road")}
          className="rounded-full border border-slate-200 bg-white/80 px-2.5 py-1 text-slate-700 hover:border-brand-500 hover:text-brand-600 dark:border-[#1E2638] dark:bg-[#111726] dark:text-slate-300 dark:hover:border-teal-500/50 dark:hover:text-teal-300 transition"
        >
          📍 Rajpur Road
        </button>
      </div>
    </div>
  );
}
