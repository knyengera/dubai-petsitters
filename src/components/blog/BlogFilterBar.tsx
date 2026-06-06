"use client";

import { Search, SlidersHorizontal, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BLOG_CATEGORIES } from "@/lib/blog/types";

export type BlogSortOption = "newest" | "oldest" | "title_asc" | "title_desc";

export type BlogFilters = {
  search: string;
  category: string;
  tag: string;
  author: string;
  sort: BlogSortOption;
};

type BlogFilterBarProps = {
  filters: BlogFilters;
  onChange: (filters: BlogFilters) => void;
  tags: string[];
  authors: string[];
  resultCount: number;
  totalCount: number;
};

const SORT_OPTIONS: { value: BlogSortOption; label: string }[] = [
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "title_asc", label: "Title A–Z" },
  { value: "title_desc", label: "Title Z–A" },
];

export function hasActiveFilters(filters: BlogFilters): boolean {
  return (
    filters.search.trim() !== "" ||
    filters.category !== "all" ||
    filters.tag !== "all" ||
    filters.author !== "all" ||
    filters.sort !== "newest"
  );
}

export default function BlogFilterBar({
  filters,
  onChange,
  tags,
  authors,
  resultCount,
  totalCount,
}: BlogFilterBarProps) {
  const update = (patch: Partial<BlogFilters>) => {
    onChange({ ...filters, ...patch });
  };

  const clearAll = () => {
    onChange({
      search: "",
      category: "all",
      tag: "all",
      author: "all",
      sort: "newest",
    });
  };

  const active = hasActiveFilters(filters);

  return (
    <div className="w-full rounded-2xl border border-border bg-card shadow-sm overflow-hidden mb-8">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border bg-muted/30">
        <SlidersHorizontal className="w-4 h-4 text-primary shrink-0" />
        <span className="text-sm font-semibold text-foreground">Filter articles</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {resultCount} of {totalCount} article{totalCount === 1 ? "" : "s"}
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title, excerpt, author, or tag..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full pl-10 rounded-xl h-11"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          <Select value={filters.category} onValueChange={(v) => update({ category: v })}>
            <SelectTrigger className="w-full rounded-xl h-10">
              <SelectValue placeholder="Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All categories</SelectItem>
              {BLOG_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.tag} onValueChange={(v) => update({ tag: v })}>
            <SelectTrigger className="w-full rounded-xl h-10">
              <SelectValue placeholder="Tag" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All tags</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t} value={t}>
                  #{t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filters.author} onValueChange={(v) => update({ author: v })}>
            <SelectTrigger className="w-full rounded-xl h-10">
              <SelectValue placeholder="Author" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All authors</SelectItem>
              {authors.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={filters.sort}
            onValueChange={(v) => update({ sort: v as BlogSortOption })}
          >
            <SelectTrigger className="w-full rounded-xl h-10">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              {SORT_OPTIONS.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {active && (
          <div className="flex flex-wrap items-center gap-2 pt-1">
            {filters.search.trim() && (
              <FilterChip
                label={`Search: "${filters.search.trim()}"`}
                onRemove={() => update({ search: "" })}
              />
            )}
            {filters.category !== "all" && (
              <FilterChip
                label={
                  BLOG_CATEGORIES.find((c) => c.value === filters.category)?.label ??
                  filters.category
                }
                onRemove={() => update({ category: "all" })}
              />
            )}
            {filters.tag !== "all" && (
              <FilterChip
                label={`#${filters.tag}`}
                onRemove={() => update({ tag: "all" })}
              />
            )}
            {filters.author !== "all" && (
              <FilterChip
                label={filters.author}
                onRemove={() => update({ author: "all" })}
              />
            )}
            {filters.sort !== "newest" && (
              <FilterChip
                label={SORT_OPTIONS.find((o) => o.value === filters.sort)?.label ?? filters.sort}
                onRemove={() => update({ sort: "newest" })}
              />
            )}
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="rounded-xl text-xs h-7 text-muted-foreground hover:text-foreground"
              onClick={clearAll}
            >
              <X className="w-3 h-3 mr-1" />
              Clear all
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

function FilterChip({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <button
      type="button"
      onClick={onRemove}
      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary border border-primary/20 hover:bg-primary/15 transition-colors"
    >
      {label}
      <X className="w-3 h-3" />
    </button>
  );
}
