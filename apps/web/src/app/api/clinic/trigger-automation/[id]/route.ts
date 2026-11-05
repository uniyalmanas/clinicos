import { NextRequest, NextResponse } from "next/server";
import { guard, CLINIC_ROLES, apiError } from "@/lib/api-auth";

export const dynamic = "force-dynamic";

/**
 * Triggering a stored automation is not implemented — there is no automation
 * store and no outbound sender wired to this route.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await guard(req, { roles: CLINIC_ROLES });
  if (!auth.ok) return auth.response;

  const { id } = await params;

  return apiError(
    501,
    `Automation ${id} was not sent: outbound automation delivery is not implemented.`,
    "not_implemented"
  );
}
