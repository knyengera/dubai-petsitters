"use client";

import { format } from "date-fns";
import { User } from "lucide-react";
import type { BlogComment } from "@/lib/blog/types";

type BlogCommentListProps = {
  comments: BlogComment[];
};

export default function BlogCommentList({ comments }: BlogCommentListProps) {
  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        No comments yet. Be the first to share your thoughts.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {comments.map((comment) => (
        <div
          key={comment.id}
          className="rounded-2xl border border-border bg-card p-4"
        >
          <div className="flex items-center gap-2 mb-2 text-sm text-muted-foreground">
            <User className="w-3.5 h-3.5" />
            <span className="font-medium text-foreground">{comment.author_name}</span>
            <span>·</span>
            <span>
              {comment.created_at || comment.created_date
                ? format(
                    new Date(comment.created_at ?? comment.created_date!),
                    "MMM d, yyyy"
                  )
                : "—"}
            </span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
