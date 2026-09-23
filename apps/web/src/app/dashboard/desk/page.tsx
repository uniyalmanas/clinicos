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
      token_number: 1,
      patient_name: "Amit Rawat",
      patient_phone: "+919123456780",
      status: "completed",
      time_slot: "10:15 AM - 10:30 AM",
      fee_amount: 600,
      payment_status: "paid",
      payment_mode: "upi",
      is_walk_in: false
    },
    {
      appointment_number: "APT-DERMA-102",
      token_number: 2,
      patient_name: "Priya Singh",
      patient_phone: "+919123456781",
      status: "in_consultation",
      time_slot: "10:30 AM - 10:45 AM",
      fee_amount: 600,
      payment_status: "paid",
      payment_mode: "upi",
      is_walk_in: false
    },
    {
      appointment_number: "APT-DERMA-103",
      token_number: 3,
      patient_name: "Rohit Pant",
      patient_phone: "+919123456782",
      status: "waiting",
      time_slot: "10:45 AM - 11:00 AM",
      fee_amount: 600,
      payment_status: "pending",
      payment_mode: "cash",
      is_walk_in: false
    },
    {
      appointment_number: "APT-WALKIN-104",
      token_number: 4,
      patient_name: "Kavita Joshi",
      patient_phone: "+919876511111",
      status: "waiting",
      time_slot: "11:00 AM",
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
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/automations`);
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
      await fetch(`${API_BASE_URL}/api/v1/clinic/trigger-automation/${auto.id}`, {
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
      evtSource = new EventSource(`${API_BASE_URL}/api/v1/clinic/stream`);
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
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/desk-queue`);
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
        await fetch(`${API_BASE_URL}/api/v1/clinic/call-token`, {
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
        await fetch(`${API_BASE_URL}/api/v1/clinic/toggle-payment`, {
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

  const handleAdmitWalkIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!walkInName || !walkInPhone) return;

    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/walk-in`, {
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

      if (res.ok) {
        const data = await res.json();
        setQueue(prev => [...prev, data.appointment]);
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
    } finally {
      setShowWalkInModal(false);
      setWalkInName("");
      setWalkInPhone("");
      setCalledTokenMsg(`Admitted Walk-In (${walkInName})`);
      setTimeout(() => setCalledTokenMsg(null), 4000);
    }
  };

  return (
    <div className="space-y-6">
      {/* 1. TOP HEADER & MODAL TRIGGERS */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-[#1D1D1F] dark:text-white">
            Reception Desk Counter Console PWA
          </h1>
          <p className="text-xs text-[#86868B] mt-0.5">
            Counter staff: Pooja Verma • Dr. Rahul Sharma OPD Roster
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

      {/* 2. RECONCILIATION & COUNTER METRICS */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card">
          <div className="text-[11px] font-semibold text-apple-teal dark:text-[#30D1BE] uppercase tracking-wider flex items-center gap-1.5">
            <Stethoscope className="h-4 w-4" /> Active in Chamber
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-mono">
            {activeInConsultation ? `Token #${activeInConsultation.token_number}` : "Chamber Idle"}
          </div>
          <p className="mt-1 text-xs text-[#86868B] truncate">
            {activeInConsultation ? activeInConsultation.patient_name : "Waiting for next patient"}
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

        <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] p-6 shadow-apple-card">
          <div className="text-[11px] font-semibold text-apple-teal dark:text-[#30D1BE] uppercase tracking-wider flex items-center gap-1.5">
            <CreditCard className="h-4 w-4" /> Soundbox UPI
          </div>
          <div className="mt-2 text-2xl font-bold tracking-tight text-[#1D1D1F] dark:text-white font-mono">
            ₹{upiCollected.toLocaleString("en-IN")}
          </div>
          <p className="mt-1 text-xs text-apple-teal dark:text-[#30D1BE] font-medium">
            Direct Bank Settlement
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
          <p className="mt-2 text-xs text-[#86868B] pt-2 border-t border-black/[0.04] dark:border-white/[0.06]">
            Total Gross: ₹{totalCollectedToday.toLocaleString("en-IN")}
          </p>
        </div>
      </div>

      {/* 3. COUNTER QUEUE TABLE */}
      <div className="rounded-[28px] border border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] shadow-apple-card overflow-hidden">
        <div className="p-5 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between">
          <span className="text-xs font-semibold uppercase tracking-wider text-[#86868B]">
            Counter Live Tokens ({queue.length})
          </span>
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
                <th className="px-5 py-3.5">Fee & Reconciliation</th>
                <th className="px-5 py-3.5 text-right">Counter Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/[0.04] dark:divide-white/[0.06]">
              {queue.map(item => (
                <tr key={item.token_number} className="hover:bg-black/[0.015] dark:hover:bg-white/[0.02] transition">
                  <td className="px-5 py-4 font-bold font-mono text-base text-[#1D1D1F] dark:text-white">
                    #{item.token_number}
                  </td>
                  <td className="px-5 py-4">
                    <div className="font-semibold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
                      <span>{item.patient_name}</span>
                      {item.is_walk_in && (
                        <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-2 py-0.5 text-[10px] font-semibold text-[#86868B]">
                          Walk-In
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-[#86868B] mt-0.5">{item.time_slot}</div>
                  </td>
                  <td className="px-5 py-4 text-[#86868B] font-mono">
                    {item.patient_phone}
                  </td>
                  <td className="px-5 py-4">
                    {item.status === "in_consultation" ? (
                      <span className="rounded-full bg-apple-teal/10 text-apple-teal dark:text-[#30D1BE] px-2.5 py-0.5 text-[11px] font-medium">
                        In Chamber
                      </span>
                    ) : item.status === "waiting" ? (
                      <span className="rounded-full bg-apple-amber/10 text-apple-amber dark:text-[#FF9F0A] px-2.5 py-0.5 text-[11px] font-medium">
                        Waiting
                      </span>
                    ) : (
                      <span className="rounded-full bg-black/[0.04] dark:bg-white/[0.08] px-2.5 py-0.5 text-[11px] font-normal text-[#86868B]">
                        Completed
                      </span>
                    )}
                  </td>
                  <td className="px-5 py-4">
                    <button
                      onClick={() => handleTogglePayment(item.token_number)}
                      className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition active:scale-95 ${
                        item.payment_status === "paid"
                          ? "bg-apple-teal/10 text-apple-teal hover:bg-apple-teal/20 dark:text-[#30D1BE]"
                          : "bg-apple-amber/10 text-apple-amber hover:bg-apple-amber/20 dark:text-[#FF9F0A]"
                      }`}
                    >
                      <Check className="h-3 w-3" />
                      ₹{item.fee_amount} ({item.payment_mode.toUpperCase()}) • {item.payment_status}
                    </button>
                  </td>
                  <td className="px-5 py-4 text-right">
                    {item.status === "waiting" ? (
                      <button
                        onClick={() => handleCallToken(item.token_number, item.patient_name)}
                        className="inline-flex items-center gap-1.5 rounded-full bg-apple-blue hover:bg-[#0077ED] px-3.5 py-1.5 text-xs font-semibold text-white shadow-apple-sm active:scale-95 transition"
                      >
                        <Volume2 className="h-3.5 w-3.5" />
                        Call Token
                      </button>
                    ) : item.status === "in_consultation" ? (
                      <Link
                        href="/dashboard/consult/APT-DERMA-102"
                        className="inline-flex items-center gap-1 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.04] px-3 py-1.5 text-xs font-medium text-[#1D1D1F] dark:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] active:scale-95 transition"
                      >
                        <span>Open ℞ Studio</span>
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : (
                      <span className="text-[11px] text-[#86868B] font-medium">Done</span>
                    )}
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
              Assigns the next available live token number immediately
            </p>

            <form onSubmit={handleAdmitWalkIn} className="mt-5 space-y-3.5 text-xs">
              <div>
                <label className="font-medium text-[#1D1D1F] dark:text-white">Patient Full Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Ramesh Chandra"
                  value={walkInName}
                  onChange={e => setWalkInName(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                />
              </div>

              <div>
                <label className="font-medium text-[#1D1D1F] dark:text-white">Mobile Number (WhatsApp Delivery)</label>
                <input
                  type="tel"
                  required
                  placeholder="+91 98765 43210"
                  value={walkInPhone}
                  onChange={e => setWalkInPhone(e.target.value)}
                  className="mt-1 w-full rounded-xl border border-black/[0.08] dark:border-white/[0.1] bg-[#ECEEF2]/70 dark:bg-black/40 p-2.5 font-mono text-[#1D1D1F] dark:text-white focus:outline-none focus:ring-2 focus:ring-apple-blue/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-medium text-[#1D1D1F] dark:text-white">Consultation Fee</label>
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
                  className="flex-1 rounded-full bg-apple-blue py-2.5 font-semibold text-white shadow-apple-sm hover:bg-[#0077ED] active:scale-95 transition"
                >
                  Confirm & Admit
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
