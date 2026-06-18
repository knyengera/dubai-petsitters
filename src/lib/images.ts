/** Universal fallback image shown whenever a listing/entity has no usable photo. */
export const FALLBACK_IMAGE = "/fallback.png";

/** Returns a trimmed image URL or null when empty. */
export function cleanImageUrl(value?: string | null): string | null {
  return typeof value === "string" && value.trim().length > 0
    ? value.trim()
    : null;
}
