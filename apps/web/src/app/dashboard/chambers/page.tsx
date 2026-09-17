"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Stethoscope, 
  Clock, 
  CheckCircle2, 
  ArrowRight, 
  Volume2, 
  Plus, 
  UserCheck, 
  AlertCircle,
  FileText,
  Sparkles,
  Phone
} from "lucide-react";

export default function DashboardChambersPage() {
  const [chimeMsg, setChimeMsg] = useState<string | null>(null);

  const [chamber1Queue, setChamber1Queue] = useState([
    { token: 1, name: "Amit Rawat", phone: "+91 91234 56780", status: "completed", diagnosis: "Acne Vulgaris", time: "10:15 AM" },
    { token: 2, name: "Priya Singh", phone: "+91 91234 56781", status: "in_consultation", diagnosis: "Allergic Dermatitis", time: "10:30 AM" },
    { token: 3, name: "Rohit Pant", phone: "+91 91234 56782", status: "waiting", diagnosis: "Hair Loss / Dandruff", time: "10:45 AM" }
  ]);

  const [chamber2Queue, setChamber2Queue] = useState([
    { token: 4, name: "Kavita Joshi", phone: "+91 98765 11111", status: "in_consultation", diagnosis: "Dental Caries #36", time: "11:00 AM" },
    { token: 6, name: "Sunil Bisht", phone: "+91 98765 33333", status: "waiting", diagnosis: "Routine Scaling & Polish", time: "11:30 AM" }
  ]);

  const playChimeForChamber = (chamberNum: number, tokenNum: number) => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const now = audioCtx.currentTime;

      // Dual harmonic chime
      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.frequency.setValueAtTime(587.33, now);
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.start(now);
      osc1.stop(now + 0.5);

      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.frequency.setValueAtTime(880.00, now + 0.2);
      gain2.gain.setValueAtTime(0.3, now + 0.2);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.start(now + 0.2);
      osc2.stop(now + 0.8);

      setChimeMsg(`🔔 Called Token #${tokenNum} into Chamber ${chamberNum}!`);
      setTimeout(() => setChimeMsg(null), 3500);
    } catch (e) {
      console.error(e);
    }
  };

  const callNextChamber1 = () => {
    const nextPt = chamber1Queue.find(p => p.status === "waiting");
    if (!nextPt) return;

    setChamber1Queue(prev =>
      prev.map(p => {
        if (p.status === "in_consultation") return { ...p, status: "completed" };
        if (p.token === nextPt.token) return { ...p, status: "in_consultation" };
        return p;
      })
    );
    playChimeForChamber(1, nextPt.token);
  };

  const callNextChamber2 = () => {
    const nextPt = chamber2Queue.find(p => p.status === "waiting");
    if (!nextPt) return;

    setChamber2Queue(prev =>
      prev.map(p => {
        if (p.status === "in_consultation") return { ...p, status: "completed" };
        if (p.token === nextPt.token) return { ...p, status: "in_consultation" };
        return p;
      })
    );
    playChimeForChamber(2, nextPt.token);
  };

  return (
    <div className="space-y-6">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-black text-slate-900 dark:text-white">
            Simultaneous Multi-Doctor Chambers
          </h1>
          <p className="text-xs text-slate-500">
            Real-time OPD queue dispatch across Dermatology & Dental consultation rooms
          </p>
        </div>

        {chimeMsg && (
          <div className="flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-xs font-bold text-white shadow-xl animate-in fade-in">
            <Volume2 className="h-4 w-4 text-emerald-400" />
            <span>{chimeMsg}</span>
          </div>
        )}
      </div>

      {/* 2-CHAMBER CARDS GRID */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* CHAMBER 1 */}
        <div className="rounded-3xl border border-teal-200 bg-white p-6 shadow-sm dark:border-teal-950 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="rounded-full bg-teal-50 px-3 py-1 text-xs font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  Chamber 1 • Dermatology & Skin
                </span>
                <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                  Dr. Rahul Sharma
                </h2>
                <p className="text-xs text-slate-500">
                  MBBS, MD (Dermatology) • UKMC-8942-2012
                </p>
              </div>

              <button
                onClick={callNextChamber1}
                className="inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-brand-700 transition"
              >
                <Volume2 className="h-4 w-4" /> Call Next Patient
              </button>
            </div>

            {/* Chamber 1 Patient Queue List */}
            <div className="mt-4 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Today&apos;s Chamber Queue
              </div>

              {chamber1Queue.map(p => (
                <div
                  key={p.token}
                  className={`rounded-2xl border p-3.5 flex items-center justify-between text-xs transition ${
                    p.status === "in_consultation"
                      ? "border-emerald-500 bg-emerald-50/50 dark:border-emerald-900 dark:bg-emerald-950/30"
                      : p.status === "waiting"
                      ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                      : "border-slate-100 bg-slate-50/50 opacity-60 dark:border-slate-850 dark:bg-slate-950/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 font-mono font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      #{p.token}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{p.name}</span>
                        {p.status === "in_consultation" && (
                          <span className="rounded bg-emerald-100 px-1.5 py-0.2 text-[10px] font-bold text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
                            IN CHAMBER
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{p.diagnosis} • {p.time}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.status === "in_consultation" ? (
                      <Link
                        href="/dashboard/consult/APT-DERMA-102"
                        className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm hover:bg-emerald-700 transition"
                      >
                        Open ℞ Pad
                      </Link>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 capitalize">
                        {p.status.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Avg. Consult Duration: <strong>11 mins</strong></span>
            <span className="text-emerald-600 font-bold">● Chamber Ready</span>
          </div>
        </div>

        {/* CHAMBER 2 */}
        <div className="rounded-3xl border border-blue-200 bg-white p-6 shadow-sm dark:border-blue-950 dark:bg-slate-900 flex flex-col justify-between">
          <div>
            <div className="flex items-start justify-between border-b border-slate-100 pb-4 dark:border-slate-800">
              <div>
                <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-bold text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  Chamber 2 • Multi-Speciality Dental
                </span>
                <h2 className="mt-2 text-xl font-black text-slate-900 dark:text-white">
                  Dr. Aditi Joshi
                </h2>
                <p className="text-xs text-slate-500">
                  BDS, MDS (Endodontics) • UDC-4120-2016
                </p>
              </div>

              <button
                onClick={callNextChamber2}
                className="inline-flex items-center gap-1.5 rounded-xl bg-blue-600 px-3.5 py-2 text-xs font-bold text-white shadow-sm hover:bg-blue-700 transition"
              >
                <Volume2 className="h-4 w-4" /> Call Next Patient
              </button>
            </div>

            {/* Chamber 2 Patient Queue List */}
            <div className="mt-4 space-y-2.5">
              <div className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Today&apos;s Chamber Queue
              </div>

              {chamber2Queue.map(p => (
                <div
                  key={p.token}
                  className={`rounded-2xl border p-3.5 flex items-center justify-between text-xs transition ${
                    p.status === "in_consultation"
                      ? "border-blue-500 bg-blue-50/50 dark:border-blue-900 dark:bg-blue-950/30"
                      : p.status === "waiting"
                      ? "border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900"
                      : "border-slate-100 bg-slate-50/50 opacity-60 dark:border-slate-850 dark:bg-slate-950/40"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-100 font-mono font-bold text-slate-800 dark:bg-slate-800 dark:text-slate-200">
                      #{p.token}
                    </span>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white flex items-center gap-2">
                        <span>{p.name}</span>
                        {p.status === "in_consultation" && (
                          <span className="rounded bg-blue-100 px-1.5 py-0.2 text-[10px] font-bold text-blue-800 dark:bg-blue-950 dark:text-blue-300">
                            IN CHAIR
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{p.diagnosis} • {p.time}</div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {p.status === "in_consultation" ? (
                      <span className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white shadow-sm">
                        Procedure Active
                      </span>
                    ) : (
                      <span className="text-[11px] font-medium text-slate-400 capitalize">
                        {p.status.replace("_", " ")}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="mt-6 border-t border-slate-100 pt-4 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
            <span>Avg. Consult Duration: <strong>16 mins</strong></span>
            <span className="text-blue-600 font-bold">● Dental Chair Ready</span>
          </div>
        </div>
      </div>
    </div>
  );
}
