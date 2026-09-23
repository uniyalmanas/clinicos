import postgres from "postgres";

/**
 * High-performance PostgreSQL client for Next.js App Router & Serverless.
 * Connects directly to Supabase PostgreSQL pooler with zero cold starts.
 */

const DEFAULT_DATABASE_URL =
  "postgresql://postgres.yokxobybxdhmqijnipyx:Manas%4012RYZEN@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

const getDatabaseUrl = (): string => {
  const raw = process.env.DATABASE_URL || DEFAULT_DATABASE_URL;
  return raw.trim().replace(/^postgres:\/\//, "postgresql://").replace(/^["']|["']$/g, "");
};

const connectionString = getDatabaseUrl();

// Global singleton to prevent connection exhaustion in Next.js development hot-reload
declare global {
  // eslint-disable-next-line no-var
  var __postgres_sql: ReturnType<typeof postgres> | undefined;
}

export const sql =
  global.__postgres_sql ||
  postgres(connectionString, {
    ssl: { rejectUnauthorized: false },
    max: 5,
    idle_timeout: 20,
    connect_timeout: 20,
    prepare: false, // Recommended for pgbouncer/transaction poolers
  });

if (process.env.NODE_ENV !== "production") {
  global.__postgres_sql = sql;
}

export const db = sql;
export default sql;
