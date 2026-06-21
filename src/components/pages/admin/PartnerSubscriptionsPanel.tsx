"use client";

import { useCallback, useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useToast } from "@/components/ui/use-toast";
import AdminDataList from "@/components/admin/AdminDataList";
import AdminPagination from "@/components/admin/AdminPagination";
import type { Row } from "@/lib/admin/tables";
import {
  adminCancelPartnerSubscription,
  adminListPartnerSubscriptions,
} from "@/lib/partners/subscription-actions";

const STATUSES = ["all", "active", "past_due", "incomplete", "canceled"];
const PAGE_SIZE = 20;

const STATUS_VARIANT: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  active: "default",
  past_due: "destructive",
  canceled: "secondary",
  incomplete: "outline",
};

function formatDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

export default function PartnerSubscriptionsPanel() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [cancelingId, setCancelingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setIsLoading(true);
    const result = await adminListPartnerSubscriptions({
      page,
      pageSize: PAGE_SIZE,
      status,
    });
    if (result.ok === false) {
      toast({ title: "Failed to load subscriptions", description: result.error, variant: "destructive" });
    } else {
      setRows(result.data.rows);
      setTotal(result.data.total);
    }
    setIsLoading(false);
  }, [page, status, toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const handleCancel = async (row: Row) => {
    const id = String(row.id);
    if (!window.confirm("Cancel this subscription at the end of the current period?")) {
      return;
    }
    setCancelingId(id);
    const result = await adminCancelPartnerSubscription({ subscriptionId: id });
    setCancelingId(null);
    if (result.ok === false) {
      toast({ title: "Cancel failed", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Subscription will cancel at period end" });
      void load();
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="font-heading text-lg font-bold">Partner Advertising Subscriptions</h2>
          <p className="text-sm text-muted-foreground">
            Recurring monthly plans billed through Stripe. {total} total.
          </p>
        </div>
        <Select value={status} onValueChange={(v) => { setPage(1); setStatus(v); }}>
          <SelectTrigger className="w-40 h-9 rounded-lg text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUSES.map((s) => (
              <SelectItem key={s} value={s} className="capitalize">
                {s === "all" ? "All statuses" : s.replace("_", " ")}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <AdminDataList
        rows={rows}
        isLoading={isLoading}
        layout="table"
        emptyMessage="No partner subscriptions yet."
        columns={[
          { key: "plan_name", label: "Plan" },
          { key: "payer_email", label: "Email" },
          {
            key: "status",
            label: "Status",
            render: (row) => (
              <Badge
                variant={STATUS_VARIANT[String(row.status)] ?? "secondary"}
                className="capitalize text-[10px]"
              >
                {String(row.status ?? "—").replace("_", " ")}
              </Badge>
            ),
          },
          {
            key: "amount",
            label: "Amount",
            render: (row) => `${String(row.currency ?? "USD")} ${row.amount ?? 0}/mo`,
          },
          {
            key: "current_period_end",
            label: "Next billing",
            render: (row) => formatDate(row.current_period_end),
          },
          {
            key: "cancel_at_period_end",
            label: "Ending",
            render: (row) =>
              row.cancel_at_period_end ? (
                <Badge variant="outline" className="text-[10px]">Cancels at period end</Badge>
              ) : (
                <span className="text-muted-foreground">—</span>
              ),
          },
        ]}
        rowActions={(row) => {
          const canCancel =
            String(row.status) !== "canceled" && !row.cancel_at_period_end;
          if (!canCancel) return null;
          return (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl text-destructive hover:text-destructive"
              disabled={cancelingId === String(row.id)}
              onClick={() => handleCancel(row)}
            >
              {cancelingId === String(row.id) ? "Canceling…" : "Cancel"}
            </Button>
          );
        }}
      />

      <AdminPagination page={page} total={total} pageSize={PAGE_SIZE} onPageChange={setPage} />
    </div>
  );
}
