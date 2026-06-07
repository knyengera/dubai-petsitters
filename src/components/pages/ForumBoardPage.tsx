"use client";

import { useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PageHero from "@/components/layout/page-hero";
import ForumBreadcrumbs from "@/components/forum/ForumBreadcrumbs";
import ForumPagination from "@/components/forum/ForumPagination";
import ForumSidebar from "@/components/forum/ForumSidebar";
import ForumTopicComposer from "@/components/forum/ForumTopicComposer";
import ForumTopicRow from "@/components/forum/ForumTopicRow";
import {
  getForumBoardBySlug,
  getForumBoards,
  getForumStats,
  getForumTopics,
  getRecentForumReplies,
  getUserForumReactions,
  toggleForumReaction,
} from "@/lib/forum/actions";
import { FORUM_PAGE_SIZE, FORUM_TABLE_HEADER_CLASS } from "@/lib/forum/config";
import type { ForumTopic } from "@/lib/forum/types";
import { useAuth } from "@/lib/auth-context";
import { useForumI18n } from "@/lib/i18n/use-forum-i18n";

export default function ForumBoardPage() {
  const params = useParams();
  const boardSlug = String(params.boardSlug ?? "");
  const { user, navigateToLogin } = useAuth();
  const { s, getBoardTitle, getBoardDescription } = useForumI18n();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState<"latest" | "popular" | "replies">("latest");
  const [page, setPage] = useState(1);
  const [showComposer, setShowComposer] = useState(false);

  const { data: board, isLoading: boardLoading } = useQuery({
    queryKey: ["forum-board", boardSlug],
    queryFn: async () => {
      const result = await getForumBoardBySlug(boardSlug);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
    enabled: !!boardSlug,
  });

  const displayTitle = getBoardTitle(board.slug, board.title);
  const displayDescription =
    getBoardDescription(board.slug, board.description) ?? s.browseTopicsDefault;

  const { data: boards = [] } = useQuery({
    queryKey: ["forum-boards"],
    queryFn: async () => {
      const result = await getForumBoards();
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const { data: topicData, isLoading: topicsLoading } = useQuery({
    queryKey: ["forum-topics", boardSlug, search, sort, page],
    queryFn: async () => {
      const result = await getForumTopics({
        boardSlug,
        search,
        sort,
        page,
      });
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
    enabled: !!boardSlug,
  });

  const topicIds = useMemo(
    () => (topicData?.topics ?? []).map((t) => t.id),
    [topicData?.topics]
  );

  const { data: reactedIds = [] } = useQuery({
    queryKey: ["forum-topic-reactions", topicIds],
    queryFn: async () => {
      const result = await getUserForumReactions("topic", topicIds);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
    enabled: !!user && topicIds.length > 0,
  });

  const reactedSet = useMemo(() => new Set(reactedIds), [reactedIds]);

  const { data: stats } = useQuery({
    queryKey: ["forum-stats"],
    queryFn: async () => {
      const result = await getForumStats();
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const { data: recentReplies = [] } = useQuery({
    queryKey: ["forum-recent-replies"],
    queryFn: async () => {
      const result = await getRecentForumReplies(8);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const handleReact = async (topic: ForumTopic) => {
    if (!user) return navigateToLogin();
    await toggleForumReaction({ target_type: "topic", target_id: topic.id });
    queryClient.invalidateQueries({ queryKey: ["forum-topics", boardSlug] });
    queryClient.invalidateQueries({ queryKey: ["forum-topic-reactions"] });
  };

  if (boardLoading) {
    return (
      <div className="flex justify-center py-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!board) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-muted-foreground">
        {s.boardNotFound}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        config={{
          title: displayTitle,
          subtitle: displayDescription,
        }}
        beforeTitle={
          <ForumBreadcrumbs items={[{ label: displayTitle }]} variant="light" />
        }
      >
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-3xl sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder={s.searchTopics}
              className="pl-10 rounded-xl bg-white text-foreground border-0 h-11 w-full"
            />
          </div>
          <div className="w-full sm:w-44 shrink-0">
            <Select
              value={sort}
              onValueChange={(v) => {
                setSort(v as typeof sort);
                setPage(1);
              }}
            >
              <SelectTrigger className="w-full rounded-xl bg-white border-0 !h-11 min-h-11 px-3 shadow-none data-[size=default]:!h-11">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="latest">{s.sortLatest}</SelectItem>
                <SelectItem value="popular">{s.sortPopular}</SelectItem>
                <SelectItem value="replies">{s.sortReplies}</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button
            className="rounded-xl gap-2 shrink-0 h-11 min-h-11 px-6 w-full sm:w-auto"
            onClick={() => (user ? setShowComposer(true) : navigateToLogin())}
          >
            <Plus className="w-4 h-4" /> {s.newTopic}
          </Button>
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div>
            <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-sm">
              <div
                className={`hidden md:grid grid-cols-[1fr_70px_70px_220px] gap-4 px-5 py-3 text-xs font-semibold uppercase tracking-wide ${FORUM_TABLE_HEADER_CLASS}`}
              >
                <span>{s.colTopic}</span>
                <span className="text-center">{s.colReplies}</span>
                <span className="text-center">{s.colPosts}</span>
                <span>{s.colFreshness}</span>
              </div>
              {topicsLoading ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="w-7 h-7 animate-spin text-primary" />
                </div>
              ) : (topicData?.topics ?? []).length === 0 ? (
                <div className="text-center py-16 px-6">
                  <p className="text-muted-foreground mb-4">{s.noTopicsInBoard}</p>
                  <Button
                    className="rounded-xl"
                    onClick={() => (user ? setShowComposer(true) : navigateToLogin())}
                  >
                    {s.startFirstTopic}
                  </Button>
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {(topicData?.topics ?? []).map((topic) => (
                    <li key={topic.id}>
                      <ForumTopicRow
                        topic={topic}
                        boardSlug={boardSlug}
                        hasReacted={reactedSet.has(topic.id)}
                        onReact={handleReact}
                      />
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <ForumPagination
              page={page}
              total={topicData?.total ?? 0}
              pageSize={FORUM_PAGE_SIZE}
              onPageChange={setPage}
            />
          </div>
          <ForumSidebar stats={stats} recentReplies={recentReplies} />
        </div>
      </div>

      {user && (
        <ForumTopicComposer
          open={showComposer}
          onClose={() => setShowComposer(false)}
          boards={boards}
          defaultBoardId={board.id}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["forum-topics", boardSlug] });
            queryClient.invalidateQueries({ queryKey: ["forum-board", boardSlug] });
          }}
        />
      )}
    </div>
  );
}
