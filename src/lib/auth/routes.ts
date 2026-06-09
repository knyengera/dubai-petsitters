/** Routes accessible during onboarding (authenticated but profile incomplete). */
const ONBOARDING_EXEMPT_EXACT = new Set([
  "/profile/complete",
]);

/** Routes that require an authenticated session. */
const PROTECTED_EXACT = new Set([
  "/dashboard",
  "/my-appointments",
  "/messages",
  "/settings",
  "/host-calendar",
  "/appointments",
  "/become-host",
  "/pets",
  "/ai-chat",
]);

const PET_HEALTH_PATH = /^\/pets\/[^/]+\/health$/;

export function isOnboardingExemptPath(pathname: string): boolean {
  if (pathname === "/login") return true;
  if (pathname.startsWith("/auth/callback")) return true;
  if (ONBOARDING_EXEMPT_EXACT.has(pathname)) return true;
  return false;
}

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
