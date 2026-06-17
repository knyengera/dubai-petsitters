"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";
import {
  AdminRecordEditDialog,
  AdminRecordViewDialog,
  type AdminRecordField,
} from "@/components/admin/AdminRecordDialogs";
import { useAdminPaginatedList } from "@/components/admin/useAdminPaginatedList";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";

const FIELDS: AdminRecordField[] = [
  { key: "target_type", label: "Target Type", required: true },
  { key: "target_id", label: "Target ID", viewOnly: true },
  { key: "author_name", label: "Author Name" },
  { key: "author_email", label: "Author Email" },
  { key: "rating", label: "Rating", type: "integer" },
  { key: "comment", label: "Comment", type: "textarea", className: "col-span-2" },
];

export default function AdminReviews() {
  const {
    rows: reviews,
    total,
    page,
    pageSize,
    setPage,
    search,
    setSearch,
    isLoading,
    updateRow,
    deleteRow,
  } = useAdminPaginatedList(ADMIN_TABLES.reviews, "admin-reviews");
  const [viewingReview, setViewingReview] = useState<Row | null>(null);
  const [editingReview, setEditingReview] = useState<Row | null>(null);

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Review updated");

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Reviews"
        description="Moderate user reviews across the platform."
      />
      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by author or target type..."
        total={total}
        page={page}
        pageSize={pageSize}
        resultNoun="reviews"
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
        onView={setViewingReview}
        onEdit={setEditingReview}
        onDelete={(row) =>
          deleteRow(String(row.id), `Delete review by ${row.author_name}?`)
        }
      />

      <AdminPagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />

      <AdminRecordViewDialog
        row={viewingReview}
        title="Review"
        titleKey="author_name"
        fields={FIELDS}
        badges={(row) => (
          <Badge variant="secondary" className="text-[10px]">
            {String(row.rating ?? "—")} stars
          </Badge>
        )}
        onOpenChange={(open) => !open && setViewingReview(null)}
      />
      <AdminRecordEditDialog
        row={editingReview}
        title="Edit Review"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingReview(null)}
      />
    </div>
  );
}
