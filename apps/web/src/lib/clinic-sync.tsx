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
   Clinic Sync — real-time multi-role coordination

   Shared state between:
   • Doctor (consultation): current patient, chamber status
   • Receptionist (desk): queue, doctor availability, walk-ins
   • Chambers (multi-doctor overview): all doctors' statuses

   Chambers are hydrated from the clinic's real doctor directory and today's
   desk queue. There are no sample chambers: a stub list would show doctors
   who do not exist in this clinic and hide the ones who do.
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

const WAITING_STATUSES = new Set([
  "waiting",
  "in_waiting",
  "arrived",
  "booked",
  "confirmed",
]);

const authHeaders = (): Record<string, string> => {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("clinicos_token") : null;
  return token ? { Authorization: `Bearer ${token}` } : {};
};

export function ClinicSyncProvider({ children }: { children: ReactNode }) {
  const [chambers, setChambers] = useState<DoctorChamberState[]>([]);
  const [activePatient, setActivePatient] = useState<DoctorChamberState["currentPatient"] | null>(null);
  const [connected, setConnected] = useState(false);

  /** Rebuild chamber state from the server's doctor directory + live queue. */
  const hydrateChambers = useCallback(async () => {
    try {
      const headers = authHeaders();
      const [docsRes, queueRes] = await Promise.all([
        fetch("/api/doctors", { headers }),
        fetch("/api/clinic/desk-queue", { headers }),
      ]);

      const docsJson = docsRes.ok ? await docsRes.json() : [];
      const docs: any[] = Array.isArray(docsJson)
        ? docsJson
        : docsJson?.doctors || [];
      if (!Array.isArray(docs) || docs.length === 0) return;

      const queueJson = queueRes.ok ? await queueRes.json() : null;
      const queue: any[] = Array.isArray(queueJson?.queue) ? queueJson.queue : [];

      setChambers((prev) => {
        const previous = new Map(prev.map((c) => [c.doctorSlug, c]));
        return docs.map((doc) => {
          const mine = queue.filter((a) => a.doctor_slug === doc.slug);
          const inConsult = mine.find((a) => a.status === "in_consultation");
          const waitingCount = mine.filter((a) => WAITING_STATUSES.has(a.status)).length;
          const existing = previous.get(doc.slug);
          const status: ChamberStatus = inConsult
            ? "with_patient"
            : existing?.status === "away"
              ? "away"
              : "idle";

          return {
            doctorSlug: doc.slug,
            doctorName: doc.full_name,
            specialization: doc.specialization || "Consultant",
            chamberName:
              doc.chamber_name || `${doc.specialization || "Consultation"} • ${doc.full_name}`,
            status,
            currentPatient: inConsult
              ? {
                  tokenNumber: Number(inConsult.token_number),
                  patientName: inConsult.patient_name,
                  appointmentNumber: inConsult.appointment_number,
                }
              : null,
            waitingCount,
            lastUpdated: new Date().toISOString(),
          };
        });
      });
    } catch {
      // Keep the last good snapshot; the SSE stream / next poll retries.
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
            lastUpdated: new Date().toISOString(),
          };
        })
      );
      if (patient) setActivePatient(patient);
      else if (status === "idle") setActivePatient(null);
    },
    []
  );

  useEffect(() => {
    hydrateChambers();
  }, [hydrateChambers]);

  // SSE listener
  useEffect(() => {
    let evtSource: EventSource | null = null;
    let reconnectTimer: ReturnType<typeof setTimeout> | null = null;
    let closed = false;

    const connect = () => {
      if (closed) return;
      try {
        evtSource = new EventSource("/api/clinic/stream");
        evtSource.onopen = () => setConnected(true);
        evtSource.onerror = () => {
          setConnected(false);
          evtSource?.close();
          if (!closed) reconnectTimer = setTimeout(connect, 5000);
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
              setActivePatient((prev) =>
                prev?.appointmentNumber === data.appointment_number ? null : prev
              );
            }

            // Any queue mutation can change waiting counts, transfers or
            // payment state, so re-read the authoritative snapshot.
            if (
              payload.event === "token_called" ||
              payload.event === "token_completed" ||
              payload.event === "walk_in_registered" ||
              payload.event === "queue_updated"
            ) {
              hydrateChambers();
            }
          } catch {
            /* ignore parse errors */
          }
        };
      } catch {
        setConnected(false);
        if (!closed) reconnectTimer = setTimeout(connect, 5000);
      }
    };

    connect();
    return () => {
      closed = true;
      if (reconnectTimer) clearTimeout(reconnectTimer);
      if (evtSource) evtSource.close();
    };
  }, [hydrateChambers]);

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
