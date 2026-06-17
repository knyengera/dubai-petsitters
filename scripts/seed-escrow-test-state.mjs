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

// Desired test state per booking. `provider` is forced to manual/bank_transfer so
// refunds exercise the full DB flow without calling the live Stripe API.
const TARGETS = [
  { booking_id: "1f854a6b-f83d-4bbc-8698-1797b1055e6f", state: "held", provider: "manual" },
  { booking_id: "20c7c70d-b72b-4ef1-839e-f947b1cc3c65", state: "held", provider: "bank_transfer" },
  { booking_id: "110f0fce-3a48-4715-b23f-4ee67459ec52", state: "released", provider: "manual" },
  { booking_id: "86ab8640-cdac-4e72-b0e6-8e4f50752745", state: "released", provider: "bank_transfer" },
];

const client = new pg.Client({
  connectionString: buildDatabaseUrl(),
  ssl: { rejectUnauthorized: false },
});

async function captureBooking(escrow, provider) {
  const providerPaymentId = `seed_${provider}_${escrow.payment_id.slice(0, 8)}`;

  await client.query(
    `UPDATE payments
       SET status = 'captured',
           payment_provider = $2,
           gateway = $2,
           provider_payment_id = $3
     WHERE id = $1`,
    [escrow.payment_id, provider, providerPaymentId]
  );

  await client.query(
    `UPDATE hosting_bookings
       SET payment_status = 'paid',
           status = 'confirmed',
           escrow_status = 'held',
           updated_at = now()
     WHERE id = $1`,
    [escrow.booking_id]
  );

  await client.query(
    `UPDATE escrow_accounts
       SET status = 'held', updated_at = now()
     WHERE id = $1`,
    [escrow.escrow_id]
  );

  await client.query(
    `SELECT public.monetisation_append_ledger(
        'escrow_hold', $1, $2, 'debit',
        $3, $4, $5, NULL, $6,
        NULL, 'seed-script', 'Payment captured; funds held in escrow (seed)', '{}'::jsonb)`,
    [escrow.gross_amount, escrow.currency, escrow.booking_id, escrow.escrow_id, escrow.payment_id, escrow.host_id]
  );

  await client.query(
    `SELECT public.monetisation_append_ledger(
        'platform_guest_fee', $1, $2, 'credit',
        $3, $4, $5, NULL, $6,
        NULL, 'seed-script', 'Platform guest service fee recorded (seed)', '{}'::jsonb)`,
    [escrow.guest_fee_amount, escrow.currency, escrow.booking_id, escrow.escrow_id, escrow.payment_id, escrow.host_id]
  );
}

async function releaseBooking(escrow) {
  // ensure a balance row exists, then credit host earnings
  await client.query(`SELECT public.monetisation_ensure_host_balance($1, $2)`, [
    escrow.host_id,
    escrow.currency,
  ]);

  await client.query(
    `UPDATE host_balances
       SET available_balance = available_balance + $2,
           lifetime_earned = lifetime_earned + $2,
           updated_at = now()
     WHERE host_id = $1`,
    [escrow.host_id, escrow.host_earnings]
  );

  await client.query(
    `UPDATE escrow_accounts
       SET status = 'released', released_at = now(), updated_at = now()
     WHERE id = $1`,
    [escrow.escrow_id]
  );

  await client.query(
    `UPDATE hosting_bookings
       SET escrow_status = 'released',
           release_status = 'released',
           funds_released_at = now(),
           updated_at = now()
     WHERE id = $1`,
    [escrow.booking_id]
  );

  await client.query(
    `SELECT public.monetisation_append_ledger(
        'release_to_host', $1, $2, 'credit',
        $3, $4, $5, NULL, $6,
        NULL, 'seed-script', 'Escrow released to host available balance (seed)', '{}'::jsonb)`,
    [escrow.host_earnings, escrow.currency, escrow.booking_id, escrow.escrow_id, escrow.payment_id, escrow.host_id]
  );
}

async function main() {
  await client.connect();

  for (const target of TARGETS) {
    const { rows } = await client.query(
      `SELECT id AS escrow_id, booking_id, host_id, payment_id, currency,
              gross_amount, guest_fee_amount, host_earnings, status
         FROM escrow_accounts WHERE booking_id = $1`,
      [target.booking_id]
    );
    if (rows.length === 0) {
      console.log(`Skip ${target.booking_id}: escrow not found`);
      continue;
    }
    const escrow = rows[0];

    await client.query("BEGIN");
    try {
      // always (re)capture into held first
      await captureBooking(escrow, target.provider);
      if (target.state === "released") {
        await releaseBooking(escrow);
      }
      await client.query("COMMIT");
      console.log(
        `OK  ${target.booking_id} -> ${target.state} (${target.provider}) gross=${escrow.gross_amount} host=${escrow.host_earnings}`
      );
    } catch (e) {
      await client.query("ROLLBACK");
      console.error(`FAIL ${target.booking_id}:`, e.message);
    }
  }

  const balances = await client.query(
    `SELECT host_id, currency, available_balance, lifetime_earned FROM host_balances ORDER BY updated_at DESC`
  );
  console.log("\n=== HOST BALANCES AFTER SEED ===");
  for (const r of balances.rows) console.log(JSON.stringify(r));

  await client.end();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
