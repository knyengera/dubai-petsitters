import { getAppBaseUrl } from "@/lib/notifications/config";

export const SITE_NAME = "Dubai Petsitters";

export const SITE_TAGLINE =
  "The UAE's trusted pet care community — pet sitting, boarding, vets, and adoption.";

export const SITE_TITLE_TEMPLATE = `%s | ${SITE_NAME}`;

export const DEFAULT_OG_IMAGE = "/logo.png";

export const SITE_LOCALE = "en_AE";

export const TWITTER_CARD = "summary_large_image" as const;

export const CONTACT_EMAIL = "hello@dubaipetsitters.com";

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
