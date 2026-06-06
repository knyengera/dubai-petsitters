"use client";

import { Pin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES } from "@/lib/admin/tables";

export default function AdminForum() {
  const { data: threads = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.forum_threads,
    "admin-forum",
    "-created_at"
  );

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Forum"
        description="Moderate community forum threads."
      />
      <AdminDataList
        rows={threads}
        isLoading={isLoading}
        columns={[
          { key: "title", label: "Title" },
          { key: "author_name", label: "Author" },
          { key: "category", label: "Category" },
          { key: "comment_count", label: "Comments" },
          {
            key: "pinned",
            label: "Pinned",
            render: (row) =>
              row.pinned ? (
                <Badge className="text-[10px] bg-primary text-white">Pinned</Badge>
              ) : (
                "No"
              ),
          },
        ]}
        rowActions={(row) => (
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="rounded-xl gap-1"
            onClick={() =>
              updateRow(String(row.id), { pinned: !row.pinned })
            }
          >
            <Pin className="w-3.5 h-3.5" />
            {row.pinned ? "Unpin" : "Pin"}
          </Button>
        )}
        onDelete={(row) =>
          deleteRow(String(row.id), `Delete thread "${row.title}"?`)
        }
      />
    </div>
  );
}
