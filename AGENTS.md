# Repository Guidelines

## Project Structure & Module Organization
- Core React UI, hooks, and shared logic live in `src/`; feature entry points such as `src/eurology_residency_hub.tsx` orchestrate shared modules.
- Place reusable presentation components in `src/components/`, business logic in `src/services/` or `src/utils/`, and Supabase helpers inside `src/services/`.
- Next.js routes live in `pages/`; backend handlers live in `pages/api/`. Keep standalone Node jobs under `api/` and static assets under `public/`.
- Co-locate tests with their subjects or group them under `__tests__/`. Database DDL belongs in `database/`. Never commit build outputs like `.next/` or `dist/`.

## Build, Test, and Development Commands
- `pm run dev`: start the primary Next.js development server.
- `pm run dev:vite`: launch the Vite preview for rapid UI iterations.
- `pm run build` then `pm run start`: produce and verify the production bundle.
- `pm run build:vite` and `pm run preview:vite`: exercise the alternate Vite pipeline.
- `pm run lint` or `pm run lint -- --fix`: lint and auto format the codebase.
- `pm run typecheck`: enforce strict TypeScript before shipping.

## Coding Style & Naming Conventions
- TypeScript is strict; write only functional React components.
- Use PascalCase for exported components, camelCase for helpers, and UPPER_SNAKE_CASE for constants.
- Arrange Tailwind classes as layout -> color -> typography. Rely on ESLint and Prettier rather than manual formatting.

## Testing Guidelines
- Cover feature work with Vitest or Playwright, especially around patient CRUD and scheduling flows.
- Name files `Component.test.tsx` or place scenario suites inside `__tests__/`.
- Run the relevant `pm run test:*` scripts and ensure the changed user paths are exercised.

## Commit & Pull Request Guidelines
- Follow conventional commits (`feat:`, `fix:`, `refactor:`) with tight scopes and descriptive messages.
- Pull requests need a concise summary, linked issues, verification commands, and UI screenshots when appropriate.

## Security & Configuration Tips
- Copy `.env.example` to `.env.local` for local runs and keep secrets out of git.
- Keep Supabase service keys server side, scrub patient identifiers from logs, and confirm any production data use with the product owner.
