"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PawPrint, MessageCircle, LogOut } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import {
  getHeaderNavLinks,
  PROTECTED_EXTRA_NAV_LINKS,
  ADMIN_NAV_LINK,
} from "@/lib/auth/navigation";

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { t, lang, toggleLang } = useLanguage();
  const { user, signOut, isLoadingAuth, isAdmin } = useAuth();
  const navLinks = getHeaderNavLinks(!!user);

  const handleLogout = async () => {
    await signOut();
    router.push("/");
    router.refresh();
  };

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
            {user && isAdmin && (
              <Link
                href={ADMIN_NAV_LINK.path}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  pathname.startsWith("/admin")
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
              >
                {t(ADMIN_NAV_LINK.labelEn, ADMIN_NAV_LINK.labelAr)}
              </Link>
            )}
            {user &&
              PROTECTED_EXTRA_NAV_LINKS.map((link) => (
                <Link
                  key={link.path}
                  href={link.path}
                  className={`relative px-3 py-2 rounded-lg text-sm font-medium transition-all duration-200 flex items-center gap-1.5 ${
                    pathname === link.path
                      ? "bg-primary/10 text-primary"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted"
                  }`}
                >
                  <MessageCircle className="w-4 h-4" />
                  {t(link.labelEn, link.labelAr)}
                </Link>
              ))}
            <button
              type="button"
              onClick={toggleLang}
              className="px-3 py-1.5 rounded-lg border border-border text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all"
            >
              {lang === "en" ? "عربي" : "English"}
            </button>
            {!isLoadingAuth && !user && (
              <Link
                href="/login"
                className="px-4 py-2 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-all"
              >
                {t("Sign in", "تسجيل الدخول")}
              </Link>
            )}
            {user && (
              <button
                type="button"
                onClick={handleLogout}
                title={t("Log out", "تسجيل الخروج")}
                aria-label={t("Log out", "تسجيل الخروج")}
                className="px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-all flex items-center gap-1.5"
              >
                <LogOut className="w-4 h-4" />
                {t("Log out", "خروج")}
              </button>
            )}
          </div>

          <div className="lg:hidden flex items-center gap-2">
            <button
              type="button"
              onClick={toggleLang}
              className="px-2.5 py-1 rounded-lg border border-border text-xs font-medium text-muted-foreground hover:text-foreground transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              {lang === "en" ? "ع" : "EN"}
            </button>
            {!isLoadingAuth && !user && (
              <Link
                href="/login"
                className="px-3 py-1.5 rounded-lg text-xs font-medium bg-primary text-primary-foreground min-h-[44px] flex items-center justify-center"
              >
                {t("Sign in", "دخول")}
              </Link>
            )}
            {user && (
              <>
                <Link
                  href="/settings"
                  className="p-2 rounded-lg hover:bg-muted select-none min-h-[44px] min-w-[44px] flex items-center justify-center"
                  aria-label={t("Settings", "الإعدادات")}
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
                <button
                  type="button"
                  onClick={handleLogout}
                  title={t("Log out", "تسجيل الخروج")}
                  aria-label={t("Log out", "تسجيل الخروج")}
                  className="p-2 rounded-lg hover:bg-muted text-muted-foreground hover:text-foreground transition-all min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
