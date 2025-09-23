"use client";

import { useEffect, useMemo, useRef, useState } from "react";

type Language = "en" | "zh";
type ThemeMode = "light" | "dark";

interface LocalizedText {
  en: string;
  zh: string;
}

interface AgentNewsItem {
  id: string;
  title: LocalizedText;
  summary: LocalizedText;
  source: {
    name: string;
    url: string;
  };
  publishedAt: string;
  tags: string[];
  signal?: string;
}

interface AgentNewsFeed {
  schemaVersion: string;
  lastUpdated: string;
  items: AgentNewsItem[];
}

const THEME_STORAGE_KEY = "howagentworks:theme";
const LANGUAGE_STORAGE_KEY = "howagentworks:language";
const NEWS_DATA_PATH = "/data/agent-news.json";

const newsFallback: AgentNewsFeed = {
  schemaVersion: "2025-01-17",
  lastUpdated: "2025-01-17T09:30:00Z",
  items: [
    {
      id: "openai-o4-mini-20250116",
      title: {
        en: "OpenAI unveils O4-Mini with faster deliberation",
        zh: "OpenAI 发布 O4-Mini，强调更快的规划推理",
      },
      summary: {
        en: "The new O4-Mini model focuses on short-horizon planning with tool calling baked in, offering better latency for production agents.",
        zh: "新的 O4-Mini 模型强化短周期规划并内置工具调用，显著降低面向生产级 Agent 的响应延迟。",
      },
      source: {
        name: "OpenAI Blog",
        url: "https://openai.com/blog",
      },
      publishedAt: "2025-01-16T15:00:00Z",
      tags: ["product", "models"],
      signal: "Launch",
    },
    {
      id: "anthropic-latency-benchmark-20250115",
      title: {
        en: "Anthropic shares latency benchmark suite for Claude agents",
        zh: "Anthropic 发布 Claude Agent 延迟基准测试套件",
      },
      summary: {
        en: "Claude Ops released an open benchmark to profile perception, planning, and action latencies across orchestration stacks.",
        zh: "Claude Ops 团队开源了一套基准，用于衡量不同编排框架从感知、规划到执行的端到端延迟。",
      },
      source: {
        name: "Anthropic Engineering",
        url: "https://www.anthropic.com",
      },
      publishedAt: "2025-01-15T03:45:00Z",
      tags: ["research", "benchmarks"],
      signal: "Insight",
    },
    {
      id: "regulation-eu-agent-logging-20250113",
      title: {
        en: "EU proposes audit trail rules for autonomous agents",
        zh: "欧盟提议针对自主 Agent 的审计追踪新规",
      },
      summary: {
        en: "A draft regulation would require transparent logging and reversible actions for high-autonomy systems deployed in Europe.",
        zh: "最新草案要求在欧洲部署的高自治 Agent 必须具备透明日志与可逆操作能力。",
      },
      source: {
        name: "EU Digital Policy",
        url: "https://digital-strategy.ec.europa.eu",
      },
      publishedAt: "2025-01-13T11:20:00Z",
      tags: ["policy", "compliance"],
      signal: "Policy",
    },
  ],
};

const LANGUAGE_LABELS: Record<Language, string> = {
  en: "English",
  zh: "中文",
};

const HERO_COPY = {
  kicker: {
    en: "Agents demystified",
    zh: "Agent 基础知识全景",
  },
  title: {
    en: "How modern AI agents perceive, reason, and act",
    zh: "现代 AI Agent 如何感知、推理与执行",
  },
  subtitle: {
    en: "A living guide to agent fundamentals, design trade-offs, and the latest field developments.",
    zh: "一份覆盖 Agent 基础原理、架构取舍与行业最新动态的持续更新指南。",
  },
  ctas: {
    learn: {
      en: "Learn the fundamentals",
      zh: "快速了解基础",
    },
    updates: {
      en: "See latest updates",
      zh: "查看最新动态",
    },
  },
} satisfies Record<string, LocalizedText | Record<string, LocalizedText>>;

const NAV_LINKS: Array<{ href: string; label: LocalizedText }> = [
  {
    href: "#principles",
    label: { en: "Principles", zh: "核心原理" },
  },
  {
    href: "#pipeline",
    label: { en: "Pipeline", zh: "生命周期" },
  },
  {
    href: "#ecosystem",
    label: { en: "Ecosystem", zh: "生态图谱" },
  },
  {
    href: "#updates",
    label: { en: "Updates", zh: "最新动态" },
  },
  {
    href: "#resources",
    label: { en: "Resources", zh: "工具与资料" },
  },
];

const HERO_PILLARS: Array<{
  key: string;
  anchor: string;
  badge: string;
  title: LocalizedText;
  blurb: LocalizedText;
}> = [
  {
    key: "perceive",
    anchor: "#principle-perceive",
    badge: "01",
    title: { en: "Perceive first", zh: "先感知" },
    blurb: {
      en: "Capture context signals, normalize state, and build ground truth before acting.",
      zh: "先采集上下文信号并归一化状态，为后续行动奠定可信事实。",
    },
  },
  {
    key: "reason",
    anchor: "#principle-reason",
    badge: "02",
    title: { en: "Reason deeply", zh: "深度推理" },
    blurb: {
      en: "Blend heuristics with deliberate loops so the plan stands up to ambiguity.",
      zh: "结合启发式与反思闭环，在不确定环境中保持规划稳健。",
    },
  },
  {
    key: "act",
    anchor: "#principle-act",
    badge: "03",
    title: { en: "Act safely", zh: "安全执行" },
    blurb: {
      en: "Instrument every tool call, log intent, and close the loop with evaluation.",
      zh: "为每次工具调用加上观测，记录意图，并用评估闭合循环。",
    },
  },
  {
    key: "operate",
    anchor: "#pipeline",
    badge: "04",
    title: { en: "Operate continuously", zh: "持续运维" },
    blurb: {
      en: "Stand up a resilient pipeline that retrains memories and keeps humans informed.",
      zh: "构建稳健流水线，持续刷新记忆并让人类掌握状态。",
    },
  },
];

const SECTION_GUIDE: Array<{
  id: string;
  label: LocalizedText;
  summary: LocalizedText;
}> = [
  {
    id: "principles",
    label: { en: "Principles", zh: "核心原理" },
    summary: {
      en: "Perception, reasoning, and action loops at a glance.",
      zh: "感知、推理、执行的闭环概览。",
    },
  },
  {
    id: "pipeline",
    label: { en: "Pipeline", zh: "生命周期" },
    summary: {
      en: "The end-to-end flow that keeps agents reliable.",
      zh: "保证 Agent 可靠运行的端到端流程。",
    },
  },
  {
    id: "ecosystem",
    label: { en: "Ecosystem", zh: "生态图谱" },
    summary: {
      en: "Key platform and tooling layers to ship faster.",
      zh: "支撑快速交付的关键平台与工具层。",
    },
  },
  {
    id: "updates",
    label: { en: "Updates", zh: "最新动态" },
    summary: {
      en: "Live intel feed covering models, policy, and research.",
      zh: "涵盖模型、政策与研究的实时情报。",
    },
  },
  {
    id: "resources",
    label: { en: "Resources", zh: "工具与资料" },
    summary: {
      en: "Playbooks and references for responsible rollout.",
      zh: "支撑负责任落地的实践手册与资料。",
    },
  },
];

const PIPELINE_CALLOUTS: Array<{
  key: string;
  tag: LocalizedText;
  title: LocalizedText;
  description: LocalizedText;
  bullets: LocalizedText[];
}> = [
  {
    key: "guardrails",
    tag: { en: "Safeguards", zh: "安全护栏" },
    title: {
      en: "Build rollback paths before the first action fires",
      zh: "在首次执行前就预留回滚路径",
    },
    description: {
      en: "Treat observability, approvals, and scoped permissions as first-class steps in the pipeline.",
      zh: "将可观测性、审批与权限范围视为流水线中的一等公民。",
    },
    bullets: [
      {
        en: "Dual-write audit logs with human readable summaries.",
        zh: "双写审计日志并保留可读摘要。",
      },
      {
        en: "Escalate long-running tasks to human review after defined thresholds.",
        zh: "长耗时任务超过阈值时自动升级人工复核。",
      },
    ],
  },
  {
    key: "feedback",
    tag: { en: "Feedback", zh: "反馈回路" },
    title: {
      en: "Instrument learning loops as carefully as execution",
      zh: "像对待执行一样精细地监控学习闭环",
    },
    description: {
      en: "Without structured retros, agent memories drift and regressions sneak in unnoticed.",
      zh: "若缺少结构化复盘，Agent 记忆会逐渐漂移，回归不会被及时发现。",
    },
    bullets: [
      {
        en: "Schedule automated eval suites tied to production transcripts.",
        zh: "基于生产对话日志，定期运行自动化评测套件。",
      },
      {
        en: "Feed human feedback into retraining without skipping conflict resolution.",
        zh: "引入人工反馈时，要保留冲突消解流程。",
      },
    ],
  },
];

const HEADER_TAGLINE: LocalizedText = {
  en: "Agents, explained continuously",
  zh: "持续更新的 Agent 指南",
};

const THEME_BUTTON_TEXT: Record<ThemeMode, LocalizedText> = {
  light: { en: "Light", zh: "浅色" },
  dark: { en: "Dark", zh: "深色" },
};

const CORE_PRINCIPLES: Array<{
  key: string;
  accent: string;
  title: LocalizedText;
  description: LocalizedText;
  bullets: LocalizedText[];
}> = [
  {
    key: "perceive",
    accent: "from-sky-400/90 to-blue-500/80",
    title: { en: "Perceive", zh: "感知" },
    description: {
      en: "Agents collect structured and unstructured signals to understand context before they act.",
      zh: "Agent 通过采集结构化与非结构化信号来建立上下文认知，为后续动作做准备。",
    },
    bullets: [
      {
        en: "Retrieval pipelines, API ingestion, and sensor streams feed the working memory.",
        zh: "检索、API 写入与传感器数据共同构建工作记忆。",
      },
      {
        en: "State normalization ensures downstream reasoning stays grounded and auditable.",
        zh: "状态归一化让后续推理更可追踪、更可信。",
      },
    ],
  },
  {
    key: "reason",
    accent: "from-violet-400/90 to-fuchsia-500/80",
    title: { en: "Reason", zh: "推理" },
    description: {
      en: "Planning loops translate goals into executable steps while managing uncertainty.",
      zh: "规划闭环将目标拆解为可执行步骤，并在不确定性中保持稳健。",
    },
    bullets: [
      {
        en: "Blend fast heuristics with deliberate tool-using reflections.",
        zh: "结合快速启发式与深度反思式的工具调用策略。",
      },
      {
        en: "Guardrails mitigate hallucinations, overreach, and compounding errors.",
        zh: "通过护栏机制降低幻觉、越权与错误累积。",
      },
    ],
  },
  {
    key: "act",
    accent: "from-emerald-400/90 to-teal-500/80",
    title: { en: "Act", zh: "执行" },
    description: {
      en: "Actions call tools, trigger automations, and close the observation loop with feedback.",
      zh: "执行阶段调用工具、触发自动化，并用反馈闭合整个观察环路。",
    },
    bullets: [
      {
        en: "Transaction logs and rollbacks keep systems safe under autonomy.",
        zh: "交易日志与回滚能力保障自治执行的安全边界。",
      },
      {
        en: "Evaluate outcomes to promote self-improvement and human trust.",
        zh: "对结果进行评估，驱动自我改进并增强人类信任。",
      },
    ],
  },
];

const PIPELINE_STEPS: Array<{
  id: string;
  title: LocalizedText;
  detail: LocalizedText;
  artifact: LocalizedText;
}> = [
  {
    id: "ingest",
    title: { en: "Ingest", zh: "预处理" },
    detail: {
      en: "Collect domain knowledge, live signals, and constraints; hydrate episodic and semantic memories.",
      zh: "收集领域知识、实时信号与约束条件，填充情景记忆与语义记忆。",
    },
    artifact: {
      en: "Knowledge base, connectors, data contracts",
      zh: "知识库、数据连接器、数据契约",
    },
  },
  {
    id: "plan",
    title: { en: "Plan", zh: "规划" },
    detail: {
      en: "Translate goals into task graphs, assign tools, and simulate outcomes before committing.",
      zh: "将目标转化为任务图，分配工具并在执行前进行结果预演。",
    },
    artifact: {
      en: "Task graph, guardrail policy, evaluation hooks",
      zh: "任务图、护栏策略、评估钩子",
    },
  },
  {
    id: "act",
    title: { en: "Act", zh: "执行" },
    detail: {
      en: "Call tools, orchestrate services, and capture telemetry for traceability.",
      zh: "调用工具、编排服务，并记录遥测数据用于追踪。",
    },
    artifact: {
      en: "Tool adapters, workflow runners, audit log",
      zh: "工具适配器、工作流运行器、审计日志",
    },
  },
  {
    id: "learn",
    title: { en: "Learn", zh: "学习" },
    detail: {
      en: "Evaluate results, refresh memories, and decide whether to escalate to humans.",
      zh: "评估结果、刷新记忆，并决定是否升级到人工处理。",
    },
    artifact: {
      en: "Offline evaluation, memory compaction, feedback loops",
      zh: "离线评估、记忆压缩、反馈闭环",
    },
  },
];

const ECOSYSTEM_PILLARS: Array<{
  name: LocalizedText;
  summary: LocalizedText;
  items: LocalizedText[];
}> = [
  {
    name: { en: "Foundation & Reasoning", zh: "基础模型与推理" },
    summary: {
      en: "Model choice defines reasoning depth, latency, and the cost envelope of your agent.",
      zh: "模型的选择直接决定 Agent 的推理深度、延迟与成本区间。",
    },
    items: [
      {
        en: "Frontier models (o-series, Claude 3.x, Gemini) and compact distillations",
        zh: "前沿模型（o 系列、Claude 3.x、Gemini）与轻量蒸馏模型",
      },
      {
        en: "Structured reasoning toolkits for multi-step plans",
        zh: "用于多步规划的结构化推理工具集",
      },
    ],
  },
  {
    name: { en: "Orchestration", zh: "编排框架" },
    summary: {
      en: "Frameworks coordinate memories, tools, and safety layers to deliver reliable outcomes.",
      zh: "编排框架负责协调记忆、工具与安全层以输出可靠结果。",
    },
    items: [
      {
        en: "LangChain, LlamaIndex, OpenAI Realtime, custom DAG executors",
        zh: "LangChain、LlamaIndex、OpenAI Realtime、自定义 DAG 执行器",
      },
      {
        en: "State stores, vector memories, policy engines",
        zh: "状态存储、向量记忆、策略引擎",
      },
    ],
  },
  {
    name: { en: "Safety & Governance", zh: "安全与治理" },
    summary: {
      en: "Define boundaries, escalation paths, and observability for autonomous behaviour.",
      zh: "为自治行为设定边界、升级路径与可观测性。",
    },
    items: [
      {
        en: "Content filters, rate guardians, permission systems",
        zh: "内容过滤、速率守卫、权限系统",
      },
      {
        en: "Red teaming, automated evaluations, human-in-the-loop checkpoints",
        zh: "红队测试、自动化评估、人工介入检查点",
      },
    ],
  },
  {
    name: { en: "Deployment & Operations", zh: "部署与运维" },
    summary: {
      en: "Reliable agents need observability, versioning, and a human-aligned feedback loop.",
      zh: "要让 Agent 可靠运行，需要观测、版本管理与对齐人类的反馈闭环。",
    },
    items: [
      {
        en: "Eval harnesses, canary releases, rollback-aware workflows",
        zh: "评测工具、金丝雀发布、支持回滚的工作流",
      },
      {
        en: "Usage analytics, cost dashboards, live tuning",
        zh: "使用分析、成本看板、在线调参",
      },
    ],
  },
];

const RESOURCE_LINKS: Array<{
  title: LocalizedText;
  description: LocalizedText;
  href: string;
}> = [
  {
    title: {
      en: "Agent orchestration templates",
      zh: "Agent 编排模板",
    },
    description: {
      en: "Starter projects that blend tool use, memory, and guardrails for production environments.",
      zh: "整合工具调用、记忆与护栏的生产级入门模板。",
    },
    href: "https://github.com",
  },
  {
    title: {
      en: "Evaluation playbooks",
      zh: "评估作战手册",
    },
    description: {
      en: "Design experiments to stress-test autonomy before a wide rollout.",
      zh: "在大规模发布前，通过实验验证自治能力的边界。",
    },
    href: "https://evals.dev",
  },
  {
    title: {
      en: "Guardrail design patterns",
      zh: "护栏设计模式",
    },
    description: {
      en: "Practical examples of policy engines, approval gates, and runtime monitors.",
      zh: "策略引擎、审批闸口与运行时监控的实战案例。",
    },
    href: "https://alignment.dev",
  },
];

const cn = (...classes: Array<string | false | null | undefined>) =>
  classes.filter(Boolean).join(" ");

function LocalizedHeading({
  text,
  language,
  className,
}: {
  text: LocalizedText;
  language: Language;
  className?: string;
}) {
  return (
    <h2 className={className}>{language === "en" ? text.en : text.zh}</h2>
  );
}

function LocalizedParagraph({
  text,
  language,
  className,
  align = "left",
}: {
  text: LocalizedText;
  language: Language;
  className?: string;
  align?: "left" | "center";
}) {
  return (
    <p
      className={cn(
        "leading-relaxed",
        align === "center" ? "text-center" : "text-left",
        className,
      )}
    >
      {language === "en" ? text.en : text.zh}
    </p>
  );
}

function formatDateLabel(iso: string, language: Language) {
  const date = new Date(iso);
  const en = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
  const zh = new Intl.DateTimeFormat("zh-CN", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);

  return language === "en" ? en : zh;
}

export default function HomePage() {
  const [theme, setTheme] = useState<ThemeMode>("light");
  const [language, setLanguage] = useState<Language>("en");
  const [newsFeed, setNewsFeed] = useState<AgentNewsFeed>(newsFallback);
  const [isSectionRailVisible, setSectionRailVisible] = useState(false);
  const sectionRailRef = useRef<HTMLDivElement | null>(null);
  const [hasScrolledPastHero, setHasScrolledPastHero] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY) as
      | ThemeMode
      | null;
    const storedLanguage = window.localStorage.getItem(
      LANGUAGE_STORAGE_KEY,
    ) as Language | null;

    if (storedTheme === "dark" || storedTheme === "light") {
      setTheme(storedTheme);
    } else {
      const prefersDark = window.matchMedia(
        "(prefers-color-scheme: dark)",
      ).matches;
      setTheme(prefersDark ? "dark" : "light");
    }

    if (storedLanguage === "en" || storedLanguage === "zh") {
      setLanguage(storedLanguage);
      return;
    }

    const browserLanguages =
      typeof navigator !== "undefined" && navigator.languages?.length
        ? navigator.languages
        : typeof navigator !== "undefined"
          ? [navigator.language]
          : [];

    const prefersChinese = browserLanguages.some((lang) =>
      lang?.toLowerCase().startsWith("zh"),
    );

    setLanguage(prefersChinese ? "zh" : "en");
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    document.documentElement.setAttribute("data-theme", theme);
    document.documentElement.style.colorScheme = theme;
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  }, [theme]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }, [language]);

  useEffect(() => {
    let cancelled = false;

    fetch(NEWS_DATA_PATH)
      .then((response) => {
        if (!response.ok) {
          throw new Error(`Failed to load news feed: ${response.status}`);
        }
        return response.json();
      })
      .then((payload: AgentNewsFeed) => {
        if (cancelled) {
          return;
        }
        if (!payload || !Array.isArray(payload.items)) {
          throw new Error("Malformed news payload");
        }
        setNewsFeed(payload);
      })
      .catch(() => {
        // Fall back to bundled snapshot silently.
        if (!cancelled) {
          setNewsFeed(newsFallback);
        }
      });

    return () => {
      cancelled = true;
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

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const mediaQuery = window.matchMedia("(min-width: 1024px)");
    let observer: IntersectionObserver | null = null;

    const detach = () => {
      if (observer) {
        observer.disconnect();
        observer = null;
      }
    };

    const setup = () => {
      detach();

      const target = sectionRailRef.current;
      if (!target || !mediaQuery.matches) {
        setSectionRailVisible(false);
        return;
      }

      observer = new IntersectionObserver(
        ([entry]) => {
          setSectionRailVisible(entry?.isIntersecting ?? false);
        },
        { threshold: 0.2 },
      );

      observer.observe(target);
    };

    setup();
    const handleChange = () => setup();
    mediaQuery.addEventListener("change", handleChange);

    return () => {
      detach();
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const updateScrollFlag = () => {
      setHasScrolledPastHero(window.scrollY > 48);
    };

    updateScrollFlag();
    window.addEventListener("scroll", updateScrollFlag, { passive: true });
    return () => window.removeEventListener("scroll", updateScrollFlag);
  }, []);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const handleAnchorClick = (event: MouseEvent) => {
      const anchor = (event.target as HTMLElement | null)?.closest(
        'a[href^="#"]',
      ) as HTMLAnchorElement | null;

      if (!anchor || anchor.dataset.scrollBehavior === "instant") {
        return;
      }

      if (anchor.target && anchor.target !== "") {
        return;
      }

      const hash = anchor.getAttribute("href");
      if (!hash || hash === "#") {
        return;
      }

      const target = document.querySelector(hash);
      if (!target) {
        return;
      }

      event.preventDefault();
      const prefersReducedMotion = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      const behavior = prefersReducedMotion ? "auto" : "smooth";
      const headerOffset = 84;
      const rect = target.getBoundingClientRect();
      const absoluteTop = rect.top + window.scrollY;
      const offsetTop = Math.max(absoluteTop - headerOffset, 0);

      window.scrollTo({ top: offsetTop, behavior });
      window.history.replaceState(null, "", hash);
    };

    document.addEventListener("click", handleAnchorClick);
    return () => {
      document.removeEventListener("click", handleAnchorClick);
    };
  }, []);

  return (
    <div className="min-h-screen bg-[color:var(--color-background)] text-[color:var(--color-foreground)]">
      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-300",
          hasScrolledPastHero
            ? "border-b border-[color:var(--color-border)] bg-[color:var(--color-background)]/85 backdrop-blur"
            : "border-transparent bg-transparent",
        )}
      >
        <div className="max-w-[1200px] mx-auto flex items-center justify-between px-6 py-4">
          <a href="#overview" className="flex items-center gap-3 no-underline">
            <div className="flex size-11 items-center justify-center rounded-full bg-gradient-to-br from-sky-400/70 via-blue-500/60 to-purple-500/70 text-white font-semibold tracking-wide shadow-lg">
              HAW
            </div>
            <div className="flex flex-col">
              <span className="text-sm font-semibold uppercase tracking-[0.2em]">HowAgent.works</span>
              <span className="text-xs text-[color:var(--color-muted)]">
                {language === "zh"
                  ? HEADER_TAGLINE.zh
                  : HEADER_TAGLINE.en}
              </span>
            </div>
          </a>
          <nav
            className={cn(
              "hidden items-center gap-6 text-sm font-medium text-[color:var(--color-muted-strong)] md:flex",
              isSectionRailVisible ? "lg:hidden" : undefined,
            )}
          >
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                className="hover:text-[color:var(--color-foreground)] transition"
                href={link.href}
              >
                {language === "zh" ? link.label.zh : link.label.en}
              </a>
            ))}
          </nav>
          <div className="flex items-center gap-3">
            <div className="flex rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)] p-[2px]">
              {(["en", "zh"] as Language[]).map((option) => (
                <button
                  key={option}
                  type="button"
                  onClick={() => setLanguage(option)}
                  className={cn(
                    "px-3 py-1 text-xs font-semibold rounded-full transition",
                    option === language
                      ? "bg-[color:var(--color-foreground)] text-[color:var(--color-background)] shadow"
                      : "text-[color:var(--color-muted)] hover:text-[color:var(--color-foreground)]",
                  )}
                >
                  {LANGUAGE_LABELS[option]}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-3 py-2 text-xs font-semibold text-[color:var(--color-muted)] transition hover:text-[color:var(--color-foreground)]"
            >
              <span className="size-2 rounded-full bg-[color:var(--color-accent)] shadow-inner" />
              {language === "zh"
                ? THEME_BUTTON_TEXT[theme].zh
                : THEME_BUTTON_TEXT[theme].en}
            </button>
          </div>
        </div>
      </header>

      <main className="px-6">
        <section
          id="overview"
          className="relative mx-auto flex min-h-[calc(100vh-104px)] w-full max-w-[1100px] flex-col justify-center gap-16 overflow-hidden py-16 sm:py-20 lg:py-24"
        >
          <div className="absolute inset-0 -z-10">
            <div className="absolute -top-40 left-1/2 h-[520px] w-[520px] -translate-x-1/2 rounded-full bg-gradient-to-br from-sky-300/30 via-blue-300/20 to-transparent blur-3xl" />
            <div className="absolute bottom-24 left-0 h-[360px] w-[360px] -translate-x-1/3 rounded-full bg-gradient-to-br from-blue-500/15 to-purple-500/20 blur-3xl" />
            <div className="absolute right-10 top-16 h-36 w-36 rounded-full border border-dashed border-[color:var(--color-border)]/60" />
            <div className="absolute right-1/4 bottom-6 h-24 w-24 rounded-full bg-gradient-to-br from-violet-400/25 to-transparent blur-2xl" />
          </div>

          <div className="mx-auto flex w-full max-w-[830px] flex-col items-center text-center sm:items-start sm:text-left">
            <div className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)]/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.2em]">
              <LocalizedParagraph
                text={HERO_COPY.kicker}
                language={language}
                align="left"
                className="text-center font-semibold uppercase tracking-[0.3em] sm:text-left"
              />
            </div>

            <LocalizedHeading
              text={HERO_COPY.title}
              language={language}
              className="mt-6 w-full text-balance text-center text-4xl font-semibold leading-tight tracking-tight sm:text-left md:text-5xl lg:text-6xl"
            />

            <LocalizedParagraph
              text={HERO_COPY.subtitle}
              language={language}
              align="left"
              className="mt-4 max-w-[860px] text-center text-base text-[color:var(--color-muted)] sm:text-left sm:text-lg"
            />

            <div className="mt-8 flex flex-wrap items-center justify-center gap-4 sm:justify-start">
              <a
                href="#principles"
                className={cn(
                  "inline-flex items-center gap-2 rounded-full bg-[color:var(--color-foreground)] px-6 py-3 text-sm font-semibold shadow transition hover:opacity-90",
                )}
                style={{
                  color:
                    theme === "light"
                      ? "#ffffff"
                      : "var(--color-background)",
                }}
              >
                {language === "zh"
                  ? HERO_COPY.ctas.learn.zh
                  : HERO_COPY.ctas.learn.en}
              </a>
              <a
                href="#updates"
                className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)] px-6 py-3 text-sm font-semibold text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-foreground)]"
              >
                {language === "zh"
                  ? HERO_COPY.ctas.updates.zh
                  : HERO_COPY.ctas.updates.en}
              </a>
            </div>
          </div>

          <div className="mx-auto grid w-full max-w-[1100px] gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {HERO_PILLARS.map((pillar) => (
              <a
                key={pillar.key}
                href={pillar.anchor}
                className="group flex h-full items-start gap-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/85 p-5 shadow-sm transition hover:-translate-y-1 hover:border-[color:var(--color-foreground)] hover:bg-[color:var(--color-card)]"
              >
                <span className="mt-1 flex size-9 items-center justify-center rounded-full bg-[color:var(--color-foreground)] text-xs font-semibold tracking-[0.2em] text-[color:var(--color-background)] shadow">
                  {pillar.badge}
                </span>
                <div className="flex-1">
                  <p className="text-lg font-semibold text-[color:var(--color-foreground)]">
                    {language === "zh" ? pillar.title.zh : pillar.title.en}
                  </p>
                  <LocalizedParagraph
                    text={pillar.blurb}
                    language={language}
                    className="mt-3 text-sm text-[color:var(--color-muted-strong)]"
                  />
                </div>
                <span className="hidden text-lg text-[color:var(--color-muted)] transition group-hover:translate-x-1 group-hover:text-[color:var(--color-foreground)] sm:inline">
                  →
                </span>
              </a>
              ))}
            </div>

          <a
            href="#principles"
            className="absolute bottom-8 left-1/2 inline-flex -translate-x-1/2 transform flex-col items-center gap-2 text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted)]"
          >
            {language === "zh" ? "向下滚动" : "Scroll down"}
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-card)]/90 text-lg text-[color:var(--color-foreground)] shadow-inner animate-bounce">
              ↓
            </span>
          </a>
        </section>

        <nav className="mx-auto mt-10 flex w-full max-w-[1100px] gap-3 overflow-x-auto rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/80 p-4 text-xs text-[color:var(--color-muted)] lg:hidden">
          {SECTION_GUIDE.map((entry, index) => (
            <a
              key={entry.id}
              href={`#${entry.id}`}
              className="min-w-[180px] rounded-xl border border-transparent bg-[color:var(--color-background)]/60 px-4 py-3 text-left font-semibold text-[color:var(--color-foreground)] transition hover:border-[color:var(--color-border)]"
            >
              <div className="flex items-center gap-3">
                <span className="flex size-8 items-center justify-center rounded-full bg-[color:var(--color-card)] text-[10px] font-semibold tracking-[0.3em] text-[color:var(--color-muted-strong)]">
                  {`0${index + 1}`.slice(-2)}
                </span>
                <span>{language === "zh" ? entry.label.zh : entry.label.en}</span>
              </div>
              <p className="mt-2 text-[11px] font-normal leading-relaxed text-[color:var(--color-muted)]">
                {language === "zh" ? entry.summary.zh : entry.summary.en}
              </p>
            </a>
          ))}
        </nav>

        <div className="mx-auto mt-12 grid w-full max-w-[1340px] gap-12 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:items-start xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
          <aside
            ref={sectionRailRef}
            className="sticky top-32 hidden flex-col gap-6 rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/80 p-6 text-sm text-[color:var(--color-muted)] shadow-sm lg:flex"
          >
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted-strong)]">
              {language === "zh" ? "章节导航" : "Section map"}
            </p>
            <div className="flex flex-col gap-4">
              {SECTION_GUIDE.map((entry, index) => (
                <a
                  key={entry.id}
                  href={`#${entry.id}`}
                  className="group flex items-start gap-3 rounded-2xl border border-transparent px-3 py-3 transition hover:border-[color:var(--color-border)] hover:bg-[color:var(--color-background)]/70"
                >
                  <span className="mt-1 flex size-8 items-center justify-center rounded-full bg-[color:var(--color-background)]/70 text-[10px] font-semibold tracking-[0.3em] text-[color:var(--color-muted-strong)]">
                    {`0${index + 1}`.slice(-2)}
                  </span>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-[color:var(--color-foreground)]">
                      {language === "zh" ? entry.label.zh : entry.label.en}
                    </p>
                    <p className="mt-1 text-xs leading-relaxed text-[color:var(--color-muted)]">
                      {language === "zh" ? entry.summary.zh : entry.summary.en}
                    </p>
                  </div>
                  <span className="hidden text-sm text-[color:var(--color-muted)] transition group-hover:translate-x-1 group-hover:text-[color:var(--color-foreground)] xl:inline">
                    →
                  </span>
                </a>
              ))}
            </div>
          </aside>
          <div className="space-y-24 lg:space-y-28 lg:pl-2 xl:pl-6">
            <section id="principles" className="mx-auto flex w-full max-w-[1100px] flex-col gap-12 py-20 lg:mx-0 lg:max-w-none">
              <div className="flex flex-col gap-4 text-center">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
                  {language === "zh" ? "核心原理" : "Core principles"}
                </h3>
                <LocalizedHeading
                  text={{
                    en: "Three loops power every successful agent",
                    zh: "成功 Agent 的三大循环",
                  }}
                  language={language}
                  className="text-3xl font-semibold"
                />
              </div>
              <div className="grid gap-8 md:grid-cols-3">
                {CORE_PRINCIPLES.map((principle) => (
                  <article
                    id={`principle-${principle.key}`}
                    key={principle.key}
                    className="group flex flex-col gap-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <div
                      className={cn(
                        "h-32 rounded-xl p-[1px] bg-gradient-to-br",
                        principle.accent,
                      )}
                    >
                      <div className="flex h-full items-center justify-center rounded-[inherit] bg-[color:var(--color-card)]/85 text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
                        <span className="rounded-[inherit] bg-[color:var(--color-card)]/80 px-4 py-2">
                          {language === "zh" ? principle.title.zh : principle.title.en}
                        </span>
                      </div>
                    </div>
                    <LocalizedParagraph
                      text={principle.description}
                      language={language}
                      className="text-sm text-[color:var(--color-muted)]"
                    />
                    <ul className="flex flex-col gap-3 text-sm text-[color:var(--color-foreground)]">
                      {principle.bullets.map((bullet, index) => (
                        <li key={index} className="flex gap-3">
                          <span className="mt-1 size-1.5 rounded-full bg-[color:var(--color-accent)]" />
                          <LocalizedParagraph
                            text={bullet}
                            language={language}
                            className="text-[0.95rem]"
                          />
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section id="pipeline" className="mx-auto w-full max-w-[1100px] py-20 lg:mx-0 lg:max-w-none">
              <div className="flex flex-col gap-4 text-center">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
                  {language === "zh" ? "Agent 生命周期" : "Agent lifecycle"}
                </h3>
                <LocalizedHeading
                  text={{
                    en: "A resilient pipeline keeps perception, planning, and action honest",
                    zh: "稳健的流水线让感知、规划与执行保持可信",
                  }}
                  language={language}
                  className="text-3xl font-semibold"
                />
              </div>
              <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:gap-12">
                <div className="space-y-6">
                  {PIPELINE_STEPS.map((step, index) => (
                    <div
                      key={step.id}
                      className="flex items-start gap-5 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/90 p-6 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                    >
                      <span className="flex size-11 items-center justify-center rounded-full bg-[color:var(--color-foreground)] text-xs font-semibold tracking-[0.25em] text-[color:var(--color-background)] shadow">
                        {`0${index + 1}`.slice(-2)}
                      </span>
                      <div className="flex-1 space-y-4">
                        <LocalizedHeading
                          text={step.title}
                          language={language}
                          className="text-xl font-semibold"
                        />
                        <LocalizedParagraph
                          text={step.detail}
                          language={language}
                          className="text-sm text-[color:var(--color-muted)]"
                        />
                        <div className="rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-background)]/60 p-4 text-xs text-[color:var(--color-muted-strong)]">
                          <LocalizedParagraph text={step.artifact} language={language} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <aside className="flex flex-col gap-6 rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/80 p-6 shadow-sm">
                  {PIPELINE_CALLOUTS.map((callout) => (
                    <div
                      key={callout.key}
                      className="rounded-2xl border-l-4 border-[color:var(--color-accent)] bg-[color:var(--color-background)]/70 p-4 shadow-sm"
                    >
                      <p className="text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted-strong)]">
                        {language === "zh" ? callout.tag.zh : callout.tag.en}
                      </p>
                      <p className="mt-3 text-lg font-semibold text-[color:var(--color-foreground)]">
                        {language === "zh" ? callout.title.zh : callout.title.en}
                      </p>
                      <LocalizedParagraph
                        text={callout.description}
                        language={language}
                        className="mt-3 text-sm text-[color:var(--color-muted)]"
                      />
                      <ul className="mt-4 flex flex-col gap-2 text-sm text-[color:var(--color-muted-strong)]">
                        {callout.bullets.map((bullet, index) => (
                          <li key={index} className="flex gap-2">
                            <span className="mt-[6px] size-1.5 rounded-full bg-[color:var(--color-foreground)]" />
                            <LocalizedParagraph
                              text={bullet}
                              language={language}
                              className="text-[0.95rem]"
                            />
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </aside>
              </div>
            </section>

            <section id="ecosystem" className="mx-auto w-full max-w-[1100px] py-20 lg:mx-0 lg:max-w-none">
              <div className="flex flex-col gap-4 text-center">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
                  {language === "zh" ? "生态图谱" : "Ecosystem map"}
                </h3>
                <LocalizedHeading
                  text={{
                    en: "Key building blocks for shipping trustworthy agents",
                    zh: "构建可信 Agent 的关键积木",
                  }}
                  language={language}
                  className="text-3xl font-semibold"
                />
              </div>
              <div className="mt-12 grid gap-8 md:grid-cols-2 xl:grid-cols-3">
                {ECOSYSTEM_PILLARS.map((pillar, index) => (
                  <article
                    key={`${pillar.name.en}-${index}`}
                    className="flex flex-col gap-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/90 p-6 shadow-sm"
                  >
                    <LocalizedHeading
                      text={pillar.name}
                      language={language}
                      className="text-2xl font-semibold"
                    />
                    <LocalizedParagraph
                      text={pillar.summary}
                      language={language}
                      className="text-sm text-[color:var(--color-muted)]"
                    />
                    <ul className="flex flex-col gap-3 text-sm text-[color:var(--color-foreground)]">
                      {pillar.items.map((item, itemIndex) => (
                        <li key={itemIndex} className="flex gap-2">
                          <span className="mt-1 size-2 rounded-sm bg-[color:var(--color-accent)]" />
                          <LocalizedParagraph text={item} language={language} />
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section id="updates" className="mx-auto w-full max-w-[1100px] py-20 lg:mx-0 lg:max-w-none">
              <div className="flex flex-col gap-4 text-center">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
                  {language === "zh" ? "最新动态" : "Latest updates"}
                </h3>
                <LocalizedHeading
                  text={{
                    en: "Live agent intelligence feed",
                    zh: "Agent 情报实时更新",
                  }}
                  language={language}
                  className="text-3xl font-semibold"
                />
                <LocalizedParagraph
                  text={{
                    en: "Curated by an automated monitor that scrapes vendor blogs, research feeds, and policy trackers.",
                    zh: "由自动监控 Agent 汇总厂商博客、研究订阅与政策追踪等来源。",
                  }}
                  language={language}
                  className="mx-auto max-w-2xl text-sm text-[color:var(--color-muted)]"
                  align="center"
                />
              </div>
              <div className="mt-10 flex flex-col gap-2 text-xs text-[color:var(--color-muted)]">
                <span>
                  {language === "zh"
                    ? `上次同步：${formatDateLabel(newsFeed.lastUpdated, "zh")}`
                    : `Last updated: ${formatDateLabel(newsFeed.lastUpdated, "en")}`}
                </span>
                <span className="text-[color:var(--color-muted-strong)]">
                  {language === "zh"
                    ? `数据来源：${NEWS_DATA_PATH}`
                    : `Data source: ${NEWS_DATA_PATH}`}
                </span>
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {sortedNewsItems.map((item) => (
                  <article
                    key={item.id}
                    className="flex h-full flex-col gap-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/90 p-6 shadow-sm"
                  >
                    <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.25em] text-[color:var(--color-muted)]">
                      <span className="rounded-full border border-[color:var(--color-border)] px-3 py-1 text-[10px]">
                        {formatDateLabel(item.publishedAt, language)}
                      </span>
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
                    <LocalizedHeading
                      text={item.title}
                      language={language}
                      className="text-xl font-semibold"
                    />
                    <LocalizedParagraph
                      text={item.summary}
                      language={language}
                      className="text-sm text-[color:var(--color-muted)]"
                    />
                    <a
                      href={item.source.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-auto inline-flex items-center gap-2 text-sm font-semibold text-[color:var(--color-foreground)] underline-offset-4 transition hover:underline"
                    >
                      {`${item.source.name} →`}
                    </a>
                  </article>
                ))}
              </div>
            </section>

            <section id="resources" className="mx-auto w-full max-w-[1100px] py-20 lg:mx-0 lg:max-w-none">
              <div className="flex flex-col gap-4 text-center">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
                  {language === "zh" ? "工具与资料" : "Tools & references"}
                </h3>
                <LocalizedHeading
                  text={{
                    en: "Roll out responsibly with these playbooks",
                    zh: "结合这些实践手册，负责任地推出 Agent",
                  }}
                  language={language}
                  className="text-3xl font-semibold"
                />
              </div>
              <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {RESOURCE_LINKS.map((resource) => (
                  <a
                    key={resource.href}
                    href={resource.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex h-full flex-col gap-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/90 p-6 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
                  >
                    <LocalizedHeading
                      text={resource.title}
                      language={language}
                      className="text-xl font-semibold"
                    />
                    <LocalizedParagraph
                      text={resource.description}
                      language={language}
                      className="text-sm text-[color:var(--color-muted)]"
                    />
                    <span className="mt-auto text-sm font-semibold text-[color:var(--color-foreground)]">
                      {language === "zh" ? "阅读更多 →" : "Read more →"}
                    </span>
                  </a>
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

      <footer className="border-t border-[color:var(--color-border)] bg-[color:var(--color-background)]/90">
        <div className="mx-auto flex max-w-[1100px] flex-col gap-4 px-6 py-12 text-sm text-[color:var(--color-muted)] md:flex-row md:items-center md:justify-between">
          <span>
            {language === "zh"
              ? "由 HowAgent.works 团队维护"
              : "Maintained by the HowAgent.works team"}
          </span>
          <span>
            {language === "zh"
              ? "内容持续迭代，欢迎提交 Issue 或 PR"
              : "Content evolves continuously—feedback and PRs welcome"}
          </span>
        </div>
      </footer>
    </div>
  );
}
