"use client";

import { useState } from "react";
import { ExternalLink, Loader2 } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import {
  AdminRecordEditDialog,
  AdminRecordViewDialog,
  type AdminRecordField,
} from "@/components/admin/AdminRecordDialogs";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES, type Row } from "@/lib/admin/tables";
import { adminUpdateProfileRole } from "@/lib/admin/actions";
import { getAdminKycSignedUrl } from "@/lib/admin/kyc-actions";
import { useToast } from "@/components/ui/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

const ROLES = ["user", "admin", "host", "vet"] as const;
const FIELDS: AdminRecordField[] = [
  { key: "full_name", label: "Full Name" },
  { key: "email", label: "Email" },
  { key: "role", label: "Role", viewOnly: true },
  { key: "city", label: "City" },
  { key: "date_of_birth", label: "Date of Birth" },
  { key: "id_type", label: "ID Type" },
  { key: "id_number", label: "ID Number" },
  { key: "id_document_path", label: "ID Document Path" },
  { key: "phone", label: "Phone" },
  { key: "profile_completed_at", label: "Profile Completed" },
  {
    key: "avatar_url",
    label: "Avatar",
    type: "image",
    hideInView: true,
    uploadCategory: "avatar",
    uploadBucket: "avatars",
  },
];

export default function AdminUsers() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: users = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.profiles,
    "admin-users"
  );
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [viewingUser, setViewingUser] = useState<Row | null>(null);
  const [editingUser, setEditingUser] = useState<Row | null>(null);
  const [loadingKycId, setLoadingKycId] = useState<string | null>(null);

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

  const handleEditSave = (id: string, payload: Row) =>
    updateRow(id, payload, "Profile updated");

  const handleViewKycDocument = async (user: Row) => {
    const path = String(user.id_document_path ?? "").trim();
    if (!path) {
      toast({ title: "No ID document on file", variant: "destructive" });
      return;
    }

    setLoadingKycId(String(user.id));
    try {
      const result = await getAdminKycSignedUrl(path);
      if (result.ok === false) {
        toast({ title: "Could not open document", description: result.error, variant: "destructive" });
        return;
      }
      window.open(result.data, "_blank", "noopener,noreferrer");
    } finally {
      setLoadingKycId(null);
    }
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
            key: "profile_completed_at",
            label: "Verified",
            render: (row) => (
              <Badge
                variant={row.profile_completed_at ? "default" : "secondary"}
                className="text-[10px]"
              >
                {row.profile_completed_at ? "Complete" : "Incomplete"}
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
        onView={setViewingUser}
        onEdit={setEditingUser}
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

      <AdminRecordViewDialog
        row={viewingUser}
        title="User Profile"
        titleKey="email"
        fields={FIELDS}
        imageKey="avatar_url"
        badges={(row) => (
          <>
            <Badge variant="secondary" className="capitalize text-[10px]">
              {String(row.role ?? "user")}
            </Badge>
            <Badge
              variant={row.profile_completed_at ? "default" : "secondary"}
              className="text-[10px]"
            >
              {row.profile_completed_at ? "Profile complete" : "Profile incomplete"}
            </Badge>
          </>
        )}
        actions={(row) =>
          row.id_document_path ? (
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl"
              disabled={loadingKycId === String(row.id)}
              onClick={() => void handleViewKycDocument(row)}
            >
              {loadingKycId === String(row.id) ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <ExternalLink className="mr-2 h-4 w-4" />
              )}
              View ID document
            </Button>
          ) : null
        }
        onOpenChange={(open) => !open && setViewingUser(null)}
      />
      <AdminRecordEditDialog
        row={editingUser}
        title="Edit User Profile"
        fields={FIELDS}
        onSave={handleEditSave}
        onOpenChange={(open) => !open && setEditingUser(null)}
      />
    </div>
  );
}
