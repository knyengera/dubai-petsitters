"use client";

import { format } from "date-fns";
import { User } from "lucide-react";
import type { BlogComment } from "@/lib/blog/types";
import { useBlogI18n } from "@/lib/i18n/use-blog-i18n";

type BlogCommentListProps = {
  comments: BlogComment[];
};

export default function BlogCommentList({ comments }: BlogCommentListProps) {
  const { s } = useBlogI18n();

  if (comments.length === 0) {
    return (
      <p className="text-sm text-muted-foreground py-4">
        {s.noComments}
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
              {comment.created_at
                ? format(new Date(comment.created_at), "MMM d, yyyy")
                : "—"}
            </span>
          </div>
          <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>
        </div>
      ))}
    </div>
  );
}
