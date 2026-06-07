"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/language-context";
import {
  blogCategoryI18n,
  blogStrings,
  interpolate,
  pluralSuffix,
} from "@/lib/i18n/blog";
import { useStrings } from "@/lib/i18n/helpers";

export function useBlogI18n() {
  const s = useStrings(blogStrings);
  const { t, lang } = useLanguage();

  const categoryLabels = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(blogCategoryI18n).map(([key, value]) => [
          key,
          t(value.en, value.ar),
        ])
      ) as Record<keyof typeof blogCategoryI18n, string>,
    [t, lang]
  );

  const getCategoryLabel = (value: string | null | undefined) => {
    if (!value) return value;
    return categoryLabels[value as keyof typeof blogCategoryI18n] ?? value;
  };

  const resultsLabel = (resultCount: number, totalCount: number) => {
    const plural = pluralSuffix(totalCount, lang);
    const pluralAr = pluralSuffix(totalCount, "ar");
    return interpolate(s.resultsCount, {
      result: resultCount,
      total: totalCount,
      plural,
      pluralAr,
    });
  };

  const searchChip = (query: string) =>
    interpolate(s.searchChip, { query });

  const commentsCountLabel = (count: number) =>
    interpolate(s.commentsCount, { count });

  const sortOptions = useMemo(
    () => [
      { value: "newest" as const, label: s.sortNewest },
      { value: "oldest" as const, label: s.sortOldest },
      { value: "title_asc" as const, label: s.sortTitleAsc },
      { value: "title_desc" as const, label: s.sortTitleDesc },
    ],
    [s.sortNewest, s.sortOldest, s.sortTitleAsc, s.sortTitleDesc]
  );

  return {
    s,
    categoryLabels,
    getCategoryLabel,
    resultsLabel,
    searchChip,
    commentsCountLabel,
    sortOptions,
    t,
  };
}
