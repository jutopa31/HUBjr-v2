# Repository Guidelines
 
## Project Structure & Module Organization
- Source lives in `src/` (UI, hooks, services, utils). Feature entry points like `src/eurology_residency_hub.tsx` compose shared modules.
- Reusable UI in `src/components/`; business logic and Supabase helpers in `src/services/`; utilities in `src/utils/`.
- Next.js routes in `pages/`; API handlers in `pages/api/`; background jobs in `api/`; static files in `public/`.
- Tests co-located or under `__tests__/`. Database DDL in `database/`.
- Do not commit build outputs (e.g., `.next/`, `dist/`).
 
## Build, Test, and Development Commands
- `pm run dev` — start Next.js dev server.
- `pm run dev:vite` — Vite preview for fast UI iteration.
- `pm run build` then `pm run start` — build and run production bundle.
- `pm run build:vite` and `pm run preview:vite` — alternate Vite pipeline.
- `pm run lint` or `pm run lint -- --fix` — lint and auto-format.
- `pm run typecheck` — strict TypeScript checks.
 
## Coding Style & Naming Conventions
- TypeScript (strict). Functional React components only.
- Naming: Components `PascalCase`, helpers `camelCase`, constants `UPPER_SNAKE_CASE`.
- Tailwind class order: layout → color → typography.
- Rely on ESLint + Prettier; avoid manual formatting tweaks.
 
## Testing Guidelines
- Use Vitest/Playwright. Prioritize patient CRUD and scheduling flows.
- Name tests `Component.test.tsx` or place suites in `__tests__/`.
- Run `pm run test:*` as appropriate; ensure changed user paths are covered.
 
## Commit & Pull Request Guidelines
- Conventional commits (`feat:`, `fix:`, `refactor:`, etc.) with tight scope.
- PRs include: concise summary, linked issues, verification commands, and screenshots for UI changes.
 
## Security & Configuration Tips
- Copy `.env.example` to `.env.local`; never commit secrets.
- Keep Supabase service keys server-side. Scrub patient identifiers from logs.
- Confirm any production data use with the product owner.
 
## Agent-Specific Notes
- Follow this file’s guidance across the repo. Prefer small, focused changes. When adding files, keep modules in the directories above and mirror existing patterns.
