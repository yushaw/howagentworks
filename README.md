# HowAgent.works

## 项目简介
HowAgent.works 是一个基于 **Next.js 15 + React 19** 的单页站点，用双语（英文 / 中文）讲解现代 AI Agent 的基础原理、工程流水线与生态动态，并通过可配置的数据文件展示最新的行业新闻。

## 核心特性
- **双语体验**：提供语言切换器，优先读取用户上次选择，其次根据浏览器语言判定，默认使用英文。
- **浅色 / 深色主题**：内置主题切换，遵循系统偏好并支持手动覆盖。
- **模块化页面结构**：包括 Hero、核心原理、生命周期管线、生态图谱、实时更新与资源区块。
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
在浏览器访问 [http://localhost:3000](http://localhost:3000)。修改 `src/app/page.tsx` 或其他文件会触发热更新。

### 构建与预览
```bash
npm run build
npm run start
```
`start` 命令会以生产模式在默认端口运行。

### 代码质量检查
```bash
npm run lint
```
使用项目内置的 ESLint 规则检查代码质量。

## 项目结构
```
├── docs/agent-feed.md        # Agent 新闻 JSON 的结构约定与示例
├── public/
│   └── data/agent-news.json  # 站点渲染所依赖的最新新闻快照
├── src/app/
│   ├── globals.css           # 全局样式与主题变量
│   ├── layout.tsx            # Root layout，设置字体与元信息
│   ├── not-found.tsx         # 404 页面
│   └── page.tsx              # 主页面组件
├── package.json
└── README.md
```

## 语言与主题行为
- 语言优先级：本地存储 → 浏览器语言 → 英文默认值。
- 主题优先级：本地存储 → 系统 `prefers-color-scheme` → 浅色默认值。
- 两个偏好都会持久化在 `localStorage`，键名分别为 `howagentworks:language` 与 `howagentworks:theme`。

## Agent 如何更新新闻数据
1. 按 `docs/agent-feed.md` 中的约定生成结构化数据：确保字段包含 `id`、`title`、`summary`、`source`、`publishedAt`、`tags`，以及可选的 `signal`，且所有文案需提供中英文版本。
2. 将最新 20 条记录写入 `public/data/agent-news.json`，同时更新时间戳 `lastUpdated`（UTC ISO 8601）。
3. 建议写入前排序（`publishedAt` 降序）、去重，并先写临时文件再覆盖以避免部分写入。
4. 可通过计划任务或 CI（例如 GitHub Actions）周期性运行爬虫 / Agent，将更新后的文件提交或部署。

一旦 JSON 就绪，前端无需额外配置即可自动展示最新内容；构建或运行时读取不到数据时，会回退到仓库中提供的默认快照。

## 反馈与迭代
- 欢迎对内容、布局或数据源提出改进建议。
- 如果需要扩展更多区块或引入多语言，请保持组件化设计，复用现有的 `LocalizedHeading` 和 `LocalizedParagraph` 辅助方法。

