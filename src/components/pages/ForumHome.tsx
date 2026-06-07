"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Plus, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import PageHero from "@/components/layout/page-hero";
import ForumBoardTable from "@/components/forum/ForumBoardTable";
import ForumSidebar from "@/components/forum/ForumSidebar";
import ForumTopicComposer from "@/components/forum/ForumTopicComposer";
import {
  getForumBoards,
  getForumStats,
  getRecentForumReplies,
} from "@/lib/forum/actions";
import { useAuth } from "@/lib/auth-context";
import { useForumI18n } from "@/lib/i18n/use-forum-i18n";

export default function ForumHome() {
  const { user, navigateToLogin } = useAuth();
  const { s } = useForumI18n();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [showComposer, setShowComposer] = useState(false);

  const { data: boards = [], isLoading: boardsLoading } = useQuery({
    queryKey: ["forum-boards"],
    queryFn: async () => {
      const result = await getForumBoards();
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["forum-stats"],
    queryFn: async () => {
      const result = await getForumStats();
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const { data: recentReplies = [], isLoading: recentLoading } = useQuery({
    queryKey: ["forum-recent-replies"],
    queryFn: async () => {
      const result = await getRecentForumReplies(8);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const filteredBoards = search.trim()
    ? boards.filter(
        (b) =>
          b.title.toLowerCase().includes(search.toLowerCase()) ||
          (b.description ?? "").toLowerCase().includes(search.toLowerCase())
      )
    : boards;

  return (
    <div className="min-h-screen bg-background">
      <PageHero
        config={{
          title: s.heroTitle,
          subtitle: s.heroSubtitle,
        }}
      >
        <div className="flex flex-col sm:flex-row gap-3 w-full max-w-2xl sm:items-center">
          <div className="relative flex-1 min-w-0">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={s.searchForums}
              className="pl-10 rounded-xl bg-white text-foreground border-0 h-11 w-full"
            />
          </div>
          <Button
            className="rounded-xl h-11 min-h-11 px-6 shrink-0 w-full sm:w-auto"
            onClick={() => (user ? setShowComposer(true) : navigateToLogin())}
          >
            <Plus className="w-4 h-4 mr-2" />
            {s.newTopic}
          </Button>
        </div>
      </PageHero>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8">
          <div>
            {boardsLoading ? (
              <div className="flex justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            ) : (
              <ForumBoardTable boards={filteredBoards} />
            )}
          </div>
          <ForumSidebar
            stats={stats}
            recentReplies={recentReplies}
            loading={statsLoading || recentLoading}
          />
        </div>
      </div>

      {user && (
        <ForumTopicComposer
          open={showComposer}
          onClose={() => setShowComposer(false)}
          boards={boards}
          onCreated={() => {
            queryClient.invalidateQueries({ queryKey: ["forum-boards"] });
            queryClient.invalidateQueries({ queryKey: ["forum-stats"] });
          }}
        />
      )}
    </div>
  );
}
