# ReactAgent Complete Lifecycle Flow Diagram

> This document provides a detailed description of the complete lifecycle of React Agent from startup to execution, including all core mechanisms, external dependencies, and code location references.

---

## Startup Phase

### 1. Application Initialization

**Code Location**: `generalAgent/runtime/app.py:build_application()`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  Application Initialization (runtime/app.py:151-267)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  [External Dependencies]                                                     │
│  • Settings (Pydantic BaseSettings) ← .env                                  │
│  • LangSmith Tracing (observability)                                        │
│  • SQLite (session_store.db, indexes/)                                      │
│                                                                              │
│  [Core Component Building]                                                  │
│  ① ModelRegistry (models/registry.py:build_default_registry)                │
│     Code: generalAgent/models/registry.py:40-98                              │
│     - 5 slots: base/reasoning/vision/code/chat                             │
│     - Supports DeepSeek/Moonshot/GLM and other OpenAI-compatible APIs      │
│                                                                              │
│  ② SkillRegistry (skills/registry.py)                                       │
│     Code: generalAgent/skills/registry.py:14-156                             │
│     - Scans skills/*/SKILL.md                                                │
│     - Loads skills.yaml config (enabled, auto_load_on_file_types)           │
│                                                                              │
│  ③ ToolRegistry (tools/registry.py)                                         │
│     Code: generalAgent/tools/registry.py:15-207                              │
│     - 3-tier architecture:                                                   │
│       • _discovered: All scanned tools (builtin + custom + MCP)            │
│       • _tools: Enabled tools (tools.yaml enabled:true)                    │
│       • load_on_demand(): Dynamically load on @mention                      │
│                                                                              │
│  ④ AgentRegistry (agents/registry.py)                                       │
│     Code: generalAgent/agents/registry.py:16-227                             │
│     - Scans agents.yaml configured specialized agents (simple/general/...)  │
│     - Generates handoff tools (LangGraph switching mode)                    │
│                                                                              │
│  ⑤ ApprovalChecker (hitl/approval_checker.py)                               │
│     Code: generalAgent/hitl/approval_checker.py:20-231                       │
│     - 4-tier rules: Custom Checkers → Global Patterns → Tool Rules → Defaults   │
│     - Config: config/hitl_rules.yaml                                         │
│                                                                              │
│  ⑥ LangGraph Build (graph/builder.py:build_state_graph)                     │
│     Code: generalAgent/graph/builder.py:30-176                               │
│     - Nodes: agent, tools, finalize, summarization, [agent_nodes...]       │
│     - Routing: agent_route, tools_route, summarization_route               │
│     - Checkpointer: SQLite (data/sessions.db)                              │
│                                                                              │
│  ⑦ SessionManager (shared/session/manager.py)                               │
│     Code: shared/session/manager.py:17-196                                   │
│     - SessionStore: Session persistence (SQLite)                            │
│     - WorkspaceManager: Isolated file workspace (data/workspace/{session_id}/)      │
└─────────────────────────────────────────────────────────────────────────────┘
```

### MCP Integration

**Code Location**: `generalAgent/main.py:32-59`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  MCP (Model Context Protocol) Integration                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/main.py:36-59                                            │
│  Tools: generalAgent/tools/mcp/                                              │
│                                                                              │
│  ① Load config: config/mcp_servers.yaml                                     │
│     Format: {server_id, command, args, env, enabled}                        │
│                                                                              │
│  ② Create MCPServerManager (lazy startup mode)                              │
│     Code: generalAgent/tools/mcp/manager.py:19-157                           │
│     - Server not started, only configured                                   │
│                                                                              │
│  ③ Create MCP Tool Wrappers                                                 │
│     Code: generalAgent/tools/mcp/wrapper.py:13-99                            │
│     - Each MCP tool wrapped as LangChain tool                               │
│     - tool.invoke() → start server → call tool → return result              │
│                                                                              │
│  ④ Register to ToolRegistry                                                 │
│     - _discovered (@mentionable)                                             │
│     - _tools (immediately available if enabled:true)                        │
│                                                                              │
│  ⑤ Auto cleanup on program exit                                             │
│     Code: generalAgent/main.py:103-106                                       │
│     - await mcp_manager.shutdown()                                          │
│     - Close all MCP server processes                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## CLI Initialization

**Code Location**: `generalAgent/cli.py:31-106`, `generalAgent/main.py:64-96`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  CLI Startup (cli.py:GeneralAgentCLI)                                       │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/main.py:74-95                                            │
│                                                                              │
│  • Create new session: session_id = UUID4                                   │
│    Code: shared/session/manager.py:50-74                                     │
│                                                                              │
│  • Initialize workspace: data/workspace/{session_id}/                       │
│    Code: shared/workspace/manager.py:55-107                                  │
│    - uploads/    (user uploaded files)                                      │
│    - outputs/    (Agent generated files)                                    │
│    - skills/     (symlink to project skills/)                               │
│    - temp/       (temporary files)                                          │
│                                                                              │
│  • Initialize state:                                                        │
│    Code: generalAgent/runtime/app.py:241-264                                 │
│    {                                                                         │
│      messages: [],                                                           │
│      todos: [],                                                              │
│      mentioned_agents: [],                                                   │
│      workspace_path: str,                                                    │
│      uploaded_files: [],                                                     │
│      ...                                                                     │
│    }                                                                         │
│                                                                              │
│  • Print welcome message: Session ID, Log file                              │
│    Code: generalAgent/cli.py:96-104                                          │
│                                                                              │
│  • Enter interaction loop: You>                                             │
│    Code: shared/cli/base_cli.py:67-100                                       │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## User Input Processing

**Code Location**: `generalAgent/cli.py:111-241`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  User Input Processing (cli.py:handle_user_message)                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  [Step 1] Parse @mentions                                                   │
│  Code: generalAgent/cli.py:121-155                                           │
│  Tools: generalAgent/utils/__init__.py:parse_mentions()                      │
│        generalAgent/utils/mention_classifier.py:classify_mentions()          │
│                                                                              │
│    • @tool    → dynamically load tool into visible_tools                    │
│    • @skill   → symlink to workspace/skills/ + generate reminder            │
│    • @agent   → load call_agent/delegate_task tools                         │
│                                                                              │
│  [Step 2] Parse #filename (file upload)                                     │
│  Code: generalAgent/cli.py:124-194                                           │
│  Tools: generalAgent/utils/__init__.py:parse_file_mentions()                 │
│        generalAgent/utils/file_processor.py:process_file()                   │
│                                                                              │
│    • Move file to workspace/uploads/                                        │
│    • Images: convert to base64 and inject into HumanMessage                │
│    • Text: inject directly into message content                            │
│    • Auto-load skills: based on skills.yaml auto_load_on_file_types        │
│                                                                              │
│  [Step 3] Build HumanMessage                                                │
│  Code: generalAgent/cli.py:196-230                                           │
│                                                                              │
│    message_content = [                                                       │
│      {type: "text", text: cleaned_input},                                   │
│      {type: "image_url", image_url: "data:base64,..."},  # if images        │
│      ...                                                                     │
│    ]                                                                         │
│                                                                              │
│  [Step 4] Set environment variables                                         │
│  Code: generalAgent/cli.py:246-249                                           │
│                                                                              │
│    os.environ["AGENT_WORKSPACE_PATH"] = workspace_path                       │
│                                                                              │
│  [Step 5] Configure LangGraph execution                                     │
│  Code: generalAgent/cli.py:251-258                                           │
│                                                                              │
│    • recursion_limit = max_loops * 3 (agent+tools+finalize)                │
│    • config = {thread_id, recursion_limit}                                 │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## LangGraph Execution Loop

**Code Location**: `generalAgent/cli.py:260-330`, `generalAgent/graph/`

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  LangGraph Execution Loop (app.astream)                                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/cli.py:264-330                                           │
│                                                                              │
│  Flow: START → agent ⇄ tools → agent ⇄ summarization → finalize → END      │
└─────────────────────────────────────────────────────────────────────────────┘

       ├───► [Node: agent] (graph/nodes/planner.py:planner_node)
       │     Code: generalAgent/graph/nodes/planner.py:109-482
       │
       │     ├─ [A. Assemble visible_tools] (lines 118-181)
       │     │   • persistent_global_tools (core tools)
       │     │   • @mention tools (load_on_demand)
       │     │   • @agent → call_agent + delegate_task
       │     │   • Capability detection: code/vision tags
       │     │   • Delegation filtering: subagent cannot use delegate_task
       │     │
       │     ├─ [B. Build SystemMessage (fixed, KV Cache optimized)] (lines 86-106)
       │     │   Code: generalAgent/graph/prompts.py:PLANNER_SYSTEM_PROMPT
       │     │   • Static part: PLANNER_SYSTEM_PROMPT + skills_catalog + agents_catalog
       │     │   • Timestamp: <current_datetime>YYYY-MM-DD HH:MM UTC</> (fixed at startup)
       │     │   • Position: timestamp at bottom (maximize KV Cache reuse)
       │     │
       │     ├─ [C. Build Dynamic Reminders (dynamic, append to last HumanMessage)] (lines 213-306)
       │     │   Code: generalAgent/graph/prompts.py:build_dynamic_reminder()
       │     │   • @mention hints: newly loaded tools/skills/agents
       │     │   • Todo reminders: in_progress + pending task list
       │     │   • File upload hints: newly uploaded files + available skill hints
       │     │   • Token warnings: info/warning/critical levels
       │     │
       │     ├─ [D. Context Management (token tracking)] (lines 308-360)
       │     │   Code: generalAgent/context/token_tracker.py:TokenTracker
       │     │   • Accumulate prompt_tokens (API returns current context size)
       │     │   • Check token_status: info(<75%) / warning(<85%) / critical(<95%)
       │     │   • critical → skip LLM, return needs_compression=True (routing triggers compression)
       │     │   • info/warning → dynamically load compact_context tool
       │     │
       │     ├─ [E. Model Selection] (lines 410-423)
       │     │   Code: generalAgent/agents/invoke_planner.py:invoke_planner()
       │     │   [External Dependency: OpenAI-compatible API]
       │     │   • Priority: preference > vision > code > base
       │     │   • ModelResolver: select model based on capabilities
       │     │   • bind_tools(visible_tools)
       │     │
       │     ├─ [F. LLM Invocation] (lines 410-423)
       │     │   • Input: SystemMessage + message_history (with reminders)
       │     │   • Output: AIMessage (content + tool_calls)
       │     │   • Error handling: handle_model_error() → ModelInvocationError
       │     │
       │     └─ [G. Update state] (lines 428-478)
       │         • messages.append(AIMessage)
       │         • loops += 1
       │         • cumulative_prompt_tokens = API response
       │         • new_uploaded_files = [] (clear one-time reminder)
       │         • new_mentioned_agents = [] (clear one-time reminder)
       │
       ├───► [Routing: agent_route] (graph/routing.py:agent_route)
       │     Code: generalAgent/graph/routing.py:14-62
       │
       │     ├─ Check: loops >= max_loops? → "finalize"
       │     ├─ Check: needs_compression && !auto_compressed? → "summarization"
       │     ├─ Check: tool_calls? → "tools"
       │     └─ Default → "finalize"
       │
       ├───► [Node: summarization] (if critical token)
       │     Code: generalAgent/graph/nodes/summarization.py:build_summarization_node()
       │
       │     [External Dependency: LLM API]
       │     ├─ [A. Layer messages] (context/compressor.py:232-288)
       │     │   • system: keep all SystemMessage
       │     │   • old: messages to compress (early messages)
       │     │   • recent: messages to keep (15% context window or 10 messages)
       │     │
       │     ├─ [B. LLM compression] (context/compressor.py:301-341)
       │     │   • Prompt: COMPACT_PROMPT (7-part structured summary)
       │     │   • Call LLM (max_tokens=1440)
       │     │   • Generate SystemMessage("# Conversation History Summary...")
       │     │
       │     ├─ [C. Clean orphan ToolMessage] (context/compressor.py:342-379)
       │     │   • Filter ToolMessage without corresponding tool_call_id
       │     │
       │     ├─ [D. Fallback strategy] (if LLM compression fails)
       │     │   Code: context/compressor.py:201-208
       │     │   • Simple truncation: keep recent MAX_MESSAGE_HISTORY messages
       │     │
       │     └─ [E. Update state]
       │         • messages = [system, summary, ...recent]
       │         • auto_compressed_this_request = True
       │         • compact_count += 1
       │         • Compression report: before/after count, tokens, ratio
       │
       ├───► [Routing: summarization_route]
       │     Code: generalAgent/graph/routing.py:87-98
       │     └─ Always → "agent" (continue processing original request)
       │
       ├───► [Node: tools] (hitl/approval_node.py:ApprovalToolNode)
       │     Code: generalAgent/hitl/approval_node.py:35-110
       │
       │     [External Dependency: Tool execution environment (bash, Python, network...)]
       │     ├─ [A. HITL approval check] (4-tier rules)
       │     │   Code: generalAgent/hitl/approval_checker.py:check()
       │     │   • Layer 1: Custom Checkers (tool-specific logic)
       │     │   • Layer 2: Global Patterns (sensitive info, passwords...)
       │     │   • Layer 3: Tool Config Rules (hitl_rules.yaml)
       │     │   • Layer 4: Default Rules (safe commands)
       │     │   │
       │     │   └─ Need approval? → interrupt({"type": "tool_approval", ...})
       │     │       Code: hitl/approval_node.py:74-92
       │     │       ┌─────────────────────────────────────┐
       │     │       │ [HITL: User Approval] (cli.py:467-503)   │
       │     │       │ • Print: tool name, args, risk level         │
       │     │       │ • User choice: y/n                      │
       │     │       │ • Return: "approve"/"reject"           │
       │     │       └─────────────────────────────────────┘
       │     │
       │     ├─ [B. Tool execution] (ToolNode)
       │     │   Code: langgraph.prebuilt.ToolNode
       │     │   • Call tool_func(**args)
       │     │   • Generate ToolMessage(result)
       │     │   • Error handling: ToolMessage(error)
       │     │
       │     └─ [C. Update state]
       │         • messages.append(ToolMessage)
       │
       ├───► [Routing: tools_route]
       │     Code: generalAgent/graph/routing.py:65-84
       │
       │     ├─ Check: is handoff? (Command.goto) → target_agent
       │     └─ Default → current_agent (or "agent")
       │
       ├───► [Node: finalize] (graph/nodes/finalize.py:finalize_node)
       │     Code: generalAgent/graph/nodes/finalize.py:45-97
       │
       │     [Only trigger if last message is ToolMessage]
       │     ├─ [A. Build Finalize Prompt (fixed, KV Cache)] (lines 34-42)
       │     │   • FINALIZE_SYSTEM_PROMPT + fixed timestamp
       │     │
       │     ├─ [B. LLM Invocation (no tools)] (lines 79-92)
       │     │   • Input: SystemMessage + recent_history
       │     │   • Output: AIMessage (final response)
       │     │
       │     └─ [C. Update state]
       │         • messages.append(AIMessage)
       │
       └───► [END]
              │
              ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  HITL Interrupt Handling Loop (cli.py:_handle_interrupt)                    │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/cli.py:279-320, 410-503                                  │
│                                                                              │
│  [Loop check graph_state.tasks[0].interrupts]                               │
│                                                                              │
│  ① interrupt_type = "user_input_request" (ask_human tool)                  │
│     Code: generalAgent/cli.py:430-465                                        │
│     • Print: question, context, default                                     │
│     • User input: answer                                                    │
│     • Resume: Command(resume=answer)                                        │
│                                                                              │
│  ② interrupt_type = "tool_approval" (HITL approval)                        │
│     Code: generalAgent/cli.py:467-503                                        │
│     • Print: tool, args, reason, risk_level                                │
│     • User input: y/n                                                       │
│     • Resume: Command(resume="approve"/"reject")                           │
│                                                                              │
│  • Continue app.astream(Command(resume=...))                                │
│  • Print new messages (avoid duplicates)                                   │
│  • Until no more interrupts                                                │
└─────────────────────────────────────────────────────────────────────────────┘
                                        │
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────┐
│  Session Save (session_manager.save_current_session)                        │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: shared/session/manager.py:130-147                                     │
│                                                                              │
│  [External Dependency: SQLite]                                               │
│  • SessionStore.save(session_id, state)                                     │
│  • Save to data/sessions.db (messages, todos, uploaded_files...)            │
│  • Log: Session {id} saved ({N} messages)                                   │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Mechanisms Deep Dive

### MCP Integration

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Startup Phase] MCP Integration (generalAgent/main.py)                     │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/main.py:36-59                                            │
│                                                                              │
│  ① Load config: generalAgent/config/mcp_servers.yaml                        │
│     - server_id, command, args, env                                         │
│     - enabled servers only                                                  │
│                                                                              │
│  ② Create MCPServerManager (lazy startup mode)                              │
│     Code: generalAgent/tools/mcp/manager.py:19-157                           │
│     - Server not started, only configured                                   │
│                                                                              │
│  ③ Create MCP Tool Wrappers                                                 │
│     Code: generalAgent/tools/mcp/wrapper.py:13-99                            │
│     - Each MCP tool wrapped as LangChain tool                               │
│     - tool.invoke() → start server → call tool → return result              │
│                                                                              │
│  ④ Register to ToolRegistry                                                 │
│     Code: generalAgent/runtime/app.py:82-88                                  │
│     - _discovered (@mentionable)                                             │
│     - _tools (immediately available if enabled:true)                        │
│                                                                              │
│  ⑤ Auto cleanup on program exit                                             │
│     Code: generalAgent/main.py:103-106                                       │
│     - await mcp_manager.shutdown()                                          │
│     - Close all MCP server processes                                        │
└─────────────────────────────────────────────────────────────────────────────┘
```

### delegate_task Delegation

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Tools Node] delegate_task Tool Invocation                                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/tools/builtin/delegate_task.py:39-304                    │
│                                                                              │
│  ① Get parent state (via config injection) (lines 88-94)                   │
│     - mentioned_agents, active_skill, workspace_path, uploaded_files        │
│                                                                              │
│  ② Create independent subagent state (lines 96-125)                         │
│     - context_id: subagent-{uuid8}                                          │
│     - messages: [HumanMessage(task)]                                        │
│     - Inherit: mentioned_agents, workspace_path, uploaded_files             │
│     - Independent: todos=[], loops=0, max_loops=50                          │
│                                                                              │
│  ③ Execute subagent (app.astream) (lines 136-167)                           │
│     ┌─────────────────────────────────────────────────────────────┐         │
│     │  Subagent Loop (independent LangGraph execution)              │         │
│     │  • agent → tools → agent → ... → finalize                   │         │
│     │  • Visible tools: inherited from parent's @mentioned tools   │         │
│     │  • Not visible: delegate_task (prevent nesting)              │         │
│     │  • HITL support: ask_human interrupt passed to user          │         │
│     └─────────────────────────────────────────────────────────────┘         │
│                                                                              │
│  ④ Real-time output: [subagent-{uuid8}] ... (lines 158-165)                 │
│                                                                              │
│  ⑤ HITL interrupt handling (lines 168-229)                                  │
│     - Detect interrupt (ask_human)                                          │
│     - Print question to user                                                │
│     - User input → resume execution                                         │
│                                                                              │
│  ⑥ Result length check (lines 242-283)                                      │
│     - If result < 200 chars → auto request detailed summary (max 1 retry)   │
│     - Continue execution: "Please provide a more detailed summary..."       │
│                                                                              │
│  ⑦ Return JSON result (lines 285-295)                                       │
│     {"ok": true, "result": "...", "context_id": "...", "loops": N}          │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Agent Handoff

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Graph Build] Agent Handoff Tool Generation (runtime/app.py)               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/runtime/app.py:188-207                                   │
│                                                                              │
│  ① AgentRegistry scan (agents.yaml)                                         │
│     Code: generalAgent/agents/scanner.py:scan_agents_from_config()           │
│     - simple: SimpleAgent (general conversation, no skill requirements)     │
│     - general: GeneralAgent (general tasks, rich tools)                     │
│     - ...                                                                   │
│                                                                              │
│  ② Generate handoff tool for each enabled agent                             │
│     Code: generalAgent/agents/handoff_tools.py:22-61                         │
│     - tool name: transfer_to_{agent_id}                                     │
│     - description: agent.description + skills                               │
│     - func: return Command(goto=agent_id, update={...})                     │
│                                                                              │
│  ③ Loop detection logic (lines 114-158)                                     │
│     • agent_call_stack: [agent, simple, ...]                               │
│     • Check 1: agent_id already in stack? → reject (return ToolMessage error)              │
│     • Check 2: stack depth >= 5? → reject (prevent stack overflow)          │
│                                                                              │
│  ④ Register to ToolRegistry (lines 199-203)                                 │
│     - Immediately enabled (core tools)                                      │
│     - Visible to all agents                                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  [Tools Node] transfer_to_{agent_id} Execution                              │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/agents/handoff_tools.py:100-181                          │
│                                                                              │
│  ① Loop detection (lines 114-158)                                           │
│     - agent_call_stack contains agent_id? → return error ToolMessage        │
│     - stack depth >= 5? → return error ToolMessage                          │
│                                                                              │
│  ② Create handoff message (lines 160-169)                                   │
│     - ToolMessage: "✓ Transferred to {agent_name}"                          │
│     - HumanMessage: task (new task description)                             │
│                                                                              │
│  ③ Update state (lines 170-176)                                             │
│     - agent_call_stack.append(agent_id)                                     │
│     - agent_call_history.append(agent_id)                                   │
│     - current_agent = agent_id                                              │
│                                                                              │
│  ④ Return Command (lines 178-181)                                           │
│     return Command(goto=agent_id, update={...})                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  [Routing] tools_route handles handoff                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/graph/routing.py:65-84                                   │
│                                                                              │
│  • Check state["current_agent"]                                              │
│  • Return current_agent (e.g., "simple")                                    │
│  • LangGraph routes to corresponding agent node                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  [Agent Node: simple] SimpleAgent Execution                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/graph/nodes/agent_node.py:build_agent_node_from_card()   │
│                                                                              │
│  • Use dedicated SystemMessage (SIMPLE_AGENT_PROMPT)                         │
│  • Only basic tools (no delegate_task, no complex tools)                    │
│  • Return Command(goto="agent", ...) back to main agent after completion    │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Document Indexing and Search

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Tool: search_file] Document Content Search                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/tools/builtin/search_file.py:31-94                       │
│                                                                              │
│  ① Check file type (lines 82-90)                                            │
│     • Document types (PDF/DOCX/XLSX/PPTX) → index search flow               │
│     • Text files (.txt/.log/.py...) → real-time Grep search                 │
│                                                                              │
│  ② Check if index exists                                                    │
│     Code: generalAgent/utils/text_indexer.py:103-129                         │
│     [External Dependency: SQLite, data/indexes.db]                           │
│     • Calculate MD5: file_hash = md5(file_content)                          │
│     • Query: SELECT indexed_at FROM file_metadata WHERE file_hash=?         │
│     • Check expiry: indexed_at < now - 24h? → rebuild                       │
│                                                                              │
│  ③ Create index (if not exists or expired)                                  │
│     Code: generalAgent/utils/text_indexer.py:154-226                         │
│     [External Dependency: PyMuPDF, python-docx, openpyxl, python-pptx, jieba]          │
│     ┌─────────────────────────────────────────────────────────────┐         │
│     │ A. Document chunking                                         │         │
│     │   Code: generalAgent/utils/document_extractors.py:239-264    │         │
│     │   • PDF: extract by page → content-aware chunking (400 chars, 20% overlap)   │         │
│     │   • DOCX: extract paragraphs → content-aware chunking        │         │
│     │   • XLSX: by sheet → row batches (20 rows/batch, 2 row overlap)              │         │
│     │   • PPTX: by slide → split large slides                      │         │
│     │                                                              │         │
│     │ B. Chinese preprocessing (jieba, configurable)               │         │
│     │   Code: text_indexer.py:132-151                              │         │
│     │   • jieba.cut_for_search(text) → "Chinese word segmentation results"           │         │
│     │                                                              │         │
│     │ C. Store in SQLite FTS5                                      │         │
│     │   Code: text_indexer.py:43-100                               │         │
│     │   • file_metadata: file info + full_text                     │         │
│     │   • chunks_fts: FTS5 table (text, text_jieba)                │         │
│     │   • chunks_meta: chunk metadata (page, offset)               │         │
│     └─────────────────────────────────────────────────────────────┘         │
│                                                                              │
│  ④ Search strategy selection                                                │
│     Code: generalAgent/utils/text_indexer.py:229-268                         │
│     • Detect query type: _should_use_fts5(query, use_regex)                 │
│     • Simple queries ("baseline", "section 4.1") → FTS5                     │
│     • Complex regex (\d{3}-\d{4}, ^ERROR.*) → FTS5 extract keywords + re post-process         │
│     • Super complex regex (.*(?<!\d)\|...) → direct Grep full_text          │
│                                                                              │
│  ⑤ FTS5 search (high-performance path)                                      │
│     Code: generalAgent/utils/text_indexer.py:520-702                         │
│     ┌─────────────────────────────────────────────────────────────┐         │
│     │ • Escape special chars: "4.1" (auto quote decimal numbers)  │         │
│     │   Code: text_indexer.py:335-360                              │         │
│     │ • Dual-field search:                                         │         │
│     │   - text MATCH query (English, Porter stemmer)              │         │
│     │   - text_jieba MATCH query (Chinese segmentation)            │         │
│     │   Code: text_indexer.py:606-641                              │         │
│     │ • BM25 ranking: ORDER BY bm25(chunks_fts)                   │         │
│     │ • Expand context: get more text from adjacent chunks         │         │
│     │   Code: text_indexer.py:439-517                              │         │
│     │ • Regex filtering (if use_regex): re.search(pattern, text)  │         │
│     │   Code: text_indexer.py:395-436                              │         │
│     └─────────────────────────────────────────────────────────────┘         │
│                                                                              │
│  ⑥ Grep search (full regex support path)                                    │
│     Code: generalAgent/utils/text_indexer.py:271-332                         │
│     ┌─────────────────────────────────────────────────────────────┐         │
│     │ • Read full_text from file_metadata                          │         │
│     │ • Python re.finditer(pattern, full_text)                    │         │
│     │ • Extract context (context_chars)                            │         │
│     │ • Add ellipsis "..."                                         │         │
│     └─────────────────────────────────────────────────────────────┘         │
│                                                                              │
│  ⑦ Return results (lines 185-213)                                           │
│     [{"chunk_id": 0, "page": 5, "text": "...", "score": 12.34}, ...]       │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  [Index Management] Global Index Database (data/indexes.db)                 │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/utils/text_indexer.py:29-807                             │
│                                                                              │
│  • MD5 deduplication: same content indexed only once                        │
│  • Expiry detection: after 24 hours marked as stale, rebuild index          │
│  • Orphan cleanup: when same-name file overwritten, auto delete old hash index                          │
│    Code: text_indexer.py:731-753                                             │
│  • Periodic cleanup: cleanup_old_indexes(days=30)                           │
│    Code: text_indexer.py:755-783                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

### Automatic Context Compression

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Routing Trigger] Automatic Compression Detection                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/graph/nodes/planner.py:308-356                           │
│                                                                              │
│  ① Token tracking                                                           │
│     • cumulative_prompt_tokens (API returns current context size)           │
│     • TokenTracker.check_status() → {level, usage_ratio, message}          │
│                                                                              │
│  ② Threshold detection                                                      │
│     • info: <75%                                                             │
│     • warning: 75-85%                                                        │
│     • critical: >95% → set needs_compression=True                           │
│                                                                              │
│  ③ Routing decision                                                         │
│     Code: generalAgent/graph/routing.py:37-45                                │
│     • needs_compression && !auto_compressed → "summarization"               │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  [Node: summarization] Compression Execution                                │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/graph/nodes/summarization.py:32-102                      │
│                                                                              │
│  ① Check conditions (lines 39-47)                                           │
│     • Message count >= 15?                                                  │
│     • context.enabled?                                                       │
│                                                                              │
│  ② Call ContextManager.compress_context()                                   │
│     Code: generalAgent/context/manager.py:24-81                              │
│     ┌─────────────────────────────────────────────────────────────┐         │
│     │ A. Layer messages                                            │         │
│     │   Code: context/compressor.py:232-288                        │         │
│     │   • system: keep all SystemMessage                          │         │
│     │   • old: to compress (early messages)                       │         │
│     │   • recent: to keep (15% context window or 10 messages)     │         │
│     │                                                              │         │
│     │ B. LLM compression                                           │         │
│     │   Code: context/compressor.py:301-341                        │         │
│     │   • Prompt: COMPACT_PROMPT (7-part structured summary)      │         │
│     │   • Call base model (max_tokens=1440)                       │         │
│     │   • Generate summary SystemMessage                           │         │
│     │                                                              │         │
│     │ C. Clean orphan ToolMessage                                  │         │
│     │   Code: context/compressor.py:342-379                        │         │
│     │   • Filter ToolMessage without corresponding tool_call_id   │         │
│     │                                                              │         │
│     │ D. Fallback strategy (on failure)                            │         │
│     │   Code: context/compressor.py:201-208                        │         │
│     │   • Simple truncation: keep recent 150 messages              │         │
│     └─────────────────────────────────────────────────────────────┘         │
│                                                                              │
│  ③ Update state (lines 70-80)                                               │
│     • messages = compressed                                                  │
│     • auto_compressed_this_request = True                                    │
│     • compact_count += 1                                                     │
│     • cumulative_prompt_tokens = 0 (reset)                                   │
│                                                                              │
│  ④ Route back to agent (continue processing original request)               │
│     Code: generalAgent/graph/routing.py:87-98                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### HITL Mechanism

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  [Tool Approval] 4-Tier Rule System                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/hitl/approval_checker.py:40-231                          │
│  Config: generalAgent/config/hitl_rules.yaml                                 │
│                                                                              │
│  ① Layer 1: Custom Checkers (tool-specific logic)                          │
│     Code: approval_checker.py:157-231                                        │
│     Example: check_bash_command() detects rm -rf                            │
│                                                                              │
│  ② Layer 2: Global Patterns (cross-tool detection)                         │
│     Code: approval_checker.py:86-122                                         │
│     Config: hitl_rules.yaml:global.risk_patterns                             │
│     • password/api_key/secret detection                                     │
│     • /etc/passwd, DROP TABLE detection                                     │
│                                                                              │
│  ③ Layer 3: Tool Config Rules                                               │
│     Code: approval_checker.py:124-155                                        │
│     Config: hitl_rules.yaml:tools.{tool_name}                                │
│     • Each tool independently configured                                    │
│     • high_risk/medium_risk patterns                                        │
│                                                                              │
│  ④ Layer 4: Default Rules (fallback)                                        │
│     • SAFE_COMMANDS = ["ls", "pwd", "cat", ...]                             │
│     • Default allow safe commands                                           │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  [ApprovalToolNode] Tool Execution Interception                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/hitl/approval_node.py:35-110                             │
│                                                                              │
│  ① Intercept tool_calls (lines 48-69)                                       │
│     • Check AIMessage.tool_calls                                             │
│                                                                              │
│  ② Check approval for each (lines 64-92)                                    │
│     • decision = approval_checker.check(tool_name, args)                    │
│     • needs_approval? → interrupt({"type": "tool_approval"})                │
│                                                                              │
│  ③ User decision handling (lines 84-107)                                    │
│     • user_decision == "reject" → generate error ToolMessage                │
│     • user_decision == "approve" → continue execution                       │
│                                                                              │
│  ④ Execute tool (lines 109-110)                                             │
│     • await ToolNode.ainvoke(state)                                         │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  [ask_human] Proactive User Input Request                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/tools/builtin/ask_human.py:26-101                        │
│                                                                              │
│  ① Agent invocation (lines 71-90)                                           │
│     • ask_human(question, context, default, required)                       │
│     • Trigger interrupt({"type": "user_input_request"})                     │
│                                                                              │
│  ② CLI handles interrupt (lines 430-465)                                    │
│     Code: generalAgent/cli.py:430-465                                        │
│     • Print question: 💬 question                                           │
│     • User input: answer                                                    │
│     • Resume: Command(resume=answer)                                        │
│                                                                              │
│  ③ Return result (lines 90-100)                                             │
│     • answer (user input)                                                   │
│     • default (if user presses enter directly)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Core Tool Implementation

### 1. File Operation Tools

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  read_file(path)                                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/tools/builtin/file_ops.py:30-161                         │
│                                                                              │
│  [Security Checks] (lines 54-90)                                            │
│  • Reject path traversal: ".." or "/" prefix → Error                        │
│  • Workspace isolation: path.relative_to(workspace_root)                    │
│  • Symlink resolution must still be within workspace                        │
│                                                                              │
│  [Read Strategy]                                                             │
│  ① Text files (lines 98-116)                                                │
│     • <100KB: full content                                                  │
│     • >100KB: first 50K chars + truncation hint                             │
│                                                                              │
│  ② Document files (lines 118-151)                                           │
│     Code: generalAgent/utils/document_extractors.py                          │
│     [External Dependency: PyMuPDF, python-docx, openpyxl, python-pptx]      │
│     • PDF/DOCX: first 10 pages (~30K chars)                                 │
│     • XLSX: first 3 sheets (~20K chars)                                     │
│     • PPTX: first 15 slides (~25K chars)                                    │
│                                                                              │
│  [No workspace fallback] (lines 59-74)                                      │
│  • Allow reading project skills/ directory (read-only access to SKILL.md)   │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  write_file(path, content)                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/tools/builtin/file_ops.py:164-235                        │
│                                                                              │
│  [Security Restrictions] (lines 189-223)                                    │
│  • Only write to: uploads/, outputs/, temp/ (skills/ forbidden)             │
│  • Reject path traversal: ".." or "/" prefix                                │
│  • Auto-create parent directories: parent.mkdir(parents=True)               │
│                                                                              │
│  [Write Strategy] (lines 225-230)                                           │
│  • Overwrite mode: overwrite if exists                                      │
│  • UTF-8 encoding: encoding="utf-8"                                          │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  edit_file(path, old_string, new_string, replace_all)                      │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/tools/builtin/edit_file.py:17-122                        │
│                                                                              │
│  [Security] (lines 49-77)                                                   │
│  • Only edit: uploads/, outputs/, temp/                                     │
│                                                                              │
│  [Replacement Logic] (lines 87-109)                                         │
│  ① Check old_string exists                                                  │
│  ② Count occurrences                                                        │
│  ③ replace_all=False and multiple occurrences → Error                       │
│  ④ replace_all=True → replace all occurrences                               │
│                                                                              │
│  [Typical Usage]                                                            │
│  • Exact replacement at single location: replace_all=False (default)        │
│  • Batch rename variables: replace_all=True                                 │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  list_workspace_files(directory)                                            │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/tools/builtin/file_ops.py:238-316                        │
│                                                                              │
│  [Security] (lines 251-278)                                                 │
│  • Only list directories within workspace                                   │
│  • Filter hidden files: skip .metadata.json, .indexes/                      │
│                                                                              │
│  [Output Format] (lines 284-309)                                            │
│  📁 uploads/                                                                 │
│  📄 uploads/report.pdf (1024 bytes)                                          │
│  📄 outputs/result.txt (256 bytes)                                           │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 2. Search Tools

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  find_files(pattern, path)                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/tools/builtin/find_files.py:18-146                       │
│                                                                              │
│  [Glob Patterns] (lines 22-32)                                              │
│  • "*": match any characters                                                │
│  • "**": recursively match directories                                      │
│  • "?": match single character                                              │
│  • "[abc]": match character set                                             │
│  • "{pdf,docx}": match multiple extensions                                  │
│                                                                              │
│  [Execution] (lines 86-106)                                                 │
│  • matches = search_path.glob(pattern)                                      │
│  • Filter: only return files, skip hidden files, skip .indexes/             │
│                                                                              │
│  [Sorting] (line 119)                                                       │
│  • Sort by modification time descending (newest first)                      │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  search_file(path, query, max_results, context_chars, use_regex)           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/tools/builtin/search_file.py:31-268                      │
│                                                                              │
│  [Routing Strategy] (lines 82-90)                                           │
│  • Text files → _search_text_file() (real-time scan)                        │
│  • Document files → _search_document_file() (index search)                  │
│                                                                              │
│  [Text File Search] (lines 97-158)                                          │
│  ① Line-by-line scan: if query_lower in line.lower()                        │
│  ② Extract context: 1 line before and after                                 │
│  ③ Highlight match: **match** (markdown bold)                               │
│                                                                              │
│  [Document File Search] (lines 161-213)                                     │
│  [External Dependency: SQLite FTS5, jieba, PyMuPDF, python-docx, openpyxl, pptx]       │
│  ① Check index: index_exists() (line 165)                                   │
│  ② Create index: create_index() (first time or expired) (lines 167-175)     │
│  ③ Execute search: search_in_index() (lines 178-182)                        │
│     - FTS5 search (simple queries)                                          │
│     - FTS5 + re post-processing (complex regex)                             │
│     - Grep full_text (super complex regex)                                  │
│  ④ Format output (lines 194-213)                                            │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 3. Bash Execution Tool

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  run_bash_command(command, timeout)                                         │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/tools/builtin/run_bash_command.py:18-96                  │
│                                                                              │
│  [Execution Environment] (lines 42-66)                                      │
│  • Working directory: workspace_path (isolated)                             │
│  • Environment variables:                                                   │
│    - PATH: inherit system PATH (access to brew, system tools)               │
│    - HOME: workspace_path (isolated)                                        │
│    - AGENT_WORKSPACE_PATH: workspace_path                                    │
│    - VIRTUAL_ENV: venv path (if in virtual environment)                     │
│                                                                              │
│  [Security Restrictions]                                                    │
│  • Default timeout: 30s                                                     │
│  • Working directory restriction: only access workspace                     │
│                                                                              │
│  [Execution] (lines 68-85)                                                  │
│  • subprocess.run(command, shell=True, cwd=workspace_path, env=env)         │
│  • Return stdout + stderr                                                   │
│  • Failure: "Command failed (exit code N)"                                 │
│  • Timeout: "Error: Command timeout (Ns)"                                  │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 4. Task Management Tool

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  todo_write(todos)                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/tools/builtin/todo_write.py:12-96                        │
│                                                                              │
│  [Data Structure]                                                           │
│  todos: [                                                                    │
│    {                                                                         │
│      id: "uuid8",                                                            │
│      content: "task description",                                           │
│      status: "pending" | "in_progress" | "completed",                       │
│      priority: "low" | "medium" | "high"                                    │
│    }                                                                         │
│  ]                                                                           │
│                                                                              │
│  [Rule Validation] (lines 31-77)                                            │
│  • Required fields: content, status                                         │
│  • Only one in_progress (do one thing at a time)                            │
│  • Auto-generate id (if missing)                                            │
│  • Default priority: medium                                                 │
│                                                                              │
│  [State Update] (lines 83-93)                                               │
│  • state["todos"] = todos                                                    │
│  • Return ToolMessage: "✅ TODO list updated: N pending, M completed"       │
│                                                                              │
│  [Integration with Planner]                                                 │
│  Code: generalAgent/graph/nodes/planner.py:237-281                           │
│  • Planner reads state["todos"]                                             │
│  • Generate dynamic reminder (incomplete task reminder)                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 5. Context Management Tool

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  compact_context(strategy)                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/tools/builtin/compact_context.py:53-164                  │
│                                                                              │
│  [External Dependency: LLM API (base model)]                                 │
│                                                                              │
│  [Compression Strategies] (lines 56-63)                                     │
│  • auto: automatic selection (based on historical results)                  │
│  • compact: detailed summary (preserve technical details, file paths, tool calls)                      │
│  • summarize: minimal summary (<200 words, core info only)                  │
│                                                                              │
│  [Execution Flow]                                                           │
│  ① Check config: CONTEXT_MANAGEMENT_ENABLED=true? (lines 82-90)             │
│  ② Check message count: len(messages) >= 15? (lines 103-110)                │
│  ③ Call ContextManager.compress_context() (lines 115-126)                   │
│     Code: generalAgent/context/manager.py:24-81                              │
│  ④ Update state (lines 138-149)                                             │
│     • messages = [RemoveMessage(REMOVE_ALL_MESSAGES)] + compressed           │
│     • compact_count += 1                                                     │
│     • cumulative_prompt_tokens = 0 (reset)                                   │
│                                                                              │
│  [Return] (line 129)                                                        │
│  • Compression report: before/after message count, tokens, compression ratio, strategy                                │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 6. HITL Tools

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  ask_human(question, context, default, required)                           │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/tools/builtin/ask_human.py:26-101                        │
│                                                                              │
│  [Workflow]                                                                 │
│  ① Agent invocation (lines 71-90)                                           │
│     • ask_human(question, ...)                                              │
│     • Trigger interrupt({type: "user_input_request", ...})                  │
│                                                                              │
│  ② CLI captures interrupt (lines 430-465)                                   │
│     Code: generalAgent/cli.py:430-465                                        │
│     • Print question to user                                                │
│     • User input: answer                                                    │
│     • Resume: Command(resume=answer)                                        │
│                                                                              │
│  ③ Return result (lines 90-100)                                             │
│     • answer (user input)                                                   │
│     • default (if user presses enter directly)                              │
└─────────────────────────────────────────────────────────────────────────────┘
```

### 7. Agent Collaboration Tools

```
┌─────────────────────────────────────────────────────────────────────────────┐
│  delegate_task(task, max_loops)                                             │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/tools/builtin/delegate_task.py:39-304                    │
│                                                                              │
│  • Independent context: context_id = subagent-{uuid8}                       │
│  • State inheritance: mentioned_agents, workspace_path, uploaded_files      │
│  • HITL support: ask_human interrupt passed to user                         │
│  • Real-time output: [subagent-{uuid8}] ...                                 │
│  • Result check: <200 chars → auto request detailed summary                 │
│  • Return JSON: {ok, result, context_id, loops}                             │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  transfer_to_{agent_id}(task)                                               │
├─────────────────────────────────────────────────────────────────────────────┤
│  Code: generalAgent/agents/handoff_tools.py:22-191                           │
│                                                                              │
│  • Dynamically generated: generate handoff tool for each enabled agent      │
│  • Loop detection:                                                          │
│    - agent_call_stack detection (agent → simple → agent rejected)           │
│    - Depth limit (max 5 levels)                                             │
│  • State propagation: agent_call_stack, agent_call_history, current_agent   │
│  • Return Command: Command(goto=agent_id, update={...})                     │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## External Dependencies List

### Python Package Dependencies

| Package | Purpose | Code Location |
|---------|---------|---------------|
| `openai` | OpenAI-compatible API client | `generalAgent/models/registry.py` |
| `langchain-core` | LangChain core library | Used globally |
| `langgraph` | LangGraph state graph | `generalAgent/graph/builder.py` |
| `langsmith` | Tracing (optional) | `generalAgent/telemetry/tracing.py` |
| `PyMuPDF` (fitz) | PDF processing | `generalAgent/utils/document_extractors.py:271-368` |
| `python-docx` | DOCX processing | `generalAgent/utils/document_extractors.py:373-465` |
| `openpyxl` | XLSX processing | `generalAgent/utils/document_extractors.py:470-603` |
| `python-pptx` | PPTX processing | `generalAgent/utils/document_extractors.py:608-744` |
| `jieba` | Chinese word segmentation (optional) | `generalAgent/utils/text_indexer.py:132-151` |
| `sqlite3` | SQLite database (built-in) | `generalAgent/utils/text_indexer.py`, `shared/session/store.py` |
| `pydantic` | Data validation | `generalAgent/config/settings.py` |
| `pyyaml` | YAML parsing | `generalAgent/config/*.py` |
| `mcp` | Model Context Protocol SDK | `generalAgent/tools/mcp/` |

### External Services

| Service | Purpose | Config Location |
|---------|---------|-----------------|
| DeepSeek/Moonshot/GLM/OpenAI | LLM API providers | `.env` (MODEL_*) |
| LangSmith | Tracing/Observability (optional) | `.env` (LANGCHAIN_*) |
| MCP Servers | External tool services | `generalAgent/config/mcp_servers.yaml` |

### Local Storage

| Path | Purpose | Code Location |
|------|---------|---------------|
| `data/sessions.db` | Session persistence | `shared/session/store.py:22-142` |
| `data/indexes.db` | Document indexes (FTS5) | `generalAgent/utils/text_indexer.py:29` |
| `data/workspace/{session_id}/` | Isolated workspace | `shared/workspace/manager.py:55-107` |
| `logs/` | Log files | `generalAgent/utils/logging_utils.py` |
| `uploads/` | Temporary upload directory | CLI file handling |
| `skills/` | Skill package directory | `generalAgent/skills/` |

---

## Key Configuration Files

| File | Purpose | Code Location |
|------|---------|---------------|
| `.env` | Environment variables (API keys, model config) | `generalAgent/config/settings.py` |
| `generalAgent/config/tools.yaml` | Tool configuration | `generalAgent/tools/config_loader.py` |
| `generalAgent/config/skills.yaml` | Skill configuration | `generalAgent/config/skill_config_loader.py` |
| `generalAgent/config/agents.yaml` | Agent configuration | `generalAgent/agents/scanner.py` |
| `generalAgent/config/hitl_rules.yaml` | HITL rules | `generalAgent/hitl/approval_checker.py` |
| `generalAgent/config/mcp_servers.yaml` | MCP server configuration | `generalAgent/tools/mcp/loader.py` |

---

## Complete Tool List

| Tool Name | Category | Function | Code Location |
|-----------|----------|----------|---------------|
| `read_file` | File Operations | Read text/documents | `tools/builtin/file_ops.py:30-161` |
| `write_file` | File Operations | Write file | `tools/builtin/file_ops.py:164-235` |
| `edit_file` | File Operations | Exact replacement | `tools/builtin/edit_file.py:17-122` |
| `list_workspace_files` | File Operations | List directory | `tools/builtin/file_ops.py:238-316` |
| `find_files` | Search | By filename (Glob) | `tools/builtin/find_files.py:18-146` |
| `search_file` | Search | By content (FTS5/Grep) | `tools/builtin/search_file.py:31-268` |
| `run_bash_command` | Execution | Bash commands | `tools/builtin/run_bash_command.py:18-96` |
| `todo_write` | Task Management | TODO list | `tools/builtin/todo_write.py:12-96` |
| `compact_context` | Context Management | Compress conversation | `tools/builtin/compact_context.py:53-164` |
| `ask_human` | HITL | Request user input | `tools/builtin/ask_human.py:26-101` |
| `delegate_task` | Agent Collaboration | Delegate subtask | `tools/builtin/delegate_task.py:39-304` |
| `transfer_to_*` | Agent Collaboration | Agent Handoff | `agents/handoff_tools.py:22-191` |
| `now` | Metadata | Current time | `tools/builtin/now.py` |
| `http_fetch` | Network | HTTP requests | `tools/builtin/http_fetch.py` (if exists) |
| `google_search` | Network | Google search | `tools/builtin/google_search.py` |
| `jina_reader` | Network | Jina Reader | `tools/builtin/jina_reader.py` |

---

## Architecture Design Highlights

### 1. KV Cache Optimization
- **Fixed SystemMessage**: Generated at startup, minute-level timestamp, never changes
- **Dynamic Reminders**: Appended to last HumanMessage (doesn't pollute system prompt)
- **Effect**: 70-90% KV Cache reuse, 60-80% cost reduction
- **Code**: `generalAgent/graph/nodes/planner.py:86-106, 370-386`

### 2. 3-Tier Tool Architecture
- **_discovered**: All scanned tools (including disabled ones)
- **_tools**: Enabled tools (immediately available)
- **load_on_demand()**: Dynamically load on @mention
- **Code**: `generalAgent/tools/registry.py:15-207`

### 3. Workspace Isolation
- **Independent directory**: `data/workspace/{session_id}/`
- **Symlinks**: skills/ read-only
- **Path protection**: Tools can only access files within workspace
- **Code**: `shared/workspace/manager.py:55-107`

### 4. Intelligent Search Strategy
- **Simple queries** → FTS5 (high performance)
- **Complex regex** → FTS5 + Python re post-processing
- **Super complex regex** → Direct Grep full_text
- **Code**: `generalAgent/utils/text_indexer.py:229-268, 520-702`

### 5. Content-Aware Chunking
- **By paragraph/sentence chunking** (not fixed length)
- **20% overlap** (avoid information loss)
- **Document-type optimized** (PDF/DOCX/XLSX/PPTX)
- **Code**: `generalAgent/utils/document_extractors.py:26-181, 239-744`

### 6. 4-Tier HITL Rules
- **Layer 1**: Custom Checkers (tool-specific logic)
- **Layer 2**: Global Patterns (cross-tool detection)
- **Layer 3**: Tool Config Rules (configuration-driven)
- **Layer 4**: Default Rules (safe command whitelist)
- **Code**: `generalAgent/hitl/approval_checker.py:40-231`

---

**Document Version**: v1.0
**Last Updated**: 2025-01-XX
**Maintainer**: AgentGraph Team
