"use client";

import { useState } from "react";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowUp,
  Bookmark,
  Bell,
  CheckCircle2,
  CornerDownRight,
  Loader2,
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import ReportDialog from "@/components/forum/ReportDialog";
import ForumReplyComposer from "@/components/forum/ForumReplyComposer";
import { useForumI18n } from "@/lib/i18n/use-forum-i18n";
import type { ForumReply } from "@/lib/forum/types";

type ForumReplyItemProps = {
  reply: ForumReply;
  depth?: number;
  topicId: string;
  userEmail?: string | null;
  reactedIds?: Set<string>;
  onReact?: (reply: ForumReply) => void;
  onRefresh?: () => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ForumReplyItem({
  reply,
  depth = 0,
  topicId,
  userEmail,
  reactedIds,
  onReact,
  onRefresh,
}: ForumReplyItemProps) {
  const { s } = useForumI18n();
  const [showReply, setShowReply] = useState(false);
  const hasReacted = reactedIds?.has(reply.id);
  const isPending = reply.moderation_status === "pending";
  const isAuthor = userEmail === reply.author_email;

  return (
    <div className={depth > 0 ? "ml-4 md:ml-8 border-l-2 border-border pl-4" : ""}>
      <div
        className={`bg-card border rounded-2xl p-4 mb-3 ${
          isPending && isAuthor ? "border-warning-border bg-warning-muted/40" : "border-border"
        }`}
      >
        <div className="flex gap-3">
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={reply.author_avatar_url ?? undefined} />
            <AvatarFallback>{initials(reply.author_name)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="text-sm font-semibold">{reply.author_name}</span>
              <span className="text-xs text-muted-foreground">
                {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
              </span>
              {reply.is_accepted_answer && (
                <Badge className="text-[10px] gap-1">
                  <CheckCircle2 className="w-3 h-3" />
                  {s.accepted}
                </Badge>
              )}
              {isPending && isAuthor && (
                <Badge variant="outline" className="text-[10px] border-warning-border text-warning">
                  {s.pendingReview}
                </Badge>
              )}
            </div>
            <p className="text-sm text-foreground/90 whitespace-pre-wrap">{reply.content}</p>
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <button
                type="button"
                onClick={() => onReact?.(reply)}
                className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg border text-xs font-semibold transition-all ${
                  hasReacted
                    ? "bg-primary/10 border-primary text-primary"
                    : "border-border text-muted-foreground hover:border-primary hover:text-primary"
                }`}
              >
                <ArrowUp className="w-3.5 h-3.5" />
                {reply.reaction_count || 0}
              </button>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="rounded-lg gap-1 text-xs h-8"
                onClick={() => setShowReply((v) => !v)}
              >
                <CornerDownRight className="w-3.5 h-3.5" />
                {s.replyAction}
              </Button>
              <ReportDialog targetType="reply" targetId={reply.id} />
            </div>
          </div>
        </div>
      </div>

      {showReply && (
        <div className="mb-4">
          <ForumReplyComposer
            topicId={topicId}
            parentId={reply.id}
            compact
            placeholder={`${s.replyTo} ${reply.author_name}...`}
            onPosted={() => {
              setShowReply(false);
              onRefresh?.();
            }}
            onCancel={() => setShowReply(false)}
          />
        </div>
      )}

      {reply.children?.map((child) => (
        <ForumReplyItem
          key={child.id}
          reply={child}
          depth={depth + 1}
          topicId={topicId}
          userEmail={userEmail}
          reactedIds={reactedIds}
          onReact={onReact}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

export function ForumReplyList({
  replies,
  topicId,
  userEmail,
  reactedIds,
  onReact,
  onRefresh,
  loading,
}: {
  replies: ForumReply[];
  topicId: string;
  userEmail?: string | null;
  reactedIds?: Set<string>;
  onReact?: (reply: ForumReply) => void;
  onRefresh?: () => void;
  loading?: boolean;
}) {
  const { s } = useForumI18n();

  if (loading) {
    return (
      <div className="flex justify-center py-10">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (replies.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-6 text-center">
        {s.noRepliesYet}
      </p>
    );
  }

  return (
    <div>
      {replies.map((reply) => (
        <ForumReplyItem
          key={reply.id}
          reply={reply}
          topicId={topicId}
          userEmail={userEmail}
          reactedIds={reactedIds}
          onReact={onReact}
          onRefresh={onRefresh}
        />
      ))}
    </div>
  );
}

export function ForumTopicActions({
  topicId,
  bookmarked,
  subscribed,
  onBookmark,
  onSubscribe,
  loading,
}: {
  topicId: string;
  bookmarked?: boolean;
  subscribed?: boolean;
  onBookmark?: () => void;
  onSubscribe?: () => void;
  loading?: boolean;
}) {
  const { s } = useForumI18n();

  return (
    <div className="flex flex-wrap gap-2">
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl gap-1.5"
        onClick={onSubscribe}
        disabled={loading}
      >
        <Bell className="w-3.5 h-3.5" />
        {subscribed ? s.subscribed : s.subscribe}
      </Button>
      <Button
        type="button"
        variant="outline"
        size="sm"
        className="rounded-xl gap-1.5"
        onClick={onBookmark}
        disabled={loading}
      >
        <Bookmark className="w-3.5 h-3.5" />
        {bookmarked ? s.bookmarked : s.bookmark}
      </Button>
      <ReportDialog targetType="topic" targetId={topicId} />
    </div>
  );
}
