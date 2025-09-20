# Repository Guidelines

## Project Structure & Module Organization
Core UI, hooks, and services live in `src/`, with React components under `src/components/`, business logic in `src/services/` and `src/utils/`, and feature hubs like `src/eurology_residency_hub.tsx`. Next.js routes sit in `pages/`, API handlers land in `pages/api/`, and standalone Node jobs belong to `api/`. Database DDL is kept in `database/`, while shared assets ship from `public/`. Build artifacts land in `.next/` or `dist/`; keep them out of version control. Co-locate new tests beside their sources or in `__tests__/` directories.

## Build, Test, and Development Commands
Use `pm run dev` for the primary Next.js dev server, and `pm run dev:vite` for a lightweight Vite preview. Ship production bundles with `pm run build`, then validate via `pm run start`. The alternative Vite pipeline pairs `pm run build:vite` with `pm run preview:vite`. Always lint before pushing using `pm run lint`, and back it up with strict type checks via `pm run typecheck`.

## Coding Style & Naming Conventions
Write strict TypeScript and functional React components. Follow PascalCase for exported components, camelCase for helpers, and UPPER_SNAKE_CASE for constants. Align Tailwind classes as layout > color > typography. ESLint and Prettier enforce formatting; fix issues via `pm run lint -- --fix` when permissible rather than hand-editing. Keep Supabase helpers in `src/services/` and share types from `src/types/`.

## Testing Guidelines
Adopt Vitest or Playwright when touching critical flows such as patient CRUD or scheduling. Name specs `Component.test.tsx` or place them under `__tests__/` with scenario-focused test titles. Aim to cover user paths you change or introduce, and run the suite with the appropriate `pm run test:*` script once added. Include regression tests when fixing bugs.

## Commit & Pull Request Guidelines
Commits follow conventional prefixes like `feat:`, `fix:`, or `refactor:` and stay narrowly scoped. Pull requests need a concise summary, linked issue when available, verification steps (commands run, screenshots or recordings for UI work), and any environment variable changes documented alongside updates to `.env.example`. If production data or Supabase roles are involved, note approvals and sanitise all identifiers.

## Security & Configuration Tips
Copy `.env.example` to `.env.local` for local runs and never commit secrets. Supabase service keys must remain on the server side only. When sharing logs or exports, scrub patient identifiers and audit trails. Treat production backups carefully and confirm with the product owner before using real data in demos.


