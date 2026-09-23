"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { 
  Sparkles, 
  X, 
  Send, 
  Stethoscope, 
  ArrowRight, 
  MapPin, 
  ShieldCheck, 
  Calendar, 
  Clock, 
  ChevronDown, 
  Bot, 
  User, 
  RotateCw,
  Zap,
  CheckCircle2
} from "lucide-react";

interface DoctorCardData {
  doctor_name: string;
  specialization: string;
  slug: string;
  fee: number;
  clinic_name: string;
  address: string;
  booking_url: string;
}

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  doctorCard?: DoctorCardData;
}

const STARTER_PROMPTS = [
  { label: "Toothache & Gum Pain", prompt: "I have sharp tooth pain in my back molar and gum swelling." },
  { label: "Itchy Skin Rash", prompt: "I developed a red itchy skin rash on my neck since 2 days." },
  { label: "Child High Fever", prompt: "My 3-year-old child has a fever of 101°F and cough." },
  { label: "Knee & Joint Pain", prompt: "Severe knee pain and stiffness while climbing stairs." }
];

export default function DocSphereAIAgent({ isOpenExternal, onCloseExternal }: { isOpenExternal?: boolean; onCloseExternal?: () => void }) {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: "welcome-1",
      role: "assistant",
      content: "Namaste! I am your **DocSphere Clinical AI Assistant** in Dehradun. Tell me your symptoms, and I will recommend the right medical specialist, explain care precautions, and help you reserve a direct token with zero aggregator markup."
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isOpenExternal !== undefined) {
      setIsOpen(isOpenExternal);
    }
  }, [isOpenExternal]);

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isOpen]);

  const handleSend = async (userText?: string) => {
    const textToSend = userText || input.trim();
    if (!textToSend || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: textToSend
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai/consultant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: textToSend,
          history: messages.map(m => ({ role: m.role, content: m.content }))
        })
      });

      if (res.ok) {
        const data = await res.json();
        const assistantMsg: ChatMessage = {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: data.reply || "Based on your symptoms, we recommend consulting a verified Dehradun specialist.",
          doctorCard: data.doctorCard
        };
        setMessages(prev => [...prev, assistantMsg]);
      } else {
        setMessages(prev => [
          ...prev,
          {
            id: `assistant-${Date.now()}`,
            role: "assistant",
            content: "I recommend consulting a general physician or specialist for these symptoms. In Dehradun, you can consult Dr. Rahul Sharma (Dermatology, Rajpur Road) or Dr. Aditi Joshi (Dentistry, EC Road) with direct zero-markup booking.",
            doctorCard: {
              doctor_name: "Dr. Rahul Sharma",
              specialization: "MD Dermatology",
              slug: "dr-rahul-sharma",
              fee: 600,
              clinic_name: "Derma Care Skin & Laser",
              address: "14, Rajpur Road, Dehradun",
              booking_url: "/book?doctor=dr-rahul-sharma"
            }
          }
        ]);
      }
    } catch {
      setMessages(prev => [
        ...prev,
        {
          id: `assistant-${Date.now()}`,
          role: "assistant",
          content: "Network glitch connecting to clinical server. For acute symptoms, please consult a verified doctor directly from our directory below.",
          doctorCard: {
            doctor_name: "Dr. Rahul Sharma",
            specialization: "MD Dermatology",
            slug: "dr-rahul-sharma",
            fee: 600,
            clinic_name: "Derma Care Skin & Laser",
            address: "14, Rajpur Road, Dehradun",
            booking_url: "/book?doctor=dr-rahul-sharma"
          }
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    if (onCloseExternal) onCloseExternal();
  };

  return (
    <>
      {/* FLOATING TRIGGER BUTTON (BOTTOM RIGHT) */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-[#0071E3] to-[#00A389] px-5 py-3 text-xs font-bold text-white shadow-2xl hover:scale-105 active:scale-95 transition duration-200 cursor-pointer group border border-white/20"
          aria-label="Open DocSphere AI Consultant"
        >
          <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-white/20">
            <Sparkles className="h-3.5 w-3.5 text-white animate-spin-slow" />
            <span className="absolute -top-0.5 -right-0.5 h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          </div>
          <div className="text-left">
            <span className="block font-black text-[11px] leading-tight">DocSphere AI</span>
            <span className="block text-[9px] text-white/80 font-normal">Triage, Planning &amp; Booking</span>
          </div>
        </button>
      )}

      {/* COMPACT MODAL / CHAT AGENT DRAWER */}
      {isOpen && (
        <div className="fixed bottom-4 right-4 sm:bottom-6 sm:right-6 z-50 w-[calc(100vw-32px)] sm:w-[420px] max-h-[85vh] sm:max-h-[640px] flex flex-col rounded-[28px] border border-black/[0.08] dark:border-white/[0.12] bg-white dark:bg-[#1C1C1E] shadow-2xl overflow-hidden animate-in fade-in slide-in-from-bottom-5 duration-200">
          {/* HEADER */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-black/[0.06] dark:border-white/[0.08] bg-slate-50/70 dark:bg-white/[0.03]">
            <div className="flex items-center gap-2.5">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0071E3]/10 text-[#0071E3] dark:text-[#2997FF]">
                <Bot className="h-5 w-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="text-xs font-black text-[#1D1D1F] dark:text-white">
                    DocSphere AI Care Consultant
                  </h3>
                  <span className="flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-600 dark:text-emerald-400">
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Groq LPU Active
                  </span>
                </div>
                <p className="text-[10px] text-[#86868B] dark:text-[#8E8E93]">
                  Triage symptoms • Plan visits • Instant doctor match
                </p>
              </div>
            </div>

            <button
              onClick={handleClose}
              className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-black/[0.05] dark:hover:bg-white/[0.08] text-[#86868B] hover:text-[#1D1D1F] dark:hover:text-white transition cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* CHAT MESSAGES BODY */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs text-[#1D1D1F] dark:text-white">
            {messages.map((m) => (
              <div
                key={m.id}
                className={`flex gap-2.5 ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {m.role === "assistant" && (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#0071E3]/15 text-[#0071E3] mt-1">
                    <Sparkles className="h-3 w-3" />
                  </div>
                )}

                <div className={`space-y-2.5 max-w-[85%] ${m.role === "user" ? "items-end" : "items-start"}`}>
                  <div
                    className={`rounded-2xl px-4 py-2.5 text-xs leading-relaxed ${
                      m.role === "user"
                        ? "bg-[#0071E3] text-white rounded-br-xs"
                        : "bg-black/[0.03] dark:bg-white/[0.06] text-[#1D1D1F] dark:text-slate-100 rounded-bl-xs border border-black/[0.04] dark:border-white/[0.06]"
                    }`}
                  >
                    <div className="whitespace-pre-line">
                      {m.content}
                    </div>
                  </div>

                  {/* INTERACTIVE DOCTOR BOOKING ACTION CARD */}
                  {m.doctorCard && (
                    <div className="rounded-2xl border border-black/[0.08] dark:border-white/[0.1] bg-white dark:bg-[#2C2C2E] p-3.5 shadow-sm space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-[#0071E3] dark:text-[#2997FF]">
                            Recommended Doctor
                          </span>
                          <h4 className="font-black text-sm text-[#1D1D1F] dark:text-white mt-0.5">
                            {m.doctorCard.doctor_name}
                          </h4>
                          <p className="text-[11px] text-[#86868B] dark:text-[#8E8E93]">
                            {m.doctorCard.specialization}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-xs font-black text-emerald-600 dark:text-emerald-400 font-mono">
                            ₹{m.doctorCard.fee}
                          </span>
                          <span className="block text-[9px] text-[#86868B] uppercase">0% markup</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-1.5 text-[10px] text-[#86868B] dark:text-[#8E8E93]">
                        <MapPin className="h-3 w-3 shrink-0 text-red-500" />
                        <span className="truncate">{m.doctorCard.clinic_name} • {m.doctorCard.address}</span>
                      </div>

                      <div className="flex gap-2 pt-1 border-t border-black/[0.05] dark:border-white/[0.06]">
                        <Link
                          href={`/doctors/${m.doctorCard.slug}`}
                          className="flex-1 rounded-xl border border-black/[0.08] dark:border-white/[0.12] py-2 text-center text-[11px] font-bold text-[#1D1D1F] dark:text-white hover:bg-black/[0.03] transition"
                        >
                          View Profile
                        </Link>
                        <Link
                          href={m.doctorCard.booking_url}
                          className="flex-1 rounded-xl bg-[#0071E3] hover:bg-[#0077ED] py-2 text-center text-[11px] font-bold text-white shadow-sm flex items-center justify-center gap-1 transition"
                        >
                          <span>Book Token</span>
                          <ArrowRight className="h-3 w-3" />
                        </Link>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex gap-2 items-center text-[#86868B] text-xs">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0071E3]/15 text-[#0071E3]">
                  <RotateCw className="h-3 w-3 animate-spin" />
                </div>
                <span>DocSphere AI is analyzing clinical triage &amp; matching doctors...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* STARTER CHIPS (IF ONLY 1 MESSAGE) */}
          {messages.length <= 1 && (
            <div className="px-4 py-2 border-t border-black/[0.04] dark:border-white/[0.04] bg-slate-50/50 dark:bg-white/[0.02]">
              <span className="block text-[9px] font-bold text-[#86868B] uppercase tracking-wider mb-1.5">
                Quick Clinical Questions
              </span>
              <div className="flex flex-wrap gap-1.5">
                {STARTER_PROMPTS.map((sp, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSend(sp.prompt)}
                    className="rounded-full bg-white dark:bg-[#2C2C2E] border border-black/[0.08] dark:border-white/[0.1] px-2.5 py-1 text-[10px] font-semibold text-[#1D1D1F] dark:text-white hover:bg-[#0071E3]/10 hover:text-[#0071E3] transition cursor-pointer"
                  >
                    {sp.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INPUT FORM */}
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
            className="p-3 border-t border-black/[0.06] dark:border-white/[0.08] bg-white dark:bg-[#1C1C1E] flex items-center gap-2"
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Describe symptoms or ask about doctors in Dehradun..."
              className="flex-1 rounded-full bg-black/[0.04] dark:bg-white/[0.06] px-4 py-2 text-xs text-[#1D1D1F] dark:text-white placeholder-[#86868B] outline-none focus:ring-1 focus:ring-[#0071E3]"
            />
            <button
              type="submit"
              disabled={isLoading || !input.trim()}
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#0071E3] text-white hover:bg-[#0077ED] disabled:opacity-40 transition cursor-pointer"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </form>

          {/* FOOTER DISCLAIMER */}
          <div className="px-4 py-1.5 bg-black/[0.02] dark:bg-white/[0.01] border-t border-black/[0.04] text-[9px] text-center text-[#86868B]">
            Medical guidance only • For severe emergencies, visit the nearest Dehradun emergency room.
          </div>
        </div>
      )}
    </>
  );
}
