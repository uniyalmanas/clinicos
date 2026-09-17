"use client";

import React, { useState } from "react";
import Link from "next/link";
import { 
  Bot, 
  MessageSquare, 
  X, 
  Send, 
  Calendar, 
  Clock, 
  MapPin, 
  Phone, 
  Sparkles, 
  ChevronRight,
  ShieldCheck
} from "lucide-react";

interface AIReceptionistProps {
  doctorName: string;
  doctorSlug: string;
  specialization: string;
  clinicName: string;
  clinicAddress: string;
  consultationFee: number;
  opdTimings: string;
  phone: string;
}

interface ChatMessage {
  sender: "bot" | "user";
  text: string;
  actionButton?: {
    label: string;
    href: string;
  };
}

export default function AIReceptionistWidget({
  doctorName,
  doctorSlug,
  specialization,
  clinicName,
  clinicAddress,
  consultationFee,
  opdTimings,
  phone
}: AIReceptionistProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputQuery, setInputQuery] = useState("");
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      sender: "bot",
      text: `Hello! I am ${doctorName}'s AI Clinic Receptionist. How can I help you today? You can ask about consultation timings, OPD fees, directions, or booking a live clinic token.`,
      actionButton: {
        label: `Book Live Token (₹${consultationFee})`,
        href: `/book?doctor=${doctorSlug}`
      }
    }
  ]);

  const handleSend = (textToSend?: string) => {
    const q = (textToSend || inputQuery).trim();
    if (!q) return;

    // Append user message
    const newHistory: ChatMessage[] = [...messages, { sender: "user", text: q }];
    setMessages(newHistory);
    setInputQuery("");

    // AI Intent matching based on clinic metadata
    setTimeout(() => {
      const qLower = q.toLowerCase();
      let botReply: ChatMessage;

      if (qLower.includes("timing") || qLower.includes("time") || qLower.includes("open") || qLower.includes("hours") || qLower.includes("available")) {
        botReply = {
          sender: "bot",
          text: `${doctorName} is available at ${clinicName} during: ${opdTimings}. Would you like to reserve a live token for today's session?`,
          actionButton: {
            label: "Get Next Token",
            href: `/book?doctor=${doctorSlug}`
          }
        };
      } else if (qLower.includes("fee") || qLower.includes("cost") || qLower.includes("charge") || qLower.includes("price")) {
        botReply = {
          sender: "bot",
          text: `The in-clinic consultation fee for ${doctorName} (${specialization}) is ₹${consultationFee}. We accept UPI (Google Pay, PhonePe, Paytm) and Cash at the front desk.`,
          actionButton: {
            label: `Book Token for ₹${consultationFee}`,
            href: `/book?doctor=${doctorSlug}`
          }
        };
      } else if (qLower.includes("address") || qLower.includes("location") || qLower.includes("where") || qLower.includes("directions")) {
        botReply = {
          sender: "bot",
          text: `The clinic is located at: ${clinicAddress}. Landmark is easily accessible with parking on-site.`,
          actionButton: {
            label: "Open Google Maps Directions",
            href: `https://maps.google.com/?q=${encodeURIComponent(clinicAddress)}`
          }
        };
      } else if (qLower.includes("book") || qLower.includes("appointment") || qLower.includes("token") || qLower.includes("slot")) {
        botReply = {
          sender: "bot",
          text: `You can instantly book a confirmed token with zero pre-payment required. Your token number and wait-time will be messaged to your WhatsApp right away.`,
          actionButton: {
            label: "Confirm Appointment Booking",
            href: `/book?doctor=${doctorSlug}`
          }
        };
      } else if (qLower.includes("emergency") || qLower.includes("severe") || qLower.includes("chest pain") || qLower.includes("bleeding")) {
        botReply = {
          sender: "bot",
          text: `⚠️ If this is an acute medical emergency, please call 108 or proceed immediately to the nearest hospital emergency casualty OPD.`,
          actionButton: {
            label: `Call Clinic Desk: ${phone}`,
            href: `tel:${phone}`
          }
        };
      } else {
        botReply = {
          sender: "bot",
          text: `${doctorName} is a verified ${specialization} at ${clinicName}. You can book your appointment online, call our front desk, or visit during OPD hours: ${opdTimings}.`,
          actionButton: {
            label: "Book Appointment Now",
            href: `/book?doctor=${doctorSlug}`
          }
        };
      }

      setMessages([...newHistory, botReply]);
    }, 450);
  };

  const quickPrompts = [
    "What are OPD timings?",
    `What is consultation fee?`,
    "Where is clinic located?",
    "Book an appointment"
  ];

  return (
    <>
      {/* Floating Toggle Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 flex items-center gap-2.5 rounded-full bg-gradient-to-r from-brand-600 to-teal-600 px-4 py-3 text-xs font-bold text-white shadow-xl shadow-brand-600/25 transition-all hover:scale-105 focus:outline-none"
        >
          <div className="relative flex h-3 w-3">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
            <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
          </div>
          <Bot className="h-4 w-4" />
          <span>Ask Clinic AI Receptionist</span>
        </button>
      )}

      {/* Interactive Chat Window */}
      {isOpen && (
        <div className="fixed bottom-6 right-6 z-50 flex h-[480px] w-96 max-w-[calc(100vw-2rem)] flex-col overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-slate-800 dark:bg-slate-900 animate-in fade-in slide-in-from-bottom-5">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-brand-600 px-4 py-3 text-white dark:border-slate-800">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/20 text-white">
                <Bot className="h-4 w-4" />
              </div>
              <div>
                <div className="text-xs font-bold leading-none">AI Clinic Receptionist</div>
                <div className="text-[10px] text-white/80 mt-0.5">{clinicName} • Online</div>
              </div>
            </div>

            <button
              onClick={() => setIsOpen(false)}
              className="rounded-lg p-1 text-white/80 hover:bg-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Conversation Feed */}
          <div className="flex-1 overflow-y-auto p-3.5 space-y-3">
            {messages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex flex-col ${msg.sender === "user" ? "items-end" : "items-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 text-xs leading-relaxed ${
                    msg.sender === "user"
                      ? "bg-brand-600 text-white rounded-br-none"
                      : "bg-slate-100 text-slate-800 dark:bg-slate-800 dark:text-slate-200 rounded-bl-none"
                  }`}
                >
                  {msg.text}
                </div>

                {msg.actionButton && (
                  <Link
                    href={msg.actionButton.href}
                    className="mt-2 inline-flex items-center gap-1 rounded-xl bg-teal-600 px-3 py-1.5 text-[11px] font-bold text-white shadow-sm hover:bg-teal-700"
                  >
                    <Calendar className="h-3 w-3" />
                    {msg.actionButton.label}
                    <ChevronRight className="h-3 w-3" />
                  </Link>
                )}
              </div>
            ))}
          </div>

          {/* Quick Prompts */}
          <div className="border-t border-slate-100 bg-slate-50 p-2 dark:border-slate-800 dark:bg-slate-950 flex flex-wrap gap-1.5">
            {quickPrompts.map((qp, i) => (
              <button
                key={i}
                onClick={() => handleSend(qp)}
                className="rounded-md bg-white border border-slate-200 px-2 py-1 text-[10px] font-medium text-slate-700 hover:bg-brand-50 hover:text-brand-700 dark:border-slate-800 dark:bg-slate-900 dark:text-slate-300"
              >
                {qp}
              </button>
            ))}
          </div>

          {/* Input Box */}
          <div className="border-t border-slate-200 p-2.5 dark:border-slate-800 flex items-center gap-2">
            <input
              type="text"
              value={inputQuery}
              onChange={(e) => setInputQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSend();
              }}
              placeholder="Ask a question..."
              className="flex-1 rounded-xl border border-slate-300 px-3 py-1.5 text-xs text-slate-900 focus:border-brand-500 focus:outline-none dark:border-slate-700 dark:bg-slate-950 dark:text-white"
            />
            <button
              onClick={() => handleSend()}
              className="flex h-8 w-8 items-center justify-center rounded-xl bg-brand-600 text-white hover:bg-brand-700"
            >
              <Send className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      )}
    </>
  );
}
