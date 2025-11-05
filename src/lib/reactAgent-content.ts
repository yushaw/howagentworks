import type { LocalizedText } from "./i18n";

export interface Section {
  id: string;
  title: LocalizedText;
  content: LocalizedText;
  subsections?: Section[];
}

export const REACT_AGENT_HERO = {
  kicker: {
    en: "Deep Dive",
    zh: "深入解析",
  },
  title: {
    en: "ReactAgent Complete Lifecycle",
    zh: "ReactAgent 完整生命周期流程",
  },
  subtitle: {
    en: "This document details the complete lifecycle of ReactAgent from startup to execution, including all core mechanisms, external dependencies, and code location references.",
    zh: "本文档详细描述了 ReactAgent 从启动到执行的完整生命周期,包括所有核心机制、外部依赖和代码位置索引。",
  },
} satisfies Record<string, LocalizedText>;

export const TABLE_OF_CONTENTS = {
  title: {
    en: "Table of Contents",
    zh: "目录",
  },
  sections: [
    {
      id: "startup",
      title: { en: "Startup Phase", zh: "启动阶段" },
    },
    {
      id: "cli-init",
      title: { en: "CLI Initialization", zh: "CLI 初始化" },
    },
    {
      id: "user-input",
      title: { en: "User Input Processing", zh: "用户输入处理" },
    },
    {
      id: "langgraph-loop",
      title: { en: "LangGraph Execution Loop", zh: "LangGraph 执行循环" },
    },
    {
      id: "core-mechanisms",
      title: { en: "Core Mechanisms Explained", zh: "核心机制详解" },
      subsections: [
        { id: "mcp", title: { en: "MCP Integration", zh: "MCP 集成" } },
        { id: "delegate", title: { en: "delegate_task Delegation", zh: "delegate_task 委托" } },
        { id: "handoff", title: { en: "Agent Handoff", zh: "Agent Handoff" } },
        { id: "doc-index", title: { en: "Document Indexing & Search", zh: "文档索引与搜索" } },
        { id: "context-compression", title: { en: "Auto Context Compression", zh: "自动上下文压缩" } },
        { id: "hitl", title: { en: "HITL Mechanism", zh: "HITL 机制" } },
      ],
    },
    {
      id: "core-tools",
      title: { en: "Core Tool Implementation", zh: "核心工具实现" },
    },
    {
      id: "dependencies",
      title: { en: "External Dependencies", zh: "外部依赖清单" },
    },
  ],
} satisfies {
  title: LocalizedText;
  sections: Array<{
    id: string;
    title: LocalizedText;
    subsections?: Array<{ id: string; title: LocalizedText }>;
  }>;
};

export const SECTIONS: Section[] = [
  {
    id: "startup",
    title: { en: "Startup Phase", zh: "启动阶段" },
    content: {
      en: `The ReactAgent startup phase initializes the entire application environment, including model registry, tool registry, skill registry, agent registry, and core components.`,
      zh: `ReactAgent 启动阶段会初始化整个应用环境,包括模型注册表、工具注册表、技能注册表、代理注册表和核心组件。`,
    },
    subsections: [
      {
        id: "program-entry",
        title: { en: "Program Entry", zh: "程序入口" },
        content: {
          en: `Entry point: main.py → generalAgent/main.py:main() → generalAgent/main.py:async_main()

Code location: main.py:1-6, generalAgent/main.py:25-119`,
          zh: `入口点: main.py → generalAgent/main.py:main() → generalAgent/main.py:async_main()

代码位置: main.py:1-6, generalAgent/main.py:25-119`,
        },
      },
      {
        id: "app-init",
        title: { en: "Application Initialization", zh: "应用初始化" },
        content: {
          en: `Code location: generalAgent/runtime/app.py:build_application()

**External Dependencies:**
• Settings (Pydantic BaseSettings) ← .env
• LangSmith Tracing (observability)
• SQLite (session_store.db, indexes/)

**Core Components:**

① ModelRegistry (models/registry.py:build_default_registry)
   Code: generalAgent/models/registry.py:40-98
   - 5 slots: base/reasoning/vision/code/chat
   - Supports DeepSeek/Moonshot/GLM and other OpenAI-compatible APIs

② SkillRegistry (skills/registry.py)
   Code: generalAgent/skills/registry.py:14-156
   - Scans skills/*/SKILL.md
   - Loads skills.yaml config (enabled, auto_load_on_file_types)

③ ToolRegistry (tools/registry.py)
   Code: generalAgent/tools/registry.py:15-207
   - 3-tier architecture:
     • _discovered: All scanned tools (builtin + custom + MCP)
     • _tools: Enabled tools (tools.yaml enabled:true)
     • load_on_demand(): Dynamically load on @mention

④ AgentRegistry (agents/registry.py)
   Code: generalAgent/agents/registry.py:16-227
   - Scans agents.yaml configured specialized agents (simple/general/...)
   - Generates handoff tools (LangGraph switching mode)

⑤ ApprovalChecker (hitl/approval_checker.py)
   Code: generalAgent/hitl/approval_checker.py:20-231
   - 4-layer rules: Custom Checkers → Global Patterns → Tool Rules → Defaults
   - Config: config/hitl_rules.yaml

⑥ LangGraph Build (graph/builder.py:build_state_graph)
   Code: generalAgent/graph/builder.py:30-176
   - Nodes: agent, tools, finalize, summarization, [agent_nodes...]
   - Routing: agent_route, tools_route, summarization_route
   - Checkpointer: SQLite (data/sessions.db)

⑦ SessionManager (shared/session/manager.py)
   Code: shared/session/manager.py:17-196
   - SessionStore: Session persistence (SQLite)
   - WorkspaceManager: Isolated file workspace (data/workspace/{session_id}/)`,
          zh: `代码位置: generalAgent/runtime/app.py:build_application()

**外部依赖:**
• Settings (Pydantic BaseSettings) ← .env
• LangSmith Tracing (可观测性)
• SQLite (session_store.db, indexes/)

**核心组件构建:**

① ModelRegistry (models/registry.py:build_default_registry)
   代码: generalAgent/models/registry.py:40-98
   - 5 个插槽: base/reasoning/vision/code/chat
   - 支持 DeepSeek/Moonshot/GLM 等 OpenAI 兼容 API

② SkillRegistry (skills/registry.py)
   代码: generalAgent/skills/registry.py:14-156
   - 扫描 skills/*/SKILL.md
   - 加载 skills.yaml 配置 (enabled, auto_load_on_file_types)

③ ToolRegistry (tools/registry.py)
   代码: generalAgent/tools/registry.py:15-207
   - 3层架构:
     • _discovered: 所有扫描到的工具 (builtin + custom + MCP)
     • _tools: 启用的工具 (tools.yaml enabled:true)
     • load_on_demand(): @mention 时动态加载

④ AgentRegistry (agents/registry.py)
   代码: generalAgent/agents/registry.py:16-227
   - 扫描 agents.yaml 配置的专业 agent (simple/general/...)
   - 生成 handoff tools (LangGraph 切换模式)

⑤ ApprovalChecker (hitl/approval_checker.py)
   代码: generalAgent/hitl/approval_checker.py:20-231
   - 4层规则: Custom Checkers → Global Patterns → Tool Rules → Defaults
   - 配置: config/hitl_rules.yaml

⑥ LangGraph 构建 (graph/builder.py:build_state_graph)
   代码: generalAgent/graph/builder.py:30-176
   - Nodes: agent, tools, finalize, summarization, [agent_nodes...]
   - Routing: agent_route, tools_route, summarization_route
   - Checkpointer: SQLite (data/sessions.db)

⑦ SessionManager (shared/session/manager.py)
   代码: shared/session/manager.py:17-196
   - SessionStore: 会话持久化 (SQLite)
   - WorkspaceManager: 隔离的文件工作区 (data/workspace/{session_id}/)`,
        },
      },
    ],
  },
  // 更多章节会在后续添加...
];
