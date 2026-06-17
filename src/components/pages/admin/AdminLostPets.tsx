"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, Pencil, Trash2, PawPrint } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminRecordEditDialog } from "@/components/admin/AdminRecordDialogs";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import { LOST_PET_FIELDS, LOST_PET_STATUSES } from "@/components/pages/admin/lost-pet-fields";

const STATUSES = LOST_PET_STATUSES;
const FIELDS = LOST_PET_FIELDS;

const STATUS_GROUPS: { value: string; label: string }[] = [
  { value: "lost", label: "Lost" },
  { value: "found", label: "Found" },
  { value: "reunited", label: "Reunited" },
];

const STATUS_BADGE: Record<string, "success" | "warning" | "destructive" | "secondary"> = {
  lost: "destructive",
  found: "warning",
  reunited: "success",
};

function cap(value: unknown): string {
  const s = String(value ?? "").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

export default function AdminLostPets() {
  const router = useRouter();
  const { data: reports = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.lost_pets,
    "admin-lost-pets"
  );
  const [editingReport, setEditingReport] = useState<Row | null>(null);

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Report updated");

  const groups = useMemo(() => {
    const known = new Set(STATUS_GROUPS.map((g) => g.value));
    const base = STATUS_GROUPS.map((g) => ({
      ...g,
      rows: reports.filter((r) => String(r.status ?? "lost") === g.value),
    }));
    const otherRows = reports.filter((r) => !known.has(String(r.status ?? "lost")));
    if (otherRows.length > 0) base.push({ value: "other", label: "Other", rows: otherRows });
    return base.filter((g) => g.rows.length > 0);
  }, [reports]);

  const lostCount = reports.filter((r) => String(r.status ?? "lost") === "lost").length;
  const reunitedCount = reports.filter((r) => String(r.status ?? "") === "reunited").length;

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Lost Pets"
        description={`${lostCount} lost · ${reunitedCount} reunited`}
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : reports.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
          No lost pet reports yet.
        </div>
      ) : (
        <div className="space-y-8">
          {groups.map((group) => (
            <section key={group.value}>
              <h2 className="font-heading text-lg font-bold text-foreground mb-4">
                {group.label} ({group.rows.length})
              </h2>
              <div className="space-y-3">
                {group.rows.map((report) => (
                  <LostPetRow
                    key={String(report.id)}
                    report={report}
                    onView={() => router.push(`/admin/lost-pets/${report.id}`)}
                    onEdit={() => setEditingReport(report)}
                    onStatus={(v) => updateRow(String(report.id), { status: v }, "Status updated")}
                    onDelete={() => deleteRow(String(report.id), `Delete report for ${report.pet_name}?`)}
                  />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}

      <AdminRecordEditDialog
        row={editingReport}
        title="Edit Lost Pet Report"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingReport(null)}
      />
    </div>
  );
}

function LostPetRow({
  report,
  onView,
  onEdit,
  onStatus,
  onDelete,
}: {
  report: Row;
  onView: () => void;
  onEdit: () => void;
  onStatus: (value: string) => void;
  onDelete: () => void;
}) {
  const status = String(report.status ?? "lost");
  const contact = [report.contact_name, report.contact_phone].filter(Boolean).map(String).join(" · ");

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      {report.image_url ? (
        <img src={String(report.image_url)} alt={String(report.pet_name)} className="w-12 h-12 rounded-xl object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
          <PawPrint className="w-6 h-6 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2 flex-wrap">
          {String(report.pet_name ?? "Unnamed")}
          {report.species ? <Badge variant="outline" className="text-[10px] capitalize">{String(report.species)}</Badge> : null}
          <Badge variant={STATUS_BADGE[status] ?? "secondary"} className="text-[10px] capitalize">
            {status}
          </Badge>
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {cap(report.last_seen_location) || "Location unknown"}
        </p>
        <p className="text-xs text-muted-foreground truncate">{contact || "No contact details"}</p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Select value={status} onValueChange={onStatus}>
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
        <button type="button" onClick={onView} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="View report">
          <Eye className="w-5 h-5" />
        </button>
        <button type="button" onClick={onEdit} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="Edit report">
          <Pencil className="w-5 h-5" />
        </button>
        <button type="button" onClick={onDelete} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Delete report">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
