import type { Metadata } from "next";
import {
  DEFAULT_OG_IMAGE,
  SITE_LOCALE,
  SITE_NAME,
  TWITTER_CARD,
  absoluteUrl,
} from "@/lib/seo/site";

export type BuildMetadataInput = {
  title: string;
  description: string;
  /** Canonical path beginning with "/" (e.g. "/hosts"). */
  path: string;
  /** When true, the title bypasses the "%s | Dubai Petsitters" template. */
  absoluteTitle?: boolean;
  keywords?: string[];
  /** Absolute or root-relative image URL; falls back to the brand logo. */
  image?: string;
  /** Open Graph type. Defaults to "website". */
  type?: "website" | "article" | "profile";
  /** When true, instructs crawlers not to index the page. */
  noIndex?: boolean;
  /** Extra Open Graph fields for article pages. */
  article?: {
    publishedTime?: string;
    modifiedTime?: string;
    authors?: string[];
    tags?: string[];
  };
};

/**
 * Builds a complete, keyword-optimized Next.js Metadata object with canonical
 * URL, Open Graph, and Twitter card defaults consistent across the site.
 */
export function buildPageMetadata({
  title,
  description,
  path,
  absoluteTitle = false,
  keywords,
  image,
  type = "website",
  noIndex = false,
  article,
}: BuildMetadataInput): Metadata {
  const canonical = absoluteUrl(path);
  const ogImage = image ?? DEFAULT_OG_IMAGE;

  return {
    title: absoluteTitle ? { absolute: title } : title,
    description,
    keywords: keywords && keywords.length > 0 ? keywords : undefined,
    alternates: { canonical },
    robots: noIndex
      ? { index: false, follow: false }
      : { index: true, follow: true },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: SITE_NAME,
      locale: SITE_LOCALE,
      type: type === "profile" ? "website" : type,
      images: [{ url: ogImage, alt: title }],
      ...(article
        ? {
            publishedTime: article.publishedTime,
            modifiedTime: article.modifiedTime,
            authors: article.authors,
            tags: article.tags,
          }
        : {}),
    },
    twitter: {
      card: TWITTER_CARD,
      title,
      description,
      images: [ogImage],
    },
  };
}
