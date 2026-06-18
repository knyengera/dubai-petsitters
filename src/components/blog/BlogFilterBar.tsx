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
import { useBlogI18n } from "@/lib/i18n/use-blog-i18n";

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
  const { s, getCategoryLabel, resultsLabel, searchChip, sortOptions } = useBlogI18n();

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
        <span className="text-sm font-semibold text-foreground">{s.filterArticles}</span>
        <span className="text-xs text-muted-foreground ml-auto">
          {resultsLabel(resultCount, totalCount)}
        </span>
      </div>

      <div className="p-4 space-y-4">
        <div className="relative w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder={s.searchPlaceholder}
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
            className="w-full pl-10 rounded-xl h-11"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 w-full">
          <Select
            items={[
              { value: "all", label: s.allCategories },
              ...BLOG_CATEGORIES.map((cat) => ({
                value: cat.value,
                label: getCategoryLabel(cat.value),
              })),
            ]}
            value={filters.category}
            onValueChange={(v) => update({ category: v })}
          >
            <SelectTrigger className="w-full rounded-xl h-10">
              <SelectValue placeholder={s.category} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{s.allCategories}</SelectItem>
              {BLOG_CATEGORIES.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {getCategoryLabel(cat.value)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={[
              { value: "all", label: s.allTags },
              ...tags.map((t) => ({ value: t, label: `#${t}` })),
            ]}
            value={filters.tag}
            onValueChange={(v) => update({ tag: v })}
          >
            <SelectTrigger className="w-full rounded-xl h-10">
              <SelectValue placeholder={s.tag} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{s.allTags}</SelectItem>
              {tags.map((t) => (
                <SelectItem key={t} value={t}>
                  #{t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={[
              { value: "all", label: s.allAuthors },
              ...authors.map((a) => ({ value: a, label: a })),
            ]}
            value={filters.author}
            onValueChange={(v) => update({ author: v })}
          >
            <SelectTrigger className="w-full rounded-xl h-10">
              <SelectValue placeholder={s.author} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{s.allAuthors}</SelectItem>
              {authors.map((a) => (
                <SelectItem key={a} value={a}>
                  {a}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            items={sortOptions}
            value={filters.sort}
            onValueChange={(v) => update({ sort: v as BlogSortOption })}
          >
            <SelectTrigger className="w-full rounded-xl h-10">
              <SelectValue placeholder={s.sortBy} />
            </SelectTrigger>
            <SelectContent>
              {sortOptions.map((opt) => (
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
                label={searchChip(filters.search.trim())}
                onRemove={() => update({ search: "" })}
              />
            )}
            {filters.category !== "all" && (
              <FilterChip
                label={getCategoryLabel(filters.category) ?? filters.category}
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
                label={sortOptions.find((o) => o.value === filters.sort)?.label ?? filters.sort}
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
              {s.clearAll}
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
