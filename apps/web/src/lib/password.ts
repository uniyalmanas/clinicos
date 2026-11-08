/**
 * Central password policy.
 *
 * Phase 0 enforces the minimum needed to stop shipping a known default:
 * length, a deny-list of leaked/default passwords, and no phone number.
 * Phase 1 extends this helper (breach checks, reset tokens) — keep all rules
 * here so the login, change-password, and onboarding routes cannot drift.
 */

export const MIN_PASSWORD_LENGTH = 12;

const DENY_LIST = new Set(
  [
    "password@123",
    "password123",
    "password",
    "123456789012",
    "1234567890",
    "qwertyuiop12",
    "clinicos@123",
    "admin@123456",
    "welcometo123",
    "letmein12345",
  ].map((value) => value.toLowerCase())
);

export interface PasswordContext {
  phone?: string | null;
  name?: string | null;
  email?: string | null;
}

/**
 * Returns a human-readable error message, or null when the password is
 * acceptable. Never returns the password itself.
 */
export function passwordPolicyError(
  password: unknown,
  context: PasswordContext = {}
): string | null {
  if (typeof password !== "string" || password.length === 0) {
    return "A password is required.";
  }

  if (password.length < MIN_PASSWORD_LENGTH) {
    return `Password must be at least ${MIN_PASSWORD_LENGTH} characters long.`;
  }

  if (password.length > 200) {
    return "Password must be 200 characters or fewer.";
  }

  const normalised = password.trim().toLowerCase();
  if (DENY_LIST.has(normalised)) {
    return "This password is too common or has been used as a default. Choose a different one.";
  }

  const phoneDigits = String(context.phone || "").replace(/[^0-9]/g, "").slice(-10);
  if (phoneDigits.length === 10 && password.replace(/[^0-9]/g, "").includes(phoneDigits)) {
    return "Password must not contain your phone number.";
  }

  const nameParts = String(context.name || "")
    .toLowerCase()
    .replace(/^dr\.?\s+/, "")
    .split(/\s+/)
    .filter((part) => part.length >= 3);
  if (nameParts.some((part) => normalised.includes(part))) {
    return "Password must not contain your name.";
  }

  return null;
}
