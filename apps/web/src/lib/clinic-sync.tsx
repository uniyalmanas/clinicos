"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
  type ReactNode,
} from "react";

/* ─────────────────────────────────────────────────────────
   Clinic Sync — Real-time multi-role coordination
   
   Shared state between:
   • Doctor (consultation): current patient, chamber status
   • Receptionist (desk): queue, doctor availability, walk-ins
   • Chambers (multi-doctor overview): all doctors' statuses
   
   Uses SSE (/api/clinic/stream) for broadcast + optimistic local updates.
   ───────────────────────────────────────────────────────── */

export type ChamberStatus = "idle" | "with_patient" | "completed" | "away";

export type DoctorChamberState = {
  doctorSlug: string;
  doctorName: string;
  specialization: string;
  chamberName: string;
  status: ChamberStatus;
  currentPatient?: {
    tokenNumber: number;
    patientName: string;
    appointmentNumber: string;
  } | null;
  waitingCount: number;
  lastUpdated: string;
};

export type QueueEvent =
  | { type: "token_called"; data: { appointment_number: string; token_number: number; patient_name: string; doctor_slug: string; chamber_name: string } }
  | { type: "token_completed"; data: { appointment_number: string; token_number: number; doctor_slug: string } }
  | { type: "walk_in_registered"; data: { appointment_number: string; token_number: number; patient_name: string; doctor_slug: string } }
  | { type: "doctor_status"; data: { doctor_slug: string; status: ChamberStatus } };

type SyncContextType = {
  // Doctor chambers
  chambers: DoctorChamberState[];
  setChamberStatus: (doctorSlug: string, status: ChamberStatus, patient?: DoctorChamberState["currentPatient"]) => void;
  // Active patient for current doctor
  activePatient: DoctorChamberState["currentPatient"] | null;
  setActivePatient: (p: DoctorChamberState["currentPatient"] | null) => void;
  // Queue updates
  onQueueUpdate: (cb: (event: QueueEvent) => void) => void;
  // Connection state
  connected: boolean;
};

const SyncContext = createContext<SyncContextType | null>(null);

export function ClinicSyncProvider({ children }: { children: ReactNode }) {
  const [chambers, setChambers] = useState<DoctorChamberState[]>([]);
  const [activePatient, setActivePatient] = useState<DoctorChamberState["currentPatient"] | null>(null);
  const [connected, setConnected] = useState(false);

  // Initialize default chambers if empty
  useEffect(() => {
    if (chambers.length === 0) {
      setChambers([
        {
          doctorSlug: "dr-rahul-sharma",
          doctorName: "Dr. Rahul Sharma",
          specialization: "Dermatologist",
          chamberName: "Chamber 1 • Room 101",
          status: "idle",
          waitingCount: 0,
          lastUpdated: new Date().toISOString(),
        },
        {
          doctorSlug: "dr-aditi-joshi",
          doctorName: "Dr. Aditi Joshi",
          specialization: "Dental Surgeon",
          chamberName: "Chamber 2 • Dental Chair 1",
          status: "idle",
          waitingCount: 0,
          lastUpdated: new Date().toISOString(),
        },
        {
          doctorSlug: "dr-vikram-sethi",
          doctorName: "Dr. Vikram Sethi",
          specialization: "Pediatrician",
          chamberName: "Chamber 3 • Room 103",
          status: "idle",
          waitingCount: 0,
          lastUpdated: new Date().toISOString(),
        },
      ]);
    }
  }, []);

  const setChamberStatus = useCallback(
    (doctorSlug: string, status: ChamberStatus, patient?: DoctorChamberState["currentPatient"]) => {
      setChambers((prev) =>
        prev.map((c) => {
          if (c.doctorSlug !== doctorSlug) return c;
          return {
            ...c,
            status,
            currentPatient: patient ?? null,
            waitingCount: status === "idle" ? c.waitingCount : c.waitingCount,
            lastUpdated: new Date().toISOString(),
          };
        })
      );
      if (patient) setActivePatient(patient);
      else if (status === "idle") setActivePatient(null);
    },
    []
  );

  // SSE listener
  useEffect(() => {
    let evtSource: EventSource | null = null;

    const connect = () => {
      try {
        evtSource = new EventSource("/api/clinic/stream");
        evtSource.onopen = () => setConnected(true);
        evtSource.onerror = () => {
          setConnected(false);
          evtSource?.close();
          // Reconnect after 5 seconds
          setTimeout(connect, 5000);
        };
        evtSource.onmessage = (event) => {
          try {
            const payload = JSON.parse(event.data);
            if (payload.event === "token_called") {
              const data = payload.data;
              setChambers((prev) =>
                prev.map((c) => {
                  if (c.doctorSlug === data.doctor_slug) {
                    return {
                      ...c,
                      status: "with_patient",
                      currentPatient: {
                        tokenNumber: data.token_number,
                        patientName: data.patient_name,
                        appointmentNumber: data.appointment_number,
                      },
                      waitingCount: Math.max(0, c.waitingCount - 1),
                      lastUpdated: new Date().toISOString(),
                    };
                  }
                  return c;
                })
              );
            } else if (payload.event === "token_completed") {
              const data = payload.data;
              setChambers((prev) =>
                prev.map((c) => {
                  if (c.doctorSlug === data.doctor_slug) {
                    return {
                      ...c,
                      status: "idle",
                      currentPatient: null,
                      lastUpdated: new Date().toISOString(),
                    };
                  }
                  return c;
                })
              );
              if (activePatient?.appointmentNumber === data.appointment_number) {
                setActivePatient(null);
              }
            } else if (payload.event === "walk_in_registered") {
              const data = payload.data;
              setChambers((prev) =>
                prev.map((c) => {
                  if (c.doctorSlug === data.doctor_slug) {
                    return { ...c, waitingCount: c.waitingCount + 1 };
                  }
                  return c;
                })
              );
            }
          } catch {
            /* ignore parse errors */
          }
        };
      } catch {
        setConnected(false);
        setTimeout(connect, 5000);
      }
    };

    connect();
    return () => {
      if (evtSource) evtSource.close();
    };
  }, [activePatient]);

  const onQueueUpdate = useCallback((cb: (event: QueueEvent) => void) => {
    // Handled via SSE above; exposed for components that want to subscribe
    return;
  }, []);

  const value: SyncContextType = {
    chambers,
    setChamberStatus,
    activePatient,
    setActivePatient,
    onQueueUpdate,
    connected,
  };

  return <SyncContext.Provider value={value}>{children}</SyncContext.Provider>;
}

export function useClinicSync() {
  const ctx = useContext(SyncContext);
  if (!ctx) throw new Error("useClinicSync must be used within ClinicSyncProvider");
  return ctx;
}
