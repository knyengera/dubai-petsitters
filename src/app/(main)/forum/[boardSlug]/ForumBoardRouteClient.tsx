"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { getForumBoardBySlug, getForumTopicById } from "@/lib/forum/actions";
import ForumBoardPage from "@/components/pages/ForumBoardPage";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function ForumBoardRouteClient() {
  const params = useParams();
  const router = useRouter();
  const boardSlug = String(params.boardSlug ?? "");

  useEffect(() => {
    if (!boardSlug) return;
    if (UUID_RE.test(boardSlug)) {
      getForumTopicById(boardSlug).then((result) => {
        if (result.ok && result.data?.board?.slug && result.data.slug) {
          router.replace(`/forum/${result.data.board.slug}/${result.data.slug}`);
        } else {
          router.replace("/forum");
        }
      });
      return;
    }
    getForumBoardBySlug(boardSlug).then((result) => {
      if (result.ok && !result.data) {
        router.replace("/forum");
      }
    });
  }, [boardSlug, router]);

  if (UUID_RE.test(boardSlug)) {
    return (
      <div className="flex justify-center py-40">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return <ForumBoardPage />;
}
