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
  ExternalLink,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  CalendarDays,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AdminRecordEditDialog } from "@/components/admin/AdminRecordDialogs";
import { adminGet, adminUpdate, adminDelete, adminUpdateProfileRole } from "@/lib/admin/actions";
import { getAdminKycSignedUrl } from "@/lib/admin/kyc-actions";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import { useToast } from "@/components/ui/use-toast";
import { USER_FIELDS, USER_ROLES } from "@/components/pages/admin/user-fields";

const ROLE_VARIANTS: Record<string, string> = {
  admin: "bg-destructive/10 text-destructive ring-destructive/20",
  host: "bg-info/10 text-info ring-info/20",
  vet: "bg-success/10 text-success ring-success/20",
  user: "bg-muted text-muted-foreground ring-border",
};

function Pill({ label, className }: { label: string; className: string }) {
  return (
    <span className={`text-xs font-medium px-2.5 py-1 rounded-full capitalize ring-1 ring-inset ${className}`}>
      {label}
    </span>
  );
}

function fmtDate(value: unknown): string {
  if (!value) return "—";
  const d = new Date(String(value));
  return Number.isNaN(d.getTime()) ? String(value) : d.toLocaleDateString();
}

export default function AdminUserDetail({ userId }: { userId: string }) {
  const router = useRouter();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [updatingRole, setUpdatingRole] = useState(false);
  const [loadingKyc, setLoadingKyc] = useState(false);

  const { data: user, isLoading } = useQuery({
    queryKey: ["admin-user", userId],
    queryFn: async () => {
      const result = await adminGet(ADMIN_TABLES.profiles, userId);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-user", userId] });
    queryClient.invalidateQueries({ queryKey: ["admin-users"] });
  };

  const handleRoleChange = async (role: string) => {
    setUpdatingRole(true);
    const result = await adminUpdateProfileRole(userId, role);
    if (result.ok === false) {
      toast({ title: "Role update failed", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Role updated" });
      refresh();
    }
    setUpdatingRole(false);
  };

  const handleEditSave = async (id: string, payload: Row) => {
    const result = await adminUpdate(ADMIN_TABLES.profiles, id, payload, ["/admin/users", `/admin/users/${userId}`]);
    if (result.ok === false) {
      toast({ title: "Save failed", description: result.error, variant: "destructive" });
      return false;
    }
    refresh();
    toast({ title: "Profile updated" });
    return true;
  };

  const handleDelete = async () => {
    if (!confirm(`Delete profile for ${user?.email ?? "this user"}?`)) return;
    const result = await adminDelete(ADMIN_TABLES.profiles, userId, ["/admin/users"]);
    if (result.ok === false) {
      toast({ title: "Delete failed", description: result.error, variant: "destructive" });
      return;
    }
    toast({ title: "Deleted" });
    router.push("/admin/users");
  };

  const handleViewKyc = async () => {
    const path = String(user?.id_document_path ?? "").trim();
    if (!path) {
      toast({ title: "No ID document on file", variant: "destructive" });
      return;
    }
    setLoadingKyc(true);
    try {
      const result = await getAdminKycSignedUrl(path);
      if (result.ok === false) {
        toast({ title: "Could not open document", description: result.error, variant: "destructive" });
        return;
      }
      window.open(result.data, "_blank", "noopener,noreferrer");
    } finally {
      setLoadingKyc(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="py-16 text-center text-sm text-muted-foreground">
        User not found.{" "}
        <Link href="/admin/users" className="text-primary underline">
          Back to Users
        </Link>
      </div>
    );
  }

  const role = String(user.role ?? "user");
  const completed = Boolean(user.profile_completed_at);
  const name = String(user.full_name ?? user.email ?? "User");

  return (
    <div className="pb-12 max-w-5xl mx-auto">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
      >
        <ArrowLeft className="w-4 h-4" /> Users
      </Link>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div className="flex items-center gap-4 min-w-0">
          {user.avatar_url ? (
            <img src={String(user.avatar_url)} alt={name} className="w-14 h-14 rounded-full object-cover shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
              <UserIcon className="w-7 h-7 text-primary" />
            </div>
          )}
          <div className="min-w-0">
            <h1 className="font-heading text-2xl font-bold text-foreground truncate">{name}</h1>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              <Pill label={role} className={ROLE_VARIANTS[role] ?? ROLE_VARIANTS.user} />
              <Pill
                label={completed ? "Profile complete" : "Profile incomplete"}
                className={completed ? "bg-success/10 text-success ring-success/20" : "bg-muted text-muted-foreground ring-border"}
              />
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Select value={role} onValueChange={handleRoleChange} disabled={updatingRole}>
            <SelectTrigger className="w-28 h-9 rounded-xl text-sm capitalize">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {USER_ROLES.map((r) => (
                <SelectItem key={r} value={r} className="capitalize">
                  {r}
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
            aria-label="Delete profile"
          >
            <Trash2 className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 space-y-6">
          <div className="rounded-2xl border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-heading text-sm font-semibold text-foreground">Profile</h2>
            </div>
            <div className="px-5 py-4 grid grid-cols-2 gap-x-8 gap-y-5">
              <Fact icon={Mail} label="Email" value={user.email} />
              <Fact icon={Phone} label="Phone" value={user.phone} />
              <Fact icon={MapPin} label="City" value={user.city} />
              <Fact icon={CalendarDays} label="Date of birth" value={fmtDate(user.date_of_birth)} />
              <Fact icon={CalendarDays} label="Joined" value={fmtDate(user.created_at)} />
              <Fact icon={CalendarDays} label="Profile completed" value={fmtDate(user.profile_completed_at)} />
            </div>
          </div>
        </div>

        <div className="lg:col-span-2">
          <div className="rounded-2xl border border-border bg-card">
            <div className="px-5 py-4 border-b border-border">
              <h2 className="font-heading text-sm font-semibold text-foreground">Identity (KYC)</h2>
            </div>
            <div className="px-5 py-4 space-y-5">
              <Fact icon={ShieldCheck} label="ID type" value={user.id_type} />
              <Fact icon={ShieldCheck} label="ID number" value={user.id_number} />
              {user.id_document_path ? (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="rounded-xl w-full"
                  disabled={loadingKyc}
                  onClick={() => void handleViewKyc()}
                >
                  {loadingKyc ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <ExternalLink className="mr-2 h-4 w-4" />
                  )}
                  View ID document
                </Button>
              ) : (
                <p className="text-xs text-muted-foreground">No ID document on file.</p>
              )}
            </div>
          </div>
        </div>
      </div>

      <AdminRecordEditDialog
        row={editing ? user : null}
        title="Edit User Profile"
        fields={USER_FIELDS}
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
