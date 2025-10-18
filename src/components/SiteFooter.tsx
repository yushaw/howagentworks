import type { Language } from "@/lib/i18n";

interface SiteFooterProps {
  language: Language;
}

export function SiteFooter({ language }: SiteFooterProps) {
  return (
    <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-background)]/90">
      <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-6 py-12 text-sm text-[color:var(--color-muted)] md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-3 text-[color:var(--color-muted-strong)]">
          <a
            href="https://github.com/yushaw/howagentworks"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="GitHub"
            className="inline-flex size-9 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)]/80 text-[color:var(--color-foreground)] transition hover:bg-[color:var(--color-card)]"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              className="size-5"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d="M12 2a10 10 0 0 0-3.16 19.47c.5.09.68-.22.68-.48v-1.7c-2.78.6-3.37-1.34-3.37-1.34a2.65 2.65 0 0 0-1.1-1.45c-.9-.62.07-.61.07-.61a2.1 2.1 0 0 1 1.54 1.03 2.15 2.15 0 0 0 2.94.84 2.16 2.16 0 0 1 .64-1.35c-2.22-.25-4.57-1.11-4.57-4.94a3.88 3.88 0 0 1 1-2.7 3.6 3.6 0 0 1 .1-2.66s.84-.27 2.75 1.03a9.44 9.44 0 0 1 5 0c1.91-1.3 2.75-1.03 2.75-1.03a3.6 3.6 0 0 1 .1 2.66 3.88 3.88 0 0 1 1 2.7c0 3.84-2.36 4.68-4.6 4.93a2.4 2.4 0 0 1 .69 1.86v2.76c0 .27.18.58.69.48A10 10 0 0 0 12 2Z" />
            </svg>
          </a>
          <span>
            {language === "zh"
              ? "由 HowAgent.works 团队维护"
              : "Maintained by the HowAgent.works team"}
          </span>
        </div>
        <span>
          {language === "zh"
            ? "内容持续迭代，欢迎提交 Issue 或 PR"
            : "Content evolves continuously—feedback and PRs welcome"}
        </span>
      </div>
    </footer>
  );
}

