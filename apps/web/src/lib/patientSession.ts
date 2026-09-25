"use client";

import { useState, useEffect, useCallback } from "react";

export interface ActiveBooking {
  appointment_number: string;
  token_number: number;
  doctor_name: string;
  doctor_slug: string;
  specialization?: string;
  clinic_name: string;
  clinic_address: string;
  time_slot: string;
  appointment_date: string;
  fee_amount: number;
  payment_status?: string;
  payment_mode?: string;
  booked_at: string;
}

export interface PatientSession {
  id: string;
  full_name: string;
  phone: string;
  age?: number;
  gender?: string;
  active_booking?: ActiveBooking;
  created_at: string;
  last_active: string;
}

const STORAGE_KEY = "clinicos_patient_session";
const SESSION_EVENT_KEY = "clinicos_patient_session_change";

/**
 * Reads the active patient session from localStorage.
 */
export function getActivePatientSession(): PatientSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    return {
      id: typeof parsed.id === "string" && parsed.id ? parsed.id : `pat-${Date.now().toString(36)}`,
      full_name: typeof parsed.full_name === "string" && parsed.full_name.trim() ? parsed.full_name.trim() : "Patient",
      phone: typeof parsed.phone === "string" ? parsed.phone : "",
      age: typeof parsed.age === "number" ? parsed.age : undefined,
      gender: typeof parsed.gender === "string" ? parsed.gender : undefined,
      active_booking: parsed.active_booking && typeof parsed.active_booking === "object" ? parsed.active_booking : undefined,
      created_at: typeof parsed.created_at === "string" ? parsed.created_at : new Date().toISOString(),
      last_active: typeof parsed.last_active === "string" ? parsed.last_active : new Date().toISOString(),
    };
  } catch (err) {
    console.error("Failed to parse patient session from localStorage:", err);
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {}
    return null;
  }
}

/**
 * Saves or updates the patient session in localStorage and broadcasts the change.
 */
export function setActivePatientSession(session: PatientSession): void {
  if (typeof window === "undefined") return;
  try {
    session.last_active = new Date().toISOString();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    window.dispatchEvent(new CustomEvent(SESSION_EVENT_KEY, { detail: session }));
  } catch (err) {
    console.error("Failed to save patient session to localStorage:", err);
  }
}

/**
 * Updates or registers an active booking for the current patient session.
 */
export function updateActiveBooking(booking: ActiveBooking, patientName?: string, patientPhone?: string): PatientSession {
  const current = getActivePatientSession();
  const now = new Date().toISOString();

  const updatedSession: PatientSession = {
    id: current?.id || `pat-${Date.now().toString(36)}`,
    full_name: patientName || current?.full_name || "Patient",
    phone: patientPhone || current?.phone || "",
    active_booking: booking,
    created_at: current?.created_at || now,
    last_active: now,
  };

  setActivePatientSession(updatedSession);
  return updatedSession;
}

/**
 * Clears the patient session (sign out / switch patient).
 */
export function clearPatientSession(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(STORAGE_KEY);
    window.dispatchEvent(new CustomEvent(SESSION_EVENT_KEY, { detail: null }));
  } catch (err) {
    console.error("Failed to clear patient session:", err);
  }
}

/**
 * React hook to reactively subscribe to the active patient session.
 */
export function usePatientSession() {
  const [session, setSession] = useState<PatientSession | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    // Initial hydration
    setSession(getActivePatientSession());
    setIsLoaded(true);

    const handleSessionChange = (e: Event) => {
      const customEvent = e as CustomEvent<PatientSession | null>;
      setSession(customEvent.detail ?? getActivePatientSession());
    };

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) {
        setSession(getActivePatientSession());
      }
    };

    window.addEventListener(SESSION_EVENT_KEY, handleSessionChange);
    window.addEventListener("storage", handleStorageChange);

    return () => {
      window.removeEventListener(SESSION_EVENT_KEY, handleSessionChange);
      window.removeEventListener("storage", handleStorageChange);
    };
  }, []);

  const login = useCallback((newSession: PatientSession) => {
    setActivePatientSession(newSession);
  }, []);

  const logout = useCallback(() => {
    clearPatientSession();
  }, []);

  const saveBooking = useCallback((booking: ActiveBooking, name?: string, phone?: string) => {
    return updateActiveBooking(booking, name, phone);
  }, []);

  const safeSession = session ? {
    ...session,
    full_name: typeof session.full_name === "string" && session.full_name.trim() ? session.full_name.trim() : "Patient"
  } : null;

  return {
    session: safeSession,
    isLoaded,
    isLoggedIn: Boolean(safeSession && safeSession.phone),
    login,
    logout,
    saveBooking,
  };
}
