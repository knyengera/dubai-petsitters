"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { adminListEscrowAccounts, releaseEscrow, markBookingCompleted } from "@/lib/monetisation/actions";
import { Loader2 } from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import type { Row } from "@/lib/admin/tables";

export default function AdminEscrow() {
  const { toast } = useToast();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);
  const [acting, setActing] = useState<string | null>(null);

  const load = async () => {
    setLoading(true);
    const result = await adminListEscrowAccounts();
    if (result.ok) setRows(result.data);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const handleRelease = async (bookingId: string) => {
    setActing(bookingId);
    const result = await releaseEscrow(bookingId);
    setActing(null);
    if (result.ok === false) {
      toast({ title: "Release failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Escrow released to host balance" });
    load();
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
    load();
  };

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Escrow"
        description="Review held funds and release host earnings after service completion."
      />
      {loading ? (
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
            { key: "booking_id", label: "Booking" },
            { key: "host_id", label: "Host" },
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
            </div>
          )}
        />
      )}
    </div>
  );
}
