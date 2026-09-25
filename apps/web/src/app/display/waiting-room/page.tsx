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
  AlertCircle,
  Send,
  Sun,
  Moon,
  Smartphone,
  Tv,
  Check,
  Activity,
  Layers,
  MapPin,
  ExternalLink
} from "lucide-react";
import { API_BASE_URL } from "@/lib/api";
import QRCodeDisplay from "@/components/QRCodeDisplay";

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

  window.speechSynthesis.cancel();

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
  const [tvTheme, setTvTheme] = useState<"dark" | "light">("dark");

  // Clinic metadata
  const [clinic] = useState({
    name: "Derma Care Skin & Laser Centre",
    tagline: "Advanced Dermatology, Laser & Aesthetic Surgery",
    address: "14, Rajpur Road, Dehradun",
    helpline: "+91 98765 43210",
    slug: "derma-care-dehradun"
  });

  // Multi-Chambers status for Polyclinics
  const [chambers, setChambers] = useState<ChamberStatus[]>([
    {
      chamber_id: "ch-1",
      chamber_name: "Chamber 1 - OPD Main",
      doctor_name: "Dr. Rahul Sharma",
      specialty: "MBBS, MD Dermatology",
      current_token: 2,
      patient_name: "Priya Singh",
      status: "consulting",
      elapsed_seconds: 245
    },
    {
      chamber_id: "ch-2",
      chamber_name: "Chamber 2 - Laser & Aesthetics",
      doctor_name: "Dr. Ananya Rawat",
      specialty: "Aesthetic Cosmetology",
      current_token: 1,
      patient_name: "Neha Gupta",
      status: "consulting",
      elapsed_seconds: 410
    }
  ]);

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
      chamber_name: "Chamber 1 - OPD Main",
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
      chamber_name: "Chamber 1 - OPD Main",
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
      chamber_name: "Chamber 1 - OPD Main",
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
      chamber_name: "Chamber 1 - OPD Main",
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
      chamber_name: "Chamber 1 - OPD Main",
      estimated_wait_mins: 38
    }
  ]);

  const [sseConnected, setSseConnected] = useState<boolean>(false);
  const lastAnnouncedTokenRef = useRef<number | null>(null);

  // Mobile Patient Token Tracker View State
  const [viewMode, setViewMode] = useState<"tv" | "patient">("tv");
  const [patientToken, setPatientToken] = useState<number>(4);
  const [patientPhone, setPatientPhone] = useState<string>("+919876543210");
  const [patientName, setPatientName] = useState<string>("Sneha Dobhal");
  const [isSubscribing, setIsSubscribing] = useState<boolean>(false);
  const [alertSuccessToast, setAlertSuccessToast] = useState<string | null>(null);
  const [waDirectLink, setWaDirectLink] = useState<string | null>(null);
  const [lastDispatchedPreview, setLastDispatchedPreview] = useState<string | null>(null);

  // Read URL query parameters on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const modeParam = params.get("mode") || params.get("view");
      const tokenParam = params.get("token");
      const phoneParam = params.get("phone");
      const nameParam = params.get("name");

      if (modeParam === "patient" || tokenParam || window.innerWidth < 768) {
        setViewMode("patient");
      }
      if (tokenParam) {
        const num = Number(tokenParam);
        if (!isNaN(num) && num > 0) setPatientToken(num);
      }
      if (phoneParam) setPatientPhone(phoneParam);
      if (nameParam) setPatientName(nameParam);
    }
  }, []);

  const handleSubscribeTokenAlert = async (isTest: boolean = false) => {
    setIsSubscribing(true);
    setAlertSuccessToast(null);
    try {
      const currentToken = activeChamber.current_token || 1;
      const res = await fetch("/api/clinic/token-alert", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: isTest ? "test_alert" : "subscribe",
          phone: patientPhone,
          patient_name: patientName,
          token_number: patientToken,
          current_token: currentToken,
          clinic_slug: clinic.slug,
          clinic_name: clinic.name,
          chamber_name: activeChamber.chamber_name,
          doctor_name: activeChamber.doctor_name
        })
      });

      const json = await res.json();
      if (res.ok) {
        setAlertSuccessToast(json.message);
        setWaDirectLink(json.whatsapp_direct_link || null);
        setLastDispatchedPreview(json.alert_message_preview || null);
      } else {
        setAlertSuccessToast(`Alert Error: ${json.error}`);
      }
    } catch (e: any) {
      setAlertSuccessToast(`Network Error: ${e.message}`);
    } finally {
      setIsSubscribing(false);
    }
  };

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

  // Trigger audio announcement
  const triggerAudioAnnouncement = useCallback(
    (token: number, pName: string, chamberName: string) => {
      if (isMuted) return;
      playHospitalChime(0.6);
      setTimeout(() => {
        speakBilingualAnnouncement(token, pName, chamberName, speechLanguage);
      }, 600);

      setRecentCallAlert(true);
      setTimeout(() => setRecentCallAlert(false), 9000);
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

            if (
              lastAnnouncedTokenRef.current !== null &&
              lastAnnouncedTokenRef.current !== inConsult.token_number
            ) {
              triggerAudioAnnouncement(
                inConsult.token_number,
                inConsult.patient_name,
                "Chamber 1 - OPD Main"
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
              chamber_name: "Chamber 1 - OPD Main",
              estimated_wait_mins: Math.max(5, (idx + 1) * 8)
            }));
            setQueue(mappedWaiting);
          }
        }
      }
    } catch (e) {
      // Offline fallback preserved
    }
  }, [triggerAudioAnnouncement]);

  // Connect to SSE real-time stream
  useEffect(() => {
    fetchQueueFromAPI();
    const pollInterval = setInterval(fetchQueueFromAPI, 4000);

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource(`${API_BASE_URL}/api/v1/clinic/stream`);
      eventSource.onopen = () => setSseConnected(true);
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

            triggerAudioAnnouncement(d.token_number, d.patient_name, "Chamber 1 - OPD Main");
            fetchQueueFromAPI();
          }
        } catch (err) {
          console.error("SSE parse error", err);
        }
      };
      eventSource.onerror = () => setSseConnected(false);
    } catch (e) {
      setSseConnected(false);
    }

    return () => {
      clearInterval(pollInterval);
      if (eventSource) eventSource.close();
    };
  }, [fetchQueueFromAPI, triggerAudioAnnouncement]);

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

  const handleUserUnlockAudio = () => {
    setAudioUnlocked(true);
    playHospitalChime(0.2);
  };

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

  const currentChamberToken = activeChamber?.current_token || 1;
  const positionsAway = Math.max(0, patientToken - currentChamberToken);
  const isWithin2Tokens = positionsAway <= 2 && positionsAway >= 0;

  const liveQueueUrl = `https://medic-sept-2026.vercel.app/waiting-room?clinic=${clinic.slug}&view=patient`;

  return (
    <div 
      onClick={!audioUnlocked ? handleUserUnlockAudio : undefined}
      className={`min-h-screen flex flex-col justify-between selection:bg-[#0071E3] selection:text-white font-sans overflow-x-hidden select-none transition-colors duration-300 ${
        tvTheme === "dark" 
          ? "bg-[#06080F] text-[#F5F5F7]" 
          : "bg-[#ECEEF2] text-[#1D1D1F]"
      }`}
    >
      {/* 1. AUDIO UNLOCK BANNER */}
      {!audioUnlocked && (
        <div className="bg-gradient-to-r from-[#0071E3] via-[#0077ED] to-[#0071E3] text-white px-6 py-2.5 text-xs font-semibold flex items-center justify-between shadow-apple-sm cursor-pointer animate-pulse z-50">
          <div className="flex items-center gap-2.5">
            <Volume2 className="h-4 w-4" />
            <span>
              🔊 <strong>Interactive Audio Ready:</strong> Tap anywhere to enable high-fidelity chime &amp; bilingual patient callouts.
            </span>
          </div>
          <button 
            onClick={handleUserUnlockAudio}
            className="rounded-full bg-white/20 hover:bg-white/30 px-3.5 py-1 text-[11px] font-bold uppercase tracking-wider transition"
          >
            Enable Audio
          </button>
        </div>
      )}

      {/* 2. TOP APPLE TV COMMAND BAR */}
      <header className={`border-b px-6 py-3.5 flex items-center justify-between transition-colors ${
        tvTheme === "dark" 
          ? "border-white/[0.08] bg-[#0E131F]/90 backdrop-blur-xl" 
          : "border-black/[0.06] bg-white/90 backdrop-blur-xl shadow-apple-sm"
      }`}>
        {/* Clinic Identity */}
        <div className="flex items-center gap-3.5">
          <div className="flex h-11 w-11 items-center justify-center rounded-[14px] bg-[#0071E3] text-white shadow-apple-sm">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className={`text-lg sm:text-xl font-black tracking-tight ${tvTheme === "dark" ? "text-white" : "text-[#1D1D1F]"}`}>
                {clinic.name}
              </h1>
              <span className="rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2 py-0.5 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-500 animate-ping"></span>
                <span>Live Token Desk</span>
              </span>
            </div>
            <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] font-medium">
              {clinic.tagline} • {clinic.address}
            </p>
          </div>
        </div>

        {/* Live Clock, Realtime Sync & Controls */}
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Real-Time Sync Indicator */}
          <div className={`hidden md:flex items-center gap-2 text-xs font-semibold px-3 py-1.5 rounded-full border ${
            tvTheme === "dark" 
              ? "bg-white/[0.04] border-white/[0.08] text-slate-300" 
              : "bg-black/[0.03] border-black/[0.06] text-slate-700"
          }`}>
            <Radio className={`h-3.5 w-3.5 ${sseConnected ? "text-emerald-500 animate-pulse" : "text-amber-500"}`} />
            <span>{sseConnected ? "Broadcaster Live" : "Local Sync Active"}</span>
          </div>

          {/* Clock */}
          <div className="text-right">
            <div className={`text-xl sm:text-2xl font-black font-mono tracking-tight flex items-center justify-end gap-1.5 ${
              tvTheme === "dark" ? "text-white" : "text-[#1D1D1F]"
            }`}>
              <Clock className="h-4 w-4 text-[#0071E3] hidden sm:inline" />
              <span>{currentTime || "10:30:00 AM"}</span>
            </div>
            <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93] font-medium">
              {currentDate || "Friday, 25 Sep"}
            </div>
          </div>

          {/* Controls Segment */}
          <div className="flex items-center gap-1.5">
            {/* View Mode Segmented Control */}
            <div className={`flex items-center rounded-[12px] p-0.5 border text-xs mr-1 ${
              tvTheme === "dark" 
                ? "bg-white/[0.06] border-white/[0.08]" 
                : "bg-black/[0.04] border-black/[0.06]"
            }`}>
              <button
                type="button"
                onClick={() => setViewMode("tv")}
                className={`px-3 py-1.5 rounded-[10px] font-bold transition flex items-center gap-1.5 ${
                  viewMode === "tv"
                    ? "bg-[#0071E3] text-white shadow-apple-sm"
                    : "text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white"
                }`}
              >
                <Tv className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lounge TV</span>
              </button>
              <button
                type="button"
                onClick={() => setViewMode("patient")}
                className={`px-3 py-1.5 rounded-[10px] font-bold transition flex items-center gap-1.5 ${
                  viewMode === "patient"
                    ? "bg-emerald-600 text-white shadow-apple-sm"
                    : "text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white"
                }`}
              >
                <Smartphone className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Mobile Tracker</span>
              </button>
            </div>

            {/* Dark / Light Theme Toggle */}
            <button
              onClick={() => setTvTheme(prev => prev === "dark" ? "light" : "dark")}
              className={`p-2 rounded-[12px] border transition ${
                tvTheme === "dark"
                  ? "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white"
                  : "border-black/[0.08] bg-white text-slate-700 hover:bg-black/[0.02]"
              }`}
              title="Toggle Screen Contrast (Daylight / Cinema Dark)"
            >
              {tvTheme === "dark" ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            {/* Mute Toggle */}
            <button
              onClick={() => setIsMuted(!isMuted)}
              className={`p-2 rounded-[12px] border transition ${
                isMuted 
                  ? "bg-rose-500/10 border-rose-500/30 text-rose-500" 
                  : tvTheme === "dark"
                    ? "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white"
                    : "border-black/[0.08] bg-white text-slate-700 hover:bg-black/[0.02]"
              }`}
              title={isMuted ? "Unmute Announcements" : "Mute Sound"}
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
            </button>

            {/* Fullscreen Toggle */}
            <button
              onClick={toggleFullscreen}
              className={`hidden sm:flex p-2 rounded-[12px] border transition ${
                tvTheme === "dark"
                  ? "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white"
                  : "border-black/[0.08] bg-white text-slate-700 hover:bg-black/[0.02]"
              }`}
              title="Fullscreen Mode (F11)"
            >
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </button>

            {/* Settings Dock Button */}
            <button
              onClick={() => setShowConfigDock(!showConfigDock)}
              className={`p-2 rounded-[12px] border transition ${
                tvTheme === "dark"
                  ? "border-white/[0.08] bg-white/[0.04] text-slate-300 hover:text-white"
                  : "border-black/[0.08] bg-white text-slate-700 hover:bg-black/[0.02]"
              }`}
              title="TV Settings & Simulation"
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* 3. MAIN CONTENT: CONDITIONAL VIEW (PATIENT MOBILE PASS vs LOUNGE TV DISPLAY) */}
      {viewMode === "patient" ? (
        /* PATIENT MOBILE TOKEN TRACKER (APPLE WALLET LIVE ACTIVITY DESIGN) */
        <main className="flex-1 p-4 sm:p-6 max-w-lg mx-auto w-full space-y-4 animate-in fade-in duration-300">
          
          {/* Toast Notification */}
          {alertSuccessToast && (
            <div className="rounded-[18px] bg-emerald-500/10 border border-emerald-500/30 p-4 text-emerald-800 dark:text-emerald-300 text-xs font-semibold shadow-apple-sm flex items-start gap-2.5 animate-in slide-in-from-top-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div>{alertSuccessToast}</div>
                {waDirectLink && (
                  <a
                    href={waDirectLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 mt-1.5 rounded-[10px] bg-emerald-600 hover:bg-emerald-700 text-white px-3 py-1.5 text-xs font-bold shadow-apple-sm transition"
                  >
                    <span>Open in WhatsApp</span>
                    <ArrowRight className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            </div>
          )}

          {/* FIX 1: "YOUR TURN SOON" DYNAMIC ISLAND PULSING ALERT */}
          {isWithin2Tokens && (
            <div className="relative overflow-hidden rounded-[24px] border-2 border-emerald-500 bg-gradient-to-br from-emerald-600 to-teal-700 p-5 shadow-[0_8px_32px_rgba(16,185,129,0.35)] text-center text-white space-y-2 animate-pulse">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-3 py-1 text-xs font-black uppercase tracking-wider backdrop-blur-md">
                <span className="h-2 w-2 rounded-full bg-white animate-ping" />
                <span>🔔 Your Turn Soon! / आपकी बारी आने वाली है</span>
              </div>
              <div className="text-xl sm:text-2xl font-black">
                {positionsAway === 0
                  ? "Your Token Is Being Called Right Now!"
                  : `You are only ${positionsAway} patient${positionsAway > 1 ? "s" : ""} away!`}
              </div>
              <p className="text-xs text-white/90 leading-relaxed font-medium">
                Please proceed to {activeChamber.chamber_name} waiting corridor immediately.
              </p>
              <div className="text-[11px] text-white/80 font-medium">
                &quot;कृपया रिसेप्शन या परामर्श कक्ष 1 के पास पहुंचें।&quot;
              </div>
            </div>
          )}

          {/* APPLE WALLET STYLE DIGITAL TOKEN PASS */}
          <div className={`rounded-[24px] border overflow-hidden shadow-apple-card transition-colors ${
            tvTheme === "dark" 
              ? "bg-[#111728] border-white/[0.10]" 
              : "bg-white border-black/[0.08]"
          }`}>
            {/* Pass Header */}
            <div className="p-5 border-b border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between bg-black/[0.02] dark:bg-white/[0.02]">
              <div>
                <span className="text-[10px] font-mono uppercase tracking-widest text-[#86868B] dark:text-[#8E8E93]">
                  OPD DIGITAL CLINIC PASS
                </span>
                <h3 className={`text-sm font-bold ${tvTheme === "dark" ? "text-white" : "text-[#1D1D1F]"}`}>
                  {clinic.name}
                </h3>
              </div>
              <span className="rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF] border border-[#0071E3]/20 text-[10px] font-bold px-2.5 py-0.5">
                ACTIVE QUEUE
              </span>
            </div>

            {/* Giant Token Body */}
            <div className="p-6 text-center space-y-4">
              <div className="text-xs text-[#86868B] dark:text-[#8E8E93] font-semibold">
                YOUR ASSIGNED TOKEN NUMBER
              </div>

              {/* Huge Monospace Token with Apple Accent Glow */}
              <div className="relative py-2">
                <div className="text-7xl sm:text-8xl font-black font-mono tracking-tight text-[#0071E3] dark:text-[#2997FF] drop-shadow-sm">
                  #{String(patientToken).padStart(2, "0")}
                </div>
                <div className="text-xs font-bold mt-1 text-[#1D1D1F] dark:text-[#F5F5F7]">
                  {patientName}
                </div>
              </div>

              {/* Live Metric Row: Current in Chamber vs Estimated Wait */}
              <div className="grid grid-cols-2 gap-3 pt-2">
                <div className={`p-3 rounded-[16px] border text-left ${
                  tvTheme === "dark" 
                    ? "bg-white/[0.04] border-white/[0.08]" 
                    : "bg-black/[0.02] border-black/[0.06]"
                }`}>
                  <div className="text-[10px] uppercase font-bold text-[#86868B] dark:text-[#8E8E93]">
                    Currently In Room
                  </div>
                  <div className="text-2xl font-black font-mono text-emerald-600 dark:text-emerald-400 mt-0.5">
                    #{String(activeChamber.current_token || 2).padStart(2, "0")}
                  </div>
                  <div className="text-[10px] text-[#86868B] dark:text-[#8E8E93] truncate">
                    {activeChamber.patient_name || "Consulting"}
                  </div>
                </div>

                <div className={`p-3 rounded-[16px] border text-left ${
                  tvTheme === "dark" 
                    ? "bg-white/[0.04] border-white/[0.08]" 
                    : "bg-black/[0.02] border-black/[0.06]"
                }`}>
                  <div className="text-[10px] uppercase font-bold text-[#86868B] dark:text-[#8E8E93]">
                    Estimated Wait
                  </div>
                  <div className="text-2xl font-black font-mono text-[#0071E3] dark:text-[#2997FF] mt-0.5">
                    {positionsAway === 0 ? "0 mins" : `~${Math.max(5, positionsAway * 8)}m`}
                  </div>
                  <div className="text-[10px] text-[#86868B] dark:text-[#8E8E93]">
                    {positionsAway === 0 ? "Your Turn Now!" : `${positionsAway} ahead of you`}
                  </div>
                </div>
              </div>

              {/* Step indicator */}
              <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-[#86868B] dark:text-[#8E8E93]">
                <div className="flex items-center gap-1.5">
                  <Stethoscope className="h-3.5 w-3.5 text-[#0071E3]" />
                  <span>{activeChamber.doctor_name}</span>
                </div>
                <span>{activeChamber.chamber_name}</span>
              </div>
            </div>

            {/* Quick Token Selector Bar */}
            <div className="p-3 bg-black/[0.02] dark:bg-white/[0.02] border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs">
              <span className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">Select token to preview:</span>
              <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5, 6, 7].map(num => (
                  <button
                    key={num}
                    onClick={() => setPatientToken(num)}
                    className={`h-7 w-7 rounded-[8px] text-xs font-mono font-bold transition ${
                      patientToken === num
                        ? "bg-[#0071E3] text-white shadow-apple-sm"
                        : "bg-black/[0.04] dark:bg-white/[0.06] text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white"
                    }`}
                  >
                    #{num}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* FIX 2: PROACTIVE WHATSAPP & SMS ALERT REGISTRATION */}
          <div className={`rounded-[24px] border p-5 shadow-apple-card space-y-3.5 ${
            tvTheme === "dark" 
              ? "bg-[#111728] border-white/[0.10]" 
              : "bg-white border-black/[0.08]"
          }`}>
            <div className="flex items-center justify-between">
              <span className="font-bold text-xs flex items-center gap-1.5 text-[#1D1D1F] dark:text-white">
                <Bell className="h-4 w-4 text-emerald-600 dark:text-emerald-400" />
                <span>Proactive WhatsApp / SMS Notifications</span>
              </span>
              <span className="rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 text-[10px] font-bold px-2.5 py-0.5 border border-emerald-500/20">
                PROACTIVE
              </span>
            </div>

            <p className="text-xs text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
              Enter your mobile number to receive an automated alert when your token is <strong>2 positions away</strong>. Feel free to wait in your car or at a nearby cafe without queue anxiety.
            </p>

            <div className="space-y-2">
              <div className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[#86868B] dark:text-[#8E8E93]" />
                  <input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={patientPhone}
                    onChange={(e) => setPatientPhone(e.target.value)}
                    className="w-full rounded-[12px] border border-black/[0.10] bg-black/[0.02] dark:border-white/[0.12] dark:bg-white/[0.04] pl-9 pr-3 py-2.5 text-xs font-mono font-bold text-[#1D1D1F] dark:text-white focus:border-[#0071E3] focus:outline-none"
                  />
                </div>

                <button
                  type="button"
                  disabled={isSubscribing || !patientPhone}
                  onClick={() => handleSubscribeTokenAlert(false)}
                  className="rounded-[12px] bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2.5 text-xs font-bold shadow-apple-sm transition active:scale-98 whitespace-nowrap flex items-center justify-center gap-1.5"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>{isSubscribing ? "Activating..." : "Notify Me on WhatsApp"}</span>
                </button>
              </div>

              <div className="flex items-center justify-between text-[11px] text-[#86868B] dark:text-[#8E8E93] pt-1">
                <span>Triggers automatically 2 tokens away</span>
                <button
                  type="button"
                  onClick={() => handleSubscribeTokenAlert(true)}
                  className="text-[#0071E3] dark:text-[#2997FF] hover:underline font-semibold"
                >
                  Send Sample Alert
                </button>
              </div>
            </div>

            {lastDispatchedPreview && (
              <div className="rounded-[14px] bg-black/[0.03] dark:bg-black/50 border border-black/[0.06] dark:border-white/[0.08] p-3 text-[11px] font-mono text-[#86868B] dark:text-[#8E8E93] whitespace-pre-line">
                <div className="text-[10px] uppercase font-bold text-emerald-600 dark:text-emerald-400 mb-1">
                  WhatsApp Alert Preview:
                </div>
                {lastDispatchedPreview}
              </div>
            )}
          </div>

          {/* Bilingual Guidance Card */}
          <div className="rounded-[20px] border border-black/[0.06] dark:border-white/[0.08] p-4 text-xs space-y-1.5 bg-black/[0.02] dark:bg-white/[0.02]">
            <div className="font-bold text-[#1D1D1F] dark:text-white flex items-center gap-1.5">
              <span>🌐 Bilingual Assistance / सहायता:</span>
            </div>
            <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
              &quot;कैमरे से स्कैन करें और बाहर या गाड़ी में आराम से प्रतीक्षा करें। आपकी बारी आने पर सतर्क रहें।&quot;
            </p>
            <p className="text-[10px] text-[#86868B] dark:text-[#8E8E93]">
              Zero app download required. Live counter OPD updates operate smoothly on any smartphone camera browser.
            </p>
          </div>

          {/* Switch to Lounge TV Button */}
          <div className="pt-2 text-center">
            <button
              onClick={() => setViewMode("tv")}
              className="inline-flex items-center gap-1.5 rounded-full border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] px-4 py-2 text-xs font-bold text-[#1D1D1F] dark:text-white shadow-apple-sm hover:bg-black/[0.02] dark:hover:bg-white/[0.04] transition"
            >
              <Tv className="h-3.5 w-3.5 text-[#0071E3]" />
              <span>Switch to Lounge Smart TV Display</span>
            </button>
          </div>
        </main>
      ) : (
        /* 3. LOUNGE SMART TV MATRIX DISPLAY (OPTIMIZED FOR 43"-65" SCREENS) */
        <main className="flex-1 p-6 lg:p-8 max-w-[1800px] mx-auto w-full grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch animate-in fade-in duration-300">
          
          {/* LEFT COLUMN: HERO "NOW SERVING" CHAMBER SPOTLIGHT (7 Cols) */}
          <div className="lg:col-span-7 flex flex-col justify-between space-y-6">
            
            {/* Chamber Switcher Pills */}
            <div className={`flex items-center justify-between border p-2 rounded-[20px] transition-colors ${
              tvTheme === "dark" 
                ? "bg-[#0E1322] border-white/[0.08]" 
                : "bg-white border-black/[0.06] shadow-apple-sm"
            }`}>
              <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
                {chambers.map((ch, idx) => (
                  <button
                    key={ch.chamber_id}
                    onClick={() => setActiveChamberIndex(idx)}
                    className={`flex items-center gap-2.5 px-4 py-2 rounded-[14px] text-xs font-bold transition ${
                      activeChamberIndex === idx
                        ? "bg-[#0071E3] text-white shadow-apple-sm"
                        : "text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white hover:bg-black/[0.03] dark:hover:bg-white/[0.05]"
                    }`}
                  >
                    <Stethoscope className="h-4 w-4" />
                    <span>{ch.chamber_name}</span>
                    <span className={`h-2 w-2 rounded-full ${ch.status === "consulting" ? "bg-emerald-500" : "bg-slate-400"}`}></span>
                  </button>
                ))}
              </div>

              <div className="text-[11px] text-[#86868B] dark:text-[#8E8E93] font-medium px-2 hidden sm:block">
                Doctor: <strong className={tvTheme === "dark" ? "text-white" : "text-[#1D1D1F]"}>{activeChamber.doctor_name}</strong>
              </div>
            </div>

            {/* HERO ACTIVE TOKEN CARD */}
            <div className={`relative flex-1 rounded-[36px] border p-8 sm:p-12 flex flex-col justify-between transition-all duration-500 shadow-apple-card ${
              recentCallAlert 
                ? "bg-gradient-to-br from-emerald-950/70 via-[#10192A] to-[#0D121F] border-emerald-500/60 shadow-[0_0_80px_rgba(16,185,129,0.3)] ring-4 ring-emerald-500/20" 
                : tvTheme === "dark"
                  ? "bg-gradient-to-br from-[#11172A] via-[#0E1320] to-[#080C14] border-white/[0.10]"
                  : "bg-white border-black/[0.08]"
            }`}>
              
              {/* Top Status Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="relative flex h-4 w-4">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-4 w-4 bg-emerald-500"></span>
                  </span>
                  <span className="text-sm sm:text-base font-black tracking-wider uppercase text-emerald-500">
                    {recentCallAlert ? "🔔 JUST CALLED TO CHAMBER" : "NOW SERVING / अभी परामर्श कक्ष में"}
                  </span>
                </div>

                <div className={`flex items-center gap-2 rounded-full border px-4 py-1.5 text-xs font-semibold ${
                  tvTheme === "dark" 
                    ? "bg-white/[0.06] border-white/[0.1] text-slate-300" 
                    : "bg-black/[0.03] border-black/[0.06] text-slate-700"
                }`}>
                  <span>In Chamber:</span>
                  <span className={`font-mono font-bold text-sm ${tvTheme === "dark" ? "text-white" : "text-[#1D1D1F]"}`}>
                    {formatSeconds(activeChamber.elapsed_seconds)}
                  </span>
                </div>
              </div>

              {/* Giant Center Token Display */}
              <div className="my-8 text-center sm:text-left flex flex-col sm:flex-row items-center justify-between gap-8">
                <div>
                  <div className="text-xs font-bold text-[#86868B] dark:text-[#8E8E93] uppercase tracking-widest mb-1">
                    PATIENT TOKEN NUMBER
                  </div>
                  <div className="text-8xl sm:text-9xl lg:text-[11.5rem] font-black tracking-tighter text-[#0071E3] dark:text-[#2997FF] font-mono leading-none drop-shadow-[0_10px_30px_rgba(0,113,227,0.3)]">
                    #{String(activeChamber.current_token || 2).padStart(2, "0")}
                  </div>
                </div>

                {/* Patient Name & Chamber Target */}
                <div className="text-center sm:text-right space-y-3">
                  <div className={`rounded-[22px] border p-5 backdrop-blur-md text-left sm:text-right min-w-[260px] ${
                    tvTheme === "dark" 
                      ? "bg-white/[0.04] border-white/[0.08]" 
                      : "bg-black/[0.02] border-black/[0.06]"
                  }`}>
                    <div className="text-xs text-[#86868B] dark:text-[#8E8E93] uppercase font-semibold">
                      PATIENT NAME / मरीज
                    </div>
                    <div className={`text-2xl sm:text-3xl font-black mt-1 ${tvTheme === "dark" ? "text-white" : "text-[#1D1D1F]"}`}>
                      {activeChamber.patient_name || "Priya Singh"}
                    </div>
                    <div className="text-xs text-emerald-500 font-semibold mt-1 flex items-center justify-start sm:justify-end gap-1">
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>In Consultation</span>
                    </div>
                  </div>

                  <div className="rounded-[22px] bg-[#0071E3]/15 border border-[#0071E3]/30 p-4 text-left sm:text-right">
                    <div className="text-xs text-[#0071E3] dark:text-[#2997FF] uppercase font-bold">
                      PROCEED TO ROOM
                    </div>
                    <div className={`text-xl sm:text-2xl font-black mt-0.5 ${tvTheme === "dark" ? "text-white" : "text-[#1D1D1F]"}`}>
                      {activeChamber.chamber_name}
                    </div>
                    <div className="text-xs text-[#86868B] dark:text-[#8E8E93] font-medium">
                      {activeChamber.doctor_name} ({activeChamber.specialty})
                    </div>
                  </div>
                </div>
              </div>

              {/* Acoustic Chime Voice Readout Ticker */}
              <div className={`rounded-[20px] border p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs ${
                tvTheme === "dark" 
                  ? "bg-black/40 border-white/[0.08]" 
                  : "bg-black/[0.02] border-black/[0.06]"
              }`}>
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-[12px] bg-[#0071E3]/15 text-[#0071E3] flex-shrink-0">
                    <Volume2 className="h-4 w-4" />
                  </div>
                  <div>
                    <div className={`font-bold ${tvTheme === "dark" ? "text-white" : "text-[#1D1D1F]"}`}>
                      📢 &quot;Token Number {activeChamber.current_token || 2}, {activeChamber.patient_name || 'Priya Singh'}, please proceed to {activeChamber.chamber_name}.&quot;
                    </div>
                    <div className="text-[#86868B] dark:text-[#8E8E93] text-[11px] mt-0.5">
                      🇮🇳 &quot;टोकन नंबर {activeChamber.current_token || 2}, कृपया {activeChamber.chamber_name === "Chamber 1 - OPD Main" ? "कक्ष 1" : "कक्ष"} में आएं।&quot;
                    </div>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => triggerAudioAnnouncement(activeChamber.current_token || 2, activeChamber.patient_name || "Priya Singh", activeChamber.chamber_name)}
                  className={`inline-flex items-center gap-1.5 rounded-[12px] px-3.5 py-2 font-semibold text-xs transition active:scale-95 whitespace-nowrap self-start sm:self-auto border ${
                    tvTheme === "dark"
                      ? "border-white/[0.12] bg-white/[0.06] text-white hover:bg-white/[0.12]"
                      : "border-black/[0.08] bg-white text-[#1D1D1F] hover:bg-black/[0.02] shadow-apple-sm"
                  }`}
                >
                  <Play className="h-3 w-3 fill-current" />
                  <span>Repeat Voice Call</span>
                </button>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: UPCOMING QUEUE & VECTOR QR CODE (5 Cols) */}
          <div className="lg:col-span-5 flex flex-col justify-between space-y-6">
            
            {/* UP NEXT IN LINE QUEUE CARD */}
            <div className={`flex-1 rounded-[36px] border p-6 sm:p-7 flex flex-col justify-between shadow-apple-card ${
              tvTheme === "dark" 
                ? "bg-[#0E1322] border-white/[0.08]" 
                : "bg-white border-black/[0.06]"
            }`}>
              <div>
                <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-4 mb-4">
                  <div className="flex items-center gap-2.5">
                    <div className="flex h-8 w-8 items-center justify-center rounded-[10px] bg-amber-500/10 text-amber-600 dark:text-amber-400">
                      <Clock className="h-4 w-4" />
                    </div>
                    <div>
                      <h3 className={`text-base font-bold ${tvTheme === "dark" ? "text-white" : "text-[#1D1D1F]"}`}>
                        Up Next in Line / प्रतीक्षा सूची
                      </h3>
                      <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">
                        {queue.length} Patients waiting in clinic lounge
                      </p>
                    </div>
                  </div>

                  <span className={`rounded-full px-3 py-1 text-xs font-bold font-mono border ${
                    tvTheme === "dark" 
                      ? "bg-white/[0.06] border-white/[0.08] text-white" 
                      : "bg-black/[0.03] border-black/[0.06] text-[#1D1D1F]"
                  }`}>
                    {queue.length} Ahead
                  </span>
                </div>

                {/* Queue List (Next 5 Patients) */}
                <div className="space-y-2.5">
                  {queue.slice(0, 5).map((patient, idx) => (
                    <div
                      key={patient.appointment_number}
                      className={`rounded-[18px] border p-3.5 flex items-center justify-between transition-all ${
                        idx === 0
                          ? "bg-amber-500/10 border-amber-500/30 text-amber-900 dark:text-white shadow-apple-sm"
                          : tvTheme === "dark"
                            ? "bg-white/[0.02] border-white/[0.05] hover:bg-white/[0.05] text-slate-300"
                            : "bg-black/[0.02] border-black/[0.04] hover:bg-black/[0.04] text-slate-800"
                      }`}
                    >
                      <div className="flex items-center gap-3.5">
                        <div className={`flex h-11 w-11 items-center justify-center rounded-[12px] font-mono text-base font-black ${
                          idx === 0
                            ? "bg-amber-500 text-slate-950 shadow-sm"
                            : tvTheme === "dark"
                              ? "bg-white/[0.08] text-white"
                              : "bg-white text-[#1D1D1F] shadow-apple-sm"
                        }`}>
                          #{String(patient.token_number).padStart(2, "0")}
                        </div>

                        <div>
                          <div className={`font-bold text-sm flex items-center gap-2 ${tvTheme === "dark" ? "text-white" : "text-[#1D1D1F]"}`}>
                            <span>{patient.patient_name}</span>
                            {idx === 0 && (
                              <span className="rounded-full bg-amber-500/20 text-amber-700 dark:text-amber-300 text-[10px] font-extrabold px-2 py-0.2 uppercase">
                                Next in Line
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-[#86868B] dark:text-[#8E8E93] mt-0.5">
                            {patient.doctor_name || "Dr. Rahul Sharma"} • {patient.time_slot}
                          </div>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className="text-xs font-bold font-mono text-[#0071E3] dark:text-[#2997FF]">
                          ~{patient.estimated_wait_mins || (idx + 1) * 8} mins
                        </div>
                        <div className="text-[10px] text-[#86868B] dark:text-[#8E8E93] font-medium">
                          Est. Wait Time
                        </div>
                      </div>
                    </div>
                  ))}

                  {queue.length === 0 && (
                    <div className="rounded-[18px] border border-dashed border-black/[0.1] dark:border-white/[0.1] p-8 text-center text-[#86868B] dark:text-[#8E8E93] text-xs">
                      No more waiting patients in queue. All tokens cleared!
                    </div>
                  )}
                </div>
              </div>

              {/* Consultation Pace Info */}
              <div className="mt-4 pt-3 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-xs text-[#86868B] dark:text-[#8E8E93]">
                <span>Average Consultation Pace:</span>
                <strong className={`font-mono ${tvTheme === "dark" ? "text-white" : "text-[#1D1D1F]"}`}>~8 to 10 mins / patient</strong>
              </div>
            </div>

            {/* REAL VECTOR QR CODE CARD (DIRECT PHONE SCANNING) */}
            <div className={`rounded-[32px] border p-5 flex items-center justify-between gap-5 shadow-apple-card ${
              tvTheme === "dark" 
                ? "bg-gradient-to-r from-blue-950/40 via-indigo-950/30 to-[#0E1322] border-white/[0.08]" 
                : "bg-gradient-to-r from-blue-50/60 via-indigo-50/40 to-white border-black/[0.06]"
            }`}>
              <div className="space-y-1.5 flex-1">
                <span className="rounded-full bg-[#0071E3]/15 text-[#0071E3] dark:text-[#2997FF] text-[10px] font-bold px-2.5 py-0.5 uppercase tracking-wider">
                  Zero App Download Required
                </span>
                <h4 className={`text-sm font-bold ${tvTheme === "dark" ? "text-white" : "text-[#1D1D1F]"}`}>
                  📲 Scan to Track Token on Phone
                </h4>
                <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93] leading-relaxed">
                  Wait outside in your car or at a nearby cafe. Point your phone camera at this QR code to view live token progress and receive automated WhatsApp alerts 2 tokens away!
                </p>
                <div className="text-[10px] font-mono text-[#0071E3] dark:text-[#2997FF] pt-1 truncate">
                  {liveQueueUrl}
                </div>
              </div>

              {/* REAL VECTOR QR CODE WITH QRCodeDisplay */}
              <div className="flex-shrink-0 bg-white p-3 rounded-[20px] shadow-apple-sm flex items-center justify-center border border-black/[0.08]">
                <QRCodeDisplay
                  value={liveQueueUrl}
                  size={105}
                  level="H"
                  fgColor="#000000"
                  bgColor="#FFFFFF"
                  centerBadgeText="ClinicOS"
                />
              </div>
            </div>
          </div>
        </main>
      )}

      {/* 4. BOTTOM TICKER / CLINIC MARQUEE BAR */}
      <footer className={`border-t px-6 py-3 flex items-center gap-4 text-xs font-medium overflow-hidden transition-colors ${
        tvTheme === "dark" 
          ? "border-white/[0.08] bg-[#0A0D15] text-[#8E8E93]" 
          : "border-black/[0.06] bg-white text-[#86868B] shadow-apple-sm"
      }`}>
        <div className="flex items-center gap-2 text-[#0071E3] font-bold whitespace-nowrap uppercase tracking-wider">
          <Sparkles className="h-4 w-4" />
          <span>Notice:</span>
        </div>

        <div className="relative flex-1 overflow-hidden whitespace-nowrap">
          <div className="inline-block animate-marquee">
            <span>
              🏥 <strong>Welcome to {clinic.name}:</strong> Free Patient Wi-Fi: <strong>ClinicGuest</strong> (No Password Required) &bull; 
              PMBJP Jan Aushadhi generic medicines available at the in-house pharmacy desk for up to 70% savings &bull; 
              Need urgent help or special assistance? Notify front-desk reception immediately &bull; 
              Dr. Rahul Sharma is consulting in Chamber 1 &bull; 
              Dr. Ananya Rawat is consulting in Chamber 2 (Laser Suite).
            </span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-2 font-mono text-[11px] text-[#86868B] dark:text-[#8E8E93] whitespace-nowrap border-l border-black/[0.08] dark:border-white/[0.1] pl-4">
          <ShieldCheck className="h-4 w-4 text-emerald-500" />
          <span>ClinicOS Live v2.0</span>
        </div>
      </footer>

      {/* 5. FLOATING CONFIGURATION & SIMULATOR DOCK (For TV Operator / Receptionist) */}
      {showConfigDock && (
        <div className="fixed bottom-14 right-6 z-50 w-80 rounded-[24px] border border-black/[0.08] dark:border-white/[0.15] bg-white/95 dark:bg-[#161C2C]/95 backdrop-blur-xl p-5 shadow-apple-modal space-y-4 animate-in fade-in slide-in-from-bottom-3 duration-200">
          <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-2.5">
            <div className="flex items-center gap-2 font-bold text-xs text-[#1D1D1F] dark:text-white">
              <Settings className="h-4 w-4 text-[#0071E3]" />
              <span>Smart TV Queue Controls</span>
            </div>
            <button
              onClick={() => setShowConfigDock(false)}
              className="rounded-full p-1 text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white"
            >
              &times;
            </button>
          </div>

          <div className="space-y-3 text-xs">
            <div>
              <label className="text-[#86868B] dark:text-[#8E8E93] block mb-1 font-medium">Voice Announcement Language:</label>
              <div className="grid grid-cols-3 gap-1.5">
                {(["bilingual", "hi", "en"] as const).map(lang => (
                  <button
                    key={lang}
                    onClick={() => setSpeechLanguage(lang)}
                    className={`rounded-[10px] py-1.5 font-semibold text-[11px] capitalize transition ${
                      speechLanguage === lang
                        ? "bg-[#0071E3] text-white"
                        : "bg-black/[0.04] dark:bg-white/[0.05] text-[#86868B] dark:text-[#8E8E93] hover:text-[#1D1D1F] dark:hover:text-white"
                    }`}
                  >
                    {lang === "bilingual" ? "🇮🇳 Both" : lang === "hi" ? "हिन्दी" : "English"}
                  </button>
                ))}
              </div>
            </div>

            <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] space-y-2">
              <button
                onClick={handleSimulateNextCall}
                disabled={queue.length === 0}
                className="w-full flex items-center justify-center gap-2 rounded-[12px] bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white py-2.5 font-bold transition active:scale-95 disabled:opacity-40"
              >
                <Play className="h-3.5 w-3.5 fill-current" />
                <span>Simulate Call Next Token</span>
              </button>

              <button
                onClick={() => playHospitalChime(0.6)}
                className="w-full flex items-center justify-center gap-2 rounded-[12px] border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.1] py-2 transition active:scale-95 font-semibold"
              >
                <Bell className="h-3.5 w-3.5 text-[#0071E3]" />
                <span>Test Hospital Chime</span>
              </button>

              <button
                onClick={() => fetchQueueFromAPI()}
                className="w-full flex items-center justify-center gap-2 rounded-[12px] border border-black/[0.08] dark:border-white/[0.1] bg-black/[0.02] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.1] py-2 transition active:scale-95 font-semibold"
              >
                <RefreshCw className="h-3.5 w-3.5 text-emerald-500" />
                <span>Force Refresh API Queue</span>
              </button>
            </div>

            <div className="pt-2 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center justify-between text-[11px] text-[#86868B] dark:text-[#8E8E93]">
              <Link 
                href="/dashboard/desk" 
                className="text-[#0071E3] dark:text-[#2997FF] hover:underline flex items-center gap-1 font-semibold"
                target="_blank"
              >
                <span>Open Reception Desk</span>
                <ChevronRight className="h-3 w-3" />
              </Link>
              <span>Press F11 for Fullscreen</span>
            </div>
          </div>
        </div>
      )}

      {/* Marquee Animation */}
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
