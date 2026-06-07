"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { formatDistanceToNow } from "date-fns";
import {
  ArrowUp,
  Loader2,
  Lock,
  MessageCircle,
  Pin,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import ForumBreadcrumbs from "@/components/forum/ForumBreadcrumbs";
import ForumReplyComposer from "@/components/forum/ForumReplyComposer";
import {
  ForumReplyList,
  ForumTopicActions,
} from "@/components/forum/ForumReplyList";
import {
  getForumReplies,
  getForumTopic,
  getUserForumReactions,
  toggleForumBookmark,
  toggleForumReaction,
  toggleForumSubscription,
} from "@/lib/forum/actions";
import { BOARD_COLORS } from "@/lib/forum/config";
import type { ForumReply } from "@/lib/forum/types";
import { useAuth } from "@/lib/auth-context";
import { useForumI18n } from "@/lib/i18n/use-forum-i18n";
import { useToast } from "@/components/ui/use-toast";

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function flattenReplies(replies: ForumReply[]): ForumReply[] {
  const out: ForumReply[] = [];
  const walk = (items: ForumReply[]) => {
    items.forEach((r) => {
      out.push(r);
      if (r.children?.length) walk(r.children);
    });
  };
  walk(replies);
  return out;
}

export default function ForumTopicPage() {
  const params = useParams();
  const boardSlug = String(params.boardSlug ?? "");
  const topicSlug = String(params.topicSlug ?? "");
  const { user, navigateToLogin } = useAuth();
  const { toast } = useToast();
  const { s, getBoardTitle } = useForumI18n();
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState(false);
  const [bookmarked, setBookmarked] = useState(false);
  const [subscribed, setSubscribed] = useState(false);

  const { data: topic, isLoading: topicLoading } = useQuery({
    queryKey: ["forum-topic", boardSlug, topicSlug],
    queryFn: async () => {
      const result = await getForumTopic({ boardSlug, topicSlug });
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
    enabled: !!boardSlug && !!topicSlug,
  });

  const { data: replies = [], isLoading: repliesLoading } = useQuery({
    queryKey: ["forum-replies", topic?.id],
    queryFn: async () => {
      const result = await getForumReplies(topic!.id);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
    enabled: !!topic?.id,
  });

  const flatReplies = useMemo(() => flattenReplies(replies), [replies]);
  const replyIds = useMemo(() => flatReplies.map((r) => r.id), [flatReplies]);

  const { data: topicReaction } = useQuery({
    queryKey: ["forum-reactions", "topic", topic?.id],
    queryFn: async () => {
      const result = await getUserForumReactions("topic", [topic!.id]);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
    enabled: !!user && !!topic?.id,
  });

  const { data: replyReactions = [] } = useQuery({
    queryKey: ["forum-reactions", "reply", replyIds],
    queryFn: async () => {
      const result = await getUserForumReactions("reply", replyIds);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
    enabled: !!user && replyIds.length > 0,
  });

  const reactedReplySet = useMemo(() => new Set(replyReactions), [replyReactions]);
  const hasReactedTopic = topicReaction?.includes(topic?.id ?? "") ?? false;

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["forum-topic", boardSlug, topicSlug] });
    queryClient.invalidateQueries({ queryKey: ["forum-replies", topic?.id] });
    queryClient.invalidateQueries({ queryKey: ["forum-recent-replies"] });
  };

  const handleReactTopic = async () => {
    if (!topic) return;
    if (!user) return navigateToLogin();
    await toggleForumReaction({ target_type: "topic", target_id: topic.id });
    refresh();
  };

  const handleReactReply = async (reply: ForumReply) => {
    if (!user) return navigateToLogin();
    await toggleForumReaction({ target_type: "reply", target_id: reply.id });
    refresh();
  };

  const handleBookmark = async () => {
    if (!topic) return;
    if (!user) return navigateToLogin();
    setActionLoading(true);
    const result = await toggleForumBookmark(topic.id);
    setActionLoading(false);
    if (result.ok === false) {
      toast({ title: s.bookmarkFailed, description: result.error, variant: "destructive" });
      return;
    }
    setBookmarked(result.data.bookmarked);
  };

  const handleSubscribe = async () => {
    if (!topic) return;
    if (!user) return navigateToLogin();
    setActionLoading(true);
    const result = await toggleForumSubscription({
      target_type: "topic",
      target_id: topic.id,
    });
    setActionLoading(false);
    if (result.ok === false) {
      toast({ title: s.subscribeFailed, description: result.error, variant: "destructive" });
      return;
    }
    setSubscribed(result.data.subscribed);
  };

  if (topicLoading) {
    return (
      <div className="flex justify-center py-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!topic) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center text-muted-foreground">
        {s.topicNotFound}
      </div>
    );
  }

  const board = topic.board;
  const isPending = topic.moderation_status === "pending";
  const isAuthor = user?.email === topic.author_email;
  const boardColor = BOARD_COLORS[board?.color ?? "blue"] ?? BOARD_COLORS.blue;
  const replyLabel =
    topic.reply_count === 1 ? s.reply : s.replyPlural;

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <ForumBreadcrumbs
          items={[
            ...(board
              ? [{
                  label: getBoardTitle(board.slug, board.title),
                  href: `/forum/${board.slug}`,
                }]
              : []),
            { label: topic.title },
          ]}
        />

        <div
          className={`bg-card border rounded-2xl p-6 mb-8 shadow-sm ${
            isPending && isAuthor ? "border-amber-300 bg-amber-50/30" : "border-border"
          }`}
        >
          <div className="flex gap-4">
            <button
              type="button"
              onClick={handleReactTopic}
              className={`flex flex-col items-center gap-0.5 px-3 py-2.5 rounded-xl border transition-all shrink-0 h-fit ${
                hasReactedTopic
                  ? "bg-primary/10 border-primary text-primary"
                  : "border-border text-muted-foreground hover:border-primary hover:text-primary"
              }`}
            >
              <ArrowUp className="w-4 h-4" />
              <span className="text-sm font-bold">{topic.reaction_count || 0}</span>
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                {topic.pinned && (
                  <span className="inline-flex items-center gap-1 text-xs text-amber-600 font-medium">
                    <Pin className="w-3 h-3" /> {s.pinned}
                  </span>
                )}
                {topic.locked && (
                  <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                    <Lock className="w-3 h-3" /> {s.locked}
                  </span>
                )}
                {board && (
                  <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full ${boardColor}`}>
                    {getBoardTitle(board.slug, board.title)}
                  </span>
                )}
                {isPending && isAuthor && (
                  <Badge variant="outline" className="text-[10px] border-amber-400 text-amber-700">
                    {s.pendingReview}
                  </Badge>
                )}
              </div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold text-foreground mb-4">
                {topic.title}
              </h1>
              <div className="flex items-center gap-3 mb-4">
                <Avatar className="h-10 w-10">
                  <AvatarImage src={topic.author_avatar_url ?? undefined} />
                  <AvatarFallback>{initials(topic.author_name)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-semibold">{topic.author_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatDistanceToNow(new Date(topic.created_at), { addSuffix: true })}
                  </p>
                </div>
              </div>
              <p className="text-foreground/85 leading-relaxed whitespace-pre-wrap mb-5">
                {topic.content}
              </p>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <MessageCircle className="w-3.5 h-3.5" />
                  {topic.reply_count} {replyLabel}
                </span>
                <div className="flex flex-wrap items-center gap-2">
                  <ForumTopicActions
                    topicId={topic.id}
                    bookmarked={bookmarked}
                    subscribed={subscribed}
                    onBookmark={handleBookmark}
                    onSubscribe={handleSubscribe}
                    loading={actionLoading}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <h2 className="font-heading text-lg font-semibold mb-4">
          {flatReplies.length}{" "}
          {flatReplies.length === 1 ? s.reply : s.replyPlural}
        </h2>

        <ForumReplyList
          replies={replies}
          topicId={topic.id}
          userEmail={user?.email}
          reactedIds={reactedReplySet}
          onReact={handleReactReply}
          onRefresh={refresh}
          loading={repliesLoading}
        />

        {!topic.locked && (
          <div className="mt-8">
            <ForumReplyComposer topicId={topic.id} onPosted={refresh} />
          </div>
        )}

        {topic.locked && (
          <p className="text-sm text-muted-foreground text-center py-6">
            {s.topicLocked}
          </p>
        )}
      </div>
    </div>
  );
}
