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
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import PartnerSubscriptionsPanel from "@/components/pages/admin/PartnerSubscriptionsPanel";

const STATUSES = ["pending", "pending_payment", "active", "cancelled", "expired"];
const LIST_CONFIG = getAdminListConfig(ADMIN_TABLES.vet_subscriptions);
const FIELDS: AdminRecordField[] = [
  { key: "clinic_id", label: "Clinic ID", viewOnly: true },
  { key: "clinic_name", label: "Clinic Name" },
  { key: "contact_name", label: "Contact Name" },
  { key: "contact_email", label: "Contact Email" },
  { key: "city", label: "City" },
  { key: "plan", label: "Plan" },
  { key: "status", label: "Status", type: "select", options: STATUSES },
  { key: "amount", label: "Amount", type: "number" },
  { key: "amount_paid", label: "Amount Paid", type: "number" },
  { key: "gateway", label: "Gateway" },
  { key: "start_date", label: "Start Date", type: "date" },
  { key: "end_date", label: "End Date", type: "date" },
  { key: "created_by", label: "Created By", viewOnly: true },
];

export default function AdminSubscriptions() {
  const {
    rows: subs,
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
  } = useAdminPaginatedList(ADMIN_TABLES.vet_subscriptions, "admin-subscriptions");
  const [viewingSub, setViewingSub] = useState<Row | null>(null);
  const [editingSub, setEditingSub] = useState<Row | null>(null);

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Subscription updated");

  return (
    <div className="pb-10 space-y-10">
      <PartnerSubscriptionsPanel />

      <AdminPageHeader
        title="Vet Subscriptions"
        description="Legacy vet advertising subscriptions. New vet clinic sign-ups come through /become-partner."
      />
      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by clinic, contact, email, or city..."
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
        resultNoun="subscriptions"
      />
      <AdminDataList
        rows={subs}
        isLoading={isLoading}
        columns={[
          { key: "clinic_name", label: "Clinic" },
          { key: "contact_name", label: "Contact" },
          { key: "contact_email", label: "Email" },
          { key: "city", label: "City" },
          { key: "plan", label: "Plan" },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <Badge variant="secondary" className="capitalize text-[10px]">
                {String(row.status ?? "pending")}
              </Badge>
            ),
          },
          {
            key: "amount_paid",
            label: "Amount",
            render: (row) => {
              const amt = row.amount_paid ?? row.amount;
              return amt ? `${DEFAULT_CURRENCY} ${amt}` : "—";
            },
          },
          { key: "gateway", label: "Gateway" },
          { key: "start_date", label: "Start" },
          { key: "end_date", label: "End" },
        ]}
        onView={setViewingSub}
        onEdit={setEditingSub}
        rowActions={(row) => (
          <Select
            value={String(row.status ?? "pending")}
            onValueChange={(v) => updateRow(String(row.id), { status: v }, "Status updated")}
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
        onDelete={(row) => deleteRow(String(row.id), "Delete subscription?")}
      />

      <AdminPagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />

      <AdminRecordViewDialog
        row={viewingSub}
        title="Vet Subscription"
        titleKey="clinic_name"
        fields={FIELDS}
        badges={(row) => (
          <Badge variant="secondary" className="capitalize text-[10px]">
            {String(row.status ?? "pending")}
          </Badge>
        )}
        onOpenChange={(open) => !open && setViewingSub(null)}
      />
      <AdminRecordEditDialog
        row={editingSub}
        title="Edit Vet Subscription"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingSub(null)}
      />
    </div>
  );
}
