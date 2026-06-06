"use client";

import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES } from "@/lib/admin/tables";

export default function AdminReviews() {
  const { data: reviews = [], isLoading, deleteRow } = useAdminList(
    ADMIN_TABLES.reviews,
    "admin-reviews"
  );

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Reviews"
        description="Moderate user reviews across the platform."
      />
      <AdminDataList
        rows={reviews}
        isLoading={isLoading}
        columns={[
          { key: "author_name", label: "Author" },
          { key: "target_type", label: "Target Type" },
          { key: "target_id", label: "Target ID" },
          { key: "rating", label: "Rating" },
          {
            key: "comment",
            label: "Comment",
            className: "col-span-2",
          },
        ]}
        onDelete={(row) =>
          deleteRow(String(row.id), `Delete review by ${row.author_name}?`)
        }
      />
    </div>
  );
}
