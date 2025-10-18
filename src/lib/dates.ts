import type { Language } from "@/lib/i18n";

export function formatDateLabel(iso: string, language: Language) {
  const date = new Date(iso);
  const currentYear = new Date().getFullYear();
  const yearMatches = date.getFullYear() === currentYear;

  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  if (language === "en") {
    const formatter = new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      ...(yearMatches ? {} : { year: "numeric" }),
    });
    return formatter.format(date);
  }

  const month = date.getMonth() + 1;
  const day = date.getDate();

  if (yearMatches) {
    return `${month}月${day}日`;
  }

  return `${date.getFullYear()}年${month}月${day}日`;
}
