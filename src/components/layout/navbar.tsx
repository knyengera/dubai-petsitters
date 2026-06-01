"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { PawPrint, MessageCircle } from "lucide-react";
import { useLanguage } from "@/lib/language-context";

const navLinks = [
  { labelEn: "Dashboard", labelAr: "لوحة التحكم", path: "/dashboard" },
  { labelEn: "My Pets", labelAr: "حيواناتي", path: "/pets" },
  { labelEn: "Find a Vet", labelAr: "ابحث عن طبيب", path: "/vets" },
  { labelEn: "Adopt", labelAr: "تبني", path: "/adopt" },
  { labelEn: "Pet Hosting", labelAr: "استضافة", path: "/hosting" },
  { labelEn: "Blog", labelAr: "المدونة", path: "/blog" },
  { labelEn: "Forum", labelAr: "المنتدى", path: "/forum" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { t, lang, toggleLang } = useLanguage();

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50"
      style={{ paddingTop: "env(safe-area-inset-top)" }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 lg:h-20">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center group-hover:scale-105 transition-transform">
              <PawPrint className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <span className="font-heading text-xl font-bold text-foreground leading-none">
                Saudi
              </span>
              <span className="font-heading text-xl font-bold text-primary leading-none">
                {" "}
                Petsitters
              </span>
            </div>
          </Link>

          <div className="hidden lg:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname === link.path
                    ? "bg-primary/10 text-primary"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {t(link.labelEn, link.labelAr)}
              </Link>
            ))}
          </div>

          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/messages"
              className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                pathname === "/messages"
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted"
              }`}
            >
              <MessageCircle className="w-4 h-4" />
              {t("Messages", "الرسائل")}
            </Link>
            <button
              type="button"
              onClick={toggleLang}
              className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              {lang === "en" ? "عربي" : "English"}
            </button>
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              className="px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {lang === "en" ? "ع" : "EN"}
            </button>
            <Link
              href="/settings"
              className="p-2 rounded-lg hover:bg-muted select-none min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="w-5 h-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <circle cx="12" cy="8" r="4" />
                <path d="M20 21a8 8 0 1 0-16 0" />
              </svg>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
