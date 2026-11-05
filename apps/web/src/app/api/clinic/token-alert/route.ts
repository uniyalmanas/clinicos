import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { apiError } from "@/lib/api-auth";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";
import { sendMessage } from "@/lib/notifications";

export const dynamic = "force-dynamic";

/**
 * Patient-facing "notify me when my token is close" request.
 *
 * The position is computed from the live queue in the database; nothing is
 * cached in memory and no phone number is stored by this route.
 */
export async function POST(req: NextRequest) {
  try {
    const limit = await rateLimit(rateLimitKey(req, "token-alert"), 10, 600);
    if (!limit.allowed) {
      return NextResponse.json(tooManyRequests(limit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(limit.retryAfterSeconds) },
      });
    }

    const body = await req.json().catch(() => ({}));
    const cleanPhone = String(body.phone || "").replace(/[^0-9]/g, "").slice(-10);
    const clinicSlug = String(body.clinic_slug || "").trim();
    const tokenNumber = Number(body.token_number);

    if (cleanPhone.length !== 10) {
      return apiError(400, "A valid 10-digit mobile number is required.", "invalid_phone");
    }
    if (!clinicSlug) {
      return apiError(400, "clinic_slug is required.", "missing_clinic");
    }
    if (!Number.isFinite(tokenNumber) || tokenNumber <= 0) {
      return apiError(400, "token_number is required.", "missing_token");
    }

    const clinicRows = await sql`
      SELECT id, slug, name, phone FROM clinics WHERE lower(slug) = ${clinicSlug.toLowerCase()} LIMIT 1;
    `;
    if (clinicRows.length === 0) {
      return apiError(404, "Clinic not found.", "clinic_not_found");
    }
    const clinic = clinicRows[0];

    const todayStr = new Date().toISOString().split("T")[0];
    const currentRows = await sql`
      SELECT COALESCE(MAX(token_number), 0) AS current_token
      FROM appointments
      WHERE clinic_id::text = ${String(clinic.id)}::text
        AND appointment_date = ${todayStr}
        AND status = 'in_consultation';
    `;
    const currentToken = Number(currentRows[0]?.current_token || 0);
    const positionsAway = currentToken > 0 ? Math.max(0, tokenNumber - currentToken) : null;

    let dispatch = "not_sent";
    if (positionsAway !== null && positionsAway <= 2) {
      try {
        await sendMessage(
          cleanPhone,
          `Your token #${tokenNumber} at ${clinic.name} is coming up. Please proceed to the reception.`
        );
        dispatch = "sent";
      } catch (sendError) {
        console.error("[token-alert] delivery failed", sendError);
        dispatch = "failed";
      }
    }

    return NextResponse.json({
      success: true,
      clinic_slug: clinic.slug,
      token_number: tokenNumber,
      current_token: currentToken || null,
      positions_away: positionsAway,
      notified: dispatch === "sent",
      dispatch_status: dispatch,
      message:
        positionsAway === null
          ? "The queue has not started yet. Please check back shortly."
          : positionsAway <= 2
            ? `Token #${tokenNumber} is close to your turn; check your messages.`
            : `You have ${positionsAway} patients ahead. This page refreshes automatically.`,
    });
  } catch (error: any) {
    console.error("POST /api/clinic/token-alert error:", error);
    return apiError(500, "Failed to process token alert.", "internal_error");
  }
}
