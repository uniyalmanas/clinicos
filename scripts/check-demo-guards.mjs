/**
 * Guard against demo fixtures leaking into API responses.
 *
 * API routes must never import the static fixture modules directly. The only
 * sanctioned path is `@/lib/demo-data`, which requires
 * `NODE_ENV !== "production" && ALLOW_DEMO_DATA === "true"` and is expected to
 * be paired with a 503 fallback via `databaseUnavailable()`.
 *
 * Usage: node scripts/check-demo-guards.mjs
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const apiDir = path.join(root, "apps", "web", "src", "app", "api");

const FORBIDDEN = [
  {
    pattern: /from\s+["']@\/data\/(?:doctors|clinics)["']/,
    reason: "imports static fixtures directly instead of @/lib/demo-data",
  },
  {
    pattern: /\bDEHRADUN_(?:DOCTORS|CLINICS)\b/,
    reason: "references DEHRADUN_* fixtures directly",
  },
];

function walk(dir) {
  if (!fs.existsSync(dir)) return [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...walk(full));
    else if (entry.isFile() && entry.name === "route.ts") files.push(full);
  }
  return files;
}

const offenders = [];
for (const file of walk(apiDir)) {
  const relative = path.relative(root, file).replace(/\\/g, "/");
  const lines = fs.readFileSync(file, "utf8").split(/\r?\n/);
  lines.forEach((line, index) => {
    for (const rule of FORBIDDEN) {
      if (rule.pattern.test(line)) {
        offenders.push(`${relative}:${index + 1} ${rule.reason}`);
      }
    }
  });
}

if (offenders.length > 0) {
  console.error("Demo-data guard check failed:\n");
  for (const offender of offenders) console.error(`  ${offender}`);
  console.error(
    "\nMove fixture access behind @/lib/demo-data and return a 503 when demo data is not explicitly enabled."
  );
  process.exit(1);
}

console.log("Demo-data guard check passed: no API route imports fixtures directly.");
