"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { API_BASE_URL } from "@/lib/api";
import { 
  Building2, 
  UserCheck, 
  Clock, 
  Volume2, 
  Plus, 
  CheckCircle2, 
  CreditCard, 
  Phone, 
  UserPlus, 
  QrCode, 
  Printer, 
  RotateCw, 
  Check, 
  IndianRupee,
  Sparkles,
  ExternalLink,
  Stethoscope,
  Tv,
  Receipt,
  Star,
  Send,
  Calendar,
  X,
  Download
} from "lucide-react";
import QRCodeDisplay from "@/components/QRCodeDisplay";


// Web Audio API chime generator
function playTokenCallChime() {
  try {
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = audioCtx.currentTime;

    // Tone 1: 587.33 Hz (D5)
    const osc1 = audioCtx.createOscillator();
    const gain1 = audioCtx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(587.33, now);
    gain1.gain.setValueAtTime(0.3, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.5);
    osc1.connect(gain1);
    gain1.connect(audioCtx.destination);
    osc1.start(now);
    osc1.stop(now + 0.5);

    // Tone 2: 880.00 Hz (A5)
    const osc2 = audioCtx.createOscillator();
    const gain2 = audioCtx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(880.00, now + 0.2);
    gain2.gain.setValueAtTime(0.3, now + 0.2);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
    osc2.connect(gain2);
    gain2.connect(audioCtx.destination);
    osc2.start(now + 0.2);
    osc2.stop(now + 0.8);
  } catch (err) {
    console.error("Audio chime error:", err);
  }
}

export default function DashboardDeskPage() {
  // The desk starts empty and is hydrated from the server. Never seed this with
  // sample patients: a fabricated queue looks real to reception and would never
  // sync with the doctor or the pharmacy.
  const [queue, setQueue] = useState<any[]>([]);

  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
  const [doctors, setDoctors] = useState<any[]>([]);
  const [clinicSlug, setClinicSlug] = useState("");
  const [clinicName, setClinicName] = useState("");
  const [staffName, setStaffName] = useState("");
  const [publicOrigin, setPublicOrigin] = useState("");
  const [walkInDoctorSlug, setWalkInDoctorSlug] = useState("");
  const [walkInName, setWalkInName] = useState("");
  const [walkInPhone, setWalkInPhone] = useState("");
  const [walkInFee, setWalkInFee] = useState(600);
  const [walkInPaymentMode, setWalkInPaymentMode] = useState<"cash" | "upi">("upi");
  const [calledTokenMsg, setCalledTokenMsg] = useState<string | null>(null);
  const [isSearchingPhone, setIsSearchingPhone] = useState(false);
  const [foundPatient, setFoundPatient] = useState<any>(null);
  const [searchFeedback, setSearchFeedback] = useState<string | null>(null);

  // Automated WhatsApp Follow-up & Review Booster (Option B)
  const [showAutomationsModal, setShowAutomationsModal] = useState(false);
  // Loaded from /api/clinic/automations. Never seed this with sample patients —
  // the desk would show (and WhatsApp) messages that belong to nobody.
  const [automationsList, setAutomationsList] = useState<any[]>([]);
  const [loadingAutomations, setLoadingAutomations] = useState(false);
  const [dispatchingId, setDispatchingId] = useState<string | null>(null);

  const fetchAutomations = async () => {
    try {
      setLoadingAutomations(true);
      const res = await fetch(`/api/clinic/automations`);
      if (res.ok) {
        const json = await res.json();
        if (json.automations) setAutomationsList(json.automations);
      }
    } catch {
      // Keep local mock
    } finally {
      setLoadingAutomations(false);
    }
  };

  const handleTriggerAutomation = async (auto: any) => {
    setDispatchingId(auto.id);
    try {
      await fetch(`/api/clinic/trigger-automation/${auto.id}`, {
        method: "POST"
      }).catch(() => {});
      setAutomationsList(prev =>
        prev.map(a => a.id === auto.id ? { ...a, status: "sent" } : a)
      );
      if (auto.whatsapp_url) {
        window.open(auto.whatsapp_url, "_blank");
      }
    } catch {
      if (auto.whatsapp_url) {
        window.open(auto.whatsapp_url, "_blank");
      }
    } finally {
      setDispatchingId(null);
    }
  };

  const activeInConsultation = queue.find(q => q.status === "in_consultation");
  const waitingPatients = queue.filter(q => q.status === "waiting");
  const completedPatients = queue.filter(q => q.status === "completed");
  const nextWaiting = waitingPatients[0];

  const totalCollectedToday = queue
    .filter(q => q.payment_status === "paid")
    .reduce((acc, curr) => acc + curr.fee_amount, 0);

  const upiCollected = queue
    .filter(q => q.payment_status === "paid" && q.payment_mode === "upi")
    .reduce((acc, curr) => acc + curr.fee_amount, 0);

  const cashCollected = queue
    .filter(q => q.payment_status === "paid" && q.payment_mode === "cash")
    .reduce((acc, curr) => acc + curr.fee_amount, 0);

  // 1. Real-time Server-Sent Events (SSE) Listener
  useEffect(() => {
    let evtSource: EventSource | null = null;
    try {
      evtSource = new EventSource(`/api/clinic/stream`);
      evtSource.onmessage = (event) => {
        try {
          const payload = JSON.parse(event.data);
          if (payload.event === "token_called") {
            const data = payload.data;
            if (data.trigger_chime) {
              playTokenCallChime();
            }
            setQueue(prevQueue =>
              prevQueue.map(item => {
                if (item.status === "in_consultation") {
                  return { ...item, status: "completed" };
                }
                if (item.token_number === data.token_number) {
                  return { ...item, status: "in_consultation" };
                }
                return item;
              })
            );
            setCalledTokenMsg(`Live Broadcast: Token #${data.token_number} (${data.patient_name}) called`);
            setTimeout(() => setCalledTokenMsg(null), 5000);
          } else if (payload.event === "walk_in_registered") {
            const data = payload.data;
            // The event carries identity only — not the fee or payment status.
            // Re-read the server queue so reception never shows invented money.
            fetch(`/api/clinic/desk-queue`)
              .then((r) => (r.ok ? r.json() : null))
              .then((json) => {
                if (json && Array.isArray(json.queue)) setQueue(json.queue);
              })
              .catch(() => {});
            setCalledTokenMsg(`Live Broadcast: Walk-in token #${data.token_number} registered`);
            setTimeout(() => setCalledTokenMsg(null), 5000);
          } else if (payload.event === "queue_updated") {
            fetch(`/api/clinic/desk-queue`)
              .then((r) => (r.ok ? r.json() : null))
              .then((json) => {
                if (json && Array.isArray(json.queue)) setQueue(json.queue);
              })
              .catch(() => {});
          } else if (payload.event === "token_completed") {
            const data = payload.data;
            setQueue(prev =>
              prev.map(item =>
                item.token_number === data.token_number
                  ? { ...item, status: "completed" }
                  : item
              )
            );
            setCalledTokenMsg(`Live Broadcast: Token #${data.token_number} completed`);
            setTimeout(() => setCalledTokenMsg(null), 5000);
          }
        } catch (err) {
          console.error("SSE parse error:", err);
        }
      };
    } catch (err) {
      console.warn("SSE not available:", err);
    }

    return () => {
      if (evtSource) {
        evtSource.close();
      }
    };
  }, []);
  const fetchQueue = async () => {
    try {
      const res = await fetch(`/api/clinic/desk-queue`);
      if (res.ok) {
        const json = await res.json();
        // Always trust the server, including an empty queue. Guarding on
        // `length > 0` would leave stale (or sample) rows on screen after the
        // last patient of the day is completed.
        setQueue(Array.isArray(json.queue) ? json.queue : []);
      }
    } catch {
      // Keep whatever the server last returned; the next poll will retry.
    }
  };

  useEffect(() => {
    fetchQueue();
    // SSE gives instant updates; the poll is the safety net when the stream
    // drops (mobile networks, sleeping tabs, server restarts).
    const iv = setInterval(fetchQueue, 20000);
    return () => clearInterval(iv);
  }, []);

  // Doctors for the walk-in assignment dropdown. Without this the desk would
  // silently book every walk-in against a hardcoded doctor.
  useEffect(() => {
    let mounted = true;
    if (typeof window !== "undefined") setPublicOrigin(window.location.origin);
    (async () => {
      try {
        const meRes = await fetch(`/api/auth/me`);
        if (meRes.ok) {
          const me = await meRes.json().catch(() => null);
          if (mounted && me?.clinic_slug) setClinicSlug(String(me.clinic_slug));
          if (mounted && me?.clinic_name) setClinicName(String(me.clinic_name));
          if (mounted && me?.full_name) setStaffName(String(me.full_name));
        }
        const res = await fetch(`/api/doctors`);
        if (!res.ok) return;
        const json = await res.json();
        const list = Array.isArray(json) ? json : json.doctors || [];
        if (!mounted || !Array.isArray(list) || list.length === 0) return;
        setDoctors(list);
        setWalkInDoctorSlug((prev) => prev || list[0].slug);
        setWalkInFee((prev) =>
          prev && prev !== 600 ? prev : Number(list[0].consultation_fee || prev || 0)
        );
      } catch {
        // The dropdown will be empty; the desk can still cancel and retry.
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const handleCallToken = async (tokenNumber: number, patientName: string) => {
    playTokenCallChime();
    setQueue(prevQueue =>
      prevQueue.map(item => {
        if (item.status === "in_consultation") {
          return { ...item, status: "completed" };
        }
        if (item.token_number === tokenNumber) {
          return { ...item, status: "in_consultation" };
        }
        return item;
      })
    );

    setCalledTokenMsg(`Calling Token #${tokenNumber}: ${patientName}`);
    setTimeout(() => setCalledTokenMsg(null), 4000);

    const aptItem = queue.find(q => q.token_number === tokenNumber);
    if (aptItem?.appointment_number) {
      try {
        await fetch(`/api/clinic/call-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ appointment_number: aptItem.appointment_number })
        });
      } catch (e) {
        // Local state already updated
      }
      await fetchQueue();
    }
  };

  const handleTogglePayment = async (tokenNumber: number) => {
    const aptItem = queue.find(q => q.token_number === tokenNumber);
    if (!aptItem) return;
    const nextStatus = aptItem.payment_status === "paid" ? "pending" : "paid";

    setQueue(prevQueue =>
      prevQueue.map(item => {
        if (item.token_number === tokenNumber) {
          return { ...item, payment_status: nextStatus };
        }
        return item;
      })
    );

    if (aptItem.appointment_number) {
      try {
        await fetch(`/api/clinic/toggle-payment`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            appointment_number: aptItem.appointment_number,
            payment_status: nextStatus
          })
        });
      } catch (e) {}
      await fetchQueue();
    }
  };

  const handlePhoneChange = async (value: string) => {
    setWalkInPhone(value);
    const cleanDigits = value.replace(/\D/g, "").slice(-10);

    if (cleanDigits.length === 10) {
      setIsSearchingPhone(true);
      setSearchFeedback("Searching Clinic Memory...");
      try {
        const res = await fetch(`/api/patients/${cleanDigits}`);
        if (res.ok) {
          const data = await res.json();
          // GET /api/patients/[phone] returns { patient: { ...visits } }.
          const profile = data?.patient;
          if (profile?.full_name && profile.full_name !== "Patient") {
            setFoundPatient(data);
            setWalkInName(profile.full_name);

            // Check follow-up fee validity
            const lastVisit = profile.visits?.[0];
            const visitCount = profile.total_visits || profile.visits?.length || 1;

            let isFreeFollowup = false;
            if (lastVisit?.visit_date) {
              const daysDiff = (Date.now() - new Date(lastVisit.visit_date).getTime()) / (1000 * 60 * 60 * 24);
              if (daysDiff <= 7) {
                isFreeFollowup = true;
                setWalkInFee(0);
              } else if (daysDiff <= 14) {
                setWalkInFee(300);
              } else {
                setWalkInFee(600);
              }
            }

            setSearchFeedback(
              `✅ Returning Patient: ${profile.full_name} (${profile.age || '25'}${profile.gender?.[0] || 'M'}) • ${visitCount} previous visits • ${isFreeFollowup ? '🎉 Free Follow-up (Within 7 Days)' : 'Follow-up Active'}`
            );
            return;
          }
        }
        setFoundPatient(null);
        setSearchFeedback("✨ New Patient: Enter full name & details to create permanent health record.");
      } catch (err) {
        setFoundPatient(null);
        setSearchFeedback(null);
      } finally {
        setIsSearchingPhone(false);
      }
    } else {
      setFoundPatient(null);
      setSearchFeedback(null);
    }
  };

  const handleAdmitWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName || !walkInPhone) return;
    if (!walkInDoctorSlug) {
      setCalledTokenMsg("❌ Select the doctor this walk-in is for.");
      setTimeout(() => setCalledTokenMsg(null), 6000);
      return;
    }

    try {
      const res = await fetch(`/api/clinic/walk-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: walkInName,
          patient_phone: walkInPhone,
          fee_amount: walkInFee,
          payment_mode: walkInPaymentMode,
          doctor_slug: walkInDoctorSlug
        })
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        // Never invent a local fallback token: a token that exists only in this
        // browser is invisible to the doctor and the pharmacy.
        setCalledTokenMsg(`❌ Walk-in failed: ${data.error || res.statusText}`);
        setTimeout(() => setCalledTokenMsg(null), 6000);
        return;
      }

      playTokenCallChime();
      await fetchQueue();
      setCalledTokenMsg(`✅ Token #${data.appointment?.token_number} Generated for ${walkInName}`);
      setShowWalkInModal(false);
      setWalkInName("");
      setWalkInPhone("");
      setFoundPatient(null);
      setSearchFeedback(null);
      setTimeout(() => setCalledTokenMsg(null), 5000);
    } catch (err: any) {
      setCalledTokenMsg(`❌ Walk-in failed: ${err?.message || "network error"}`);
      setTimeout(() => setCalledTokenMsg(null), 6000);
    }
  };

  return (
    <div className="space-y-4">
      {/* 1. TOP HEADER & TOOLBAR */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-semibold tracking-wider uppercase">
              DESK CONSOLE
            </span>
            <h1 className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              {staffName || "Front Desk"}{clinicName ? ` | ${clinicName}` : ""}
            </h1>
          </div>
          <p className="text-xs text-slate-500 mt-0.5">
            Real-time OPD throughput console • Direct soundbox reconciliation & 1-tap token calling
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Link
            href="/dashboard"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-white/[0.1] dark:bg-[#151618] dark:text-slate-200 transition"
            title="Switch to Doctor OPD Cockpit"
          >
            <Stethoscope className="h-3.5 w-3.5 text-[#0071E3]" />
            <span>Doctor Cockpit</span>
          </Link>

          <Link
            href="/display/waiting-room"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-white/[0.1] dark:bg-[#151618] dark:text-slate-200 transition"
            title="Launch Smart TV Waiting Room Wall Display"
          >
            <Tv className="h-3.5 w-3.5 text-indigo-500" />
            <span>TV Display</span>
          </Link>

          <Link
            href="/clinic/settlement"
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-white/[0.1] dark:bg-[#151618] dark:text-slate-200 transition"
            title="Shift Day-Closing Cash Settlement"
          >
            <Receipt className="h-3.5 w-3.5 text-emerald-600" />
            <span>Settle Shift</span>
          </Link>

          <button
            onClick={() => {
              fetchAutomations();
              setShowAutomationsModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-white/[0.1] dark:bg-[#151618] dark:text-slate-200 transition cursor-pointer"
            title="View scheduled WhatsApp follow-ups"
          >
            <Sparkles className="h-3.5 w-3.5 text-amber-500" />
            <span>Follow-ups</span>
            <span className="rounded bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300 text-[10px] font-semibold px-1.5 py-0.2">
              {automationsList.filter(a => a.status === "scheduled").length}
            </span>
          </button>

          <button
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 shadow-xs hover:bg-slate-50 dark:border-white/[0.1] dark:bg-[#151618] dark:text-slate-200 transition cursor-pointer"
          >
            <QrCode className="h-3.5 w-3.5 text-slate-500" />
            <span>QR</span>
          </button>

          <button
            onClick={() => setShowWalkInModal(true)}
            className="inline-flex items-center gap-1.5 rounded-lg bg-[#0071E3] hover:bg-[#0077ED] px-3.5 py-1.5 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>Admit Walk-In</span>
          </button>
        </div>
      </div>

      {/* TOAST ALERT */}
      {calledTokenMsg && (
        <div className="rounded-lg bg-slate-900 text-white px-4 py-2.5 text-xs font-medium shadow-md flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-emerald-400 animate-pulse" />
            <span>{calledTokenMsg}</span>
          </div>
          <span className="text-slate-400 font-normal text-[11px]">Audio Chime Broadcasted</span>
        </div>
      )}

      {/* 2. LIVE THROUGHPUT CALL BAR */}
      <div className="rounded-xl border border-slate-200/90 dark:border-white/[0.08] bg-white dark:bg-[#151618] p-4 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4 flex-wrap">
            {/* In Chamber Status */}
            <div className="flex items-center gap-2.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
              <div>
                <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                  In Chamber
                </span>
                <div className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                  <span className="font-mono text-emerald-600 dark:text-emerald-400">
                    {activeInConsultation?.token_number ? `#${activeInConsultation.token_number}` : "—"}
                  </span>
                  <span>{activeInConsultation?.patient_name || "No patient in chamber"}</span>
                </div>
              </div>
            </div>

            <div className="hidden sm:block h-8 w-px bg-slate-200 dark:bg-white/[0.08]" />

            {/* Next in Line */}
            {nextWaiting ? (
              <div className="flex items-center gap-2.5">
                <span className="h-2 w-2 rounded-full bg-amber-500 shrink-0" />
                <div>
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                    Next in Line
                  </span>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                    <span className="font-mono text-amber-600 dark:text-amber-400">
                      #{nextWaiting.token_number}
                    </span>
                    <span>{nextWaiting.patient_name}</span>
                    <span className="text-[11px] font-normal text-slate-400">· Est. 15m</span>
                  </div>
                </div>
              </div>
            ) : (
              <div className="text-xs text-slate-500 flex items-center gap-1.5">
                <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                <span>All scheduled tokens called</span>
              </div>
            )}
          </div>

          {/* Action Trigger */}
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => nextWaiting && handleCallToken(nextWaiting.token_number, nextWaiting.patient_name)}
              disabled={!nextWaiting}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs shadow-xs transition disabled:opacity-50 cursor-pointer"
            >
              <Volume2 className="h-4 w-4" />
              <span>{nextWaiting ? `Call Token #${nextWaiting.token_number}` : "Queue Cleared"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWalkInModal(true)}
              className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-800 dark:border-white/[0.1] dark:bg-[#1E2024] dark:text-slate-200 text-xs font-medium shadow-xs transition cursor-pointer"
            >
              <Plus className="h-4 w-4 text-slate-500" />
              <span>Add Walk-In</span>
            </button>
          </div>
        </div>
      </div>

      {/* 3. COMPACT OPERATIONAL METRICS */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-white/[0.08] dark:bg-[#151618]">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="h-3.5 w-3.5 text-[#0071E3]" /> Active Chamber
          </div>
          <div className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono truncate">
            {activeInConsultation ? `#${activeInConsultation.token_number} ${activeInConsultation.patient_name}` : "Chamber Idle"}
          </div>
          <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <Check className="h-3 w-3" />
            <span>Counter payments enabled</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-white/[0.08] dark:bg-[#151618]">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5 text-amber-500" /> Waiting in Lounge
          </div>
          <div className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
            {waitingPatients.length} Patients
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Est. wait: {waitingPatients.length * 12} mins
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-white/[0.08] dark:bg-[#151618]">
          <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="h-3.5 w-3.5 text-indigo-500" /> UPI Settlement
          </div>
          <div className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
            ₹{upiCollected.toLocaleString("en-IN")}
          </div>
          <p className="mt-0.5 text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
            <span>Direct Bank Transfer Synced</span>
          </p>
        </div>

        <div className="rounded-xl border border-slate-200/80 bg-white p-3.5 shadow-xs dark:border-white/[0.08] dark:bg-[#151618]">
          <div className="flex items-center justify-between">
            <div className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider flex items-center gap-1.5">
              <IndianRupee className="h-3.5 w-3.5 text-slate-600" /> Cash in Drawer
            </div>
            <Link
              href="/clinic/settlement"
              className="text-[10px] font-semibold text-[#0071E3] hover:underline"
            >
              Settle →
            </Link>
          </div>
          <div className="mt-1 text-xl font-bold tracking-tight text-slate-900 dark:text-white font-mono">
            ₹{cashCollected.toLocaleString("en-IN")}
          </div>
          <p className="mt-0.5 text-[11px] text-slate-500">
            Total Gross: ₹{totalCollectedToday.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* 4. PROMINENT QUEUE TABLE */}
      <div className="rounded-xl border border-slate-200/80 bg-white shadow-xs dark:border-white/[0.08] dark:bg-[#151618] overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-200/70 dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-[#0071E3]" />
            <h2 className="text-xs font-bold uppercase tracking-wider text-slate-800 dark:text-slate-200">
              Live Queue ({queue.length} Total · {waitingPatients.length} Waiting)
            </h2>
          </div>
          <span className="text-[11px] text-slate-500">
            1-Click Call Bell plays dual-harmonic speaker tone
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-200/70 dark:border-white/[0.06] text-slate-500 font-medium">
              <tr>
                <th className="px-4 py-2.5">Token</th>
                <th className="px-4 py-2.5">Patient Name</th>
                <th className="px-4 py-2.5">Contact</th>
                <th className="px-4 py-2.5">Queue Status</th>
                <th className="px-4 py-2.5">Payment</th>
                <th className="px-4 py-2.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
              {queue.map((item, idx) => (
                <tr key={item.id || item.appointment_number || `token-${item.token_number}-${idx}`} className="hover:bg-slate-50/60 dark:hover:bg-white/[0.02] transition">
                  <td className="px-4 py-2.5">
                    <span className="inline-flex items-center justify-center px-2 py-0.5 rounded-md bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono font-bold text-xs">
                      #{item.token_number}
                    </span>
                  </td>
                  <td className="px-4 py-2.5">
                    <div className="font-semibold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <span>{item.patient_name}</span>
                      {item.is_walk_in && (
                        <span className="rounded bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-300 px-1.5 py-0.2 text-[10px] font-medium border border-blue-200/60 dark:border-blue-900/40">
                          Walk-In
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-slate-400">{item.time_slot}</div>
                  </td>
                  <td className="px-4 py-2.5 text-slate-500 font-mono text-xs">
                    {item.patient_phone}
                  </td>
                  <td className="px-4 py-2.5">
                    {item.status === "in_consultation" ? (
                      <span className="inline-flex items-center gap-1.5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200/60 px-2 py-0.5 text-[11px] font-medium dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-900/40">
                        <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                        In Chamber
                      </span>
                    ) : item.status === "waiting" ? (
                      <span className="inline-flex items-center gap-1 rounded-md bg-amber-50 text-amber-800 border border-amber-200/60 px-2 py-0.5 text-[11px] font-medium dark:bg-amber-950/40 dark:text-amber-300 dark:border-amber-900/40">
                        <Clock className="h-3 w-3 text-amber-500" />
                        Waiting (15m)
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-600 border border-slate-200/60 px-2 py-0.5 text-[11px] font-medium dark:bg-white/[0.05] dark:text-slate-400 dark:border-white/[0.08]">
                        <Check className="h-3 w-3 text-slate-400" />
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    <button
                      type="button"
                      onClick={() => handleTogglePayment(item.token_number)}
                      className={`inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium border transition cursor-pointer ${
                        item.payment_status === "paid"
                          ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-900/40"
                          : "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-950/40 dark:text-rose-300 dark:border-rose-900/40"
                      }`}
                      title="Tap to toggle payment status"
                    >
                      {item.payment_status === "paid" ? (
                        <>
                          <CheckCircle2 className="h-3 w-3 text-emerald-600" />
                          <span>Paid · ₹{item.fee_amount} ({item.payment_mode.toUpperCase()})</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3 w-3 text-rose-600" />
                          <span>Pending · Collect ₹{item.fee_amount}</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {item.status === "waiting" ? (
                        <button
                          type="button"
                          onClick={() => handleCallToken(item.token_number, item.patient_name)}
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-600 hover:bg-emerald-700 px-2.5 py-1 text-xs font-semibold text-white shadow-xs transition cursor-pointer"
                        >
                          <Volume2 className="h-3 w-3" />
                          <span>Call</span>
                        </button>
                      ) : item.status === "in_consultation" ? (
                        <Link
                          href={`/dashboard/consult/${item.appointment_number}`}
                          className="inline-flex items-center gap-1 rounded-md border border-slate-200 bg-white px-2.5 py-1 text-xs font-medium text-slate-700 hover:bg-slate-50 dark:border-white/[0.1] dark:bg-[#1E2024] dark:text-slate-300 transition"
                        >
                          <span>Open Rx</span>
                          <ExternalLink className="h-3 w-3 text-slate-400" />
                        </Link>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* WALK-IN MODAL */}
      {showWalkInModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-xl border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-[#151618] p-6 shadow-2xl">
            <h3 className="text-lg font-bold tracking-tight text-[#1D1D1F] dark:text-white flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-apple-blue" />
              10-Second Walk-In Admission
            </h3>
            <p className="text-xs text-[#86868B] mt-1">
              Enter phone number to auto-detect returning patient memory or register new patient
            </p>

            <form onSubmit={handleAdmitWalkIn} className="mt-5 space-y-3.5 text-xs">
              {/* 1. PHONE NUMBER (FIRST) */}
              <div>
                <div className="flex items-center justify-between">
                  <label className="font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                    <Phone className="h-3.5 w-3.5 text-apple-blue" />
                    <span>1. Patient Mobile Number</span>
                  </label>
                  {isSearchingPhone && (
                    <span className="text-[10px] text-apple-blue animate-pulse flex items-center gap-1">
                      <RotateCw className="h-3 w-3 animate-spin" /> Searching...
                    </span>
                  )}
                </div>
                <input
                  type="tel"
                  required
                  autoFocus
                  placeholder="e.g. 98765 43210 (10 digits)"
                  value={walkInPhone}
                  onChange={e => handlePhoneChange(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-mono text-sm font-semibold text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 tracking-wider"
                />
              </div>

              {/* CLINIC MEMORY STATUS BANNER */}
              {searchFeedback && (
                <div className={`p-2.5 rounded-xl border text-xs leading-relaxed animate-in fade-in duration-200 ${
                  foundPatient 
                    ? "bg-emerald-500/10 border-emerald-500/25 text-emerald-900 dark:text-emerald-200" 
                    : "bg-blue-500/10 border-blue-500/25 text-blue-900 dark:text-blue-200"
                }`}>
                  <div className="font-semibold flex items-center gap-1.5">
                    {foundPatient ? <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" /> : <Sparkles className="h-3.5 w-3.5 text-blue-600 shrink-0" />}
                    <span>{searchFeedback}</span>
                  </div>
                </div>
              )}

              {/* 2. PATIENT FULL NAME */}
              <div>
                <label className="font-medium text-[#1D1D1F] dark:text-white">
                  2. Patient Full Name {foundPatient && <span className="text-emerald-600 text-[10px] font-bold font-mono">(Found in Records)</span>}
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={walkInName}
                  onChange={e => setWalkInName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30 font-medium"
                />
              </div>

              {/* 3. DOCTOR */}
              <div>
                <label className="font-medium text-[#1D1D1F] dark:text-white">3. Consulting Doctor</label>
                <select
                  required
                  value={walkInDoctorSlug}
                  onChange={e => {
                    const slug = e.target.value;
                    setWalkInDoctorSlug(slug);
                    const doc = doctors.find((d: any) => d.slug === slug);
                    if (doc) setWalkInFee(Number(doc.consultation_fee || 0));
                  }}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                >
                  <option value="" disabled>
                    {doctors.length === 0 ? "Loading doctors…" : "Select a doctor"}
                  </option>
                  {doctors.map((doc: any) => (
                    <option key={doc.slug} value={doc.slug}>
                      {doc.full_name}
                      {doc.specialization ? ` — ${doc.specialization}` : ""}
                    </option>
                  ))}
                </select>
              </div>

              {/* 4. FEE & PAYMENT MODE */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between">
                    <label className="font-medium text-[#1D1D1F] dark:text-white">Consultation Fee</label>
                    {walkInFee === 0 && (
                      <span className="text-[10px] text-emerald-600 font-black uppercase">Free</span>
                    )}
                  </div>
                  <input
                    type="number"
                    value={walkInFee}
                    onChange={e => setWalkInFee(Number(e.target.value))}
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-mono text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  />
                </div>
                <div>
                  <label className="font-medium text-[#1D1D1F] dark:text-white">Payment Mode</label>
                  <select
                    value={walkInPaymentMode}
                    onChange={e => setWalkInPaymentMode(e.target.value as any)}
                    className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                  >
                    <option value="upi">UPI (PhonePe / Soundbox)</option>
                    <option value="cash">Counter Cash</option>
                  </select>
                </div>
              </div>

              <div className="flex gap-2.5 pt-3">
                <button
                  type="button"
                  onClick={() => setShowWalkInModal(false)}
                  className="flex-1 rounded-full border border-black/[0.1] dark:border-white/[0.12] py-2.5 font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-apple-blue py-2.5 font-semibold text-white shadow-apple-sm hover:bg-[#0077ED] active:scale-95 transition"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>Admit &amp; Generate Token</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* QR STAND MODAL */}
      {showQrModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-sm rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-7 text-center shadow-apple-modal space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                Reception Counter QR Stand
              </h3>
              <p className="text-xs text-[#86868B] mt-0.5">
                Scan to track live queue token on phone or self check-in
              </p>
            </div>

            <div className="mx-auto my-2 flex items-center justify-center">
              {clinicSlug ? (
                <QRCodeDisplay
                  value={`${publicOrigin}/waiting-room?clinic=${encodeURIComponent(clinicSlug)}`}
                  size={180}
                  level="H"
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                  showDownloadBtn={true}
                  downloadFilename={`${clinicSlug}-counter-qr`}
                  centerBadgeText="TOKEN QR"
                />
              ) : (
                <div className="h-[180px] w-[180px] rounded-xl border border-dashed border-black/[0.12] dark:border-white/[0.15] flex items-center justify-center text-[11px] text-[#86868B] text-center px-4">
                  Loading your clinic&apos;s queue link…
                </div>
              )}
            </div>

            <div className="text-xs font-mono font-medium text-apple-blue break-all">
              {clinicSlug ? `${publicOrigin}/waiting-room?clinic=${clinicSlug}` : "—"}
            </div>

            <div className="pt-2 flex flex-col gap-2">
              <Link
                href="/dashboard/standee"
                className="w-full rounded-full bg-[#0071E3] hover:bg-[#0077ED] py-2.5 text-xs font-bold text-white shadow-apple-sm active:scale-95 transition text-center"
              >
                🖨️ Open Full Standee Studio (A5 Tent / A4) ➔
              </Link>
              <button
                onClick={() => setShowQrModal(false)}
                className="w-full rounded-full border border-black/[0.1] dark:border-white/[0.12] py-2 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] active:scale-95 transition"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}


      {/* ⚡ OPTION B: AUTOMATED WHATSAPP FOLLOW-UP & GOOGLE REVIEW MODAL */}
      {showAutomationsModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md animate-in fade-in duration-150">
          <div className="w-full max-w-3xl rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-6 sm:p-7 shadow-apple-modal max-h-[85vh] flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.06] pb-4">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-emerald-500/15 text-emerald-600 dark:text-emerald-400">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                    Automated WhatsApp Follow-Up & Google Review Engine
                  </h3>
                  <p className="text-xs text-[#86868B] mt-0.5">
                    Live schedule queue: Rx Dispatches, Evening 5-Star Reviews & Follow-Up Reminders
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowAutomationsModal(false)}
                className="rounded-full p-2 text-[#86868B] hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Content List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1">
              {automationsList.map((item) => (
                <div
                  key={item.id}
                  className="rounded-2xl border border-black/[0.06] dark:border-white/[0.08] bg-[#F5F5F7]/60 dark:bg-[#2C2C2E]/60 p-4 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold ${
                        item.trigger_type === "rx_dispatch"
                          ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                          : item.trigger_type === "google_review"
                          ? "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                          : "bg-indigo-500/15 text-indigo-700 dark:text-indigo-300"
                      }`}>
                        {item.trigger_type === "google_review" && <Star className="h-3 w-3 fill-current" />}
                        {item.trigger_type === "followup_reminder" && <Calendar className="h-3 w-3" />}
                        <span>{item.title}</span>
                      </span>

                      <span className="font-mono text-xs font-bold text-[#1D1D1F] dark:text-white">
                        {item.patient_name}
                      </span>
                      <span className="text-[11px] text-[#86868B]">({item.patient_phone})</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] text-[#86868B] flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {item.scheduled_for}
                      </span>
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        item.status === "sent"
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300"
                          : "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300"
                      }`}>
                        {item.status === "sent" ? "✓ Sent" : "Scheduled"}
                      </span>
                    </div>
                  </div>

                  <div className="rounded-xl bg-white dark:bg-[#1C1C1E] p-3 text-xs text-[#1D1D1F] dark:text-white border border-black/[0.04] dark:border-white/[0.04] font-mono whitespace-pre-line text-[11px]">
                    {item.message_text}
                  </div>

                  <div className="flex items-center justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => handleTriggerAutomation(item)}
                      disabled={dispatchingId === item.id}
                      className="inline-flex items-center gap-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white px-3.5 py-1.5 text-xs font-bold shadow-sm active:scale-95 transition cursor-pointer"
                    >
                      <Send className="h-3.5 w-3.5" />
                      <span>{dispatchingId === item.id ? "Launching..." : "Send Now via WhatsApp"}</span>
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-3 flex justify-between items-center text-xs text-[#86868B]">
              <span>Powered by WhatsApp Direct Bridge • 0% Commission</span>
              <button
                type="button"
                onClick={() => setShowAutomationsModal(false)}
                className="rounded-full border border-black/[0.1] dark:border-white/[0.12] px-4 py-1.5 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.06] transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
