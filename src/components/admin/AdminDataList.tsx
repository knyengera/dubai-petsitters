"use client";

import { Loader2, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Row } from "@/lib/admin/tables";

export type AdminColumn = {
  key: string;
  label: string;
  render?: (row: Row) => React.ReactNode;
  className?: string;
};

type AdminDataListProps = {
  rows: Row[];
  columns: AdminColumn[];
  isLoading?: boolean;
  emptyMessage?: string;
  onEdit?: (row: Row) => void;
  onDelete?: (row: Row) => void;
  rowActions?: (row: Row) => React.ReactNode;
  getRowKey?: (row: Row) => string;
};

export default function AdminDataList({
  rows,
  columns,
  isLoading,
  emptyMessage = "No records found.",
  onEdit,
  onDelete,
  rowActions,
  getRowKey = (row) => String(row.id),
}: AdminDataListProps) {
  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
        {emptyMessage}
      </div>
    );
  }

  const hasActions = Boolean(onEdit || onDelete || rowActions);

  return (
    <div className="space-y-3">
      {rows.map((row) => (
        <div
          key={getRowKey(row)}
          className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4"
        >
          <div className="flex-1 min-w-0 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {columns.map((col) => (
              <div key={col.key} className={col.className}>
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                  {col.label}
                </p>
                <div className="text-sm text-foreground truncate">
                  {col.render
                    ? col.render(row)
                    : formatCell(row[col.key])}
                </div>
              </div>
            ))}
          </div>
          {hasActions ? (
            <div className="flex items-center gap-2 shrink-0">
              {rowActions?.(row)}
              {onEdit ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl"
                  onClick={() => onEdit(row)}
                >
                  Edit
                </Button>
              ) : null}
              {onDelete ? (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="rounded-xl text-destructive hover:text-destructive"
                  onClick={() => onDelete(row)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              ) : null}
            </div>
          ) : null}
        </div>
      ))}
    </div>
  );
}

function formatCell(value: unknown): React.ReactNode {
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  if (typeof value === "boolean") {
    return (
      <Badge variant={value ? "default" : "secondary"} className="text-[10px]">
        {value ? "Yes" : "No"}
      </Badge>
    );
  }
  if (Array.isArray(value)) {
    return value.join(", ") || "—";
  }
  return String(value);
}
