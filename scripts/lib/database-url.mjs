import dns from "node:dns/promises";

export function getProjectRef(env = process.env) {
  return (
    env.SUPABASE_PROJECT_REF ||
    env.NEXT_PUBLIC_SUPABASE_URL?.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1] ||
    null
  );
}

export function buildDatabaseUrl(env = process.env) {
  if (env.DATABASE_URL) return env.DATABASE_URL;
  if (env.SUPABASE_DB_POOLER_URL) return env.SUPABASE_DB_POOLER_URL;

  const projectRef = getProjectRef(env);
  const password = env.SUPABASE_DB_PASSWORD;
  const poolerHost = env.SUPABASE_DB_POOLER_HOST;

  if (projectRef && password && poolerHost) {
    const user = env.SUPABASE_DB_POOLER_USER || `postgres.${projectRef}`;
    const port = env.SUPABASE_DB_POOLER_PORT || "5432";
    return `postgresql://${user}:${encodeURIComponent(password)}@${poolerHost}:${port}/postgres`;
  }

  if (projectRef && password) {
    return `postgresql://postgres:${encodeURIComponent(password)}@db.${projectRef}.supabase.co:5432/postgres`;
  }

  return null;
}

export async function warnIfIpv6Only(databaseUrl) {
  try {
    const host = new URL(databaseUrl).hostname;
    const records = await dns.lookup(host, { all: true });
    const hasIpv4 = records.some((r) => r.family === 4);
    const hasIpv6 = records.some((r) => r.family === 6);
    if (!hasIpv4 && hasIpv6) {
      console.warn(
        `Warning: ${host} resolves to IPv6 only. If connect fails with ENETUNREACH, set DATABASE_URL to the Session pooler URI from Supabase Dashboard → Project Settings → Database → Connection pooling.`
      );
    }
  } catch {
    // ignore DNS preflight errors
  }
}

export function formatConnectionHelp(projectRef) {
  return [
    "Could not reach the Supabase database host (often IPv6-only direct connections on networks without IPv6).",
    "",
    "Fix: add a Session pooler URI to .env.local:",
    "  DATABASE_URL=postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres",
    "",
    "Copy the exact URI from:",
    "  Supabase Dashboard → Project Settings → Database → Connection pooling → Session mode → URI",
    projectRef ? `  Project ref: ${projectRef}` : "",
    "",
    "Then run: npm run db:migrate",
  ]
    .filter(Boolean)
    .join("\n");
}
