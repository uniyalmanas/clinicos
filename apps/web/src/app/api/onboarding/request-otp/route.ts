import { NextRequest } from "next/server";
import { POST as requestPatientOtp } from "@/app/api/patient/auth/request-otp/route";

export const dynamic = "force-dynamic";

/**
 * Onboarding alias for the patient OTP service.
 *
 * Kept as a thin wrapper so the onboarding flow has a stable path while the
 * verification logic, rate limits, and delivery channel live in exactly one
 * place (`/api/patient/auth/request-otp`).
 */
export function POST(req: NextRequest) {
  return requestPatientOtp(req);
}
