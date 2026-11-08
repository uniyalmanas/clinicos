/**
 * Find staff accounts whose password is still a known historical default.
 *
 * Read-only by default:
 *   node scripts/audit-default-passwords.mjs
 *
 * Rotate every match to a random password (written to a file, never stdout):
 *   node scripts/audit-default-passwords.mjs --fix --out ./rotated-passwords.txt
 *
 * Delete the output file after distributing the new credentials securely.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import crypto from "node:crypto";
import postgres from "postgres";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match) continue;
    let value = match[2].trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (process.env[match[1]] === undefined || process.env[match[1]] === "") {
      process.env[match[1]] = value;
    }
  }
}

loadEnv(path.join(root, "apps", "web", ".env.local"));
loadEnv(path.join(root, ".env.local"));

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is not set.");
  process.exit(1);
}

// Keep in sync with apps/web/src/lib/password.ts.
const DEFAULT_PASSWORDS = [
  "Password@123",
  "password123",
  "1234567890",
  "123456789012",
  "qwertyuiop12",
  "clinicos@123",
  "admin@123456",
  "welcometo123",
  "letmein12345",
];

const shouldFix = process.argv.includes("--fix");
const outIndex = process.argv.indexOf("--out");
const outFile = outIndex >= 0 ? process.argv[outIndex + 1] : null;

if (shouldFix && !outFile) {
  console.error("FATAL: --fix requires --out <file> so new passwords are not printed to logs.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL, { max: 1 });

async function main() {
  const users = await sql`
    SELECT id, phone, full_name, role, password_hash
    FROM user_accounts
    WHERE role <> 'patient'
    ORDER BY role, phone
  `;

  const matches = [];
  for (const user of users) {
    if (!user.password_hash) continue;
    for (const candidate of DEFAULT_PASSWORDS) {
      let matched = false;
      try {
        matched = await bcrypt.compare(candidate, user.password_hash);
      } catch {
        matched = false;
      }
      if (matched) {
        matches.push({ id: user.id, phone: user.phone, role: user.role, candidate });
        break;
      }
    }
  }

  console.log(
    `Scanned ${users.length} staff accounts; ${matches.length} still use a known default.`
  );
  for (const m of matches) {
    console.log(`  - ${m.role.padEnd(14)} ${m.phone}  (matched default #${DEFAULT_PASSWORDS.indexOf(m.candidate) + 1})`);
  }

  if (matches.length === 0 || !shouldFix) {
    if (matches.length > 0) {
      console.log("\nRe-run with --fix --out <file> to rotate these accounts.");
    }
    return;
  }

  const lines = ["phone\trole\tnew_password"];
  for (const m of matches) {
    const newPassword = crypto.randomBytes(18).toString("base64url");
    const hash = await bcrypt.hash(newPassword, 10);
    await sql`UPDATE user_accounts SET password_hash = ${hash} WHERE id = ${m.id}`;
    lines.push(`${m.phone}\t${m.role}\t${newPassword}`);
  }

  fs.writeFileSync(outFile, `${lines.join("\n")}\n`, { mode: 0o600 });
  console.log(`\nRotated ${matches.length} accounts. New passwords written to ${outFile}.`);
  console.log("Distribute them securely, then delete that file.");
}

main()
  .catch((err) => {
    console.error("Audit failed:", err.message);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
