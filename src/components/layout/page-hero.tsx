"use client";

import { motion } from "framer-motion";
import {
  getPageHeroConfig,
  resolvePageHeroImage,
  type PageHeroConfig,
} from "@/components/layout/page-hero-config";

type PageHeroProps = {
  pathname: string;
};

export function PageHeroFromPath({ pathname }: PageHeroProps) {
  const config = getPageHeroConfig(pathname);
  if (!config) return null;
  return <PageHero config={config} />;
}

type PageHeroContentProps = {
  config: PageHeroConfig;
  children?: React.ReactNode;
};

export default function PageHero({ config, children }: PageHeroContentProps) {
  const imageUrl = resolvePageHeroImage(config);
  const imageAlt = config.imageAlt ?? "Page banner";

  return (
    <div className="relative h-64 lg:h-80 overflow-hidden shrink-0">
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
