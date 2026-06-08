"use client";

import Link from "next/link";
import { Calendar, ArrowRight, User } from "lucide-react";
import { format } from "date-fns";
import { useBlogI18n } from "@/lib/i18n/use-blog-i18n";
import type { BlogPost } from "@/lib/blog/types";
import { blogCategoryColor } from "@/lib/ui/status-styles";

const categoryColors = blogCategoryColor;

const CATEGORY_IMAGES: Record<string, string> = {
  pet_care: "https://images.unsplash.com/photo-1601758228041-f3b2795255f1?w=700&q=80",
  health: "https://images.unsplash.com/photo-1628009368231-7bb7cfcb0def?w=700&q=80",
  training: "https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=700&q=80",
  nutrition: "https://images.unsplash.com/photo-1568640347023-a616a30bc3bd?w=700&q=80",
  lifestyle: "https://images.unsplash.com/photo-1548199973-03cce0bbc87b?w=700&q=80",
  news: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=700&q=80",
};

const FALLBACK_IMAGES = [
  "https://images.unsplash.com/photo-1560743641-3914f2c45636?w=700&q=80",
  "https://images.unsplash.com/photo-1552728089-57bdde30beb3?w=700&q=80",
  "https://images.unsplash.com/photo-1585110396000-c9ffd4e4b308?w=700&q=80",
  "https://images.unsplash.com/photo-1425082661705-1834bfd09dca?w=700&q=80",
];

type BlogCardProps = {
  post: BlogPost;
  index?: number;
};

export default function BlogCard({ post, index = 0 }: BlogCardProps) {
  const { s, getCategoryLabel } = useBlogI18n();
  const coverImage =
    post.cover_image ||
    CATEGORY_IMAGES[post.category ?? ""] ||
    FALLBACK_IMAGES[index % FALLBACK_IMAGES.length];
  const colorClass = categoryColors[post.category ?? ""] || "bg-primary";

  return (
    <Link href={`/blog/${post.slug || post.id}`} className="group block">
      <div className="bg-card rounded-2xl overflow-hidden border border-border hover:shadow-2xl hover:-translate-y-1 transition-all duration-300">
        <div className="relative h-52 overflow-hidden">
          <img
            src={coverImage}
            alt={post.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          {post.category && (
            <div className="absolute top-3 left-3">
              <span
                className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold text-white ${colorClass} shadow`}
              >
                {getCategoryLabel(post.category)}
              </span>
            </div>
          )}
          <div className="absolute bottom-3 left-4 right-4">
            <h3 className="font-heading font-bold text-white text-base leading-snug line-clamp-2 drop-shadow">
              {post.title}
            </h3>
          </div>
        </div>

        <div className="p-4">
          <div className="flex items-center gap-3 mb-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {format(
                new Date(post.published_at ?? post.created_at),
                "MMM d, yyyy"
              )}
            </span>
            {post.author_name && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {post.author_name}
              </span>
            )}
          </div>
          {post.excerpt && (
            <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{post.excerpt}</p>
          )}
          <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary group-hover:gap-2 transition-all">
            {s.readMore} <ArrowRight className="w-4 h-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}
