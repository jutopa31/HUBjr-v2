# Repository Guidelines

## Project Structure & Modules
Core UI and feature logic live under src/ (notably components/, services/, utils/, and large feature files such as 
eurology_residency_hub.tsx). Next.js routing is handled in pages/, with API routes in pages/api/. Standalone Node handlers are kept in pi/, while database DDL scripts sit in database/. Shared assets reside in public/, and static exports build to dist/ or .next/ depending on the toolchain.

## Build, Test, and Development
Use 
pm run dev for the Next.js dev server (default port 3000+) and 
pm run dev:vite when you need the lighter Vite preview. Production bundles are created with 
pm run build; pair with 
pm run start to smoke-test the compiled app. Run 
pm run build:vite for the alternative Vite pipeline and 
pm run preview:vite to inspect that bundle. Linting (
pm run lint) and TypeScript checks (
pm run typecheck) must pass before opening a PR.

## Coding Style & Naming
Write TypeScript-first components with strict mode expectations (	sconfig.json enables strict, 
oUnused*). Prefer functional React components, hooks under src/hooks, and PascalCase filenames for exported components. Keep tailwind utility classes grouped by layout ? color ? typography. ESLint is the source of truth; run it when touching JSX/TSX. Follow existing patterns for Supabase helpers in src/services/ and keep shared types in src/types/.

## Testing Expectations
There is currently no automated test suite; add Vitest or Playwright coverage alongside new features. Place unit tests next to the source (Component.test.tsx) or under a __tests__/ folder, and name test cases after the user scenario being validated. At minimum, cover critical flows (patient CRUD, event scheduling) and include regression tests when fixing defects.

## Commit & PR Workflow
Adopt the conventional commit style found in history (eat:, ix:, efactor:). Commits should stay scoped to a single feature or bug. Pull requests need a concise summary, linked GitHub issue (if applicable), verification steps, and screenshots or screen recordings for UI changes. Flag environment variable updates in the PR body and update .env.example when you add new config.

## Environment & Data Handling
Copy .env.example to .env.local for local runs and avoid checking secrets into version control. Supabase credentials grant production data access—use service roles only in secure server contexts. Obfuscate patient identifiers in sample data and scrub exports before sharing outside the hospital network.
