# Repository Guidelines

## Project Structure & Module Organization
- App source lives in src/, with features composed from entry files like src/eurology_residency_hub.tsx.
- Shared UI sits in src/components/; business logic and Supabase helpers in src/services/; cross-cutting utilities in src/utils/.
- Next.js routes reside in pages/; API handlers in pages/api/; background jobs in pi/; static assets stay under public/.
- Tests live alongside code or inside __tests__/; database DDL is tracked in database/.

## Build, Test, and Development Commands
- pm run dev — start the Next.js dev server.
- pm run dev:vite — launch the fast Vite preview for UI prototyping.
- pm run build && pm run start — produce and serve the production bundle.
- pm run lint [-- --fix] — run ESLint/Prettier checks, optionally auto-fixing.
- pm run typecheck — execute strict TypeScript validation.

## Coding Style & Naming Conventions
- TypeScript-only, strict mode; React components must be functional.
- Name components with PascalCase, helpers with camelCase, and constants with UPPER_SNAKE_CASE.
- Follow Tailwind order: layout ? color ? typography. Rely on ESLint + Prettier; avoid manual formatting tweaks.
- Default to ASCII when editing or creating files unless existing content requires otherwise.

## Testing Guidelines
- Use Vitest and Playwright; prioritize patient CRUD, patient detail, scale workflows, and navigation flows.
- Name UI test suites Component.test.tsx or place them in __tests__/ with descriptive filenames.
- Run targeted suites via pm run test:* before submitting changes.

## Commit & Pull Request Guidelines
- Use Conventional Commit prefixes (eat:, ix:, efactor:, etc.) with a narrow scope.
- PRs must summarize changes, link relevant issues, list verification commands, and include UI screenshots when applicable.

## Security & Configuration Tips
- Copy .env.example to .env.local; never commit secrets or Supabase keys.
- Keep production data access coordinated with the product owner and scrub patient identifiers from logs.
- VERSION_COMPARISON.md remains untracked to avoid merge conflicts until migration is finalized.
