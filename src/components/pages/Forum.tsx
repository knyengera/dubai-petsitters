"use client";

import { base44 } from "@/lib/data";

import { useState, useMemo, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import ThreadCard from '@/components/forum/ThreadCard';
import NewThreadModal from '@/components/forum/NewThreadModal';
import { Users, Search, Plus, Loader2, MessageSquare } from 'lucide-react';

const CATEGORIES = [
  { value: 'all', label: 'All Topics' },
  { value: 'general', label: 'General' },
  { value: 'health', label: 'Health' },
  { value: 'training', label: 'Training' },
  { value: 'nutrition', label: 'Nutrition' },
  { value: 'lost_found', label: 'Lost & Found' },
  { value: 'hosting', label: 'Hosting' },
  { value: 'adoption', label: 'Adoption' },
];

export default function Forum() {
  const [user, setUser] = useState(null);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('all');
  const [showNew, setShowNew] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: threads = [], isLoading } = useQuery({
    queryKey: ['forum-threads'],
    queryFn: () => entities.ForumThread.list('-created_date'),
    initialData: [],
  });

  const filtered = useMemo(() => {
    let result = [...threads].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));
    if (category !== 'all') result = result.filter(t => t.category === category);
    if (search) {
      const q = search.toLowerCase();
      result = result.filter(t => t.title?.toLowerCase().includes(q) || t.content?.toLowerCase().includes(q) || t.author_name?.toLowerCase().includes(q));
    }
    return result;
  }, [threads, category, search]);

  const handleUpvote = async (thread) => {
    if (!user) return base44.auth.redirectToLogin();
    const alreadyVoted = thread.upvoted_by?.includes(user.email);
    const upvoted_by = alreadyVoted
      ? thread.upvoted_by.filter(e => e !== user.email)
      : [...(thread.upvoted_by || []), user.email];
    await entities.ForumThread.update(thread.id, {
      upvotes: upvoted_by.length,
      upvoted_by,
    });
    queryClient.invalidateQueries({ queryKey: ['forum-threads'] });
  };

  const handleCreated = () => {
    queryClient.invalidateQueries({ queryKey: ['forum-threads'] });
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="bg-gradient-to-br from-primary/5 to-accent/5 py-12 lg:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center gap-3 mb-3">
              <Users className="w-8 h-8 text-primary" />
              <h1 className="font-heading text-3xl sm:text-4xl font-bold text-foreground">Community Forum</h1>
            </div>
            <p className="text-muted-foreground text-lg max-w-2xl">
              Ask questions, share advice, and connect with fellow pet owners across Saudi Arabia.
            </p>
          </motion.div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        {/* Controls */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Search discussions..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 rounded-xl" />
          </div>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-full sm:w-44 rounded-xl"><SelectValue /></SelectTrigger>
            <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
          </Select>
          <Button onClick={() => user ? setShowNew(true) : base44.auth.redirectToLogin()} className="rounded-xl gap-2 shrink-0">
            <Plus className="w-4 h-4" /> New Thread
          </Button>
        </div>

        {!isLoading && (
          <p className="text-sm text-muted-foreground mb-6">{filtered.length} discussion{filtered.length !== 1 ? 's' : ''}</p>
        )}

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">No discussions yet</h3>
            <p className="text-muted-foreground mb-6">Be the first to start a conversation!</p>
            <Button onClick={() => user ? setShowNew(true) : base44.auth.redirectToLogin()} className="rounded-xl gap-2">
              <Plus className="w-4 h-4" /> Start a Thread
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {filtered.map((thread, i) => (
              <motion.div key={thread.id} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <ThreadCard thread={thread} userEmail={user?.email} onUpvote={handleUpvote} />
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {user && (
        <NewThreadModal open={showNew} onClose={() => setShowNew(false)} onCreated={handleCreated} user={user} />
      )}
    </div>
  );
}