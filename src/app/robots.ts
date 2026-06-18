import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/lib/seo/site";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin/",
          "/dashboard",
          "/settings",
          "/messages",
          "/notifications",
          "/appointments",
          "/my-appointments",
          "/my-adoptions",
          "/pets",
          "/host-calendar",
          "/host-earnings",
          "/host-profile/",
          "/become-host",
          "/ai-chat",
          "/payments/",
          "/login",
          "/forgot-password",
          "/reset-password",
          "/profile/",
          "/api/",
        ],
      },
    ],
    sitemap: absoluteUrl("/sitemap.xml"),
    host: absoluteUrl("/"),
  };
}
