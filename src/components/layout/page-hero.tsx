"use client";

import { motion } from "framer-motion";
import {
  getPageHeroConfig,
  resolvePageHeroImage,
  type PageHeroConfig,
} from "@/components/layout/page-hero-config";
import { blogStrings } from "@/lib/i18n/blog";
import { forumStrings } from "@/lib/i18n/forum";
import { useLanguage } from "@/lib/language-context";

type PageHeroProps = {
  pathname: string;
};

function translateHeroConfig(
  pathname: string,
  config: PageHeroConfig,
  t: (en: string, ar: string) => string
): PageHeroConfig {
  if (pathname === "/blog") {
    return {
      ...config,
      title: t(blogStrings.heroTitle.en, blogStrings.heroTitle.ar),
      subtitle: t(blogStrings.heroSubtitle.en, blogStrings.heroSubtitle.ar),
    };
  }
  if (/^\/blog\/[^/]+$/.test(pathname)) {
    return {
      ...config,
      title: t(blogStrings.heroTitle.en, blogStrings.heroTitle.ar),
      subtitle: t(blogStrings.articleHeroSubtitle.en, blogStrings.articleHeroSubtitle.ar),
    };
  }
  if (/^\/forum\/[^/]+\/[^/]+$/.test(pathname)) {
    return {
      ...config,
      title: t(forumStrings.topics.en, forumStrings.topics.ar),
      subtitle: t(forumStrings.topicHeroSubtitle.en, forumStrings.topicHeroSubtitle.ar),
    };
  }
  return config;
}

export function PageHeroFromPath({ pathname }: PageHeroProps) {
  const { t } = useLanguage();
  const base = getPageHeroConfig(pathname);
  if (!base) return null;
  const config = translateHeroConfig(pathname, base, t);
  return <PageHero config={config} />;
}

type PageHeroContentProps = {
  config: PageHeroConfig;
  beforeTitle?: React.ReactNode;
  children?: React.ReactNode;
};

export default function PageHero({ config, beforeTitle, children }: PageHeroContentProps) {
  const imageUrl = resolvePageHeroImage(config);
  const imageAlt = config.imageAlt ?? "Page banner";

  return (
    <div
      className={`relative overflow-hidden shrink-0 ${
        children ? "h-72 lg:h-96" : "h-64 lg:h-80"
      }`}
    >
      <img
        src={imageUrl}
        alt={imageAlt}
        className="w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent" />
      <div className="absolute inset-0 flex flex-col justify-center px-6 sm:px-12 lg:px-20">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          {beforeTitle ? <div className="mb-3">{beforeTitle}</div> : null}
          <h1 className="font-heading text-4xl lg:text-5xl font-extrabold text-white mb-3">
            {config.title}
          </h1>
          {config.subtitle ? (
            <p className="text-white/80 text-lg max-w-xl">{config.subtitle}</p>
          ) : null}
          {children ? (
            <div className="flex flex-wrap gap-3 mt-5">{children}</div>
          ) : null}
        </motion.div>
      </div>
    </div>
  );
}
