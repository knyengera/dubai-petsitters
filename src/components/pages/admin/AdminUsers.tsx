"use client";

import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import { adminUpdateProfileRole } from "@/lib/admin/actions";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";

const ROLES = ["user", "admin", "host", "vet"] as const;

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users = [], isLoading, deleteRow } = useAdminList(
    ADMIN_TABLES.profiles,
    "admin-users"
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleRoleChange = async (user: Row, role: string) => {
    setUpdatingId(String(user.id));
    const result = await adminUpdateProfileRole(String(user.id), role);
    if (result.ok === false) {
      toast({ title: "Role update failed", description: result.error, variant: "destructive" });
    } else {
      toast({ title: "Role updated" });
      queryClient.invalidateQueries({ queryKey: ["admin-users"] });
    }
    setUpdatingId(null);
  };

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Users"
        description="Manage platform user profiles and roles."
      />
      <AdminDataList
        rows={users}
        isLoading={isLoading}
        emptyMessage="No user profiles found."
        columns={[
          { key: "full_name", label: "Name" },
          { key: "email", label: "Email" },
          {
            key: "role",
            label: "Role",
            render: (row) => (
              <Badge variant="secondary" className="capitalize text-[10px]">
                {String(row.role ?? "user")}
              </Badge>
            ),
          },
          {
            key: "created_at",
            label: "Joined",
            render: (row) =>
              row.created_at
                ? new Date(String(row.created_at)).toLocaleDateString()
                : "—",
          },
        ]}
        rowActions={(row) => (
          <Select
            value={String(row.role ?? "user")}
            onValueChange={(v) => handleRoleChange(row, v)}
            disabled={updatingId === String(row.id)}
          >
            <SelectTrigger className="w-28 h-8 rounded-lg text-xs">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {ROLES.map((r) => (
                <SelectItem key={r} value={r} className="capitalize">
                  {r}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        onDelete={(row) => deleteRow(String(row.id), `Delete profile for ${row.email}?`)}
      />
    </div>
  );
}
