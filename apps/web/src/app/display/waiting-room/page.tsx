"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import Link from "next/link";
import {
  Volume2,
  VolumeX,
  Maximize2,
  Minimize2,
  Clock,
  Sparkles,
  CheckCircle2,
  Building2,
  User,
  Stethoscope,
  QrCode,
  Radio,
  RefreshCw,
  Bell,
  ArrowRight,
  ShieldCheck,
  Phone,
  Settings,
  ChevronRight,
  Play,
  Share2,
  AlertCircle
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";

interface QueuePatient {
  appointment_number: string;
  token_number: number;
  patient_name: string;
  patient_phone: string;
  time_slot: string;
  status: "in_waiting" | "in_consultation" | "completed";
  doctor_name?: string;
  chamber_name?: string;
  estimated_wait_mins?: number;
}

interface ChamberStatus {
  chamber_id: string;
  chamber_name: string;
  doctor_name: string;
  specialty: string;
  current_token: number | null;
  patient_name: string | null;
  status: "consulting" | "idle" | "break";
  elapsed_seconds: number;
}

// Multi-chord pleasant airport / hospital chime generator (Web Audio API)
function playHospitalChime(volume = 0.5) {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (ctx.state === "suspended") {
      ctx.resume();
    }

    const now = ctx.currentTime;
    // Harmonic 4-tone chord: C5 (523Hz), E5 (659Hz), G5 (784Hz), C6 (1046Hz)
    const tones = [
      { freq: 523.25, time: 0.0, dur: 0.8 },
      { freq: 659.25, time: 0.12, dur: 0.8 },
      { freq: 783.99, time: 0.24, dur: 0.9 },
      { freq: 1046.50, time: 0.38, dur: 1.2 }
    ];

    tones.forEach(t => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = "sine";
      osc.frequency.setValueAtTime(t.freq, now + t.time);

      gain.gain.setValueAtTime(0, now + t.time);
      gain.gain.linearRampToValueAtTime(volume * 0.35, now + t.time + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + t.time + t.dur);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now + t.time);
      osc.stop(now + t.time + t.dur);
    });
  } catch (err) {
    console.error("Failed playing hospital chime:", err);
  }
}

// Bilingual Web Speech Announcement (English followed by Hindi)
function speakBilingualAnnouncement(token: number, patientName: string, chamberName: string, langPref: "bilingual" | "hi" | "en") {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

  window.speechSynthesis.cancel(); // Stop any overlapping announcements

  const voices = window.speechSynthesis.getVoices();
  const hindiVoice = voices.find(v => v.lang.includes("hi") || v.lang.includes("IN"));
  const englishVoice = voices.find(v => v.lang.includes("en-IN") || v.lang.includes("en-GB") || v.lang.includes("en"));

  // 1. English Announcement: "Token Number 4, please proceed to Chamber 1."
  if (langPref === "en" || langPref === "bilingual") {
    const enText = `Token Number ${token}. ${patientName}, please proceed to ${chamberName}.`;
    const enUtter = new SpeechSynthesisUtterance(enText);
    enUtter.rate = 0.92;
    enUtter.pitch = 1.05;
    if (englishVoice) enUtter.voice = englishVoice;

    window.speechSynthesis.speak(enUtter);
  }

  // 2. Hindi Announcement: "टोकन नंबर 4, कृपया कक्ष 1 में आएं।"
  if (langPref === "hi" || langPref === "bilingual") {
    const delay = langPref === "bilingual" ? 1800 : 0;
    setTimeout(() => {
      const hiText = `टोकन नंबर ${token}, कृपया ${chamberName === "Chamber 1" ? "कक्ष एक" : chamberName === "Chamber 2" ? "कक्ष दो" : "कक्ष"} में आएं।`;
      const hiUtter = new SpeechSynthesisUtterance(hiText);
      hiUtter.rate = 0.88;
      hiUtter.pitch = 1.0;
      if (hindiVoice) hiUtter.voice = hindiVoice;
      window.speechSynthesis.speak(hiUtter);
    }, delay);
  }
}

export default function WaitingRoomSmartDisplayPage() {
  // Time & Clock state
  const [currentTime, setCurrentTime] = useState<string>("");
  const [currentDate, setCurrentDate] = useState<string>("");
  
  // Audio & Fullscreen states
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [audioUnlocked, setAudioUnlocked] = useState<boolean>(false);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [speechLanguage, setSpeechLanguage] = useState<"bilingual" | "hi" | "en">("bilingual");
  const [showConfigDock, setShowConfigDock] = useState<boolean>(false);
  const [recentCallAlert, setRecentCallAlert] = useState<boolean>(false);

  // Clinic metadata
  const [clinic] = useState({
    name: "Derma Care Skin & Laser Centre",
    tagline: "Advanced Dermatology & Aesthetic Clinic",
    address: "14, Rajpur Road, Dehradun",
    helpline: "+91 98765 43210"
  });

  // Multi-Chambers status for Polyclinics
  const [chambers, setChambers] = useState<ChamberStatus[]>([
    {
      chamber_id: "ch-1",
      chamber_name: "Chamber 1",
      doctor_name: "Dr. Rahul Sharma",
      specialty: "MBBS, MD Dermatology",
      current_token: 2,
      patient_name: "Priya Singh",
      status: "consulting",
      elapsed_seconds: 245
    },
    {
      chamber_id: "ch-2",
      chamber_name: "Chamber 2 (Skin Care & Laser)",
      doctor_name: "Dr. Ananya Rawat",
      specialty: "Aesthetic Cosmetology",
      current_token: 1,
      patient_name: "Neha Gupta",
      status: "consulting",
      elapsed_seconds: 410
    }
  ]);

  // Primary active chamber for spotlight mode
  const [activeChamberIndex, setActiveChamberIndex] = useState<number>(0);

  // Upcoming Queue state
  const [queue, setQueue] = useState<QueuePatient[]>([
    {
      appointment_number: "APT-DERMA-103",
      token_number: 3,
      patient_name: "Rohit Pant",
      patient_phone: "+919123456782",
      time_slot: "11:00 AM",
      status: "in_waiting",
      doctor_name: "Dr. Rahul Sharma",
      chamber_name: "Chamber 1",
      estimated_wait_mins: 6
    },
    {
      appointment_number: "APT-DERMA-104",
      token_number: 4,
      patient_name: "Sneha Dobhal",
      patient_phone: "+919123456783",
      time_slot: "11:15 AM",
      status: "in_waiting",
      doctor_name: "Dr. Rahul Sharma",
      chamber_name: "Chamber 1",
      estimated_wait_mins: 14
    },
    {
      appointment_number: "APT-DERMA-105",
      token_number: 5,
      patient_name: "Vikram Negi",
      patient_phone: "+919123456784",
      time_slot: "11:30 AM",
      status: "in_waiting",
      doctor_name: "Dr. Rahul Sharma",
      chamber_name: "Chamber 1",
      estimated_wait_mins: 22
    },
    {
      appointment_number: "APT-DERMA-106",
      token_number: 6,
      patient_name: "Sunita Verma",
      patient_phone: "+919123456785",
      time_slot: "11:45 AM",
      status: "in_waiting",
      doctor_name: "Dr. Rahul Sharma",
      chamber_name: "Chamber 1",
      estimated_wait_mins: 30
    },
    {
      appointment_number: "APT-DERMA-107",
      token_number: 7,
      patient_name: "Harshvardhan Joshi",
      patient_phone: "+919123456786",
      time_slot: "12:00 PM",
      status: "in_waiting",
      doctor_name: "Dr. Rahul Sharma",
      chamber_name: "Chamber 1",
      estimated_wait_mins: 38
    }
  ]);

  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const lastAnnouncedTokenRef = useRef<number | null>(null);

  // Live Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString("en-IN", {
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: true
        })
      );
      setCurrentDate(
        now.toLocaleDateString("en-IN", {
          weekday: "long",
          day: "numeric",
          month: "short",
          year: "numeric"
        })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Chamber timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setChambers(prev =>
        prev.map(c =>
          c.status === "consulting" ? { ...c, elapsed_seconds: c.elapsed_seconds + 1 } : c
        )
      );
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Helper trigger for audio announcement
  const triggerAudioAnnouncement = useCallback(
    (token: number, patientName: string, chamberName: string) => {
      if (isMuted) return;
      playHospitalChime(0.6);
      setTimeout(() => {
        speakBilingualAnnouncement(token, patientName, chamberName, speechLanguage);
      }, 600);

      // Flash visual alert
      setRecentCallAlert(true);
      setTimeout(() => setRecentCallAlert(false), 8000);
    },
    [isMuted, speechLanguage]
  );

  // Poll real queue from API
  const fetchQueueFromAPI = useCallback(async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/v1/clinic/desk-queue`);
      if (res.ok) {
        const json = await res.json();
        if (json.queue && json.queue.length > 0) {
          const apiQueue: any[] = json.queue;
          const inConsult = apiQueue.find(q => q.status === "in_consultation");
          const waiting = apiQueue.filter(q => q.status === "in_waiting" || q.status === "confirmed");

          if (inConsult) {
            setChambers(prev => {
              const updated = [...prev];
              updated[0] = {
                ...updated[0],
                current_token: inConsult.token_number,
                patient_name: inConsult.patient_name,
                doctor_name: inConsult.doctor_name || updated[0].doctor_name,
                status: "consulting"
              };
              return updated;
            });

            // If token changed, announce it!
            if (
              lastAnnouncedTokenRef.current !== null &&
              lastAnnouncedTokenRef.current !== inConsult.token_number
            ) {
              triggerAudioAnnouncement(
                inConsult.token_number,
                inConsult.patient_name,
                "Chamber 1"
              );
            }
            lastAnnouncedTokenRef.current = inConsult.token_number;
          }

          if (waiting.length > 0) {
            const mappedWaiting: QueuePatient[] = waiting.map((w, idx) => ({
              appointment_number: w.appointment_number,
              token_number: w.token_number,
              patient_name: w.patient_name,
              patient_phone: w.patient_phone,
              time_slot: w.time_slot || "Upcoming",
              status: "in_waiting",
              doctor_name: w.doctor_name || "Dr. Rahul Sharma",
              chamber_name: "Chamber 1",
              estimated_wait_mins: Math.max(5, (idx + 1) * 8)
            }));
            setQueue(mappedWaiting);
          }
        }
      }
    } catch (e) {
      // Offline fallback state preserved
    }
  }, [triggerAudioAnnouncement]);

  // Connect to SSE real-time stream
  useEffect(() => {
    fetchQueueFromAPI();
    const pollInterval = setInterval(fetchQueueFromAPI, 4000);

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE_URL}/api/v1/clinic/stream`);

      eventSource.onopen = () => {
        setSseConnected(true);
      };

      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.event === "token_called" && parsed.data) {
            const d = parsed.data;
            setChambers(prev => {
              const copy = [...prev];
              copy[0] = {
                ...copy[0],
                current_token: d.token_number,
                patient_name: d.patient_name,
                status: "consulting",
                elapsed_seconds: 0
              };
              return copy;
            });

            triggerAudioAnnouncement(d.token_number, d.patient_name, "Chamber 1");
            fetchQueueFromAPI();
          }
        } catch (err) {
          console.error("SSE parse error", err);
        }
      };

      eventSource.onerror = () => {
        setSseConnected(false);
      };
    } catch (e) {
      setSseConnected(false);
    }

    return () => {
      clearInterval(pollInterval);
      if (eventSource) eventSource.close();
    };
  }, [fetchQueueFromAPI, triggerAudioAnnouncement]);

  // Fullscreen API toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
        setIsFullscreen(false);
      }
    }
  };

  // User gesture unlock for audio playback
  const handleUserUnlockAudio = () => {
    setAudioUnlocked(true);
    playHospitalChime(0.2);
  };

  // Test simulation: Call Next Token
  const handleSimulateNextCall = () => {
    if (queue.length === 0) return;
    const nextPatient = queue[0];
    const remaining = queue.slice(1);

    setChambers(prev => {
      const copy = [...prev];
      copy[activeChamberIndex] = {
        ...copy[activeChamberIndex],
        current_token: nextPatient.token_number,
        patient_name: nextPatient.patient_name,
        status: "consulting",
        elapsed_seconds: 0
      };
      return copy;
    });

    setQueue(remaining);
    lastAnnouncedTokenRef.current = nextPatient.token_number;

    triggerAudioAnnouncement(
      nextPatient.token_number,
      nextPatient.patient_name,
      chambers[activeChamberIndex].chamber_name
    );
  };

  const activeChamber = chambers[activeChamberIndex] || chambers[0];
  const formatSeconds = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(mins).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  return (
    <div 
      onClick={!audioUnlocked ? handleUserUnlockAudio : undefined}
      className="min-h-screen bg-[#0A0D14] text-white flex flex-col justify-between selection:bg-apple-blue selection:text-white font-sans overflow-x-hidden select-none"
    >
      {/* 1. AUDIO UNLOCK BANNER (Appears if user hasn't interacted with TV screen yet) */}
      {!audioUnlocked && (
        <div className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-700 text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow-lg cursor-pointer animate-pulse z-50">
          <div className="flex items-center gap-2.5">
            <Volume2 className="h-4 w-4" />
            <span>
              🔊 <strong>Interactive TV Audio Ready:</strong> Click anywhere on this screen to activate automatic chime bell & bilingual patient voice announcements.
            </span>
          </div>
          <button 
            onClick={handleUserUnlockAudio}
            className="rounded-full bg-white/20 hover:bg-white/30 px-3 py-1 text-[11px] font-bold uppercase tracking-wider transition"
          >
            Activate Sound Now
          </button>
        </div>
      )}

      {/* 2. TOP TV HEADER BAR */}
      <header className="border-b border-white/[0.08] bg-[#10141E]/90 backdrop-blur-md px-6 py-4 flex items-center justify-between">
        {/* Clinic Identity */}
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-apple-blue text-white shadow-apple-sm">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-xl sm:text-2xl font-black tracking-tight text-white">
                {clinic.name}
              </h1>
              <span className="rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[11px] font-bold px-2.5 py-0.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping"></span>
                <span>Live Token Desk</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              {clinic.tagline} • {clinic.address}
            </p>
          </div>
        </div>

        {/* Live Clock & Sync Status */}
        <div className="flex items-center gap-6">
          {/* Real-Time Sync Indicator */}
          <div className="hidden md:flex items-center gap-2 text-xs font-medium text-slate-400 bg-white/[0.04] border border-white/[0.08] px-3 py-1.5 rounded-full">
            <Radio className={`h-3.5 w-3.5 ${sseConnected ? "text-emerald-400 animate-pulse" : "text-amber-400"}`} />
            <span>{sseConnected ? "Real-Time Broadcaster Connected" : "Local Sync Mode"}</span>
          </div>

          {/* Clock */}
          <div className="text-right">
            <div className="text-2xl sm:text-3xl font-black font-mono tracking-tight text-white flex items-center gap-1">
              <Clock className="h-5 w-5 text-apple-blue hidden sm:inline" />
              <span>{currentTime || "10:30:00 AM"}</span>
            </div>
            <div className="text-xs text-slate-400 font-medium">
              {currentDate || "Friday, 18 September"}
            </div>
          </div>

          {/* Quick TV Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2.5 rounded-xl border transition active:scale-95 ${
                isMuted 
                  ? "bg-red-500/20 border-red-500/40 text-red-400" 
                  : "bg-white/[0.06] border-white/[0.1] text-slate-300 hover:text-white hover:bg-white/[0.1]"
              }`}
              title={isMuted ? "Unmute Announcements" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>

            <button
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl border border-white/[0.1] bg-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.1] transition active:scale-95"
              title="Fullscreen Mode (F11)"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </button>

            <button
              onClick={() => setShowConfigDock(!showConfigDock)}
              className="p-2.5 rounded-xl border border-white/[0.1] bg-white/[0.06] text-slate-300 hover:text-white hover:bg-white/[0.1] transition active:scale-95"
              title="TV Settings & Simulation"
            >
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. MAIN DUAL-COLUMN WAITING ROOM MATRIX */}
      <main className="flex-1 p-6 lg:p-8 max-w-[1800px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
        
        {/* LEFT COLUMN: HERO "NOW SERVING" CHAMBER SPOTLIGHT (7 Cols) */}
        <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
          
          {/* Chamber Switcher Pills (If polyclinic has multiple chambers) */}
          <div className="flex items-center justify-between bg-[#131826] border border-white/[0.06] p-2 rounded-2xl">
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
              {chambers.map((ch, idx) => (
                <button
                  key={ch.chamber_id}
                  onClick={() => setActiveChamberIndex(idx)}
                  className={`flex items-center gap-2.5 px-4 py-2 rounded-xl text-xs font-bold transition ${
                    activeChamberIndex === idx
                      ? "bg-apple-blue text-white shadow-apple-sm"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.05]"
                  }`}
                >
                  <Stethoscope className="h-4 w-4" />
                  <span>{ch.chamber_name}</span>
                  <span className={`h-2 w-2 rounded-full ${ch.status === "consulting" ? "bg-emerald-400" : "bg-slate-500"}`}></span>
                </button>
              ))}
            </div>

            <div className="text-[11px] text-slate-400 font-medium px-2 hidden sm:block">
              Doctor In Chamber: <strong className="text-white">{activeChamber.doctor_name}</strong>
            </div>
          </div>

          {/* HERO ACTIVE TOKEN CARD */}
          <div className={`relative flex-1 rounded-[36px] border p-8 sm:p-12 flex flex-col justify-between transition-all duration-500 ${
            recentCallAlert 
              ? "bg-gradient-to-br from-emerald-950/70 via-[#10192A] to-[#0D121F] border-emerald-500/60 shadow-[0_0_80px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/20" 
              : "bg-gradient-to-br from-[#131B2E] via-[#0E1524] to-[#0A0E18] border-white/[0.1] shadow-2xl"
          }`}>
            
            {/* Top Status Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="relative flex h-4 w-4">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                </span>
                <span className="text-sm sm:text-base font-black tracking-wider uppercase text-emerald-400">
                  {recentCallAlert ? "🔔 JUST CALLED TO CHAMBER" : "NOW SERVING / अभी परामर्श कक्ष में"}
                </span>
              </div>

              <div className="flex items-center gap-2 rounded-full bg-white/[0.06] border border-white/[0.1] px-4 py-1.5 text-xs font-semibold text-slate-300">
                <span>In Chamber:</span>
                <span className="font-mono font-bold text-white text-sm">{formatSeconds(activeChamber.elapsed_seconds)}</span>
              </div>
            </div>

            {/* Giant Center Token Display */}
            <div className="my-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
              <div>
                <div className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">
                  PATIENT TOKEN NUMBER
                </div>
                <div className="text-8xl sm:text-9xl lg:text-[11rem] font-black tracking-tighter text-white font-mono leading-none drop-shadow-[0_10px_30px_rgba(0,113,227,0.4)]">
                  #{String(activeChamber.current_token || 2).padStart(2, "0")}
                </div>
              </div>

              {/* Patient Name & Chamber Target */}
              <div className="text-center sm:text-right space-y-3">
                <div className="rounded-2xl bg-white/[0.04] border border-white/[0.08] p-5 backdrop-blur-md text-left sm:text-right min-w-[260px]">
                  <div className="text-xs text-slate-400 uppercase font-semibold">
                    PATIENT NAME / मरीज
                  </div>
                  <div className="text-2xl sm:text-3xl font-black text-white mt-1">
                    {activeChamber.patient_name || "Priya Singh"}
                  </div>
                  <div className="text-xs text-emerald-400 font-semibold mt-1 flex items-center justify-start sm:justify-end gap-1">
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    <span>In Consultation</span>
                  </div>
                </div>

                <div className="rounded-2xl bg-apple-blue/20 border border-apple-blue/40 p-4 text-left sm:text-right">
                  <div className="text-xs text-sky-300 uppercase font-bold">
                    PROCEED TO ROOM
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white mt-0.5">
                    {activeChamber.chamber_name}
                  </div>
                  <div className="text-xs text-slate-300 font-medium">
                    {activeChamber.doctor_name} ({activeChamber.specialty})
                  </div>
                </div>
              </div>
            </div>

            {/* Acoustic Chime Voice Readout Ticker */}
            <div className="rounded-2xl bg-black/40 border border-white/[0.08] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
              <div className="flex items-center gap-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-apple-blue/20 text-apple-blue flex-shrink-0">
                  <Volume2 className="h-4 w-4" />
                </div>
                <div>
                  <div className="font-bold text-white">
                    📢 &quot;Token Number {activeChamber.current_token || 2}, {activeChamber.patient_name || 'Priya Singh'}, please proceed to {activeChamber.chamber_name}.&quot;
                  </div>
                  <div className="text-slate-400 text-[11px] mt-0.5">
                    🇮🇳 &quot;टोकन नंबर {activeChamber.current_token || 2}, कृपया {activeChamber.chamber_name === "Chamber 1" ? "कक्ष 1" : "कक्ष"} में आएं।&quot;
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={() => triggerAudioAnnouncement(activeChamber.current_token || 2, activeChamber.patient_name || "Priya Singh", activeChamber.chamber_name)}
                className="inline-flex items-center gap-1.5 rounded-xl bg-white/[0.08] hover:bg-white/[0.15] text-white px-3 py-1.5 font-semibold text-xs transition active:scale-95 whitespace-nowrap self-start sm:self-auto"
              >
                <Play className="h-3 w-3 fill-current" />
                <span>Repeat Voice Call</span>
              </button>
            </div>
          </div>
        </div>

        {/* RIGHT COLUMN: UPCOMING QUEUE & ZERO-APP QR CODE (5 Cols) */}
        <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
          
          {/* UP NEXT IN LINE QUEUE CARD */}
          <div className="flex-1 rounded-[36px] border border-white/[0.08] bg-[#101625] p-6 sm:p-7 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-4">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400">
                    <Clock className="h-4 w-4" />
                  </div>
                  <div>
                    <h3 className="text-base font-bold text-white">
                      Up Next in Line / प्रतीक्षा सूची
                    </h3>
                    <p className="text-[11px] text-slate-400">
                      {queue.length} Patients waiting in clinic lounge
                    </p>
                  </div>
                </div>

                <span className="rounded-full bg-white/[0.06] border border-white/[0.1] px-3 py-1 text-xs font-bold text-white font-mono">
                  {queue.length} Ahead
                </span>
              </div>

              {/* Queue List (Next 5 Patients) */}
              <div className="space-y-2.5">
                {queue.slice(0, 5).map((patient, idx) => (
                  <div
                    key={patient.appointment_number}
                    className={`rounded-2xl border p-3.5 flex items-center justify-between transition-all ${
                      idx === 0
                        ? "bg-amber-500/10 border-amber-500/30 text-white shadow-sm"
                        : "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] text-slate-300"
                    }`}
                  >
                    <div className="flex items-center gap-3.5">
                      <div className={`flex h-11 w-11 items-center justify-center rounded-2xl font-mono text-base font-black ${
                        idx === 0
                          ? "bg-amber-500 text-slate-950 shadow-sm"
                          : "bg-white/[0.08] text-white"
                      }`}>
                        #{String(patient.token_number).padStart(2, "0")}
                      </div>

                      <div>
                        <div className="font-bold text-sm text-white flex items-center gap-2">
                          <span>{patient.patient_name}</span>
                          {idx === 0 && (
                            <span className="rounded-full bg-amber-500/20 text-amber-300 text-[10px] font-extrabold px-2 py-0.2 uppercase">
                              Next in Line
                            </span>
                          )}
                        </div>
                        <div className="text-xs text-slate-400 mt-0.5">
                          {patient.doctor_name || "Dr. Rahul Sharma"} • {patient.time_slot}
                        </div>
                      </div>
                    </div>

                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-sky-400">
                        ~{patient.estimated_wait_mins || (idx + 1) * 8} mins
                      </div>
                      <div className="text-[10px] text-slate-400 font-medium">
                        Est. Wait Time
                      </div>
                    </div>
                  </div>
                ))}

                {queue.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-white/[0.1] p-8 text-center text-slate-400 text-xs">
                    No more waiting patients in queue. All tokens cleared!
                  </div>
                )}
              </div>
            </div>

            {/* QUICK ESTIMATE SUMMARY */}
            <div className="mt-4 pt-3 border-t border-white/[0.06] flex items-center justify-between text-xs text-slate-400">
              <span>Average Consultation Pace:</span>
              <strong className="text-white font-mono">~8 to 10 mins / patient</strong>
            </div>
          </div>

          {/* ZERO-APP PHONE TRACKING QR CARD */}
          <div className="rounded-[32px] border border-white/[0.08] bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[#101625] p-5 flex items-center justify-between gap-5 shadow-lg">
            <div className="space-y-1.5 flex-1">
              <span className="rounded-full bg-blue-500/20 text-sky-300 text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                Zero App Download Required
              </span>
              <h4 className="text-sm font-bold text-white">
                📲 Scan to Track Token on Phone
              </h4>
              <p className="text-[11px] text-slate-300 leading-relaxed">
                Wait outside at the cafe or parking lot. Scan this QR to view live token progress and get a WhatsApp alert when you are 2 tokens away!
              </p>
              <div className="text-[10px] font-mono text-sky-400 pt-1">
                clinicos.in/p/live-queue
              </div>
            </div>

            {/* QR Code Container */}
            <div className="flex-shrink-0 bg-white p-3 rounded-2xl shadow-xl flex items-center justify-center">
              <QrCode className="h-24 w-24 text-slate-950" />
            </div>
          </div>
        </div>
      </main>

      {/* 4. BOTTOM TICKER / CLINIC MARQUEE BAR */}
      <footer className="border-t border-white/[0.08] bg-[#0E121B] px-6 py-3 flex items-center gap-4 text-xs font-medium text-slate-300 overflow-hidden">
        <div className="flex items-center gap-2 text-apple-blue font-bold whitespace-nowrap uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>Clinic Notice:</span>
        </div>

        <div className="relative flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee">
            <span>
              🏥 <strong>Welcome to Derma Care Skin &amp; Laser Centre:</strong> Free Patient Wi-Fi: <strong>ClinicGuest</strong> (No Password Required) &bull; 
              Please sanitize hands at the automated front-door dispenser &bull; 
              PMBJP Jan Aushadhi generic medicines available at the in-house pharmacy desk for up to 70% savings &bull; 
              Emergency or urgent symptom assistance? Notify front-desk reception immediately &bull; 
              Dr. Rahul Sharma is actively consulting in Chamber 1 &bull; 
              Dr. Ananya Rawat is consulting in Chamber 2 (Laser Suite).
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-slate-400 whitespace-nowrap border-l border-white/[0.1] pl-4">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>DocSphere Live TV v1.0</span>
        </div>
      </footer>

      {/* 5. FLOATING CONFIGURATION & SIMULATOR DOCK (For TV Operator / Receptionist) */}
      {showConfigDock && (
        <div className="fixed bottom-14 right-6 z-50 w-80 rounded-3xl border border-white/[0.15] bg-[#161C2C]/95 backdrop-blur-xl p-5 shadow-2xl space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b border-white/[0.08] pb-2.5">
            <div className="flex items-center gap-2 font-bold text-xs text-white">
              <Settings className="h-4 w-4 text-apple-blue" />
              <span>Smart TV Queue Controls</span>
            </div>
            <button
              onClick={() => setShowConfigDock(false)}
              className="rounded-full p-1 text-slate-400 hover:text-white"
            >
              &times;
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-slate-400 block mb-1 font-medium">Voice Announcement Language:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["bilingual", "hi", "en"] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSpeechLanguage(lang)}
                    className={`rounded-xl py-1.5 font-semibold text-[11px] capitalize transition ${
                      speechLanguage === lang
                        ? "bg-apple-blue text-white"
                        : "bg-white/[0.05] text-slate-400 hover:text-white"
                    }`}
                  >
                    {lang === "bilingual" ? "🇮🇳 Both" : lang === "hi" ? "हिन्दी" : "English"}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-white/[0.08] space-y-2">
              <button
                onClick={handleSimulateNextCall}
                disabled={queue.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 font-bold transition active:scale-95 disabled:opacity-40"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Simulate Call Next Token</span>
              </button>

              <button
                onClick={() => playHospitalChime(0.6)}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white py-2 transition active:scale-95"
              >
                <Bell className="h-3.5 w-3.5" />
                <span>Test Acoustic Chime Only</span>
              </button>

              <button
                onClick={() => fetchQueueFromAPI()}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] text-slate-300 hover:text-white py-2 transition active:scale-95"
              >
                <RefreshCw className="h-3.5 w-3.5" />
                <span>Force Refresh API Queue</span>
              </button>
            </div>

            <div className="pt-2 border-t border-white/[0.08] flex items-center justify-between text-[11px] text-slate-400">
              <Link 
                href="/clinic/desk" 
                className="text-sky-400 hover:underline flex items-center gap-1"
                target="_blank"
              >
                <span>Open Front Desk</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
              <span>Press F11 for Fullscreen</span>
            </div>
          </div>
        </div>
      )}

      {/* CSS Animation for smooth Marquee Ticker */}
      <style jsx>{`
        @keyframes marquee {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }
        .animate-marquee {
          display: inline-block;
          white-space: nowrap;
          animation: marquee 35s linear infinite;
        }
        .animate-marquee:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  );
}
