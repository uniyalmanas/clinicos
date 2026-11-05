import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { sseBroker } from "@/lib/sse-broker";
import { rateLimit, rateLimitKey, tooManyRequests } from "@/lib/rate-limit";

export const dynamic = "force-dynamic";

/**
 * Public SSE stream for waiting room TV displays.
 *
 * No authentication required — scoped by clinic_slug from the query string.
 * Used by wall-mounted TVs in clinic waiting areas to show live token updates.
 *
 * Query params:
 *   clinic_slug (required) — clinic slug to subscribe to
 */
export async function GET(req: NextRequest) {
  try {
    // Rate limit: 10 SSE connections per hour per IP
    const ipLimit = await rateLimit(rateLimitKey(req, "waitingroom:stream"), 60, 3600);
    if (!ipLimit.allowed) {
      return new Response(
        JSON.stringify({ error: "Rate limit exceeded.", code: "too_many_requests" }),
        { status: 429, headers: { "Content-Type": "application/json", "Retry-After": String(ipLimit.retryAfterSeconds) } }
      );
    }

    const { searchParams } = new URL(req.url);
    const clinicSlug = searchParams.get("clinic_slug") || "";

    if (!clinicSlug) {
      return new Response(
        JSON.stringify({ error: "clinic_slug is required.", code: "missing_clinic" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Resolve clinic ID from slug
    const clinics = await sql`
      SELECT id, slug, name
      FROM clinics
      WHERE slug = ${String(clinicSlug)}
      LIMIT 1;
    `;
    if (clinics.length === 0) {
      return new Response(
        JSON.stringify({ error: "Clinic not found.", code: "clinic_not_found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }
    const clinicId = clinics[0].id;

    const encoder = new TextEncoder();
    let unsubscribe: (() => void) | null = null;

    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(
          encoder.encode(
            `event: connected\ndata: ${JSON.stringify({
              status: "connected",
              clinic_id: clinicId,
              clinic_slug: clinicSlug,
              clinic_name: clinics[0].name,
              time: new Date().toISOString(),
            })}\n\n`
          )
        );

        unsubscribe = sseBroker.subscribe(clinicId, ({ event, data }) => {
          try {
            controller.enqueue(
              encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
            );
          } catch {
            // Stream closed.
          }
        });

        const pingInterval = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: ping\n\n`));
          } catch {
            clearInterval(pingInterval);
          }
        }, 15000);

        req.signal.addEventListener("abort", () => {
          clearInterval(pingInterval);
          if (unsubscribe) unsubscribe();
          try {
            controller.close();
          } catch {
            /* already closed */
          }
        });
      },
      cancel() {
        if (unsubscribe) unsubscribe();
      },
    });

    return new Response(stream, {
      headers: {
        "Content-Type": "text/event-stream; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    });
  } catch (err: any) {
    console.error("Waiting room SSE error:", err);
    return new Response(
      JSON.stringify({ error: "Stream failed.", code: "internal_error" }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
}
