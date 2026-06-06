"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { adminList, adminUpdate, adminDelete, adminCreate } from "@/lib/admin/actions";
import type { AdminTable, Row } from "@/lib/admin/tables";
import { useToast } from "@/components/ui/use-toast";

export function useAdminList(table: AdminTable, queryKey: string, order = "-created_at") {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const query = useQuery({
    queryKey: [queryKey],
    queryFn: async () => {
      const result = await adminList(table, order);
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: [queryKey] });

  const updateRow = async (id: string, payload: Row, successMessage?: string) => {
    const result = await adminUpdate(table, id, payload);
    if (result.ok === false) {
      toast({ title: "Update failed", description: result.error, variant: "destructive" });
      return false;
    }
    invalidate();
    if (successMessage) toast({ title: successMessage });
    return true;
  };

  const deleteRow = async (id: string, confirmMessage?: string) => {
    if (confirmMessage && !confirm(confirmMessage)) return false;
    const result = await adminDelete(table, id);
    if (result.ok === false) {
      toast({ title: "Delete failed", description: result.error, variant: "destructive" });
      return false;
    }
    invalidate();
    toast({ title: "Deleted" });
    return true;
  };

  const createRow = async (payload: Row, successMessage?: string) => {
    const result = await adminCreate(table, payload);
    if (result.ok === false) {
      toast({ title: "Create failed", description: result.error, variant: "destructive" });
      return null;
    }
    invalidate();
    if (successMessage) toast({ title: successMessage });
    return result.data;
  };

  return { ...query, updateRow, deleteRow, createRow, invalidate };
}
