"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { adminListPayoutRequests, adminUpdatePayoutStatus } from "@/lib/monetisation/actions";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { Row } from "@/lib/admin/tables";

const STATUSES = ["pending", "approved", "processing", "paid", "rejected", "cancelled"] as const;

export default function AdminPayouts() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const result = await adminListPayoutRequests();
    if (result.ok) setRows(result.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const result = await adminUpdatePayoutStatus({ payoutId: id, status: status as never });
    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: `Payout ${status}` });
    load();
  };

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Host Payouts"
        description="Review withdrawal requests. Host payout fee is deducted server-side."
      />
      {loading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : (
        <AdminDataList
          rows={rows}
          isLoading={false}
          columns={[
            { key: "requested_by_email", label: "Host email" },
            {
              key: "payment_provider",
              label: "Method",
              render: (row) => String(row.payment_provider ?? "—").replace("_", " "),
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
          )}
        />
      )}
    </div>
  );
}
