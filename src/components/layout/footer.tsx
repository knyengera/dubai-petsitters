"use client";

import Link from "next/link";
import { ArrowRight, HeartHandshake, Mail, MapPin } from "lucide-react";
import { PUBLIC_NAV_LINKS, type NavLinkItem } from "@/lib/auth/navigation";
import { useLanguage } from "@/lib/language-context";

const serviceLinks: NavLinkItem[] = [
  ...PUBLIC_NAV_LINKS.filter(
    (link) =>
      link.path !== "/blog" &&
      link.path !== "/forum" &&
      link.path !== "/partners"
  ),
  { labelEn: "Deals", labelAr: "العروض", path: "/deals" },
  { labelEn: "Lost Pets", labelAr: "الحيوانات المفقودة", path: "/lost-pets" },
];

const companyLinks: NavLinkItem[] = [
  { labelEn: "About Us", labelAr: "من نحن", path: "/about" },
  { labelEn: "Become a Partner", labelAr: "كن شريكاً", path: "/become-partner" },
  { labelEn: "Blog", labelAr: "المدونة", path: "/blog" },
  { labelEn: "Forum", labelAr: "المنتدى", path: "/forum" },
  { labelEn: "Travel Care", labelAr: "رعاية السفر", path: "/travel" },
];

const footerLinkClass =
  "inline-flex rounded-md transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-foreground";

const legalLinks: NavLinkItem[] = [
  { labelEn: "Privacy", labelAr: "الخصوصية", path: "/privacy" },
  { labelEn: "Terms", labelAr: "الشروط", path: "/terms" },
  { labelEn: "Liability Waiver", labelAr: "إخلاء المسؤولية القانوني", path: "/liability-waiver" },
  { labelEn: "Disclaimer", labelAr: "إخلاء المسؤولية", path: "/disclaimer" },
];

const socialLinks = [
  {
    href: "https://www.facebook.com/profile.php?id=61590489897448",
    labelEn: "Facebook",
    labelAr: "فيسبوك",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
      </svg>
    ),
  },
  {
    href: "https://www.instagram.com/saudipetsitters/",
    labelEn: "Instagram",
    labelAr: "إنستغرام",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.85-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z" />
      </svg>
    ),
  },
  {
    href: "https://www.tiktok.com/@saudipetsitters",
    labelEn: "TikTok",
    labelAr: "تيك توك",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-5.2 1.74 2.89 2.89 0 012.31-4.64 2.93 2.93 0 01.88.13V9.4a6.84 6.84 0 00-1-.05A6.33 6.33 0 005 20.1a6.34 6.34 0 0010.86-4.43v-7a8.16 8.16 0 004.77 1.52v-3.4a4.85 4.85 0 01-1-.1z" />
      </svg>
    ),
  },
];

function FooterLinkList({
  title,
  links,
}: {
  title: string;
  links: NavLinkItem[];
}) {
  const { t } = useLanguage();

  return (
    <div>
      <h3 className="font-semibold text-background mb-4">{title}</h3>
      <ul className="space-y-2.5">
        {links.map((link) => (
          <li key={link.path}>
            <Link
              href={link.path}
              className={`text-sm text-background/65 ${footerLinkClass}`}
            >
              {t(link.labelEn, link.labelAr)}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function Footer() {
  const { isRTL, t } = useLanguage();

  return (
    <footer className="bg-foreground text-background">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-[1.25fr_0.85fr_0.85fr_1fr]">
          <div className="space-y-6">
            <Link
              href="/"
              className="inline-flex transition-transform hover:scale-105"
            >
              <img
                src="/logo-white.png"
                alt="Saudi Petsitters"
                className="h-12 w-auto"
              />
            </Link>
            <p className="max-w-sm text-sm leading-relaxed text-background/65">
              {t(
                "Saudi Arabia's trusted pet care community for vets, adoption, hosting, and everyday pet support.",
                "مجتمع رعاية الحيوانات الأليفة الموثوق في السعودية للأطباء، التبني، الاستضافة، والدعم اليومي."
              )}
            </p>
            <div>
              <ul className="space-y-3 text-sm text-background/65">
                <li>
                  <a
                    href="https://www.google.com/maps/search/?api=1&query=Khobar%2C%20Saudi%20Arabia"
                    target="_blank"
                    rel="noreferrer"
                    className={`items-center gap-2.5 ${footerLinkClass}`}
                  >
                    <MapPin className="w-4 h-4 text-background shrink-0" />
                    {t("Khobar, Saudi Arabia", "الخبر، السعودية")}
                  </a>
                </li>
                <li>
                  <a
                    href="mailto:hello@saudipetsitters.com"
                    className={`items-center gap-2.5 ${footerLinkClass}`}
                  >
                    <Mail className="w-4 h-4 text-background shrink-0" />
                    hello@saudipetsitters.com
                  </a>
                </li>
              </ul>
            </div>
            <div className="flex items-center gap-3">
              {socialLinks.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={t(link.labelEn, link.labelAr)}
                  className={`inline-flex h-9 w-9 items-center justify-center rounded-full border border-background/15 text-background/65 transition-colors hover:border-background/30 hover:text-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-foreground ${footerLinkClass}`}
                >
                  {link.icon}
                </a>
              ))}
            </div>
          </div>

          <FooterLinkList title={t("Services", "الخدمات")} links={serviceLinks} />
          <FooterLinkList title={t("Company", "الشركة")} links={companyLinks} />

          <div>
            <div className="rounded-2xl border border-background/10 bg-background/[0.04] p-5">
              <div className="mb-3 flex items-center gap-2 text-sm font-semibold text-background">
                <HeartHandshake className="h-4 w-4 text-background" />
                {t("Need trusted pet care?", "تحتاج رعاية موثوقة؟")}
              </div>
              <p className="mb-4 text-sm leading-relaxed text-background/65">
                {t(
                  "Explore hosts and vets nearby, or start a conversation with the community.",
                  "استكشف المضيفين والأطباء القريبين، أو ابدأ محادثة مع المجتمع."
                )}
              </p>
              <Link
                href="/hosting"
                className="inline-flex items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-foreground"
              >
                {t("Find pet care", "ابحث عن رعاية")}
                <ArrowRight className={`h-4 w-4 ${isRTL ? "rotate-180" : ""}`} />
              </Link>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-background/10 pt-6 text-sm text-background/45 md:flex-row md:items-center md:justify-between">
          <p>
            © {new Date().getFullYear()} Saudi Petsitters.{" "}
            {t("All rights reserved.", "جميع الحقوق محفوظة.")}
          </p>
          <div className="flex flex-wrap gap-x-5 gap-y-2">
            {legalLinks.map((link) => (
              <Link
                key={link.path}
                href={link.path}
                className={`text-sm text-background/45 ${footerLinkClass}`}
              >
                {t(link.labelEn, link.labelAr)}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
