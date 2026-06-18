"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { Bookmark, Bell, Loader2, MessageSquare, Users } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { FORUM_STATS_CARD_CLASS, FORUM_STATS_LABEL_CLASS } from "@/lib/forum/config";
import { useForumI18n } from "@/lib/i18n/use-forum-i18n";
import type { ForumStats } from "@/lib/forum/types";

type RecentReply = {
  id: string;
  content: string;
  author_name: string;
  author_avatar_url?: string | null;
  created_at: string;
  topic?: {
    title: string;
    slug: string;
    board?: { slug: string; title: string };
  };
};

type ForumSidebarProps = {
  stats?: ForumStats | null;
  recentReplies?: RecentReply[];
  loading?: boolean;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ForumSidebar({
  stats,
  recentReplies = [],
  loading,
}: ForumSidebarProps) {
  const { s } = useForumI18n();

  return (
    <aside className="space-y-6">
      <div className={`${FORUM_STATS_CARD_CLASS} rounded-2xl p-5 shadow-sm`}>
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <Users className="w-4 h-4" />
          {s.forumStatistics}
        </h3>
        {loading ? (
          <div className="flex justify-center py-4">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <dt className={FORUM_STATS_LABEL_CLASS}>{s.members}</dt>
              <dd className="text-xl font-bold">{stats?.registered_users ?? 0}</dd>
            </div>
            <div>
              <dt className={FORUM_STATS_LABEL_CLASS}>{s.boards}</dt>
              <dd className="text-xl font-bold">{stats?.boards ?? 0}</dd>
            </div>
            <div>
              <dt className={FORUM_STATS_LABEL_CLASS}>{s.topics}</dt>
              <dd className="text-xl font-bold">{stats?.topics ?? 0}</dd>
            </div>
            <div>
              <dt className={FORUM_STATS_LABEL_CLASS}>{s.replies}</dt>
              <dd className="text-xl font-bold">{stats?.replies ?? 0}</dd>
            </div>
          </dl>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm">
        <h3 className="font-heading font-semibold mb-4 flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-primary" />
          {s.recentReplies}
        </h3>
        {loading ? (
          <div className="flex justify-center py-6">
            <Loader2 className="w-5 h-5 animate-spin text-primary" />
          </div>
        ) : recentReplies.length === 0 ? (
          <p className="text-sm text-muted-foreground">{s.noRecentActivity}</p>
        ) : (
          <ul className="space-y-4">
            {recentReplies.map((reply) => {
              const href =
                reply.topic?.board?.slug && reply.topic?.slug
                  ? `/forum/${reply.topic.board.slug}/${reply.topic.slug}`
                  : "/forum";
              return (
                <li key={reply.id} className="flex gap-3">
                  <Avatar className="h-8 w-8 shrink-0">
                    <AvatarImage src={reply.author_avatar_url ?? undefined} />
                    <AvatarFallback className="text-[10px]">
                      {initials(reply.author_name)}
                    </AvatarFallback>
                  </Avatar>
                  <div className="min-w-0">
                    <Link href={href} className="text-sm font-medium hover:text-primary line-clamp-1">
                      {reply.author_name} {s.onTopic} {reply.topic?.title ?? s.aTopic}
                    </Link>
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-0.5">
                      {reply.content}
                    </p>
                    <p className="text-[11px] text-muted-foreground mt-1">
                      {formatDistanceToNow(new Date(reply.created_at), { addSuffix: true })}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <div className="bg-card border border-border rounded-2xl p-5 shadow-sm text-sm text-muted-foreground">
        <p className="flex items-center gap-2 mb-2">
          <Bell className="w-4 h-4" />
          {s.subscribeHint}
        </p>
        <p className="flex items-center gap-2">
          <Bookmark className="w-4 h-4" />
          {s.bookmarkHint}
        </p>
      </div>
    </aside>
  );
}
