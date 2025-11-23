# Repository Guidelines

## Project Structure & Module Organization
- App source in `src/`; compose features from entry files like `src/neurology_residency_hub.tsx`.
- Shared UI in `src/components/`; business logic and Supabase helpers in `src/services/`; cross‑cutting utilities in `src/utils/`.
- Next.js routes in `pages/`; API handlers in `pages/api/`; background jobs in `api/`; static assets in `public/`.
- Tests live alongside code or in `__tests__/`; database DDL in `database/`.
- Keep modules small and focused; export via `index.ts` only when aggregation helps discoverability.

## Build, Test, and Development Commands
- `pm run dev` – start the Next.js dev server.
- `pm run dev:vite` – fast Vite preview for UI prototyping.
- `pm run build && pm run start` – build and serve the production bundle.
- `pm run lint [-- --fix]` – run ESLint/Prettier; add `-- --fix` to auto‑fix.
- `npx tsc --noEmit` – run strict TypeScript type checks.
- `npx vitest` (unit) and `npx playwright test` (e2e) – run tests.

## Coding Style & Naming Conventions
- TypeScript‑only, strict mode; React components must be functional.
- Naming: Components `PascalCase`, helpers `camelCase`, constants `UPPER_SNAKE_CASE`.
- Tailwind class order: layout → color → typography.
- Use ESLint + Prettier; avoid manual formatting tweaks. Prefer small, pure functions.

## Testing Guidelines
- Frameworks: Vitest (unit) and Playwright (e2e).
- Prioritize coverage for patient CRUD, patient detail, scale workflows, and navigation flows.
- Name UI tests `Component.test.tsx` or place in `__tests__/` with descriptive filenames.
- Run locally with `pm run test:*`; keep tests deterministic and CI‑safe.

## Commit & Pull Request Guidelines
- Use Conventional Commits (`feat:`, `fix:`, `refactor:`) with a narrow scope.
- PRs must summarize changes, link issues, list verification commands, and include UI screenshots when applicable.
- Keep diffs focused; update docs when behavior changes.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local`; never commit secrets or Supabase keys.
- Coordinate production data access with the product owner; scrub patient identifiers from logs.
- Keep `VERSION_COMPARISON.md` untracked until migration is finalized.

## Agent-Specific Instructions (Rol del Agente)
- Follow this file’s scope across the repo; prefer minimal, surgical patches.
- Announce actions with a 1–2 sentence preamble; group related commands.
- Maintain a clear plan with small steps; keep exactly one step in progress.
- Use `rg` for code/search, `apply_patch` for edits, and `pm` scripts for local checks.
- Read files in ≤250-line chunks; avoid destructive commands unless explicitly requested.
- Validate touched areas: `npx tsc --noEmit`, `pm run lint -- --fix` (when safe), and targeted `npx vitest` / `npx playwright test`.
- Keep code aligned with strict TypeScript and functional React; don’t rename files/exports without strong reason.
- Reference files with clickable paths like `src/file.ts:42` in summaries; keep updates concise.
