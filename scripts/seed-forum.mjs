#!/usr/bin/env node
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  for (const line of fs.readFileSync(filePath, "utf8").split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const idx = trimmed.indexOf("=");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim();
    const value = trimmed.slice(idx + 1).trim();
    if (!process.env[key]) process.env[key] = value;
  }
}

loadEnvFile(path.join(root, ".env.local"));
loadEnvFile(path.join(root, ".env"));

const projectRef =
  process.env.SUPABASE_PROJECT_REF ||
  process.env.NEXT_PUBLIC_SUPABASE_URL?.match(
    /https:\/\/([^.]+)\.supabase\.co/
  )?.[1];

const password = process.env.SUPABASE_DB_PASSWORD;
const databaseUrl =
  process.env.DATABASE_URL ||
  (projectRef && password
    ? `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`
    : null);

if (!databaseUrl) {
  console.error(
    "Missing database connection. Set DATABASE_URL or SUPABASE_DB_PASSWORD in .env.local"
  );
  process.exit(1);
}

const seedPath = path.join(root, "supabase", "seed-forum.sql");
const sql = fs.readFileSync(seedPath, "utf8");

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  await client.query(sql);
  console.log("Forum seed applied successfully.");
} catch (error) {
  console.error("Forum seed failed:", error.message);
  process.exit(1);
} finally {
  await client.end();
}
