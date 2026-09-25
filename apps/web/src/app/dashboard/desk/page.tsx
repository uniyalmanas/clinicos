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
  const [queue, setQueue] = useState<any[]>([
    {
      appointment_number: "APT-DERMA-101",
      token_number: 11,
      patient_name: "Amit Rawat",
      patient_phone: "+919123456780",
      status: "completed",
      time_slot: "10:15 AM",
      fee_amount: 600,
      payment_status: "paid",
      payment_mode: "upi",
      is_walk_in: false
    },
    {
      appointment_number: "APT-DERMA-102",
      token_number: 12,
      patient_name: "Priya Singh",
      patient_phone: "+919123456781",
      status: "in_consultation",
      time_slot: "10:30 AM (Acne Consult)",
      fee_amount: 600,
      payment_status: "paid",
      payment_mode: "upi",
      is_walk_in: false
    },
    {
      appointment_number: "APT-DERMA-103",
      token_number: 13,
      patient_name: "Rohit V.",
      patient_phone: "+919123456782",
      status: "waiting",
      time_slot: "10:45 AM (BP Check)",
      fee_amount: 600,
      payment_status: "pending",
      payment_mode: "cash",
      is_walk_in: false
    },
    {
      appointment_number: "APT-DERMA-104",
      token_number: 14,
      patient_name: "Anjali K.",
      patient_phone: "+919876511111",
      status: "waiting",
      time_slot: "11:00 AM (Laser Consult)",
      fee_amount: 1200,
      payment_status: "pending",
      payment_mode: "cash",
      is_walk_in: false
    },
    {
      appointment_number: "APT-WALKIN-105",
      token_number: 15,
      patient_name: "Vikram P.",
      patient_phone: "+919876522222",
      status: "waiting",
      time_slot: "11:15 AM (Eczema Walk-In)",
      fee_amount: 600,
      payment_status: "pending",
      payment_mode: "cash",
      is_walk_in: true
    }
  ]);

  const [showWalkInModal, setShowWalkInModal] = useState(false);
  const [showQrModal, setShowQrModal] = useState(false);
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
  const [automationsList, setAutomationsList] = useState<any[]>([
    {
      id: "auto-rx-101",
      appointment_number: "APT-DERMA-101",
      patient_name: "Amit Rawat",
      patient_phone: "+919123456780",
      trigger_type: "rx_dispatch",
      title: "Instant Rx WhatsApp Dispatch",
      badge: "Immediate",
      scheduled_for: "Immediate (0 Min)",
      status: "sent",
      sent_at: "10:35 AM",
      message_text: "Namaste Amit Rawat,\nYour digital prescription from Dr. Rahul Sharma at DermaCare Skin & Laser Clinic is ready.\n\n📄 View & Download Rx: http://localhost:3000/prescriptions/RX-2026-09-1024\n💊 Please take medicines as advised after meals.\n\nWishing you good health!",
      whatsapp_url: "https://wa.me/919123456780?text=" + encodeURIComponent("Namaste Amit Rawat,\nYour digital prescription is ready: http://localhost:3000/prescriptions/RX-2026-09-1024")
    },
    {
      id: "auto-rev-101",
      appointment_number: "APT-DERMA-101",
      patient_name: "Amit Rawat",
      patient_phone: "+919123456780",
      trigger_type: "google_review",
      title: "Google 5-Star Review Booster",
      badge: "Evening Booster",
      scheduled_for: "Today at 19:30 PM",
      status: "scheduled",
      message_text: "Namaste Amit Rawat! We hope you are recovering well after your visit with Dr. Rahul Sharma at DermaCare. ⭐ If you had a helpful and comforting experience, could you please take 15 seconds to support our clinic with a 5-star Google review? 👉 https://g.page/r/derma-care-dehradun/review",
      whatsapp_url: "https://wa.me/919123456780?text=" + encodeURIComponent("Namaste Amit Rawat! If you had a good experience with Dr. Rahul Sharma, please leave us a 5-star Google review: https://g.page/r/derma-care-dehradun/review")
    },
    {
      id: "auto-flw-101",
      appointment_number: "APT-DERMA-101",
      patient_name: "Amit Rawat",
      patient_phone: "+919123456780",
      trigger_type: "followup_reminder",
      title: "Follow-Up Validity Expiry Alert",
      badge: "Day 5 Reminder",
      scheduled_for: "24-Sep-2026 (Day 5)",
      status: "scheduled",
      message_text: "Namaste Amit Rawat, gentle reminder from DermaCare Clinic: Your consultation follow-up validity with Dr. Rahul Sharma expires in 48 hours. Tap here to view queue & reserve your priority token: http://localhost:3000/doctors/dr-rahul-sharma",
      whatsapp_url: "https://wa.me/919123456780?text=" + encodeURIComponent("Namaste Amit Rawat, your follow-up validity expires in 48h. Reserve token: http://localhost:3000/doctors/dr-rahul-sharma")
    }
  ]);
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
            setQueue(prev => {
              if (prev.some(q => q.token_number === data.token_number)) return prev;
              return [
                ...prev,
                {
                  appointment_number: data.appointment_number,
                  token_number: data.token_number,
                  patient_name: data.patient_name,
                  patient_phone: "+91 98765 00000",
                  status: "waiting",
                  time_slot: "Immediate Walk-In",
                  fee_amount: 600,
                  payment_status: "paid",
                  payment_mode: "upi",
                  is_walk_in: true
                }
              ];
            });
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
        if (json.queue && json.queue.length > 0) {
          setQueue(json.queue);
        }
      }
    } catch {
      // Keep local mock
    }
  };

  useEffect(() => {
    fetchQueue();
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
          if (data?.patientProfile?.full_name && data.patientProfile.full_name !== "Patient") {
            setFoundPatient(data);
            setWalkInName(data.patientProfile.full_name);

            // Check follow-up fee validity
            const lastVisit = data.visits?.[0];
            const visitCount = data.total_visits || data.visits?.length || 1;

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
              `✅ Returning Patient: ${data.patientProfile.full_name} (${data.patientProfile.age || '25'}${data.patientProfile.gender?.[0] || 'M'}) • ${visitCount} previous visits • ${isFreeFollowup ? '🎉 Free Follow-up (Within 7 Days)' : 'Follow-up Active'}`
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

    try {
      const res = await fetch(`/api/clinic/walk-in`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          patient_name: walkInName,
          patient_phone: walkInPhone,
          fee_amount: walkInFee,
          payment_mode: walkInPaymentMode,
          clinic_slug: "derma-care-dehradun",
          doctor_slug: "dr-rahul-sharma"
        })
      });

      playTokenCallChime();

      if (res.ok) {
        const data = await res.json();
        setQueue(prev => [...prev, data.appointment]);
        const assignedToken = data.appointment?.token_number;
        setCalledTokenMsg(`✅ Token #${assignedToken} Generated for ${walkInName}`);
      } else {
        const nextTokenNum = Math.max(...queue.map(q => q.token_number), 0) + 1;
        setQueue(prev => [
          ...prev,
          {
            appointment_number: `APT-WALKIN-${100 + nextTokenNum}`,
            token_number: nextTokenNum,
            patient_name: walkInName,
            patient_phone: walkInPhone,
            status: "waiting",
            time_slot: "Immediate Walk-In",
            fee_amount: walkInFee,
            payment_status: "paid",
            payment_mode: walkInPaymentMode,
            is_walk_in: true
          }
        ]);
        setCalledTokenMsg(`✅ Token #${nextTokenNum} Generated for ${walkInName}`);
      }
    } catch {
      const nextTokenNum = Math.max(...queue.map(q => q.token_number), 0) + 1;
      setQueue(prev => [
        ...prev,
        {
          appointment_number: `APT-WALKIN-${100 + nextTokenNum}`,
          token_number: nextTokenNum,
          patient_name: walkInName,
          patient_phone: walkInPhone,
          status: "waiting",
          time_slot: "Immediate Walk-In",
          fee_amount: walkInFee,
          payment_status: "paid",
          payment_mode: walkInPaymentMode,
          is_walk_in: true
        }
      ]);
      setCalledTokenMsg(`✅ Token #${nextTokenNum} Generated for ${walkInName}`);
    } finally {
      setShowWalkInModal(false);
      setWalkInName("");
      setWalkInPhone("");
      setFoundPatient(null);
      setSearchFeedback(null);
      setTimeout(() => setCalledTokenMsg(null), 5000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & MODAL TRIGGERS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-2.5 py-0.5 rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900 text-[10px] font-black tracking-wider uppercase">
              DESK CONSOLE
            </span>
            <h1 className="text-lg sm:text-xl font-black tracking-tight text-[#1D1D1F] dark:text-white">
              CONSOLE: Pooja | DR. RAHUL
            </h1>
          </div>
          <p className="text-xs text-[#86868B] mt-0.5">
            Real-time OPD throughput console • Direct soundbox reconciliation &amp; 1-tap token calling
          </p>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <Link
            href="/display/waiting-room"
            target="_blank"
            className="inline-flex items-center gap-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 px-4 py-2 text-xs font-semibold text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/20 active:scale-95 transition"
            title="Launch Smart TV Waiting Room Wall Display"
          >
            <Tv className="h-4 w-4" />
            <span>Waiting Room TV</span>
          </Link>

          <Link
            href="/clinic/settlement"
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition"
            title="Shift Day-Closing Cash Settlement"
          >
            <Receipt className="h-4 w-4" />
            <span>Settle Shift</span>
          </Link>

          <button
            onClick={() => {
              fetchAutomations();
              setShowAutomationsModal(true);
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-4 py-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/20 active:scale-95 transition"
            title="View scheduled WhatsApp follow-ups & Google review boosters"
          >
            <Sparkles className="h-4 w-4" />
            <span>WhatsApp Follow-ups</span>
            <span className="rounded-full bg-emerald-600 text-white text-[9px] font-bold px-1.5 py-0.2">
              {automationsList.filter(a => a.status === "scheduled").length}
            </span>
          </button>

          <Link
            href="/dashboard/standee"
            className="inline-flex items-center gap-1.5 rounded-full border border-blue-500/20 bg-blue-500/10 px-4 py-2 text-xs font-semibold text-[#0071E3] dark:text-[#2997FF] hover:bg-blue-500/20 active:scale-95 transition"
            title="Design & Print Front Desk Acrylic Tent Cards & Posters"
          >
            <QrCode className="h-4 w-4" />
            <span>Standee Studio</span>
          </Link>

          <button
            onClick={() => setShowQrModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] px-4 py-2 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition"
          >
            <QrCode className="h-4 w-4 text-apple-blue" />
            <span>Counter QR</span>
          </button>

          <button
            onClick={() => setShowWalkInModal(true)}
            className="inline-flex items-center gap-1.5 rounded-full bg-apple-blue hover:bg-[#0077ED] px-4 py-2 text-xs font-semibold text-white shadow-apple-sm active:scale-95 transition"
          >
            <Plus className="h-4 w-4" />
            <span>Admit Walk-In (10s)</span>
          </button>
        </div>
      </div>

      {/* TOAST ALERT */}
      {calledTokenMsg && (
        <div className="rounded-full bg-[#1D1D1F] text-white px-5 py-3 text-xs font-medium shadow-apple-card flex items-center justify-between animate-in fade-in">
          <div className="flex items-center gap-2">
            <Volume2 className="h-4 w-4 text-apple-teal animate-pulse" />
            <span>{calledTokenMsg}</span>
          </div>
          <span className="text-[#86868B] font-normal text-[11px]">Audio Chime Broadcasted</span>
        </div>
      )}

      {/* ⚡ HERO CALL CONSOLE — THE ONE-HANDED RECEPTIONIST TEST */}
      <div className="rounded-[28px] border-2 border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-white to-white dark:from-emerald-950/30 dark:via-[#1C1C1E] dark:to-[#1C1C1E] p-6 shadow-apple-card space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-xs font-black uppercase tracking-wider text-emerald-800 dark:text-emerald-300">
                LIVE QUEUE:
              </span>
            </div>
            <div className="space-y-1.5">
              <div className="flex items-baseline gap-2 text-base sm:text-lg font-bold text-[#1D1D1F] dark:text-white flex-wrap">
                <span className="text-emerald-600 dark:text-emerald-400 font-black font-mono">
                  #{activeInConsultation?.token_number || 12}
                </span>
                <span>{activeInConsultation?.patient_name || "Priya Singh"}</span>
                <span className="text-xs font-medium text-[#86868B] dark:text-[#8E8E93]">
                  • Est. Wait: 24m •
                </span>
                <span className="text-xs font-black text-emerald-600 dark:text-emerald-400">
                  {activeInConsultation?.payment_status === "paid" ? "PAID ✅" : "PENDING ⏳"}
                </span>
              </div>
              {nextWaiting && (
                <div className="flex items-baseline gap-2 text-sm sm:text-base font-semibold text-[#1D1D1F] dark:text-white flex-wrap">
                  <span className="text-amber-600 dark:text-amber-400 font-black font-mono">
                    #{nextWaiting.token_number}
                  </span>
                  <span>{nextWaiting.patient_name}</span>
                  <span className="text-xs font-medium text-[#86868B] dark:text-[#8E8E93]">
                    • Est. Wait: 15m •
                  </span>
                  <span className="text-xs font-black text-amber-600 dark:text-amber-400">
                    {nextWaiting.payment_status === "paid" ? "PAID ✅" : "PENDING ⏳"}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* GIANT PRIMARY ONE-HANDED ACTION BUTTONS */}
          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => nextWaiting && handleCallToken(nextWaiting.token_number, nextWaiting.patient_name)}
              disabled={!nextWaiting}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-3 px-8 py-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-sm tracking-wide shadow-lg shadow-emerald-600/30 transition active:scale-95 cursor-pointer disabled:opacity-50"
            >
              <Volume2 className="h-5 w-5 animate-pulse" />
              <span>{nextWaiting ? `[ 📞 CALL NEXT TOKEN ]` : "ALL CALLED"}</span>
            </button>

            <button
              type="button"
              onClick={() => setShowWalkInModal(true)}
              className="inline-flex items-center justify-center gap-2 px-6 py-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm tracking-wide shadow-sm transition active:scale-95 cursor-pointer"
            >
              <Plus className="h-5 w-5" />
              <span>[ ➕ ADD WALK-IN ]</span>
            </button>
          </div>
        </div>
      </div>

      {/* 2. RECONCILIATION & COUNTER METRICS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card">
          <div className="text-[11px] font-semibold text-apple-teal dark:text-[#30D1BE] uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="h-4 w-4" /> Active in Chamber
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-mono">
            {activeInConsultation ? `#${activeInConsultation.token_number} ${activeInConsultation.patient_name}` : "Chamber Idle"}
          </div>
          <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-semibold">
            {activeInConsultation?.payment_status === "paid" ? "PAID via Soundbox UPI ✅" : "Payment: PENDING ⚠️"}
          </p>
        </div>

        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card">
          <div className="text-[11px] font-semibold text-apple-amber dark:text-[#FF9F0A] uppercase tracking-wider flex items-center gap-1.5">
            <Clock className="h-4 w-4" /> Waiting in Lounge
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-mono">
            {waitingPatients.length} Patients
          </div>
          <p className="mt-1 text-xs text-[#86868B]">
            Est. wait: {waitingPatients.length * 12} mins
          </p>
        </div>

        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card flex flex-col justify-between">
          <div>
            <div className="text-[11px] font-black text-apple-teal dark:text-[#30D1BE] uppercase tracking-wider flex items-center gap-1.5">
              <CreditCard className="h-4 w-4" /> SETTLEMENT:
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-mono">
              ₹{upiCollected.toLocaleString("en-IN")}
            </div>
            <p className="mt-1 text-xs text-emerald-600 dark:text-emerald-400 font-bold flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse"></span>
              Direct Bank Transfer: ✅ Synced
            </p>
          </div>
          <p className="mt-2 text-xs font-bold text-[#1D1D1F] dark:text-white pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
            Total Gross: ₹ 1,200
          </p>
        </div>

        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between">
              <div className="text-[11px] font-semibold text-[#86868B] uppercase tracking-wider flex items-center gap-1.5">
                <IndianRupee className="h-4 w-4" /> Cash in Drawer
              </div>
              <Link
                href="/clinic/settlement"
                className="text-[11px] font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 hover:underline"
              >
                Settle ➔
              </Link>
            </div>
            <div className="mt-2 text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-mono">
              ₹{cashCollected.toLocaleString("en-IN")}
            </div>
          </div>
          <p className="mt-2 text-xs font-bold text-[#1D1D1F] dark:text-white pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
            Total Gross: ₹{totalCollectedToday.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* 3. COUNTER QUEUE TABLE */}
      <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] shadow-apple-card overflow-hidden">
        <div className="p-5 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 rounded-full bg-blue-600 animate-pulse"></span>
            <h2 className="text-sm font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white">
              LIVE QUEUE ({queue.length} Total • {waitingPatients.length} Waiting)
            </h2>
          </div>
          <span className="text-xs text-[#86868B]">
            1-Click Call Bell plays dual-harmonic speaker tone
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#ECEEF2]/60 dark:bg-[#2C2C2E]/60 border-b border-black/[0.04] dark:border-white/[0.06] text-[#86868B] font-medium">
              <tr>
                <th className="px-5 py-3.5">Token</th>
                <th className="px-5 py-3.5">Patient</th>
                <th className="px-5 py-3.5">Phone</th>
                <th className="px-5 py-3.5">Status</th>
                <th className="px-5 py-3.5">Payment Status</th>
                <th className="px-5 py-3.5 text-right">Counter Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {queue.map(item => (
                <tr key={item.token_number} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition">
                  <td className="px-5 py-4">
                    <div className="inline-flex items-center justify-center px-3 py-1.5 rounded-xl bg-slate-900 text-white dark:bg-white dark:text-slate-900 font-mono font-black text-sm">
                      #{item.token_number}
                    </div>
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-bold text-sm text-[#1D1D1F] dark:text-white flex items-center gap-2">
                      <span>#{item.token_number} {item.patient_name}</span>
                      {item.is_walk_in && (
                        <span className="rounded-full bg-blue-500/10 text-blue-700 dark:text-blue-300 px-2 py-0.5 text-[10px] font-bold">
                          Walk-In
                        </span>
                      )}
                    </div>
                    <div className="text-[11px] text-[#86868B] mt-0.5">{item.time_slot}</div>
                  </td>
                  <td className="px-5 py-4 text-[#86868B] font-mono text-xs">
                    {item.patient_phone}
                  </td>
                  <td className="px-5 py-4">
                    {item.status === "in_consultation" ? (
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 px-3 py-1 text-xs font-bold">
                          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                          In Chamber
                        </span>
                        <div className="text-[11px] text-[#86868B] mt-0.5 font-medium">Est. Wait: 24m</div>
                      </div>
                    ) : item.status === "waiting" ? (
                      <div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/10 text-amber-700 dark:text-amber-400 px-3 py-1 text-xs font-bold">
                          <Clock className="h-3.5 w-3.5" />
                          Waiting in Lounge
                        </span>
                        <div className="text-[11px] text-[#86868B] mt-0.5 font-medium">Est. Wait: 15m</div>
                      </div>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-3 py-1 text-xs font-medium text-[#86868B]">
                        <Check className="h-3.5 w-3.5" />
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      type="button"
                      onClick={() => handleTogglePayment(item.token_number)}
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition active:scale-95 cursor-pointer shadow-xs ${
                        item.payment_status === "paid"
                          ? "bg-emerald-500/10 text-emerald-700 hover:bg-emerald-500/20 dark:text-emerald-300 border border-emerald-500/20"
                          : "bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-300 border border-rose-500/20 animate-pulse"
                      }`}
                      title="Tap to toggle payment status"
                    >
                      {item.payment_status === "paid" ? (
                        <>
                          <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                          <span>PAID ✅ (₹{item.fee_amount} {item.payment_mode.toUpperCase()})</span>
                        </>
                      ) : (
                        <>
                          <Clock className="h-3.5 w-3.5 text-rose-600" />
                          <span>PENDING ⏳ (Collect ₹{item.fee_amount})</span>
                        </>
                      )}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      {item.status === "waiting" ? (
                        <button
                          type="button"
                          onClick={() => handleCallToken(item.token_number, item.patient_name)}
                          className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3.5 py-1.5 text-xs font-bold text-white shadow-xs active:scale-95 transition cursor-pointer"
                        >
                          <Volume2 className="h-3.5 w-3.5" />
                          Call Token
                        </button>
                      ) : item.status === "in_consultation" ? (
                        <Link
                          href="/dashboard/consult/APT-DERMA-102"
                          className="inline-flex items-center gap-1 rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition"
                        >
                          <span>Open ℞ Pad</span>
                          <ExternalLink className="h-3 w-3" />
                        </Link>
                      ) : (
                        <span className="text-[11px] text-[#86868B] font-medium">Done</span>
                      )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md">
          <div className="w-full max-w-md rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-7 shadow-apple-modal">
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

              {/* 3. FEE & PAYMENT MODE */}
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
          <div className="w-full max-w-sm rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-7 text-center shadow-apple-modal space-y-4">
            <div>
              <h3 className="text-base font-bold text-[#1D1D1F] dark:text-white">
                Reception Counter QR Stand
              </h3>
              <p className="text-xs text-[#86868B] mt-0.5">
                Scan to track live queue token on phone or self check-in
              </p>
            </div>

            <div className="mx-auto my-2 flex items-center justify-center">
              <QRCodeDisplay
                value="http://localhost:3000/waiting-room?clinic=derma-care"
                size={180}
                level="H"
                fgColor="#000000"
                bgColor="#FFFFFF"
                showDownloadBtn={true}
                downloadFilename="derma-care-counter-qr"
                centerBadgeText="TOKEN QR"
              />
            </div>

            <div className="text-xs font-mono font-medium text-apple-blue">
              clinicos.in/waiting-room?clinic=derma-care
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
          <div className="w-full max-w-3xl rounded-[28px] border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#1C1C1E] p-6 sm:p-7 shadow-apple-modal max-h-[85vh] flex flex-col justify-between space-y-4">
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
