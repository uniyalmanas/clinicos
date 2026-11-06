"use client";

import React, { useState, useCallback, useEffect, useMemo } from "react";
import Link from "next/link";
import {
  Calendar,
  Stethoscope,
  User,
  Clock,
  Plus,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Trash2,
  Edit3,
  Save,
  Lock,
  ShieldAlert,
  BriefcaseMedical,
  Activity,
  Loader2,
} from "lucide-react";

// ─────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────

const API = {
  get: async (path: string) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : null;
    const res = await fetch(path, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
  post: async (path: string, body: any) => {
    const token = typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : null;
    const res = await fetch(path, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(body),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || `HTTP ${res.status}`);
    }
    return res.json();
  },
};

// ─────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────

type Doctor = {
  id: string;
  slug: string;
  full_name: string;
  specialization: string;
  consultation_fee?: number;
  chamber_name?: string | null;
  room_number?: string | null;
};

type DoctorSchedule = {
  doctor_slug: string;
  doctor_name: string;
  specialization: string;
  chamber_name: string;
  working_days: string[]; // ["monday", "tuesday", ...]
  start_time: string; // "09:00"
  end_time: string; // "17:00"
  slot_duration: number; // minutes
  is_active: boolean;
};

type BlockedSlot = {
  id: string;
  doctor_slug: string;
  date: string; // YYYY-MM-DD
  start_time: string;
  end_time: string;
  reason: string;
  type: "leave" | "blocked" | "emergency";
};

const DAYS_OF_WEEK = [
  { key: "monday", label: "Mon", full: "Monday" },
  { key: "tuesday", label: "Tue", full: "Tuesday" },
  { key: "wednesday", label: "Wed", full: "Wednesday" },
  { key: "thursday", label: "Thu", full: "Thursday" },
  { key: "friday", label: "Fri", full: "Friday" },
  { key: "saturday", label: "Sat", full: "Saturday" },
  { key: "sunday", label: "Sun", full: "Sunday" },
];

// ─────────────────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────────────────

function formatTime(timeStr: string) {
  if (!timeStr) return "—";
  const [h, m] = timeStr.split(":");
  const hour = parseInt(h, 10);
  const ampm = hour >= 12 ? "PM" : "AM";
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}:${m} ${ampm}`;
}

function playSaveChime() {
  try {
    const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.setValueAtTime(880, now);
    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(now + 0.3);
  } catch {}
}

// ─────────────────────────────────────────────────────────
// Doctor Schedule Card
// ─────────────────────────────────────────────────────────

type ScheduleCardProps = {
  doctor: Doctor;
  schedule: DoctorSchedule | null;
  blockedSlots: BlockedSlot[];
  onEditSchedule: (d: Doctor) => void;
  onBlockDate: (d: Doctor) => void;
  onToggleActive: (d: Doctor) => void;
};

function ScheduleCard({
  doctor,
  schedule,
  blockedSlots,
  onEditSchedule,
  onBlockDate,
  onToggleActive,
}: ScheduleCardProps) {
  const todayBlocked = blockedSlots.filter(
    (b) => b.doctor_slug === doctor.slug && b.date === new Date().toISOString().split("T")[0]
  );
  const docBlocked = blockedSlots.filter((b) => b.doctor_slug === doctor.slug);

  const isActive = schedule?.is_active ?? false;
  const workingDays = schedule?.working_days || [];
  const today = new Date().toISOString().split("T")[0];
  const todayDayKey = DAYS_OF_WEEK[new Date().getDay()].key;
  const worksToday = workingDays.includes(todayDayKey);

  return (
    <div className="rounded-2xl border p-4 dark:border-white/[0.08] dark:bg-[#1C1C1E] bg-white transition hover:shadow-lg">
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#0071E3]/10 text-[#0071E3] dark:bg-[#2997FF]/10 dark:text-[#2997FF]">
            <Stethoscope className="h-4 w-4" />
          </div>
          <div>
            <div className="font-bold text-[#1D1D1F] dark:text-white">
              {doctor.full_name}
            </div>
            <div className="text-[10px] text-[#86868B] dark:text-[#636366]">
              {doctor.specialization}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-1">
          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
            isActive && worksToday
              ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
              : !isActive
              ? "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
              : "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/20"
          }`}>
            {isActive && worksToday ? "Available Today" : !isActive ? "Inactive" : "Off Today"}
          </span>
          {todayBlocked.length > 0 && (
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold border border-rose-500/20 bg-rose-50/30 text-rose-700 dark:text-rose-300">
              Blocked Today
            </span>
          )}
        </div>
      </div>

      {/* Schedule info */}
      {schedule ? (
        <div className="space-y-2 text-xs mb-3">
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Working Days:</span>
            <span className="text-[#1D1D1F] dark:text-white font-semibold truncate max-w-[200px]">
              {workingDays
                .map((d) => DAYS_OF_WEEK.find((wd) => wd.key === d)?.label || d)
                .join(", ")
            }</span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Hours:</span>
            <span className="text-[#1D1D1F] dark:text-white font-mono">
              {formatTime(schedule.start_time)} – {formatTime(schedule.end_time)}
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Slot Duration:</span>
            <span className="text-[#1D1D1F] dark:text-white font-mono">
              {schedule.slot_duration} min
            </span>
          </div>
          <div className="flex items-center justify-between text-[10px]">
            <span className="text-[#6E6E73] dark:text-[#A1A1A6]">Chamber:</span>
            <span className="text-[#1D1D1F] dark:text-white">
              {schedule.chamber_name || doctor.chamber_name || "—"}
            </span>
          </div>
        </div>
      ) : (
        <div className="rounded-lg border border-dashed border-black/[0.06] bg-[#F5F6F9] p-3 text-center text-xs text-[#86868B] dark:border-white/[0.06] dark:bg-[#121316] dark:text-[#636366] mb-3">
          No schedule configured
        </div>
      )}

      {/* Blocked slots count */}
      {docBlocked.length > 0 && (
        <div className="rounded-lg border border-rose-500/30 bg-rose-50/30 p-2 dark:bg-rose-950/20 dark:border-rose-800/30 mb-3">
          <div className="flex items-center gap-1 text-[10px] font-bold text-rose-700 dark:text-rose-300 mb-1">
            <AlertTriangle className="h-3 w-3" />
            <span>{docBlocked.length} blocked date(s)</span>
          </div>
          <div className="text-[10px] text-rose-600 dark:text-rose-400">
            {docBlocked.slice(0, 3).map((b) => `${b.date} (${b.reason})`).join(", ")}
            {docBlocked.length > 3 && ` +${docBlocked.length - 3} more`}
          </div>
        </div>
      )}

      {/* Actions */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => onEditSchedule(doctor)}
          className="rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-1.5 text-[10px] font-bold text-[#1D1D1F] hover:bg-black/[0.02] dark:border-white/[0.08] dark:bg-[#121316] dark:text-white transition"
          title="Edit schedule"
        >
          <Edit3 className="h-3 w-3 mr-1" />
          Edit
        </button>
        <button
          onClick={() => onBlockDate(doctor)}
          className="rounded-lg bg-rose-600 px-2.5 py-1.5 text-[10px] font-bold text-white hover:bg-rose-700 transition"
          title="Block date / leave"
        >
          <ShieldAlert className="h-3 w-3 mr-1" />
          Block
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Schedule Editor Modal
// ─────────────────────────────────────────────────────────

type ScheduleEditorProps = {
  open: boolean;
  onClose: () => void;
  doctor: Doctor;
  existingSchedule: DoctorSchedule | null;
  onSave: (schedule: DoctorSchedule) => void;
  loading: boolean;
};

function ScheduleEditor({
  open,
  onClose,
  doctor,
  existingSchedule,
  onSave,
  loading,
}: ScheduleEditorProps) {
  const [workingDays, setWorkingDays] = useState<string[]>(
    existingSchedule?.working_days || ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday"]
  );
  const [startTime, setStartTime] = useState(existingSchedule?.start_time || "09:00");
  const [endTime, setEndTime] = useState(existingSchedule?.end_time || "17:00");
  const [slotDuration, setSlotDuration] = useState(existingSchedule?.slot_duration || 15);
  const [chamberName, setChamberName] = useState(
    existingSchedule?.chamber_name || doctor.chamber_name || ""
  );
  const [isActive, setIsActive] = useState(existingSchedule?.is_active ?? true);

  const toggleDay = (day: string) => {
    setWorkingDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day]
    );
  };

  const handleSave = async () => {
    if (workingDays.length === 0) {
      alert("Please select at least one working day.");
      return;
    }
    const schedule: DoctorSchedule = {
      doctor_slug: doctor.slug,
      doctor_name: doctor.full_name,
      specialization: doctor.specialization,
      chamber_name: chamberName || doctor.chamber_name || "Chamber",
      working_days: workingDays,
      start_time: startTime,
      end_time: endTime,
      slot_duration: slotDuration,
      is_active: isActive,
    };
    try {
      await API.post("/api/doctors/schedule", schedule);
      playSaveChime();
      onSave(schedule);
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to save schedule.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg rounded-2xl border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#1C1C1E]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-white">
            <Calendar className="h-4 w-4 mr-2 text-[#0071E3]" />
            Schedule: {doctor.full_name}
          </h3>
          <button onClick={onClose} className="text-[#86868B] hover:text-black dark:hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }} className="space-y-4 text-xs">
          {/* Active toggle */}
          <div className="flex items-center justify-between">
            <span className="text-[#1D1D1F] dark:text-white font-semibold">Doctor Active</span>
            <button
              onClick={() => setIsActive((p) => !p)}
              className={`rounded-full px-2.5 py-1 text-[10px] font-bold transition ${
                isActive
                  ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-500/20"
                  : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200/60 dark:border-slate-700/60"
              }`}
            >
              {isActive ? "Active" : "Inactive"}
            </button>
          </div>

          {/* Working days */}
          <div>
            <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-2">Working Days</label>
            <div className="grid grid-cols-7 gap-1">
              {DAYS_OF_WEEK.map((day) => (
                <button
                  key={day.key}
                  onClick={() => toggleDay(day.key)}
                  className={`rounded-lg px-2 py-1.5 text-[10px] font-bold transition-all ${
                    workingDays.includes(day.key)
                      ? "bg-[#0071E3] text-white"
                      : "bg-black/[0.04] text-[#86868B] hover:bg-black/[0.08] dark:bg-white/[0.04] dark:text-[#636366] dark:hover:bg-white/[0.08]"
                  }`}
                >
                  {day.label}
                </button>
              ))}
            </div>
          </div>

          {/* Time inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">Start Time</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-1.5 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">End Time</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-1.5 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">Slot (min)</label>
              <select
                value={slotDuration}
                onChange={(e) => setSlotDuration(Number(e.target.value))}
                className="w-full rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-1.5 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
              >
                <option value={10}>10</option>
                <option value={15}>15</option>
                <option value={20}>20</option>
                <option value={30}>30</option>
              </select>
            </div>
          </div>

          {/* Chamber */}
          <div>
            <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">Chamber / Room</label>
            <input
              type="text"
              value={chamberName}
              onChange={(e) => setChamberName(e.target.value)}
              placeholder="e.g. Chamber 1 • Room 101"
              className="w-full rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-1.5 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
            />
          </div>

          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-black/[0.08] dark:border-white/[0.08] py-2 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-[#0071E3] px-3 py-2 text-xs font-bold text-white hover:bg-[#0077ED] disabled:opacity-50 transition flex items-center justify-center gap-1"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              <span>Save Schedule</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Block Date Modal
// ─────────────────────────────────────────────────────────

type BlockDateProps = {
  open: boolean;
  onClose: () => void;
  doctor: Doctor;
  onSave: (blocked: BlockedSlot) => void;
  loading: boolean;
};

function BlockDate({ open, onClose, doctor, onSave, loading }: BlockDateProps) {
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [startTime, setStartTime] = useState("09:00");
  const [endTime, setEndTime] = useState("10:00");
  const [reason, setReason] = useState("");
  const [type, setType] = useState<"leave" | "blocked" | "emergency">("leave");

  const handleSave = async () => {
    if (!reason.trim()) {
      alert("Please enter a reason.");
      return;
    }
    const blocked: BlockedSlot = {
      id: `block-${Date.now()}`,
      doctor_slug: doctor.slug,
      date,
      start_time: startTime,
      end_time: endTime,
      reason: reason.trim(),
      type,
    };
    try {
      await API.post("/api/doctors/block", blocked);
      playSaveChime();
      onSave(blocked);
      onClose();
    } catch (err: any) {
      alert(err.message || "Failed to block date.");
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-md rounded-2xl border border-black/[0.08] bg-white p-6 shadow-2xl dark:border-white/[0.08] dark:bg-[#1C1C1E]">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-bold text-sm text-[#1D1D1F] dark:text-white">
            <ShieldAlert className="h-4 w-4 mr-2 text-rose-600" />
            Block Date: {doctor.full_name}
          </h3>
          <button onClick={onClose} className="text-[#86868B] hover:text-black dark:hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        <form onSubmit={(e) => {
          e.preventDefault();
          handleSave();
        }} className="space-y-4 text-xs">
          <div>
            <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">Date</label>
            <input
              type="date"
              required
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="w-full rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-1.5 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">From</label>
              <input
                type="time"
                required
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-1.5 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">To</label>
              <input
                type="time"
                required
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-1.5 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
              />
            </div>
          </div>
          <div>
            <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">Type</label>
            <select
              value={type}
              onChange={(e) => setType(e.target.value as any)}
              className="w-full rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-1.5 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
            >
              <option value="leave">Leave / Holiday</option>
              <option value="blocked">Blocked (Personal)</option>
              <option value="emergency">Emergency Leave</option>
            </select>
          </div>
          <div>
            <label className="block font-semibold text-[#1D1D1F] dark:text-white mb-1">Reason</label>
            <input
              type="text"
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Annual leave, Conference, Emergency"
              className="w-full rounded-lg border border-black/[0.08] bg-[#F5F6F9] px-2.5 py-1.5 text-xs dark:border-white/[0.08] dark:bg-[#121316] dark:text-white focus:outline-none focus:ring-1 focus:ring-[#0071E3]"
            />
          </div>
          <div className="flex gap-2 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-lg border border-black/[0.08] dark:border-white/[0.08] py-2 text-xs font-semibold text-[#1D1D1F] dark:text-white hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-lg bg-rose-600 px-3 py-2 text-xs font-bold text-white hover:bg-rose-700 disabled:opacity-50 transition flex items-center justify-center gap-1"
            >
              {loading ? <Loader2 className="h-3 w-3 animate-spin" /> : null}
              <span>Block Date</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Weekly Availability Grid
// ─────────────────────────────────────────────────────────

type WeeklyGridProps = {
  doctors: Doctor[];
  schedules: DoctorSchedule[];
  blockedSlots: BlockedSlot[];
};

function WeeklyGrid({ doctors, schedules, blockedSlots }: WeeklyGridProps) {
  return (
    <div className="rounded-xl border border-black/[0.06] bg-white p-4 dark:border-white/[0.08] dark:bg-[#1C1C1E] mb-6">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-bold uppercase tracking-wider text-[#1D1D1F] dark:text-white">
          Weekly Availability Overview
        </h3>
        <span className="text-[10px] text-[#86868B] dark:text-[#636366]">
          Click any cell to edit that doctor's schedule
        </span>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-[10px] text-left">
          <thead>
            <tr className="bg-[#F5F6F9] dark:bg-[#121316]">
              <th className="px-3 py-2 font-bold text-[#6E6E73] dark:text-[#A1A1A6]">Doctor / Day</th>
              {DAYS_OF_WEEK.map((d) => (
                <th key={d.key} className="px-2 py-2 font-bold text-[#6E6E73] dark:text-[#A1A1A6] text-center">
                  {d.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {doctors.map((doc) => {
              const schedule = schedules.find((s) => s.doctor_slug === doc.slug);
              const workingDays = schedule?.working_days || [];
              const isActive = schedule?.is_active ?? false;
              return (
                <tr key={doc.slug} className="border-b border-black/[0.04] dark:border-white/[0.06]">
                  <td className="px-3 py-2">
                    <div className="flex items-center gap-2">
                      <div className={`h-5 w-5 rounded-full ${isActive ? "bg-emerald-500/20 text-emerald-600" : "bg-slate-100 text-slate-500"}`}>
                        <User className="h-2.5 w-2.5" />
                      </div>
                      <span className="font-semibold text-[#1D1D1F] dark:text-white truncate">
                        {doc.full_name}
                      </span>
                    </div>
                  </td>
                  {DAYS_OF_WEEK.map((day) => (
                    <td
                      key={day.key}
                      className={`px-2 py-2 text-center ${
                        workingDays.includes(day.key) && isActive
                          ? "bg-emerald-500/10"
                          : "bg-black/[0.02] dark:bg-white/[0.02]"
                        }`}
                    >
                      {workingDays.includes(day.key) && isActive ? (
                        <span className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400">
                          {formatTime(schedule?.start_time || "09:00")}–{formatTime(schedule?.end_time || "17:00")}
                        </span>
                      ) : (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500">—</span>
                      )}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Main Doctor Schedule Page
// ─────────────────────────────────────────────────────────

export default function DoctorSchedulePage() {
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [schedules, setSchedules] = useState<DoctorSchedule[]>([]);
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [pageLoading, setPageLoading] = useState(true);

  const [scheduleEditorOpen, setScheduleEditorOpen] = useState(false);
  const [blockDateOpen, setBlockDateOpen] = useState(false);
  const [editingDoctor, setEditingDoctor] = useState<Doctor | null>(null);
  const [blockingDoctor, setBlockingDoctor] = useState<Doctor | null>(null);
  const [loading, setLoading] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  // Load from API
  useEffect(() => {
    const loadData = async () => {
      try {
        setPageLoading(true);
        const [docsResp, schedResp, blockedResp] = await Promise.all([
          API.get("/api/doctors"),
          API.get("/api/doctors/schedules"),
          API.get("/api/doctors/blocked"),
        ]);
        const fetchedDocs: Doctor[] = Array.isArray(docsResp) ? docsResp : (docsResp.doctors || []);
        setDoctors(fetchedDocs);
        const fetchedScheds: DoctorSchedule[] = Array.isArray(schedResp) ? schedResp : (schedResp.schedules || []);
        setSchedules(fetchedScheds);
        const fetchedBlocked: BlockedSlot[] = Array.isArray(blockedResp) ? blockedResp : (blockedResp.blocked || []);
        setBlockedSlots(fetchedBlocked);
      } catch (err) {
        console.error("Failed to load doctor schedules:", err);
      } finally {
        setPageLoading(false);
      }
    };
    loadData();
  }, []);

  const handleSaveSchedule = (schedule: DoctorSchedule) => {
    setSchedules((prev) =>
      prev.map((s) => (s.doctor_slug === schedule.doctor_slug ? schedule : s))
    );
    showToast(`Schedule saved for ${schedule.doctor_name}`);
  };

  const handleSaveBlocked = (blocked: BlockedSlot) => {
    const doc = doctors.find((d) => d.slug === blocked.doctor_slug);
    setBlockedSlots((prev) => [...prev, blocked]);
    showToast(`${doc?.full_name || blocked.doctor_slug} blocked on ${blocked.date}`);
  };

  const docMap = new Map(doctors.map((d) => [d.slug, d]));

  const doctorSchedules = doctors.map((doc) => ({
    ...doc,
    schedule: schedules.find((s) => s.doctor_slug === doc.slug) || null,
  }));

  return (
    <div className="h-full flex flex-col bg-[#ECEEF2] dark:bg-black text-[#1D1D1F] dark:text-[#F5F5F7]">
      {/* ── TOP HEADER ── */}
      <header className="h-14 shrink-0 flex items-center justify-between border-b border-black/[0.06] bg-white/80 dark:border-white/[0.07] dark:bg-black/80 backdrop-blur-2xl px-4 sm:px-6">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            className="rounded-full p-1.5 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
            title="Back to Dashboard"
          >
            <X className="h-4 w-4 text-[#86868B] dark:text-[#636366]" />
          </Link>
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <div className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
              <span className="text-[11px] font-black uppercase tracking-wider text-[#1D1D1F] dark:text-white">
                Doctor Schedule Management
              </span>
            </div>
            <h1 className="text-sm font-black text-[#1D1D1F] dark:text-white tracking-tight">
              Doctor Availability & Leaves
            </h1>
            <p className="text-[10px] text-[#86868B] dark:text-[#636366]">
              Set working days, hours, chamber, and blocked dates per doctor
            </p>
          </div>
        </div>
        <button
          onClick={() => {
            setPageLoading(true);
            Promise.all([
              API.get("/api/doctors"),
              API.get("/api/doctors/schedules"),
              API.get("/api/doctors/blocked"),
            ])
              .then(([docsResp, schedResp, blockedResp]) => {
                const fetchedDocs: Doctor[] = Array.isArray(docsResp) ? docsResp : (docsResp.doctors || []);
                setDoctors(fetchedDocs);
                const fetchedScheds: DoctorSchedule[] = Array.isArray(schedResp) ? schedResp : (schedResp.schedules || []);
                setSchedules(fetchedScheds);
                const fetchedBlocked: BlockedSlot[] = Array.isArray(blockedResp) ? blockedResp : (blockedResp.blocked || []);
                setBlockedSlots(fetchedBlocked);
              })
              .catch((err) => console.error(err))
              .finally(() => setPageLoading(false));
          }}
          className="rounded-full p-1.5 hover:bg-black/[0.05] dark:hover:bg-white/[0.08] transition"
          title="Refresh"
        >
          <RefreshCw className={`h-4 w-4 text-[#86868B] dark:text-[#636366] ${pageLoading ? "animate-spin" : ""}`} />
        </button>
      </header>

      {/* Toast */}
      {toast && (
        <div className="fixed bottom-5 right-5 z-50 flex items-center gap-2.5 rounded-2xl bg-[#1D1D1F] px-4 py-3 text-xs font-bold text-white shadow-2xl border border-white/10 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
          <span>{toast}</span>
          <button onClick={() => setToast(null)} className="ml-2 text-white/60 hover:text-white">
            <X className="h-3.5 w-3.5" />
          </button>
        </div>
      )}

      <main className="flex-1 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {pageLoading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-3 text-slate-500">
            <Loader2 className="h-8 w-8 animate-spin text-[#0071E3]" />
            <p className="text-xs font-medium">Loading doctor availability & schedules...</p>
          </div>
        ) : doctors.length === 0 ? (
          <div className="text-center py-16 text-[#86868B] dark:text-[#636366]">
            <Stethoscope className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p className="text-sm font-semibold">No doctors found</p>
            <p className="text-xs mt-1">Add doctors to your clinic to configure working hours and blocked dates.</p>
          </div>
        ) : (
          <>
            {/* ── Weekly Grid ── */}
            <WeeklyGrid doctors={doctors} schedules={schedules} blockedSlots={blockedSlots} />

            {/* ── Doctor Schedule Cards ── */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {doctorSchedules.map(({ ...doc }) => {
                const schedule = schedules.find((s) => s.doctor_slug === doc.slug) || null;
                const docBlocked = blockedSlots.filter((b) => b.doctor_slug === doc.slug);
                return (
                  <ScheduleCard
                    key={doc.slug}
                    doctor={doc}
                    schedule={schedule}
                    blockedSlots={docBlocked}
                    onEditSchedule={() => {
                      setEditingDoctor(doc);
                      setScheduleEditorOpen(true);
                    }}
                    onBlockDate={() => {
                      setBlockingDoctor(doc);
                      setBlockDateOpen(true);
                    }}
                    onToggleActive={() => {
                      if (schedule) {
                        const updated = { ...schedule, is_active: !schedule.is_active };
                        setSchedules((prev) =>
                          prev.map((s) => (s.doctor_slug === doc.slug ? updated : s))
                        );
                        showToast(`${doc.full_name} marked as ${updated.is_active ? "active" : "inactive"}`);
                      }
                    }}
                  />
                );
              })}
            </div>
          </>
        )}

        {/* ── Modals ── */}
        {scheduleEditorOpen && editingDoctor && (
          <ScheduleEditor
            open={scheduleEditorOpen}
            onClose={() => {
              setScheduleEditorOpen(false);
              setEditingDoctor(null);
            }}
            doctor={editingDoctor}
            existingSchedule={schedules.find((s) => s.doctor_slug === editingDoctor.slug) || null}
            onSave={handleSaveSchedule}
            loading={loading}
          />
        )}

        {blockDateOpen && blockingDoctor && (
          <BlockDate
            open={blockDateOpen}
            onClose={() => {
              setBlockDateOpen(false);
              setBlockingDoctor(null);
            }}
            doctor={blockingDoctor}
            onSave={handleSaveBlocked}
            loading={loading}
          />
        )}
      </main>
    </div>
  );
}
