/** Routes that require an authenticated session. */
const PROTECTED_EXACT = new Set([
  "/dashboard",
  "/my-appointments",
  "/messages",
  "/settings",
  "/host-calendar",
  "/appointments",
  "/ai-chat",
  "/become-host",
  "/pets",
]);

const PET_HEALTH_PATH = /^\/pets\/[^/]+\/health$/;

export function isProtectedPath(pathname: string): boolean {
  if (pathname.startsWith("/admin")) return true;
  if (PROTECTED_EXACT.has(pathname)) return true;
  if (PET_HEALTH_PATH.test(pathname)) return true;
  return false;
}

export function isAdminPath(pathname: string): boolean {
  return pathname.startsWith("/admin");
}

export function isAdminRole(
  appMetadata: Record<string, unknown> | undefined
): boolean {
  return appMetadata?.role === "admin";
}

/** Safe relative post-login path (blocks open redirects). */
export function getSafeNextPath(next: string | null | undefined): string {
  if (!next || !next.startsWith("/") || next.startsWith("//")) {
    return "/dashboard";
  }
  return next;
}
