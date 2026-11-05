import { NextRequest, NextResponse } from "next/server";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Automated message scheduling is not implemented. Returning success here
 * previously made the UI show messages as "sent" when nothing had been sent.
 * Use the prescription WhatsApp dispatch action for a real, user-sent message.
 */
export async function POST(req: NextRequest) {
  const auth = await guard(req, { roles: CLINIC_ROLES });
  if (!auth.ok) return auth.response;

  return apiError(
    501,
    "Automated follow-up scheduling is not implemented. Share the prescription link from the prescription screen instead.",
    "not_implemented"
  );
}
