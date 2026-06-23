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
import { Search, SlidersHorizontal, X, Star, RotateCcw } from "lucide-react";
import { UAE_CITIES } from "@/lib/partners/partner-types";
import { NON_VET_PARTNER_TYPES } from "@/lib/partners/queries";

const CITIES = UAE_CITIES.filter((c) => c !== "Other");
const BUSINESS_TYPES = NON_VET_PARTNER_TYPES.map((t) => t.label);
const CITY_OPTIONS = [
  { value: "all", label: "All Cities" },
  ...CITIES.map((c) => ({ value: c, label: c })),
];
const BUSINESS_TYPE_OPTIONS = [
  { value: "all", label: "All Types" },
  ...BUSINESS_TYPES.map((t) => ({ value: t, label: t })),
];

const SORT_OPTIONS = [
  { value: "rating_desc", label: "Highest Rated" },
  { value: "name_asc", label: "Name A–Z" },
  { value: "city_asc", label: "City: A–Z" },
];

export type PartnerFiltersState = {
  search: string;
  city: string;
  businessType: string;
  minRating: number;
  sortBy: string;
};

export const DEFAULT_PARTNER_FILTERS: PartnerFiltersState = {
  search: "",
  city: "all",
  businessType: "all",
  minRating: 0,
  sortBy: "rating_desc",
};

type PartnerRow = {
  name?: string;
  city?: string;
  business_type?: string;
  rating?: number;
};

export function applyPartnerFilters<T extends PartnerRow>(
  partners: T[],
  filters: PartnerFiltersState
): T[] {
  let result = [...partners];
  if (filters.city !== "all") result = result.filter((p) => p.city === filters.city);
  if (filters.businessType !== "all")
    result = result.filter((p) => p.business_type === filters.businessType);
  if (filters.minRating > 0)
    result = result.filter((p) => (p.rating || 0) >= filters.minRating);
  if (filters.search) {
    const q = filters.search.toLowerCase();
    result = result.filter(
      (p) =>
        p.name?.toLowerCase().includes(q) ||
        p.city?.toLowerCase().includes(q) ||
        p.business_type?.toLowerCase().includes(q)
    );
  }
  if (filters.sortBy === "rating_desc")
    result.sort((a, b) => (b.rating || 0) - (a.rating || 0));
  if (filters.sortBy === "name_asc")
    result.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
  if (filters.sortBy === "city_asc")
    result.sort((a, b) => (a.city || "").localeCompare(b.city || ""));
  return result;
}

function countActiveFilters(f: PartnerFiltersState) {
  let n = 0;
  if (f.city !== "all") n++;
  if (f.businessType !== "all") n++;
  if (f.minRating > 0) n++;
  return n;
}

export default function PartnerFilters({
  filters,
  onChange,
}: {
  filters: PartnerFiltersState;
  onChange: (next: PartnerFiltersState) => void;
}) {
  const [open, setOpen] = useState(false);
  const active = countActiveFilters(filters);

  const set = <K extends keyof PartnerFiltersState>(
    key: K,
    val: PartnerFiltersState[K]
  ) => onChange({ ...filters, [key]: val });

  return (
    <div className="space-y-3 mb-8">
      <div className="flex gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search partners by name, city, or type..."
            value={filters.search}
            onChange={(e) => set("search", e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        <Select items={SORT_OPTIONS} value={filters.sortBy} onValueChange={(v) => set("sortBy", v)}>
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
        <div className="bg-card border border-border rounded-2xl p-5 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              Business Type
            </Label>
            <Select
              items={BUSINESS_TYPE_OPTIONS}
              value={filters.businessType}
              onValueChange={(v) => set("businessType", v)}
            >
              <SelectTrigger className="rounded-xl">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {BUSINESS_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              City
            </Label>
            <Select items={CITY_OPTIONS} value={filters.city} onValueChange={(v) => set("city", v)}>
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

          <div>
            <Label className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2 block">
              Minimum Rating
            </Label>
            <div className="flex gap-1 flex-wrap">
              {[0, 3, 3.5, 4, 4.5].map((r) => (
                <button
                  key={r}
                  onClick={() => set("minRating", r)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs border transition-all ${
                    filters.minRating === r
                      ? "bg-primary text-primary-foreground border-primary"
                      : "border-border text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {r === 0 ? (
                    "Any"
                  ) : (
                    <>
                      <Star className="w-3 h-3 fill-current" />
                      {r}+
                    </>
                  )}
                </button>
              ))}
            </div>
          </div>

          {active > 0 && (
            <div className="sm:col-span-2 lg:col-span-3 flex justify-end pt-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onChange(DEFAULT_PARTNER_FILTERS)}
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
          {filters.businessType !== "all" && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => set("businessType", "all")}
            >
              {filters.businessType}
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
          {filters.minRating > 0 && (
            <Badge
              variant="secondary"
              className="gap-1 cursor-pointer"
              onClick={() => set("minRating", 0)}
            >
              <Star className="w-3 h-3 fill-rating text-rating" />
              {filters.minRating}+<X className="w-3 h-3" />
            </Badge>
          )}
        </div>
      )}
    </div>
  );
}
