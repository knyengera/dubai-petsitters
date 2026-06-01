"use client";

import Link from 'next/link';
import { Badge } from '@/components/ui/badge';
import { ArrowUp, MessageCircle, Pin } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

const CATEGORY_COLORS = {
  general: 'bg-slate-100 text-slate-700',
  health: 'bg-red-100 text-red-700',
  training: 'bg-blue-100 text-blue-700',
  nutrition: 'bg-green-100 text-green-700',
  lost_found: 'bg-amber-100 text-amber-700',
  hosting: 'bg-purple-100 text-purple-700',
  adoption: 'bg-pink-100 text-pink-700',
};

const CATEGORY_LABELS = {
  general: 'General', health: 'Health', training: 'Training',
  nutrition: 'Nutrition', lost_found: 'Lost & Found',
  hosting: 'Hosting', adoption: 'Adoption',
};

export default function ThreadCard({ thread, userEmail, onUpvote }) {
  const hasUpvoted = thread.upvoted_by?.includes(userEmail);

  return (
    <div className="bg-card border border-border rounded-2xl p-5 hover:shadow-md transition-all group">
      <div className="flex gap-4">
        {/* Upvote */}
        <div className="flex flex-col items-center gap-1 shrink-0">
          <button
            onClick={() => onUpvote(thread)}
            className={`flex flex-col items-center gap-0.5 px-2.5 py-2 rounded-xl border transition-all ${hasUpvoted ? 'bg-primary/10 border-primary text-primary' : 'border-border text-muted-foreground hover:border-primary hover:text-primary'}`}
          >
            <ArrowUp className="w-4 h-4" />
            <span className="text-xs font-bold">{thread.upvotes || 0}</span>
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-2">
            {thread.pinned && (
              <span className="flex items-center gap-1 text-xs text-amber-600 font-medium">
                <Pin className="w-3 h-3" /> Pinned
              </span>
            )}
            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${CATEGORY_COLORS[thread.category] || CATEGORY_COLORS.general}`}>
              {CATEGORY_LABELS[thread.category] || thread.category}
            </span>
          </div>
          <Link href={`/forum/${thread.id}`} className="block">
            <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-base leading-snug mb-1">
              {thread.title}
            </h3>
          </Link>
          <p className="text-sm text-muted-foreground line-clamp-2 mb-3">{thread.content}</p>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span className="font-medium text-foreground/70">{thread.author_name}</span>
            <span>{formatDistanceToNow(new Date(thread.created_date), { addSuffix: true })}</span>
            <span className="flex items-center gap-1">
              <MessageCircle className="w-3.5 h-3.5" />
              {thread.comment_count || 0} {thread.comment_count === 1 ? 'reply' : 'replies'}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}