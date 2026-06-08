"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Calendar, User, Loader2 } from "lucide-react";
import BlogCommentForm from "@/components/blog/BlogCommentForm";
import BlogCommentList from "@/components/blog/BlogCommentList";
import {
  getPublicBlogComments,
  getPublicBlogPostBySlug,
} from "@/lib/blog/actions";
import { useBlogI18n } from "@/lib/i18n/use-blog-i18n";

type BlogPostPageProps = {
  slug: string;
};

export default function BlogPostPage({ slug }: BlogPostPageProps) {
  const queryClient = useQueryClient();
  const { s, getCategoryLabel, commentsCountLabel } = useBlogI18n();

  const { data: post, isLoading } = useQuery({
    queryKey: ["blog-post", slug],
    queryFn: async () => {
      const result = await getPublicBlogPostBySlug(slug);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const { data: comments = [] } = useQuery({
    queryKey: ["blog-comments", post?.id],
    queryFn: async () => {
      if (!post?.id) return [];
      const result = await getPublicBlogComments(post.id);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
    enabled: Boolean(post?.id),
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center text-center px-4">
        <h2 className="font-heading text-2xl font-bold mb-4">{s.postNotFound}</h2>
        <Link href="/blog">
          <Button variant="outline" className="rounded-xl">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {s.backToBlog}
          </Button>
        </Link>
      </div>
    );
  }

  const publishedDate = post.published_at ?? post.created_at;

  return (
    <div className="min-h-screen bg-background">
      <article className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          {s.backToBlog}
        </Link>

        {post.cover_image && (
          <div className="rounded-2xl overflow-hidden mb-8 border border-border">
            <img
              src={post.cover_image}
              alt={post.title}
              className="w-full h-64 sm:h-80 object-cover"
            />
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3 mb-4">
          {post.category && (
            <Badge variant="secondary" className="capitalize">
              {getCategoryLabel(post.category)}
            </Badge>
          )}
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(publishedDate), "MMMM d, yyyy")}
          </span>
          {post.author_name && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {post.author_name}
            </span>
          )}
        </div>

        {(post.tags ?? []).length > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {(post.tags ?? []).map((t) => (
              <Badge key={t} variant="outline" className="text-xs">
                #{t}
              </Badge>
            ))}
          </div>
        )}

        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-6 leading-tight">
          {post.title}
        </h1>

        {post.excerpt && (
          <p className="text-lg text-muted-foreground mb-8 border-l-4 border-primary pl-4">
            {post.excerpt}
          </p>
        )}

        <div
          className="prose prose-lg max-w-none text-foreground prose-headings:font-heading prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground prose-img:rounded-xl"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />

        <section className="mt-12 pt-8 border-t border-border space-y-6">
          <h2 className="font-heading text-xl font-bold">
            {commentsCountLabel(comments.length)}
          </h2>
          <BlogCommentList comments={comments} />
          <BlogCommentForm
            postId={post.id}
            onSubmitted={() =>
              queryClient.invalidateQueries({
                queryKey: ["blog-comments", post.id],
              })
            }
          />
        </section>
      </article>
    </div>
  );
}
