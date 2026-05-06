import { createContext, useContext, type ReactNode } from "react";
import { fr, type Translations } from "@/locales/fr";
import { en } from "@/locales/en";

export type Lang = "fr" | "en";

const LangContext = createContext<Lang>("fr");

export function LangProvider({ lang, children }: { lang: Lang; children: ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

export function useT(): Translations {
  const lang = useLang();
  return lang === "en" ? en : fr;
}

export function useOtherLang(): Lang {
  const lang = useLang();
  return lang === "fr" ? "en" : "fr";
}
