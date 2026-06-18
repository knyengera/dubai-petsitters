import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import {
  DEFAULT_OG_IMAGE,
  SITE_LOCALE,
  SITE_NAME,
  SITE_TAGLINE,
  SITE_TITLE_TEMPLATE,
  TWITTER_CARD,
  getSiteUrl,
} from "@/lib/seo/site";
import {
  JsonLd,
  organizationSchema,
  websiteSchema,
} from "@/lib/seo/json-ld";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: SITE_NAME,
    template: SITE_TITLE_TEMPLATE,
  },
  description: SITE_TAGLINE,
  applicationName: SITE_NAME,
  manifest: "/site.webmanifest",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon-96x96.png", type: "image/png", sizes: "96x96" },
    ],
    shortcut: ["/favicon.ico"],
    apple: [
      {
        url: "/apple-touch-icon.png",
        sizes: "180x180",
        type: "image/png",
      },
    ],
  },
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    locale: SITE_LOCALE,
    url: getSiteUrl(),
    title: SITE_NAME,
    description: SITE_TAGLINE,
    images: [
      {
        url: DEFAULT_OG_IMAGE,
        width: 656,
        height: 200,
        alt: SITE_NAME,
      },
    ],
  },
  twitter: {
    card: TWITTER_CARD,
    title: SITE_NAME,
    description: SITE_TAGLINE,
    images: [DEFAULT_OG_IMAGE],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-full antialiased">
        <JsonLd data={[organizationSchema(), websiteSchema()]} />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
