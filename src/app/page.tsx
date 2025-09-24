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
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";
const resolveAssetPath = (path: string) => `${basePath}${path}`.replace(/\/{2,}/g, "/");
const NEWS_DATA_PATH = resolveAssetPath("/data/agent-news.json");

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
    zh: "Agent 基础概览",
  },
  title: {
    en: "How modern AI agents perceive, reason, and act",
    zh: "AI Agent 如何感知、推理与行动",
  },
  subtitle: {
    en: "Think of an agent as a controllable teammate: it reads what you allow, reasons through the request, and takes approved actions. This guide explains how it works, the design trade-offs, and how to run it safely.",
    zh: "你可以把 Agent 当作一个可控的队友：它会在授权范围内读取信息、进行思考并采取行动。本指南会解释它的核心工作方式、设计上的取舍，以及安全操作的最佳做法。",
  },
  ctas: {
    learn: {
      en: "Learn the fundamentals",
      zh: "了解基础原理",
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
    label: { en: "Agent 101", zh: "入门原理" },
  },
  {
    href: "#pipeline",
    label: { en: "How it works", zh: "运行流程" },
  },
  {
    href: "#ecosystem",
    label: { en: "Ecosystem", zh: "生态图谱" },
  },
  {
    href: "#collaboration",
    label: { en: "Multi-agent", zh: "协作编排" },
  },
  {
    href: "#resources",
    label: { en: "Resources", zh: "工具与资料" },
  },
  {
    href: "#updates",
    label: { en: "Updates", zh: "最新动态" },
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
      en: "Establish facts from documents, APIs, or the screen before planning or acting.",
      zh: "在规划或行动前，先从文档、API 或界面获取信息，建立对事实的认知。",
    },
  },
  {
    key: "reason",
    anchor: "#principle-reason",
    badge: "02",
    title: { en: "Reason simply, then deeply", zh: "先简单规划，再深入思考" },
    blurb: {
      en: "Begin with a minimal plan; add deliberate loops for ambiguous or long tasks.",
      zh: "先制定一个简单的初步计划；当任务复杂或不确定性高时，再进行更深入的思考与规划。",
    },
  },
  {
    key: "act",
    anchor: "#principle-act",
    badge: "03",
    title: { en: "Act safely", zh: "安全执行" },
    blurb: {
      en: "Each tool call carries intent, scoped permissions, logging, and rollback.",
      zh: "每次调用工具都要明确意图、限制权限，并记录日志且具备回滚能力。",
    },
  },
  {
    key: "operate",
    anchor: "#pipeline",
    badge: "04",
    title: { en: "Operate continuously", zh: "持续运维" },
    blurb: {
      en: "Maintain observability and human oversight; refresh memories on schedule.",
      zh: "保持系统的可观测性和人工监督，并按计划更新与维护 Agent 的记忆。",
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
    label: { en: "Agent 101", zh: "入门原理" },
    summary: {
      en: "Perceive → plan → act → learn: the essential loop.",
      zh: "感知→规划→执行→学习：基础闭环。",
    },
  },
  {
    id: "pipeline",
    label: { en: "How it works", zh: "运行流程" },
    summary: {
      en: "An end-to-end pipeline designed for reliability and reversibility.",
      zh: "面向可靠与可回退的端到端流程。",
    },
  },
  {
    id: "ecosystem",
    label: { en: "Ecosystem", zh: "生态图谱" },
    summary: {
      en: "Key layers: models & reasoning, orchestration, guardrails, observability.",
      zh: "关键特性：模型与推理、编排、护栏、可观测性。",
    },
  },
  {
    id: "collaboration",
    label: { en: "Multi-agent", zh: "协作编排" },
    summary: {
      en: "Patterns for routing intent across multiple agents and human teammates.",
      zh: "在多 Agent 与人工协作者之间分配意图的常见模式。",
    },
  },
  {
    id: "resources",
    label: { en: "Resources", zh: "工具与资料" },
    summary: {
      en: "Durable references and templates for responsible delivery.",
      zh: "可长期依赖的资料与模板，支撑稳健落地。",
    },
  },
  {
    id: "updates",
    label: { en: "Updates", zh: "最新动态" },
    summary: {
      en: "A curated feed of product, protocol, and benchmark updates.",
      zh: "涵盖产品、协议与基准更新的精选订阅。",
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
      en: "Define rollback paths before the first action",
      zh: "在首次执行前定义回滚路径",
    },
    description: {
      en: "Treat approvals, permission scopes, and tracing as first-class pipeline steps.",
      zh: "应将人工审批、权限范围和操作追踪视为流程中的首要环节。",
    },
    bullets: [
      {
        en: "Dual-write audit logs with human-readable summaries.",
        zh: "记录审计日志，并附带易于理解的摘要。",
      },
      {
        en: "Escalate long-running or high-risk tasks to human review.",
        zh: "对于耗时长或风险高的任务，应交由人工审核。",
      },
    ],
  },
  {
    key: "feedback",
    tag: { en: "Feedback", zh: "反馈回路" },
    title: {
      en: "Instrument learning with the same rigor as execution",
      zh: "像监控执行一样严格地监控学习过程",
    },
    description: {
      en: "Without structured retrospectives, memories drift and regressions persist.",
      zh: "如果缺少系统性的复盘，Agent 的记忆会出错，程序缺陷也难以被发现。",
    },
    bullets: [
      {
        en: "Run automated evals tied to production transcripts.",
        zh: "基于生产日志定期运行自动化评测。",
      },
      {
        en: "Ingest human feedback with conflict resolution steps.",
        zh: "引入人工反馈时，需要有解决意见冲突的流程。",
      },
    ],
  },
];

const HEADER_TAGLINE: LocalizedText = {
  en: "Agents, explained clearly (and safely)",
  zh: "清晰且安全地理解 Agent",
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
      en: "Acquire context from search, APIs, files, or the screen; materialize a working memory.",
      zh: "通过搜索、API、文件或屏幕内容获取信息，并构建工作记忆。",
    },
    bullets: [
      {
        en: "Hydrate memory via retrieval/APIs/sensors.",
        zh: "用检索、API、传感器补全记忆。",
      },
      {
        en: "Normalize state for grounded and auditable reasoning.",
        zh: "对信息做标准化处理，确保后续推理有据可查、便于审计。",
      },
    ],
  },
  {
    key: "reason",
    accent: "from-violet-400/90 to-fuchsia-500/80",
    title: { en: "Reason", zh: "推理" },
    description: {
      en: "Translate goals into steps; combine heuristics with deliberate loops as needed.",
      zh: "把目标拆解成具体步骤；根据需要结合快速经验判断和深入思考。",
    },
    bullets: [
      {
        en: "Mix fast heuristics with tool-using reflections.",
        zh: "将快速启发式与工具化反思相结合。",
      },
      {
        en: "Use guardrails to prevent overreach and error accumulation.",
        zh: "以护栏抑制越权与错误累积。",
      },
    ],
  },
  {
    key: "act",
    accent: "from-emerald-400/90 to-teal-500/80",
    title: { en: "Act", zh: "执行" },
    description: {
      en: "Invoke tools/services with explicit intent and scoped permissions; trace all steps.",
      zh: "以明确意图与限定权限调用工具/服务，并全程记录追踪。",
    },
    bullets: [
      {
        en: "Transaction logs and rollbacks bound autonomy.",
        zh: "通过操作日志与回滚能力来约束 Agent 的自主范围。",
      },
      {
        en: "Evaluate outcomes to improve reliability and trust.",
        zh: "通过结果评估提升可靠性与信任。",
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
      en: "Collect domain knowledge, live signals, and constraints; hydrate episodic and semantic memories with clear TTLs.",
      zh: "收集领域知识、实时数据和约束条件；为情景和语义记忆补充信息，并明确有效期限 (TTL)。",
    },
    artifact: {
      en: "Knowledge base, connectors, data contracts",
      zh: "知识库、连接器、数据契约",
    },
  },
  {
    id: "plan",
    title: { en: "Plan", zh: "规划" },
    detail: {
      en: "Draft a task graph, assign tools, simulate risky steps, and establish approvals/limits.",
      zh: "生成任务图、分配工具，对高风险步骤进行预演，并设置审批与限制。",
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
      en: "Run steps with tracing; stream outputs; each call includes intent, scope, and rollback.",
      zh: "在全程追踪下执行并实时输出；每次调用都需包含意图、权限范围和回滚机制。",
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
      en: "Score outcomes, refresh memories, correct drifts, and escalate when confidence is low.",
      zh: "评估任务结果、更新记忆、修正偏差；当系统信心不足时转交人工处理。",
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
      en: "Model choice determines depth, latency, and cost; reserve stronger models for hard steps.",
      zh: "模型选择决定推理深度、时延与成本；将强模型用于关键难点。",
    },
    items: [
      { en: "Frontier & compact models; structured multi-step reasoning", zh: "前沿与小型模型；结构化多步推理" },
      { en: "Select via task-level evaluations, not hype", zh: "以任务级评测为依据进行选型" },
    ],
  },
  {
    name: { en: "Orchestration", zh: "编排框架" },
    summary: {
      en: "Coordinate memory, tools, and state; prefer stateful graphs and resumable runs.",
      zh: "协调记忆、工具与状态；优先采用有状态的图式编排与可恢复运行。",
    },
    items: [
      { en: "Stateful graphs; open tool protocols (e.g., MCP)", zh: "有状态图式；开放工具协议（如 MCP）" },
      { en: "Policies/permissions and traces as first-class concerns", zh: "策略/权限与追踪作为一等关注点" },
    ],
  },
  {
    name: { en: "Safety & Governance", zh: "安全与治理" },
    summary: {
      en: "Define boundaries and approvals; implement programmable guardrails.",
      zh: "明确边界与审批；使用可编程护栏落地管控。",
    },
    items: [
      { en: "Guardrails (e.g., Colang), rate limits, content filters", zh: "护栏（如 Colang）、限流与内容过滤" },
      { en: "Human checkpoints for high-risk actions", zh: "高风险操作配置人工检查点" },
    ],
  },
  {
    name: { en: "Deployment & Operations", zh: "部署与运维" },
    summary: {
      en: "Operate like software: tracing, evaluations, canaries, and rollback.",
      zh: "以软件化方式运营：追踪、评测、金丝雀发布与回退。",
    },
    items: [
      { en: "Observability platforms; dataset-based evaluations", zh: "可观测平台；基于数据集的评测" },
      { en: "Cost/latency dashboards and continuous improvement", zh: "成本/时延看板与持续改进" },
    ],
  },
];

const RESOURCE_CATEGORIES: Array<{
  name: LocalizedText;
  items: Array<{
    title: LocalizedText;
    description: LocalizedText;
    href: string;
  }>;
}> = [
  {
    name: {
      en: "Protocols & Core APIs",
      zh: "协议与核心 API",
    },
    items: [
      {
        title: { en: "Model Context Protocol (MCP)", zh: "Model Context Protocol（MCP）" },
        description: {
          en: "Open protocol for connecting agents to tools, data, and workflows. Canonical spec & docs.",
          zh: "连接 Agent 与工具、数据与工作流的开放协议；权威规范与文档。",
        },
        href: "https://modelcontextprotocol.io",
      },
      {
        title: { en: "OpenAI Responses API", zh: "OpenAI Responses API（Agent 构建）" },
        description: {
          en: "Official API for building agentic apps with built-in tools (web/computer/file search) and tracing.",
          zh: "用于构建具备内置工具与追踪评估的 Agent 应用的官方接口。",
        },
        href: "https://platform.openai.com/docs/api-reference/responses",
      },
      {
        title: { en: "Claude Tool Use & MCP", zh: "Claude 工具使用与 MCP" },
        description: {
          en: "Developer guide to implement tools and integrate MCP with Claude agents.",
          zh: "面向开发者的工具实现指南与 MCP 集成方法。",
        },
        href: "https://docs.claude.com/en/docs/agents-and-tools/tool-use",
      },
    ],
  },
  {
    name: {
      en: "Platforms & Orchestration",
      zh: "平台与编排",
    },
    items: [
      {
        title: { en: "Agent Development Kit (ADK)", zh: "Google Agent Development Kit（ADK）" },
        description: {
          en: "Model-agnostic framework and docs for engineering agentic architectures.",
          zh: "面向工程化 Agent 架构的模型无关框架与文档。",
        },
        href: "https://google.github.io/adk-docs/",
      },
      {
        title: { en: "LangGraph Docs", zh: "LangGraph 文档（有状态 Agent 编排）" },
        description: {
          en: "Stateful orchestration, graph-based control, persistence, and human-in-the-loop patterns.",
          zh: "面向有状态编排的图式控制、持久化与人机协同模式。",
        },
        href: "https://langchain-ai.github.io/langgraph/",
      },
      {
        title: { en: "Microsoft AutoGen", zh: "Microsoft AutoGen（多 Agent 框架）" },
        description: {
          en: "Open-source framework for single/multi-agent workflows with tool use and human-in-the-loop.",
          zh: "开源多 Agent 框架，支持工具调用与人参与的工作流。",
        },
        href: "https://microsoft.github.io/autogen/stable/",
      },
      {
        title: { en: "Vertex AI Agent Builder", zh: "Google Vertex AI Agent Builder" },
        description: {
          en: "Google Cloud’s suite for building and deploying enterprise-grade multi-agent systems.",
          zh: "Google Cloud 面向企业的多 Agent 构建与部署套件与文档。",
        },
        href: "https://cloud.google.com/vertex-ai/generative-ai/docs/agent-builder/overview",
      },
    ],
  },
  {
    name: {
      en: "Safety & Observability",
      zh: "安全与可观测性",
    },
    items: [
      {
        title: { en: "NVIDIA NeMo Guardrails", zh: "NVIDIA NeMo Guardrails（护栏）" },
        description: {
          en: "Programmable guardrails (Colang) to constrain agent behaviors and add safety policies.",
          zh: "可编程护栏（Colang）以约束 Agent 行为并施加安全策略。",
        },
        href: "https://docs.nvidia.com/nemo-guardrails/index.html",
      },
      {
        title: { en: "LangSmith — Evaluations & Tracing", zh: "LangSmith — 评测与追踪" },
        description: {
          en: "Agent observability, dataset-based evals, and LLM-as-judge evaluators with rich docs.",
          zh: "Agent 可观测性、基于数据集的评测与 LLM 裁判评估的完整文档。",
        },
        href: "https://docs.langchain.com/langsmith/evaluation",
      },
      {
        title: { en: "W&B Weave — Agent Observability", zh: "Weights & Biases Weave — Agent 可观测性" },
        description: {
          en: "Docs for tracing, evaluations, and production monitoring of agentic applications.",
          zh: "关于 Agent 应用追踪、评测与生产监控的官方文档。",
        },
        href: "https://weave-docs.wandb.ai/",
      },
      {
        title: { en: "Arize Phoenix — LLM Observability", zh: "Arize Phoenix — LLM 可观测性" },
        description: {
          en: "Open-source tracing & evaluation platform with integrations for OpenAI Agents SDK.",
          zh: "开源追踪与评估平台，已适配 OpenAI Agents SDK 等生态。",
        },
        href: "https://arize.com/docs/phoenix",
      },
    ],
  },
  {
    name: {
      en: "Benchmarks & Evaluation Suites",
      zh: "基准与评测套件",
    },
    items: [
      {
        title: { en: "BrowseComp Benchmark", zh: "BrowseComp 基准（网页浏览 Agent）" },
        description: {
          en: "OpenAI’s 1,266-task benchmark for browsing agents with paper and leaderboard links.",
          zh: "OpenAI 发布的 1,266 任务网页浏览 Agent 基准（含论文/榜单）。",
        },
        href: "https://openai.com/index/browsecomp/",
      },
      {
        title: { en: "WebArena", zh: "WebArena（真实网页环境）" },
        description: {
          en: "Interactive benchmark covering realistic web navigation and productivity tasks.",
          zh: "覆盖真实网页导航与生产力任务的互动基准。",
        },
        href: "https://webarena.dev/",
      },
      {
        title: { en: "OSWorld", zh: "OSWorld（真实操作系统任务）" },
        description: {
          en: "369 real computer tasks across OS/desktop apps with execution-based evaluation.",
          zh: "覆盖多类桌面应用与操作系统的真实任务集，支持执行式评估。",
        },
        href: "https://os-world.github.io/",
      },
      {
        title: { en: "DSBench (ICLR 2025)", zh: "DSBench（ICLR 2025 数据科学 Agent 基准）" },
        description: {
          en: "Comprehensive agent benchmark for realistic data science workflows.",
          zh: "面向真实数据科学流程的综合 Agent 基准。",
        },
        href: "https://openreview.net/forum?id=DSsSPr0RZJ",
      },
    ],
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
  const currentYear = new Date().getFullYear();
  const yearMatches = date.getFullYear() === currentYear;

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

function LifecycleDiagram({ language }: { language: Language }) {
  return (
    <figure className="mx-auto mt-10 w-full max-w-3xl">
      <img
        src={resolveAssetPath("/images/lifecycle.png")}
        alt={
          language === "zh"
            ? "Agent 从问题到答案的响应流程图"
            : "Diagram showing agent flow from query to answer"
        }
        className="w-full rounded-2xl object-contain"
      />
      <figcaption className="mt-3 text-center text-xs text-[color:var(--color-muted)]">
        <a
          href="https://www.ibm.com/think/topics/react-agent#1287801558"
          target="_blank"
          rel="noopener noreferrer"
          className="font-semibold text-[color:var(--color-muted-strong)] underline-offset-2 hover:underline"
        >
          {language === "zh"
            ? "图示来源：IBM React Agent 介绍"
            : "Source: IBM React Agent overview"}
        </a>
      </figcaption>
    </figure>
  );
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
            <div className="hidden flex-col sm:flex">
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
              className={cn(
                "mt-6 w-full text-balance text-center text-4xl font-semibold leading-tight tracking-tight sm:text-left md:text-5xl lg:text-6xl",
                language === "zh" && "break-keep",
              )}
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

        <div className="mx-auto mt-12 grid w-full max-w-[1340px] gap-10 lg:grid-cols-[minmax(0,260px)_minmax(0,1fr)] lg:items-start xl:grid-cols-[minmax(0,300px)_minmax(0,1fr)]">
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
          <div className="space-y-20 lg:space-y-24 lg:pl-2 xl:pl-6">
            <section id="principles" className="mx-auto flex w-full max-w-[1100px] flex-col gap-10 py-16 lg:mx-0 lg:max-w-none">
              <div className="flex flex-col gap-4 text-center">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
                  {language === "zh" ? "核心原理" : "Core principles"}
                </h3>
                <LocalizedHeading
                  text={{
                    en: "Three loops power every successful agent",
                    zh: "Agent 核心的三大循环",
                  }}
                  language={language}
                  className="text-3xl font-semibold"
                />
              </div>
              <figure className="mx-auto mt-10 w-full max-w-3xl">
                <img
                  src={resolveAssetPath("/images/core.png")}
                  alt={
                    language === "zh"
                      ? "Agent 核心能力示意图"
                      : "Diagram of core agent capabilities"
                  }
                  className="w-full rounded-2xl object-contain"
                />
                <figcaption className="mt-3 text-center text-xs text-[color:var(--color-muted)]">
                  <a
                    href="https://www.ibm.com/think/topics/ai-agents#7281535"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[color:var(--color-muted-strong)] underline-offset-2 hover:underline"
                  >
                    {language === "zh"
                      ? "图示来源：IBM AI Agents 主题页"
                      : "Source: IBM AI Agents overview"}
                  </a>
                </figcaption>
              </figure>
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

            <section id="pipeline" className="mx-auto w-full max-w-[1100px] py-16 lg:mx-0 lg:max-w-none">
              <div className="flex flex-col gap-4 text-center">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
                  {language === "zh" ? "Agent 生命周期" : "Agent lifecycle"}
                </h3>
                <LocalizedHeading
                  text={{
                    en: "A resilient pipeline keeps perception, planning, and action honest",
                    zh: "稳健的流水线让感知、规划与执行更可靠",
                  }}
                  language={language}
                  className="text-3xl font-semibold"
                />
              </div>
              <LifecycleDiagram language={language} />
              <div className="mt-12 grid gap-10 lg:grid-cols-[minmax(0,7fr)_minmax(0,5fr)] xl:gap-12">
                <div className="relative flex flex-col gap-6 sm:pl-7 lg:pl-10">
                  <span className="absolute inset-y-6 left-3 hidden w-px bg-[color:var(--color-border)]/80 sm:block lg:left-4" aria-hidden="true" />
                  {PIPELINE_STEPS.map((step, index) => (
                    <article
                      key={step.id}
                      className="relative flex flex-col items-center gap-5 rounded-3xl border border-[color:var(--color-border)] bg-gradient-to-br from-[color:var(--color-card)] to-[color:var(--color-card)]/60 p-6 text-center shadow-sm transition hover:-translate-y-1 hover:shadow-lg sm:flex-row sm:items-start sm:text-left"
                    >
                      <div className="relative flex flex-col items-center gap-4 sm:items-center">
                        <span className="flex size-11 items-center justify-center rounded-full bg-[color:var(--color-foreground)] text-xs font-semibold tracking-[0.25em] text-[color:var(--color-background)] shadow">
                          {`0${index + 1}`.slice(-2)}
                        </span>
                        {index < PIPELINE_STEPS.length - 1 ? (
                          <span className="hidden h-full w-px bg-[color:var(--color-border)]/70 sm:block" aria-hidden="true" />
                        ) : null}
                      </div>
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
                        <div className="rounded-xl border border-dashed border-[color:var(--color-border)] bg-[color:var(--color-background)]/70 p-4 text-xs text-[color:var(--color-muted-strong)]">
                          <LocalizedParagraph text={step.artifact} language={language} />
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
                <aside className="flex flex-col gap-6 rounded-3xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/90 p-6 shadow-md">
                  {PIPELINE_CALLOUTS.map((callout) => (
                    <div
                      key={callout.key}
                      className="rounded-2xl border border-[color:var(--color-border)] bg-gradient-to-br from-[color:var(--color-background)]/85 to-[color:var(--color-card)]/70 p-5"
                    >
                      <span className="inline-flex items-center gap-2 rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-background)]/70 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted-strong)]">
                        {language === "zh" ? callout.tag.zh : callout.tag.en}
                      </span>
                      <p className="mt-3 text-lg font-semibold text-[color:var(--color-foreground)]">
                        {language === "zh" ? callout.title.zh : callout.title.en}
                      </p>
                      <LocalizedParagraph
                        text={callout.description}
                        language={language}
                        className="mt-3 text-sm text-[color:var(--color-muted)]"
                      />
                      <ul className="mt-4 flex flex-col gap-3 text-sm text-[color:var(--color-muted-strong)]">
                        {callout.bullets.map((bullet, index) => (
                          <li key={index} className="flex gap-3">
                            <span className="mt-[6px] size-1.5 rounded-full bg-[color:var(--color-accent)]" />
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

            <section id="ecosystem" className="mx-auto w-full max-w-[1100px] py-16 lg:mx-0 lg:max-w-none">
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
              <figure className="mx-auto mt-10 w-full max-w-3xl">
                <img
                  src={resolveAssetPath("/images/eco.png")}
                  alt={
                    language === "zh"
                      ? "Agent 生态层级示意图"
                      : "Diagram of agent ecosystem layers"
                  }
                  className="w-full rounded-2xl object-contain"
                />
                <figcaption className="mt-3 text-center text-xs text-[color:var(--color-muted)]">
                  <a
                    href="https://www.ibm.com/think/topics/ai-agents#7281535"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[color:var(--color-muted-strong)] underline-offset-2 hover:underline"
                  >
                    {language === "zh"
                      ? "图示来源：IBM AI Agents 主题页"
                      : "Source: IBM AI Agents overview"}
                  </a>
                </figcaption>
              </figure>
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

            <section id="collaboration" className="mx-auto w-full max-w-[1100px] py-16 lg:mx-0 lg:max-w-none">
              <div className="flex flex-col gap-4 text-center">
                <h3 className="text-xs font-semibold uppercase tracking-[0.3em] text-[color:var(--color-muted)]">
                  {language === "zh" ? "多 Agent 协作" : "Multi-agent patterns"}
                </h3>
                <LocalizedHeading
                  text={{
                    en: "Coordinate intent across multiple agents and humans",
                    zh: "在多 Agent 与人工协作者之间协调意图",
                  }}
                  language={language}
                  className="text-3xl font-semibold"
                />
                <LocalizedParagraph
                  text={{
                    en: "Shared planners, specialized workers, and human checkpoints let you compose reliable agent teams.",
                    zh: "通过共享规划者、专职执行者和关键人工检查点，可以组合出可靠的 Agent 团队。",
                  }}
                  language={language}
                  className="mx-auto max-w-2xl text-sm text-[color:var(--color-muted)]"
                  align="center"
                />
              </div>
              <figure className="mx-auto mt-10 w-full max-w-3xl">
                <img
                  src={resolveAssetPath("/images/multi_agent.png")}
                  alt={
                    language === "zh"
                      ? "多 Agent 协作模式示意图"
                      : "Diagram of multi-agent collaboration patterns"
                  }
                  className="w-full rounded-2xl object-contain"
                />
                <figcaption className="mt-3 text-center text-xs text-[color:var(--color-muted)]">
                  <a
                    href="https://www.ibm.com/think/topics/agentic-architecture#1003835715"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-semibold text-[color:var(--color-muted-strong)] underline-offset-2 hover:underline"
                  >
                    {language === "zh"
                      ? "图示来源：IBM Agentic Architecture"
                      : "Source: IBM Agentic Architecture"}
                  </a>
                </figcaption>
              </figure>
              <div className="mt-12 grid gap-6 md:grid-cols-3">
                {[{
                  key: "planner",
                  title: { en: "Central planner", zh: "集中式规划" },
                  description: {
                    en: "One planner coordinates multiple specialist agents with shared memory and guardrails.",
                    zh: "由单一规划者协调多个专职 Agent，共享记忆并统一护栏。",
                  },
                  tips: [
                    {
                      en: "Keeps tooling centralized, easier to audit.",
                      zh: "工具统一管理，便于审计。",
                    },
                    {
                      en: "Escalate to humans when planner confidence drops.",
                      zh: "当规划者信心不足时应转交人工。",
                    },
                  ],
                }, {
                  key: "marketplace",
                  title: { en: "Agent marketplace", zh: "Agent 市场" },
                  description: {
                    en: "A router selects from a pool of agents based on skill tags and historical performance.",
                    zh: "根据技能标签与历史表现，从 Agent 池中挑选合适的执行者。",
                  },
                  tips: [
                    {
                      en: "Requires consistent scoring and rate limits per agent.",
                      zh: "需要统一的评分体系与节流策略。",
                    },
                    {
                      en: "Cache frequent tasks to reduce selection latency.",
                      zh: "对高频任务做缓存可减少路由延迟。",
                    },
                  ],
                }, {
                  key: "hybrid",
                  title: { en: "Hybrid loops", zh: "混合协作" },
                  description: {
                    en: "Long-running workflows pair agents with named human roles for approvals or final delivery.",
                    zh: "在长流程任务中，引入具名人工角色负责审批或最终交付。",
                  },
                  tips: [
                    {
                      en: "Surface context packs for humans to act quickly.",
                      zh: "为人工呈现精炼的上下文包以加快决策。",
                    },
                    {
                      en: "Log human decisions back into agent memory.",
                      zh: "将人工决策写回 Agent 记忆中。",
                    },
                  ],
                }].map((card) => (
                  <article
                    key={card.key}
                    className="flex flex-col gap-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/90 p-6 shadow-sm"
                  >
                    <LocalizedHeading
                      text={card.title}
                      language={language}
                      className="text-2xl font-semibold"
                    />
                    <LocalizedParagraph
                      text={card.description}
                      language={language}
                      className="text-sm text-[color:var(--color-muted)]"
                    />
                    <ul className="flex flex-col gap-2 text-sm text-[color:var(--color-muted-strong)]">
                      {card.tips.map((tip, index) => (
                        <li key={index} className="flex gap-2">
                          <span className="mt-1 size-1.5 rounded-full bg-[color:var(--color-accent)]" />
                          <LocalizedParagraph text={tip} language={language} />
                        </li>
                      ))}
                    </ul>
                  </article>
                ))}
              </div>
            </section>

            <section id="resources" className="mx-auto w-full max-w-[1100px] py-16 lg:mx-0 lg:max-w-none">
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
              <div className="mt-12 grid gap-6 md:grid-cols-2 xl:grid-cols-2">
                {RESOURCE_CATEGORIES.map((category) => (
                  <div
                    key={category.name.en}
                    className="flex h-full flex-col gap-5 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/85 p-6 shadow-sm"
                  >
                    <LocalizedHeading
                      text={category.name}
                      language={language}
                      className="text-xl font-semibold"
                    />
                    <ul className="flex flex-col gap-4 text-sm text-[color:var(--color-foreground)]">
                      {category.items.map((item) => (
                        <li key={item.href} className="rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-background)]/70 p-4 transition hover:-translate-y-[2px] hover:border-[color:var(--color-foreground)] hover:bg-[color:var(--color-card)]">
                          <a
                            href={item.href}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="flex flex-col gap-3 text-left no-underline"
                          >
                            <span className="text-base font-semibold text-[color:var(--color-foreground)]">
                              {language === "zh" ? item.title.zh : item.title.en}
                            </span>
                            <span className="text-sm text-[color:var(--color-muted)]">
                              {language === "zh"
                                ? item.description.zh
                                : item.description.en}
                            </span>
                            <span className="text-sm font-semibold text-[color:var(--color-foreground)]">
                              {language === "zh" ? "阅读更多 →" : "Read more →"}
                            </span>
                          </a>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            </section>

            <section id="updates" className="mx-auto w-full max-w-[1100px] py-16 lg:mx-0 lg:max-w-none">
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
              </div>
              <div className="mt-8 grid gap-6 md:grid-cols-2 xl:grid-cols-3">
                {sortedNewsItems.map((item) => (
                  <article
                    key={item.id}
                    className="flex h-full flex-col gap-4 rounded-2xl border border-[color:var(--color-border)] bg-[color:var(--color-card)]/90 p-6 shadow-sm"
                  >
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
                        <LocalizedHeading
                          text={item.title}
                          language={language}
                          className="text-xl font-semibold"
                        />
                      </a>
                      <LocalizedParagraph
                        text={item.summary}
                        language={language}
                        className="text-sm text-[color:var(--color-muted)]"
                      />
                    </div>
                    <div className="mt-auto flex flex-wrap items-center justify-between gap-2 pt-2">
                      <a
                        href={item.source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex-1 min-w-0 text-sm font-semibold text-[color:var(--color-foreground)] underline-offset-4 transition hover:underline"
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
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>

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
    </div>
  );
}
