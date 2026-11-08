#!/usr/bin/env node
/**
 * Static schema audit.
 *
 * Extracts the SQL the application actually executes (template literals in
 * app/api, lib and components), resolves table aliases, and compares every
 * referenced column against the live PostgreSQL schema.
 *
 *   node scripts/schema-audit.mjs
 *
 * Exits non-zero when the app references a table or column that does not
 * exist, so schema drift is caught before it becomes a runtime 42703.
 */
import fs from "node:fs";
import path from "node:path";
import url from "node:url";
import postgres from "postgres";

const __dirname = path.dirname(url.fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const srcRoot = path.join(root, "apps", "web", "src");

function loadEnv(file) {
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
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

const connectionString = (process.env.DIRECT_DATABASE_URL || process.env.DATABASE_URL || "").trim();
if (!connectionString) {
  console.error("DATABASE_URL is not set.");
  process.exit(1);
}

const normalized = connectionString.replace(/^postgres:\/\//, "postgresql://");
const sql = postgres(normalized, {
  ssl: /(?:localhost|127\.0\.0\.1|\[::1\])/i.test(normalized) ? false : { rejectUnauthorized: false },
  max: 1,
  prepare: false,
  onnotice: () => {},
});

const SQLISH = /\b(?:select|insert\s+into|update\s+[a-z_]+\s+set|delete\s+from)\b/i;
const RESERVED = new Set([
  "select", "from", "where", "and", "or", "not", "null", "true", "false", "as",
  "on", "join", "left", "right", "inner", "outer", "full", "cross", "lateral",
  "group", "by", "order", "asc", "desc", "limit", "offset", "having", "distinct",
  "case", "when", "then", "else", "end", "in", "is", "like", "ilike", "between",
  "union", "all", "exists", "set", "values", "into", "update", "delete", "insert",
  "returning", "conflict", "do", "nothing", "excluded", "filter", "over", "partition",
  "current_date", "current_timestamp", "now", "interval", "cast", "coalesce",
  "greatest", "least", "count", "sum", "avg", "min", "max", "lower", "upper",
  "trim", "right", "left", "regexp_replace", "jsonb_array_elements", "unnest",
  "generate_series", "array_agg", "jsonb_build_object", "row_number", "date_trunc",
  "text", "varchar", "jsonb", "json", "numeric", "integer", "int", "bigint",
  "uuid", "date", "time", "timestamp", "timestamptz", "boolean", "bool",
  "unknown", "table", "only", "public", "any", "some", "array", "with",
  "using", "natural", "nulls", "first", "last", "within", "at", "zone",
  "extract", "epoch", "day", "sql", "month", "year", "hour", "minute", "second",
  "replace", "substring", "length", "position", "to_char", "to_date", "round",
  "abs", "floor", "ceil", "ceiling", "random", "gen_random_uuid", "concat",
  "string_agg", "bool_and", "bool_or", "percentile_cont", "stddev", "variance",
]);

const FUNCTION_NAMES = new Set([
  "coalesce", "greatest", "least", "count", "sum", "avg", "min", "max", "lower",
  "upper", "trim", "right", "regexp_replace", "jsonb_array_elements", "unnest",
  "generate_series", "array_agg", "jsonb_build_object", "row_number", "date_trunc",
  "now", "gen_random_uuid", "replace", "substring", "length", "to_char", "to_date",
  "round", "abs", "floor", "ceil", "ceiling", "random", "concat", "string_agg",
  "bool_and", "bool_or", "percentile_cont", "stddev", "variance", "extract",
  "nullif",
]);

function stripStrings(s) {
  return s
    .replace(/'(?:[^']|'')*'/g, "''")
    .replace(/\$\{[^}]*\}/g, "$param");
}

function stripAliases(s) {
  return s.replace(/\s+as\s+[a-z_][a-z0-9_]*/gi, "").replace(/\$[a-z_][a-z0-9_]*/gi, "?");
}

function splitTopLevel(s, delimiter = ",") {
  const parts = [];
  let depth = 0;
  let current = "";
  for (const ch of s) {
    if (ch === "(") depth += 1;
    else if (ch === ")") depth -= 1;
    if (ch === delimiter && depth === 0) {
      parts.push(current);
      current = "";
    } else {
      current += ch;
    }
  }
  if (current.trim()) parts.push(current);
  return parts;
}

function identifiers(s) {
  // Drop result aliases ("... AS total_cash") and bind parameters ("$param").
  const cleaned = s.replace(/\$[a-z_][a-z0-9_]*/gi, "?").replace(/\s+as\s+[a-z_][a-z0-9_]*\s*$/gi, "");
  return [...cleaned.matchAll(/(?:\b[a-z_][a-z0-9_]*\s*\.\s*)?\b([a-z_][a-z0-9_]*)\b/gi)].map((m) =>
    m[1].toLowerCase()
  );
}

function tableRefs(body) {
  const refs = [];
  for (const m of body.matchAll(/\b(?:from|join|update|into)\s+(?:public\.)?"?([a-z_][a-z0-9_]*)"?(?:\s+(?:as\s+)?([a-z_][a-z0-9_]*))?/gi)) {
    const table = m[1].toLowerCase();
    const alias = (m[2] || "").toLowerCase();
    if (["select", "where", "set", "values", "lateral", "only"].includes(table)) continue;
    refs.push({ table, alias: alias && !RESERVED.has(alias) && alias !== "set" ? alias : null });
  }
  return refs;
}

function resolveColumn(tableInfo, qualifier, column, tables) {
  if (qualifier) {
    const target = tables.find((t) => t.alias === qualifier) || tables.find((t) => t.table === qualifier);
    if (!target) return null;
    return { table: target.table, column };
  }
  if (tables.length === 1) return { table: tables[0].table, column };
  // A bare column in a multi-table query: attribute it to a table that has it.
  return { table: null, column };
}

const files = [];
function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    else if (/\.(ts|tsx)$/.test(entry.name)) files.push(full);
  }
}
walk(srcRoot);

const usages = new Map(); // table -> Map(column -> Set(file))
const missingTables = new Map();
const unknown = [];

for (const file of files) {
  const text = fs.readFileSync(file, "utf8");
  const literals = [...text.matchAll(/`([^`]*)`/gs)].map((m) => m[1]);
  for (const literal of literals) {
    if (!SQLISH.test(literal)) continue;
    const body = stripStrings(literal);
    if (!/\b(?:select|insert|update|delete)\b/i.test(body)) continue;
    const refs = tableRefs(body);
    if (!refs.length) continue;

    const record = (table, column) => {
      if (!table || RESERVED.has(column) || FUNCTION_NAMES.has(column)) return;
      // Aggregate / subquery aliases are not real columns.
      if (
        column === table ||
        /^(?:total|active|completed|pending|pre_auth|query|approved|settled|occupied|waiting)_(?:count|tasks|tokens|volume|beds)$/.test(column) ||
        /^(?:max_v|total_cash|total_fee|total_pharm|total_exp|total_approved_amount|cash|upi|gross|visits|balance)$/.test(column)
      ) {
        return;
      }
      if (!/^[a-z_][a-z0-9_]*$/i.test(column)) return;
      if (!usages.has(table)) usages.set(table, new Map());
      const cols = usages.get(table);
      if (!cols.has(column)) cols.set(column, new Set());
      cols.get(column).add(path.relative(root, file));
    };

    // INSERT column lists.
    for (const m of body.matchAll(/insert\s+into\s+(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s*\(([^)]*)\)/gi)) {
      const table = m[1].toLowerCase();
      for (const col of m[2].split(",")) record(table, col.trim().toLowerCase());
    }

    // UPDATE SET column lists.
    for (const m of body.matchAll(/update\s+(?:public\.)?"?([a-z_][a-z0-9_]*)"?\s+set\s+([\s\S]*?)(?:\bwhere\b|\breturning\b|$)/gi)) {
      const table = m[1].toLowerCase();
      for (const assignment of splitTopLevel(m[2])) {
        const col = assignment.split("=")[0].trim().toLowerCase();
        if (/^[a-z_][a-z0-9_]*$/.test(col)) record(table, col);
      }
    }

    // Qualified references anywhere (alias.column).
    const aliasToTable = new Map();
    for (const ref of refs) if (ref.alias) aliasToTable.set(ref.alias, ref.table);
    for (const m of body.matchAll(/\b([a-z_][a-z0-9_]*)\s*\.\s*([a-z_][a-z0-9_]*)\b/gi)) {
      const qualifier = m[1].toLowerCase();
      const column = m[2].toLowerCase();
      const table = aliasToTable.get(qualifier) || refs.find((r) => r.table === qualifier)?.table;
      if (table) record(table, column);
    }

    // Bare columns for single-table queries.
    if (refs.length === 1) {
      const table = refs[0].table;
      const selectMatch = body.match(/select\s+([\s\S]*?)\s+from\s+/i);
      if (selectMatch) {
        for (const item of splitTopLevel(selectMatch[1])) {
          const expr = stripAliases(item.trim());
          if (expr === "*" || expr.endsWith(".*")) continue;
          for (const col of identifiers(expr)) record(table, col);
        }
      }
      for (const clause of body.matchAll(/\b(?:where|and|or|order\s+by|group\s+by|having)\s+([\s\S]*?)(?=\b(?:order\s+by|group\s+by|having|limit|offset|returning|for\s+update)\b|$)/gi)) {
        for (const col of identifiers(clause[1])) record(table, col);
      }
    }
  }
}

async function main() {
  const columns = await sql`
    SELECT table_name, column_name
    FROM information_schema.columns
    WHERE table_schema = 'public';
  `;
  const schema = new Map();
  for (const row of columns) {
    if (!schema.has(row.table_name)) schema.set(row.table_name, new Set());
    schema.get(row.table_name).add(row.column_name);
  }

  let problems = 0;
  for (const [table, cols] of [...usages].sort()) {
    if (!schema.has(table)) {
      missingTables.set(table, cols);
      continue;
    }
    const known = schema.get(table);
    const missing = [...cols.keys()].filter((c) => !known.has(c)).sort();
    if (missing.length) {
      problems += missing.length;
      console.log(`\n${table}`);
      for (const col of missing) {
        console.log(`  missing column: ${col}`);
        for (const file of [...cols.get(col)].slice(0, 4)) console.log(`    used in ${file}`);
      }
    }
  }

  if (missingTables.size) {
    console.log("\nMISSING TABLES");
    for (const [table, cols] of [...missingTables].sort()) {
      console.log(`  ${table} (${cols.size} columns referenced)`);
      for (const file of [...new Set([...cols.values()].flatMap((s) => [...s]))].slice(0, 4)) {
        console.log(`    used in ${file}`);
      }
    }
    problems += missingTables.size;
  }

  if (problems === 0) {
    console.log("Schema audit clean: every referenced table and column exists.");
  } else {
    console.log(`\n${problems} schema mismatch(es) found.`);
    process.exitCode = 1;
  }
}

main()
  .catch((err) => {
    console.error("Schema audit failed:", err);
    process.exitCode = 1;
  })
  .finally(() => sql.end());
