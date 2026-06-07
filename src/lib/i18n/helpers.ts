"use client";

import { useMemo } from "react";
import { useLanguage } from "@/lib/language-context";

export type Bilingual = { en: string; ar: string };

export function useStrings<T extends Record<string, Bilingual>>(dict: T): Record<keyof T, string> {
  const { t, lang } = useLanguage();
  return useMemo(() => {
    const result = {} as Record<keyof T, string>;
    (Object.keys(dict) as (keyof T)[]).forEach((key) => {
      result[key] = t(dict[key].en, dict[key].ar);
    });
    return result;
  }, [t, lang, dict]);
}

export function useBilingual() {
  const { t } = useLanguage();
  return t;
}
