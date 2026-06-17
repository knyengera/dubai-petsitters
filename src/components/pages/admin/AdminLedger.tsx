"use client";

import { Badge } from "@/components/ui/badge";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";
import { adminListLedgerEntries } from "@/lib/monetisation/actions";
import { useAdminPaginatedQuery } from "@/components/admin/useAdminPaginatedList";
import { Loader2 } from "lucide-react";
import type { Row } from "@/lib/admin/tables";

const DIRECTION_OPTIONS = [
  { value: "credit", label: "Credit" },
  { value: "debit", label: "Debit" },
];

export default function AdminLedger() {
  const {
    rows,
    total,
    page,
    pageSize,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    isLoading,
  } = useAdminPaginatedQuery<Row>(["admin-ledger"], async ({ page, pageSize, search, filters }) => {
    const result = await adminListLedgerEntries({ page, pageSize, search, filters });
    if (result.ok === false) throw new Error(result.error);
    return result.data;
  });

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Ledger"
        description="Immutable audit trail for pay-ins, escrow holds, releases, and payouts."
      />
      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by actor email..."
        filters={[
          {
            key: "direction",
            value: filters.direction ?? "all",
            options: DIRECTION_OPTIONS,
            allLabel: "All directions",
          },
        ]}
        onFilterChange={setFilter}
        total={total}
        page={page}
        pageSize={pageSize}
        resultNoun="entries"
      />
      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <AdminDataList
          rows={rows}
          isLoading={false}
          layout="table"
          columns={[
            {
              key: "entry_type",
              label: "Type",
              render: (row) => (
                <Badge variant="outline" className="capitalize text-[10px]">
                  {String(row.entry_type).replace(/_/g, " ")}
                </Badge>
              ),
            },
            {
              key: "amount",
              label: "Amount",
              render: (row) => `${row.currency ?? DEFAULT_CURRENCY} ${row.amount}`,
            },
            { key: "direction", label: "Direction" },
            { key: "actor_email", label: "Actor" },
            {
              key: "created_at",
              label: "When",
              render: (row) => (row.created_at ? new Date(String(row.created_at)).toLocaleString() : "—"),
            },
          ]}
        />
      )}

      <AdminPagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
    </div>
  );
}
