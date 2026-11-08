import { NextResponse } from "next/server";
import { assertDatabase } from "@/lib/require-db";

export const dynamic = "force-dynamic";

/**
 * Liveness/readiness probe. Deliberately exposes no configuration or secrets:
 * only whether the database currently answers a trivial query.
 */
export async function GET() {
  const databaseOk = await assertDatabase();

  return NextResponse.json(
    {
      status: databaseOk ? "ok" : "degraded",
      database: databaseOk ? "reachable" : "unreachable",
    },
    {
      status: databaseOk ? 200 : 503,
      headers: { "Cache-Control": "no-store" },
    }
  );
}
