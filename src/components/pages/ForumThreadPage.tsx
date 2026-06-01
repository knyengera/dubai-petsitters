"use client";

import { base44 } from "@/lib/data";

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { entities } from '@/lib/data/entities';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowUp, ArrowLeft, MessageCircle, Loader2, Send } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';

const CATEGORY_COLORS = {
  general: 'bg-slate-100 text-slate-700', health: 'bg-red-100 text-red-700',
  training: 'bg-blue-100 text-blue-700', nutrition: 'bg-green-100 text-green-700',
  lost_found: 'bg-amber-100 text-amber-700', hosting: 'bg-purple-100 text-purple-700',
  adoption: 'bg-pink-100 text-pink-700',
};
const CATEGORY_LABELS = {
  general: 'General', health: 'Health', training: 'Training', nutrition: 'Nutrition',
  lost_found: 'Lost & Found', hosting: 'Hosting', adoption: 'Adoption',
};

function CommentItem({ comment, userEmail, onUpvote }) {
  const hasUpvoted = comment.upvoted_by?.includes(userEmail);
  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex gap-4">
      <div className="shrink-0">
        <button
          onClick={() => onUpvote(comment)}
          className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border transition-all ${hasUpvoted ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
        >
          <ArrowUp className="w-3.5 h-3.5" />
          <span className="text-xs font-bold">{comment.upvotes || 0}</span>
        </button>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-sm font-semibold text-foreground">{comment.author_name}</span>
          <span className="text-xs text-muted-foreground">{formatDistanceToNow(new Date(comment.created_date), { addSuffix: true })}</span>
        </div>
        <p className="text-sm text-foreground/80 whitespace-pre-wrap">{comment.content}</p>
      </div>
    </div>
  );
}

export default function ForumThreadPage() {
  const { id } = useParams();
  const [user, setUser] = useState(null);
  const [comment, setComment] = useState('');
  const [posting, setPosting] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => {});
  }, []);

  const { data: thread, isLoading: loadingThread } = useQuery({
    queryKey: ['forum-thread', id],
    queryFn: () => entities.ForumThread.get(id),
    enabled: !!id,
  });

  const { data: comments = [], isLoading: loadingComments } = useQuery({
    queryKey: ['forum-comments', id],
    queryFn: () => entities.ForumComment.filter({ thread_id: id }, 'created_date'),
    enabled: !!id,
    initialData: [],
  });

  const handleUpvoteThread = async () => {
    if (!user) return base44.auth.redirectToLogin();
    const alreadyVoted = thread.upvoted_by?.includes(user.email);
    const upvoted_by = alreadyVoted
      ? thread.upvoted_by.filter(e => e !== user.email)
      : [...(thread.upvoted_by || []), user.email];
    await entities.ForumThread.update(thread.id, { upvotes: upvoted_by.length, upvoted_by });
    queryClient.invalidateQueries({ queryKey: ['forum-thread', id] });
    queryClient.invalidateQueries({ queryKey: ['forum-threads'] });
  };

  const handleUpvoteComment = async (c) => {
    if (!user) return base44.auth.redirectToLogin();
    const alreadyVoted = c.upvoted_by?.includes(user.email);
    const upvoted_by = alreadyVoted
      ? c.upvoted_by.filter(e => e !== user.email)
      : [...(c.upvoted_by || []), user.email];
    await entities.ForumComment.update(c.id, { upvotes: upvoted_by.length, upvoted_by });
    queryClient.invalidateQueries({ queryKey: ['forum-comments', id] });
  };

  const handlePostComment = async () => {
    if (!comment.trim() || !user) return;
    setPosting(true);
    await entities.ForumComment.create({
      thread_id: id,
      content: comment.trim(),
      author_name: user.full_name || user.email.split('@')[0],
      author_email: user.email,
      upvotes: 0,
      upvoted_by: [],
    });
    await entities.ForumThread.update(id, { comment_count: (thread?.comment_count || 0) + 1 });
    setComment('');
    setPosting(false);
    queryClient.invalidateQueries({ queryKey: ['forum-comments', id] });
    queryClient.invalidateQueries({ queryKey: ['forum-thread', id] });
    queryClient.invalidateQueries({ queryKey: ['forum-threads'] });
  };

  if (loadingThread) {
    return <div className="flex justify-center py-40"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>;
  }

  if (!thread) {
    return <div className="text-center py-40 text-muted-foreground">Thread not found.</div>;
  }

  const hasUpvotedThread = thread.upvoted_by?.includes(user?.email);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <Link href="/forum" className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Forum
        </Link>

        {/* Thread */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-6 mb-8">
          <div className="flex gap-4">
            <div className="shrink-0">
              <button
                onClick={handleUpvoteThread}
                className={`flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border transition-all ${hasUpvotedThread ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
              >
                <ArrowUp className="w-4 h-4" />
                <span className="text-sm font-bold">{thread.upvotes || 0}</span>
              </button>
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${CATEGORY_COLORS[thread.category] || CATEGORY_COLORS.general}`}>
                  {CATEGORY_LABELS[thread.category] || thread.category}
                </span>
              </div>
              <h1 className="font-heading text-2xl font-bold text-foreground mb-3">{thread.title}</h1>
              <p className="text-foreground/80 leading-relaxed whitespace-pre-wrap mb-5">{thread.content}</p>
              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="font-medium text-foreground/70">{thread.author_name}</span>
                <span>{formatDistanceToNow(new Date(thread.created_date), { addSuffix: true })}</span>
                <span className="flex items-center gap-1"><MessageCircle className="w-3.5 h-3.5" />{thread.comment_count || 0} replies</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Comments */}
        <h2 className="font-heading text-lg font-semibold mb-4">{comments.length} {comments.length === 1 ? 'Reply' : 'Replies'}</h2>

        {loadingComments ? (
          <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
        ) : (
          <div className="space-y-3 mb-8">
            {comments.map((c, i) => (
              <motion.div key={c.id} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.04 }}>
                <CommentItem comment={c} userEmail={user?.email} onUpvote={handleUpvoteComment} />
              </motion.div>
            ))}
          </div>
        )}

        {/* Reply box */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <h3 className="font-semibold text-sm mb-3">Leave a Reply</h3>
          {user ? (
            <>
              <Textarea
                placeholder="Share your thoughts, advice, or experience..."
                value={comment}
                onChange={e => setComment(e.target.value)}
                rows={4}
                className="rounded-xl resize-none mb-3"
              />
              <div className="flex justify-end">
                <Button onClick={handlePostComment} disabled={posting || !comment.trim()} className="rounded-xl gap-2">
                  {posting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Post Reply
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-6">
              <p className="text-muted-foreground text-sm mb-3">Sign in to join the discussion.</p>
              <Button onClick={() => base44.auth.redirectToLogin()} className="rounded-xl">Sign In</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}