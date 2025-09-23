# Repository Guidelines

## Project Structure & Module Organization
- `src/app/` — Next.js App Router entry points. `page.tsx` renders the one-page experience; `layout.tsx` hosts fonts/metadata; `not-found.tsx` provides the 404 view; `globals.css` defines theme variables.
- `public/data/` — JSON snapshots consumed at runtime (e.g., `agent-news.json`). Agents should update these files atomically.
- `docs/` — Data contracts and operational docs (`agent-feed.md`). Extend this folder with additional schemas when adding new automated feeds.

## Build, Test, and Development Commands
- `npm run dev` — Launches the local dev server on `http://localhost:3000` with hot reload.
- `npm run lint` — Runs ESLint with the Next.js config; required before commits.
- `npm run build` — Produces a production bundle using Turbopack and validates types.
- `npm run start` — Serves the optimized build locally (use after `build`).

## Coding Style & Naming Conventions
- TypeScript + React 19 with functional components. Follow Next.js App Router defaults.
- Prefer Tailwind utility classes; use `cn()` helper for conditional styling.
- Keep JSON bilingual fields as `{ en: string, zh: string }`; camelCase for object keys.
- Run `npm run lint` to enforce formatting; no separate prettier config is required.

## Testing Guidelines
- No automated test harness yet. For visual/UI changes, validate via `npm run dev` across light/dark themes and both languages.
- When adding tooling, colocate tests under `src/` with `.test.ts(x)` suffix and document the framework in this file.

## Commit & Pull Request Guidelines
- Use concise, imperative commit subjects (e.g., `Add bilingual hero copy`).
- PRs should include: summary of changes, impacted sections (`src/app/...`, `public/data/...`), screenshots or screen recordings for UI work, and references to data schema updates.
- Confirm `npm run lint` and `npm run build` succeed before requesting review.

## Agent Update Recommendations
- Agents rewriting JSON must preserve `schemaVersion`, trim to latest 20 items (unless schema states otherwise), and update `lastUpdated` in UTC ISO 8601.
- Validate bilingual fields and sort order before committing changes; prefer writing to a temp file then renaming to avoid partial writes.
