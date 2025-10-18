"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Language } from "@/lib/i18n";
import {
  LANGUAGE_STORAGE_KEY,
  THEME_STORAGE_KEY,
  type ThemeMode,
} from "@/lib/preferences";

interface PreferencesContextValue {
  theme: ThemeMode;
  setTheme: (mode: ThemeMode) => void;
  language: Language;
  setLanguage: (lang: Language) => void;
}

const PreferencesContext = createContext<PreferencesContextValue | null>(null);

const applyTheme = (mode: ThemeMode) => {
  if (typeof document === "undefined") {
    return;
  }

  document.documentElement.setAttribute("data-theme", mode);
  document.documentElement.style.colorScheme = mode;
};

export function PreferencesProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [theme, setThemeState] = useState<ThemeMode>("light");
  const [language, setLanguageState] = useState<Language>("en");
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedTheme = window.localStorage.getItem(
      THEME_STORAGE_KEY,
    ) as ThemeMode | null;
    const storedLanguage = window.localStorage.getItem(
      LANGUAGE_STORAGE_KEY,
    ) as Language | null;

    const prefersDark =
      storedTheme === "dark"
        ? true
        : storedTheme === "light"
          ? false
          : window.matchMedia("(prefers-color-scheme: dark)").matches;

    const browserLanguages =
      typeof navigator !== "undefined" && navigator.languages?.length
        ? navigator.languages
        : typeof navigator !== "undefined"
          ? [navigator.language]
          : [];

    const prefersChinese =
      storedLanguage === "zh"
        ? true
        : storedLanguage === "en"
          ? false
          : browserLanguages.some((lang) =>
              lang?.toLowerCase().startsWith("zh"),
            );

    const nextTheme: ThemeMode = prefersDark ? "dark" : "light";
    const nextLanguage: Language = prefersChinese ? "zh" : "en";

    setThemeState(nextTheme);
    applyTheme(nextTheme);
    setLanguageState(nextLanguage);
    setInitialized(true);
  }, []);

  useEffect(() => {
    if (!initialized || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme, initialized]);

  useEffect(() => {
    if (!initialized || typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language, initialized]);

  const setTheme = useCallback((mode: ThemeMode) => {
    setThemeState(mode);
    applyTheme(mode);
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
  }, []);

  const value = useMemo(
    () => ({
      theme,
      setTheme,
      language,
      setLanguage,
    }),
    [theme, setTheme, language, setLanguage],
  );

  return (
    <PreferencesContext.Provider value={value}>
      {children}
    </PreferencesContext.Provider>
  );
}

export function usePreferencesContext() {
  const context = useContext(PreferencesContext);
  if (!context) {
    throw new Error(
      "usePreferencesContext must be used within a PreferencesProvider",
    );
  }
  return context;
}
