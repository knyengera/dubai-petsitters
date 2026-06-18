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
  { labelEn: "Lost Pets", labelAr: "الحيوانات المفقودة", path: "/lost-pets" },
  { labelEn: "Travel Care", labelAr: "رعاية السفر", path: "/travel" },
];

const companyLinks: NavLinkItem[] = [
  { labelEn: "About Us", labelAr: "من نحن", path: "/about" },
  { labelEn: "Become a Partner", labelAr: "كن شريكاً", path: "/become-partner" },
  { labelEn: "Blog", labelAr: "المدونة", path: "/blog" },
  { labelEn: "Forum", labelAr: "المنتدى", path: "/forum" },
];

const footerLinkClass =
  "inline-flex rounded-md transition-colors hover:text-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 focus-visible:ring-offset-foreground";

const legalLinks: NavLinkItem[] = [
  { labelEn: "Privacy", labelAr: "الخصوصية", path: "/privacy" },
  { labelEn: "Terms", labelAr: "الشروط", path: "/terms" },
  { labelEn: "Liability Waiver", labelAr: "إخلاء المسؤولية القانوني", path: "/liability-waiver" },
  { labelEn: "Disclaimer", labelAr: "إخلاء المسؤولية", path: "/disclaimer" },
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
