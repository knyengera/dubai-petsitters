"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  Loader2,
  Pencil,
  Trash2,
  PawPrint,
  MapPin,
  CalendarDays,
  User,
  Phone,
  Mail,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminRecordEditDialog } from "@/components/admin/AdminRecordDialogs";
import { adminGet, adminUpdate, adminDelete } from "@/lib/admin/actions";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import { useToast } from "@/components/ui/use-toast";
import { LOST_PET_FIELDS, LOST_PET_STATUSES } from "@/components/pages/admin/lost-pet-fields";
import { DEFAULT_CURRENCY } from "@/lib/monetisation/constants";

const STATUS_VARIANTS: Record<string, string> = {
  lost: "bg-destructive/10 text-destructive ring-destructive/20",
  found: "bg-warning/10 text-warning ring-warning/20",
  reunited: "bg-success/10 text-success ring-success/20",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span
      className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ring-1 ring-inset ${
        STATUS_VARIANTS[status] ?? "bg-muted text-muted-foreground ring-border"
      }`}
    >
      {status.replace("_", " ")}
    </span>
  );
}

function cap(value: unknown): string {
  const s = String(value ?? "").trim();
  return s ? s.charAt(0).toUpperCase() + s.slice(1) : "";
}

export default function AdminLostPetDetail({ reportId }: { reportId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: report, isLoading } = useQuery({
    queryKey: ["admin-lost-pet", reportId],
    queryFn: async () => {
      const result = await adminGet(ADMIN_TABLES.lost_pets, reportId);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-lost-pet", reportId] });
    queryClient.invalidateQueries({ queryKey: ["admin-lost-pets"] });
  };

  const updateStatus = async (status: string) => {
    const result = await adminUpdate(ADMIN_TABLES.lost_pets, reportId, { status }, [
      "/admin/lost-pets",
      `/admin/lost-pets/${reportId}`,
    ]);
    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }
    refresh();
    toast({ title: "Status updated" });
  };

  const handleEditSave = async (id: string, payload: Row) => {
    const result = await adminUpdate(ADMIN_TABLES.lost_pets, id, payload, [
      "/admin/lost-pets",
      `/admin/lost-pets/${reportId}`,
    ]);
    if (result.ok === false) {
      toast({ title: "Save failed", description: result.error, variant: "destructive" });
      return false;
    }
    refresh();
    toast({ title: "Report updated" });
    return true;
  };

  const handleDelete = async () => {
    if (!confirm(`Delete report for ${report?.pet_name ?? "this pet"}?`)) return;
    const result = await adminDelete(ADMIN_TABLES.lost_pets, reportId, ["/admin/lost-pets"]);
    if (result.ok === false) {
      toast({ title: "Delete failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Deleted" });
    router.push("/admin/lost-pets");
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Report not found.{" "}
        <Link href="/admin/lost-pets" className="text-primary underline">
          Back to Lost Pets
        </Link>
      </div>
    );
  }

  const status = String(report.status ?? "lost");
  const meta = [cap(report.species), cap(report.breed)].filter(Boolean).join(" · ");

  return (
    <div className="pb-12 max-w-5xl mx-auto">
      <Link
        href="/admin/lost-pets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Lost Pets
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-heading text-2xl font-bold text-foreground truncate">
            {String(report.pet_name ?? "Lost Pet Report")}
          </h1>
          <StatusPill status={status} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select value={status} onValueChange={updateStatus}>
            <SelectTrigger className="w-32 h-9 rounded-xl text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LOST_PET_STATUSES.map((s) => (
                <SelectItem key={s} value={s} className="capitalize">
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            aria-label="Delete report"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {report.image_url ? (
              <img
                src={String(report.image_url)}
                alt={String(report.pet_name)}
                className="w-full max-h-[460px] object-contain bg-muted/40"
              />
            ) : (
              <div className="w-full aspect-[4/3] flex items-center justify-center bg-muted">
                <PawPrint className="w-14 h-14 text-muted-foreground" />
              </div>
            )}
          </div>

          {meta ? <p className="text-sm text-muted-foreground -mt-2 px-1">{meta}</p> : null}

          {report.description ? (
            <div className="px-1">
              <h2 className="font-heading text-sm font-semibold text-foreground mb-2">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {String(report.description)}
              </p>
            </div>
          ) : null}

          <div className="px-1 grid grid-cols-2 gap-x-8 gap-y-5">
            <Fact icon={MapPin} label="Last seen location" value={report.last_seen_location} />
            <Fact icon={CalendarDays} label="Last seen date" value={report.last_seen_date} />
            <Fact
              label="Reward"
              value={
                report.reward_offered
                  ? `${DEFAULT_CURRENCY} ${report.reward_offered}`
                  : null
              }
            />
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-heading text-sm font-semibold text-foreground">Contact</h2>
            </div>
            <div className="px-5 py-4 space-y-5">
              <Fact icon={User} label="Name" value={report.owner_name} />
              <Fact icon={Phone} label="Phone" value={report.owner_phone} />
              <Fact icon={Mail} label="Email" value={report.owner_email} />
            </div>
          </div>
        </div>
      </div>

      <AdminRecordEditDialog
        row={editing ? report : null}
        title="Edit Lost Pet Report"
        fields={LOST_PET_FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditing(false)}
      />
    </div>
  );
}

function Fact({
  icon: Icon,
  label,
  value,
}: {
  icon?: React.ComponentType<{ className?: string }>;
  label: string;
  value: unknown;
}) {
  const display = value === null || value === undefined || String(value).trim() === "" ? "—" : String(value);
  return (
    <div>
      <p className="flex items-center gap-1.5 text-[11px] uppercase tracking-wide text-muted-foreground mb-1">
        {Icon ? <Icon className="w-3.5 h-3.5" /> : null}
        {label}
      </p>
      <p className="text-sm text-foreground break-words">{display}</p>
    </div>
  );
}
