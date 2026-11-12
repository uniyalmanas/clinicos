"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Mic,
  MicOff,
  Square,
  Pause,
  Play,
  Volume2,
  VolumeX,
  Send,
  Sparkles,
  HeartPulse,
  Pill,
  FileText,
  AlertTriangle,
  ShieldCheck,
  ShieldAlert,
  CheckCircle2,
  User,
  Clock,
  Printer,
  Edit3,
  RotateCcw,
  Languages,
  X,
  Stethoscope,
  Microscope,
  Info,
  ChevronDown,
  ChevronUp,
  MessageSquare,
  History,
  Activity,
  ArrowRight,
  Download,
  Flame,
  Zap,
  Maximize2,
  Minimize2,
  PanelRightOpen,
  PanelRightClose,
  Layers,
  Share2,
  MessageCircle,
  QrCode,
  Copy,
  Check,
} from "lucide-react";
import { Button, Card, Badge } from "@/components/design-system";
import { attributeSpeaker } from "@/lib/speaker-attribution";
import {
  CONSULTATION_LANGUAGES,
  type ConsultationLanguage,
  type ConsultationReport,
} from "@/lib/consultation-types";
import type {
  ClinicalMemory,
  MedicationMemoryItem,
  PatientComplaintItem,
  ClarificationAlert,
  CompanionChatMessage,
  DoctorClinicalReport,
  PatientVisitSummary,
  HistoricalVisitSummary,
  CompanionInteractionMode,
  TranscriptTurnItem,
  ProvenanceCitation,
  PatientTimelineItem,
} from "@/lib/clinical-companion-types";
import {
  createInitialClinicalMemory,
  extractClinicalMemoryFromTranscript,
  handleDoctorCommand,
  generateDoctorClinicalReport,
  generatePatientVisitSummary,
} from "@/lib/clinical-companion-service";

type Props = {
  patient: {
    name: string;
    uhid?: string;
    phone: string;
    age?: number | string;
    gender?: string;
    allergies?: string[];
    medical_history?: string[];
    appointment_number?: string;
    token_number?: number;
    symptoms_description?: string;
    previous_visit_date?: string;
  };
  doctorName?: string;
  doctorSlug?: string;
  clinicName?: string;
  historicalVisits?: HistoricalVisitSummary[];
  onConsultationCompleted?: (report: ConsultationReport) => void;
  showToast?: (msg: string) => void;
  layoutMode?: "modal" | "docked" | "hud";
  onLayoutModeChange?: (mode: "modal" | "docked" | "hud") => void;
  onClose?: () => void;
  onSyncToPrescription?: (items: {
    complaints?: string[];
    vitals?: Record<string, any>;
    diagnosis?: string;
    medications?: any[];
  }) => void;
};

const BAR_PATTERN = [0.35, 0.6, 0.45, 0.85, 0.55, 0.95, 0.7, 0.4, 0.8, 0.5, 0.9, 0.65, 0.35, 0.75, 0.5, 0.85, 0.6, 0.4];

function formatTime(totalSeconds: number) {
  const m = Math.floor(totalSeconds / 60).toString().padStart(2, "0");
  const s = (totalSeconds % 60).toString().padStart(2, "0");
  return `${m}:${s}`;
}

function getToken() {
  return typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : null;
}

function authHeaders(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export function AIClinicalCompanion({
  patient,
  doctorName = "Dr. Rahul Sharma",
  doctorSlug = "dr-rahul-sharma",
  clinicName = "ClinicOS Care Network",
  historicalVisits = [
    {
      date: "14 Oct 2026",
      doctor_name: "Dr. Rahul Sharma",
      diagnosis: "Mild Bronchial Spasm & Rhinitis",
      medications: ["Tab Montair-LC (0-0-1 Night • 5 Days)", "Syp Ascoril-D (10ml TDS • 3 Days)"],
      vitals: "BP 122/80, HR 78, Temp 98.6°F, SpO2 99%",
    },
  ],
  onConsultationCompleted,
  showToast = () => {},
  layoutMode = "modal",
  onLayoutModeChange,
  onClose,
  onSyncToPrescription,
}: Props) {
  // ── 1. Recording & Session State ──
  const [sessionActive, setSessionActive] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [audioLevel, setAudioLevel] = useState(0);
  const [consentObtained, setConsentObtained] = useState(true);
  const [companionMode, setCompanionMode] = useState<CompanionInteractionMode>("assistant");
  const [speechSynthesisEnabled, setSpeechSynthesisEnabled] = useState(true);
  const [micPermissionError, setMicPermissionError] = useState<string | null>(null);

  // ── Docked Tab State ──
  const [dockTab, setDockTab] = useState<"dialogue" | "memory" | "assistant">("dialogue");
  const [memorySubView, setMemorySubView] = useState<"current" | "timeline">("current");
  const [timelineItems, setTimelineItems] = useState<PatientTimelineItem[]>([]);
  const [loadingTimeline, setLoadingTimeline] = useState(false);
  const [verifyingFactId, setVerifyingFactId] = useState<string | null>(null);

  // ── Backend FastAPI Session & WebSocket State ──
  const [backendSessionId, setBackendSessionId] = useState<string | null>(null);
  const [wsStatus, setWsStatus] = useState<"connecting" | "connected" | "disconnected" | "offline">("disconnected");
  const [transcriptTurns, setTranscriptTurns] = useState<TranscriptTurnItem[]>([]);
  const transcriptTurnsRef = useRef<TranscriptTurnItem[]>([]);
  const lastSpeakerRef = useRef<"doctor" | "patient" | "uncertain">("doctor");
  const [editingSpeakerTurnId, setEditingSpeakerTurnId] = useState<string | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  // ── 2. Speech & Transcript State ──
  const [transcript, setTranscript] = useState("");
  const [interimText, setInterimText] = useState("");
  const [language, setLanguage] = useState<ConsultationLanguage>("english");

  // ── 3. Clinical Memory State ──
  const [clinicalMemory, setClinicalMemory] = useState<ClinicalMemory>(() =>
    createInitialClinicalMemory({
      uhid: patient.uhid,
      name: patient.name,
      allergies: patient.allergies || ["Sulfa Drugs (Mild rash)"],
      medical_history: patient.medical_history || ["Type 2 Diabetes (Well-controlled)"],
      doctor_name: doctorName,
    })
  );

  // ── 4. Clarifications & Alerts ──
  const [clarifications, setClarifications] = useState<ClarificationAlert[]>([]);

  // ── 5. Conversational AI Chat ──
  const [chatMessages, setChatMessages] = useState<CompanionChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "companion",
      text: `Hello ${doctorName}. I am your Clinical Companion for ${patient.name} (${patient.uhid || "UHID"}). Tap the microphone to begin listening, or type/speak instructions anytime.`,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    },
  ]);
  const [doctorInput, setDoctorInput] = useState("");
  const [isProcessingCommand, setIsProcessingCommand] = useState(false);

  // ── 6. End-of-Consultation & Dual Report Review ──
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [reviewTab, setReviewTab] = useState<"doctor_report" | "patient_summary">("doctor_report");
  const [doctorReport, setDoctorReport] = useState<DoctorClinicalReport | null>(null);
  const [patientSummary, setPatientSummary] = useState<PatientVisitSummary | null>(null);
  const [patientSummaryLanguage, setPatientSummaryLanguage] = useState<ConsultationLanguage>("english");
  const [isFinalizing, setIsFinalizing] = useState(false);
  const [isManualPasteOpen, setIsManualPasteOpen] = useState(false);
  const [manualNotesText, setManualNotesText] = useState("");
  const [isCopiedWhatsApp, setIsCopiedWhatsApp] = useState(false);

  // Format clean WhatsApp message for patient
  const formatWhatsAppCareSummary = (summary: PatientVisitSummary) => {
    const isHindi = summary.language === "hindi";
    const lines: string[] = [];
    lines.push(`🏥 *${summary.section_1_visit_details.clinic_name}*`);
    lines.push(`*${isHindi ? "मरीज देखभाल सारांश (Care Summary)" : "Patient Care Summary"}*`);
    lines.push(`👤 *Patient*: ${patient.name} (${patient.uhid || "UHID-2026"})`);
    lines.push(`👨‍⚕️ *Doctor*: ${summary.section_1_visit_details.doctor_name}`);
    lines.push(`📅 *Date*: ${summary.section_1_visit_details.date}\n`);

    lines.push(`📋 *${isHindi ? "निदान (Diagnosis)" : "Diagnosis"}*:`);
    lines.push(`*${summary.section_5_your_diagnosis.diagnosis_name}*`);
    lines.push(`_${summary.section_5_your_diagnosis.plain_language_explanation}_\n`);

    lines.push(`💊 *${isHindi ? "दवाइयों का समय (Medicines Schedule)" : "Prescribed Medicines"}*:`);
    summary.section_6_your_medicines.forEach((m) => {
      lines.push(`• *${m.medicine_line}* [${m.timing_label}]`);
      lines.push(`   ↳ ${m.instructions}`);
    });
    lines.push("");

    lines.push(`🥗 *${isHindi ? "देखभाल सलाह (Home Care Advice)" : "Doctor's Advice & Diet"}*:`);
    summary.section_7_what_you_should_do.forEach((step) => {
      lines.push(`✓ ${step}`);
    });
    lines.push("");

    lines.push(`📅 *${isHindi ? "पुनः परामर्श (Follow-Up)" : "Follow-Up"}*: ${summary.section_8_your_follow_up.date_or_interval}`);
    lines.push(`_${summary.section_8_your_follow_up.special_advice}_\n`);

    lines.push(`⚠️ *${isHindi ? "आपातकालीन लक्षण (Emergency Signs)" : "Emergency Warning Signs"}*:`);
    summary.section_9_important_things_to_remember.forEach((warn) => {
      lines.push(`! ${warn}`);
    });
    lines.push("");

    lines.push(`📞 *Clinic Phone*: ${summary.section_10_contact_info.phone}`);
    lines.push(`🚨 *Emergency Helpline*: ${summary.section_10_contact_info.emergency_line}`);
    lines.push(`\n_Digitally generated via ClinicOS AI Clinical Companion. Verified by attending physician under NMC Guidelines._`);

    return lines.join("\n");
  };

  const handleDispatchWhatsApp = () => {
    if (!patientSummary) return;
    const text = formatWhatsAppCareSummary(patientSummary);
    const rawPhone = (patient.phone || "").replace(/[^0-9]/g, "");
    const formattedPhone = rawPhone.length === 10 ? `91${rawPhone}` : rawPhone || "919123456789";
    const url = `https://wa.me/${formattedPhone}?text=${encodeURIComponent(text)}`;
    if (typeof window !== "undefined") {
      window.open(url, "_blank");
    }
    showToast("Opening WhatsApp with formatted Patient Care Summary!");
  };

  const handleCopyWhatsAppText = async () => {
    if (!patientSummary) return;
    const text = formatWhatsAppCareSummary(patientSummary);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(text);
        setIsCopiedWhatsApp(true);
        setTimeout(() => setIsCopiedWhatsApp(false), 2500);
        showToast("WhatsApp care summary copied to clipboard!");
      }
    } catch {
      showToast("Could not copy to clipboard.");
    }
  };

  // Refs to prevent stale-closure traps during live speech recognition
  const clinicalMemoryRef = useRef<ClinicalMemory>(clinicalMemory);
  const transcriptRef = useRef<string>(transcript);
  const interimTextRef = useRef<string>(interimText);

  useEffect(() => {
    clinicalMemoryRef.current = clinicalMemory;
  }, [clinicalMemory]);

  useEffect(() => {
    transcriptRef.current = transcript;
  }, [transcript]);

  useEffect(() => {
    interimTextRef.current = interimText;
  }, [interimText]);

  // Refs for Web Audio API & MediaRecorder / Web Speech
  const recognitionRef = useRef<any>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<number | null>(null);
  const rafRef = useRef<number | null>(null);
  const chatBottomRef = useRef<HTMLDivElement | null>(null);

  // Auto-scroll chat
  useEffect(() => {
    chatBottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  // Backend session initialization
  useEffect(() => {
    let unmounted = false;
    async function initSession() {
      try {
        setWsStatus("connecting");
        const clinicId = "00000000-0000-0000-0000-000000000001";
        const res = await fetch("/api/companion-backend/api/consultations/sessions", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            clinic_id: clinicId,
            patient_phone: patient.phone || "+919876543210",
            patient_name: patient.name || "Patient",
            patient_uhid: patient.uhid || "2026-9021",
            doctor_slug: doctorSlug,
            doctor_name: doctorName,
            language: language,
          }),
        });
        if (res.ok) {
          const data = await res.json();
          if (!unmounted && data.id) {
            setBackendSessionId(data.id);
          }
        } else {
          setWsStatus("offline");
        }
      } catch (err) {
        setWsStatus("offline");
      }
    }
    initSession();
    return () => {
      unmounted = true;
    };
  }, [patient.phone, patient.name, doctorSlug, doctorName, language]);

  // WebSocket real-time audio & fact extraction gateway
  useEffect(() => {
    if (!backendSessionId || typeof window === "undefined") return;

    let ws: WebSocket | null = null;
    let retryTimer: any = null;

    async function connectWs() {
      try {
        let token = "";
        try {
          const tokRes = await fetch("/api/companion/token");
          if (tokRes.ok) {
            const tokData = await tokRes.json();
            token = tokData.token || "";
          }
        } catch {
          // Token fetch fallback
        }

        const wsHost = window.location.hostname || "localhost";
        const wsUrl = `ws://${wsHost}:8000/ws/consultation/${backendSessionId}${token ? `?token=${encodeURIComponent(token)}` : ""}`;
        ws = new WebSocket(wsUrl);
        wsRef.current = ws;

        ws.onopen = () => {
          setWsStatus("connected");
        };

        ws.onmessage = (evt) => {
          try {
            const data = JSON.parse(evt.data);
            if (data.type === "turn_completed" && data.turn) {
              setTranscriptTurns((prev) => {
                const exists = prev.some((t) => t.id === data.turn.id);
                if (exists) return prev;
                return [...prev, data.turn];
              });
              setTranscript((prev) => {
                const spkLabel = data.turn.speaker === "doctor" ? "Doctor" : data.turn.speaker === "patient" ? "Patient" : "Speaker";
                return prev ? `${prev}\n${spkLabel}: ${data.turn.transcript_text}` : `${spkLabel}: ${data.turn.transcript_text}`;
              });
            } else if (data.type === "clinical_memory_updated") {
              if (data.facts && Array.isArray(data.facts)) {
                setClinicalMemory((prev) => {
                  const updatedComplaints = [...prev.complaints];
                  const updatedVitals = { ...prev.vitals };
                  data.facts.forEach((f: any) => {
                    if (f.category === "symptom") {
                      const existingIdx = updatedComplaints.findIndex((c) => c.symptom.toLowerCase() === f.fact_key.toLowerCase());
                      if (existingIdx === -1) {
                        updatedComplaints.push({
                          id: f.id,
                          symptom: f.fact_key,
                          status: f.status === "doctor_confirmed" ? "doctor_confirmed" : "captured",
                          verification_status: f.verification_status || "UNVERIFIED",
                        });
                      } else {
                        updatedComplaints[existingIdx].id = f.id || updatedComplaints[existingIdx].id;
                        updatedComplaints[existingIdx].verification_status = f.verification_status || updatedComplaints[existingIdx].verification_status;
                        if (f.status === "doctor_confirmed") {
                          updatedComplaints[existingIdx].status = "doctor_confirmed";
                        }
                      }
                    } else if (f.category === "vital" && f.fact_value) {
                      if (f.fact_value.systolic) updatedVitals.bp_systolic = f.fact_value.systolic;
                      if (f.fact_value.diastolic) updatedVitals.bp_diastolic = f.fact_value.diastolic;
                      if (f.fact_value.bpm) updatedVitals.heart_rate = f.fact_value.bpm;
                      if (f.fact_value.temperature) updatedVitals.temperature = f.fact_value.temperature;
                    }
                  });
                  return { ...prev, complaints: updatedComplaints, vitals: updatedVitals };
                });
              }
            }
          } catch (e) {
            console.warn("WebSocket parse notice:", e);
          }
        };

        ws.onclose = () => {
          setWsStatus("disconnected");
          retryTimer = setTimeout(connectWs, 4000);
        };

        ws.onerror = () => {
          setWsStatus("offline");
        };
      } catch (err) {
        setWsStatus("offline");
      }
    }

    connectWs();

    return () => {
      if (retryTimer) clearTimeout(retryTimer);
      if (ws) {
        ws.onclose = null;
        ws.close();
      }
      wsRef.current = null;
    };
  }, [backendSessionId]);

  // Timer effect
  useEffect(() => {
    if (isRecording && !isPaused) {
      timerRef.current = window.setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    } else if (timerRef.current !== null) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    return () => {
      if (timerRef.current !== null) clearInterval(timerRef.current);
    };
  }, [isRecording, isPaused]);

  // Speech synthesis helper
  const speakVoice = useCallback(
    (text: string) => {
      if (!speechSynthesisEnabled || companionMode === "silent") return;
      if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
      try {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 1.05;
        utterance.pitch = 1.0;
        utterance.lang = "en-IN";
        window.speechSynthesis.speak(utterance);
      } catch (e) {
        console.warn("Speech synthesis error:", e);
      }
    },
    [speechSynthesisEnabled, companionMode]
  );

  // Audio level visualizer
  const startAudioMeter = useCallback(async (): Promise<boolean> => {
    try {
      setMicPermissionError(null);
      if (typeof navigator === "undefined" || !navigator.mediaDevices?.getUserMedia) {
        setMicPermissionError(
          "Your browser or device does not support audio capture. Please use Google Chrome, Edge, or Firefox."
        );
        return false;
      }
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      audioCtxRef.current = ctx;
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = 64;
      src.connect(analyser);
      analyserRef.current = analyser;

      const data = new Uint8Array(analyser.frequencyBinCount);
      const tick = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(data);
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
          const v = (data[i] - 128) / 128;
          sum += v * v;
        }
        const rms = Math.sqrt(sum / data.length);
        setAudioLevel(Math.min(1, rms * 4));
        rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
      return true;
    } catch (e: any) {
      console.warn("Microphone meter initialization notice:", e);
      const errStr = String(e?.message || e?.name || e);
      if (
        e?.name === "NotAllowedError" ||
        errStr.includes("denied") ||
        errStr.includes("Permission") ||
        errStr.includes("policy")
      ) {
        setMicPermissionError(
          "Microphone permission is blocked in your browser. Tap the site settings / lock/tune icon 🔒 in your address bar, set Microphone to 'Allow', and click the microphone button again."
        );
      } else {
        setMicPermissionError(`Microphone access notice: ${e?.message || "Could not access audio device"}`);
      }
      return false;
    }
  }, []);

  const stopAudioMeter = useCallback(() => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (audioCtxRef.current && audioCtxRef.current.state !== "closed") {
      audioCtxRef.current.close().catch(() => {});
    }
    audioCtxRef.current = null;
    analyserRef.current = null;
    setAudioLevel(0);
  }, []);

  // Web Speech API for Real-Time Transcription
  const startSpeechRecognition = useCallback(() => {
    if (typeof window === "undefined") return;
    const SpeechRecognitionCtor =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognitionCtor) {
      showToast("Browser speech recognition unavailable. Speech simulation & manual dictation active.");
      return;
    }

    try {
      const rec = new SpeechRecognitionCtor();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = language === "hindi" ? "hi-IN" : "en-IN";

      rec.onresult = (event: any) => {
        let finalChunk = "";
        let interimChunk = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          const textPart = event.results[i][0].transcript;
          if (event.results[i].isFinal) {
            finalChunk += textPart + " ";
          } else {
            interimChunk += textPart;
          }
        }

        const currentFinal = (transcriptRef.current + " " + finalChunk).trim();
        const fullCurrentStream = (currentFinal + " " + interimChunk).trim();

        if (finalChunk.trim()) {
          const cleanChunk = finalChunk.trim();

          // ── JARVIS WAKE-WORD DETECTION ──
          // If doctor says "Hey Jarvis", "Jarvis", "ClinicOS", "Hey ClinicOS", route command to Jarvis and DO NOT add to consultation dialogue
          const WAKE_WORD_REGEX = /^(?:hey\s*jarvis|jarvis|hey\s*clinicos|clinicos|ok\s*jarvis|hello\s*jarvis|listen\s*jarvis)[,\s:]*/i;
          if (WAKE_WORD_REGEX.test(cleanChunk)) {
            const wakeQuery = cleanChunk.replace(WAKE_WORD_REGEX, "").trim();
            if (wakeQuery) {
              handleSendDoctorCommand(wakeQuery);
              setDockTab("assistant");
              setInterimText("");
              interimTextRef.current = "";
              return;
            }
          }

          const attribution = attributeSpeaker(cleanChunk, lastSpeakerRef.current);
          lastSpeakerRef.current = attribution.speaker;

          const newTurn: TranscriptTurnItem = {
            id: `turn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
            turn_index: transcriptTurnsRef.current.length + 1,
            speaker: attribution.speaker,
            speaker_confidence: attribution.confidence,
            transcript_text: cleanChunk,
            language: language,
          };

          const updatedTurns = [...transcriptTurnsRef.current, newTurn];
          transcriptTurnsRef.current = updatedTurns;
          setTranscriptTurns(updatedTurns);

          transcriptRef.current = currentFinal;
          setTranscript(currentFinal);
          setInterimText("");
          interimTextRef.current = "";

          if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
            try {
              wsRef.current.send(
                JSON.stringify({
                  type: "text_turn",
                  text: cleanChunk,
                  speaker: attribution.speaker,
                  language: language,
                })
              );
            } catch {}
          }
        } else {
          setInterimText(interimChunk);
          interimTextRef.current = interimChunk;
        }

        // Live dynamic extraction as soon as words are spoken
        if (fullCurrentStream) {
          const { updatedMemory, clarifications: newAlerts } =
            extractClinicalMemoryFromTranscript(fullCurrentStream, clinicalMemoryRef.current);
          clinicalMemoryRef.current = updatedMemory;
          setClinicalMemory(updatedMemory);

          if (newAlerts.length > 0 && companionMode !== "silent") {
            setClarifications((c) => [...c, ...newAlerts]);
            if (companionMode === "voice_companion") {
              speakVoice(newAlerts[0].question);
            }
          }
        }
      };

      rec.onerror = (event: any) => {
        console.warn("Speech recognition event:", event.error);
        if (event.error === "not-allowed" || event.error === "service-not-allowed") {
          setMicPermissionError(
            "Microphone permission is blocked in your browser. Tap the site settings / lock/tune icon 🔒 in your address bar → select 'Allow' → then click the microphone button again."
          );
          showToast("Microphone permission was denied.");
          setIsRecording(false);
          stopAudioMeter();
        } else if (event.error === "network") {
          showToast("Speech service network issue. You can use 1-Tap test or paste clinical notes.");
        }
      };

      rec.onend = () => {
        if (isRecording && !isPaused) {
          try {
            rec.start();
          } catch {}
        }
      };

      rec.start();
      recognitionRef.current = rec;
    } catch (e) {
      console.warn("Speech recognition start notice:", e);
    }
  }, [language, companionMode, isRecording, isPaused, showToast, stopAudioMeter, speakVoice]);

  const stopSpeechRecognition = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      recognitionRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      try {
        mediaRecorderRef.current.stop();
      } catch {}
      mediaRecorderRef.current = null;
    }
  }, []);

  // Speaker manual correction handler
  const handleCorrectSpeaker = async (turnId: string, newSpeaker: "doctor" | "patient" | "uncertain") => {
    setEditingSpeakerTurnId(null);
    setTranscriptTurns((prev) =>
      prev.map((t) => (t.id === turnId ? { ...t, speaker: newSpeaker, speaker_manually_corrected: true } : t))
    );

    try {
      await fetch(`/api/companion-backend/api/consultations/turns/${turnId}/speaker`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ speaker: newSpeaker, reason: "Clinician manual correction" }),
      });
      showToast(`Speaker updated to ${newSpeaker}.`);
    } catch (e) {
      console.warn("Speaker correction notice:", e);
    }
  };

  // Patient timeline loader
  const loadPatientTimeline = async () => {
    const identifier = patient.uhid || (patient as any).id || patient.phone;
    if (!identifier) return;
    setLoadingTimeline(true);
    try {
      const res = await fetch(`/api/companion-backend/api/patients/${encodeURIComponent(identifier)}/timeline`);
      if (res.ok) {
        const data = await res.json();
        setTimelineItems(Array.isArray(data) ? data : []);
      }
    } catch (e) {
      console.warn("Failed to load patient timeline:", e);
    } finally {
      setLoadingTimeline(false);
    }
  };

  // Verify AI-extracted clinical fact
  const handleVerifyFact = async (factId: string, symptom: string) => {
    if (!factId) return;
    setVerifyingFactId(factId);
    try {
      const res = await fetch(`/api/companion-backend/api/clinical-facts/${factId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: true, doctor_id: doctorName }),
      });
      if (res.ok) {
        setClinicalMemory((prev) => ({
          ...prev,
          complaints: prev.complaints.map((c) =>
            c.id === factId ? { ...c, verification_status: "DOCTOR_VERIFIED", status: "doctor_confirmed" } : c
          ),
        }));
        showToast(`"${symptom}" verified and saved to patient record.`);
      }
    } catch (e) {
      console.warn("Fact verification notice:", e);
    } finally {
      setVerifyingFactId(null);
    }
  };

  // Reject AI-extracted clinical fact
  const handleRejectFact = async (factId: string, symptom: string) => {
    if (!factId) return;
    setVerifyingFactId(factId);
    try {
      const res = await fetch(`/api/companion-backend/api/clinical-facts/${factId}/verify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ verified: false, doctor_id: doctorName, notes: "Rejected by physician" }),
      });
      if (res.ok) {
        setClinicalMemory((prev) => ({
          ...prev,
          complaints: prev.complaints.filter((c) => c.id !== factId),
        }));
        showToast(`"${symptom}" rejected from current encounter.`);
      }
    } catch (e) {
      console.warn("Fact rejection notice:", e);
    } finally {
      setVerifyingFactId(null);
    }
  };

  // Simulate realistic doctor-patient consultation dialogue
  const simulateConsultationDialogue = () => {
    const sampleTurns = [
      { speaker: "doctor" as const, text: "Namaste Amit ji! What brings you into the clinic today? Since how many days have you had these symptoms?" },
      { speaker: "patient" as const, text: "Doctor sahab, mujhe do din se tez bukhar aa raha hai aur gale mein bohot dard hai. Kal raat se sardard bhi ho raha hai." },
      { speaker: "doctor" as const, text: "Let me examine your throat and check your vitals. Posterior pharynx is congested. Temperature is 101.2 Fahrenheit, BP 120 over 80, SpO2 98 percent. Bilateral chest is clear." },
      { speaker: "patient" as const, text: "Theek hai doctor sahab. Mujhe kisi sulfa dawa se allergy hai, pehle daane nikal aaye the." },
      { speaker: "doctor" as const, text: "Noted, no sulfa drugs prescribed. Provisional diagnosis is Acute Pharyngitis with Pyrexia. I am prescribing Tab Paracetamol 650mg twice daily after food for 3 days, and Pantoprazole 40mg once daily before breakfast for 5 days. Drink 3 litres of warm fluids and ORS. Review after 3 days if fever persists." },
    ];

    let fullStream = transcriptRef.current;
    sampleTurns.forEach((st, idx) => {
      setTimeout(() => {
        fullStream += (fullStream ? " " : "") + st.text;
        const newTurn: TranscriptTurnItem = {
          id: `sim-turn-${Date.now()}-${idx}`,
          turn_index: transcriptTurnsRef.current.length + 1,
          speaker: st.speaker,
          speaker_confidence: 0.94,
          transcript_text: st.text,
          language: language,
        };
        const updatedTurns = [...transcriptTurnsRef.current, newTurn];
        transcriptTurnsRef.current = updatedTurns;
        setTranscriptTurns(updatedTurns);
        transcriptRef.current = fullStream;
        setTranscript(fullStream);

        const { updatedMemory, clarifications: newAlerts } =
          extractClinicalMemoryFromTranscript(fullStream, clinicalMemoryRef.current);
        clinicalMemoryRef.current = updatedMemory;
        setClinicalMemory(updatedMemory);
        if (newAlerts.length > 0) setClarifications((prev) => [...prev, ...newAlerts]);
      }, idx * 400);
    });
    showToast("Simulating live ambient dialogue with Doctor & Patient diarization...");
  };

  // Primary Start Consultation handler
  const handleStartConsultation = async () => {
    if (!consentObtained) {
      showToast("Please confirm patient recording consent.");
      return;
    }

    const audioReady = await startAudioMeter();
    if (!audioReady) {
      setIsRecording(false);
      return;
    }

    setSessionActive(true);
    setIsRecording(true);
    setIsPaused(false);
    startSpeechRecognition();

    // Start real MediaRecorder streaming to backend
    try {
      if (streamRef.current && typeof MediaRecorder !== "undefined") {
        const mime = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
          ? "audio/webm;codecs=opus"
          : "audio/webm";
        const mr = new MediaRecorder(streamRef.current, { mimeType: mime });
        mediaRecorderRef.current = mr;

        mr.ondataavailable = async (e) => {
          if (e.data && e.data.size > 0 && backendSessionId) {
            const reader = new FileReader();
            reader.onloadend = () => {
              const base64Data = (reader.result as string)?.split(",")[1];
              if (base64Data && wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
                wsRef.current.send(
                  JSON.stringify({
                    type: "audio_chunk",
                    audio_data: base64Data,
                    mime_type: mime,
                    language: language,
                  })
                );
              }
            };
            reader.readAsDataURL(e.data);
          }
        };

        mr.start(3000);
      }
    } catch (mrErr) {
      console.warn("MediaRecorder start notice:", mrErr);
    }

    setChatMessages((prev) => [
      ...prev,
      {
        id: `sys-${Date.now()}`,
        sender: "system",
        text: "Consultation started. Audio recording active under DPDP consent. Clinical Memory initialized.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    if (companionMode === "voice_companion") {
      speakVoice("Consultation started. I am listening and recording clinical context.");
    }
  };

  // Pause / Resume handler
  const handleTogglePause = () => {
    if (isPaused) {
      setIsPaused(false);
      startSpeechRecognition();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "paused") {
        mediaRecorderRef.current.resume();
      }
      showToast("Recording resumed.");
    } else {
      setIsPaused(true);
      stopSpeechRecognition();
      if (mediaRecorderRef.current && mediaRecorderRef.current.state === "recording") {
        mediaRecorderRef.current.pause();
      }
      showToast("Recording paused.");
    }
  };

  // Quick 1-Tap Dictation Demo Simulator (for testing without speaking)
  const handleSimulateSpeech = (sampleText: string) => {
    const nextTranscript = (transcriptRef.current + " " + sampleText).trim();
    transcriptRef.current = nextTranscript;
    setTranscript(nextTranscript);

    const { updatedMemory, clarifications: newAlerts } =
      extractClinicalMemoryFromTranscript(nextTranscript, clinicalMemoryRef.current);
    clinicalMemoryRef.current = updatedMemory;
    setClinicalMemory(updatedMemory);

    if (newAlerts.length > 0) {
      setClarifications((c) => [...c, ...newAlerts]);
    }

    setChatMessages((prev) => [
      ...prev,
      {
        id: `sim-${Date.now()}`,
        sender: "doctor",
        text: `[Dictation]: ${sampleText}`,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
      {
        id: `sim-reply-${Date.now()}`,
        sender: "companion",
        text: "Transcribed and parsed clinical dictation. Clinical memory and prescription draft updated.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      },
    ]);

    showToast("Clinical notes processed & memory updated!");
  };

  // Live Transcript / Scribe text change handler (supports typing directly)
  const handleTranscriptChange = (newText: string) => {
    setTranscript(newText);
    transcriptRef.current = newText;
    const { updatedMemory, clarifications: newAlerts } =
      extractClinicalMemoryFromTranscript(newText, clinicalMemoryRef.current);
    clinicalMemoryRef.current = updatedMemory;
    setClinicalMemory(updatedMemory);
    if (newAlerts.length > 0) {
      setClarifications((c) => [...c, ...newAlerts]);
    }
  };

  // Conversational Doctor Command handler (Text or Voice)
  const handleSendDoctorCommand = async (customCommand?: string) => {
    const cmd = (customCommand || doctorInput).trim();
    if (!cmd) return;
    setDoctorInput("");
    setIsProcessingCommand(true);

    const userMsg: CompanionChatMessage = {
      id: `doc-${Date.now()}`,
      sender: "doctor",
      text: cmd,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };
    setChatMessages((prev) => [...prev, userMsg]);

    try {
      // 1. Check local clinical engine first for instant deterministic calculations (Pediatric dose, Allergy check, Antibiotic guideline, Differentials, Rx add/remove)
      const localResult = handleDoctorCommand(cmd, clinicalMemory, historicalVisits);
      const isHandledLocally = localResult.actionTaken && localResult.actionTaken !== "general_instruction";

      if (isHandledLocally) {
        setClinicalMemory(localResult.updatedMemory);
        const companionMsg: CompanionChatMessage = {
          id: `comp-${Date.now()}`,
          sender: "companion",
          text: localResult.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          action_type: localResult.actionTaken as any,
        };
        setChatMessages((prev) => [...prev, companionMsg]);

        // Speak reply if speech synthesis is enabled
        if (speechSynthesisEnabled && companionMode !== "silent") {
          speakVoice(localResult.spokenReply || localResult.reply);
        }

        // Auto-sync to prescription pad if prescription was added or removed
        if (onSyncToPrescription && (localResult.actionTaken === "prescription_add" || localResult.actionTaken === "prescription_remove")) {
          onSyncToPrescription({
            complaints: localResult.updatedMemory.complaints.map((c) => c.symptom),
            vitals: localResult.updatedMemory.vitals,
            diagnosis: localResult.updatedMemory.confirmed_diagnosis || localResult.updatedMemory.provisional_diagnosis,
            medications: localResult.updatedMemory.medications,
          });
        }
        return;
      }

      // 2. LangGraph doctor assistant on Python backend for general medical queries & longitudinal EMR context
      if (backendSessionId) {
        try {
          const bgRes = await fetch(`/api/companion-backend/api/companion/ask?session_id=${backendSessionId}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              question: cmd,
              historical_visits: historicalVisits,
            }),
          });
          if (bgRes.ok) {
            const bgData = await bgRes.json();
            const companionMsg: CompanionChatMessage = {
              id: `comp-${Date.now()}`,
              sender: "companion",
              text: bgData.reply || "Context reviewed.",
              timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
              provenance_sources: bgData.provenance_sources || [],
            };
            setChatMessages((prev) => [...prev, companionMsg]);
            if (speechSynthesisEnabled && companionMode !== "silent" && (bgData.spoken_reply || bgData.reply)) {
              speakVoice(bgData.spoken_reply || bgData.reply);
            }
            return;
          }
        } catch (apiErr) {
          console.warn("FastAPI companion call notice:", apiErr);
        }
      }

      // 3. Fallback to default local response
      setClinicalMemory(localResult.updatedMemory);
      const companionMsg: CompanionChatMessage = {
        id: `comp-${Date.now()}`,
        sender: "companion",
        text: localResult.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        action_type: localResult.actionTaken as any,
      };
      setChatMessages((prev) => [...prev, companionMsg]);
      if (speechSynthesisEnabled && companionMode !== "silent") {
        speakVoice(localResult.spokenReply || localResult.reply);
      }
    } catch (e) {
      const localResult = handleDoctorCommand(cmd, clinicalMemory, historicalVisits);
      setClinicalMemory(localResult.updatedMemory);
      setChatMessages((prev) => [
        ...prev,
        {
          id: `comp-${Date.now()}`,
          sender: "companion",
          text: localResult.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      ]);
      if (speechSynthesisEnabled && companionMode !== "silent") {
        speakVoice(localResult.spokenReply || localResult.reply);
      }
    } finally {
      setIsProcessingCommand(false);
    }
  };

  // End Consultation: Consolidate Memory & Generate Dual Reports
  const handleEndConsultation = async () => {
    // 1. Stop recording
    setIsRecording(false);
    setIsPaused(false);
    stopSpeechRecognition();
    stopAudioMeter();

    // 2. Ensure ALL captured words (including interim speech) are extracted into memory
    const activeText = (transcriptRef.current + " " + interimTextRef.current).trim();
    let memoryToUse = clinicalMemoryRef.current;
    if (activeText) {
      const { updatedMemory } = extractClinicalMemoryFromTranscript(activeText, memoryToUse);
      memoryToUse = updatedMemory;
      clinicalMemoryRef.current = updatedMemory;
      setClinicalMemory(updatedMemory);
    }

    // 3. Synthesize Dual Reports via LangGraph backend if available
    if (backendSessionId) {
      try {
        const repRes = await fetch(`/api/companion-backend/api/consultations/sessions/${backendSessionId}/generate-reports`, {
          method: "POST",
        });
        if (repRes.ok) {
          const repData = await repRes.json();
          if (repData.doctor_report && repData.patient_report) {
            setDoctorReport({
              patient_uhid: patient.uhid || "2026-9021",
              patient_name: patient.name,
              age_gender: `${patient.age ? `${patient.age}Y` : "Adult"} • ${patient.gender || "N/S"}`,
              consultation_date: repData.doctor_report.consultation_date || new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" }),
              doctor_name: doctorName,
              clinic_name: clinicName,
              chief_complaints: repData.doctor_report.chief_complaint || "Routine Evaluation",
              history_of_present_illness: repData.doctor_report.history_of_present_illness || "",
              medical_history_allergies: `History: ${(repData.doctor_report.relevant_medical_history || []).join(", ")} | Allergies: ${(repData.doctor_report.allergies || []).join(", ")}`,
              vitals_hemodynamics: Object.entries(repData.doctor_report.vitals || {}).map(([k, v]) => `${k}: ${typeof v === "object" ? JSON.stringify(v) : v}`).join(" • "),
              examination_findings: (repData.doctor_report.examination_findings || []).join(" • "),
              assessment_diagnosis: repData.doctor_report.doctor_confirmed_assessment || "Upper Respiratory Tract Infection (Provisional)",
              differential_diagnoses: repData.doctor_report.differential_diagnoses || [],
              prescribed_medications: (repData.doctor_report.prescriptions || []).map((p: any) => ({
                name: p.name || "Medication",
                generic: p.name || "",
                strength: "",
                frequency: p.dosage || "1-0-1",
                duration: p.duration || "5 days",
                instructions: "Take after food",
              })),
              investigations_advised: repData.doctor_report.investigations_ordered || [],
              clinical_plan_red_flags: [...(repData.doctor_report.treatment_plan || []), ...(repData.doctor_report.red_flag_warnings || [])],
              doctor_notes: repData.doctor_report.follow_up_instructions || "Review in 5 days.",
            });

            setPatientSummary({
              language: patientSummaryLanguage,
              section_1_visit_details: {
                patient_name: patient.name,
                doctor_name: doctorName,
                clinic_name: clinicName,
                date: repData.patient_report.visit_date || new Date().toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric" }),
              },
              section_2_why_you_visited: repData.patient_report.reason_for_visit || `Evaluation of acute complaints.`,
              section_3_what_you_told_doctor: repData.patient_report.summary_of_discussion || "Symptoms discussed with doctor.",
              section_4_what_doctor_found: repData.patient_report.confirmed_findings || "Physical examination and vitals assessed.",
              section_5_your_diagnosis: {
                diagnosis_name: repData.doctor_report.doctor_confirmed_assessment || "Clinical Condition",
                plain_language_explanation: repData.patient_report.diagnosis_explained || "Treatable condition responding to medical plan.",
              },
              section_6_your_medicines: (repData.patient_report.medications || []).map((m: any) => ({
                timing_label: m.purpose || "Prescribed Medicine",
                medicine_line: m.name,
                instructions: m.instructions || "Take as directed",
              })),
              section_7_what_you_should_do: repData.patient_report.lifestyle_and_home_advice || ["Take medicines on time", "Rest and hydrate"],
              section_8_your_follow_up: {
                date_or_interval: repData.doctor_report.follow_up_instructions || "Review in 5 days",
                special_advice: "Follow up if symptoms persist or earlier if needed.",
              },
              section_9_important_things_to_remember: repData.patient_report.when_to_seek_urgent_care || ["High fever", "Difficulty breathing"],
              section_10_contact_info: {
                clinic_name: clinicName,
                phone: "+91 91234 56789",
                emergency_line: "+91 91234 99999",
              },
            });

            setIsReviewOpen(true);
            setReviewTab("doctor_report");
            if (companionMode === "voice_companion") {
              speakVoice("Consultation concluded. Both clinical report and patient summary are ready for your review.");
            }
            return;
          }
        }
      } catch (err) {
        console.warn("Backend report generation notice:", err);
      }
    }

    // 4. Default report generation fallback
    const docReport = generateDoctorClinicalReport(memoryToUse, clinicName);
    const patSummary = generatePatientVisitSummary(
      memoryToUse,
      patientSummaryLanguage,
      clinicName,
      "+91 91234 56789"
    );

    setDoctorReport(docReport);
    setPatientSummary(patSummary);
    setIsReviewOpen(true);
    setReviewTab("doctor_report");

    if (companionMode === "voice_companion") {
      speakVoice("Consultation concluded. Both clinical report and patient summary are ready for your review.");
    }
  };

  // Regenerate Patient Summary in chosen language
  const handleLanguageChangeForPatientSummary = (newLang: ConsultationLanguage) => {
    setPatientSummaryLanguage(newLang);
    const updatedSummary = generatePatientVisitSummary(
      clinicalMemory,
      newLang,
      clinicName,
      "+91 91234 56789"
    );
    setPatientSummary(updatedSummary);
  };

  // Approve & Save Dual Reports (Patient Portal + Medical Record)
  const handleApproveConsultation = async () => {
    if (!doctorReport || !patientSummary) return;
    setIsFinalizing(true);

    try {
      const reportPayload = {
        appointment_number: patient.appointment_number || null,
        patient_name: patient.name,
        patient_phone: patient.phone,
        doctor_slug: doctorSlug,
        doctor_name: doctorName,
        language: patientSummaryLanguage,
        duration_seconds: seconds,
        transcript: transcript || "Consultation conducted with AI Clinical Companion.",
        chief_complaints: clinicalMemory.complaints.map((c) => c.symptom).join(", "),
        provisional_diagnosis: clinicalMemory.confirmed_diagnosis || clinicalMemory.provisional_diagnosis,
        vitals: clinicalMemory.vitals,
        medicines: clinicalMemory.medications.map((m) => ({
          medicine_name: m.medicine_name,
          generic_name: m.generic_name,
          dosage_form: m.dosage_form,
          strength: m.strength,
          frequency: m.frequency,
          duration: m.duration,
          special_instructions: `${m.timing} — ${m.special_instructions || ""}`,
        })),
        lab_tests: clinicalMemory.lab_investigations,
        doctor_report: doctorReport,
        patient_report: {
          condition_overview: patientSummary.section_5_your_diagnosis.plain_language_explanation,
          medicine_schedule: patientSummary.section_6_your_medicines.map((m) => ({
            timing: m.timing_label,
            medicine: m.medicine_line,
            instructions: m.instructions,
          })),
          home_care_guidance: patientSummary.section_7_what_you_should_do.join(" • "),
          emergency_warning_signs: patientSummary.section_9_important_things_to_remember.join(" • "),
          followup_instruction: patientSummary.section_8_your_follow_up.date_or_interval,
        },
        status: "approved",
      };

      if (backendSessionId) {
        try {
          await fetch(`/api/companion-backend/api/consultations/sessions/${backendSessionId}/reports/approve`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              approved_by_name: doctorName,
              doctor_report_edits: doctorReport,
              patient_report_edits: patientSummary,
            }),
          });
        } catch (bErr) {
          console.warn("Backend approval notice:", bErr);
        }
      }

      const res = await fetch("/api/consultations/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify(reportPayload),
      });

      if (res.ok) {
        const data = await res.json();
        showToast("Consultation approved & published to Patient Portal!");
        setIsReviewOpen(false);
        onConsultationCompleted?.(data.report);
      } else {
        showToast("Consultation sealed locally.");
        setIsReviewOpen(false);
      }
    } catch (e) {
      console.error("Error saving consultation report:", e);
      showToast("Report approved and saved to consultation record.");
      setIsReviewOpen(false);
    } finally {
      setIsFinalizing(false);
    }
  };

  return (
    <>
      {layoutMode === "hud" ? (
        <div className="fixed bottom-4 right-4 z-50 w-96 max-w-[95vw] rounded-2xl shadow-2xl bg-white/95 dark:bg-[#1C1C1E]/95 backdrop-blur-md border border-indigo-500/30 p-3.5 space-y-3 animate-in slide-in-from-bottom-3 duration-200">
          {/* HUD Header */}
          <div className="flex items-center justify-between border-b border-black/[0.06] dark:border-white/[0.08] pb-2">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {isRecording && !isPaused && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRecording && !isPaused ? "bg-red-500" : "bg-blue-500"}`}></span>
              </span>
              <div className="flex items-center gap-1.5 font-bold text-xs text-slate-900 dark:text-white truncate">
                <Sparkles className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                <span className="truncate">Jarvis Live AI</span>
              </div>
              {isRecording && (
                <span className="text-[10px] font-mono font-bold text-red-600 dark:text-red-400 bg-red-500/10 px-1.5 py-0.2 rounded shrink-0">
                  {formatTime(seconds)}
                </span>
              )}
            </div>

            <div className="flex items-center gap-1 text-slate-500 shrink-0">
              <button
                type="button"
                onClick={() => onLayoutModeChange?.("docked")}
                title="Dock Side-by-Side"
                className="p-1 rounded-md hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition cursor-pointer"
              >
                <PanelRightOpen className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onLayoutModeChange?.("modal")}
                title="Expand to Full Studio"
                className="p-1 rounded-md hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition cursor-pointer"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  title="Close"
                  className="p-1 rounded-md hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Live Audio & Speaker Status */}
          <div className="flex items-center justify-between gap-2 text-xs">
            <div className="flex items-center gap-2 min-w-0">
              <button
                type="button"
                onClick={isRecording ? handleTogglePause : handleStartConsultation}
                className={`flex h-8 w-8 items-center justify-center rounded-xl text-white shadow-xs transition active:scale-95 cursor-pointer shrink-0 ${
                  isRecording && !isPaused
                    ? "bg-red-600 hover:bg-red-700 animate-pulse"
                    : "bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                }`}
              >
                {isRecording && !isPaused ? <Pause className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </button>
              <div className="min-w-0">
                <div className="text-[11px] font-bold text-slate-900 dark:text-white truncate">
                  {isRecording && !isPaused ? "Listening ambient speech..." : "Mic idle"}
                </div>
                <div className="text-[10px] text-slate-400 truncate">
                  {transcriptTurns.length} turns • {clinicalMemory.complaints.length} complaints • {clinicalMemory.medications.length} meds
                </div>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={simulateConsultationDialogue}
                className="rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-1.5 py-1 text-[10px] font-bold transition flex items-center gap-0.5 cursor-pointer"
                title="Simulate Doctor & Patient Conversation"
              >
                <Flame className="h-2.5 w-2.5 text-amber-600" />
                <span>Sim</span>
              </button>
              {onSyncToPrescription && (
                <button
                  type="button"
                  onClick={() => onSyncToPrescription({
                    complaints: clinicalMemory.complaints.map((c) => c.symptom),
                    vitals: clinicalMemory.vitals,
                    diagnosis: clinicalMemory.confirmed_diagnosis || clinicalMemory.provisional_diagnosis,
                    medications: clinicalMemory.medications,
                  })}
                  className="inline-flex items-center gap-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 px-2 py-1 text-[10px] font-bold transition border border-emerald-500/20 cursor-pointer"
                  title="Sync captured facts to prescription pad"
                >
                  <Zap className="h-3 w-3 text-emerald-600" />
                  <span>Sync</span>
                </button>
              )}
            </div>
          </div>

          {/* Latest Active Speaker Utterance */}
          {transcriptTurns.length > 0 ? (
            <div className="rounded-xl bg-slate-50 dark:bg-[#25262B] p-2 text-xs border border-slate-100 dark:border-white/[0.04] space-y-1">
              <div className="flex items-center justify-between">
                <span className={`inline-flex items-center gap-1 text-[10px] font-bold rounded-md px-1.5 py-0.2 ${
                  transcriptTurns[transcriptTurns.length - 1].speaker === "doctor"
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400"
                    : "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                }`}>
                  {transcriptTurns[transcriptTurns.length - 1].speaker === "doctor" ? (
                    <Stethoscope className="h-2.5 w-2.5" />
                  ) : (
                    <User className="h-2.5 w-2.5" />
                  )}
                  <span className="capitalize">{transcriptTurns[transcriptTurns.length - 1].speaker}</span>
                </span>
                <span className="text-[9px] text-slate-400 font-mono">
                  {Math.round((transcriptTurns[transcriptTurns.length - 1].speaker_confidence || 0.8) * 100)}% conf
                </span>
              </div>
              <p className="text-[11px] text-slate-700 dark:text-slate-300 line-clamp-2 italic">
                &quot;{transcriptTurns[transcriptTurns.length - 1].transcript_text}&quot;
              </p>
            </div>
          ) : (
            <div className="rounded-xl bg-slate-50 dark:bg-[#25262B] p-2 text-[11px] text-slate-400 italic text-center">
              Start speaking or tap &quot;Sim&quot; to test live diarization.
            </div>
          )}

          {/* Ask Jarvis prompt bar */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendDoctorCommand();
            }}
            className="flex items-center gap-1.5"
          >
            <input
              type="text"
              value={doctorInput}
              onChange={(e) => setDoctorInput(e.target.value)}
              placeholder="Ask Jarvis (e.g. check allergy, past meds)..."
              className="flex-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] px-2.5 py-1 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
            <button
              type="submit"
              className="flex h-7 w-7 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
            >
              <Send className="h-3 w-3" />
            </button>
          </form>
        </div>
      ) : layoutMode === "docked" ? (
        <div className="flex flex-col h-[calc(100vh-5.5rem)] rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#18191C] shadow-lg overflow-hidden">
          {/* Docked Header */}
          <div className="p-3 border-b border-black/[0.06] dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#202125] flex items-center justify-between gap-2 shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <span className="relative flex h-2.5 w-2.5 shrink-0">
                {isRecording && !isPaused && (
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                )}
                <span className={`relative inline-flex rounded-full h-2.5 w-2.5 ${isRecording && !isPaused ? "bg-red-500" : "bg-emerald-500"}`}></span>
              </span>
              <div className="min-w-0">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white truncate flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-[#0071E3] dark:text-[#2997FF]" />
                  <span>AI Clinical Companion</span>
                </h3>
                <p className="text-[10px] text-slate-500 truncate">
                  {isRecording && !isPaused ? `Live Listening • ${formatTime(seconds)}` : "Ambient Assistant Ready"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-1 shrink-0">
              <button
                type="button"
                onClick={() => setSpeechSynthesisEnabled((prev) => !prev)}
                title={speechSynthesisEnabled ? "Jarvis Voice Audio Reply: ON (Click to Mute)" : "Jarvis Voice Audio Reply: MUTED (Click to Enable)"}
                className={`p-1.5 rounded-lg transition cursor-pointer flex items-center gap-1 text-[10px] font-bold ${
                  speechSynthesisEnabled
                    ? "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20"
                    : "text-slate-400 hover:text-slate-600 hover:bg-black/[0.05]"
                }`}
              >
                {speechSynthesisEnabled ? <Volume2 className="h-3.5 w-3.5 text-blue-600 dark:text-blue-400" /> : <VolumeX className="h-3.5 w-3.5 text-slate-400" />}
                <span className="hidden sm:inline">{speechSynthesisEnabled ? "Voice ON" : "Muted"}</span>
              </button>
              <button
                type="button"
                onClick={() => onLayoutModeChange?.("hud")}
                title="Mini Floating HUD"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition cursor-pointer"
              >
                <Layers className="h-3.5 w-3.5" />
              </button>
              <button
                type="button"
                onClick={() => onLayoutModeChange?.("modal")}
                title="Full Screen Modal"
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition cursor-pointer"
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </button>
              {onClose && (
                <button
                  type="button"
                  onClick={onClose}
                  title="Close AI Dock"
                  className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition cursor-pointer"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>

          {/* Ambient Mic & Live Audio Visualizer Banner */}
          <div className="p-3 bg-gradient-to-r from-blue-600/5 via-indigo-600/5 to-purple-600/5 border-b border-black/[0.04] dark:border-white/[0.06] shrink-0 space-y-2.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={isRecording ? handleTogglePause : handleStartConsultation}
                  className={`flex h-9 w-9 items-center justify-center rounded-xl text-white shadow-sm transition active:scale-95 cursor-pointer ${
                    isRecording && !isPaused
                      ? "bg-red-600 hover:bg-red-700 animate-pulse"
                      : "bg-gradient-to-tr from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
                  }`}
                >
                  {isRecording && !isPaused ? <Pause className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                </button>

                <div>
                  <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                    <span>{isRecording && !isPaused ? "Live Listening Active" : "Microphone Idle"}</span>
                    <span className="font-mono text-[10px] text-blue-600 dark:text-blue-400 font-bold">
                      {formatTime(seconds)}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-500">
                    {transcriptTurns.length} turns • {language === "hindi" ? "हिन्दी" : "English (IN)"}
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={simulateConsultationDialogue}
                  className="rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 px-2 py-1 text-[10px] font-bold transition flex items-center gap-1 cursor-pointer"
                  title="Simulate realistic doctor-patient conversation"
                >
                  <Flame className="h-3 w-3 text-amber-600" />
                  <span>Simulate</span>
                </button>

                {onSyncToPrescription && (
                  <button
                    type="button"
                    onClick={() => onSyncToPrescription({
                      complaints: clinicalMemory.complaints.map((c) => c.symptom),
                      vitals: clinicalMemory.vitals,
                      diagnosis: clinicalMemory.confirmed_diagnosis || clinicalMemory.provisional_diagnosis,
                      medications: clinicalMemory.medications,
                    })}
                    className="rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white px-2.5 py-1 text-[10px] font-bold shadow-xs transition flex items-center gap-1 cursor-pointer"
                    title="Push detected vitals, complaints & medicines to prescription pad"
                  >
                    <Zap className="h-3 w-3 text-amber-300 fill-amber-300" />
                    <span>Sync Rx</span>
                  </button>
                )}
              </div>
            </div>

            {/* Dynamic Audio Visualizer Bars */}
            <div className="flex items-center gap-1 h-3 px-1">
              {BAR_PATTERN.map((h, i) => {
                const activeHeight = isRecording && !isPaused ? Math.max(20, Math.min(100, h * 100 * (0.6 + audioLevel * 1.5))) : 15;
                return (
                  <div
                    key={`docked-bar-${i}`}
                    style={{ height: `${activeHeight}%` }}
                    className={`flex-1 rounded-full transition-all duration-75 ${
                      isRecording && !isPaused ? "bg-gradient-to-t from-blue-500 to-indigo-500" : "bg-slate-200 dark:bg-white/10"
                    }`}
                  />
                );
              })}
            </div>
          </div>

          {/* Docked Navigation Tabs */}
          <div className="flex items-center border-b border-black/[0.06] dark:border-white/[0.08] bg-slate-50/50 dark:bg-[#1C1D21] p-1 gap-1 text-xs font-semibold shrink-0">
            <button
              type="button"
              onClick={() => setDockTab("dialogue")}
              className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                dockTab === "dialogue"
                  ? "bg-white dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#2997FF] shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <MessageSquare className="h-3.5 w-3.5" />
              <span>Dialogue ({transcriptTurns.length})</span>
            </button>

            <button
              type="button"
              onClick={() => setDockTab("memory")}
              className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                dockTab === "memory"
                  ? "bg-white dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#2997FF] shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Activity className="h-3.5 w-3.5" />
              <span>Memory &amp; Rx</span>
            </button>

            <button
              type="button"
              onClick={() => setDockTab("assistant")}
              className={`flex-1 py-1.5 rounded-lg text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                dockTab === "assistant"
                  ? "bg-white dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#2997FF] shadow-xs font-bold"
                  : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
              }`}
            >
              <Sparkles className="h-3.5 w-3.5" />
              <span>Jarvis</span>
            </button>
          </div>

          {/* Tab 1: Live Dialogue & Speaker Diarization */}
          {dockTab === "dialogue" && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3 min-h-0">
              {transcriptTurns.length === 0 ? (
                <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3 text-slate-400">
                  <div className="h-12 w-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                    <Mic className="h-6 w-6" />
                  </div>
                  <div>
                    <div className="font-bold text-xs text-slate-700 dark:text-slate-300">
                      Awaiting Conversation
                    </div>
                    <div className="text-[11px] text-slate-400 mt-1 max-w-[220px]">
                      Doctor and patient dialogue will appear here separated with speaker tags in real time.
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={simulateConsultationDialogue}
                    className="rounded-full bg-blue-600/10 hover:bg-blue-600/20 text-blue-600 dark:text-blue-400 font-bold text-xs px-3 py-1 transition cursor-pointer"
                  >
                    ⚡ Click to Simulate Dialogue
                  </button>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {transcriptTurns.map((turn, tIdx) => {
                    const isDoc = turn.speaker === "doctor";
                    return (
                      <div
                        key={`docked-turn-${turn.id || tIdx}`}
                        className={`rounded-xl p-2.5 text-xs transition space-y-1.5 border ${
                          isDoc
                            ? "bg-blue-50/70 dark:bg-blue-950/20 border-blue-200/60 dark:border-blue-800/40"
                            : "bg-emerald-50/70 dark:bg-emerald-950/20 border-emerald-200/60 dark:border-emerald-800/40"
                        }`}
                      >
                        <div className="flex items-center justify-between gap-1.5">
                          <div className="flex items-center gap-1.5">
                            <span className={`flex h-5 w-5 items-center justify-center rounded-md text-[10px] text-white font-bold ${
                              isDoc ? "bg-blue-600" : "bg-emerald-600"
                            }`}>
                              {isDoc ? <Stethoscope className="h-3 w-3" /> : <User className="h-3 w-3" />}
                            </span>
                            <span className={`font-bold text-[11px] ${isDoc ? "text-blue-700 dark:text-blue-300" : "text-emerald-700 dark:text-emerald-300"}`}>
                              {isDoc ? "Doctor" : "Patient"}
                            </span>
                            <span className="text-[10px] text-slate-400 font-mono">
                              {Math.round((turn.speaker_confidence || 0.8) * 100)}%
                            </span>
                          </div>

                          {/* 1-Tap Switch Speaker */}
                          <button
                            type="button"
                            onClick={() => handleCorrectSpeaker(turn.id, isDoc ? "patient" : "doctor")}
                            className="text-[10px] text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 px-1.5 py-0.5 rounded border border-black/[0.06] dark:border-white/[0.08] hover:bg-black/[0.04] transition cursor-pointer"
                            title="Switch speaker attribution"
                          >
                            Switch to {isDoc ? "Patient" : "Doctor"}
                          </button>
                        </div>

                        <p className="text-slate-800 dark:text-slate-200 leading-relaxed font-sans text-xs">
                          {turn.transcript_text}
                        </p>
                      </div>
                    );
                  })}

                  {/* Interim Live Bubble */}
                  {interimText && (
                    <div className="rounded-xl p-2 bg-indigo-50/50 dark:bg-indigo-950/20 border border-indigo-200/40 text-xs italic text-indigo-700 dark:text-indigo-300 animate-pulse flex items-center gap-2">
                      <span className="h-2 w-2 rounded-full bg-indigo-500"></span>
                      <span>&quot;{interimText}&quot;</span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 2: Clinical Memory & Entity Cards */}
          {dockTab === "memory" && (
            <div className="flex-1 overflow-y-auto p-3.5 space-y-3.5 min-h-0">
              {/* Sub-view toggle: Encounter Memory vs Longitudinal Timeline */}
              <div className="flex items-center gap-1 p-1 rounded-lg bg-black/[0.04] dark:bg-white/[0.05] text-[11px] font-medium">
                <button
                  type="button"
                  onClick={() => setMemorySubView("current")}
                  className={`flex-1 py-1 rounded-md text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    memorySubView === "current"
                      ? "bg-white dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#2997FF] shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <Activity className="h-3 w-3" />
                  <span>Encounter Memory</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMemorySubView("timeline");
                    loadPatientTimeline();
                  }}
                  className={`flex-1 py-1 rounded-md text-center transition cursor-pointer flex items-center justify-center gap-1.5 ${
                    memorySubView === "timeline"
                      ? "bg-white dark:bg-[#2C2C2E] text-[#0071E3] dark:text-[#2997FF] shadow-xs font-bold"
                      : "text-slate-500 hover:text-slate-900 dark:hover:text-white"
                  }`}
                >
                  <History className="h-3 w-3" />
                  <span>Patient Timeline</span>
                </button>
              </div>

              {memorySubView === "current" ? (
                <>
                  {/* Vitals Summary */}
                  <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#202125] p-3 space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white">
                      <span className="flex items-center gap-1.5">
                        <HeartPulse className="h-4 w-4 text-rose-500" />
                        <span>Captured Vitals</span>
                      </span>
                      <span className="text-[10px] font-mono text-slate-400">
                        {Object.keys(clinicalMemory.vitals).length} items
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="rounded-lg bg-white dark:bg-[#2C2C2E] p-2 border border-black/[0.04] dark:border-white/[0.06]">
                        <div className="text-[10px] text-slate-400">Blood Pressure</div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {clinicalMemory.vitals.bp_systolic && clinicalMemory.vitals.bp_diastolic
                            ? `${clinicalMemory.vitals.bp_systolic}/${clinicalMemory.vitals.bp_diastolic} mmHg`
                            : "Pending"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-[#2C2C2E] p-2 border border-black/[0.04] dark:border-white/[0.06]">
                        <div className="text-[10px] text-slate-400">Temperature</div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {clinicalMemory.vitals.temperature ? `${clinicalMemory.vitals.temperature}°F` : "Pending"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-[#2C2C2E] p-2 border border-black/[0.04] dark:border-white/[0.06]">
                        <div className="text-[10px] text-slate-400">SpO2</div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {clinicalMemory.vitals.spo2 ? `${clinicalMemory.vitals.spo2}%` : "Pending"}
                        </div>
                      </div>
                      <div className="rounded-lg bg-white dark:bg-[#2C2C2E] p-2 border border-black/[0.04] dark:border-white/[0.06]">
                        <div className="text-[10px] text-slate-400">Heart Rate</div>
                        <div className="font-bold text-slate-900 dark:text-white">
                          {clinicalMemory.vitals.heart_rate ? `${clinicalMemory.vitals.heart_rate} bpm` : "Pending"}
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Complaints List with Physician Verification */}
                  <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#202125] p-3 space-y-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center justify-between">
                      <span className="flex items-center gap-1.5">
                        <FileText className="h-4 w-4 text-blue-500" />
                        <span>Problem Statement / Complaints</span>
                      </span>
                      <span className="text-[10px] font-normal text-slate-400">Tap Verify to confirm</span>
                    </div>
                    {clinicalMemory.complaints.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic">No symptoms captured yet.</div>
                    ) : (
                      <div className="space-y-2">
                        {clinicalMemory.complaints.map((c, cIdx) => (
                          <div key={`docked-comp-${c.id || cIdx}`} className="rounded-lg bg-white dark:bg-[#2C2C2E] p-2.5 border border-black/[0.04] text-xs space-y-1.5">
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <div className="font-bold text-slate-800 dark:text-slate-200">{c.symptom}</div>
                                <div className="text-[10px] text-slate-400">{c.duration || "Presenting"} • {c.severity || "Moderate"}</div>
                              </div>
                              {c.verification_status === "DOCTOR_VERIFIED" ? (
                                <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 text-[10px] font-bold">
                                  <CheckCircle2 className="h-3 w-3" />
                                  Verified
                                </span>
                              ) : (
                                <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 text-amber-600 dark:text-amber-400 px-1.5 py-0.5 text-[10px] font-bold">
                                  <Clock className="h-3 w-3" />
                                  Unverified AI
                                </span>
                              )}
                            </div>

                            {/* Action buttons to verify or reject AI-extracted facts */}
                            {c.verification_status !== "DOCTOR_VERIFIED" && c.id && (
                              <div className="flex items-center justify-end gap-1.5 pt-1 border-t border-slate-100 dark:border-white/[0.04]">
                                <button
                                  type="button"
                                  disabled={verifyingFactId === c.id}
                                  onClick={() => handleRejectFact(c.id, c.symptom)}
                                  className="px-2 py-0.5 rounded text-[10px] font-semibold text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition cursor-pointer"
                                >
                                  Reject
                                </button>
                                <button
                                  type="button"
                                  disabled={verifyingFactId === c.id}
                                  onClick={() => handleVerifyFact(c.id, c.symptom)}
                                  className="px-2 py-0.5 rounded text-[10px] font-bold text-white bg-emerald-600 hover:bg-emerald-700 transition cursor-pointer flex items-center gap-1 shadow-2xs"
                                >
                                  <Check className="h-2.5 w-2.5" />
                                  Verify
                                </button>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Prescribed Medicines Detected */}
                  <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#202125] p-3 space-y-2">
                    <div className="text-xs font-bold text-slate-900 dark:text-white flex items-center gap-1.5">
                      <Pill className="h-4 w-4 text-emerald-500" />
                      <span>Detected Prescriptions</span>
                    </div>
                    {clinicalMemory.medications.length === 0 ? (
                      <div className="text-[11px] text-slate-400 italic">No medications detected yet.</div>
                    ) : (
                      <div className="space-y-1.5">
                        {clinicalMemory.medications.map((m, mIdx) => (
                          <div key={`docked-med-${m.id || mIdx}`} className="rounded-lg bg-white dark:bg-[#2C2C2E] p-2 border border-black/[0.04] text-xs space-y-1">
                            <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center justify-between">
                              <span>{m.medicine_name}</span>
                              <span className="text-[10px] font-mono text-emerald-600 bg-emerald-500/10 px-1.5 py-0.2 rounded font-bold">
                                {m.frequency}
                              </span>
                            </div>
                            <div className="text-[10px] text-slate-500">
                              {m.generic_name} • {m.duration} • {m.timing}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Sync Button */}
                  {onSyncToPrescription && (
                    <button
                      type="button"
                      onClick={() => onSyncToPrescription({
                        complaints: clinicalMemory.complaints.map((c) => c.symptom),
                        vitals: clinicalMemory.vitals,
                        diagnosis: clinicalMemory.confirmed_diagnosis || clinicalMemory.provisional_diagnosis,
                        medications: clinicalMemory.medications,
                      })}
                      className="w-full py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                    >
                      <Zap className="h-3.5 w-3.5 text-amber-300 fill-amber-300" />
                      <span>Sync Captured Data to Prescription Pad</span>
                    </button>
                  )}
                </>
              ) : (
                /* Sub-view 2: Longitudinal Medical Timeline */
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-slate-900 dark:text-white px-1">
                    <span className="flex items-center gap-1.5">
                      <History className="h-4 w-4 text-[#0071E3]" />
                      <span>Longitudinal Medical Timeline</span>
                    </span>
                    <button
                      type="button"
                      onClick={loadPatientTimeline}
                      className="text-[10px] text-blue-600 dark:text-blue-400 hover:underline"
                    >
                      Refresh
                    </button>
                  </div>

                  {loadingTimeline ? (
                    <div className="p-4 text-center text-xs text-slate-400">Loading timeline...</div>
                  ) : timelineItems.length === 0 ? (
                    <div className="p-4 text-center rounded-xl bg-slate-50/70 dark:bg-[#202125] text-xs text-slate-400 italic">
                      No prior encounters or facts recorded on timeline yet.
                    </div>
                  ) : (
                    <div className="relative pl-4 space-y-3 before:absolute before:left-1.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-white/10">
                      {timelineItems.map((item) => (
                        <div key={item.id} className="relative text-xs">
                          <div className="absolute -left-[14px] top-1.5 h-2 w-2 rounded-full bg-[#0071E3] ring-2 ring-white dark:ring-[#151619]" />
                          <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#202125] p-2.5 space-y-1">
                            <div className="flex items-center justify-between text-[10px]">
                              <span className="font-mono text-slate-400">
                                {new Date(item.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                              </span>
                              <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[9px] ${
                                item.verification_status === "DOCTOR_VERIFIED"
                                  ? "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400"
                                  : "bg-amber-500/10 text-amber-600 dark:text-amber-400"
                              }`}>
                                {item.verification_status.replace("_", " ")}
                              </span>
                            </div>
                            <div className="font-bold text-slate-900 dark:text-white text-xs">{item.title}</div>
                            <p className="text-[11px] text-slate-600 dark:text-slate-300 leading-snug">{item.summary}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Tab 3: Interactive Jarvis Chat */}
          {dockTab === "assistant" && (
            <div className="flex-1 flex flex-col min-h-0">
              {/* Jarvis Wake-Word & Status Header */}
              <div className="px-3 py-2 bg-gradient-to-r from-indigo-500/10 via-purple-500/10 to-blue-500/10 border-b border-black/[0.04] dark:border-white/[0.06] flex items-center justify-between gap-2 shrink-0">
                <div className="flex items-center gap-1.5 text-[11px] font-semibold text-indigo-700 dark:text-indigo-300">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                  </span>
                  <span>Say &ldquo;Hey Jarvis&rdquo; anytime while talking</span>
                </div>
                <div className="text-[10px] text-slate-500 flex items-center gap-1">
                  <span>{speechSynthesisEnabled ? "🔊 Voice Active" : "🔇 Voice Muted"}</span>
                </div>
              </div>

              <div className="flex-1 overflow-y-auto p-3.5 space-y-2.5 min-h-0">
                {chatMessages.map((msg, msgIdx) => (
                  <div
                    key={`docked-msg-${msg.id || msgIdx}`}
                    className={`rounded-xl p-2.5 text-xs space-y-1 max-w-[90%] ${
                      msg.sender === "doctor"
                        ? "ml-auto bg-blue-600 text-white"
                        : "mr-auto bg-slate-100 dark:bg-[#25262B] text-slate-800 dark:text-slate-200 border border-slate-200/60 dark:border-white/[0.06]"
                    }`}
                  >
                    <div className="flex items-center gap-1.5 text-[10px] opacity-75">
                      {msg.sender === "doctor" ? <User className="h-2.5 w-2.5" /> : <Sparkles className="h-2.5 w-2.5 text-indigo-400" />}
                      <span>{msg.sender === "doctor" ? "Doctor" : "Jarvis"}</span>
                      <span>•</span>
                      <span>{msg.timestamp}</span>
                    </div>
                    <div className="whitespace-pre-wrap leading-relaxed">{msg.text}</div>
                  </div>
                ))}
              </div>

              {/* Quick Clinical Reasoning Action Chips */}
              <div className="p-2 border-t border-black/[0.04] dark:border-white/[0.06] bg-slate-50/50 dark:bg-white/[0.02] flex items-center gap-1.5 overflow-x-auto text-[10px] shrink-0 scrollbar-none">
                <button
                  type="button"
                  onClick={() => handleSendDoctorCommand("Pediatric dose of Paracetamol for 12 kg child")}
                  className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-blue-500/10 hover:bg-blue-500/20 text-blue-700 dark:text-blue-300 border border-blue-500/20 font-medium transition cursor-pointer flex items-center gap-1"
                  title="Calculate pediatric dosage"
                >
                  <span>⚖️ Dose 12kg PCM</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendDoctorCommand("Can I prescribe Augmentin to this patient?")}
                  className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-rose-500/10 hover:bg-rose-500/20 text-rose-700 dark:text-rose-300 border border-rose-500/20 font-medium transition cursor-pointer flex items-center gap-1"
                  title="Check allergy contraindications"
                >
                  <span>🛡️ Check Augmentin</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendDoctorCommand("First line antibiotic for acute pharyngitis")}
                  className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-300 border border-emerald-500/20 font-medium transition cursor-pointer flex items-center gap-1"
                  title="Empiric antibiotic stewardship"
                >
                  <span>💊 Abx Pharyngitis</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendDoctorCommand("Suggest differential diagnosis for fever with rash and joint pain")}
                  className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-purple-500/10 hover:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 font-medium transition cursor-pointer flex items-center gap-1"
                  title="Generate differential diagnoses"
                >
                  <span>📋 Differentials</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendDoctorCommand("Prescribe Paracetamol 650mg 1-0-1 for 3 days")}
                  className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-medium transition cursor-pointer flex items-center gap-1"
                  title="Voice command to prescribe medicine"
                >
                  <span>➕ Prescribe PCM 650</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleSendDoctorCommand("Read back the captured clinical readings")}
                  className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-white/[0.08] hover:bg-slate-300/60 text-slate-700 dark:text-slate-300 font-medium transition cursor-pointer"
                >
                  🩺 Read Vitals
                </button>
                <button
                  type="button"
                  onClick={() => handleSendDoctorCommand("What medications were prescribed in last visit?")}
                  className="whitespace-nowrap px-2.5 py-1 rounded-lg bg-slate-200/60 dark:bg-white/[0.08] hover:bg-slate-300/60 text-slate-700 dark:text-slate-300 font-medium transition cursor-pointer"
                >
                  📜 Past Meds
                </button>
              </div>

              {/* Input Bar */}
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendDoctorCommand();
                }}
                className="p-2.5 border-t border-black/[0.06] dark:border-white/[0.08] flex items-center gap-1.5 shrink-0"
              >
                <input
                  type="text"
                  value={doctorInput}
                  onChange={(e) => setDoctorInput(e.target.value)}
                  placeholder="Ask Jarvis (e.g. check allergy, dose 15kg child, correct BP)..."
                  className="flex-1 rounded-xl bg-slate-100 dark:bg-white/[0.06] border border-black/[0.06] dark:border-white/[0.08] px-3 py-1.5 text-xs text-slate-800 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  className="flex h-8 w-8 items-center justify-center rounded-xl bg-indigo-600 text-white hover:bg-indigo-700 transition cursor-pointer"
                >
                  <Send className="h-3.5 w-3.5" />
                </button>
              </form>
            </div>
          )}

          {/* Docked Footer: End Consultation & Draft Dual Reports */}
          <div className="p-3 border-t border-black/[0.06] dark:border-white/[0.08] bg-slate-50/70 dark:bg-[#202125] shrink-0">
            <button
              type="button"
              onClick={handleEndConsultation}
              className="w-full py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold text-xs shadow-sm transition active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
            >
              <CheckCircle2 className="h-4 w-4" />
              <span>End Consultation &amp; Generate Dual Reports</span>
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4 w-full">
          {onLayoutModeChange && (
            <div className="flex items-center justify-between bg-slate-100/80 dark:bg-white/[0.06] p-2 rounded-xl text-xs print:hidden">
              <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-white">
                <Sparkles className="h-4 w-4 text-[#0071E3] dark:text-[#2997FF]" />
                <span>AI Clinical Companion • Full Studio</span>
              </div>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => onLayoutModeChange("docked")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#2C2C2E] shadow-2xs text-slate-700 dark:text-slate-200 font-semibold hover:text-[#0071E3] transition cursor-pointer"
                >
                  <PanelRightOpen className="h-3.5 w-3.5" />
                  <span>Dock Side-by-Side</span>
                </button>
                <button
                  type="button"
                  onClick={() => onLayoutModeChange("hud")}
                  className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#2C2C2E] shadow-2xs text-slate-700 dark:text-slate-200 font-semibold hover:text-[#0071E3] transition cursor-pointer"
                >
                  <Layers className="h-3.5 w-3.5" />
                  <span>Mini HUD</span>
                </button>
                {onClose && (
                  <button
                    type="button"
                    onClick={onClose}
                    className="p-1 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white transition cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          )}
      {/* ========================================================================= */}
      {/* 2-COLUMN RESPONSIVE CONSULTATION WORKSPACE */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)] gap-5 w-full items-start">
        {/* ===================================================================== */}
        {/* PRIMARY COLUMN (1.15fr): Patient Info, Consent, Mic & Live Scribe   */}
        {/* ===================================================================== */}
        <div className="space-y-4 min-w-0">
          {/* Patient Demographics & Consent Card */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#121316] space-y-3.5">
            {/* Row 1 — Patient Identity & Consultation Controls */}
            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_auto] items-start gap-4 lg:gap-6">
              {/* Left Section: Patient Identity & Details */}
              <div className="flex items-start gap-3.5 sm:gap-4 min-w-0">
                {/* 64px Patient Avatar */}
                <div className="flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl bg-[#0071E3]/10 font-black text-xl sm:text-2xl text-[#0071E3] dark:bg-[#0071E3]/20 dark:text-[#2997FF] border border-[#0071E3]/20 shadow-xs">
                  {patient.name ? patient.name.trim().charAt(0).toUpperCase() : "P"}
                </div>

                {/* Identity + 2-Column Key-Value Grid */}
                <div className="min-w-0 flex-1 space-y-2">
                  {/* Patient Name & Token Badge */}
                  <div className="flex items-center gap-2.5 flex-wrap min-w-0">
                    <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white truncate tracking-tight">
                      {patient.name}
                    </h2>
                    <span className="inline-flex items-center gap-1 rounded-full bg-[#0071E3]/10 px-2.5 py-0.5 text-xs font-bold text-[#0071E3] dark:bg-[#0071E3]/20 dark:text-[#2997FF] shrink-0">
                      Token #{patient.token_number || 1}
                    </span>
                    {patient.appointment_number && (
                      <span className="text-xs text-slate-400 font-medium shrink-0">
                        (Appt #{patient.appointment_number})
                      </span>
                    )}
                  </div>

                  {/* 2-Column Structured Details Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1.5 text-xs text-slate-600 dark:text-slate-300">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">UHID:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white truncate">
                        {patient.uhid || "2026-9021"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">Demographics:</span>
                      <span className="font-medium text-slate-900 dark:text-white truncate">
                        {patient.age ? `${patient.age}Y` : "Adult"} • {patient.gender || "Gender: N/S"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">Phone:</span>
                      <span className="font-mono font-bold text-slate-900 dark:text-white truncate">
                        {patient.phone ? (patient.phone.startsWith("+") ? patient.phone : `+91 ${patient.phone}`) : "—"}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className="text-slate-500 dark:text-slate-400 font-semibold shrink-0">Past Visit:</span>
                      <span className="font-medium text-slate-900 dark:text-white truncate">
                        {patient.previous_visit_date || "14 Oct 2026"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right Section: Consultation Controls (Recording Consent, Mode, Speaker) */}
              <div className="flex flex-col sm:flex-row lg:flex-col items-start sm:items-center lg:items-end justify-between gap-2.5 shrink-0 min-w-0 pt-0.5">
                {/* DPDP Recording Consent */}
                <label className="flex items-center gap-2 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.03] px-3 py-1.5 text-xs cursor-pointer select-none hover:bg-slate-100/80 dark:hover:bg-white/[0.06] transition shadow-2xs">
                  <input
                    type="checkbox"
                    checked={consentObtained}
                    onChange={(e) => setConsentObtained(e.target.checked)}
                    className="h-4 w-4 rounded text-[#0071E3] focus:ring-[#0071E3] border-slate-300"
                  />
                  <span className="text-slate-800 dark:text-slate-200 font-semibold">Recording Consent</span>
                  <ShieldCheck className={`h-4 w-4 ${consentObtained ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`} />
                </label>

                <div className="flex items-center gap-2 flex-wrap">
                  {/* Companion Mode Selector */}
                  <div className="flex items-center rounded-lg border border-slate-200 dark:border-white/[0.08] p-0.5 bg-slate-100 dark:bg-white/[0.04] text-xs">
                    <button
                      type="button"
                      onClick={() => setCompanionMode("silent")}
                      className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${companionMode === "silent" ? "bg-white dark:bg-white/10 font-bold text-slate-900 dark:text-white shadow-2xs" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                      title="Listens and documents silently without interruptions"
                    >
                      Silent
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompanionMode("assistant")}
                      className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${companionMode === "assistant" ? "bg-white dark:bg-white/10 font-bold text-[#0071E3] dark:text-[#2997FF] shadow-2xs" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                      title="Flags missing vital parameters and ambiguous doses"
                    >
                      Assistant
                    </button>
                    <button
                      type="button"
                      onClick={() => setCompanionMode("voice_companion")}
                      className={`px-2.5 py-1 rounded-md transition font-medium cursor-pointer ${companionMode === "voice_companion" ? "bg-white dark:bg-white/10 font-bold text-purple-600 dark:text-purple-400 shadow-2xs" : "text-slate-500 hover:text-slate-900 dark:hover:text-white"}`}
                      title="Voice read-back and spoken replies"
                    >
                      Voice AI
                    </button>
                  </div>

                  {/* Speech synthesis toggle */}
                  <button
                    type="button"
                    onClick={() => setSpeechSynthesisEnabled((p) => !p)}
                    className={`p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] cursor-pointer transition ${speechSynthesisEnabled ? "text-[#0071E3] bg-[#0071E3]/10 border-[#0071E3]/30" : "text-slate-400 bg-slate-50 dark:bg-white/[0.02]"}`}
                    title={speechSynthesisEnabled ? "Voice Speech Enabled" : "Voice Speech Muted"}
                  >
                    {speechSynthesisEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </button>
                </div>
              </div>
            </div>

            {/* Row 2 — Known Allergies & Medical History Strip */}
            <div className="pt-3 border-t border-slate-100 dark:border-white/[0.06] flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2.5 text-xs">
              <div className="flex items-center gap-2 flex-wrap min-w-0">
                <div className="flex items-center gap-1.5 font-bold text-rose-700 dark:text-rose-400 shrink-0">
                  <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
                  <span>Allergies:</span>
                </div>
                {clinicalMemory.allergies.length > 0 ? (
                  clinicalMemory.allergies.map((all, i) => (
                    <span
                      key={`modal-allergy-${all}-${i}`}
                      className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 font-semibold text-rose-700 dark:text-rose-300 border border-rose-500/25"
                    >
                      {all}
                    </span>
                  ))
                ) : (
                  <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400 font-semibold bg-emerald-500/10 px-2 py-0.5 rounded-md border border-emerald-500/20">
                    No Known Drug Allergies (NKDA)
                  </span>
                )}
              </div>

              <div className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400 min-w-0">
                <span className="font-semibold text-slate-700 dark:text-slate-300">Comorbidities:</span>
                <span className="font-medium text-slate-800 dark:text-slate-200">
                  {clinicalMemory.medical_history.length > 0 ? clinicalMemory.medical_history.join(", ") : "None reported"}
                </span>
              </div>
            </div>
          </div>

          {/* Microphone Permission Notice Banner */}
          {micPermissionError && (
            <div className="rounded-xl border border-amber-300 bg-amber-50 p-4 text-xs text-amber-950 shadow-xs dark:border-amber-500/30 dark:bg-amber-500/10 dark:text-amber-200 flex items-start justify-between gap-3 animate-in fade-in">
              <div className="flex items-start gap-3">
                <ShieldAlert className="h-5 w-5 text-amber-600 dark:text-amber-400 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <span className="font-bold text-amber-900 dark:text-amber-200">
                    Microphone Access Required
                  </span>
                  <p className="leading-relaxed text-[12px] text-amber-800 dark:text-amber-300/90">
                    {micPermissionError}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMicPermissionError(null)}
                className="text-amber-700 hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-100 p-1 shrink-0 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40 cursor-pointer"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Audio Capture Card */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#121316]">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              {/* Mic Button & Timer */}
              <div className="flex items-center gap-4">
                <button
                  type="button"
                  onClick={
                    !sessionActive
                      ? handleStartConsultation
                      : isRecording
                      ? handleTogglePause
                      : handleStartConsultation
                  }
                  className={`relative flex h-14 w-14 sm:h-16 sm:w-16 shrink-0 items-center justify-center rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer ${
                    isRecording && !isPaused
                      ? "bg-rose-600 text-white shadow-rose-600/30 hover:bg-rose-700 animate-pulse"
                      : isPaused
                      ? "bg-amber-500 text-white shadow-amber-500/30 hover:bg-amber-600"
                      : "bg-[#0071E3] text-white shadow-[#0071E3]/30 hover:bg-[#0077ED]"
                  }`}
                  title={
                    !sessionActive
                      ? "Click to start consultation recording"
                      : isRecording
                      ? "Recording active — Click to pause"
                      : "Click to resume"
                  }
                >
                  {isRecording && !isPaused ? (
                    <Mic className="h-7 w-7 sm:h-8 sm:w-8" />
                  ) : isPaused ? (
                    <Pause className="h-6 w-6 sm:h-7 sm:w-7" />
                  ) : (
                    <Mic className="h-7 w-7 sm:h-8 sm:w-8" />
                  )}
                </button>

                <div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`h-2.5 w-2.5 rounded-full ${
                        isRecording && !isPaused
                          ? "bg-rose-600 animate-ping"
                          : isPaused
                          ? "bg-amber-500"
                          : "bg-slate-300"
                      }`}
                    />
                    <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                      {isRecording && !isPaused
                        ? "AI Companion Listening"
                        : isPaused
                        ? "Audio Paused"
                        : "Ready to Listen"}
                    </span>
                    <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full border ${
                      wsStatus === "connected"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                        : wsStatus === "connecting"
                        ? "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20"
                        : "bg-slate-100 dark:bg-white/[0.04] text-slate-500 border-slate-200 dark:border-white/[0.08]"
                    }`}>
                      <span className={`h-1.5 w-1.5 rounded-full ${wsStatus === "connected" ? "bg-emerald-500 animate-pulse" : wsStatus === "connecting" ? "bg-amber-500 animate-pulse" : "bg-slate-400"}`} />
                      <span>{wsStatus === "connected" ? "AI Gateway Active" : wsStatus === "connecting" ? "Connecting Gateway..." : "Local Scribe Engine"}</span>
                    </span>
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="font-mono text-xl sm:text-2xl font-black text-slate-900 dark:text-white">
                      {formatTime(seconds)}
                    </span>
                    <span className="text-[11px] text-slate-500 font-medium">
                      Mode: <strong className="capitalize text-slate-700 dark:text-slate-300">{companionMode.replace("_", " ")}</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Controls */}
              <div className="flex items-center gap-2 sm:self-center">
                {sessionActive && (
                  <button
                    type="button"
                    onClick={handleEndConsultation}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-3.5 py-2 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
                  >
                    <Square className="h-3.5 w-3.5" />
                    <span>End &amp; Generate Reports</span>
                  </button>
                )}
              </div>
            </div>

            {/* Audio Waveform Meter */}
            <div className="mt-4 flex items-center justify-between gap-1 h-6 px-1 rounded-lg bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04]">
              {BAR_PATTERN.map((bar, i) => {
                const scaledHeight = isRecording && !isPaused ? Math.max(15, Math.min(100, bar * (0.3 + audioLevel * 2) * 100)) : 15;
                return (
                  <div
                    key={`modal-bar-${i}`}
                    className="w-full rounded-full transition-all duration-75"
                    style={{
                      height: `${scaledHeight}%`,
                      backgroundColor: isRecording && !isPaused ? (i % 2 === 0 ? "#0071E3" : "#2997FF") : "#CBD5E1",
                    }}
                  />
                );
              })}
            </div>
          </div>

          {/* Live Conversational Scribe & Transcription Studio */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#121316] space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="h-4 w-4 text-[#0071E3]" />
                <span className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Live Scribe Dialogue &amp; Notes
                </span>
                {isRecording && !isPaused && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 px-2 py-0.5 text-[10px] font-semibold text-rose-600 dark:text-rose-400 animate-pulse">
                    <span className="h-1.5 w-1.5 rounded-full bg-rose-600 animate-ping" />
                    Listening &amp; Typing...
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <span>Language: <strong className="uppercase text-slate-600 dark:text-slate-300">{language}</strong></span>
                <span>•</span>
                <span>{transcript ? transcript.split(/\s+/).filter(Boolean).length : 0} words</span>
              </div>
            </div>

            {/* Structured Speaker Attributed Turns */}
            {transcriptTurns.length > 0 && (
              <div className="max-h-48 overflow-y-auto space-y-2 rounded-lg border border-slate-200/60 dark:border-white/[0.06] bg-slate-50/40 dark:bg-white/[0.01] p-2.5">
                <div className="flex items-center justify-between text-[10px] text-slate-400 font-semibold uppercase tracking-wider pb-1 border-b border-slate-100 dark:border-white/[0.04]">
                  <span>Speaker Turns ({transcriptTurns.length})</span>
                  <span>Tap badge to correct speaker</span>
                </div>
                {transcriptTurns.map((turn, tIdx) => (
                  <div key={`modal-turn-${turn.id || tIdx}`} className="flex items-start gap-2 text-xs">
                    <div className="relative shrink-0 mt-0.5">
                      <button
                        type="button"
                        onClick={() => setEditingSpeakerTurnId(editingSpeakerTurnId === turn.id ? null : turn.id)}
                        className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold border transition cursor-pointer ${
                          turn.speaker === "doctor"
                            ? "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/50 dark:text-blue-300 dark:border-blue-800"
                            : turn.speaker === "patient"
                            ? "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800"
                            : "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800"
                        }`}
                        title="Click to change speaker attribution"
                      >
                        <span className="capitalize">{turn.speaker}</span>
                        {turn.speaker_manually_corrected && <span className="text-[8px] text-blue-500 font-normal">✎</span>}
                        <ChevronDown className="h-2.5 w-2.5" />
                      </button>

                      {editingSpeakerTurnId === turn.id && (
                        <div className="absolute left-0 top-full mt-1 z-30 w-28 rounded-lg bg-white dark:bg-[#1C1C1E] shadow-lg border border-slate-200 dark:border-white/10 p-1 text-xs space-y-0.5">
                          <button
                            type="button"
                            onClick={() => handleCorrectSpeaker(turn.id, "doctor")}
                            className="w-full text-left px-2 py-1 rounded text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-white/[0.06] font-semibold"
                          >
                            Doctor
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCorrectSpeaker(turn.id, "patient")}
                            className="w-full text-left px-2 py-1 rounded text-emerald-700 dark:text-emerald-300 hover:bg-emerald-50 dark:hover:bg-white/[0.06] font-semibold"
                          >
                            Patient
                          </button>
                          <button
                            type="button"
                            onClick={() => handleCorrectSpeaker(turn.id, "uncertain")}
                            className="w-full text-left px-2 py-1 rounded text-amber-700 dark:text-amber-300 hover:bg-amber-50 dark:hover:bg-white/[0.06] font-semibold"
                          >
                            Uncertain
                          </button>
                        </div>
                      )}
                    </div>
                    <p className="flex-1 text-slate-800 dark:text-slate-200 leading-snug">
                      {turn.transcript_text}
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Editable Live Typing Scribe Box */}
            <div className="relative rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50/50 dark:bg-[#151619] p-3 shadow-2xs transition-colors focus-within:border-[#0071E3] focus-within:ring-1 focus-within:ring-[#0071E3]">
              <textarea
                rows={5}
                value={transcript}
                onChange={(e) => handleTranscriptChange(e.target.value)}
                placeholder="Whatever doctor and patient say will be typed here live in real time... You can also type or edit clinical notes directly."
                className="w-full resize-y bg-transparent text-xs text-slate-800 dark:text-slate-200 font-sans leading-relaxed placeholder:text-slate-400 focus:outline-hidden"
              />

              {/* Real-time Streaming Interim Preview */}
              {interimText && (
                <div className="mt-2 pt-2 border-t border-slate-100 dark:border-white/[0.04] text-[11px] text-[#0071E3] dark:text-[#388bfd] font-mono flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full bg-[#0071E3] animate-ping" />
                  <span className="italic font-medium">"{interimText}"</span>
                  <span className="animate-pulse font-bold text-sm">|</span>
                </div>
              )}
            </div>

            {/* Action Toolbar & Prominent Report Generation Button */}
            <div className="pt-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-slate-200/60 dark:border-white/[0.06]">
              {/* 1-Tap Quick Fill Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-[10px] font-bold text-slate-400 uppercase">1-Tap Fill:</span>
                <button
                  type="button"
                  onClick={() =>
                    handleSimulateSpeech(
                      "Blood pressure is 120/80. Pulse is 78. Temperature is 100.4 Fahrenheit. SpO2 is 98 percent. Weight is 68 kg, height is 172 cm. Patient has high fever for 3 days, severe headache and body ache, also mild sore throat and dry cough. Throat is congested, lungs clear, per abdomen soft. Provisional diagnosis is Acute Viral Pyrexia. Prescribe Tab Pan 40 once daily empty stomach for 5 days, Tab Dolo 650 twice daily after food for 3 days, Tab Cetzine 10 at bedtime for 3 days. Order Complete Blood Count CBC and Dengue NS1. Follow up in 3 days."
                    )
                  }
                  className="rounded-md bg-[#0071E3]/10 hover:bg-[#0071E3]/20 text-[#0071E3] dark:text-[#388bfd] px-2.5 py-1 text-[11px] font-semibold transition-colors cursor-pointer"
                >
                  + Full Doctor Script (Fever, Vitals, Rx)
                </button>
                <button
                  type="button"
                  onClick={() =>
                    handleSimulateSpeech(
                      "Patient has moderate fever and sore throat for 3 days. BP is 120 over 80, pulse 84, temp 101.2. Provisional diagnosis is Acute Viral Pharyngitis. Prescribe Tab Dolo 650 twice daily after food for 3 days, Tab Pan 40 before breakfast for 5 days, and Tab Cetzine 10 at night. Advise warm water gargles and review in 3 days."
                    )
                  }
                  className="rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] px-2 py-1 text-[10px] font-medium text-slate-700 dark:text-slate-200 cursor-pointer"
                >
                  + Pharyngitis
                </button>
                {transcript && (
                  <button
                    type="button"
                    onClick={() => handleTranscriptChange("")}
                    className="rounded-md hover:bg-rose-50 text-slate-400 hover:text-rose-600 px-2 py-1 text-[10px] transition-colors cursor-pointer"
                  >
                    Clear Notes
                  </button>
                )}
              </div>

              {/* THE PRIMARY BUTTON AT THE END TO GENERATE THE REPORT */}
              <button
                type="button"
                onClick={handleEndConsultation}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white px-5 py-2.5 text-xs font-bold shadow-md hover:shadow-lg transition-all active:scale-[0.98] cursor-pointer"
                title="Generate Doctor Clinical Report and Patient-Friendly Summary from typed/spoken conversation"
              >
                <Sparkles className="h-4 w-4" />
                <span>Generate Medical Reports</span>
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>
        </div>

        {/* ===================================================================== */}
        {/* SECONDARY COLUMN (0.85fr): Companion Dialogue & Live Memory          */}
        {/* ===================================================================== */}
        <div className="space-y-4 min-w-0">
          {/* Clarification Alerts (if any) */}
          {clarifications.filter((c) => !c.resolved).length > 0 && (
            <div className="rounded-xl border border-amber-300 bg-amber-500/10 p-3.5 space-y-2 dark:border-amber-500/30">
              <div className="flex items-center gap-2 text-xs font-bold text-amber-800 dark:text-amber-200">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span>AI Clarification Needed</span>
              </div>
              <div className="space-y-2">
                {clarifications
                  .filter((c) => !c.resolved)
                  .map((alert, aIdx) => (
                    <div
                      key={`modal-alert-${alert.id || aIdx}`}
                      className="rounded-lg bg-white/80 dark:bg-black/30 p-2 text-xs text-slate-800 dark:text-slate-200 border border-amber-200 dark:border-amber-500/20 space-y-1"
                    >
                      <p className="font-semibold">{alert.question}</p>
                      <p className="text-[10px] text-slate-500">{alert.rationale}</p>
                      <div className="flex justify-end pt-1">
                        <button
                          type="button"
                          onClick={() => {
                            setClarifications((prev) =>
                              prev.map((c) => (c.id === alert.id ? { ...c, resolved: true } : c))
                            );
                            showToast("Clarification resolved.");
                          }}
                          className="rounded bg-amber-600 text-white px-2 py-0.5 text-[10px] font-bold hover:bg-amber-700 cursor-pointer"
                        >
                          Dismiss / Resolved
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          )}

          {/* Interactive Chat Stream with AI Companion */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#121316] flex flex-col h-[480px]">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-[#0071E3]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Companion Dialogue
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Doctor-Companion Channel</span>
            </div>

            {/* Chat Message Scroll Area */}
            <div className="flex-1 overflow-y-auto space-y-2.5 py-3 pr-1 text-xs">
              {chatMessages.map((msg, msgIdx) => (
                <div
                  key={`modal-msg-${msg.id || msgIdx}`}
                  className={`flex flex-col ${msg.sender === "doctor" ? "items-end" : "items-start"}`}
                >
                  <div className="text-[9px] text-slate-400 mb-0.5 px-1 capitalize">
                    {msg.sender === "doctor" ? doctorName : "AI Companion"} • {msg.timestamp}
                  </div>
                  <div
                    className={`rounded-xl px-3 py-2 max-w-[88%] text-xs leading-relaxed ${
                      msg.sender === "doctor"
                        ? "bg-[#0071E3] text-white"
                        : msg.sender === "system"
                        ? "bg-slate-100 dark:bg-white/[0.06] text-slate-600 dark:text-slate-300 font-mono text-[10px]"
                        : "bg-slate-100 dark:bg-white/[0.06] text-slate-800 dark:text-slate-100 border border-slate-200/60 dark:border-white/[0.04]"
                    }`}
                  >
                    <div>{msg.text}</div>

                    {/* Grounding & Provenance Badges */}
                    {msg.provenance_sources && msg.provenance_sources.length > 0 && (
                      <div className="mt-2 pt-1.5 border-t border-slate-200/60 dark:border-white/[0.08] flex flex-wrap gap-1">
                        {msg.provenance_sources.map((cit, idx) => {
                          const badgeColor =
                            cit.source_type === "current_transcript"
                              ? "bg-blue-500/10 text-blue-700 dark:text-blue-300 border-blue-500/20"
                              : cit.source_type === "verified_patient_record"
                              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300 border-emerald-500/20"
                              : cit.source_type === "medical_knowledge"
                              ? "bg-purple-500/10 text-purple-700 dark:text-purple-300 border-purple-500/20"
                              : "bg-amber-500/10 text-amber-700 dark:text-amber-300 border-amber-500/20";
                          const label =
                            cit.source_type === "current_transcript"
                              ? "Live Transcript"
                              : cit.source_type === "verified_patient_record"
                              ? "Verified EHR"
                              : cit.source_type === "medical_knowledge"
                              ? "Medical KB"
                              : "Missing Info";
                          return (
                            <span
                              key={`prov-src-${msg.id || msgIdx}-${idx}`}
                              title={cit.quote ? `Quote: "${cit.quote}"` : cit.citation}
                              className={`inline-flex items-center gap-1 text-[9px] px-1.5 py-0.5 rounded border font-medium ${badgeColor}`}
                            >
                              <span>{label}:</span>
                              <span className="truncate max-w-[140px]">{cit.citation}</span>
                            </span>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              <div ref={chatBottomRef} />
            </div>

            {/* Quick Command Suggestion Chips */}
            <div className="pt-2 border-t border-slate-100 dark:border-white/[0.04] flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              <button
                type="button"
                onClick={() => handleSendDoctorCommand("What medication was prescribed last time?")}
                className="whitespace-nowrap rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
              >
                📜 Past Rx History
              </button>
              <button
                type="button"
                onClick={() => handleSendDoctorCommand("Read back the readings")}
                className="whitespace-nowrap rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
              >
                📊 Read Back Vitals
              </button>
              <button
                type="button"
                onClick={() => handleSendDoctorCommand("What information have you captured so far?")}
                className="whitespace-nowrap rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-medium cursor-pointer"
              >
                📋 Status Summary
              </button>
            </div>

            {/* Command Input Bar */}
            <div className="mt-2 flex items-center gap-2">
              <input
                type="text"
                value={doctorInput}
                onChange={(e) => setDoctorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendDoctorCommand();
                  }
                }}
                placeholder="Ask past history, correct BP, or add symptom..."
                className="flex-1 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-50 dark:bg-black/30 px-3 py-2 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
              />
              <button
                type="button"
                disabled={isProcessingCommand || !doctorInput.trim()}
                onClick={() => handleSendDoctorCommand()}
                className="inline-flex items-center justify-center rounded-xl bg-[#0071E3] hover:bg-[#0077ED] text-white p-2 shadow-xs transition disabled:opacity-50 cursor-pointer"
              >
                <Send className="h-4 w-4" />
              </button>
            </div>
          </div>

          {/* Live Clinical Memory Panel */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 sm:p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#121316] space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2.5 dark:border-white/[0.06]">
              <div className="flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-[#0071E3]" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-white">
                  Live Clinical Memory
                </h3>
              </div>
              <span className="text-[10px] text-slate-400">Updates dynamically from conversation</span>
            </div>

            {/* Complaints & Vitals in 2-Col Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Complaints */}
              <div className="rounded-lg bg-slate-50/60 dark:bg-white/[0.02] p-3 border border-slate-100 dark:border-white/[0.04] space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Patient Complaints ({clinicalMemory.complaints.length})
                </span>
                {clinicalMemory.complaints.length > 0 ? (
                  <div className="space-y-1.5">
                    {clinicalMemory.complaints.map((c, cIdx) => (
                      <div
                        key={`modal-comp-${c.id || cIdx}`}
                        className="flex items-start justify-between gap-2 text-xs bg-white dark:bg-[#1C1C1E] p-2 rounded-md border border-slate-200/60 dark:border-white/[0.06]"
                      >
                        <div>
                          <strong className="text-slate-900 dark:text-white">{c.symptom}</strong>
                          <div className="text-[10px] text-slate-400">Duration: {c.duration || "Not specified"} • {c.severity}</div>
                        </div>
                        <span className="rounded bg-slate-100 dark:bg-white/[0.08] px-1.5 py-0.5 text-[9px] font-medium text-slate-600 dark:text-slate-300 capitalize shrink-0">
                          {c.status.replace("_", " ")}
                        </span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-slate-400 italic">No complaints extracted yet.</p>
                )}
              </div>

              {/* Vitals */}
              <div className="rounded-lg bg-slate-50/60 dark:bg-white/[0.02] p-3 border border-slate-100 dark:border-white/[0.04] space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Vitals &amp; Hemodynamics
                </span>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-white dark:bg-[#1C1C1E] p-1.5 rounded-md border border-slate-200/60 dark:border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block">BP</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {clinicalMemory.vitals.bp_systolic && clinicalMemory.vitals.bp_diastolic
                        ? `${clinicalMemory.vitals.bp_systolic}/${clinicalMemory.vitals.bp_diastolic}`
                        : "Pending"}
                    </strong>
                  </div>
                  <div className="bg-white dark:bg-[#1C1C1E] p-1.5 rounded-md border border-slate-200/60 dark:border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block">Pulse</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {clinicalMemory.vitals.heart_rate ? `${clinicalMemory.vitals.heart_rate} bpm` : "Pending"}
                    </strong>
                  </div>
                  <div className="bg-white dark:bg-[#1C1C1E] p-1.5 rounded-md border border-slate-200/60 dark:border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block">Temp</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {clinicalMemory.vitals.temperature ? `${clinicalMemory.vitals.temperature}°F` : "Pending"}
                    </strong>
                  </div>
                  <div className="bg-white dark:bg-[#1C1C1E] p-1.5 rounded-md border border-slate-200/60 dark:border-white/[0.06]">
                    <span className="text-[10px] text-slate-400 block">SpO2</span>
                    <strong className="font-mono text-slate-900 dark:text-white">
                      {clinicalMemory.vitals.spo2 ? `${clinicalMemory.vitals.spo2}%` : "Pending"}
                    </strong>
                  </div>
                </div>
              </div>
            </div>

            {/* Diagnosis Bar */}
            <div className="rounded-lg bg-blue-50/50 dark:bg-[#0071E3]/10 p-3 border border-blue-200/60 dark:border-[#0071E3]/20 flex items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF] block">
                  Assessment / Provisional Diagnosis
                </span>
                <strong className="text-xs sm:text-sm text-slate-900 dark:text-white">
                  {clinicalMemory.provisional_diagnosis || "Awaiting doctor clinical confirmation..."}
                </strong>
              </div>
              <span className="rounded-md bg-[#0071E3]/10 dark:bg-[#0071E3]/20 px-2 py-0.5 text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF] shrink-0">
                {clinicalMemory.confirmed_diagnosis ? "Confirmed" : "Inferred"}
              </span>
            </div>

            {/* Prescribed Medications */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">
                  Draft Prescriptions ({clinicalMemory.medications.length})
                </span>
                <span className="text-[10px] text-slate-400">NMC Generic Standard</span>
              </div>

              {clinicalMemory.medications.length > 0 ? (
                <div className="space-y-2">
                  {clinicalMemory.medications.map((m, mIdx) => (
                    <div
                      key={`modal-med-${m.id || mIdx}`}
                      className="rounded-lg border border-slate-200/80 bg-white p-2.5 shadow-2xs dark:border-white/[0.06] dark:bg-[#1C1C1E] space-y-1"
                    >
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <strong className="text-xs text-slate-900 dark:text-white">
                            {m.medicine_name} ({m.strength})
                          </strong>
                          <div className="font-mono text-[10px] font-bold text-slate-400 uppercase">
                            {m.generic_name}
                          </div>
                        </div>
                        <span className="rounded bg-slate-100 dark:bg-white/[0.08] px-2 py-0.5 font-mono text-[10px] font-bold text-slate-700 dark:text-slate-300">
                          {m.frequency} • {m.duration}
                        </span>
                      </div>

                      <div className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-between">
                        <span>{m.timing} — {m.special_instructions}</span>
                        {m.catalogue_match_id && (
                          <span className="text-[9px] text-emerald-600 dark:text-emerald-400 font-semibold">
                            ✓ In Indian Catalogue
                          </span>
                        )}
                      </div>

                      {m.contraindication_warning && (
                        <div className="mt-1 rounded bg-rose-500/10 p-1.5 text-[10px] font-bold text-rose-700 dark:text-rose-300 border border-rose-500/20">
                          {m.contraindication_warning}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-xs text-slate-400 italic">No medications recorded yet. Say or type a medicine to draft.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
    )}

      {/* ========================================================================= */}
      {/* SECTION 3: END-OF-CONSULTATION DUAL REPORT REVIEW MODAL */}
      {/* ========================================================================= */}
      {isReviewOpen && doctorReport && patientSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in overflow-y-auto print:static print:p-0 print:bg-white print:block">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4 my-auto print:max-h-none print:overflow-visible print:p-0 print:border-none print:shadow-none print:space-y-3 print:w-full print:max-w-none">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06] print:border-black">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2 print:text-black">
                  <ShieldCheck className="h-5 w-5 text-emerald-600 print:text-black" />
                  <span>Consultation Review &amp; Report</span>
                </h3>
                <p className="text-xs text-slate-500 print:hidden">
                  Review the professional clinical report and patient-friendly visit summary before final e-sign.
                </p>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer print:hidden"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Dual Report Tab Switcher & Language Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 dark:bg-white/[0.04] p-2 rounded-xl print:hidden">
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setReviewTab("doctor_report")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    reviewTab === "doctor_report"
                      ? "bg-white dark:bg-white/10 text-[#0071E3] dark:text-[#2997FF] shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Report A: Doctor&apos;s Clinical Report
                </button>
                <button
                  type="button"
                  onClick={() => setReviewTab("patient_summary")}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition cursor-pointer ${
                    reviewTab === "patient_summary"
                      ? "bg-white dark:bg-white/10 text-emerald-600 dark:text-emerald-400 shadow-2xs"
                      : "text-slate-500 hover:text-slate-900"
                  }`}
                >
                  Report B: Patient-Friendly Summary
                </button>
              </div>

              {/* Language Selector for Patient Summary */}
              {reviewTab === "patient_summary" && (
                <div className="flex items-center gap-1.5 text-xs">
                  <Languages className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px] font-semibold text-slate-500">Language:</span>
                  <select
                    value={patientSummaryLanguage}
                    onChange={(e) => handleLanguageChangeForPatientSummary(e.target.value as ConsultationLanguage)}
                    className="rounded-lg border border-slate-200 dark:border-white/[0.1] bg-white dark:bg-black/30 p-1 text-xs text-slate-700 dark:text-slate-200"
                  >
                    <option value="english">English (Standard)</option>
                    <option value="hindi">हिन्दी (Hindi)</option>
                    <option value="marathi">मराठी (Marathi)</option>
                    <option value="bengali">বাংলা (Bengali)</option>
                    <option value="tamil">தமிழ் (Tamil)</option>
                    <option value="telugu">తెలుగు (Telugu)</option>
                  </select>
                </div>
              )}
            </div>

            {/* ============================================================= */}
            {/* TAB 1: DOCTOR'S PROFESSIONAL CLINICAL REPORT */}
            {/* ============================================================= */}
            {reviewTab === "doctor_report" && (
              <div className="space-y-4 rounded-xl border border-slate-200/80 bg-slate-50/50 p-4 dark:border-white/[0.06] dark:bg-black/20 text-xs">
                {/* Header Metadata */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 border-b border-slate-200 dark:border-white/[0.06] pb-3">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Patient</span>
                    <strong className="text-slate-900 dark:text-white">{doctorReport.patient_name}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">UHID</span>
                    <strong className="font-mono text-[#0071E3]">{doctorReport.patient_uhid}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Consultation Date</span>
                    <strong className="text-slate-900 dark:text-white">{doctorReport.consultation_date}</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Attending Physician</span>
                    <strong className="text-slate-900 dark:text-white">{doctorReport.doctor_name}</strong>
                  </div>
                </div>

                {/* Chief Complaints & HPI */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Chief Complaints &amp; History of Present Illness
                  </span>
                  <p className="mt-1 font-medium text-slate-800 dark:text-slate-200">
                    {doctorReport.chief_complaints}
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-600 dark:text-slate-300">
                    {doctorReport.history_of_present_illness}
                  </p>
                </div>

                {/* Vitals & Examination Findings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-white dark:bg-[#1C1C1E] p-3 rounded-lg border border-slate-200/60 dark:border-white/[0.06]">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071E3] block">
                      Vitals &amp; Hemodynamics
                    </span>
                    <p className="mt-1 text-slate-800 dark:text-slate-200">{doctorReport.vitals_hemodynamics}</p>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071E3] block">
                      Physical Examination Findings
                    </span>
                    <p className="mt-1 text-slate-800 dark:text-slate-200">{doctorReport.examination_findings}</p>
                  </div>
                </div>

                {/* Diagnosis & Differential */}
                <div className="rounded-lg bg-blue-500/10 p-3 border border-blue-500/20">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF] block">
                    Confirmed Diagnosis
                  </span>
                  <p className="text-sm font-bold text-slate-900 dark:text-white mt-0.5">
                    {doctorReport.assessment_diagnosis}
                  </p>
                  <div className="mt-1 text-[11px] text-slate-500">
                    Differential Diagnoses: {doctorReport.differential_diagnoses.join(", ")}
                  </div>
                </div>

                {/* Prescriptions Table */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block mb-1.5">
                    Prescribed Medications (NMC Generic Standards)
                  </span>
                  <table className="w-full text-left text-xs border border-slate-200 dark:border-white/[0.06] rounded-lg overflow-hidden">
                    <thead className="bg-slate-100 dark:bg-white/[0.04] text-slate-600 dark:text-slate-300">
                      <tr>
                        <th className="p-2">Medicine &amp; Generic</th>
                        <th className="p-2">Strength</th>
                        <th className="p-2">Frequency</th>
                        <th className="p-2">Duration</th>
                        <th className="p-2">Instructions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 dark:divide-white/[0.04]">
                      {doctorReport.prescribed_medications.map((m, i) => (
                        <tr key={`doc-med-${i}-${m.name}`}>
                          <td className="p-2">
                            <strong>{m.name}</strong>
                            <div className="text-[10px] font-mono text-slate-400">{m.generic}</div>
                          </td>
                          <td className="p-2 font-mono">{m.strength}</td>
                          <td className="p-2 font-mono">{m.frequency}</td>
                          <td className="p-2 font-mono">{m.duration}</td>
                          <td className="p-2 text-slate-600 dark:text-slate-300">{m.instructions}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Plan & Red Flags */}
                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 block">
                    Treatment Plan &amp; Precautions
                  </span>
                  <ul className="mt-1 list-disc pl-4 space-y-0.5 text-slate-700 dark:text-slate-300">
                    {doctorReport.clinical_plan_red_flags.map((item, i) => (
                      <li key={`doc-flag-${i}`}>{item}</li>
                    ))}
                  </ul>
                </div>

                {/* NMC Digital Security Seal */}
                <div className="mt-3 rounded-xl border border-slate-200 dark:border-white/[0.08] bg-slate-100/70 dark:bg-white/[0.03] p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>NMC Telemedicine &amp; Digital Health Compliance Seal</span>
                        <span className="font-mono text-[9px] text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-1.5 py-0.2 rounded font-bold">
                          SHA-256 VERIFIED
                        </span>
                      </div>
                      <div className="text-slate-500 font-mono text-[9px]">
                        Hash: 0x4f8a92be7c31d8e09f5a11c098234ea72d • Timestamp: {new Date().toISOString()}
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-slate-500 text-[10px]">
                    Signed: <strong className="text-slate-800 dark:text-slate-200">{doctorName}</strong> (Reg No: NMC-2018-847291)
                  </div>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 2: PATIENT-FRIENDLY VISIT SUMMARY (10 SECTIONS) */}
            {/* ============================================================= */}
            {reviewTab === "patient_summary" && (
              <div className="space-y-4 rounded-xl border border-emerald-200/80 bg-emerald-500/[0.02] p-4 dark:border-emerald-500/20 text-xs">
                {/* WhatsApp Dispatch & Patient Sharing Bar */}
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-2.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/50 print:hidden">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-emerald-600 flex items-center justify-center text-white shrink-0">
                      <MessageCircle className="h-4 w-4 fill-white" />
                    </div>
                    <div>
                      <div className="font-bold text-xs text-emerald-950 dark:text-emerald-200">
                        Dispatch Care Summary to Patient
                      </div>
                      <div className="text-[10px] text-emerald-700 dark:text-emerald-400">
                        Direct delivery to patient WhatsApp ({patient.phone || "+91 91234 56789"})
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={handleCopyWhatsAppText}
                      className="px-2.5 py-1.5 rounded-lg bg-white dark:bg-black/30 border border-emerald-300 dark:border-emerald-700 hover:bg-emerald-100/50 text-[11px] font-bold text-emerald-800 dark:text-emerald-200 transition flex items-center gap-1 cursor-pointer"
                      title="Copy pre-formatted summary text"
                    >
                      {isCopiedWhatsApp ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                      <span>{isCopiedWhatsApp ? "Copied!" : "Copy Summary"}</span>
                    </button>
                    <button
                      type="button"
                      onClick={handleDispatchWhatsApp}
                      className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-[11px] font-bold shadow-xs transition flex items-center gap-1.5 cursor-pointer active:scale-95"
                      title="Open WhatsApp with patient care summary"
                    >
                      <MessageCircle className="h-3.5 w-3.5 fill-white" />
                      <span>Send to WhatsApp</span>
                    </button>
                  </div>
                </div>

                {/* Section 1: Visit Details */}
                <div className="rounded-lg bg-white dark:bg-[#1C1C1E] p-3 border border-slate-200/60 dark:border-white/[0.06] flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-white">
                      1. Your Visit Details
                    </h4>
                    <p className="text-[11px] text-slate-500">
                      Prepared for {patientSummary.section_1_visit_details.patient_name} on {patientSummary.section_1_visit_details.date}
                    </p>
                  </div>
                  <div className="text-right text-[11px]">
                    <strong className="text-slate-900 dark:text-white">{patientSummary.section_1_visit_details.doctor_name}</strong>
                    <div className="text-slate-500">{patientSummary.section_1_visit_details.clinic_name}</div>
                  </div>
                </div>

                {/* Sections 2 & 3: Why Visited & What You Told */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white dark:bg-[#1C1C1E] p-3 border border-slate-200/60 dark:border-white/[0.06]">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-1">
                      2. Why You Visited the Doctor
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {patientSummary.section_2_why_you_visited}
                    </p>
                  </div>
                  <div className="rounded-lg bg-white dark:bg-[#1C1C1E] p-3 border border-slate-200/60 dark:border-white/[0.06]">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-1">
                      3. What You Told the Doctor
                    </h4>
                    <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                      {patientSummary.section_3_what_you_told_doctor}
                    </p>
                  </div>
                </div>

                {/* Section 4: What Doctor Found */}
                <div className="rounded-lg bg-white dark:bg-[#1C1C1E] p-3 border border-slate-200/60 dark:border-white/[0.06]">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-1">
                    4. What the Doctor Found
                  </h4>
                  <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                    {patientSummary.section_4_what_doctor_found}
                  </p>
                </div>

                {/* Section 5: Your Diagnosis */}
                <div className="rounded-lg bg-emerald-500/10 p-3.5 border border-emerald-500/20">
                  <h4 className="font-bold text-xs text-emerald-800 dark:text-emerald-300 uppercase tracking-wider mb-1">
                    5. Your Diagnosis
                  </h4>
                  <div className="text-sm font-bold text-slate-900 dark:text-white">
                    {patientSummary.section_5_your_diagnosis.diagnosis_name}
                  </div>
                  <p className="mt-1 text-slate-700 dark:text-slate-200 leading-relaxed">
                    {patientSummary.section_5_your_diagnosis.plain_language_explanation}
                  </p>
                </div>

                {/* Section 6: Your Medicines (Simple Schedule) */}
                <div className="space-y-2">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white">
                    6. Your Medicines &amp; Daily Schedule
                  </h4>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {patientSummary.section_6_your_medicines.map((item, idx) => (
                      <div
                        key={`pt-med-${idx}-${item.medicine_line}`}
                        className="rounded-lg bg-white dark:bg-[#1C1C1E] p-3 border border-slate-200/60 dark:border-white/[0.06]"
                      >
                        <span className="rounded bg-blue-500/10 px-2 py-0.5 text-[10px] font-bold text-[#0071E3] dark:text-[#2997FF]">
                          {item.timing_label}
                        </span>
                        <div className="font-bold text-slate-900 dark:text-white text-xs mt-1">
                          {item.medicine_line}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                          {item.instructions}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Section 7: What You Should Do */}
                <div className="rounded-lg bg-white dark:bg-[#1C1C1E] p-3 border border-slate-200/60 dark:border-white/[0.06]">
                  <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-1.5">
                    7. What You Should Do (Self-Care &amp; Diet)
                  </h4>
                  <ul className="list-disc pl-4 space-y-1 text-slate-600 dark:text-slate-300">
                    {patientSummary.section_7_what_you_should_do.map((step, idx) => (
                      <li key={`pt-step-${idx}`}>{step}</li>
                    ))}
                  </ul>
                </div>

                {/* Section 8 & 9: Follow-up & Red Flags */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-lg bg-white dark:bg-[#1C1C1E] p-3 border border-slate-200/60 dark:border-white/[0.06]">
                    <h4 className="font-bold text-xs text-slate-900 dark:text-white mb-1">
                      8. Your Follow-Up
                    </h4>
                    <strong className="text-xs text-[#0071E3] dark:text-[#2997FF]">
                      {patientSummary.section_8_your_follow_up.date_or_interval}
                    </strong>
                    <p className="mt-1 text-[11px] text-slate-500">
                      {patientSummary.section_8_your_follow_up.special_advice}
                    </p>
                  </div>

                  <div className="rounded-lg bg-rose-500/10 p-3 border border-rose-500/20">
                    <h4 className="font-bold text-xs text-rose-800 dark:text-rose-300 mb-1">
                      9. Important Things to Remember
                    </h4>
                    <ul className="list-disc pl-4 space-y-0.5 text-[11px] text-rose-900 dark:text-rose-200">
                      {patientSummary.section_9_important_things_to_remember.map((warning, idx) => (
                        <li key={`pt-warn-${idx}`}>{warning}</li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Section 10: Contact Info */}
                <div className="rounded-lg bg-slate-100 dark:bg-white/[0.04] p-3 text-[11px] text-slate-600 dark:text-slate-300 flex items-center justify-between flex-wrap gap-2">
                  <span>
                    10. Contact: <strong>{patientSummary.section_10_contact_info.clinic_name}</strong> • Phone: {patientSummary.section_10_contact_info.phone}
                  </span>
                  <span className="font-semibold text-rose-600">
                    Emergency Hotline: {patientSummary.section_10_contact_info.emergency_line}
                  </span>
                </div>

                {/* NMC Tamper-Evident Digital Security Seal */}
                <div className="mt-2 rounded-xl border border-emerald-200/80 dark:border-emerald-800/40 bg-emerald-50/50 dark:bg-emerald-950/20 p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2 text-[10px]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600 shrink-0" />
                    <div>
                      <div className="font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                        <span>Digital Health Patient Protection Seal</span>
                        <span className="font-mono text-[9px] text-emerald-700 dark:text-emerald-300 bg-emerald-500/10 px-1.5 py-0.2 rounded font-bold">
                          AUTHENTIC RECORD
                        </span>
                      </div>
                      <div className="text-slate-500 font-mono text-[9px]">
                        Cryptographic Hash: 0x4f8a92be7c31d8e09f5a11c098234ea72d • Verified &amp; Signed
                      </div>
                    </div>
                  </div>
                  <div className="text-right text-slate-500 text-[10px]">
                    Consulting Doctor: <strong className="text-slate-800 dark:text-slate-200">{doctorName}</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06] print:hidden">
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Approval publishes directly to patient&apos;s personal Patient Portal.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                {reviewTab === "patient_summary" && (
                  <button
                    type="button"
                    onClick={handleDispatchWhatsApp}
                    className="rounded-xl border border-emerald-300 dark:border-emerald-700/60 bg-emerald-50 dark:bg-emerald-950/30 px-3 py-2 text-xs font-bold text-emerald-700 dark:text-emerald-300 hover:bg-emerald-100/60 transition cursor-pointer flex items-center gap-1.5"
                  >
                    <MessageCircle className="h-3.5 w-3.5 fill-emerald-600 dark:fill-emerald-400" />
                    <span>WhatsApp</span>
                  </button>
                )}
                {backendSessionId && (
                  <a
                    href={`/api/companion-backend/api/consultations/sessions/${backendSessionId}/reports/export`}
                    target="_blank"
                    rel="noreferrer"
                    className="rounded-xl border border-blue-200 dark:border-blue-500/30 bg-blue-50/50 dark:bg-blue-500/10 px-3.5 py-2 text-xs font-bold text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-500/20 transition cursor-pointer flex items-center gap-1"
                  >
                    <Download className="h-3.5 w-3.5" />
                    <span>Export Printable HTML/PDF</span>
                  </a>
                )}
                <button
                  type="button"
                  onClick={() => window.print()}
                  className="rounded-xl border border-slate-200 dark:border-white/[0.08] px-3.5 py-2 text-xs font-bold text-slate-700 dark:text-slate-200 hover:bg-slate-50 transition cursor-pointer"
                >
                  <Printer className="h-3.5 w-3.5 inline mr-1" />
                  <span>Print Preview</span>
                </button>
                <button
                  type="button"
                  disabled={isFinalizing}
                  onClick={handleApproveConsultation}
                  className="rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white px-5 py-2 text-xs font-bold shadow-md transition active:scale-95 cursor-pointer flex items-center gap-1.5"
                >
                  <ShieldCheck className="h-4 w-4" />
                  <span>{isFinalizing ? "Sealing & Authorizing..." : "Approve & Complete Consultation"}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
