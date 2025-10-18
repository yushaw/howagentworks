"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { MoonIcon, SunIcon } from "@/components/icons";
import { LocalizedHeading, LocalizedParagraph } from "@/components/LocalizedText";
import { NewsCard } from "@/components/NewsCard";
import { SiteFooter } from "@/components/SiteFooter";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { formatDateLabel } from "@/lib/dates";
import type { Language, LocalizedText } from "@/lib/i18n";
import { loadAgentNewsFeed, newsFallback, type AgentNewsFeed } from "@/lib/news";
import { HEADER_TAGLINE, NEWS_HERO_COPY } from "@/lib/site-copy";
import { LANGUAGE_TOGGLE_ARIA, LANGUAGE_TOGGLE_LABEL, THEME_TOGGLE_LABELS } from "@/lib/ui-copy";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;

const NEWS_KICKER: LocalizedText = {
  en: "Agent signal feed",
  zh: "Agent 情报订阅",
};

export default function NewsPage() {
  const { theme, setTheme, language, setLanguage } = useUserPreferences();
  const [newsFeed, setNewsFeed] = useState<AgentNewsFeed>(newsFallback);
  const [currentPage, setCurrentPage] = useState(1);

  useEffect(() => {
    let isMounted = true;

    loadAgentNewsFeed().then((payload) => {
      if (!isMounted) {
        return;
      }
      setNewsFeed(payload);
    });

    return () => {
      isMounted = false;
    };
  }, []);

  const sortedNewsItems = useMemo(
    () =>
      [...newsFeed.items].sort(
        (a, b) =>
          new Date(b.publishedAt).getTime() -
          new Date(a.publishedAt).getTime(),
      ),
    [newsFeed.items],
  );

  const totalPages = Math.max(1, Math.ceil(sortedNewsItems.length / PAGE_SIZE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const pageItems = useMemo(() => {
    const start = (currentPage - 1) * PAGE_SIZE;
    return sortedNewsItems.slice(start, start + PAGE_SIZE);
  }, [sortedNewsItems, currentPage]);

  const firstIndex = sortedNewsItems.length
    ? (currentPage - 1) * PAGE_SIZE + 1
    : 0;
  const lastIndex = sortedNewsItems.length
    ? Math.min(currentPage * PAGE_SIZE, sortedNewsItems.length)
    : 0;

  const pageNumbers = useMemo(
    () => Array.from({ length: totalPages }, (_, index) => index + 1),
    [totalPages],
  );

  const renderLabel = (copy: LocalizedText, lang: Language) =>
    lang === "zh" ? copy.zh : copy.en;

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <header className="sticky top-0 z-40 border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]/85 backdrop-blur">
        <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-3 no-underline">
            <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-400/70 via-blue-500/60 to-purple-500/70 text-white font-semibold tracking-wide shadow-lg">
              HAW
            </div>
            <div className="hidden flex-col sm:flex">
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">HowAgent.works</span>
              <span className="text-xs text-[color:var(--color-muted)]">
                {renderLabel(HEADER_TAGLINE, language)}
              </span>
            </div>
          </Link>
          <nav className="hidden items-center gap-6 text-sm font-medium text-[color:var(--color-muted-strong)] md:flex">
            <Link
              href="/#overview"
              className="transition hover:text-[color:var(--color-foreground)]"
            >
              {language === "zh" ? "首页" : "Overview"}
            </Link>
            <Link
              href="/news"
              className="text-[color:var(--color-foreground)]"
            >
              {language === "zh" ? "最新动态" : "News"}
            </Link>
          </nav>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setLanguage(language === "en" ? "zh" : "en")}
              className="inline-flex items-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-2 text-xs font-semibold text-[color:var(--color-muted)] transition hover:text-[color:var(--color-foreground)]"
              aria-label={language === "en" ? LANGUAGE_TOGGLE_ARIA.en : LANGUAGE_TOGGLE_ARIA.zh}
            >
              {language === "en"
                ? LANGUAGE_TOGGLE_LABEL.en
                : LANGUAGE_TOGGLE_LABEL.zh}
            </button>
            <button
              type="button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)] text-[color:var(--color-muted)] transition hover:text-[color:var(--color-foreground)]"
              aria-label={language === "en" ? THEME_TOGGLE_LABELS[theme].en : THEME_TOGGLE_LABELS[theme].zh}
              title={language === "en" ? THEME_TOGGLE_LABELS[theme].en : THEME_TOGGLE_LABELS[theme].zh}
            >
              {theme === "light" ? (
                <SunIcon className="size-4" aria-hidden />
              ) : (
                <MoonIcon className="size-4" aria-hidden />
              )}
            </button>
          </div>
        </div>
      </header>

      <main className="px-6">
        <section className="relative mx-auto flex w-full max-w-[1100px] flex-col gap-12 py-16 sm:py-20">
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-32 left-1/2 h-[440px] w-[440px] -translate-x-1/2 rounded-full bg-gradient-to-br from-blue-300/25 via-sky-300/20 to-transparent blur-3xl" />
            <div className="absolute bottom-16 left-0 h-[320px] w-[320px] -translate-x-1/3 rounded-full bg-gradient-to-br from-purple-500/15 to-blue-500/20 blur-3xl" />
            <div className="absolute right-16 top-10 h-28 w-28 rounded-full border border-dashed border-[color:var(--color-border)]/60" />
          </div>

          <div className="flex flex-col gap-5 text-center">
            <span className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
              {renderLabel(NEWS_KICKER, language)}
            </span>
            <LocalizedHeading
              text={NEWS_HERO_COPY.title}
              language={language}
              className="text-4xl font-semibold"
            />
            <LocalizedParagraph
              text={NEWS_HERO_COPY.subtitle}
              language={language}
              className="mx-auto max-w-2xl text-sm text-[color:var(--color-muted)]"
              align="center"
            />
            <div className="mt-4 flex flex-wrap items-center justify-center gap-3 text-xs text-[color:var(--color-muted)]">
              <span>
                {language === "zh"
                  ? `最新同步时间：${formatDateLabel(newsFeed.lastUpdated, "zh")}`
                  : `Last updated: ${formatDateLabel(newsFeed.lastUpdated, "en")}`}
              </span>
              <span className="hidden h-1 w-1 rounded-full bg-[color:var(--color-border)] sm:inline-flex" aria-hidden="true" />
              <span>
                {language === "zh"
                  ? `共 ${sortedNewsItems.length} 条记录`
                  : `${sortedNewsItems.length} updates in archive`}
              </span>
            </div>
            <div className="flex items-center justify-center gap-3 text-xs text-[color:var(--color-muted)]">
              <Link
                href="/"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)]/80 px-4 py-2 font-semibold text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-foreground)]"
              >
                <span>{language === "zh" ? "返回首页" : "Back to overview"}</span>
                <span aria-hidden="true">←</span>
              </Link>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-[color:var(--color-muted)]">
              <span>
                {language === "zh"
                  ? `第 ${firstIndex || 0} - ${lastIndex || 0} 条`
                  : `Showing ${firstIndex || 0}–${lastIndex || 0}`}
              </span>
              <span>
                {language === "zh"
                  ? `共 ${totalPages} 页`
                  : `${totalPages} page${totalPages > 1 ? "s" : ""}`}
              </span>
            </div>
            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {pageItems.map((item) => (
                <NewsCard key={item.id} item={item} language={language} />
              ))}
              {pageItems.length === 0 ? (
                <div className="col-span-full flex flex-col items-center gap-3 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/80 p-12 text-center text-sm text-[color:var(--color-muted)]">
                  <span>{language === "zh" ? "暂无数据" : "No updates to show"}</span>
                  <span>
                    {language === "zh"
                      ? "稍后再试，或返回首页了解概览"
                      : "Please check back later or return to the overview."}
                  </span>
                </div>
              ) : null}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-4">
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.max(page - 1, 1))}
                disabled={currentPage === 1}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-4 py-2 text-sm font-semibold transition",
                  currentPage === 1
                    ? "cursor-not-allowed bg-[color:var(--color-background)] text-[color:var(--color-muted)]"
                    : "bg-[color:var(--color-card)]/80 text-[color:var(--color-foreground)] hover:border-[color:var(--color-foreground)]",
                )}
              >
                <span aria-hidden="true">←</span>
                <span>{language === "zh" ? "上一页" : "Previous"}</span>
              </button>
              <div className="flex flex-wrap items-center justify-center gap-2">
                {pageNumbers.map((pageNumber) => (
                  <button
                    key={pageNumber}
                    type="button"
                    onClick={() => setCurrentPage(pageNumber)}
                    className={cn(
                      "size-9 rounded-full border text-sm font-semibold transition",
                      pageNumber === currentPage
                        ? "border-[color:var(--color-foreground)] bg-[color:var(--color-foreground)] text-[color:var(--color-background)]"
                        : "border-[color:var(--color-border)] bg-[color:var(--color-card)]/80 text-[color:var(--color-muted-strong)] hover:border-[color:var(--color-foreground)] hover:text-[color:var(--color-foreground)]",
                    )}
                    aria-label={
                      language === "zh"
                        ? `跳转到第 ${pageNumber} 页`
                        : `Go to page ${pageNumber}`
                    }
                  >
                    {pageNumber}
                  </button>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setCurrentPage((page) => Math.min(page + 1, totalPages))}
                disabled={currentPage === totalPages}
                className={cn(
                  "inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] px-4 py-2 text-sm font-semibold transition",
                  currentPage === totalPages
                    ? "cursor-not-allowed bg-[color:var(--color-background)] text-[color:var(--color-muted)]"
                    : "bg-[color:var(--color-card)]/80 text-[color:var(--color-foreground)] hover:border-[color:var(--color-foreground)]",
                )}
              >
                <span>{language === "zh" ? "下一页" : "Next"}</span>
                <span aria-hidden="true">→</span>
              </button>
            </div>
          </div>
        </section>
      </main>
      <SiteFooter language={language} />
    </div>
  );
}
