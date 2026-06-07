"use client";

import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useForumI18n } from "@/lib/i18n/use-forum-i18n";

type ForumPaginationProps = {
  page: number;
  total: number;
  pageSize: number;
  onPageChange: (page: number) => void;
};

export default function ForumPagination({
  page,
  total,
  pageSize,
  onPageChange,
}: ForumPaginationProps) {
  const { s, pageLabel } = useForumI18n();
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-4 pt-6">
      <p className="text-sm text-muted-foreground">
        {pageLabel(page, totalPages, total)}
      </p>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        >
          <ChevronLeft className="w-4 h-4" />
          {s.previous}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="rounded-xl"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        >
          {s.next}
          <ChevronRight className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}
