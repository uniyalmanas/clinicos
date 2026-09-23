import postgres from "postgres";

/**
 * High-performance PostgreSQL client for Next.js App Router & Serverless.
 * Connects directly to Supabase PostgreSQL pooler with zero cold starts.
 */

const getDatabaseUrl = (): string => {
  const url = process.env.DATABASE_URL || "";
  if (!url) {
    console.warn("DATABASE_URL is not set. Database queries will fail.");
    return "";
  }
  return url.trim().replace(/^postgres:\/\//, "postgresql://");
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
    ssl: "require",
    max: 5,
    idle_timeout: 5,
    connect_timeout: 10,
    prepare: false, // Recommended for pgbouncer/transaction poolers
  });

if (process.env.NODE_ENV !== "production") {
  global.__postgres_sql = sql;
}

export const db = sql;
export default sql;
