import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

/**
 * Fail-closed helpers for the data layer.
 *
 * A database outage must never be reported as an empty successful result or
 * patched over with demo fixtures. Callers convert these into 503 responses so
 * monitoring sees the failure and clients retry.
 */

export function databaseUnavailable(code = "data_unavailable"): NextResponse {
  return NextResponse.json(
    {
      error: "The service is temporarily unavailable. Please retry shortly.",
      code,
    },
    {
      status: 503,
      headers: {
        "Cache-Control": "no-store",
        "Retry-After": "5",
      },
    }
  );
}

/** Returns true when the database answers a trivial query. Never throws. */
export async function assertDatabase(): Promise<boolean> {
  try {
    await sql`SELECT 1`;
    return true;
  } catch (err: any) {
    console.error("[require-db] database health check failed:", err?.message);
    return false;
  }
}
