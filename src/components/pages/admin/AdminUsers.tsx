"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, Eye, Pencil, Trash2, User as UserIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminFilterBar from "@/components/admin/AdminFilterBar";
import AdminPagination from "@/components/admin/AdminPagination";
import { AdminRecordEditDialog } from "@/components/admin/AdminRecordDialogs";
import { useAdminPaginatedList } from "@/components/admin/useAdminPaginatedList";
import { getAdminListConfig } from "@/lib/admin/list-config";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import { adminUpdateProfileRole } from "@/lib/admin/actions";
import { useToast } from "@/components/ui/use-toast";
import { USER_FIELDS, USER_ROLES } from "@/components/pages/admin/user-fields";

const LIST_CONFIG = getAdminListConfig(ADMIN_TABLES.profiles);

const ROLE_BADGE: Record<string, "destructive" | "secondary" | "outline"> = {
  admin: "destructive",
  host: "outline",
  vet: "outline",
  user: "secondary",
};

export default function AdminUsers() {
  const { toast } = useToast();
  const router = useRouter();
  const {
    rows: users,
    total,
    page,
    pageSize,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    isLoading,
    updateRow,
    deleteRow,
    invalidate,
  } = useAdminPaginatedList(ADMIN_TABLES.profiles, "admin-users");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<Row | null>(null);

  const handleRoleChange = async (user: Row, role: string) => {
    setUpdatingId(String(user.id));
    const result = await adminUpdateProfileRole(String(user.id), role);
    if (result.ok === false) {
      toast({ title: "Role update failed", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Role updated" });
      invalidate();
    }
    setUpdatingId(null);
  };

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Profile updated");

  return (
    <div className="pb-10">
      <AdminPageHeader title="Users" description={`${total} profiles`} />

      <AdminFilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search by name, email, or city..."
        filters={(LIST_CONFIG.filters ?? []).map((f) => ({
          key: f.key,
          value: filters[f.key] ?? "all",
          options: f.options,
          allLabel: `All ${f.label.toLowerCase()}s`,
        }))}
        onFilterChange={setFilter}
        total={total}
        page={page}
        pageSize={pageSize}
        resultNoun="profiles"
      />

      {isLoading ? (
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-16 text-sm text-muted-foreground border border-dashed border-border rounded-2xl">
          No user profiles found.
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user) => (
            <UserRow
              key={String(user.id)}
              user={user}
              updating={updatingId === String(user.id)}
              onView={() => router.push(`/admin/users/${user.id}`)}
              onEdit={() => setEditingUser(user)}
              onRole={(v) => handleRoleChange(user, v)}
              onDelete={() => deleteRow(String(user.id), `Delete profile for ${user.email}?`)}
            />
          ))}
        </div>
      )}

      <AdminPagination page={page} total={total} pageSize={pageSize} onPageChange={setPage} />

      <AdminRecordEditDialog
        row={editingUser}
        title="Edit User Profile"
        fields={USER_FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingUser(null)}
      />
    </div>
  );
}

function UserRow({
  user,
  updating,
  onView,
  onEdit,
  onRole,
  onDelete,
}: {
  user: Row;
  updating: boolean;
  onView: () => void;
  onEdit: () => void;
  onRole: (value: string) => void;
  onDelete: () => void;
}) {
  const role = String(user.role ?? "user");
  const completed = Boolean(user.profile_completed_at);
  const name = String(user.full_name ?? user.email ?? "User");
  const joined = user.created_at ? new Date(String(user.created_at)).toLocaleDateString() : "—";

  return (
    <div className="bg-card border border-border rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center gap-4">
      {user.avatar_url ? (
        <img src={String(user.avatar_url)} alt={name} className="w-12 h-12 rounded-full object-cover shrink-0" />
      ) : (
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
          <UserIcon className="w-6 h-6 text-primary" />
        </div>
      )}
      <div className="flex-1 min-w-0">
        <p className="font-semibold text-foreground text-sm flex items-center gap-2 flex-wrap">
          {name}
          <Badge variant={ROLE_BADGE[role] ?? "secondary"} className="text-[10px] capitalize">
            {role}
          </Badge>
          <Badge variant={completed ? "success" : "secondary"} className="text-[10px]">
            {completed ? "Complete" : "Incomplete"}
          </Badge>
        </p>
        <p className="text-xs text-muted-foreground truncate">{String(user.email ?? "—")}</p>
        <p className="text-xs text-muted-foreground truncate">
          {[user.city ? String(user.city) : "", `Joined ${joined}`].filter(Boolean).join(" · ")}
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 shrink-0">
        <Select value={role} onValueChange={onRole} disabled={updating}>
          <SelectTrigger className="w-28 h-8 rounded-lg text-xs capitalize">
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
        <button type="button" onClick={onView} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="View user">
          <Eye className="w-5 h-5" />
        </button>
        <button type="button" onClick={onEdit} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-primary/10" aria-label="Edit user">
          <Pencil className="w-5 h-5" />
        </button>
        <button type="button" onClick={onDelete} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10" aria-label="Delete user">
          <Trash2 className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}
