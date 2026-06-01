"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

type LanguageContextValue = {
  lang: string;
  isRTL: boolean;
  toggleLang: () => void;
  t: (en: string, ar: string) => string;
};

const LanguageContext = createContext<LanguageContextValue | null>(null);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [lang, setLang] = useState("en");
  const isRTL = lang === "ar";

  useEffect(() => {
    const stored = localStorage.getItem("pawsaq_lang");
    if (stored) setLang(stored);
  }, []);

  useEffect(() => {
    localStorage.setItem("pawsaq_lang", lang);
    document.documentElement.dir = isRTL ? "rtl" : "ltr";
    document.documentElement.lang = lang;
  }, [lang, isRTL]);

  const toggleLang = () => setLang((l) => (l === "en" ? "ar" : "en"));
  const t = (en: string, ar: string) => (lang === "ar" ? ar : en);

  return (
    <LanguageContext.Provider value={{ lang, isRTL, toggleLang, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error("useLanguage must be used within LanguageProvider");
  return ctx;
}
