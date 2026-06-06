"use client";

import { Star, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import AdminPageHeader from "@/components/admin/AdminPageHeader";
import AdminDataList from "@/components/admin/AdminDataList";
import { useAdminList } from "@/components/admin/useAdminList";
import { ADMIN_TABLES } from "@/lib/admin/tables";

export default function AdminHosts() {
  const { data: hosts = [], isLoading, updateRow, deleteRow } = useAdminList(
    ADMIN_TABLES.pet_hosts,
    "admin-hosts",
    "-rating"
  );

  return (
    <div className="pb-10">
      <AdminPageHeader
        title="Pet Hosts"
        description="Manage host listings, availability, and featured status."
      />
      <AdminDataList
        rows={hosts}
        isLoading={isLoading}
        columns={[
          { key: "full_name", label: "Name" },
          { key: "city", label: "City" },
          {
            key: "services",
            label: "Services",
            render: (row) =>
              Array.isArray(row.services) ? row.services.join(", ") : "—",
          },
          {
            key: "is_available",
            label: "Available",
            render: (row) => (row.is_available ? "Yes" : "No"),
          },
          {
            key: "is_featured",
            label: "Featured",
            render: (row) =>
              row.is_featured ? (
                <Badge className="text-[10px] bg-amber-500 text-white">Featured</Badge>
              ) : (
                "No"
              ),
          },
        ]}
        rowActions={(row) => (
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl gap-1"
              onClick={() =>
                updateRow(String(row.id), {
                  is_available: !row.is_available,
                })
              }
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {row.is_available ? "Disable" : "Enable"}
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="rounded-xl gap-1"
              onClick={() =>
                updateRow(String(row.id), { is_featured: !row.is_featured })
              }
            >
              <Star className="w-3.5 h-3.5" />
              {row.is_featured ? "Unfeature" : "Feature"}
            </Button>
          </>
        )}
        onDelete={(row) =>
          deleteRow(String(row.id), `Delete host ${row.full_name}?`)
        }
      />
    </div>
  );
}
