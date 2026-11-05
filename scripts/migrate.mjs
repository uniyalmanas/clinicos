#!/usr/bin/env node
/**
 * ClinicOS migration runner.
 *
 *   node scripts/migrate.mjs            apply pending migrations
 *   node scripts/migrate.mjs --dry-run  list what would run
 *   node scripts/migrate.mjs --status   show applied versions
 *   node scripts/migrate.mjs --file supabase/migrations/003_....sql
 *
 * Records every applied file in `schema_migrations`. On a database that already
 * has the baseline tables but no migration history, the baseline migrations are
 * marked as applied instead of being re-executed.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");

const args = process.argv.slice(2);
const dryRun = args.includes("--dry-run");
const statusOnly = args.includes("--status");
const fileArgIndex = args.indexOf("--file");
const singleFile = fileArgIndex >= 0 ? args[fileArgIndex + 1] : null;

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  const text = fs.readFileSync(file, "utf8");
  for (const line of text.split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    const key = match[1];
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv(path.join(root, "apps", "web", ".env.local"));
loadEnv(path.join(root, ".env.local"));
loadEnv(path.join(root, ".env"));

const connectionString = (process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || "").trim();
if (!connectionString) {
  console.error("DATABASE_URL (or DIRECT_DATABASE_URL) is not set.");
  process.exit(1);
}

const sql = postgres(connectionString.replace(/^postgres:\/\//, "postgresql://"), {
  ssl: { rejectUnauthorized: false },
  max: 1,
  prepare: false,
  onnotice: () => {},
});

async function main() {
  await sql`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version    TEXT PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT now()
    );
  `;

  const applied = new Set(
    (await sql`SELECT version FROM schema_migrations ORDER BY version`).map((r) => r.version)
  );

  if (statusOnly) {
    console.log("Applied migrations:");
    for (const version of applied) console.log("  ✓ " + version);
    const pending = listMigrations().filter((m) => !applied.has(m.version));
    console.log("Pending:");
    for (const m of pending) console.log("  · " + m.version);
    return;
  }

  // Baseline an existing database that predates the migration history.
  const isExistingDb = await tableExists("user_accounts");
  const baselineCandidates = listMigrations().filter(
    (m) => m.version.startsWith("001") || m.version.startsWith("002")
  );
  if (isExistingDb && applied.size === 0) {
    for (const m of baselineCandidates) {
      if (dryRun) {
        console.log("would baseline " + m.version);
        applied.add(m.version);
        continue;
      }
      await sql`INSERT INTO schema_migrations (version) VALUES (${m.version}) ON CONFLICT DO NOTHING`;
      applied.add(m.version);
      console.log("baselined " + m.version + " (existing schema)");
    }
  }

  const files = singleFile
    ? [{ version: path.basename(singleFile), fullPath: path.resolve(root, singleFile) }]
    : listMigrations();

  let ran = 0;
  for (const migration of files) {
    if (applied.has(migration.version)) continue;
    if (!fs.existsSync(migration.fullPath)) {
      console.error("Missing migration file: " + migration.fullPath);
      process.exit(1);
    }
    const body = fs.readFileSync(migration.fullPath, "utf8");
    if (dryRun) {
      console.log("would apply " + migration.version);
      continue;
    }
    console.log("applying " + migration.version + " …");
    await sql.begin(async (tx) => {
      await tx.unsafe(body);
      await tx`INSERT INTO schema_migrations (version) VALUES (${migration.version})`;
    });
    ran += 1;
    console.log("  ✓ " + migration.version);
  }

  console.log(ran === 0 ? "Nothing to apply." : `Applied ${ran} migration(s).`);
}

function listMigrations() {
  if (!fs.existsSync(migrationsDir)) return [];
  return fs
    .readdirSync(migrationsDir)
    .filter((f) => f.endsWith(".sql"))
    .sort()
    .map((f) => ({ version: f, fullPath: path.join(migrationsDir, f) }));
}

async function tableExists(name) {
  const rows = await sql`
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = ${name}
    LIMIT 1;
  `;
  return rows.length > 0;
}

main()
  .catch((err) => {
    console.error("Migration failed:", err.message);
    if (err.detail) console.error(err.detail);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
