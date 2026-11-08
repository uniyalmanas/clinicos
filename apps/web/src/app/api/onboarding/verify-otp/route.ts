import { NextRequest } from "next/server";
import { POST as verifyPatientOtp } from "@/app/api/patient/auth/verify-otp/route";

export const dynamic = "force-dynamic";

/**
 * Onboarding alias for the patient OTP verifier.
 *
 * A successful call sets the httpOnly `clinicos_patient_token` cookie, which
 * `/api/onboarding/publish` then requires before it will create a tenant.
 */
export function POST(req: NextRequest) {
  return verifyPatientOtp(req);
}
