import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const migrationsDir = path.join(root, "supabase", "migrations");

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

const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".sql"))
  .sort();

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function ensureMigrationTable() {
  await client.query(`
    CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
      version text PRIMARY KEY,
      name text,
      statements text[]
    );
  `);
  await client.query(`CREATE SCHEMA IF NOT EXISTS supabase_migrations;`);
}

async function getApplied() {
  const { rows } = await client.query(
    `SELECT version FROM supabase_migrations.schema_migrations`
  ).catch(async () => {
    await client.query(`CREATE SCHEMA IF NOT EXISTS supabase_migrations;`);
    await client.query(`
      CREATE TABLE IF NOT EXISTS supabase_migrations.schema_migrations (
        version text PRIMARY KEY,
        name text
      );
    `);
    return { rows: [] };
  });
  return new Set(rows.map((r) => r.version));
}

async function main() {
  console.log(`Connecting to project: ${projectRef ?? "custom DATABASE_URL"}`);
  await client.connect();

  const applied = await getApplied();

  for (const file of files) {
    const version = file.replace(/\.sql$/, "");
    if (applied.has(version)) {
      console.log(`Skipping already applied: ${file}`);
      continue;
    }

    const sql = fs.readFileSync(path.join(migrationsDir, file), "utf8");
    console.log(`Applying: ${file}`);
    await client.query("BEGIN");
    try {
      await client.query(sql);
      await client.query(
        `INSERT INTO supabase_migrations.schema_migrations (version, name)
         VALUES ($1, $2)`,
        [version, file]
      );
      await client.query("COMMIT");
      console.log(`Applied: ${file}`);
    } catch (error) {
      await client.query("ROLLBACK");
      console.error(`Failed on ${file}:`, error.message);
      process.exit(1);
    }
  }

  await client.end();
  console.log("All migrations applied successfully.");
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
