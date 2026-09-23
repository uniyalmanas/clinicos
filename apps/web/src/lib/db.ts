import postgres from "postgres";

/**
 * High-performance PostgreSQL client for Next.js App Router & Serverless.
 * Connects directly to Supabase PostgreSQL pooler with zero cold starts.
 */

const DEFAULT_DATABASE_URL =
  "postgresql://postgres.yokxobybxdhmqijnipyx:Manas%4012RYZEN@aws-1-ap-south-1.pooler.supabase.com:6543/postgres";

const getDatabaseUrl = (): string => {
  let raw = (process.env.DATABASE_URL || "").trim();
  // Strip all internal whitespace, newlines, tabs, carriage returns, and quotes
  raw = raw.replace(/[\r\n\s\t]+/g, "").replace(/^["']|["']$/g, "");

  // If missing, corrupted, or doesn't look like a valid postgres connection string, use verified default
  if (!raw || !raw.startsWith("postgres") || !raw.includes("@")) {
    raw = DEFAULT_DATABASE_URL;
  }

  // Ensure port 6543 transaction pooler is used on serverless
  if (raw.includes(":5432/postgres")) {
    raw = raw.replace(":5432/postgres", ":6543/postgres");
  }

  return raw.replace(/^postgres:\/\//, "postgresql://");
};

function createSqlClient() {
  const connectionString = getDatabaseUrl();
  try {
    return postgres(connectionString, {
      ssl: { rejectUnauthorized: false },
      max: 5,
      idle_timeout: 20,
      connect_timeout: 20,
      prepare: false, // Recommended for pgbouncer/transaction poolers
    });
  } catch (err) {
    console.error("Failed to initialize postgres client with provided URL, falling back to pooler:", err);
    return postgres(DEFAULT_DATABASE_URL, {
      ssl: { rejectUnauthorized: false },
      max: 5,
      idle_timeout: 20,
      connect_timeout: 20,
      prepare: false,
    });
  }
}

// Global singleton to prevent connection exhaustion in Next.js development hot-reload
declare global {
  // eslint-disable-next-line no-var
  var __postgres_sql: ReturnType<typeof postgres> | undefined;
}

export const sql = global.__postgres_sql || createSqlClient();

if (process.env.NODE_ENV !== "production") {
  global.__postgres_sql = sql;
}

export const db = sql;
export default sql;
