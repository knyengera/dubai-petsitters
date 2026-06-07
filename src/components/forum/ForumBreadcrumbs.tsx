"use client";

import Link from "next/link";
import { ChevronRight, Home } from "lucide-react";
import { useForumI18n } from "@/lib/i18n/use-forum-i18n";

export type ForumCrumb = { label: string; href?: string };

type ForumBreadcrumbsProps = {
  items: ForumCrumb[];
  variant?: "default" | "light";
  className?: string;
};

export default function ForumBreadcrumbs({
  items,
  variant = "default",
  className,
}: ForumBreadcrumbsProps) {
  const { s } = useForumI18n();
  const light = variant === "light";
  return (
    <nav
      className={`flex flex-wrap items-center gap-1.5 text-sm ${
        light ? "text-white/80 mb-0" : "text-muted-foreground mb-6"
      } ${className ?? ""}`}
    >
      <Link
        href="/forum"
        className={`inline-flex items-center gap-1 transition-colors ${
          light ? "hover:text-white" : "hover:text-primary"
        }`}
      >
        <Home className="w-3.5 h-3.5" />
        {s.forum}
      </Link>
      {items.map((item, i) => (
        <span key={`${item.label}-${i}`} className="inline-flex items-center gap-1.5">
          <ChevronRight className="w-3.5 h-3.5" />
          {item.href ? (
            <Link
              href={item.href}
              className={light ? "hover:text-white transition-colors" : "hover:text-primary transition-colors"}
            >
              {item.label}
            </Link>
          ) : (
            <span className={light ? "text-white font-medium" : "text-foreground font-medium"}>
              {item.label}
            </span>
          )}
        </span>
      ))}
    </nav>
  );
}
