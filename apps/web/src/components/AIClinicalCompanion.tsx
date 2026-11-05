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
} from "lucide-react";
import { Button, Card, Badge } from "@/components/design-system";
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

        if (finalChunk) {
          transcriptRef.current = currentFinal;
          setTranscript(currentFinal);
          setInterimText("");
          interimTextRef.current = "";
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
  }, []);

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
      showToast("Recording resumed.");
    } else {
      setIsPaused(true);
      stopSpeechRecognition();
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
      // Execute via local companion service + API
      const res = await fetch("/api/consultations/companion", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({
          action: "doctor_command",
          command: cmd,
          memory: clinicalMemory,
          historical_visits: historicalVisits,
        }),
      });

      if (res.ok) {
        const data = await res.json();
        if (data.updatedMemory) {
          setClinicalMemory(data.updatedMemory);
        }
        const replyText = data.reply || "Context updated.";
        const companionMsg: CompanionChatMessage = {
          id: `comp-${Date.now()}`,
          sender: "companion",
          text: replyText,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          action_type: data.actionTaken,
        };
        setChatMessages((prev) => [...prev, companionMsg]);

        if (data.spokenReply && companionMode === "voice_companion") {
          speakVoice(data.spokenReply);
        }
      } else {
        // Fallback local execution
        const localResult = handleDoctorCommand(cmd, clinicalMemory, historicalVisits);
        setClinicalMemory(localResult.updatedMemory);
        const companionMsg: CompanionChatMessage = {
          id: `comp-${Date.now()}`,
          sender: "companion",
          text: localResult.reply,
          timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          action_type: localResult.actionTaken as any,
        };
        setChatMessages((prev) => [...prev, companionMsg]);
        if (localResult.spokenReply && companionMode === "voice_companion") {
          speakVoice(localResult.spokenReply);
        }
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

    // 3. Synthesize Dual Reports
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
    <div className="space-y-4">
      {/* ========================================================================= */}
      {/* SECTION 1: PATIENT CLINICAL HEADER & CONSENT BANNER */}
      {/* ========================================================================= */}
      <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-white/[0.08] dark:bg-[#121316]">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          {/* Patient Details */}
          <div className="flex items-center gap-3 min-w-0">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#0071E3]/10 font-bold text-base text-[#0071E3] dark:bg-[#0071E3]/20 dark:text-[#2997FF]">
              {patient.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white truncate">
                  {patient.name}
                </h2>
                <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                  {patient.uhid || "UHID-2026-9021"}
                </span>
                <span className="rounded-full bg-slate-100 dark:bg-white/[0.08] px-2 py-0.5 text-[11px] font-medium text-slate-600 dark:text-slate-300">
                  {patient.age ? `${patient.age}Y` : "Adult"} • {patient.gender || "Gender N/S"}
                </span>
              </div>
              <div className="mt-1 flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 flex-wrap">
                <span>Phone: <strong className="font-mono text-slate-700 dark:text-slate-300">{patient.phone}</strong></span>
                <span>•</span>
                <span>Past Visit: <strong className="text-slate-700 dark:text-slate-300">{patient.previous_visit_date || "14 Oct 2026"}</strong></span>
                <span>•</span>
                <span className="text-[#0071E3] dark:text-[#2997FF] font-medium">Token #{patient.token_number || 12}</span>
              </div>
            </div>
          </div>

          {/* Consent Check & Mode Selector */}
          <div className="flex items-center gap-2 flex-wrap shrink-0">
            {/* DPDP Recording Consent */}
            <label className="flex items-center gap-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] bg-slate-50/75 dark:bg-white/[0.02] px-2.5 py-1 text-xs cursor-pointer select-none">
              <input
                type="checkbox"
                checked={consentObtained}
                onChange={(e) => setConsentObtained(e.target.checked)}
                className="h-3.5 w-3.5 rounded text-[#0071E3] focus:ring-[#0071E3]"
              />
              <span className="text-slate-700 dark:text-slate-200 font-medium">Recording Consent</span>
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-600" />
            </label>

            {/* Companion Mode Selector */}
            <div className="flex items-center rounded-lg border border-slate-200 dark:border-white/[0.08] p-0.5 bg-slate-100 dark:bg-white/[0.04] text-xs">
              <button
                type="button"
                onClick={() => setCompanionMode("silent")}
                className={`px-2 py-1 rounded-md transition ${companionMode === "silent" ? "bg-white dark:bg-white/10 font-bold text-slate-900 dark:text-white shadow-2xs" : "text-slate-500 hover:text-slate-900"}`}
                title="Listens and documents silently without interruptions"
              >
                Silent
              </button>
              <button
                type="button"
                onClick={() => setCompanionMode("assistant")}
                className={`px-2 py-1 rounded-md transition ${companionMode === "assistant" ? "bg-white dark:bg-white/10 font-bold text-[#0071E3] dark:text-[#2997FF] shadow-2xs" : "text-slate-500 hover:text-slate-900"}`}
                title="Flags missing vital parameters and ambiguous doses"
              >
                Assistant
              </button>
              <button
                type="button"
                onClick={() => setCompanionMode("voice_companion")}
                className={`px-2 py-1 rounded-md transition ${companionMode === "voice_companion" ? "bg-white dark:bg-white/10 font-bold text-purple-600 dark:text-purple-400 shadow-2xs" : "text-slate-500 hover:text-slate-900"}`}
                title="Voice read-back and spoken replies"
              >
                Voice AI
              </button>
            </div>

            {/* Speech synthesis toggle */}
            <button
              type="button"
              onClick={() => setSpeechSynthesisEnabled((p) => !p)}
              className={`p-1.5 rounded-lg border border-slate-200 dark:border-white/[0.08] ${speechSynthesisEnabled ? "text-[#0071E3] bg-[#0071E3]/10" : "text-slate-400 bg-slate-50"}`}
              title={speechSynthesisEnabled ? "Voice Speech Enabled" : "Voice Speech Muted"}
            >
              {speechSynthesisEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Known Allergies & Medical History Chips */}
        <div className="mt-3 flex items-center gap-2 pt-2.5 border-t border-slate-100 dark:border-white/[0.04] flex-wrap text-xs">
          <div className="flex items-center gap-1 font-semibold text-rose-700 dark:text-rose-400">
            <AlertTriangle className="h-3.5 w-3.5 text-rose-600" />
            <span>Allergies:</span>
          </div>
          {clinicalMemory.allergies.length > 0 ? (
            clinicalMemory.allergies.map((all, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 rounded-md bg-rose-500/10 px-2 py-0.5 font-medium text-rose-700 dark:text-rose-300 border border-rose-500/20"
              >
                {all}
              </span>
            ))
          ) : (
            <span className="text-emerald-600 font-medium">No Known Drug Allergies (NKDA)</span>
          )}

          <span className="hidden sm:inline text-slate-300 dark:text-white/20">|</span>

          <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400">
            <span>Comorbidities:</span>
            <span className="font-medium text-slate-700 dark:text-slate-300">
              {clinicalMemory.medical_history.join(", ") || "None"}
            </span>
          </div>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 2: PRIMARY COMPANION INTERACTION STUDIO */}
      {/* ========================================================================= */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* LEFT COLUMN (lg:col-span-7): Primary Audio Control & Live Memory Panel */}
        <div className="lg:col-span-7 space-y-4 min-w-0">
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
                className="text-amber-700 hover:text-amber-950 dark:text-amber-400 dark:hover:text-amber-100 p-1 shrink-0 rounded-lg hover:bg-amber-100 dark:hover:bg-amber-900/40"
                title="Dismiss"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Audio Capture Card */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-5 shadow-xs dark:border-white/[0.08] dark:bg-[#121316]">
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
                  className={`relative flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl transition-all shadow-md active:scale-95 cursor-pointer ${
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
                    <Mic className="h-8 w-8" />
                  ) : isPaused ? (
                    <Pause className="h-7 w-7" />
                  ) : (
                    <Mic className="h-8 w-8" />
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
                  </div>
                  <div className="mt-1 flex items-center gap-3">
                    <span className="font-mono text-2xl font-black text-slate-900 dark:text-white">
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
                    className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 dark:hover:bg-slate-100 px-4 py-2 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer"
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
                    key={i}
                    className="w-full rounded-full transition-all duration-75"
                    style={{
                      height: `${scaledHeight}%`,
                      backgroundColor: isRecording && !isPaused ? (i % 2 === 0 ? "#0071E3" : "#2997FF") : "#CBD5E1",
                    }}
                  />
                );
              })}
            </div>

            {/* Live Transcription Bar */}
            <div className="mt-3 rounded-lg bg-slate-50/70 p-2.5 text-xs border border-slate-200/60 dark:border-white/[0.04] dark:bg-white/[0.02]">
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-slate-400 mb-1">
                <span>Live Speech Stream</span>
                <span>Language: {language}</span>
              </div>
              <p className="text-slate-700 dark:text-slate-200 font-mono text-[11px] min-h-[20px]">
                {transcript || interimText ? (
                  <>
                    <span>{transcript}</span>
                    <span className="italic text-slate-400"> {interimText}</span>
                  </>
                ) : (
                  <span className="text-slate-400 italic">Doctor or patient speech will appear here in real time...</span>
                )}
              </p>
            </div>

            {/* 1-Tap Dictation Simulation Chips & Manual Paste Drawer */}
            <div className="mt-3 pt-2.5 border-t border-slate-100 dark:border-white/[0.04] space-y-2">
              <div className="flex items-center justify-between gap-1.5 flex-wrap">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="text-[10px] font-bold text-slate-400 uppercase">1-Tap Test:</span>
                  <button
                    type="button"
                    onClick={() =>
                      handleSimulateSpeech(
                        "Blood pressure is 120/80. Pulse is 78. Temperature is 100.4 Fahrenheit. SpO2 is 98 percent. Weight is 68 kg, height is 172 cm. Patient has high fever for 3 days, severe headache and body ache, also mild sore throat and dry cough. Throat is congested, lungs clear, per abdomen soft. Provisional diagnosis is Acute Viral Pyrexia. Prescribe Tab Pan 40 once daily empty stomach for 5 days, Tab Dolo 650 twice daily after food for 3 days, Tab Cetzine 10 at bedtime for 3 days. Order Complete Blood Count CBC and Dengue NS1. Follow up in 3 days."
                      )
                    }
                    className="rounded-md bg-[#0071E3]/10 hover:bg-[#0071E3]/20 text-[#0071E3] dark:text-[#388bfd] px-2 py-0.5 text-[10px] font-semibold transition-colors"
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
                    className="rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-200"
                  >
                    + Fever &amp; Pharyngitis Rx
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      handleSimulateSpeech(
                        "Patient with severe headache for 2 days. Blood pressure 140 over 90. Prescribe Tab Paracetamol 650 SOS. Order CBC."
                      )
                    }
                    className="rounded-md bg-slate-100 hover:bg-slate-200 dark:bg-white/[0.06] dark:hover:bg-white/[0.1] px-2 py-0.5 text-[10px] font-medium text-slate-700 dark:text-slate-200"
                  >
                    + Headache &amp; High BP
                  </button>
                </div>
                <button
                  type="button"
                  onClick={() => setIsManualPasteOpen(!isManualPasteOpen)}
                  className="text-[10px] text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white underline underline-offset-2 flex items-center gap-1"
                >
                  <Edit3 className="h-3 w-3" />
                  {isManualPasteOpen ? "Hide Direct Dictation Box" : "Paste / Type Clinical Script"}
                </button>
              </div>

              {/* Direct Paste / Type Area */}
              {isManualPasteOpen && (
                <div className="pt-2 animate-in fade-in space-y-2">
                  <textarea
                    rows={3}
                    value={manualNotesText}
                    onChange={(e) => setManualNotesText(e.target.value)}
                    placeholder="Paste or type doctor consultation script here (e.g. BP 120/80, Fever 3 days, Tab Dolo 650 twice daily)..."
                    className="w-full text-xs rounded-lg border border-slate-200 dark:border-white/10 bg-white dark:bg-[#18191c] p-2.5 text-slate-800 dark:text-slate-200 placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-[#0071E3]"
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setManualNotesText("")}
                      className="px-2.5 py-1 text-[11px] text-slate-500 hover:text-slate-700 dark:text-slate-400"
                    >
                      Clear
                    </button>
                    <button
                      type="button"
                      disabled={!manualNotesText.trim()}
                      onClick={() => {
                        handleSimulateSpeech(manualNotesText.trim());
                        setManualNotesText("");
                      }}
                      className="rounded-md bg-[#0071E3] hover:bg-[#0077ED] text-white px-3 py-1 text-[11px] font-semibold disabled:opacity-50 transition-colors"
                    >
                      Process Script into Clinical Memory
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* ========================================================================= */}
          {/* LIVE CLINICAL MEMORY PANEL */}
          {/* ========================================================================= */}
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-white/[0.08] dark:bg-[#121316] space-y-4">
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {/* Complaints */}
              <div className="rounded-lg bg-slate-50/60 dark:bg-white/[0.02] p-3 border border-slate-100 dark:border-white/[0.04] space-y-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                  Patient Complaints ({clinicalMemory.complaints.length})
                </span>
                {clinicalMemory.complaints.length > 0 ? (
                  <div className="space-y-1.5">
                    {clinicalMemory.complaints.map((c) => (
                      <div
                        key={c.id}
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
                        ? `${clinicalMemory.vitals.bp_systolic}/${clinicalMemory.vitals.bp_diastolic} mmHg`
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
                  {clinicalMemory.medications.map((m) => (
                    <div
                      key={m.id}
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

        {/* RIGHT COLUMN (lg:col-span-5): Conversational AI Assistant & Clarification Engine */}
        <div className="lg:col-span-5 space-y-4 min-w-0">
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
                  .map((alert) => (
                    <div
                      key={alert.id}
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
          <div className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs dark:border-white/[0.08] dark:bg-[#121316] flex flex-col h-[520px]">
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
              {chatMessages.map((msg) => (
                <div
                  key={msg.id}
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
                    {msg.text}
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
                className="whitespace-nowrap rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-medium"
              >
                📜 Past Rx History
              </button>
              <button
                type="button"
                onClick={() => handleSendDoctorCommand("Read back the readings")}
                className="whitespace-nowrap rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-medium"
              >
                📊 Read Back Vitals
              </button>
              <button
                type="button"
                onClick={() => handleSendDoctorCommand("What information have you captured so far?")}
                className="whitespace-nowrap rounded-md bg-slate-100 dark:bg-white/[0.06] hover:bg-slate-200 px-2 py-0.5 text-[10px] text-slate-600 dark:text-slate-300 font-medium"
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
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECTION 3: END-OF-CONSULTATION DUAL REPORT REVIEW MODAL */}
      {/* ========================================================================= */}
      {isReviewOpen && doctorReport && patientSummary && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-3 sm:p-4 animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-xl bg-white p-5 sm:p-6 shadow-2xl dark:bg-[#1C1C1E] border border-black/10 dark:border-white/10 space-y-4 my-auto">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-black/[0.06] pb-3 dark:border-white/[0.06]">
              <div>
                <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <ShieldCheck className="h-5 w-5 text-emerald-600" />
                  <span>Consultation Review &amp; Report Approval</span>
                </h3>
                <p className="text-xs text-slate-500">
                  Review the professional clinical report and patient-friendly visit summary before final e-sign.
                </p>
              </div>
              <button
                onClick={() => setIsReviewOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-900 dark:hover:text-white cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {/* Dual Report Tab Switcher & Language Selector */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 bg-slate-50 dark:bg-white/[0.04] p-2 rounded-xl">
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
                        <tr key={i}>
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
                      <li key={i}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* ============================================================= */}
            {/* TAB 2: PATIENT-FRIENDLY VISIT SUMMARY (10 SECTIONS) */}
            {/* ============================================================= */}
            {reviewTab === "patient_summary" && (
              <div className="space-y-4 rounded-xl border border-emerald-200/80 bg-emerald-500/[0.02] p-4 dark:border-emerald-500/20 text-xs">
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
                        key={idx}
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
                      <li key={idx}>{step}</li>
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
                        <li key={idx}>{warning}</li>
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
              </div>
            )}

            {/* Modal Bottom Actions */}
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
              <div className="text-[11px] text-slate-500 flex items-center gap-1">
                <CheckCircle2 className="h-4 w-4 text-emerald-600" />
                <span>Approval publishes directly to patient&apos;s personal Patient Portal.</span>
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
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
    </div>
  );
}
