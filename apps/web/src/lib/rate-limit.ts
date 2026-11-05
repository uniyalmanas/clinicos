import { NextRequest } from "next/server";
import { sql } from "@/lib/db";
import { clientIp } from "@/lib/audit";

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  retryAfterSeconds: number;
}

/**
 * Fixed-window rate limiter backed by Postgres.
 *
 * `INSERT ... ON CONFLICT DO UPDATE` is a single atomic statement, so
 * concurrent serverless invocations cannot both slip through at the boundary.
 */
export async function rateLimit(
  key: string,
  limit: number,
  windowSeconds: number
): Promise<RateLimitResult> {
  try {
    const rows = await sql`
      INSERT INTO rate_limits (key, window_start, count)
      VALUES (${key}, now(), 1)
      ON CONFLICT (key) DO UPDATE SET
        count = CASE
          WHEN rate_limits.window_start < now() - (${windowSeconds} * interval '1 second')
            THEN 1
          ELSE rate_limits.count + 1
        END,
        window_start = CASE
          WHEN rate_limits.window_start < now() - (${windowSeconds} * interval '1 second')
            THEN now()
          ELSE rate_limits.window_start
        END
      RETURNING count, window_start;
    `;
    const count = Number(rows[0]?.count || 1);
    const started = new Date(rows[0]?.window_start || Date.now()).getTime();
    const resetIn = Math.max(
      1,
      Math.ceil((started + windowSeconds * 1000 - Date.now()) / 1000)
    );
    return {
      allowed: count <= limit,
      remaining: Math.max(0, limit - count),
      retryAfterSeconds: resetIn,
    };
  } catch (err) {
    // Fail open: a missing rate_limits table must not block clinical work.
    console.error("[rate-limit] check failed", err);
    return { allowed: true, remaining: limit, retryAfterSeconds: 0 };
  }
}

export function rateLimitKey(req: NextRequest, bucket: string, suffix = ""): string {
  return `${bucket}:${clientIp(req) || "unknown"}:${suffix}`;
}

/** Returns a 429 response body when the limit is exceeded. */
export function tooManyRequests(retryAfterSeconds: number) {
  return {
    error: "Too many requests. Please try again later.",
    code: "rate_limited",
    retry_after: retryAfterSeconds,
  };
}
