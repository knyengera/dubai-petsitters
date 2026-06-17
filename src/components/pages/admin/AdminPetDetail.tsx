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
  Inbox,
  PawPrint,
  MapPin,
  User,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminRecordEditDialog } from "@/components/admin/AdminRecordDialogs";
import { adminGet, adminUpdate, adminDelete, adminList } from "@/lib/admin/actions";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import { useToast } from "@/components/ui/use-toast";
import StartChatButton from "@/components/messaging/StartChatButton";
import { PET_FIELDS, PET_STATUSES } from "@/components/pages/admin/pet-fields";

const STATUS_VARIANTS: Record<string, string> = {
  available: "bg-success/10 text-success ring-success/20",
  pending_review: "bg-warning/10 text-warning ring-warning/20",
  pending: "bg-info/10 text-info ring-info/20",
  adopted: "bg-muted text-muted-foreground ring-border",
  approved: "bg-success/10 text-success ring-success/20",
  rejected: "bg-destructive/10 text-destructive ring-destructive/20",
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
  const meta = [cap(pet.species), cap(pet.breed), pet.age ? String(pet.age) : "", cap(pet.gender), cap(pet.size)]
    .filter(Boolean)
    .join(" · ");
  const pendingCount = requests.filter((r) => String(r.status ?? "pending") === "pending").length;

  return (
    <div className="pb-12 max-w-5xl mx-auto">
      <Link
        href="/admin/pets"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Adoption Pets
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 min-w-0">
          <h1 className="font-heading text-2xl font-bold text-foreground truncate">{String(pet.name)}</h1>
          <StatusPill status={status} />
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select value={status} onValueChange={updateStatus}>
            <SelectTrigger className="w-36 h-9 rounded-xl text-sm">
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
          <Button variant="outline" className="rounded-xl gap-2" onClick={() => setEditing(true)}>
            <Pencil className="w-4 h-4" /> Edit
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="rounded-xl text-destructive hover:text-destructive hover:bg-destructive/10"
            onClick={handleDelete}
            aria-label="Delete pet"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Media + meta */}
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            {pet.image_url ? (
              <img
                src={String(pet.image_url)}
                alt={String(pet.name)}
                className="w-full max-h-[460px] object-contain bg-muted/40"
              />
            ) : (
              <div className="w-full aspect-[4/3] flex items-center justify-center bg-muted">
                <PawPrint className="w-14 h-14 text-muted-foreground" />
              </div>
            )}
          </div>

          {meta ? <p className="text-sm text-muted-foreground -mt-2 px-1">{meta}</p> : null}

          {pet.description ? (
            <div className="px-1">
              <h2 className="font-heading text-sm font-semibold text-foreground mb-2">About</h2>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-wrap">
                {String(pet.description)}
              </p>
            </div>
          ) : null}

          <div className="px-1 grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-5">
            <Fact icon={MapPin} label="Location" value={pet.location} />
            <Fact icon={User} label="Listed by" value={pet.created_by} />
            <Fact icon={ShieldCheck} label="Vaccinated" value={pet.vaccinated ? "Yes" : "No"} />
            <Fact icon={ShieldCheck} label="Neutered" value={pet.neutered ? "Yes" : "No"} />
            <Fact label="Breed" value={pet.breed} />
            <Fact label="Age" value={pet.age} />
          </div>
        </div>

        {/* Requests */}
        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card">
            <div className="flex items-center justify-between px-5 py-4 border-b border-border">
              <h2 className="font-heading text-sm font-semibold text-foreground">Adoption Requests</h2>
              <span className="text-xs text-muted-foreground">
                {requests.length} total{pendingCount ? ` · ${pendingCount} pending` : ""}
              </span>
            </div>
            {requests.length === 0 ? (
              <div className="flex flex-col items-center justify-center text-center gap-2 py-12 px-5">
                <Inbox className="w-8 h-8 text-muted-foreground" />
                <p className="text-sm text-muted-foreground">No adoption requests yet.</p>
              </div>
            ) : (
              <div className="divide-y divide-border">
                {requests.map((req) => (
                  <div key={String(req.id)} className="px-5 py-4">
                    <div className="flex items-center justify-between gap-2">
                      <p className="font-medium text-sm text-foreground truncate">
                        {String(req.applicant_name ?? "Applicant")}
                      </p>
                      <StatusPill status={String(req.status ?? "pending")} />
                    </div>
                    <p className="text-xs text-muted-foreground truncate mt-0.5">
                      {String(req.applicant_email ?? "")}
                    </p>
                    {req.message ? (
                      <p className="text-xs text-muted-foreground mt-2 line-clamp-2 italic">
                        &ldquo;{String(req.message)}&rdquo;
                      </p>
                    ) : null}
                    <div className="mt-3 flex items-center gap-2">
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

          {status === "pending_review" ? (
            <div className="mt-4 rounded-2xl border border-warning/30 bg-warning/5 p-4">
              <p className="text-xs text-muted-foreground">
                This listing was submitted by a user. Set the status to <strong>available</strong> to publish it.
              </p>
            </div>
          ) : null}
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
