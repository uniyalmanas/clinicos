/**
 * Privacy helpers for data that is rendered in public places.
 *
 * The waiting-room TV, the public queue API and the public SSE stream are
 * readable by anyone who knows a clinic slug. They must never carry a full
 * patient name, phone number, symptoms, or payment details. This module is the
 * single place that decides how much of a patient's identity is safe to show.
 */

/** Mask a patient name for public queue displays: "Devansh Pant" → "Devansh P." */
export function maskPatientName(value: unknown): string {
  const clean = String(value ?? "").trim().replace(/\s+/g, " ");
  if (!clean) return "Patient";

  const parts = clean.split(" ");
  if (parts.length === 1) {
    const word = parts[0];
    if (word.length <= 2) return `${word.slice(0, 1)}***`;
    return `${word.slice(0, 1)}${"*".repeat(Math.min(Math.max(word.length - 1, 3), 8))}`;
  }

  const first = parts[0];
  const lastInitial = parts[parts.length - 1].charAt(0).toUpperCase();
  return `${first} ${lastInitial}.`;
}

/** Mask a phone number for any surface that only needs to hint at identity. */
export function maskPhone(value: unknown): string {
  const digits = String(value ?? "").replace(/\D/g, "").slice(-10);
  if (digits.length !== 10) return "";
  return `+91 ${digits.slice(0, 2)}****${digits.slice(-4)}`;
}
