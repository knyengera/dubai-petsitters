"use client";

import Link from "next/link";
import { formatDistanceToNow } from "date-fns";
import { MessageSquare, MessagesSquare } from "lucide-react";
import { BOARD_COLORS, FORUM_TABLE_HEADER_CLASS, FORUM_TITLE_LINK_CLASS } from "@/lib/forum/config";
import { useForumI18n } from "@/lib/i18n/use-forum-i18n";
import type { ForumBoard } from "@/lib/forum/types";

type ForumBoardTableProps = {
  boards: ForumBoard[];
};

export default function ForumBoardTable({ boards }: ForumBoardTableProps) {
  const { s, getBoardTitle, getBoardDescription } = useForumI18n();

  return (
    <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
      <div
        className={`hidden md:grid grid-cols-[1fr_90px_90px_220px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wide ${FORUM_TABLE_HEADER_CLASS}`}
      >
        <span>{s.colForum}</span>
        <span className="text-center">{s.colTopics}</span>
        <span className="text-center">{s.colPosts}</span>
        <span>{s.colFreshness}</span>
      </div>
      <ul className="divide-y divide-border">
        {boards.map((board) => (
          <li key={board.id}>
            <Link
              href={`/forum/${board.slug}`}
              className="block px-5 py-4 hover:bg-muted/40 transition-colors"
            >
              <div className="md:grid md:grid-cols-[1fr_90px_90px_220px] md:gap-4 md:items-center">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span
                      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                        BOARD_COLORS[board.color ?? "blue"] ?? BOARD_COLORS.blue
                      }`}
                    >
                      {getBoardTitle(board.slug, board.title).split(" ")[0]}
                    </span>
                    <h3 className={FORUM_TITLE_LINK_CLASS}>
                      {getBoardTitle(board.slug, board.title)}
                    </h3>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {getBoardDescription(board.slug, board.description)}
                  </p>
                </div>
                <div className="mt-3 md:mt-0 flex md:justify-center items-center gap-1.5 text-sm font-semibold text-foreground">
                  <MessageSquare className="w-4 h-4 text-muted-foreground md:hidden" />
                  {board.topic_count}
                  <span className="md:hidden text-muted-foreground font-normal">{s.topicsLabel}</span>
                </div>
                <div className="mt-1 md:mt-0 flex md:justify-center items-center gap-1.5 text-sm font-semibold text-foreground">
                  <MessagesSquare className="w-4 h-4 text-muted-foreground md:hidden" />
                  {board.post_count}
                  <span className="md:hidden text-muted-foreground font-normal">{s.postsLabel}</span>
                </div>
                <div className="mt-2 md:mt-0 text-xs text-muted-foreground">
                  {board.updated_at
                    ? formatDistanceToNow(new Date(board.updated_at), { addSuffix: true })
                    : s.noActivity}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
