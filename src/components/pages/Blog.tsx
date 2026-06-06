"use client";

import React, { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import Link from "next/link";
import { format } from "date-fns";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import BlogCard from "@/components/blog/BlogCard";
import { getPublicBlogPosts } from "@/lib/blog/actions";
import { BLOG_CATEGORIES, type BlogPost } from "@/lib/blog/types";
import { BookOpen, Loader2, Search, Star, ArrowRight } from "lucide-react";

const categories = [{ value: "all", label: "All" }, ...BLOG_CATEGORIES];

export default function Blog() {
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");
  const [tag, setTag] = useState("all");

  const { data: posts = [], isLoading } = useQuery({
    queryKey: ["blog-posts"],
    queryFn: async () => {
      const result = await getPublicBlogPosts();
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
    initialData: [] as BlogPost[],
  });

  const allTags = useMemo(() => {
    const tagSet = new Set<string>();
    posts.forEach((post) => {
      (post.tags ?? []).forEach((t) => tagSet.add(t));
    });
    return Array.from(tagSet).sort();
  }, [posts]);

  const featuredPost = useMemo(
    () => posts.find((p) => p.featured) ?? posts[0] ?? null,
    [posts]
  );

  const filtered = useMemo(() => {
    let result = posts.filter((p) => p.id !== featuredPost?.id);
    if (category !== "all") {
      result = result.filter((p) => p.category === category);
    }
    if (tag !== "all") {
      result = result.filter((p) => (p.tags ?? []).includes(tag));
    }
    if (search.trim()) {
      const q = search.toLowerCase();
      result = result.filter(
        (p) =>
          p.title?.toLowerCase().includes(q) ||
          p.excerpt?.toLowerCase().includes(q) ||
          p.author_name?.toLowerCase().includes(q) ||
          (p.tags ?? []).some((t) => t.toLowerCase().includes(q))
      );
    }
    return result;
  }, [posts, category, tag, search, featuredPost?.id]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search articles..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 rounded-xl"
            />
          </div>
        </div>

        {featuredPost && !search && category === "all" && tag === "all" && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-10"
          >
            <Link
              href={`/blog/${featuredPost.slug ?? featuredPost.id}`}
              className="group block rounded-3xl overflow-hidden border border-border bg-card hover:shadow-2xl transition-all"
            >
              <div className="grid md:grid-cols-2">
                <div className="relative h-56 md:h-auto min-h-[220px] overflow-hidden">
                  <img
                    src={
                      featuredPost.cover_image ||
                      "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900&q=85"
                    }
                    alt={featuredPost.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                  />
                </div>
                <div className="p-6 md:p-8 flex flex-col justify-center">
                  <Badge className="w-fit mb-3 gap-1">
                    <Star className="w-3 h-3 fill-current" /> Featured
                  </Badge>
                  <h2 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-3 group-hover:text-primary transition-colors">
                    {featuredPost.title}
                  </h2>
                  {featuredPost.excerpt && (
                    <p className="text-muted-foreground mb-4 line-clamp-3">
                      {featuredPost.excerpt}
                    </p>
                  )}
                  <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4">
                    <span>
                      {format(
                        new Date(featuredPost.published_at ?? featuredPost.created_at),
                        "MMMM d, yyyy"
                      )}
                    </span>
                    {featuredPost.author_name && (
                      <>
                        <span>·</span>
                        <span>{featuredPost.author_name}</span>
                      </>
                    )}
                  </div>
                  <span className="inline-flex items-center gap-1 text-sm font-semibold text-primary">
                    Read article <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </div>
            </Link>
          </motion.div>
        )}

        <Tabs value={category} onValueChange={setCategory} className="mb-4">
          <TabsList className="bg-muted h-auto flex-wrap">
            {categories.map((c) => (
              <TabsTrigger key={c.value} value={c.value} className="rounded-lg">
                {c.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {allTags.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-8">
            <button
              type="button"
              onClick={() => setTag("all")}
              className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                tag === "all"
                  ? "bg-primary text-primary-foreground border-primary"
                  : "bg-card border-border text-muted-foreground hover:text-foreground"
              }`}
            >
              All tags
            </button>
            {allTags.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTag(t)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-colors ${
                  tag === t
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-card border-border text-muted-foreground hover:text-foreground"
                }`}
              >
                #{t}
              </button>
            ))}
          </div>
        )}

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 && !featuredPost ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">
              No articles yet
            </h3>
            <p className="text-muted-foreground">Check back soon for new content!</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            No articles match your filters.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post, i) => (
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
