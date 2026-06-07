"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import BlogCard from "@/components/blog/BlogCard";
import BlogFilterBar, {
  hasActiveFilters,
  type BlogFilters,
  type BlogSortOption,
} from "@/components/blog/BlogFilterBar";
import { getPublicBlogPosts } from "@/lib/blog/actions";
import type { BlogPost } from "@/lib/blog/types";
import { useBlogI18n } from "@/lib/i18n/use-blog-i18n";
import { AlertCircle, BookOpen, Loader2, Star, ArrowRight } from "lucide-react";

const DEFAULT_FILTERS: BlogFilters = {
  search: "",
  category: "all",
  tag: "all",
  author: "all",
  sort: "newest",
};

const EMPTY_POSTS: BlogPost[] = [];

function sortPosts(posts: BlogPost[], sort: BlogSortOption): BlogPost[] {
  const sorted = [...posts];
  switch (sort) {
    case "oldest":
      return sorted.sort(
        (a, b) =>
          new Date(a.published_at ?? a.created_at).getTime() -
          new Date(b.published_at ?? b.created_at).getTime()
      );
    case "title_asc":
      return sorted.sort((a, b) => a.title.localeCompare(b.title));
    case "title_desc":
      return sorted.sort((a, b) => b.title.localeCompare(a.title));
    case "newest":
    default:
      return sorted.sort(
        (a, b) =>
          new Date(b.published_at ?? b.created_at).getTime() -
          new Date(a.published_at ?? a.created_at).getTime()
      );
  }
}

export default function Blog() {
  const { s } = useBlogI18n();
  const [filters, setFilters] = useState<BlogFilters>(DEFAULT_FILTERS);

  const {
    data,
    error,
    isLoading,
    refetch,
  } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const result = await getPublicBlogPosts();
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });
  const posts = data ?? EMPTY_POSTS;

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((post) => {
      (post.tags ?? []).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [posts]);

  const allAuthors = useMemo(() => {
    const authorSet = new Set<string>();
    posts.forEach((post) => {
      if (post.author_name?.trim()) authorSet.add(post.author_name.trim());
    });
    return Array.from(authorSet).sort();
  }, [posts]);

  const featuredPost = useMemo(
    () => posts.find((p) => p.featured) ?? posts[0] ?? null,
    [posts]
  );

  const showFeatured = featuredPost && !hasActiveFilters(filters);

  const filtered = useMemo(() => {
    let result = showFeatured
      ? posts.filter((p) => p.id !== featuredPost?.id)
      : [...posts];

    if (filters.category !== "all") {
      result = result.filter((p) => p.category === filters.category);
    }
    if (filters.tag !== "all") {
      result = result.filter((p) => (p.tags ?? []).includes(filters.tag));
    }
    if (filters.author !== "all") {
      result = result.filter((p) => p.author_name === filters.author);
    }
    if (filters.search.trim()) {
      const q = filters.search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.content?.toLowerCase().includes(q) ||
          p.author_name?.toLowerCase().includes(q) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }

    return sortPosts(result, filters.sort);
  }, [posts, filters, showFeatured, featuredPost?.id]);

  const gridPosts = filtered;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <BlogFilterBar
          filters={filters}
          onChange={setFilters}
          tags={allTags}
          authors={allAuthors}
          resultCount={gridPosts.length + (showFeatured ? 1 : 0)}
          totalCount={posts.length}
        />

        {showFeatured && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <Link
              href={`/blog/${featuredPost.slug ?? featuredPost.id}`}
              className="group block rounded-3xl overflow-hidden border border-border bg-card hover:shadow-2xl transition-all"
            >
              <div className="relative w-full h-48 sm:h-56 md:h-64 overflow-hidden">
                <img
                  src={
                    featuredPost.cover_image ||
                    "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=1200&q=85"
                  }
                  alt={featuredPost.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 md:p-8">
                  <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mb-2">
                    <Badge className="gap-1 bg-primary text-primary-foreground">
                      <Star className="w-3 h-3 fill-current" /> {s.featured}
                    </Badge>
                    <span className="text-sm text-white/80">
                      {format(
                        new Date(featuredPost.published_at ?? featuredPost.created_at),
                        "MMMM d, yyyy"
                      )}
                    </span>
                    {featuredPost.author_name && (
                      <span className="text-sm text-white/80">
                        · {featuredPost.author_name}
                      </span>
                    )}
                  </div>
                  <h2 className="font-heading text-xl sm:text-2xl md:text-3xl font-bold text-white leading-tight group-hover:text-primary-foreground transition-colors">
                    {featuredPost.title}
                  </h2>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-5 sm:p-6 md:px-8 md:py-5">
                {featuredPost.excerpt ? (
                  <p className="text-muted-foreground line-clamp-2 sm:flex-1">
                    {featuredPost.excerpt}
                  </p>
                ) : (
                  <span className="sm:flex-1" />
                )}
                <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary shrink-0 group-hover:gap-2 transition-all">
                  {s.readArticle} <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          </motion.div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : error ? (
          <div className="text-center py-20">
            <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {s.loadErrorTitle}
            </h3>
            <p className="text-muted-foreground mb-4">
              {(error as Error).message}
            </p>
            <button
              type="button"
              onClick={() => void refetch()}
              className="inline-flex items-center justify-center rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/90 transition-colors"
            >
              {s.tryAgain}
            </button>
          </div>
        ) : gridPosts.length === 0 && !showFeatured ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              {hasActiveFilters(filters) ? s.noMatching : s.noArticles}
            </h3>
            <p className="text-muted-foreground">
              {hasActiveFilters(filters)
                ? s.adjustFilters
                : s.checkBackSoon}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {gridPosts.map((post, i) => (
              <motion.div
                key={post.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
              >
                <BlogCard post={post} index={i} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
