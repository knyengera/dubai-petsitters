"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/language-context";
import {
  forumBoardI18n,
  forumReportReasons,
  forumStrings,
  interpolate,
} from "@/lib/i18n/forum";
import { useStrings } from "@/lib/i18n/helpers";

export function useForumI18n() {
  const s = useStrings(forumStrings);
  const { t, lang } = useLanguage();

  const reportReasons = useMemo(
    () =>
      Object.fromEntries(
        Object.entries(forumReportReasons).map(([key, value]) => [
          key,
          t(value.en, value.ar),
        ])
      ) as Record<keyof typeof forumReportReasons, string>,
    [t, lang]
  );

  const getBoardTitle = (slug: string, fallback: string) => {
    const entry = forumBoardI18n[slug];
    return entry ? t(entry.title.en, entry.title.ar) : fallback;
  };

  const getBoardDescription = (slug: string, fallback: string | null) => {
    const entry = forumBoardI18n[slug];
    if (!entry) return fallback;
    return t(entry.description.en, entry.description.ar);
  };

  const pageLabel = (page: number, totalPages: number, total: number) =>
    interpolate(s.pageOf, { page, totalPages, total });

  return {
    s,
    reportReasons,
    getBoardTitle,
    getBoardDescription,
    pageLabel,
    t,
  };
}
