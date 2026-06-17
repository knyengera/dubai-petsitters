"use client";

import { useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";
import AdminEscrowRefundDialog from "@/components/pages/admin/AdminEscrowRefundDialog";
import { adminListEscrowAccounts, releaseEscrow, markBookingCompleted } from "@/lib/monetisation/actions";
import { useAdminPaginatedQuery } from "@/components/admin/useAdminPaginatedList";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { Row } from "@/lib/admin/tables";

const ESCROW_STATUS_OPTIONS = [
  "pending_payment",
  "held",
  "release_pending",
  "released",
  "refunded",
  "disputed",
  "cancelled",
].map((value) => ({ value, label: value.replace(/_/g, " ") }));

export default function AdminEscrow() {
  const { toast } = useToast();
  const {
    rows,
    total,
    page,
    pageSize,
    setPage,
    filters,
    setFilter,
    isLoading,
    refetch,
  } = useAdminPaginatedQuery<Row>(["admin-escrow"], async ({ page, pageSize, filters }) => {
    const result = await adminListEscrowAccounts({ page, pageSize, filters });
    if (result.ok === false) throw new Error(result.error);
    return result.data;
  });
  const [acting, setActing] = useState<string | null>(null);
  const [refundRow, setRefundRow] = useState<Row | null>(null);

  const handleRelease = async (bookingId: string) => {
    setActing(bookingId);
    const result = await releaseEscrow(bookingId);
    setActing(null);
    if (result.ok === false) {
      toast({ title: "Release failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Escrow released to host balance" });
    refetch();
  };

  const handleComplete = async (bookingId: string) => {
    setActing(bookingId);
    const result = await markBookingCompleted(bookingId);
    setActing(null);
    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Booking marked completed" });
    refetch();
  };

  const handleRefundSuccess = () => {
    toast({ title: "Refund processed" });
    refetch();
  };

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Escrow"
        description="Review held funds, release host earnings, and process refunds."
      />
      <AdminFilterBar
        filters={[
          {
            key: "status",
            value: filters.status ?? "all",
            options: ESCROW_STATUS_OPTIONS,
            allLabel: "All statuses",
          },
        ]}
        onFilterChange={setFilter}
        total={total}
        page={page}
        pageSize={pageSize}
        resultNoun="escrow accounts"
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
          getRowKey={(row) => String(row.booking_id ?? row.id)}
          columns={[
            {
              key: "booking_id",
              label: "Booking",
              render: (row) => {
                const id = String(row.booking_id ?? "");
                if (!id) return "—";
                return (
                  <span title={id} className="font-mono text-xs">
                    {id.slice(0, 8)}
                  </span>
                );
              },
            },
            { key: "host_name", label: "Host" },
            {
              key: "payment_method_label",
              label: "Payment",
              render: (row) => (
                <Badge variant="outline" className="capitalize text-[10px]">
                  {String(row.payment_method_label ?? row.payment_provider ?? "—")}
                </Badge>
              ),
            },
            {
              key: "gross_amount",
              label: "Gross",
              render: (row) => `${row.currency ?? DEFAULT_CURRENCY} ${row.gross_amount}`,
            },
            {
              key: "host_earnings",
              label: "Host earns",
              render: (row) => `${row.currency ?? DEFAULT_CURRENCY} ${row.host_earnings}`,
            },
            {
              key: "refunded_amount",
              label: "Refunded",
              render: (row) => {
                const currency = row.currency ?? DEFAULT_CURRENCY;
                const refunded = Number(row.refunded_amount ?? 0);
                const gross = Number(row.gross_amount ?? 0);
                return `${currency} ${refunded.toFixed(2)} / ${gross.toFixed(2)}`;
              },
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
              {row.status === "held" && (
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 rounded-lg text-xs"
                  disabled={acting === String(row.booking_id)}
                  onClick={() => handleComplete(String(row.booking_id))}
                >
                  Mark completed
                </Button>
              )}
              {(row.status === "held" || row.status === "release_pending") && (
                <Button
                  size="sm"
                  className="h-8 rounded-lg text-xs"
                  disabled={acting === String(row.booking_id)}
                  onClick={() => handleRelease(String(row.booking_id))}
                >
                  Release funds
                </Button>
              )}
              {row.can_refund === true && (
                <Button
                  size="sm"
                  variant="destructive"
                  className="h-8 rounded-lg text-xs"
                  disabled={acting === String(row.booking_id)}
                  onClick={() => setRefundRow(row)}
                >
                  Refund
                </Button>
              )}
            </div>
          )}
        />
      )}

      <AdminPagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />

      <AdminEscrowRefundDialog
        row={refundRow}
        onOpenChange={(open) => {
          if (!open) setRefundRow(null);
        }}
        onSuccess={handleRefundSuccess}
      />
    </div>
  );
}
