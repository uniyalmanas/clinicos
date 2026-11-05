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
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    if (process.env[key] === undefined) process.env[key] = value;
  }
}

loadEnv(path.join(root, "apps", "web", ".env.local"));
const sql = postgres(process.env.DATABASE_URL);

async function main() {
  const hash = await bcrypt.hash("Password@123", 10);
  await sql`UPDATE user_accounts SET password_hash = ${hash} WHERE phone = 'superadmin';`;
  console.log("Superadmin password hash updated successfully!");
  const user = await sql`SELECT id, phone, email, password_hash FROM user_accounts WHERE phone = 'superadmin';`;
  console.log("Verified user:", user[0]?.phone, "hash length:", user[0]?.password_hash?.length);
  await sql.end();
}

main();
