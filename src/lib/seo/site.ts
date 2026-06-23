import { getAppBaseUrl } from "@/lib/notifications/config";

export const SITE_NAME = "Saudi Petsitters";

export const SITE_TAGLINE =
  "Saudi Arabia's trusted pet care community — pet sitting, boarding, vets, and adoption.";

export const SITE_TITLE_TEMPLATE = `%s | ${SITE_NAME}`;

export const DEFAULT_OG_IMAGE = "/logo.png";

export const SITE_LOCALE = "en_SA";

export const TWITTER_CARD = "summary_large_image" as const;

export const CONTACT_EMAIL = "hello@saudipetsitters.com";

/** Human-readable platform phone number. */
export const CONTACT_PHONE = "+966 54 853 9353";

/** E.164 format for tel:, sms:, and wa.me links. */
export const CONTACT_PHONE_TEL = "+966548539353";

/** Absolute production/site origin, used for canonical URLs, OG tags, and JSON-LD. */
export function getSiteUrl(): string {
  return getAppBaseUrl();
}

/** Build an absolute URL for a given path against the site origin. */
export function absoluteUrl(path = "/"): string {
  const base = getSiteUrl();
  if (!path) return base;
  return path.startsWith("/") ? `${base}${path}` : `${base}/${path}`;
}
