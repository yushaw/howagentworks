# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` contains the entire page experience. `page.tsx` renders all sections, `layout.tsx` wires fonts/metadata, `globals.css` defines shared theming, and `not-found.tsx` provides the 404 fallback.
- `public/data/agent-news.json` is the live news snapshot read by the updates section; treat writes as atomic replacements.
- `public/images/` stores IBM-provided diagrams referenced throughout the page.
- `docs/agent-feed.md` is the schema contract for automated feed writers. Add any new data specs here before changing runtime payloads.

## Build, Test, and Development Commands
- `npm run dev` starts the dev server at `http://localhost:3000` with hot reload.
- `npm run lint` runs ESLint with the Next.js config; fix all issues before committing.
- `npm run build` compiles the production bundle and validates types via Turbopack.
- `npm run start` serves the optimized build after a successful `build`.
- `npm run deploy` exports a static site into `out/` for GitHub Pages or equivalent hosting.

## Coding Style & Naming Conventions
- TypeScript + React 19 functional components only; keep modules colocated with their assets in `src/app/`.
- Prefer Tailwind utility classes; use the `cn()` helper when applying conditional styles.
- JSON documents must stay bilingual using `{ en: string, zh: string }` fields and camelCase keys.
- Formatting is enforced by ESLint; there is no separate prettier step.

## Testing Guidelines
- There is no automated test harness today. Manually verify UI changes in both languages and light/dark themes via `npm run dev`.
- If you introduce automated tests, colocate them under `src/` with a `.test.ts(x)` suffix and document the framework in `docs/`.

## Commit & Pull Request Guidelines
- Use concise, imperative commit messages such as `Update lifecycle copy`.
- Pull requests should summarize changes, mention impacted areas (e.g., `src/app/page.tsx`, `public/data/agent-news.json`), and include screenshots for visual updates.
- Before requesting review, confirm `npm run lint` and `npm run build` both succeed and note that status in the PR description.

## Agent Update Checklist
- When refreshing `public/data/agent-news.json`, preserve `schemaVersion`, update `lastUpdated` with a UTC ISO timestamp, and keep only the newest 20 items sorted by `publishedAt` descending.
- Generate bilingual content upstream, validate JSON before writing, and prefer a temp-file swap to avoid partial updates.
