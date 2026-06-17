"use client";

import { useState } from "react";
import { keepPreviousData, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  adminListPaginated,
  adminUpdate,
  adminDelete,
  adminCreate,
} from "@/lib/admin/actions";
import type { AdminTable, Row } from "@/lib/admin/tables";
import { ADMIN_PAGE_SIZE } from "@/lib/admin/list-config";
import { useToast } from "@/components/ui/use-toast";

type UseAdminPaginatedListOptions = {
  order?: string;
  pageSize?: number;
  initialFilters?: Record<string, string>;
};

export function useAdminPaginatedList(
  table: AdminTable,
  queryKey: string,
  options: UseAdminPaginatedListOptions = {}
) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const pageSize = options.pageSize ?? ADMIN_PAGE_SIZE;

  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState("");
  const [filters, setFiltersState] = useState<Record<string, string>>(
    options.initialFilters ?? {}
  );

  const query = useQuery({
    queryKey: [queryKey, page, search, filters, options.order ?? null, pageSize],
    queryFn: async () => {
      const result = await adminListPaginated(table, options.order, {
        page,
        pageSize,
        search,
        filters,
      });
      if (result.ok === false) throw new Error(result.error);
      return result.data;
    },
    placeholderData: keepPreviousData,
  });

  const setSearch = (value: string) => {
    setSearchState(value);
    setPage(1);
  };

  const setFilter = (key: string, value: string) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

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

  return {
    rows: query.data?.rows ?? [],
    total: query.data?.total ?? 0,
    page,
    pageSize,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    updateRow,
    deleteRow,
    createRow,
    invalidate,
  };
}

type PaginatedQueryParams = {
  page: number;
  pageSize: number;
  search: string;
  filters: Record<string, string>;
};

/**
 * Generic paginated query for admin lists backed by custom server actions
 * (forum, blog, monetisation) rather than the generic adminList table action.
 */
export function useAdminPaginatedQuery<T>(
  queryKey: unknown[],
  queryFn: (params: PaginatedQueryParams) => Promise<{ rows: T[]; total: number }>,
  options: { pageSize?: number; initialFilters?: Record<string, string> } = {}
) {
  const pageSize = options.pageSize ?? ADMIN_PAGE_SIZE;
  const [page, setPage] = useState(1);
  const [search, setSearchState] = useState("");
  const [filters, setFiltersState] = useState<Record<string, string>>(
    options.initialFilters ?? {}
  );

  const query = useQuery({
    queryKey: [...queryKey, page, search, filters, pageSize],
    queryFn: () => queryFn({ page, pageSize, search, filters }),
    placeholderData: keepPreviousData,
  });

  const setSearch = (value: string) => {
    setSearchState(value);
    setPage(1);
  };

  const setFilter = (key: string, value: string) => {
    setFiltersState((prev) => ({ ...prev, [key]: value }));
    setPage(1);
  };

  return {
    rows: query.data?.rows ?? [],
    total: query.data?.total ?? 0,
    page,
    pageSize,
    setPage,
    search,
    setSearch,
    filters,
    setFilter,
    isLoading: query.isLoading,
    isFetching: query.isFetching,
    refetch: query.refetch,
  };
}
