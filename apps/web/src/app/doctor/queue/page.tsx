"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import ThemeToggle from "@/components/ThemeToggle";
import { API_BASE_URL } from "@/lib/api";
import {
  ArrowLeft,
  ArrowRight,
  AlertCircle,
  Clock,
  FileText,
  Stethoscope,
  UserCheck,
} from "lucide-react";

export default function DoctorQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeDoctor = useMemo(
    () => ({
      full_name: "Dr. Rahul Sharma",
      specialization: "Dermatologist",
      clinic_name: "Derma Care Skin & Laser Centre",
      reg_number: "UKMC-8942-2012",
    }),
    []
  );

  const refreshQueue = async () => {
    try {
      setIsLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/desk-queue`);
      if (!res.ok) {
        throw new Error("Unable to load live queue");
      }
      const data = await res.json();
      setQueue(Array.isArray(data.queue) ? data.queue : []);
      setError(null);
    } catch (err) {
      console.error("Doctor queue refresh failed:", err);
      setError("The live queue is temporarily unavailable. Refreshing automatically.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshQueue();
    const interval = setInterval(refreshQueue, 5000);
    return () => clearInterval(interval);
  }, []);

  const activePatient = queue.find((item) => item.status === "in_consultation") ?? null;
  const upcomingQueue = queue.filter(
    (item) => item.status === "in_waiting" || item.status === "waiting" || item.status === "confirmed"
  );

  return (
    <div className="min-h-screen bg-slate-100 dark:bg-slate-950 flex flex-col">
      <header className="border-b border-slate-200 bg-white dark:border-slate-800 dark:bg-slate-900 shadow-sm sticky top-0 z-40">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex h-9 w-9 items-center justify-center rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-black text-slate-900 dark:text-white">
                  {activeDoctor.full_name}
                </h1>
                <span className="rounded bg-teal-50 px-2 py-0.5 text-[11px] font-bold text-teal-700 dark:bg-teal-950 dark:text-teal-300">
                  Doctor Chamber OPD Console
                </span>
              </div>
              <p className="text-[11px] text-slate-500">
                {activeDoctor.specialization} • Reg: {activeDoctor.reg_number} • {activeDoctor.clinic_name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle />
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-600 bg-emerald-50 px-3 py-1.5 rounded-full dark:bg-emerald-950 dark:text-emerald-300">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              OPD Session Active
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 mx-auto max-w-7xl w-full px-4 py-6 sm:px-6 lg:px-8 space-y-6">
        {error && (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-2 text-xs font-medium text-amber-800 dark:border-amber-900 dark:bg-amber-950/20 dark:text-amber-300">
            {error}
          </div>
        )}

        <div className="overflow-hidden rounded-2xl border-2 border-brand-600 bg-white shadow-lg shadow-brand-600/10 dark:bg-slate-900">
          <div className="bg-gradient-to-r from-brand-600 to-teal-700 p-5 text-white flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            {activePatient ? (
              <>
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-brand-600 font-black text-xl shadow">
                    #{activePatient.token_number}
                  </span>
                  <div>
                    <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                      Currently in Chamber
                    </span>
                    <h2 className="text-xl font-black mt-0.5">
                      {activePatient.patient_name}
                    </h2>
                    <p className="text-xs text-teal-100">
                      {activePatient.patient_phone || "Phone unavailable"} • {activePatient.time_slot || "Token in queue"}
                    </p>
                  </div>
                </div>

                <Link
                  href={`/doctor/consult/${activePatient.appointment_number}`}
                  className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-2.5 text-xs font-black text-brand-700 shadow-md hover:bg-teal-50 transition"
                >
                  <FileText className="h-4 w-4 text-brand-600" /> Open Prescription Studio <ArrowRight className="h-4 w-4" />
                </Link>
              </>
            ) : (
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-white font-black text-xl shadow">
                  --
                </div>
                <div>
                  <span className="rounded-full bg-white/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider">
                    Waiting for next patient
                  </span>
                  <h2 className="text-xl font-black mt-0.5">No patient in chamber</h2>
                </div>
              </div>
            )}
          </div>

          <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <AlertCircle className="h-4 w-4 text-amber-500" /> Patient Reported Chief Complaint
              </h3>
              <p className="rounded-xl border border-amber-200 bg-amber-50/40 p-3 text-xs leading-relaxed text-slate-800 dark:border-amber-950 dark:bg-amber-950/20 dark:text-slate-200">
                {activePatient && activePatient.symptoms_description ? `“${activePatient.symptoms_description}”` : "No active complaint is currently linked to this chamber."}
              </p>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <Clock className="h-4 w-4 text-brand-600" /> Queue Snapshot
              </h3>
              <div className="grid grid-cols-4 gap-2 text-center text-xs">
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-[10px] text-slate-500">Total</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{queue.length}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-[10px] text-slate-500">Now</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{activePatient ? activePatient.token_number : "--"}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-[10px] text-slate-500">Waiting</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">{upcomingQueue.length}</div>
                </div>
                <div className="rounded-xl border border-slate-200 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950">
                  <div className="text-[10px] text-slate-500">Status</div>
                  <div className="font-bold text-slate-900 dark:text-white mt-0.5">Live</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm dark:border-slate-800 dark:bg-slate-900">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Waiting Lobby Queue {isLoading ? "(Loading...)" : `(${upcomingQueue.length} Patients)`}
              </h3>
              <p className="text-xs text-slate-500">Next patients queued by reception desk.</p>
            </div>
            <Link href="/clinic/desk" className="text-xs font-semibold text-brand-600 hover:underline">
              Open Reception Desk Console
            </Link>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {isLoading && queue.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">Loading live queue…</div>
            ) : upcomingQueue.length === 0 ? (
              <div className="py-6 text-center text-xs text-slate-500">No patients waiting in the lobby.</div>
            ) : (
              upcomingQueue.map((item) => (
                <div key={item.appointment_number} className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3.5">
                  <div className="flex items-center gap-3">
                    <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-slate-100 text-xs font-bold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                      #{item.token_number}
                    </span>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                        {item.patient_name} <span className="text-[11px] font-normal text-slate-500">({item.time_slot || "Queued"})</span>
                      </h4>
                      <p className="text-[11px] text-slate-500 line-clamp-1">
                        {item.symptoms_description || item.patient_phone || "Awaiting consultation"}
                      </p>
                    </div>
                  </div>

                  <Link
                    href={`/doctor/consult/${item.appointment_number}`}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-slate-300 px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-300"
                  >
                    <FileText className="h-3.5 w-3.5 text-brand-600" /> Start Consultation
                  </Link>
                </div>
              ))
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
