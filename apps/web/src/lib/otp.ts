import { createHmac, randomInt, timingSafeEqual } from "crypto";

const OTP_PEPPER =
  process.env.PATIENT_JWT_SECRET ||
  process.env.JWT_SECRET_KEY ||
  "clinicos-dev-insecure-patient-secret";

export function hashOtp(phone: string, code: string): string {
  return createHmac("sha256", OTP_PEPPER).update(`${phone}:${code}`).digest("hex");
}

export function generateOtp(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}

export function safeEqualHex(a: string, b: string): boolean {
  const left = Buffer.from(a, "utf8");
  const right = Buffer.from(b, "utf8");
  if (left.length !== right.length) return false;
  return timingSafeEqual(left, right);
}

export const OTP_TTL_SECONDS = 300;
export const OTP_RESEND_COOLDOWN_SECONDS = 60;
export const OTP_MAX_ATTEMPTS = 5;
