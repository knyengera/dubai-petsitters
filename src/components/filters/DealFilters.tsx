"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, SlidersHorizontal, X, RotateCcw } from "lucide-react";
import { SAUDI_CITIES } from "@/lib/partners/partner-types";

const CITIES = SAUDI_CITIES.filter((c) => c !== "Other");

const CATEGORY_OPTIONS = [
  { value: "vet_clinic", label: "Vet Clinic" },
  { value: "pet_shop", label: "Pet Shop" },
  { value: "grooming", label: "Grooming" },
  { value: "insurance", label: "Insurance" },
  { value: "food", label: "Food" },
  { value: "other", label: "Other" },
];

const CATEGORY_LABELS: Record<string, string> = Object.fromEntries(
  CATEGORY_OPTIONS.map((o) => [o.value, o.label])
);

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "partner_asc", label: "Partner A–Z" },
  { value: "title_asc", label: "Title A–Z" },
];

export type DealFiltersState = {
  search: string;
  category: string;
  city: string;
  sortBy: string;
};

export const DEFAULT_DEAL_FILTERS: DealFiltersState = {
  search: "",
  category: "all",
  city: "all",
  sortBy: "newest",
};

type DealRow = {
  title?: string;
  description?: string;
  partner_name?: string;
  partner_type?: string;
  discount_code?: string;
  city?: string;
};

export function applyDealFilters<T extends DealRow>(
  deals: T[],
  filters: DealFiltersState
): T[] {
  let result = [...deals];
  if (filters.category !== "all")
    result = result.filter((d) => d.partner_type === filters.category);
  if (filters.city !== "all") result = result.filter((d) => d.city === filters.city);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (d) =>
        d.title?.toLowerCase().includes(q) ||
        d.partner_name?.toLowerCase().includes(q) ||
        d.description?.toLowerCase().includes(q) ||
        d.discount_code?.toLowerCase().includes(q)
    );
  }
  if (filters.sortBy === "partner_asc")
    result.sort((a, b) => (a.partner_name || "").localeCompare(b.partner_name || ""));
  if (filters.sortBy === "title_asc")
    result.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  return result;
}

function countActiveFilters(f: DealFiltersState) {
  let n = 0;
  if (f.category !== "all") n++;
  if (f.city !== "all") n++;
  return n;
}

export default function DealFilters({
  filters,
  onChange,
}: {
  filters: DealFiltersState;
  onChange: (next: DealFiltersState) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(filters);

  const set = <K extends keyof DealFiltersState>(
    key: K,
    val: DealFiltersState[K]
  ) => onChange({ ...filters, [key]: val });

  return (
    <div className="space-y-3 mb-8">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search deals by title, partner, or code..."
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select value={filters.sortBy} onValueChange={(v) => set("sortBy", v)}>
          <SelectTrigger className="w-48 rounded-xl shrink-0">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORT_OPTIONS.map((o) => (
              <SelectItem key={o.value} value={o.value}>
                {o.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Button
          variant={open ? "default" : "outline"}
          onClick={() => setOpen((v) => !v)}
          className="rounded-xl gap-2 shrink-0"
        >
          <SlidersHorizontal className="w-4 h-4" />
          Filters
          {active > 0 && (
            <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">
              {active}
            </Badge>
          )}
        </Button>
      </div>

      {open && (
        <div className="bg-card border border-border rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 gap-5">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              Category
            </Label>
            <Select value={filters.category} onValueChange={(v) => set("category", v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="All Categories" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {CATEGORY_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              City
            </Label>
            <Select value={filters.city} onValueChange={(v) => set("city", v)}>
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="All Cities" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Cities</SelectItem>
                {CITIES.map((c) => (
                  <SelectItem key={c} value={c}>
                    {c}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {active > 0 && (
            <div className="sm:col-span-2 flex justify-end pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(DEFAULT_DEAL_FILTERS)}
                className="gap-1 text-muted-foreground"
              >
                <RotateCcw className="w-3.5 h-3.5" /> Reset Filters
              </Button>
            </div>
          )}
        </div>
      )}

      {active > 0 && !open && (
        <div className="flex flex-wrap gap-2">
          {filters.category !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => set("category", "all")}
            >
              {CATEGORY_LABELS[filters.category] ?? filters.category}
              <X className="w-3 h-3" />
            </Badge>
          )}
          {filters.city !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => set("city", "all")}
            >
              {filters.city}
              <X className="w-3 h-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
