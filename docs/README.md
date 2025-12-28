# HUBJR Documentation

Welcome to the HUBJR (Neurology Residency Hub) documentation. This directory contains comprehensive documentation organized by topic.

## Documentation Structure

### Architecture & Design
**[docs/architecture/](architecture/)** - System architecture, design patterns, and technical documentation

- **[ARCHITECTURE.md](architecture/ARCHITECTURE.md)** ⭐ - Master architecture navigation guide (start here!)
- [MASTER_PROJECT_DOCUMENTATION.md](architecture/MASTER_PROJECT_DOCUMENTATION.md) - Comprehensive project overview
- [PROJECT_DOCUMENTATION.md](architecture/PROJECT_DOCUMENTATION.md) - Project documentation
- [project-principles.md](architecture/project-principles.md) - Coding standards and best practices
- [VERSION_COMPARISON.md](architecture/VERSION_COMPARISON.md) - Hub v2 vs v3 comparison
- [README-BACKEND.md](architecture/README-BACKEND.md) - Backend architecture
- [v3planandstatus.md](architecture/v3planandstatus.md) - V3 development status
- [COMPRESSED_TABLES_SUMMARY.md](architecture/COMPRESSED_TABLES_SUMMARY.md) - Database tables summary
- [AGENT_SESSION_STYLE.md](architecture/AGENT_SESSION_STYLE.md) - Agent session styling guide

### Database & Setup
**[docs/database/](database/)** - Database schemas, setup instructions, and security

- **[DATABASE_SETUP.md](database/DATABASE_SETUP.md)** ⭐ - Complete database setup guide
- [ADMIN_PRIVILEGES_IMPLEMENTATION_SUMMARY.md](database/ADMIN_PRIVILEGES_IMPLEMENTATION_SUMMARY.md) - Privilege system
- [RESIDENT_PROFILES_SETUP.md](database/RESIDENT_PROFILES_SETUP.md) - Resident profiles schema
- [HOSPITAL_CONTEXT_SYSTEM.md](database/HOSPITAL_CONTEXT_SYSTEM.md) - Multi-hospital context management
- [HOSPITAL_CONTEXTS_IMPLEMENTATION.md](database/HOSPITAL_CONTEXTS_IMPLEMENTATION.md) - Context implementation details
- [SECURITY-INCIDENT-RESPONSE.md](database/SECURITY-INCIDENT-RESPONSE.md) - Security protocols

### Features
**[docs/features/](features/)** - Feature documentation and implementation details

- [FUTURE_ALGORITHMS_SCALES.md](features/FUTURE_ALGORITHMS_SCALES.md) - Planned medical scales
- [FUTURE_IMPLEMENTATIONS.md](features/FUTURE_IMPLEMENTATIONS.md) - Feature roadmap
- [INLINE_EDITING_FEATURE.md](features/INLINE_EDITING_FEATURE.md) - Inline editing functionality
- [academia_redesign.md](features/academia_redesign.md) - Academia module redesign
- [CSV_IMPORT_FIX_README.md](features/CSV_IMPORT_FIX_README.md) - CSV import functionality
- [CORRECCIONES-IMPLEMENTADAS.md](features/CORRECCIONES-IMPLEMENTADAS.md) - Implemented corrections
- [FASE1-IMPLEMENTACION-FINAL.md](features/FASE1-IMPLEMENTACION-FINAL.md) - Phase 1 implementation
- [RESIDENT_WORKFLOW_ISSUES.md](features/RESIDENT_WORKFLOW_ISSUES.md) - Resident workflow issues
- **Ward Rounds**: [ward-rounds/](features/ward-rounds/)
  - [WARD_ROUNDS_UX_ANALYSIS.md](features/ward-rounds/WARD_ROUNDS_UX_ANALYSIS.md)
  - [WARD_ROUNDS_UX_IMPROVEMENTS.md](features/ward-rounds/WARD_ROUNDS_UX_IMPROVEMENTS.md)
  - [ward-rounds-responsive-improvements.md](features/ward-rounds/ward-rounds-responsive-improvements.md)

### Deployment
**[docs/deployment/](deployment/)** - Deployment guides and DevOps documentation

- **[VERCEL_DEPLOYMENT.md](deployment/VERCEL_DEPLOYMENT.md)** ⭐ - Vercel deployment guide
- [VERCEL_WEBHOOK_FIX.md](deployment/VERCEL_WEBHOOK_FIX.md) - Webhook troubleshooting

### Planning & Roadmap
**[docs/planning/](planning/)** - Project planning documents and roadmaps

- [PENDING_TASKS.md](planning/PENDING_TASKS.md) - Current pending tasks
- [PLAN_INTEGRACION_WORKFLOW.md](planning/PLAN_INTEGRACION_WORKFLOW.md) - Workflow integration plan
- [ranking-plan.md](planning/ranking-plan.md) - Ranking system plan
- [CSV_IMPORT_PLAN.md](planning/CSV_IMPORT_PLAN.md) - CSV import planning

### Reports & Audits
**[docs/reports/](reports/)** - Status reports, audits, and verification documents

- [BOOTLOOP_FIX_VERIFICATION.md](reports/BOOTLOOP_FIX_VERIFICATION.md) - Critical bug fix verification
- [AUDITORIA-ESTILOS-COMPLETA.md](reports/AUDITORIA-ESTILOS-COMPLETA.md) - Complete style audit
- [responsive-validation-report.md](reports/responsive-validation-report.md) - Responsive design validation
- [TESTING_WORKFLOW_INTEGRATION.md](reports/TESTING_WORKFLOW_INTEGRATION.md) - Testing workflow report
- [resumen.md](reports/resumen.md) - Project summary

## Quick Reference

### For New Developers
1. Read [architecture/ARCHITECTURE.md](architecture/ARCHITECTURE.md) for system navigation
2. Review [../CLAUDE.md](../CLAUDE.md) for development guidelines
3. Set up database using [database/DATABASE_SETUP.md](database/DATABASE_SETUP.md)
4. Check [../AGENTS.md](../AGENTS.md) for contributor workflow

### For Feature Development
1. Review relevant docs in [features/](features/)
2. Check [planning/](planning/) for roadmap alignment
3. Follow patterns in [architecture/project-principles.md](architecture/project-principles.md)
4. Update [../CHANGELOG.md](../CHANGELOG.md) with your changes

### For Deployment
1. Follow [deployment/VERCEL_DEPLOYMENT.md](deployment/VERCEL_DEPLOYMENT.md)
2. Set environment variables per [database/DATABASE_SETUP.md](database/DATABASE_SETUP.md)
3. Verify deployment with reports in [reports/](reports/)

## Contributing to Documentation

When adding or updating documentation:
1. Place files in the appropriate subdirectory
2. Update this README.md to link to new documents
3. Use clear, descriptive filenames
4. Follow markdown best practices
5. Include code examples where relevant

---

**Last Updated**: 2025-12-28
**Maintained By**: Dr. Julián Alonso - Chief Neurology Resident
