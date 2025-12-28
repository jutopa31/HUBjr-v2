# HubJR v3 Simplified ? Plan & Status

## Branch
- Working branch: feature/hubjr-v3-simplified (main kept untouched for v2 backup)

## Completed Steps
1. Created v3 skeleton shell with four-section navigation and feature flag toggle.
2. Extracted shared services for hospital context metadata and dashboard stats.
3. Implemented v3 SimplifiedDashboard with shared service integration and dark UI shell.

## Pending Steps
4. Build UnifiedPatients workspace (list, filters, inline scales, detail entry).
5. Build PatientDetailView module in v3 (timeline, scale history, documents).
6. Build ResourcesHub module (algorithm directory, scales, calculators).
7. Wire advanced routing/state (feature flags, deep links, context providers).
8. Migrate app state/context providers from v2 monolith into reusable hooks/services.
9. Add Vitest/Playwright coverage for patient CRUD, detail view, scales, navigation.
10. Perform QA/performance pass and update documentation/migration notes.

## Notes
- Toggle NEXT_PUBLIC_HUBJR_USE_V3=true locally to preview v3; keep false by default.
- VERSION_COMPARISON.md remains untracked to avoid conflicts until ready.
- All new files use ASCII encoding per repo guidelines.
