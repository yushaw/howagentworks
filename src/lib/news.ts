import { LocalizedText } from "@/lib/i18n";
import { resolveAssetPath } from "@/lib/paths";

export interface AgentNewsItem {
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

export interface AgentNewsFeed {
  schemaVersion: string;
  lastUpdated: string;
  items: AgentNewsItem[];
}

export const NEWS_DATA_PATH = resolveAssetPath("/data/agent-news.json");

export const newsFallback: AgentNewsFeed = {
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

export async function loadAgentNewsFeed(
  signal?: AbortSignal,
): Promise<AgentNewsFeed> {
  try {
    const response = await fetch(NEWS_DATA_PATH, { signal });
    if (!response.ok) {
      throw new Error(`Failed to load news feed: ${response.status}`);
    }

    const payload = (await response.json()) as AgentNewsFeed;
    if (!payload || !Array.isArray(payload.items)) {
      throw new Error("Malformed news payload");
    }

    return payload;
  } catch {
    return newsFallback;
  }
}
