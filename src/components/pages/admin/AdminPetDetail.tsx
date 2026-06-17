"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Pencil, Trash2, Inbox, PawPrint } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import { AdminRecordEditDialog } from "@/components/admin/AdminRecordDialogs";
import { adminGet, adminUpdate, adminDelete, adminList } from "@/lib/admin/actions";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import { useToast } from "@/components/ui/use-toast";
import StartChatButton from "@/components/messaging/StartChatButton";
import { PET_FIELDS, PET_STATUSES } from "@/components/pages/admin/pet-fields";

const STATUS_VARIANTS: Record<string, string> = {
  available: "bg-success/10 text-success",
  pending_review: "bg-warning/10 text-warning",
  pending: "bg-info/10 text-info",
  adopted: "bg-muted text-muted-foreground",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
};

function StatusPill({ status }: { status: string }) {
  return (
    <span className={`text-[11px] px-2 py-0.5 rounded-full capitalize ${STATUS_VARIANTS[status] ?? "bg-muted text-muted-foreground"}`}>
      {status.replace("_", " ")}
    </span>
  );
}

const DETAIL_FIELDS = PET_FIELDS.filter((f) => !f.hideInView);

export default function AdminPetDetail({ petId }: { petId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);

  const { data: pet, isLoading } = useQuery({
    queryKey: ["admin-pet", petId],
    queryFn: async () => {
      const result = await adminGet(ADMIN_TABLES.pets, petId);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const { data: requests = [] } = useQuery({
    queryKey: ["admin-pet-requests", petId],
    queryFn: async () => {
      const result = await adminList(ADMIN_TABLES.adoption_requests, "-created_at", 500);
      if (result.ok === false) throw new Error(result.error);
      return result.data.filter((r) => String(r.pet_id) === petId);
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-pet", petId] });
    queryClient.invalidateQueries({ queryKey: ["admin-pets"] });
  };

  const updateStatus = async (status: string) => {
    const result = await adminUpdate(ADMIN_TABLES.pets, petId, { status }, ["/admin/pets", `/admin/pets/${petId}`]);
    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return;
    }
    refresh();
    toast({ title: "Status updated" });
  };

  const handleEditSave = async (id: string, payload: Row) => {
    const result = await adminUpdate(ADMIN_TABLES.pets, id, payload, ["/admin/pets", `/admin/pets/${petId}`]);
    if (result.ok === false) {
      toast({ title: "Save failed", description: result.error, variant: "destructive" });
      return false;
    }
    refresh();
    toast({ title: "Pet updated" });
    return true;
  };

  const handleDelete = async () => {
    if (!confirm(`Delete ${pet?.name ?? "this pet"}?`)) return;
    const result = await adminDelete(ADMIN_TABLES.pets, petId, ["/admin/pets"]);
    if (result.ok === false) {
      toast({ title: "Delete failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Deleted" });
    router.push("/admin/pets");
  };

  const fieldRows = useMemo(
    () =>
      pet
        ? DETAIL_FIELDS.filter((f) => f.key !== "description" && f.key !== "status").map((f) => ({
            label: f.label,
            value: pet[f.key],
            type: f.type,
          }))
        : [],
    [pet]
  );

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!pet) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        Pet not found.{" "}
        <Link href="/admin/pets" className="text-primary underline">
          Back to Adoption Pets
        </Link>
      </div>
    );
  }

  const status = String(pet.status ?? "available");

  return (
    <div className="pb-10">
      <AdminPageHeader
        title={String(pet.name ?? "Adoption Pet")}
        description={String(pet.species ?? "")}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <Link href="/admin/pets">
              <Button variant="outline" className="rounded-xl gap-2">
                <ArrowLeft className="w-4 h-4" /> Back
              </Button>
            </Link>
            <Button variant="outline" className="rounded-xl gap-2" onClick={() => setEditing(true)}>
              <Pencil className="w-4 h-4" /> Edit
            </Button>
            <Button
              variant="ghost"
              className="rounded-xl gap-2 text-destructive hover:text-destructive"
              onClick={handleDelete}
            >
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        }
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-card border border-border rounded-2xl overflow-hidden">
            {pet.image_url ? (
              <div className="w-full bg-muted flex items-center justify-center">
                <img
                  src={String(pet.image_url)}
                  alt={String(pet.name)}
                  className="w-full max-h-[480px] object-contain"
                />
              </div>
            ) : (
              <div className="w-full h-64 flex items-center justify-center bg-muted">
                <PawPrint className="w-12 h-12 text-muted-foreground" />
              </div>
            )}
            <div className="p-5 space-y-4">
              <div className="flex items-center gap-3">
                <h2 className="font-heading text-xl font-bold text-foreground">{String(pet.name)}</h2>
                <StatusPill status={status} />
              </div>
              {pet.description ? (
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{String(pet.description)}</p>
              ) : null}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {fieldRows.map((row) => (
                  <div key={row.label} className="rounded-xl border border-border bg-muted/20 p-3">
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-1">{row.label}</p>
                    <div className="text-sm text-foreground break-words">{formatValue(row.value, row.type)}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-5">
          <div className="rounded-2xl border border-border bg-muted/20 p-4 space-y-3">
            <h3 className="font-heading font-semibold text-sm">Listing Status</h3>
            <Select value={status} onValueChange={updateStatus}>
              <SelectTrigger className="rounded-xl w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PET_STATUSES.map((s) => (
                  <SelectItem key={s} value={s} className="capitalize">
                    {s.replace("_", " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {status === "pending_review" ? (
              <p className="text-xs text-muted-foreground">
                This listing was submitted by a user. Set it to <strong>available</strong> to publish it.
              </p>
            ) : null}
          </div>

          <div className="rounded-2xl border border-border bg-card p-4">
            <h3 className="font-heading font-semibold text-sm mb-3">
              Adoption Requests
              <span className="ml-2 text-xs text-muted-foreground">({requests.length})</span>
            </h3>
            {requests.length === 0 ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
                <Inbox className="w-4 h-4" /> No requests yet.
              </div>
            ) : (
              <div className="space-y-3">
                {requests.map((req) => (
                  <div key={String(req.id)} className="rounded-xl border border-border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-foreground truncate">
                        {String(req.applicant_name ?? "Applicant")}
                      </p>
                      <StatusPill status={String(req.status ?? "pending")} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{String(req.applicant_email ?? "")}</p>
                    {req.message ? (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">&ldquo;{String(req.message)}&rdquo;</p>
                    ) : null}
                    <div className="mt-2 flex items-center gap-2">
                      <StartChatButton
                        contactId={String(req.id)}
                        contactName={String(req.applicant_name ?? "Applicant")}
                        contactType="adoption"
                        contactEmail={String(req.applicant_email ?? "")}
                        subject={`Adoption inquiry for ${String(pet.name)}`}
                        size="sm"
                      >
                        Message
                      </StartChatButton>
                      <Link href="/admin/adoption-requests">
                        <Button variant="ghost" size="sm" className="rounded-xl text-xs">
                          Review
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      <AdminRecordEditDialog
        row={editing ? pet : null}
        title="Edit Adoption Pet"
        fields={PET_FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditing(false)}
      />
    </div>
  );
}

function formatValue(value: unknown, type?: string): React.ReactNode {
  if (type === "checkbox") {
    return (
      <Badge variant={value ? "default" : "secondary"} className="text-[10px]">
        {value ? "Yes" : "No"}
      </Badge>
    );
  }
  if (value === null || value === undefined || value === "") {
    return <span className="text-muted-foreground">—</span>;
  }
  return String(value);
}
