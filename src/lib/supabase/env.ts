function getProjectRefFromUrl(url: string): string | null {
  const match = url.match(/https:\/\/([^.]+)\.supabase\.co/);
  return match?.[1] ?? null;
}

function getProjectRefFromJwt(key: string): string | null {
  if (!key.startsWith("eyJ")) return null;

  try {
    const payload = JSON.parse(
      atob(key.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))
    ) as { ref?: string };
    return typeof payload.ref === "string" ? payload.ref : null;
  } catch {
    return null;
  }
}

export function getSupabaseUrl(): string {
  return process.env.NEXT_PUBLIC_SUPABASE_URL ?? "https://placeholder.supabase.co";
}

export function getSupabasePublicKey(): string {
  const publishable = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY?.trim();
  if (publishable) return publishable;

  const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
  if (!anon) {
    throw new Error(
      "Missing Supabase public API key. Set NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY."
    );
  }

  const urlRef = getProjectRefFromUrl(getSupabaseUrl());
  const anonRef = getProjectRefFromJwt(anon);
  if (urlRef && anonRef && anonRef !== urlRef) {
    throw new Error(
      `Supabase anon key is for project "${anonRef}" but NEXT_PUBLIC_SUPABASE_URL points to "${urlRef}". Use the matching publishable or anon key for this project.`
    );
  }

  return anon;
}
