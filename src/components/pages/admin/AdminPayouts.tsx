"use client";

import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";
import { adminListPayoutRequests, adminUpdatePayoutStatus } from "@/lib/monetisation/actions";
import { useAdminPaginatedQuery } from "@/components/admin/useAdminPaginatedList";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { Row } from "@/lib/admin/tables";

const STATUSES = ["pending", "approved", "processing", "paid", "rejected", "cancelled"] as const;

export default function AdminPayouts() {
  const { toast } = useToast();
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
    refetch,
  } = useAdminPaginatedQuery<Row>(["admin-payouts"], async ({ page, pageSize, search, filters }) => {
    const result = await adminListPayoutRequests({ page, pageSize, search, filters });
    if (result.ok === false) throw new Error(result.error);
    return result.data;
  });

  const updateStatus = async (id: string, status: string) => {
    const result = await adminUpdatePayoutStatus({ payoutId: id, status: status as never });
    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: `Payout ${status}` });
    refetch();
  };

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Host Payouts"
        description="Review withdrawal requests. Host payout fee is deducted server-side."
      />
      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by host email..."
        filters={[
          {
            key: "status",
            value: filters.status ?? "all",
            options: STATUSES.map((value) => ({ value, label: value })),
            allLabel: "All statuses",
          },
        ]}
        onFilterChange={setFilter}
        total={total}
        page={page}
        pageSize={pageSize}
        resultNoun="payout requests"
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
          getRowKey={(row) => String(row.id)}
          columns={[
            { key: "requested_by_email", label: "Host email" },
            {
              key: "payment_provider",
              label: "Method",
              render: (row) => (
                <Badge variant="outline" className="capitalize text-[10px]">
                  {String(row.payment_provider ?? "—").replace("_", " ")}
                </Badge>
              ),
            },
            {
              key: "payout_destination",
              label: "Destination",
              render: (row) => String(row.payout_destination ?? "—"),
            },
            {
              key: "gross_amount",
              label: "Gross",
              render: (row) => `${row.currency ?? DEFAULT_CURRENCY} ${row.gross_amount}`,
            },
            {
              key: "payout_fee_amount",
              label: "Fee",
              render: (row) => `${row.currency ?? DEFAULT_CURRENCY} ${row.payout_fee_amount}`,
            },
            {
              key: "net_amount",
              label: "Net",
              render: (row) => `${row.currency ?? DEFAULT_CURRENCY} ${row.net_amount}`,
            },
            {
              key: "status",
              label: "Status",
              render: (row) => (
                <Badge variant="secondary" className="capitalize text-[10px]">
                  {String(row.status)}
                </Badge>
              ),
            },
          ]}
          rowActions={(row) => (
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={String(row.status ?? "pending")}
                onValueChange={(v) => updateStatus(String(row.id), v)}
              >
                <SelectTrigger className="w-32 h-8 rounded-lg text-xs">
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
            </div>
          )}
        />
      )}

      <AdminPagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />
    </div>
  );
}
