"use client";

import React from "react";
import {
  Sun,
  Clock,
  Moon,
  Pill,
  Check,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

/* ─────────────────────────────────────────────────────────
   MedicineSchedule — Visual morning/afternoon/night timeline
   
   Takes the scribed medicines (with frequency like 1-0-1)
   and displays them in a simple patient-friendly schedule:
   • Morning (सुबह) • Afternoon (दोपहर) • Night (रात)
   • With simple food instructions
   ───────────────────────────────────────────────────────── */

type Medicine = {
  generic: string;
  brand?: string;
  form?: string;
  dose?: string; // e.g. "1-0-1"
  days?: string; // e.g. "5 Days"
  instructions?: string;
  timing?: "morning" | "afternoon" | "night";
  strength?: string;
};

type MedicineScheduleProps = {
  medicines: Medicine[];
  className?: string;
};

const FREQUENCY_TO_TIMES: Record<string, Array<"morning" | "afternoon" | "night">> = {
  "1-0-1": ["morning", "night"],
  "1-0-0": ["morning"],
  "0-1-0": ["afternoon"],
  "0-0-1": ["night"],
  "1-1-0": ["morning", "afternoon"],
  "0-1-1": ["afternoon", "night"],
  "1-1-1": ["morning", "afternoon", "night"],
  "2-0-0": ["morning"],
  "0-2-0": ["afternoon"],
  "0-0-2": ["night"],
};

const TIME_LABELS: Record<string, { label: string; icon: any; color: string }> = {
  morning: {
    label: "Morning (सुबह)",
    icon: Sun,
    color: "text-amber-600 dark:text-amber-400",
  },
  afternoon: {
    label: "Afternoon (दोपहर)",
    icon: Clock,
    color: "text-blue-600 dark:text-blue-400",
  },
  night: {
    label: "Night (रात)",
    icon: Moon,
    color: "text-indigo-600 dark:text-indigo-400",
  },
};

function parseFrequency(dose: string): Array<"morning" | "afternoon" | "night"> {
  if (!dose) return ["morning"];
  const key = dose.replace(/\s/g, "");
  return FREQUENCY_TO_TIMES[key] || ["morning"];
}

export function MedicineSchedule({ medicines, className }: MedicineScheduleProps) {
  // Group medicines by time of day
  const byTime: Record<string, Medicine[]> = { morning: [], afternoon: [], night: [] };

  medicines.forEach((m) => {
    const times = parseFrequency(m.dose || "");
    times.forEach((t) => {
      byTime[t].push(m);
    });
  });

  const totalMeds = medicines.length;

  return (
    <div className={`rounded-2xl border p-4 space-y-3 dark:border-white/[0.08] ${className || ""}`}>
      {/* Header */}
      <div className="flex items-center justify-between border-b border-black/[0.06] pb-2 mb-2 dark:border-white/[0.08]">
        <div className="flex items-center gap-2">
          <Pill className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
          <span className="text-xs font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white">
            Medicine Schedule
          </span>
        </div>
        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
          {totalMeds} medicine{totalMeds !== 1 ? "s" : ""}
        </span>
      </div>

      {/* Time slots */}
      <div className="space-y-2">
        {["morning", "afternoon", "night"].map((time) => {
          const meds = byTime[time];
          const info = TIME_LABELS[time];
          return (
            <div
              key={time}
              className={`rounded-xl border p-2.5 transition-all hover:border-[#0071E3]/30 ${
                meds.length > 0
                  ? "border-[#0071E3]/30 bg-[#0071E3]/5 dark:border-[#2997FF]/30 dark:bg-[#2997FF]/10"
                  : "border-black/[0.06] bg-[#F5F6F9] dark:border-white/[0.08] dark:bg-[#121316]"
              } dark:border-white/[0.06]`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <div className="flex items-center gap-2">
                  <div className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${info.color} bg-[${info.color.replace("text-", "bg-")}]/10 dark:bg-[${info.color.replace("text-", "bg-")}]/10`}>
                    <info.icon className="h-3 w-3" />
                  </div>
                  <span className={`font-semibold text-xs ${info.color}`}>
                    {info.label}
                  </span>
                </div>
                {meds.length > 0 && (
                  <span className="text-[10px] font-bold text-[#86868B] dark:text-[#636366]">
                    {meds.length} dose{meds.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              {meds.length === 0 ? (
                <div className="flex items-center gap-2 text-[10px] text-[#86868B] dark:text-[#636366]">
                  <AlertTriangle className="h-3 w-3 text-[#86868B] dark:text-[#636366]" />
                  <span>No medicines</span>
                </div>
              ) : (
                <div className="space-y-1">
                  {meds.map((m, i) => (
                    <div
                      key={`${time}-${i}`}
                      className="flex items-center gap-2 rounded-lg p-1.5 text-xs border border-black/[0.04] bg-white dark:border-white/[0.06] dark:bg-[#1C1C1E]"
                    >
                      <div className="flex h-5 w-5 shrink-0 items-center justify-center rounded bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 dark:bg-emerald-950/20">
                        <Check className="h-2.5 w-2.5" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="font-semibold text-[#1D1D1F] dark:text-white truncate">
                          {m.generic} {m.strength ? `• ${m.strength}` : ""}
                        </div>
                        <div className="text-[10px] text-[#6E6E73] dark:text-[#A1A1A6]">
                          {m.form || "Tab"} • {m.days || "As prescribed"}
                          {m.instructions ? ` • ${m.instructions}` : ""}
                        </div>
                      </div>
                      {m.dose && (
                        <span className="font-mono text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF]">
                          {m.dose}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Simple instructions footer */}
      <div className="mt-2 rounded-lg border border-dashed border-black/[0.06] bg-[#F5F6F9]/50 p-2 text-[10px] text-[#86868B] dark:border-white/[0.06] dark:bg-white/[0.02]">
        <ArrowRight className="h-3 w-3 mr-1 text-[#86868B] dark:text-[#636366]" />
        Take medicines at the same time every day. Complete the full course even if you feel better.
      </div>
    </div>
  );
}
