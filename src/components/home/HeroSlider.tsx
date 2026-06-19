"use client";

import React from "react";
import Link from "next/link";
import { AnimatePresence, motion } from "framer-motion";
import {
  Bot,
  Stethoscope,
  Plane,
  MapPin,
  Heart,
  Home,
  ChevronLeft,
  ChevronRight,
  ArrowRight,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useLanguage } from "@/lib/language-context";
import { useAuth } from "@/lib/auth-context";
import { isNavPathVisible } from "@/lib/auth/navigation";
import { usePetHealthAssistant } from "@/lib/pet-health-assistant-context";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const AUTOPLAY_MS = 6000;

type HeroSlide = {
  id: string;
  image: string;
  imageAltEn: string;
  imageAltAr: string;
  icon: LucideIcon;
  titleEn: string;
  titleAr: string;
  descEn: string;
  descAr: string;
  ctaEn: string;
  ctaAr: string;
  href?: string;
  openAssistant?: boolean;
};

const heroSlides: HeroSlide[] = [
  {
    id: "hosting",
    image: "/hosting.webp",
    imageAltEn: "Happy dog with pet sitter at home",
    imageAltAr: "كلب سعيد مع مربي حيوانات في المنزل",
    icon: Home,
    titleEn: "Trusted Pet Hosting",
    titleAr: "استضافة موثوقة للحيوانات",
    descEn: "Boarding, daycare, home sitting, and dog walking from verified hosts across Saudi Arabia.",
    descAr: "إقامة، رعاية نهارية، جليسة منزلية، ومشي الكلاب من مضيفين موثوقين في جميع أنحاء المملكة.",
    ctaEn: "Find a Host",
    ctaAr: "ابحث عن مضيف",
    href: "/hosting",
  },
  {
    id: "vets",
    image: "/vet.webp",
    imageAltEn: "Veterinarian caring for a pet",
    imageAltAr: "طبيب بيطري يعتني بحيوان أليف",
    icon: Stethoscope,
    titleEn: "Find a Vet",
    titleAr: "ابحث عن طبيب",
    descEn: "Nearby clinics, emergency care, and verified veterinary partners when your pet needs help.",
    descAr: "عيادات قريبة، رعاية طارئة، وشركاء بيطريون معتمدون عندما يحتاج حيوانك للمساعدة.",
    ctaEn: "Browse Clinics",
    ctaAr: "تصفح العيادات",
    href: "/vets",
  },
  {
    id: "adopt",
    image: "/adoption.webp",
    imageAltEn: "Dogs playing together outdoors",
    imageAltAr: "كلاب تلعب معاً في الهواء الطلق",
    icon: Heart,
    titleEn: "Adoption Center",
    titleAr: "مركز التبني",
    descEn: "Find your perfect companion from verified adoption listings across the Kingdom.",
    descAr: "اعثر على رفيقك المثالي من قوائم التبني المعتمدة في جميع أنحاء المملكة.",
    ctaEn: "Browse Pets",
    ctaAr: "تصفح الحيوانات",
    href: "/adopt",
  },
  {
    id: "travel",
    image: "/travel.webp",
    imageAltEn: "Airplane window view for pet travel",
    imageAltAr: "منظر نافذة طائرة للسفر مع الحيوانات",
    icon: Plane,
    titleEn: "Travel Compliance",
    titleAr: "امتثال السفر",
    descEn: "Import and export regulations, documents, and guidance for traveling with pets in Saudi Arabia.",
    descAr: "لوائح الاستيراد والتصدير والوثائق والإرشادات للسفر مع الحيوانات في المملكة.",
    ctaEn: "Check Requirements",
    ctaAr: "تحقق من المتطلبات",
    href: "/travel",
  },
  {
    id: "lost-pets",
    image: "/lost.webp",
    imageAltEn: "Cat looking for its owner",
    imageAltAr: "قطة تبحث عن مالكها",
    icon: MapPin,
    titleEn: "Lost & Found",
    titleAr: "المفقودات",
    descEn: "Report missing pets and help reunite lost animals with their families across Saudi cities.",
    descAr: "أبلغ عن الحيوانات المفقودة وساعد في إعادة الحيوانات الضائعة لعائلاتها في مدن المملكة.",
    ctaEn: "Report or Search",
    ctaAr: "أبلغ أو ابحث",
    href: "/lost-pets",
  },
];

function usePrefersReducedMotion() {
  const subscribe = React.useCallback((callback: () => void) => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    media.addEventListener("change", callback);
    return () => media.removeEventListener("change", callback);
  }, []);

  const getSnapshot = React.useCallback(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
    []
  );

  return React.useSyncExternalStore(subscribe, getSnapshot, () => false);
}

export default function HeroSlider() {
  const { t, isRTL } = useLanguage();
  const { user, navigateToLogin } = useAuth();
  const { openAssistant } = usePetHealthAssistant();
  const isAuthenticated = !!user;
  const prefersReducedMotion = usePrefersReducedMotion();

  const [activeIndex, setActiveIndex] = React.useState(0);
  const [isPaused, setIsPaused] = React.useState(false);

  const slide = heroSlides[activeIndex];
  const SlideIcon = slide.icon;

  const goTo = React.useCallback((index: number) => {
    setActiveIndex((index + heroSlides.length) % heroSlides.length);
  }, []);

  const goNext = React.useCallback(() => {
    goTo(activeIndex + 1);
  }, [activeIndex, goTo]);

  const goPrevious = React.useCallback(() => {
    goTo(activeIndex - 1);
  }, [activeIndex, goTo]);

  React.useEffect(() => {
    if (prefersReducedMotion || isPaused) return;

    const timer = window.setInterval(goNext, AUTOPLAY_MS);
    return () => window.clearInterval(timer);
  }, [goNext, isPaused, prefersReducedMotion]);

  React.useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "ArrowLeft") {
        event.preventDefault();
        if (isRTL) {
          goNext();
        } else {
          goPrevious();
        }
      } else if (event.key === "ArrowRight") {
        event.preventDefault();
        if (isRTL) {
          goPrevious();
        } else {
          goNext();
        }
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [goNext, goPrevious, isRTL]);

  const resolveSlideHref = (href: string) =>
    isNavPathVisible(href, isAuthenticated) ? href : "/login";

  const handleSlideCta = () => {
    if (isAuthenticated) {
      openAssistant();
    } else {
      navigateToLogin();
    }
  };

  const transitionDuration = prefersReducedMotion ? 0 : 0.6;

  return (
    <section
      className="relative min-h-[520px] lg:min-h-[600px] overflow-hidden"
      aria-roledescription="carousel"
      aria-label={t("Platform services", "خدمات المنصة")}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <AnimatePresence mode="sync">
        <motion.div
          key={slide.id}
          initial={{ opacity: prefersReducedMotion ? 1 : 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: prefersReducedMotion ? 1 : 0 }}
          transition={{ duration: transitionDuration, ease: "easeInOut" }}
          className="absolute inset-0"
          aria-hidden="true"
        >
          <img
            src={slide.image}
            alt={t(slide.imageAltEn, slide.imageAltAr)}
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/55 to-foreground/30" />
        </motion.div>
      </AnimatePresence>

      <div className="relative z-10 mx-auto flex min-h-[520px] max-w-7xl flex-col justify-center px-4 py-16 sm:px-6 sm:py-20 lg:min-h-[600px] lg:px-8">
        <div aria-live="polite" className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={slide.id}
              initial={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: prefersReducedMotion ? 1 : 0, y: prefersReducedMotion ? 0 : -12 }}
              transition={{ duration: prefersReducedMotion ? 0 : 0.45, ease: "easeOut" }}
            >
              <h1 className="font-heading mb-5 text-4xl font-bold leading-tight text-white sm:text-5xl lg:text-6xl">
                {t(slide.titleEn, slide.titleAr)}
              </h1>

              <p className="mb-8 max-w-lg text-lg leading-relaxed text-white/75">
                {t(slide.descEn, slide.descAr)}
              </p>

              <div className="flex flex-wrap gap-3">
                {slide.openAssistant ? (
                  <Button
                    type="button"
                    size="lg"
                    onClick={handleSlideCta}
                    className="rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
                  >
                    <SlideIcon className="me-2 h-5 w-5" />
                    {t(slide.ctaEn, slide.ctaAr)}
                    <ArrowRight className="ms-2 h-5 w-5" />
                  </Button>
                ) : (
                  <Link
                    href={slide.href ? resolveSlideHref(slide.href) : "/login"}
                    className={cn(
                      buttonVariants({ size: "lg" }),
                      "rounded-xl bg-primary px-8 text-base font-semibold text-primary-foreground shadow-lg shadow-primary/25 hover:bg-primary/90"
                    )}
                  >
                    <SlideIcon className="me-2 h-5 w-5" />
                    {t(slide.ctaEn, slide.ctaAr)}
                    <ArrowRight className="ms-2 h-5 w-5" />
                  </Link>
                )}
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2" role="tablist" aria-label={t("Service slides", "شرائح الخدمات")}>
            {heroSlides.map((item, index) => (
              <button
                key={item.id}
                type="button"
                role="tab"
                aria-selected={index === activeIndex}
                aria-label={t(item.titleEn, item.titleAr)}
                onClick={() => goTo(index)}
                className={cn(
                  "h-2.5 rounded-full transition-all duration-300",
                  index === activeIndex
                    ? "w-8 bg-primary"
                    : "w-2.5 bg-white/40 hover:bg-white/60"
                )}
              />
            ))}
          </div>

          <div className="ms-auto flex items-center gap-2">
            <button
              type="button"
              onClick={goPrevious}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20"
              aria-label={t("Previous slide", "الشريحة السابقة")}
            >
              {isRTL ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
            <button
              type="button"
              onClick={goNext}
              className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/30 bg-white/10 text-white backdrop-blur-sm transition-all hover:bg-white/20"
              aria-label={t("Next slide", "الشريحة التالية")}
            >
              {isRTL ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
