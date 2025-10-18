import type { Language, LocalizedText } from "@/lib/i18n";
import type { ThemeMode } from "@/lib/preferences";

export const LANGUAGE_TOGGLE_LABEL: Record<Language, string> = {
  en: "中文",
  zh: "English",
};

export const LANGUAGE_TOGGLE_ARIA: Record<Language, string> = {
  en: "Switch to Chinese",
  zh: "切换到英文",
};

export const THEME_TOGGLE_LABELS: Record<ThemeMode, LocalizedText> = {
  light: { en: "Switch to dark mode", zh: "切换到深色模式" },
  dark: { en: "Switch to light mode", zh: "切换到浅色模式" },
};
