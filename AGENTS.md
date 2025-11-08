# Repository Guidelines

## Project Structure & Module Organization
- App source in `src/`; compose features from entry files like `src/eurology_residency_hub.tsx`.
- Shared UI in `src/components/`; business logic and Supabase helpers in `src/services/`; cross‑cutting utilities in `src/utils/`.
- Next.js routes in `pages/`; API handlers in `pages/api/`; background jobs in `api/`; static assets in `public/`.
- Tests live alongside code or in `__tests__/`; database DDL is tracked in `database/`.

## Build, Test, and Development Commands
- `pm run dev` – start the Next.js dev server.
- `pm run dev:vite` – fast Vite preview for UI prototyping.
- `pm run build && pm run start` – build and serve the production bundle.
- `pm run lint [-- --fix]` – run ESLint/Prettier checks; add `-- --fix` to auto‑fix.
- `pm run typecheck` – execute strict TypeScript validation.
- `pm run test:*` – run targeted test suites (unit/e2e).

## Coding Style & Naming Conventions
- TypeScript‑only, strict mode; React components must be functional.
- Naming: Components `PascalCase`, helpers `camelCase`, constants `UPPER_SNAKE_CASE`.
- Tailwind class order: layout → color → typography.
- Use ESLint + Prettier; avoid manual formatting tweaks.

## Testing Guidelines
- Frameworks: Vitest (unit) and Playwright (e2e).
- Prioritize: patient CRUD, patient detail, scale workflows, navigation flows.
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

