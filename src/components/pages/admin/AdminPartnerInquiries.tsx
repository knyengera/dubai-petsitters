"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { getAdminListConfig } from "@/lib/admin/list-config";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import {
  formatBusinessDetailsForDisplay,
  type BusinessDetails,
} from "@/lib/partners/partner-types";

const STATUSES = ["new", "contacted", "converted", "closed"];
const LIST_CONFIG = getAdminListConfig(ADMIN_TABLES.partner_inquiries);
const FIELDS: AdminRecordField[] = [
  { key: "business_name", label: "Business Name", required: true },
  { key: "business_type", label: "Business Type" },
  { key: "contact_name", label: "Contact Name" },
  { key: "email", label: "Email" },
  { key: "phone", label: "Phone" },
  { key: "city", label: "City" },
  { key: "website", label: "Website" },
  { key: "gallery", label: "Business Photos", type: "gallery", coverKey: "image_url", galleryKey: "gallery", hideInView: true, uploadCategory: "partners" },
  { key: "plan", label: "Plan" },
  { key: "message", label: "Message", type: "textarea", className: "col-span-2" },
  { key: "status", label: "Status", type: "select", options: STATUSES },
];

function BusinessDetailsPanel({ row }: { row: Row }) {
  const details = row.business_details as BusinessDetails | null | undefined;
  const rows = formatBusinessDetailsForDisplay(String(row.business_type ?? ""), details);
  const detailRows = rows.filter((r) => r.label !== "Business Type");

  if (detailRows.length === 0) return null;

  return (
    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-3">
      <p className="col-span-full font-heading font-semibold text-sm text-foreground">Business Details</p>
      {detailRows.map(({ label, value }) => (
        <div key={label} className="rounded-xl border border-border bg-muted/20 p-3">
          <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{label}</p>
          <p className="text-sm text-foreground break-words">{value}</p>
        </div>
      ))}
    </div>
  );
}

export default function AdminPartnerInquiries() {
  const {
    rows: inquiries,
    total,
    page,
    pageSize,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    isLoading,
    updateRow,
    deleteRow,
  } = useAdminPaginatedList(ADMIN_TABLES.partner_inquiries, "admin-partner-inquiries");
  const [viewingInquiry, setViewingInquiry] = useState<Row | null>(null);
  const [editingInquiry, setEditingInquiry] = useState<Row | null>(null);

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Inquiry updated");

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Partner Inquiries"
        description="Review partnership and advertising inquiries from /become-partner."
      />
      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by business, contact, email, or city..."
        filters={(LIST_CONFIG.filters ?? []).map((f) => ({
          key: f.key,
          value: filters[f.key] ?? "all",
          options: f.options,
          allLabel: "All statuses",
        }))}
        onFilterChange={setFilter}
        total={total}
        page={page}
        pageSize={pageSize}
        resultNoun="inquiries"
      />
      <AdminDataList
        rows={inquiries}
        isLoading={isLoading}
        columns={[
          { key: "business_name", label: "Business" },
          { key: "business_type", label: "Type" },
          { key: "contact_name", label: "Contact" },
          { key: "email", label: "Email" },
          { key: "phone", label: "Phone" },
          { key: "city", label: "City" },
          { key: "plan", label: "Plan" },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <Badge variant="secondary" className="capitalize text-[10px]">
                {String(row.status ?? "new")}
              </Badge>
            ),
          },
          {
            key: "message",
            label: "Message",
            className: "col-span-2",
          },
        ]}
        onView={setViewingInquiry}
        onEdit={setEditingInquiry}
        rowActions={(row) => (
          <Select
            value={String(row.status ?? "new")}
            onValueChange={(v) => updateRow(String(row.id), { status: v, updated_at: new Date().toISOString() }, "Status updated")}
          >
            <SelectTrigger className="w-28 h-8 rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        onDelete={(row) =>
          deleteRow(String(row.id), `Delete inquiry from ${row.business_name}?`)
        }
      />

      <AdminPagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />

      <AdminRecordViewDialog
        row={viewingInquiry}
        title="Partner Inquiry"
        titleKey="business_name"
        fields={FIELDS}
        imageKey="image_url"
        badges={(row) => (
          <Badge variant="secondary" className="capitalize text-[10px]">
            {String(row.status ?? "new")}
          </Badge>
        )}
        extraContent={(row) => <BusinessDetailsPanel row={row} />}
        onOpenChange={(open) => !open && setViewingInquiry(null)}
      />
      <AdminRecordEditDialog
        row={editingInquiry}
        title="Edit Partner Inquiry"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingInquiry(null)}
      />
    </div>
  );
}
