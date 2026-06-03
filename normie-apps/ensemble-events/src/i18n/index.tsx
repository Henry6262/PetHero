import React, { createContext, useContext, useEffect, useMemo, useState } from "react";
import en from "./en";
import de from "./de";

export type Lang = "en" | "de";

const DICTS: Record<Lang, unknown> = { en, de };

// `de` is Swiss German (Swiss High German, de-CH) — labelled "CH" in the UI.
export const LANG_LABEL: Record<Lang, string> = { en: "EN", de: "CH" };
const HTML_LANG: Record<Lang, string> = { en: "en", de: "de-CH" };

/** Resolve a dot-path key against a dictionary; fall back to the key itself. */
export function translate(lang: Lang, key: string): string {
  const dict = DICTS[lang] ?? en;
  const value = key.split(".").reduce<unknown>((acc, part) => {
    if (acc && typeof acc === "object" && part in (acc as Record<string, unknown>)) {
      return (acc as Record<string, unknown>)[part];
    }
    return undefined;
  }, dict);
  return typeof value === "string" ? value : key;
}

interface I18nContextValue {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: string) => string;
}

const I18nContext = createContext<I18nContextValue | null>(null);

export function I18nProvider({
  children,
  initial = "en",
}: {
  children: React.ReactNode;
  initial?: Lang;
}) {
  const [lang, setLang] = useState<Lang>(initial);
  useEffect(() => {
    document.documentElement.lang = HTML_LANG[lang];
  }, [lang]);
  const value = useMemo<I18nContextValue>(
    () => ({ lang, setLang, t: (key: string) => translate(lang, key) }),
    [lang]
  );
  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useT(): I18nContextValue {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error("useT must be used within <I18nProvider>");
  return ctx;
}
