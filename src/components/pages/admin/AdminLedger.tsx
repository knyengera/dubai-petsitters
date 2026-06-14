"use client";

import { useEffect, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { adminListLedgerEntries } from "@/lib/monetisation/actions";
import { Loader2 } from "lucide-react";
import type { Row } from "@/lib/admin/tables";

export default function AdminLedger() {
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    adminListLedgerEntries().then((result) => {
      if (result.ok) setRows(result.data);
      setLoading(false);
    });
  }, []);

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Ledger"
        description="Immutable audit trail for pay-ins, escrow holds, releases, and payouts."
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
    </div>
  );
}
