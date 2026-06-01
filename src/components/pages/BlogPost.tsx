"use client";

import React from 'react';
import { entities } from '@/lib/data/entities';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Calendar, User, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';

const categoryLabels = {
  pet_care: 'Pet Care', health: 'Health', training: 'Training',
  nutrition: 'Nutrition', lifestyle: 'Lifestyle', news: 'News',
};

export default function BlogPostPage() {
  const urlParams = new URLSearchParams(window.location.search);
  const postId = window.pathname.split('/').pop();

  const { data: post, isLoading } = useQuery({
    queryKey: ['blog-post', postId],
    queryFn: async () => {
      const posts = await entities.BlogPost.list();
      return posts.find(p => p.id === postId);
    },
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
        <h2 className="font-heading text-2xl font-bold mb-4">Post Not Found</h2>
        <Link href="/blog"><Button variant="outline" className="rounded-xl"><ArrowLeft className="w-4 h-4 mr-2" />Back to Blog</Button></Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {post.cover_image && (
        <div className="w-full h-64 sm:h-80 lg:h-96 relative">
          <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-background/80 to-transparent" />
        </div>
      )}

      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <Link href="/blog" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          Back to Blog
        </Link>

        <div className="flex items-center gap-3 mb-4">
          {post.category && <Badge variant="secondary" className="capitalize">{categoryLabels[post.category] || post.category}</Badge>}
          <span className="text-sm text-muted-foreground flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5" />
            {format(new Date(post.created_date), 'MMMM d, yyyy')}
          </span>
          {post.author_name && (
            <span className="text-sm text-muted-foreground flex items-center gap-1">
              <User className="w-3.5 h-3.5" />
              {post.author_name}
            </span>
          )}
        </div>

        <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground mb-6 leading-tight">{post.title}</h1>

        <div className="prose prose-lg max-w-none text-foreground prose-headings:font-heading prose-headings:text-foreground prose-a:text-primary prose-strong:text-foreground">
          <div dangerouslySetInnerHTML={{ __html: post.content }} />
        </div>
      </article>
    </div>
  );
}