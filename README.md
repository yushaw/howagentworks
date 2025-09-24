# HowAgent.works

## 项目简介
HowAgent.works 是一个基于 **Next.js 15 + React 19** 的单页站点，用双语（英文 / 中文）讲解现代 AI Agent 的基础原理、工程流水线、多 Agent 协作模式与生态动态，并通过可配置的数据文件展示最新的行业新闻。

## 核心特性
- **双语体验**：提供语言切换器，优先读取用户上次选择，其次根据浏览器语言判定，默认使用英文。
- **浅色 / 深色主题**：内置主题切换，遵循系统偏好并支持手动覆盖。
- **模块化页面结构**：包括 Hero、核心原理、生命周期管线、生态图谱、多 Agent 协作、实时更新与资源区块。
- **信息可视化**：核心章节插入 IBM 授权的示意图（核心原理、Agent 生命周期、多 Agent 协作），辅助理解工作流。
- **自动化新闻源**：前端从 `public/data/agent-news.json` 读取最新快照，可由外部 Agent 定期刷新。
- **自适应设计**：Tailwind CSS 4 提供的原子化样式确保在桌面和移动端都保持良好布局。

## 本地开发
### 环境要求
- Node.js 18+（推荐 LTS）
- npm / pnpm / yarn / bun 任选其一（仓库采用 npm 脚本）

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```
在浏览器访问 [http://localhost:3000](http://localhost:3000)。页面文本和图片都支持热替换，编辑 `src/app/page.tsx`、`public/images/*.png` 或数据源文件会立即生效。

### 构建与预览
```bash
npm run build
npm run start
```
`start` 命令会以生产模式在默认端口运行。

### 导出静态站点
```bash
npm run deploy   # 已配置 output: "export"，该命令会生成 out/ 目录
```
构建结果会位于 `out/` 目录，可直接部署到 GitHub Pages 或任意静态托管服务。

### 代码质量检查
```bash
npm run lint
```
使用项目内置的 ESLint 规则检查代码质量。

## 项目结构
```
├── docs/agent-feed.md        # Agent 新闻 JSON 的结构约定与示例
├── public/
│   ├── data/agent-news.json  # 站点渲染所依赖的最新新闻快照
│   └── images/               # 章节示意图（core.png、lifecycle.png、multi_agent.png 等）
├── src/app/
│   ├── globals.css           # 全局样式与主题变量
│   ├── layout.tsx            # Root layout，设置字体与元信息
│   ├── not-found.tsx         # 404 页面
│   └── page.tsx              # 主页面组件（全部内容与数据加载逻辑）
├── package.json
└── README.md
```

## 语言与主题行为
- 语言优先级：本地存储 → 浏览器语言 → 英文默认值。
- 主题优先级：本地存储 → 系统 `prefers-color-scheme` → 浅色默认值。
- 两个偏好都会持久化在 `localStorage`，键名分别为 `howagentworks:language` 与 `howagentworks:theme`。

## 章节速览

| 区块 | 说明 |
| ---- | ---- |
| 核心原理 (Core principles) | 通过卡片讲解感知 / 推理 / 执行三大循环，并展示 `core.png` 图示（来源：IBM AI Agents）。 |
| Agent 生命周期 (Lifecycle) | 使用 `lifecycle.png` 示意图展示 Query → Thought → Tool → Output → Answer 的闭环，并解释每个阶段的工程要点。 |
| 生态图谱 (Ecosystem map) | 列出模型、编排、护栏、运维四层生态，并附 `eco.png` 图。 |
| 多 Agent 协作 (Multi-agent patterns) | 介绍集中式规划、Agent 市场、混合协作三类模式，并配 `multi_agent.png` 示意。 |
| 实时动态 | 读取 `public/data/agent-news.json` 展示最新 20 条资讯，支持信号、标签、日期等信息。 |
| 工具与资料 | 对应 `RESOURCE_CATEGORIES`，按主题归类外部文档和工具。 |

## Agent 如何更新新闻数据
1. 按 `docs/agent-feed.md` 中的约定生成结构化数据：字段需包含 `id`、`title`、`summary`、`source`、`publishedAt`、`tags` 以及可选的 `signal`，所有文本提供中英文版本。
2. 将最新 20 条记录写入 `public/data/agent-news.json`，同时更新 `lastUpdated`（UTC ISO 8601）。
3. 写入前按 `publishedAt` 降序排序、去重，并先写临时文件再替换正式文件以避免途中失败。
4. 可通过定时任务或 CI（如 GitHub Actions）周期性运行 Agent，把更新后的 JSON 提交或部署。

当运行时读取不到数据时，前端会自动回退到仓库内置的静态快照。

## 图示版权
- `public/images/core.png`、`lifecycle.png`、`eco.png`、`multi_agent.png` 分别引用自 IBM 的 React Agent / AI Agents / Agentic Architecture 文章，页面中已通过图注链接注明来源。
- 替换或新增示意图时请保持常见宽高比（3:2 或 4:3），并同步更新图注与来源链接。

## 部署到 GitHub Pages

1. **设置环境变量（可选）**：如果站点托管在子路径（例如 `https://<username>.github.io/howagentworks/`），需在构建时设置 `NEXT_PUBLIC_BASE_PATH=/howagentworks`。若绑定自定义域名且站点位于根路径，则保持空值即可。
2. **构建静态资源**：执行 `npm run deploy`，静态文件会输出到 `out/` 目录。
3. **发布**：将 `out/` 推送到 `gh-pages` 分支，或使用 GitHub Actions 自动化部署。示例工作流：

   ```yaml
   name: Deploy to GitHub Pages

   on:
     push:
       branches: [main]

   jobs:
     deploy:
       runs-on: ubuntu-latest
       steps:
         - uses: actions/checkout@v4
         - uses: actions/setup-node@v4
           with:
             node-version: '20'
             cache: 'npm'
         - run: npm ci
         - run: npm run deploy
         - uses: peaceiris/actions-gh-pages@v3
           with:
             github_token: ${{ secrets.GITHUB_TOKEN }}
             publish_dir: ./out
   ```

4. **启用 Pages**：在仓库 Settings → Pages 中选择 `gh-pages` 分支，稍候即可通过 `https://<username>.github.io/howagentworks/` 访问。

如果使用自定义域名（例如 `howagent.works`），请在 `public/CNAME` 中写入域名，并在域名 DNS 添加 GitHub Pages 官方 IP 后再保存 Pages 设置即可。

## 反馈与迭代
- 欢迎对内容、布局或数据源提出改进建议。
- 如果需要扩展更多区块或引入多语言，请保持组件化设计，复用 `LocalizedHeading`、`LocalizedParagraph` 等辅助方法；新增图片请放入 `public/images/` 并在 README 中更新引用说明。
