import { NextRequest, NextResponse } from "next/server";
import { sql } from "@/lib/db";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

const cleanPhone = (value: unknown) =>
  String(value || "").replace(/[^0-9]/g, "").slice(-10);

/**
 * Public "have you visited this clinic before?" check used by the kiosk.
 *
 * It deliberately returns a boolean only. A kiosk sits in a public lobby, so
 * returning a name, age, diagnosis or visit history for an unauthenticated
 * phone number would let anyone enumerate patient records.
 */
export async function GET(req: NextRequest) {
  try {
    const ipLimit = await rateLimit(rateLimitKey(req, "checkin:lookup"), 120, 3600);
    if (!ipLimit.allowed) {
      return NextResponse.json(tooManyRequests(ipLimit.retryAfterSeconds), {
        status: 429,
        headers: { "Retry-After": String(ipLimit.retryAfterSeconds) },
      });
    }

    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinic_slug") || "";
    const phone = cleanPhone(searchParams.get("phone"));

    if (!clinicSlug) {
      return NextResponse.json(
        { error: "clinic_slug is required.", code: "clinic_required" },
        { status: 400 }
      );
    }
    if (phone.length !== 10) {
      return NextResponse.json(
        { error: "A valid 10-digit phone is required.", code: "invalid_phone" },
        { status: 400 }
      );
    }

    const clinics = await sql`
      SELECT id FROM clinics WHERE slug = ${String(clinicSlug)} LIMIT 1;
    `;
    if (clinics.length === 0) {
      return NextResponse.json(
        { error: "Clinic not found.", code: "clinic_not_found" },
        { status: 404 }
      );
    }

    const rows = await sql`
      SELECT 1
      FROM appointments
      WHERE clinic_id::text = ${clinics[0].id}::text
        AND RIGHT(REGEXP_REPLACE(patient_phone, '[^0-9]', '', 'g'), 10) = ${phone}
      LIMIT 1;
    `;

    return NextResponse.json({ known: rows.length > 0 });
  } catch (error: any) {
    console.error("GET /api/check-in/public/lookup error:", error);
    return NextResponse.json(
      { error: "Lookup failed.", code: "internal_error" },
      { status: 500 }
    );
  }
}
