"use client";

import React, { useState, useMemo } from 'react';
import { entities } from '@/lib/data/entities';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import BlogCard from '@/components/blog/BlogCard';
import { BookOpen, Loader2 } from 'lucide-react';

const categories = [
  { value: 'all', label: 'All' },
  { value: 'pet_care', label: 'Pet Care' },
  { value: 'health', label: 'Health' },
  { value: 'training', label: 'Training' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'lifestyle', label: 'Lifestyle' },
  { value: 'news', label: 'News' },
];

export default function Blog() {
  const [category, setCategory] = useState('all');

  const { data: posts, isLoading } = useQuery({
    queryKey: ['blog-posts'],
    queryFn: () => entities.BlogPost.filter({ published: true }, '-created_date'),
    initialData: [],
  });

  const filtered = useMemo(() => {
    if (category === 'all') return posts;
    return posts.filter(p => p.category === category);
  }, [posts, category]);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Tabs value={category} onValueChange={setCategory} className="mb-8">
          <TabsList className="bg-muted h-auto flex-wrap">
            {categories.map(c => (
              <TabsTrigger key={c.value} value={c.value} className="rounded-lg">{c.label}</TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <BookOpen className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-foreground mb-2">No articles yet</h3>
            <p className="text-muted-foreground">Check back soon for new content!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((post, i) => (
              <motion.div key={post.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
                <BlogCard post={post} index={i} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}