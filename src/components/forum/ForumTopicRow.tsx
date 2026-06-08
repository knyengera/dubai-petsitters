"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { ArrowUp, Lock, MessageCircle, Pin } from "lucide-react";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { BOARD_COLORS, FORUM_TITLE_LINK_CLASS } from "@/lib/forum/config";
import { useForumI18n } from "@/lib/i18n/use-forum-i18n";
import type { ForumTopic } from "@/lib/forum/types";

type ForumTopicRowProps = {
  topic: ForumTopic;
  boardSlug: string;
  hasReacted?: boolean;
  onReact?: (topic: ForumTopic) => void;
};

function initials(name: string) {
  return name
    .split(" ")
    .map((p) => p[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

export default function ForumTopicRow({
  topic,
  boardSlug,
  hasReacted,
  onReact,
}: ForumTopicRowProps) {
  const { s, getBoardTitle } = useForumI18n();
  const boardColor =
    BOARD_COLORS[topic.board?.color ?? "blue"] ?? BOARD_COLORS.blue;

  return (
    <div className="px-5 py-4 hover:bg-muted/40 transition-colors">
      <div className="md:grid md:grid-cols-[1fr_70px_70px_220px] md:gap-4 md:items-center">
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => onReact?.(topic)}
            className={`hidden sm:flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-xl border transition-all shrink-0 h-fit ${
              hasReacted
                ? "bg-primary/10 border-primary text-primary"
                : "border-border text-muted-foreground hover:border-primary hover:text-primary"
            }`}
          >
            <ArrowUp className="w-3.5 h-3.5" />
            <span className="text-xs font-bold">{topic.reaction_count || 0}</span>
          </button>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2 mb-1">
              {topic.pinned && (
                <span className="inline-flex items-center gap-1 text-xs text-warning font-medium">
                  <Pin className="w-3 h-3" /> {s.pinned}
                </span>
              )}
              {topic.locked && (
                <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
                  <Lock className="w-3 h-3" /> {s.locked}
                </span>
              )}
              {topic.board && (
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${boardColor}`}>
                  {getBoardTitle(topic.board.slug, topic.board.title)}
                </span>
              )}
            </div>
            <Link
              href={`/forum/${boardSlug}/${topic.slug}`}
              className={`${FORUM_TITLE_LINK_CLASS} line-clamp-2`}
            >
              {topic.title}
            </Link>
            <p className="text-sm text-muted-foreground line-clamp-1 mt-1">
              {s.byAuthor} {topic.author_name}
            </p>
          </div>
        </div>
        <div className="mt-2 md:mt-0 md:text-center text-sm font-semibold">
          {topic.reply_count}
        </div>
        <div className="mt-1 md:mt-0 md:text-center text-sm font-semibold flex items-center md:justify-center gap-1">
          <MessageCircle className="w-3.5 h-3.5 text-muted-foreground md:hidden" />
          {topic.reply_count + 1}
        </div>
        <div className="mt-2 md:mt-0 flex items-center gap-2">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarFallback className="text-[10px]">
              {initials(topic.last_reply_author_name ?? topic.author_name)}
            </AvatarFallback>
          </Avatar>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate">
              {topic.last_reply_author_name ?? topic.author_name}
            </p>
            <p className="text-[11px] text-muted-foreground">
              {formatDistanceToNow(
                new Date(topic.last_reply_at ?? topic.created_at),
                { addSuffix: true }
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
