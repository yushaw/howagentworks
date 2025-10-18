import type { AgentNewsItem } from "@/lib/news";
import type { Language } from "@/lib/i18n";
import { formatDateLabel } from "@/lib/dates";

interface NewsCardProps {
  item: AgentNewsItem;
  language: Language;
}

export function NewsCard({ item, language }: NewsCardProps) {
  return (
    <article className="flex h-full flex-col gap-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/90 p-6 shadow-sm">
      <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
        {item.signal ? (
          <span className="rounded-full bg-[color:var(--color-foreground)] px-3 py-1 text-[10px] text-[color:var(--color-background)]">
            {item.signal}
          </span>
        ) : null}
        {item.tags.map((tag) => (
          <span
            key={tag}
            className="rounded-full border border-[color:var(--color-border)] px-2 py-1 text-[10px] tracking-[0.2em]"
          >
            {tag.toUpperCase()}
          </span>
        ))}
      </div>
      <div className="flex flex-col gap-3">
        <a
          href={item.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex text-left text-[color:var(--color-foreground)] no-underline transition hover:underline"
        >
          <h3 className="text-xl font-semibold">
            {language === "zh" ? item.title.zh : item.title.en}
          </h3>
        </a>
        <p className="text-sm text-[color:var(--color-muted)]">
          {language === "zh" ? item.summary.zh : item.summary.en}
        </p>
      </div>
      <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
        <a
          href={item.source.url}
          target="_blank"
          rel="noopener noreferrer"
          className="flex min-w-0 flex-1 text-sm font-semibold text-[color:var(--color-foreground)] underline-offset-4 transition hover:underline"
          style={{
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}
        >
          {`${item.source.name} →`}
        </a>
        <span className="inline-flex whitespace-nowrap rounded-full bg-[color:var(--color-background)] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted-strong)] shadow-inner">
          {formatDateLabel(item.publishedAt, language)}
        </span>
      </div>
    </article>
  );
}
