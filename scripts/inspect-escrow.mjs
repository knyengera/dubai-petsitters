import path from "node:path";
import fs from "node:fs";
import { fileURLToPath } from "node:url";
import pg from "pg";
import { buildDatabaseUrl } from "./lib/database-url.mjs";

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

const client = new pg.Client({
  connectionString: buildDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
});

async function main() {
  await client.connect();

  const escrow = await client.query(`
    SELECT e.id AS escrow_id, e.booking_id, e.host_id, e.status AS escrow_status,
           e.gross_amount, e.host_earnings, e.refunded_amount, e.currency,
           e.payment_id, e.release_eligible_at, e.released_at,
           b.status AS booking_status, b.payment_status, b.escrow_status AS booking_escrow_status,
           p.status AS payment_status, p.payment_provider, p.gateway, p.provider_payment_id,
           p.refunded_amount AS payment_refunded
    FROM escrow_accounts e
    LEFT JOIN hosting_bookings b ON b.id = e.booking_id
    LEFT JOIN payments p ON p.id = e.payment_id
    ORDER BY e.created_at DESC
    LIMIT 50;
  `);

  console.log(`\n=== ESCROW ACCOUNTS (${escrow.rowCount}) ===`);
  for (const r of escrow.rows) {
    console.log(JSON.stringify(r));
  }

  const balances = await client.query(`
    SELECT host_id, currency, available_balance, pending_balance, lifetime_earned, lifetime_paid_out
    FROM host_balances ORDER BY updated_at DESC LIMIT 50;
  `);
  console.log(`\n=== HOST BALANCES (${balances.rowCount}) ===`);
  for (const r of balances.rows) console.log(JSON.stringify(r));

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
