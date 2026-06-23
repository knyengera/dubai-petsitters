import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  buildDatabaseUrl,
  formatConnectionHelp,
  getProjectRef,
  warnIfIpv6Only,
} from "./lib/database-url.mjs";

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

const projectRef = getProjectRef();
const databaseUrl = buildDatabaseUrl();

if (!databaseUrl) {
  console.error(
    "Missing database connection. Set DATABASE_URL, SUPABASE_DB_POOLER_URL, or SUPABASE_DB_PASSWORD in .env.local"
  );
  process.exit(1);
}

const seedFiles = ["seed.sql", "seed-blog.sql", "seed-forum.sql"];

const client = new pg.Client({
  connectionString: databaseUrl,
  ssl: { rejectUnauthorized: false },
});

async function runSeedFile(name) {
  const seedPath = path.join(root, "supabase", name);
  const sql = fs.readFileSync(seedPath, "utf8");
  console.log(`Applying ${name}...`);
  await client.query(sql);
}

async function main() {
  console.log(`Seeding database → ${projectRef ?? "custom DATABASE_URL"}`);
  await warnIfIpv6Only(databaseUrl);
  await client.connect();

  try {
    for (const file of seedFiles) {
      await runSeedFile(file);
    }

    const checks = await client.query(`
      SELECT
        (SELECT count(*)::int FROM pet_hosts WHERE created_by = 'seed@dubaipetsitters.com') AS pet_hosts,
        (SELECT count(*)::int FROM blog_posts WHERE created_by = 'seed@dubaipetsitters.com') AS blog_posts,
        (SELECT count(*)::int FROM forum_topics WHERE id::text LIKE '66666666-%') AS forum_topics
    `);

    console.log("Seed complete.");
    console.log(`  Pet hosts: ${checks.rows[0].pet_hosts}`);
    console.log(`  Blog posts: ${checks.rows[0].blog_posts}`);
    console.log(`  Forum topics: ${checks.rows[0].forum_topics}`);
  } catch (error) {
    console.error("Seed failed:", error.message);
    if (/ENETUNREACH|ENOTFOUND|ETIMEDOUT/i.test(error.message)) {
      console.error("\n" + formatConnectionHelp(projectRef));
    }
    process.exit(1);
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
