"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { MoonIcon, SunIcon } from "@/components/icons";
import { SiteFooter } from "@/components/SiteFooter";
import { useUserPreferences } from "@/hooks/useUserPreferences";
import { LANGUAGE_TOGGLE_ARIA, LANGUAGE_TOGGLE_LABEL, THEME_TOGGLE_LABELS } from "@/lib/ui-copy";
import { cn } from "@/lib/utils";

const HERO_COPY = {
  kicker: {
    en: "Deep Dive",
    zh: "深入解析",
  },
  title: {
    en: "ReactAgent Complete Lifecycle",
    zh: "ReactAgent 完整生命周期流程",
  },
  subtitle: {
    en: "A comprehensive guide to understanding ReactAgent's architecture and implementation details.",
    zh: "全面了解 ReactAgent 的架构设计和实现细节。",
  },
  intro: {
    en: "ReactAgent is a sophisticated AI agent framework that orchestrates the complete workflow from user input to task completion. This documentation provides a comprehensive walkthrough of its architecture, covering initialization processes, execution loops, core mechanisms like tool management and context handling, and the intricate details of how different components work together to deliver intelligent agent behaviors.",
    zh: "ReactAgent 是一个复杂的 AI Agent 框架,负责协调从用户输入到任务完成的完整工作流程。本文档全面介绍了它的架构设计,涵盖初始化流程、执行循环、工具管理和上下文处理等核心机制,以及各个组件如何协同工作以实现智能化的 Agent 行为。",
  },
  backToHome: {
    en: "← Back to Home",
    zh: "← 返回首页",
  },
  loading: {
    en: "Loading documentation...",
    zh: "加载文档中...",
  },
  error: {
    en: "Failed to load documentation. Please try again later.",
    zh: "文档加载失败,请稍后重试。",
  },
  tableOfContents: {
    en: "Table of Contents",
    zh: "目录",
  },
} as const;

interface TocItem {
  id: string;
  title: string;
  level: number;
}

export default function ReactAgentPageClient() {
  const { language, theme, setLanguage, setTheme } = useUserPreferences();
  const [content, setContent] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [toc, setToc] = useState<TocItem[]>([]);
  const [activeSection, setActiveSection] = useState<string>("");
  const [tocOpen, setTocOpen] = useState(true);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  // Load markdown content
  useEffect(() => {
    const loadContent = async () => {
      setLoading(true);
      setError(false);
      try {
        const filename = language === "zh" ? "reactAgent.zh.md" : "reactAgent.en.md";
        const response = await fetch(`/docs/${filename}`);
        if (!response.ok) throw new Error("Failed to load");
        const text = await response.text();
        setContent(text);

        // Extract table of contents
        const headings: TocItem[] = [];
        const idCounts = new Map<string, number>();
        const lines = text.split("\n");

        lines.forEach((line) => {
          const match = line.match(/^(#{1,3})\s+(.+)$/);
          if (match) {
            const level = match[1].length;
            const title = match[2];

            // Skip "目录" or "Table of Contents" sections
            if (title.trim() === '目录' || title.trim() === 'Table of Contents') {
              return;
            }

            // Generate ID: keep Chinese, English, numbers, convert spaces/special chars to dash
            let id = title
              .trim()
              .replace(/\s+/g, "-")
              .replace(/[^\w\u4e00-\u9fa5-]/g, "")
              .toLowerCase();

            // Handle duplicate IDs
            const baseId = id;
            const count = idCounts.get(baseId) || 0;
            if (count > 0) {
              id = `${id}-${count}`;
            }
            idCounts.set(baseId, count + 1);

            headings.push({ id, title, level });
          }
        });
        setToc(headings);
      } catch {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    loadContent();
  }, [language]);

  // Scroll detection for header transparency
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Intersection Observer for active section
  useEffect(() => {
    // Wait for content to be fully rendered with IDs
    const timer = setTimeout(() => {
      if (!contentRef.current) return;

      // Use a simpler scroll-based approach
      const handleScroll = () => {
        const headings = contentRef.current?.querySelectorAll("h1[id], h2[id], h3[id]");
        if (!headings) return;

        let currentSection = "";
        const scrollPosition = window.scrollY + 150; // Offset for header

        headings.forEach((heading) => {
          const element = heading as HTMLElement;
          if (element.offsetTop <= scrollPosition) {
            currentSection = element.id;
          }
        });

        if (currentSection) {
          setActiveSection(currentSection);
        }
      };

      // Initial check
      handleScroll();

      // Listen to scroll events
      window.addEventListener("scroll", handleScroll, { passive: true });

      return () => {
        window.removeEventListener("scroll", handleScroll);
      };
    }, 300);

    return () => clearTimeout(timer);
  }, [content]);


  const toggleLanguage = () => {
    setLanguage(language === "en" ? "zh" : "en");
  };

  const toggleTheme = () => {
    setTheme(theme === "light" ? "dark" : "light");
  };

  const handleTocClick = (e: React.MouseEvent<HTMLAnchorElement>, id: string) => {
    e.preventDefault();
    e.stopPropagation();

    const element = document.getElementById(id);

    if (element) {
      const headerOffset = 100;
      const elementPosition = element.getBoundingClientRect().top;
      const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

      window.scrollTo({
        top: offsetPosition,
        behavior: "smooth",
      });

      // Update URL hash without jumping
      window.history.pushState(null, "", `#${id}`);
      setActiveSection(id);
    }
  };

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  const renderMarkdown = (md: string) => {
    let html = md;

    // Remove table of contents section from the markdown
    // Match "## 目录" or "## Table of Contents" and everything until the next heading of same or higher level
    html = html.replace(/^##\s+目录\s*\n([\s\S]*?)(?=\n##\s+|\n#\s+|$)/gm, '');
    html = html.replace(/^##\s+Table of Contents\s*\n([\s\S]*?)(?=\n##\s+|\n#\s+|$)/gm, '');

    // Replace code blocks with language support
    html = html.replace(/```(\w+)?\n([\s\S]*?)```/g, (_, lang, code) => {
      const lines = code.split('\n').filter((line: string) => line.trim());
      const numberedLines = lines
        .map((line: string, i: number) => {
          return `<span class="line-number">${i + 1}</span><span class="line-content">${escapeHtml(line)}</span>`;
        })
        .join('\n');
      return `<pre class="code-block" data-language="${lang || 'text'}"><code>${numberedLines}</code></pre>`;
    });

    // Replace inline code
    html = html.replace(/`([^`]+)`/g, '<code class="inline-code">$1</code>');

    // Replace headers with section numbers AND IDs - process in order
    const lines = html.split('\n');
    let h2Count = 0, h3Count = 0;
    const idCounts = new Map<string, number>();

    const generateId = (title: string): string => {
      let id = title
        .trim()
        .replace(/\s+/g, "-")
        .replace(/[^\w\u4e00-\u9fa5-]/g, "")
        .toLowerCase();

      const baseId = id;
      const count = idCounts.get(baseId) || 0;
      if (count > 0) {
        id = `${id}-${count}`;
      }
      idCounts.set(baseId, count + 1);
      return id;
    };

    html = lines.map(line => {
      if (line.match(/^### (.+)$/)) {
        h3Count++;
        const title = line.replace(/^### /, '').trim();
        const id = generateId(title);
        return `<h3 id="${id}"><span class="section-number">${h2Count}.${h3Count}</span> ${title}</h3>`;
      } else if (line.match(/^## (.+)$/)) {
        h2Count++;
        h3Count = 0;
        const title = line.replace(/^## /, '').trim();
        const id = generateId(title);
        return `<h2 id="${id}"><span class="section-number">${h2Count}</span> ${title}</h2>`;
      } else if (line.match(/^# (.+)$/)) {
        // H1 - no section number displayed
        h2Count = 0;
        h3Count = 0;
        const title = line.replace(/^# /, '').trim();
        const id = generateId(title);
        return `<h1 id="${id}">${title}</h1>`;
      }
      return line;
    }).join('\n');

    // Replace bold (must be on same line)
    html = html.replace(/\*\*([^\n*]+?)\*\*/g, "<strong>$1</strong>");

    // Replace italic (must be on same line, not adjacent to other *)
    html = html.replace(/(?<!\*)\*([^\n*]+?)\*(?!\*)/g, "<em>$1</em>");

    // Replace links
    html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener">$1</a>');

    // Replace bullet lists (with nesting support)
    html = html.replace(/^\s*[-•]\s+(.+)$/gm, "<li>$1</li>");
    html = html.replace(/(<li>[\s\S]+?<\/li>)/g, "<ul>$1</ul>");

    // Replace numbered lists
    html = html.replace(/^\d+\.\s+(.+)$/gm, "<li>$1</li>");

    // Replace horizontal rules
    html = html.replace(/^---+$/gm, "<hr />");

    // Replace blockquotes
    html = html.replace(/^>\s+(.+)$/gm, "<blockquote>$1</blockquote>");

    // Replace tables
    html = html.replace(/\n(\|.+\|)\n\|[-:\s|]+\|\n((?:\|.+\|\n?)+)/g, (match, header, rows) => {
      const headerCells = header.split('|').filter((cell: string) => cell.trim());
      const headerRow = '<tr>' + headerCells.map((cell: string) => `<th>${cell.trim()}</th>`).join('') + '</tr>';

      const bodyRows = rows.trim().split('\n').map((row: string) => {
        const cells = row.split('|').filter((cell: string) => cell.trim());
        return '<tr>' + cells.map((cell: string) => `<td>${cell.trim()}</td>`).join('') + '</tr>';
      }).join('');

      return `\n<table><thead>${headerRow}</thead><tbody>${bodyRows}</tbody></table>\n`;
    });

    // Replace paragraphs
    html = html.replace(/^(?!<[hupolt]|```|>)(.+\S.+)$/gm, "<p>$1</p>");

    return html;
  };

  const escapeHtml = (text: string) => {
    const div = document.createElement("div");
    div.textContent = text;
    return div.innerHTML;
  };

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Header */}
      <header className={cn(
        "fixed top-0 left-0 right-0 z-50 transition-all duration-300",
        scrolled
          ? "border-b border-border bg-background/95 backdrop-blur-lg shadow-sm"
          : "border-b border-transparent bg-transparent"
      )}>
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-8">
          <Link
            href="/#pipeline"
            className={cn(
              "text-sm font-medium transition-all duration-300",
              scrolled ? "text-muted-foreground hover:text-foreground" : "text-foreground/70 hover:text-foreground"
            )}
          >
            {HERO_COPY.backToHome[language]}
          </Link>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleLanguage}
              className={cn(
                "rounded-lg px-3 py-1.5 text-sm font-medium transition-all duration-300",
                scrolled
                  ? "border border-border bg-card hover:bg-accent/10"
                  : "border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 backdrop-blur-sm"
              )}
              aria-label={LANGUAGE_TOGGLE_ARIA[language]}
            >
              {LANGUAGE_TOGGLE_LABEL[language]}
            </button>

            <button
              onClick={toggleTheme}
              className={cn(
                "rounded-lg p-2 transition-all duration-300",
                scrolled
                  ? "border border-border bg-card hover:bg-accent/10"
                  : "border border-foreground/10 bg-foreground/5 hover:bg-foreground/10 backdrop-blur-sm"
              )}
              aria-label={
                theme === "light"
                  ? THEME_TOGGLE_LABELS.light[language]
                  : THEME_TOGGLE_LABELS.dark[language]
              }
            >
              {theme === "light" ? (
                <MoonIcon className="h-4 w-4" />
              ) : (
                <SunIcon className="h-4 w-4" />
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative pt-32 pb-20 sm:pt-40 sm:pb-24 overflow-hidden">
        {/* Gradient Background */}
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-background to-background" />

        <div className="relative mx-auto max-w-4xl px-6 text-center lg:px-8">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 px-4 py-1.5 text-xs font-medium uppercase tracking-wider text-accent backdrop-blur-sm">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-accent"></span>
            </span>
            {HERO_COPY.kicker[language]}
          </div>
          <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text text-transparent">
            {HERO_COPY.title[language]}
          </h1>
          <p className="mx-auto max-w-2xl text-lg text-muted-foreground leading-relaxed">
            {HERO_COPY.subtitle[language]}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex gap-8">
          {/* Table of Contents - Collapsible Sidebar */}
          <aside
            className={cn(
              "transition-all duration-300",
              sidebarCollapsed ? "w-12" : "w-64",
              "hidden lg:block shrink-0"
            )}
          >
            <div className="sticky top-20">
              {sidebarCollapsed ? (
                <button
                  onClick={() => setSidebarCollapsed(false)}
                  className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-card/95 backdrop-blur-sm transition-colors hover:bg-accent shadow-lg"
                  aria-label="Expand sidebar"
                >
                  <span className="text-lg">☰</span>
                </button>
              ) : (
                <nav className="rounded-lg border border-border bg-card/80 backdrop-blur-sm shadow-sm">
                  <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <h2 className="text-sm font-semibold text-foreground">
                      {HERO_COPY.tableOfContents[language]}
                    </h2>
                    <button
                      onClick={() => setSidebarCollapsed(true)}
                      className="text-muted-foreground transition-colors hover:text-foreground"
                      aria-label="Collapse sidebar"
                    >
                      <span className="text-lg">«</span>
                    </button>
                  </div>
                  <div className="max-h-[calc(100vh-12rem)] overflow-y-auto px-2 py-3">
                    <ul className="space-y-1 text-sm">
                      {toc.map((item, index) => {
                        // Calculate section number: H1 no number, H2 shows count, H3 shows h2.h3
                        let sectionNum = "";

                        if (item.level === 2) {
                          // Count H2s from start to current position
                          const h2Index = toc.slice(0, index + 1).filter(t => t.level === 2).length;
                          sectionNum = `${h2Index}`;
                        } else if (item.level === 3) {
                          // Find the last H2 before this H3
                          const lastH2Index = toc.slice(0, index).findLastIndex(t => t.level === 2);
                          if (lastH2Index !== -1) {
                            // Count H2s up to and including the parent H2
                            const h2Count = toc.slice(0, lastH2Index + 1).filter(t => t.level === 2).length;
                            // Count H3s after the parent H2
                            const h3Count = toc.slice(lastH2Index + 1, index + 1).filter(t => t.level === 3).length;
                            sectionNum = `${h2Count}.${h3Count}`;
                          }
                        }
                        // H1 gets no section number

                        return (
                          <li key={item.id}>
                            <a
                              href={`#${item.id}`}
                              onClick={(e) => handleTocClick(e, item.id)}
                              className={cn(
                                "block rounded px-3 py-1.5 transition-all cursor-pointer",
                                "hover:bg-accent/10",
                                activeSection === item.id
                                  ? "bg-accent/15 text-accent font-medium"
                                  : "text-muted-foreground hover:text-foreground",
                                item.level === 1 && "font-semibold",
                                item.level === 2 && "pl-6 text-xs",
                                item.level === 3 && "pl-9 text-xs"
                              )}
                            >
                              {sectionNum && <span className="text-[10px] font-mono opacity-60 mr-2">{sectionNum}</span>}
                              {item.title}
                            </a>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                </nav>
              )}
            </div>
          </aside>

          {/* Mobile TOC */}
          <div className="lg:hidden mb-6">
            <button
              onClick={() => setTocOpen(!tocOpen)}
              className="flex w-full items-center justify-between rounded-lg border border-border bg-card px-4 py-3 text-sm font-medium shadow-sm"
            >
              <span>{HERO_COPY.tableOfContents[language]}</span>
              <span className={cn("transition-transform", tocOpen && "rotate-180")}>▼</span>
            </button>

            {tocOpen && (
              <nav className="mt-2 rounded-lg border border-border bg-card p-4 shadow-sm">
                <ul className="space-y-1 text-sm">
                  {toc.map((item, index) => {
                    // Calculate section number: H1 no number, H2 shows count, H3 shows h2.h3
                    let sectionNum = "";

                    if (item.level === 2) {
                      const h2Index = toc.slice(0, index + 1).filter(t => t.level === 2).length;
                      sectionNum = `${h2Index}`;
                    } else if (item.level === 3) {
                      const lastH2Index = toc.slice(0, index).findLastIndex(t => t.level === 2);
                      if (lastH2Index !== -1) {
                        const h2Count = toc.slice(0, lastH2Index + 1).filter(t => t.level === 2).length;
                        const h3Count = toc.slice(lastH2Index + 1, index + 1).filter(t => t.level === 3).length;
                        sectionNum = `${h2Count}.${h3Count}`;
                      }
                    }

                    return (
                      <li key={item.id}>
                        <a
                          href={`#${item.id}`}
                          onClick={(e) => {
                            handleTocClick(e, item.id);
                            setTocOpen(false);
                          }}
                          className={cn(
                            "block rounded px-3 py-2 transition-colors cursor-pointer",
                            activeSection === item.id
                              ? "bg-accent/15 text-accent font-medium"
                              : "text-muted-foreground hover:text-foreground hover:bg-accent/10",
                            item.level === 2 && "pl-6",
                            item.level === 3 && "pl-9"
                          )}
                        >
                          {sectionNum && <span className="text-[10px] font-mono opacity-60 mr-2">{sectionNum}</span>}
                          {item.title}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </nav>
            )}
          </div>

          {/* Documentation Content */}
          <main className="min-w-0 flex-1">
            {loading && (
              <div className="py-12 text-center text-muted-foreground">
                {HERO_COPY.loading[language]}
              </div>
            )}

            {error && (
              <div className="rounded-md border border-red-500/20 bg-red-500/10 p-6 text-center text-red-500">
                {HERO_COPY.error[language]}
              </div>
            )}

            {!loading && !error && (
              <>
                {/* Introduction Section */}
                <div className="mb-12 rounded-2xl border border-border bg-gradient-to-br from-card to-background p-8 shadow-sm">
                  <div className="flex items-start gap-4">
                    <div className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-accent/10 text-2xl">
                      📚
                    </div>
                    <div className="flex-1">
                      <h2 className="mb-3 text-xl font-semibold text-foreground">
                        {language === "zh" ? "关于本文档" : "About This Documentation"}
                      </h2>
                      <p className="text-[0.9375rem] leading-relaxed text-muted-foreground">
                        {HERO_COPY.intro[language]}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Main Documentation Content */}
                <article
                  ref={contentRef}
                  className="max-w-none text-base leading-relaxed"
                  style={{
                    fontFamily: 'var(--font-sans)',
                  }}
                  dangerouslySetInnerHTML={{ __html: renderMarkdown(content) }}
                />
              </>
            )}
          </main>
        </div>
      </div>

      {/* Back to Top Button */}
      {scrolled && (
        <button
          onClick={scrollToTop}
          className="fixed bottom-8 right-8 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-foreground shadow-lg transition-all duration-300 hover:scale-110 hover:shadow-xl"
          aria-label="Back to top"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth={2.5}
            stroke="currentColor"
            className="h-5 w-5"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 15.75l7.5-7.5 7.5 7.5"
            />
          </svg>
        </button>
      )}

      <SiteFooter language={language} />
    </div>
  );
}
