import postgres from "postgres";

/**
 * High-performance PostgreSQL client for Next.js App Router & Serverless.
 * Connects directly to Supabase PostgreSQL pooler with zero cold starts.
 */

const BUILD_PHASE = process.env.NEXT_PHASE === "phase-production-build";

const getDatabaseUrl = (): string => {
  let raw = (process.env.DATABASE_URL || "").trim();
  // Strip all internal whitespace, newlines, tabs, carriage returns, and quotes
  raw = raw.replace(/[\r\n\s\t]+/g, "").replace(/^["']|["']$/g, "");

  if (!raw || raw.includes("[SENSITIVE]") || (!raw.startsWith("postgres://") && !raw.startsWith("postgresql://"))) {
    // Production must never silently point at localhost: that turns a
    // misconfiguration into an offline demo environment serving fake data.
    if (process.env.NODE_ENV === "production" && !BUILD_PHASE) {
      throw new Error(
        "FATAL: DATABASE_URL is missing or invalid. Refusing to start with a placeholder database connection in production."
      );
    }
    if (!BUILD_PHASE) {
      console.warn(
        "[db] DATABASE_URL is missing or invalid. Falling back to localhost for development only — NOT for production."
      );
    }
    // Return dummy fallback during build / static analysis to prevent build-time crashes
    return "postgresql://postgres:postgres@127.0.0.1:5432/postgres";
  }

  // Ensure port 6543 transaction pooler is used on serverless
  if (raw.includes(":5432/postgres")) {
    raw = raw.replace(":5432/postgres", ":6543/postgres");
  }

  return raw.replace(/^postgres:\/\//, "postgresql://");
};

function createSqlClient() {
  const connectionString = getDatabaseUrl();
  // Local development clusters (including the bundled .localdb) do not
  // terminate TLS. Only disable it for loopback so remote connections stay
  // encrypted.
  const isLoopback = /(?:localhost|127\.0\.0\.1|\[::1\])/i.test(connectionString);
  try {
    return postgres(connectionString, {
      ssl: isLoopback ? false : { rejectUnauthorized: false },
      max: 5,
      idle_timeout: 20,
      connect_timeout: 20,
      prepare: false, // Recommended for pgbouncer/transaction poolers
    });
  } catch (err) {
    console.error("Failed to initialize postgres client with DATABASE_URL:", err);
    throw err;
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
