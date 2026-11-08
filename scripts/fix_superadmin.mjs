/**
 * Rotate the platform super-admin password.
 *
 * There is deliberately no default value. Supply the new password through the
 * environment so it never lands in shell history or in this repository:
 *
 *   SUPERADMIN_PASSWORD='<12+ chars>' SUPERADMIN_PHONE='superadmin' \
 *     node scripts/fix_superadmin.mjs
 */
import path from "node:path";
import url from "node:url";
import fs from "node:fs";
import postgres from "postgres";
import bcrypt from "bcryptjs";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

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
    if (process.env[key] === undefined || process.env[key] === "") {
      process.env[key] = value;
    }
  }
}

loadEnv(path.join(root, "apps", "web", ".env.local"));
loadEnv(path.join(root, ".env.local"));

const newPassword = process.env.SUPERADMIN_PASSWORD;
const identifier = process.env.SUPERADMIN_PHONE || "superadmin";

if (!process.env.DATABASE_URL) {
  console.error("FATAL: DATABASE_URL is not set.");
  process.exit(1);
}
if (!newPassword) {
  console.error(
    "FATAL: SUPERADMIN_PASSWORD is required. Refusing to reset to a built-in default."
  );
  process.exit(1);
}
if (newPassword === "Password@123") {
  console.error("FATAL: SUPERADMIN_PASSWORD must not be the historical default.");
  process.exit(1);
}
if (newPassword.length < 12) {
  console.error("FATAL: SUPERADMIN_PASSWORD must be at least 12 characters.");
  process.exit(1);
}

const sql = postgres(process.env.DATABASE_URL);

async function main() {
  const hash = await bcrypt.hash(newPassword, 10);
  const updated = await sql`
    UPDATE user_accounts
    SET password_hash = ${hash}, is_verified = true, is_active = true
    WHERE phone = ${identifier}
    RETURNING id, phone, email
  `;

  if (updated.length === 0) {
    console.error(`No account found for identifier '${identifier}'. Nothing changed.`);
    await sql.end();
    process.exit(1);
  }

  console.log(`Password rotated for ${updated[0].phone} (id ${updated[0].id}).`);
  await sql.end();
}

main().catch(async (err) => {
  console.error("Password rotation failed:", err.message);
  await sql.end().catch(() => {});
  process.exit(1);
});
