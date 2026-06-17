"use client";

import { Search, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export type AdminFilterControl = {
  key: string;
  value: string;
  options: { value: string; label: string }[];
  placeholder?: string;
  allLabel?: string;
  width?: string;
};

type AdminFilterBarProps = {
  search?: string;
  onSearchChange?: (value: string) => void;
  searchPlaceholder?: string;
  filters?: AdminFilterControl[];
  onFilterChange?: (key: string, value: string) => void;
  total: number;
  page: number;
  pageSize: number;
  resultNoun?: string;
};

export default function AdminFilterBar({
  search,
  onSearchChange,
  searchPlaceholder = "Search...",
  filters = [],
  onFilterChange,
  total,
  page,
  pageSize,
  resultNoun = "records",
}: AdminFilterBarProps) {
  const hasSearch = typeof onSearchChange === "function";
  const activeFilters = filters.filter((f) => f.value && f.value !== "all");
  const isFiltering = Boolean(search?.trim()) || activeFilters.length > 0;

  const rangeStart = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const rangeEnd = Math.min(page * pageSize, total);

  const clearAll = () => {
    if (hasSearch) onSearchChange?.("");
    if (onFilterChange) {
      for (const filter of filters) onFilterChange(filter.key, "all");
    }
  };

  return (
    <div className="mb-6 space-y-3">
      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3">
        {hasSearch ? (
          <div className="relative flex-1 min-w-[200px]">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder={searchPlaceholder}
              value={search ?? ""}
              onChange={(e) => onSearchChange?.(e.target.value)}
              className="rounded-xl pl-9"
            />
          </div>
        ) : null}

        {filters.map((filter) => (
          <Select
            key={filter.key}
            value={filter.value || "all"}
            onValueChange={(value) => onFilterChange?.(filter.key, value)}
          >
            <SelectTrigger className={`rounded-xl ${filter.width ?? "w-full sm:w-44"}`}>
              <SelectValue placeholder={filter.placeholder ?? filter.allLabel ?? "All"} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{filter.allLabel ?? "All"}</SelectItem>
              {filter.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        ))}

        {isFiltering ? (
          <Button
            type="button"
            variant="ghost"
            className="rounded-xl gap-1 text-muted-foreground"
            onClick={clearAll}
          >
            <X className="w-4 h-4" />
            Clear
          </Button>
        ) : null}
      </div>

      <p className="text-xs text-muted-foreground">
        {total === 0
          ? `No ${resultNoun} found`
          : `Showing ${rangeStart}–${rangeEnd} of ${total} ${resultNoun}`}
      </p>
    </div>
  );
}
