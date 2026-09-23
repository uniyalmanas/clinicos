"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Bot, 
  X, 
  Send, 
  Mic, 
  MicOff, 
  Calendar, 
  ChevronRight, 
  Sparkles,
  Phone,
  Search,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

interface ActionButton {
  label: string;
  href: string;
}

interface ChatMessage {
  id: string;
  sender: "bot" | "user";
  text: string;
  actionButton?: ActionButton;
}

const QUICK_PROMPTS = [
  "Acne & Skin",
  "Tooth Pain",
  "Child Fever",
  "Joint Pain",
  "OPD Fees",
  "Live Queue"
];

export default function DocSphereAIAgent({
  isOpenExternal,
  onCloseExternal
}: {
  isOpenExternal?: boolean;
  onCloseExternal?: () => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "msg-welcome",
      sender: "bot",
      text: "Hello! I am your DocSphere Clinic Assistant for Dehradun. You can type or tap the mic 🎙️ to ask about specialists, fees, live OPD queues, or book an appointment.",
      actionButton: {
        label: "Find Doctors in Dehradun",
        href: "/search"
      }
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Sync external open state if provided
  useEffect(() => {
    if (isOpenExternal !== undefined) {
      setIsOpen(isOpenExternal);
    }
  }, [isOpenExternal]);

  // Check speech recognition capability
  useEffect(() => {
    if (typeof window !== "undefined") {
      const hasSupport = !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
      setSpeechSupported(hasSupport);
    }
  }, []);

  // Auto-scroll chat
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  // Gentle acoustic feedback for voice toggle
  const playAudioChime = (type: "start" | "stop") => {
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      const now = ctx.currentTime;
      if (type === "start") {
        osc.frequency.setValueAtTime(440, now);
        osc.frequency.exponentialRampToValueAtTime(880, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      } else {
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(440, now + 0.1);
        gain.gain.setValueAtTime(0.08, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
        osc.start(now);
        osc.stop(now + 0.15);
      }
    } catch {}
  };

  // Toggle Voice-to-Text
  const toggleListening = () => {
    if (isListening) {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.stop();
        } catch {}
      }
      setIsListening(false);
      return;
    }

    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      alert("Voice recognition is not supported in this browser. Please type your query in the box below.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
        playAudioChime("start");
      };

      recognition.onresult = (event: any) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
          transcript += event.results[i][0].transcript;
        }
        if (transcript) {
          setInputQuery(transcript);
        }
      };

      recognition.onerror = () => {
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
        playAudioChime("stop");
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err) {
      setIsListening(false);
    }
  };

  // Intent matching logic
  const matchIntent = (q: string): { text: string; actionButton?: ActionButton } => {
    const lower = q.toLowerCase();

    // Dental / Teeth
    if (lower.includes("tooth") || lower.includes("teeth") || lower.includes("dental") || lower.includes("dentist") || lower.includes("gum") || lower.includes("cavity") || lower.includes("root canal")) {
      return {
        text: "For dental pain, root canals, or gum bleeding, we recommend Dr. Aditi Joshi (MDS Endodontics & Dental Surgery) at Smile Craft Dental, EC Road. Consultation is ₹400 with 0% markup.",
        actionButton: {
          label: "Book Dr. Aditi Joshi (₹400)",
          href: "/book?doctor=dr-aditi-joshi"
        }
      };
    }

    // Dermatology / Skin / Hair
    if (lower.includes("skin") || lower.includes("rash") || lower.includes("acne") || lower.includes("hair") || lower.includes("itch") || lower.includes("derma") || lower.includes("eczema")) {
      return {
        text: "For acne, red rashes, allergic dermatitis, or hair loss, we recommend Dr. Rahul Sharma (MD Dermatology) at Derma Care Skin & Laser, Rajpur Road. Consultation is ₹600 with direct token tracking.",
        actionButton: {
          label: "Book Dr. Rahul Sharma (₹600)",
          href: "/book?doctor=dr-rahul-sharma"
        }
      };
    }

    // Pediatrics / Child
    if (lower.includes("child") || lower.includes("baby") || lower.includes("kid") || lower.includes("pediatric") || lower.includes("vaccin")) {
      return {
        text: "For infant care, child fevers, or vaccinations, consult Dr. Vikram Sethi (DNB Pediatrics) at Dron Child & Newborn Clinic, Chakrata Road. Consultation fee is ₹500.",
        actionButton: {
          label: "Book Dr. Vikram Sethi (₹500)",
          href: "/book?doctor=dr-vikram-sethi"
        }
      };
    }

    // Orthopaedics / Bones / Joints
    if (lower.includes("joint") || lower.includes("bone") || lower.includes("knee") || lower.includes("fracture") || lower.includes("ortho") || lower.includes("spine") || lower.includes("back pain")) {
      return {
        text: "For joint pain, knee stiffness, or fractures, consult Dr. Rohit Sureka (MS Orthopaedics) at Sureka Bone & Joint, Ballupur Chowk. Consultation fee is ₹600 with zero markup.",
        actionButton: {
          label: "Book Dr. Rohit Sureka (₹600)",
          href: "/book?doctor=dr-rohit-sureka"
        }
      };
    }

    // ENT
    if (lower.includes("ear") || lower.includes("throat") || lower.includes("nose") || lower.includes("sinus") || lower.includes("ent") || lower.includes("tonsil") || lower.includes("vertigo")) {
      return {
        text: "For ear ache, throat infection, sinus block, or vertigo, consult Dr. Priya Bansal (MS ENT) at Bansal ENT Centre on Haridwar Road. Consultation fee is ₹500.",
        actionButton: {
          label: "Book Dr. Priya Bansal (₹500)",
          href: "/book?doctor=dr-priya-bansal"
        }
      };
    }

    // General Physician / Fever / BP / Sugar
    if (lower.includes("fever") || lower.includes("cough") || lower.includes("cold") || lower.includes("sugar") || lower.includes("diabetes") || lower.includes("bp") || lower.includes("general")) {
      return {
        text: "For acute fevers, viral illness, blood pressure, or diabetes, consult Dr. Harish K C (MD General Medicine) at Doon Medicare near Clock Tower. Consultation fee is ₹400.",
        actionButton: {
          label: "Book Dr. Harish K C (₹400)",
          href: "/book?doctor=dr-harish-k-c"
        }
      };
    }

    // Fees & Zero-Markup
    if (lower.includes("fee") || lower.includes("charge") || lower.includes("cost") || lower.includes("price") || lower.includes("commission") || lower.includes("markup")) {
      return {
        text: "DocSphere has 100% Zero Aggregator Markup. You pay the doctor's exact clinic fee (₹400 to ₹600) directly via UPI or Cash at the counter with 0% commission.",
        actionButton: {
          label: "View All Doctor Fees",
          href: "/search"
        }
      };
    }

    // Timings & Live Queue
    if (lower.includes("timing") || lower.includes("time") || lower.includes("hour") || lower.includes("queue") || lower.includes("token") || lower.includes("wait") || lower.includes("opd")) {
      return {
        text: "Morning OPD runs 10:00 AM – 2:00 PM, and Evening OPD runs 5:00 PM – 8:30 PM. Your live token ticker updates right on your phone so you can skip waiting room crowds.",
        actionButton: {
          label: "Reserve Live OPD Token",
          href: "/book"
        }
      };
    }

    // Emergency
    if (lower.includes("emergency") || lower.includes("chest pain") || lower.includes("severe") || lower.includes("accident") || lower.includes("breath")) {
      return {
        text: "⚠️ For acute medical emergencies, please call 108 immediately (Uttarakhand Emergency Medical Service) or reach the nearest hospital casualty.",
        actionButton: {
          label: "Emergency Call: 108",
          href: "tel:108"
        }
      };
    }

    // Default friendly assistant fallback
    return {
      text: "I can help you find verified doctors in Dehradun, explain zero-markup consultation fees, or guide you to book a live counter token. What would you like help with?",
      actionButton: {
        label: "Find Doctors in Dehradun",
        href: "/search"
      }
    };
  };

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || inputQuery).trim();
    if (!q) return;

    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: "user",
      text: q
    };

    setMessages(prev => [...prev, userMessage]);
    setInputQuery("");

    // Fast, reliable 250ms response without external API failure
    setTimeout(() => {
      const match = matchIntent(q);
      const botMessage: ChatMessage = {
        id: `bot-${Date.now()}`,
        sender: "bot",
        text: match.text,
        actionButton: match.actionButton
      };
      setMessages(prev => [...prev, botMessage]);
    }, 250);
  };

  const handleClose = () => {
    if (isListening && recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {}
      setIsListening(false);
    }
    setIsOpen(false);
    if (onCloseExternal) onCloseExternal();
  };

  return (
    <>
      {/* 1. COMPACT FLOATING TRIGGER BUTTON (Minimal, small footprint) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-5 right-5 z-50 flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-full bg-[#0071E3] hover:bg-[#0077ED] text-white shadow-lg shadow-blue-500/25 border border-white/20 transition hover:scale-105 active:scale-95 cursor-pointer group"
          aria-label="Ask DocSphere Assistant"
          title="Ask DocSphere Assistant (Voice & Chat)"
        >
          <div className="relative flex items-center justify-center">
            <Bot className="h-5 w-5 text-white" />
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
        </button>
      )}

      {/* 2. COMPACT CHAT WINDOW (Does NOT consume all screen: w-[340px] h-[450px]) */}
      {isOpen && (
        <div className="fixed bottom-5 right-4 sm:bottom-6 sm:right-6 z-50 w-[330px] sm:w-[360px] max-w-[calc(100vw-2rem)] h-[450px] max-h-[70vh] flex flex-col rounded-2xl border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-4 duration-200">
          {/* HEADER */}
          <div className="flex items-center justify-between px-3.5 py-2.5 border-b border-black/[0.06] dark:border-white/[0.08] bg-slate-50/80 dark:bg-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#0071E3] text-white shadow-2xs">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-bold text-[#1D1D1F] dark:text-white leading-tight">
                    DocSphere Assistant
                  </span>
                  <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                <p className="text-[10px] text-[#86868B] dark:text-[#8E8E93] leading-tight">
                  Dehradun • Voice &amp; Chat
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[#86868B] hover:text-[#1D1D1F] hover:bg-black/[0.05] dark:hover:bg-white/[0.08] dark:hover:text-white transition cursor-pointer"
              aria-label="Close Assistant"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* MESSAGES FEED */}
          <div className="flex-1 overflow-y-auto p-3 space-y-2.5 text-xs text-[#1D1D1F] dark:text-white">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex flex-col ${m.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3 py-2 text-xs leading-relaxed ${
                    m.sender === "user"
                      ? "bg-[#0071E3] text-white rounded-br-2xs"
                      : "bg-[#ECEEF2] text-[#1D1D1F] dark:bg-[#2C2C2E] dark:text-[#F5F5F7] rounded-bl-2xs"
                  }`}
                >
                  {m.text}
                </div>

                {/* 1-Click Action Button */}
                {m.actionButton && (
                  <Link
                    href={m.actionButton.href}
                    onClick={handleClose}
                    className="mt-1.5 inline-flex items-center gap-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 px-3 py-1 text-[11px] font-bold text-white shadow-2xs transition active:scale-95"
                  >
                    <Calendar className="h-3 w-3" />
                    <span>{m.actionButton.label}</span>
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {/* QUICK PROMPTS CHIPS */}
          <div className="border-t border-black/[0.04] dark:border-white/[0.06] bg-slate-50/60 dark:bg-black/20 px-2 py-1.5 flex gap-1.5 overflow-x-auto no-scrollbar">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="shrink-0 rounded-full border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] px-2.5 py-0.5 text-[10px] font-semibold text-[#1D1D1F] dark:text-[#F5F5F7] hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-950/40 dark:hover:text-blue-400 transition"
              >
                {prompt}
              </button>
            ))}
          </div>

          {/* INPUT BAR WITH VOICE-TO-TEXT OPTION */}
          <div className="border-t border-black/[0.06] dark:border-white/[0.08] p-2 bg-white dark:bg-[#1C1C1E] flex items-center gap-1.5">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder={isListening ? "Listening... Speak now 🎙️" : "Type symptoms or questions..."}
              className={`flex-1 rounded-xl border px-3 py-1.5 text-xs text-[#1D1D1F] dark:text-white focus:outline-none transition ${
                isListening 
                  ? "border-red-500 bg-red-500/10 placeholder-red-500 animate-pulse" 
                  : "border-black/[0.1] dark:border-white/[0.12] bg-[#ECEEF2]/40 dark:bg-[#2C2C2E]/60 focus:border-[#0071E3]"
              }`}
            />

            {/* Voice-to-Text Button */}
            {speechSupported && (
              <button
                type="button"
                onClick={toggleListening}
                className={`flex h-8 w-8 items-center justify-center rounded-xl transition cursor-pointer ${
                  isListening
                    ? "bg-red-500 text-white animate-pulse shadow-sm"
                    : "bg-black/[0.05] dark:bg-white/[0.08] text-[#86868B] hover:text-[#0071E3] hover:bg-blue-500/10"
                }`}
                title={isListening ? "Stop listening" : "Speak (Voice-to-Text)"}
                aria-label={isListening ? "Stop voice listening" : "Start voice listening"}
              >
                {isListening ? (
                  <MicOff className="h-4 w-4" />
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </button>
            )}

            {/* Send Button */}
            <button
              type="button"
              onClick={() => handleSend()}
              disabled={!inputQuery.trim()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-[#0071E3] text-white hover:bg-[#0077ED] disabled:opacity-40 disabled:cursor-not-allowed transition cursor-pointer"
              aria-label="Send query"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
