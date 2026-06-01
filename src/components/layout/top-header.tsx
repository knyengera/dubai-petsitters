"use client";

import { useRouter, usePathname } from "next/navigation";
import { ArrowLeft } from "lucide-react";

const MAIN_TAB_PATHS = ["/", "/dashboard", "/ai-chat", "/pets", "/vets"];

const EXACT_TITLES: Record<string, string> = {
  "/settings": "Settings",
  "/adopt": "Adopt a Pet",
  "/hosting": "Pet Hosting",
  "/hosts": "Find a Host",
  "/blog": "Blog",
  "/forum": "Community Forum",
  "/appointments": "Appointments",
  "/my-appointments": "My Appointments",
  "/travel": "Travel Compliance",
  "/lost-pets": "Lost Pets",
  "/become-host": "Become a Host",
  "/partners": "Partners & Advertise",
  "/vet-advertise": "Vet Advertising",
  "/messages": "Messages",
  "/host-calendar": "Host Calendar",
  "/about": "About Us",
  "/privacy": "Privacy Policy",
  "/terms": "Terms & Conditions",
  "/disclaimer": "Disclaimer",
};

const PATTERN_TITLES = [
  { pattern: /^\/blog\/.+/, title: "Article" },
  { pattern: /^\/hosts\/.+/, title: "Host Profile" },
  { pattern: /^\/vets\/.+/, title: "Vet Profile" },
  { pattern: /^\/forum\/.+/, title: "Forum Thread" },
  { pattern: /^\/pets\/.+\/health/, title: "Pet Health" },
];

export default function TopHeader() {
  const router = useRouter();
  const pathname = usePathname();

  if (MAIN_TAB_PATHS.includes(pathname)) return null;

  const exactTitle = EXACT_TITLES[pathname];
  const patternMatch = PATTERN_TITLES.find(({ pattern }) =>
    pattern.test(pathname)
  );
  const title = exactTitle || patternMatch?.title || "Back";

  return (
    <div
      className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-background/90 backdrop-blur-xl border-b border-border flex items-center select-none"
      style={{
        paddingTop: "env(safe-area-inset-top)",
        height: "calc(52px + env(safe-area-inset-top))",
      }}
    >
      <div className="flex items-center gap-3 px-4 w-full h-[52px]">
        <button
          type="button"
          onClick={() => router.back()}
          className="p-2 -ml-2 rounded-xl hover:bg-muted transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <span className="font-semibold text-foreground">{title}</span>
      </div>
    </div>
  );
}
