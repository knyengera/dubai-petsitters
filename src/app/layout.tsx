import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";

export const metadata: Metadata = {
  title: "Saudi Petsitters",
  description:
    "Saudi Arabia's trusted pet care community — adoption, hosting, and veterinary resources.",
  icons: {
    icon: [{ url: "/logo-icon.png", type: "image/png" }],
    shortcut: ["/logo-icon.png"],
    apple: [{ url: "/logo-icon.png", type: "image/png" }],
  },
  openGraph: {
    title: "Saudi Petsitters",
    description:
      "Saudi Arabia's trusted pet care community — adoption, hosting, and veterinary resources.",
    images: [
      {
        url: "/logo.png",
        width: 656,
        height: 200,
        alt: "Saudi Petsitters",
      },
    ],
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
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
