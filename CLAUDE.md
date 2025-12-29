# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev              # Next.js development server (usually port 3001)
npm run dev:vite         # Vite development server (http://localhost:5173)

# Build & Deploy
npm run build            # Production build with Next.js
npm run start            # Start production server
npm run build:vite       # Alternative Vite build (tsc + vite build)

# Quality Assurance
npm run lint             # ESLint checking
npx tsc --noEmit        # TypeScript type checking without emitting files (CRITICAL before commits)
npm run audit:responsive # Responsive design audit script (checks mobile/tablet layouts)

# Utility Scripts
node scripts/color-audit.mjs      # Audit text color contrast for accessibility
node scripts/contrast-audit.mjs   # Enhanced contrast checking across components
node scripts/responsive-audit.mjs # Verify responsive breakpoints
```

## Architecture Overview

### Main Application Entry Points
- **Primary Hub**: `src/neurology_residency_hub.tsx` - Main production application (204KB, feature-complete)
  - Sidebar navigation with 10+ medical feature modules
  - Tab-based routing system with state management
  - Hospital context integration throughout
  - Currently active in production deployment
- **V3 Hub**: `src/neurology_residency_hub_v3.tsx` - Experimental simplified architecture (3KB)
  - Cleaner component structure, not yet feature-complete
  - Use v2 (neurology_residency_hub.tsx) for all production work
- **Pages Router**: `pages/index.js` loads the main neurology hub component
- **Technology Stack**: Next.js 14 + React 18 + TypeScript + Supabase + Tailwind CSS
- **Dual Build System**: Next.js (production) + Vite (fast development alternative)

### Core Feature Modules
The application is organized into distinct medical/administrative modules. Module visibility and routing are centralized in `src/config/modules.ts`, which defines core vs auxiliary module classification:

- **Evolucionador (Diagnostic)**: See dedicated architecture section below - AI-assisted patient evolution notes with multi-step wizard
- **Pase de Sala (Ward Rounds)**: `src/WardRounds.tsx`, `src/WardRoundsComplete.tsx` - Daily patient rounds tracking
- **Interconsultas**: `src/Interconsultas.tsx` + `src/services/interconsultasService.ts` - Consultation request management with auth guards
- **Pendientes (Tasks)**: `src/PendientesManager.tsx` - Task tracking system
- **Academia**: `src/AcademiaManager.tsx` - Educational resources and class scheduling
- **Eventos**: `src/EventManagerSupabase.tsx` - Real-time calendar with Supabase integration
- **Punciones Lumbares**: `src/components/LumbarPunctureDashboard.tsx` - Lumbar puncture tracking
- **Pacientes Post-Alta**: `src/PacientesPostAlta.tsx` - Post-discharge patient follow-up
- **Saved Patients**: `src/SavedPatients.tsx` - Patient list with hospital context filtering

**Module Configuration**: The `src/config/modules.ts` manifest controls module visibility in the sidebar. Modules are categorized as 'core' (visible in main sidebar) or 'auxiliary' (accessible via routes but hidden from primary navigation). When adding new features, update this configuration to control module exposure.

### Evolucionador Architecture (AI-Assisted Diagnostic Assistant)
The Evolucionador is a complex multi-file sub-application within `src/evolucionador/` that implements a comprehensive patient evolution note creation system with AI assistance.

**Directory Structure**:
```
src/evolucionador/
├── EvolucionadorApp.tsx           # Main component orchestrator
├── index.tsx                      # Public exports
├── components/
│   ├── wizard/                    # Multi-step wizard UI
│   │   ├── WizardContainer.tsx    # Wizard state management
│   │   ├── StepNavigation.tsx     # Step controls and progress
│   │   ├── ProgressBar.tsx        # Visual progress indicator
│   │   └── steps/                 # Individual wizard steps
│   │       ├── PatientDataStep.tsx    # Patient demographics & clinical data
│   │       ├── NotesEditorStep.tsx    # Evolution note text editor
│   │       ├── ScalesStep.tsx         # Medical scale assessments
│   │       └── ConfirmStep.tsx        # Review and save
│   └── ocr/                       # OCR processing components
│       ├── OCRUploader.tsx        # File upload interface
│       ├── OCRProcessor.tsx       # Processing orchestrator
│       ├── ImagePreview.tsx       # Image preview with annotations
│       └── OCRResultCard.tsx      # Extracted data display
├── hooks/
│   └── useOCRProcessor.ts         # OCR state management hook
├── services/
│   ├── claude/                    # Claude API integrations
│   │   ├── claudeVisionService.ts     # Vision API for OCR
│   │   ├── claudeEvolutionService.ts  # Evolution note AI suggestions
│   │   └── claudeCacheService.ts      # API response caching
│   └── ocr/
│       ├── imagePreprocessor.ts   # Image optimization before OCR
│       ├── ocrOrchestrator.ts     # Multi-engine OCR coordination
│       └── ocrCostCalculator.ts   # Token usage estimation
├── types/
│   ├── ocr.types.ts               # OCR-specific TypeScript interfaces
│   ├── evolution.types.ts         # Evolution note types
│   └── claude.types.ts            # Claude API types
└── config/
    └── claude.config.ts           # Claude API configuration
```

**Key Features**:
- **Multi-Step Wizard**: Four-step process (Patient Data → Notes Editor → Scales → Confirm) with state persistence between steps
- **OCR Processing**: Integrates Claude Vision API for extracting patient data from medical documents and images
- **Draft Management**: Auto-save functionality via `evolucionadorDraftsService.ts` with recovery from interrupted sessions
- **Workflow Integration**: Receives patient context from Interconsultas module and can create Ward Round patients from saved notes
- **Hospital Context Aware**: All saves respect the active hospital context (Posadas/Julian)
- **AI Suggestions**: Claude-powered suggestions for evolution note structure and medical terminology

**Usage Pattern**: The Evolucionador serves as a reference implementation for complex, multi-step feature development with AI integration.

### Component Organization

```
src/
├── components/
│   ├── auth/                    # Authentication system
│   │   ├── AuthProvider.tsx     # Auth context provider
│   │   ├── AuthModal.tsx        # Login modal
│   │   ├── SessionGuard.tsx     # Session protection
│   │   ├── ProtectedRoute.tsx   # Route protection wrapper
│   │   └── UserMenu.tsx         # User account menu
│   ├── user/                    # User-specific features
│   │   ├── UserDashboard.tsx    # Personal resident dashboard
│   │   ├── MyPatients.tsx       # Personal patient list
│   │   ├── ResidentProfile.tsx  # Profile management
│   │   ├── ProcedureLogger.tsx  # Procedure tracking
│   │   └── UserStatistics.tsx   # User stats visualization
│   ├── admin/                   # Administrative interfaces
│   │   ├── UserCreator.tsx      # User management
│   │   └── OCRProcessorModal.tsx # OCR document processing
│   ├── layout/
│   │   ├── Sidebar.tsx          # Main navigation sidebar with theme support
│   │   └── SectionHeader.tsx    # Section headers
│   ├── patients/                # Patient management components
│   │   ├── PatientsList.tsx
│   │   ├── PatientsFilters.tsx
│   │   └── PatientDetailDrawer.tsx
│   ├── wardRounds/              # Ward rounds feature components
│   │   ├── WardPatientCard.tsx  # Patient card display
│   │   ├── ImageGallery.tsx     # Media gallery (images/videos)
│   │   ├── CSVImportModal.tsx   # CSV import interface
│   │   └── ImportValidationResults.tsx
│   ├── interconsultas/          # Consultation request components
│   │   ├── InterconsultaCard.tsx        # Consultation display card
│   │   ├── InterconsultaDetailModal.tsx # Detail view modal
│   │   └── StatusBadge.tsx              # Status indicator
│   ├── postAlta/                # Post-discharge feature components
│   │   ├── CalendarView.tsx     # Calendar interface
│   │   ├── PatientDetailModal.tsx   # Patient details
│   │   └── CreatePatientForm.tsx    # Patient creation form
│   ├── ranking/                 # Resident point system components
│   │   ├── RankingView.tsx      # Ranking leaderboard
│   │   ├── TopicsList.tsx       # Topics list
│   │   ├── AdminPanel.tsx       # Admin configuration
│   │   └── ParticipationForm.tsx # Entry submission form
│   ├── scales/                  # Medical scale input components
│   │   ├── NIHSSMotorItem.tsx   # NIHSS scale items
│   │   └── [other scale components]
│   ├── shared/                  # Reusable UI components
│   │   ├── AccordionModal.tsx   # Accordion component
│   │   └── Toast.tsx            # Toast notifications
│   └── v3/                      # Version 3 components (experimental)
│       ├── dashboard/
│       ├── patients/
│       ├── resources/
│       └── admin/
├── evolucionador/               # Evolucionador sub-application (see dedicated section)
│   ├── EvolucionadorApp.tsx
│   ├── components/wizard/       # Multi-step wizard
│   ├── components/ocr/          # OCR processing
│   ├── hooks/
│   ├── services/claude/
│   ├── services/ocr/
│   ├── types/
│   └── config/
├── services/                    # Business logic layer (see Service Layer Architecture)
│   ├── interconsultasService.ts
│   ├── wardRoundsImportService.ts
│   ├── pacientesPostAltaService.ts
│   ├── academiaService.ts
│   ├── rankingService.ts
│   ├── hospitalContextService.ts
│   ├── evolucionadorDraftsService.ts
│   ├── neurologicalExamService.ts
│   ├── storageService.ts
│   ├── clipboardService.ts
│   ├── workflowIntegrationService.ts
│   ├── api.ts
│   └── patients.ts
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts              # Authentication with privilege caching
│   ├── usePatients.ts          # Patient data management
│   ├── useLumbarPuncture.ts    # Lumbar puncture data
│   ├── usePatientDetail.ts     # Patient detail loading
│   ├── useUserData.ts          # User profile data
│   └── useEscapeKey.ts         # Keyboard shortcuts
├── utils/
│   ├── supabase.js             # Supabase client configuration
│   ├── diagnosticAssessmentDB.ts # Database operations + privilege checking
│   ├── patientDataExtractor.ts  # AI text extraction utilities
│   ├── queryHelpers.ts         # Robust Supabase query patterns
│   ├── csvParser.ts            # CSV parsing utilities
│   ├── theme.ts                # Theme utilities
│   ├── pendientesSync.ts       # Task synchronization
│   ├── dashboardQueries.ts     # Dashboard queries
│   └── interconsultasUtils.ts  # Consultation utilities
├── contexts/
│   └── ThemeContext.tsx        # Dark/light theme context
├── types/                      # TypeScript type definitions (see Types Organization)
│   ├── types.ts                # Core types
│   ├── patients.ts             # Patient types
│   ├── lumbarPuncture.ts       # LP types
│   ├── residentProfile.ts      # User profile types
│   ├── neurologicalExamTypes.ts # Exam types
│   └── userTracking.ts         # User tracking types
├── config/
│   └── modules.ts              # Module visibility manifest
└── [Top-level feature components]
    ├── neurology_residency_hub.tsx (v2 - production)
    ├── neurology_residency_hub_v3.tsx (v3 - experimental)
    ├── Interconsultas.tsx
    ├── WardRounds.tsx
    ├── PendientesIntegrados.tsx
    ├── PacientesPostAlta.tsx
    └── [other feature modules]
```

### Service Layer Architecture
All Supabase and external API interactions are centralized in dedicated service files within `src/services/`. This pattern ensures consistent error handling, timeout protection, and retry logic across the application.

**Core Services**:
- **`interconsultasService.ts`** - Consultation request CRUD operations with 12-second timeout protection to prevent UI hangs. Implements robust query patterns with retry logic.
- **`wardRoundsImportService.ts`** - CSV import logic for ward rounds. Validates patient data, handles duplicate detection, and manages bulk insertions.
- **`pacientesPostAltaService.ts`** - Post-discharge patient management. Handles patient creation, updates, and calendar integration.
- **`academiaService.ts`** - Educational resources and class scheduling management. Integrates with Google Calendar API.
- **`rankingService.ts`** - Resident point system and topic management. Tracks resident participation and maintains leaderboards.
- **`hospitalContextService.ts`** - Hospital context switching logic. Manages context selection and enforces privilege-based access.
- **`evolucionadorDraftsService.ts`** - Draft auto-save and recovery for Evolucionador. Implements debounced auto-save with conflict resolution.
- **`neurologicalExamService.ts`** - Neurological examination tracking. Stores and retrieves structured exam data.
- **`storageService.ts`** - Supabase storage operations for images and videos. Handles file upload, compression, and retrieval with signed URLs.
- **`clipboardService.ts`** - Clipboard paste handling for images and videos. Extracts media from clipboard events and prepares for upload.
- **`workflowIntegrationService.ts`** - Cross-module workflow orchestration. Coordinates data flow between Interconsultas, Evolucionador, and Ward Rounds.
- **`api.ts`** - API route helpers for server-side operations. Wraps Next.js API routes with error handling.
- **`patients.ts`** - Core patient data operations. Central service for patient CRUD across all modules.

**Service Pattern**:
All services implement:
- Try-catch error handling with descriptive console logging
- Timeout protection for user-facing queries (typically 8-12 seconds)
- Return pattern: `{ data, error }` for consistent error handling
- Hospital context awareness where applicable
- Authentication checks for write operations

### TypeScript Types Organization
The application uses a distributed type system with feature-specific type files for better code organization and maintainability.

**Core Type Files** (`src/types/`):
- **`types.ts`** - Core shared types including medical scales (NIHSS, Glasgow, mRS, etc.), diagnostic assessments, and common interfaces
- **`patients.ts`** - Patient data structures, patient list interfaces, and patient-related enums
- **`lumbarPuncture.ts`** - Lumbar puncture procedure types, CSF analysis results, and LP log structures
- **`residentProfile.ts`** - User profile types, resident data structures, and profile-related interfaces
- **`neurologicalExamTypes.ts`** - Neurological examination types and structured exam data
- **`userTracking.ts`** - User activity tracking types and analytics interfaces

**Evolucionador Types** (`src/evolucionador/types/`):
- **`ocr.types.ts`** - OCR processing types, image preprocessing interfaces, and extraction results
- **`evolution.types.ts`** - Evolution note types, patient note structures, and draft interfaces
- **`claude.types.ts`** - Claude API types, vision service interfaces, and AI response structures

**Type Organization Pattern**:
- Use feature-specific type files for complex domains (e.g., Evolucionador, Lumbar Puncture)
- Keep shared, cross-feature types in `src/types/types.ts`
- Co-locate types with feature modules when types are exclusively used within that feature
- Export all types from feature index files for easy imports

### Hospital Context System
Multi-hospital data separation with privilege-based access:

- **Contexts**:
  - `Posadas` (Default): Public hospital, available to all authenticated users
  - `Julian` (Privileged): Private practice, restricted to authorized users

- **Implementation**:
  - `HospitalContextSelector.tsx`: UI component for switching contexts
  - `hospitalContextService.ts`: Business logic for context management
  - Database column `hospital_context` in tables: `diagnostic_assessments`, `ward_round_patients`, etc.
  - RLS policies enforce context-based data isolation

- **User Experience**:
  - Privileged users see context selector in Evolucionador and other relevant interfaces
  - Standard users automatically default to Posadas context
  - All saves/queries respect the active hospital context

### Admin Privilege System
Database-level privilege management (not password-based):

- **Setup**: Execute `docs/database/setup_admin_privileges.sql` in Supabase SQL Editor
- **Privilege Types** (defined in `diagnosticAssessmentDB.ts`):
  - `hospital_context_access` - Multi-hospital context switching
  - `full_admin` - Complete system access
  - `lumbar_puncture_admin` - LP system administration
  - `scale_management` - Medical scale configuration
  - `user_management` - User administration

- **Pre-configured Admin**: `julian.martin.alonso@gmail.com`
- **Checking Privileges**: Use `checkUserPrivilege()` function from `utils/diagnosticAssessmentDB.ts`
- **UI Integration**: `AdminAuthModal.tsx` auto-authenticates privileged users

## Environment Setup

Required environment variables in `.env` or `.env.local`:
```env
# Server-side Supabase config
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key

# Client-side Supabase config (NEXT_PUBLIC prefix required)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key

# Anthropic API for Claude Vision OCR (server-side only, secure)
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

**Security Note**: The `ANTHROPIC_API_KEY` is kept server-side only (no `NEXT_PUBLIC_` prefix) to prevent exposing your API key in the browser. The OCR functionality uses a secure API route at `/api/ocr` that handles Claude Vision requests server-side.

## Database Setup

### Critical Setup Steps

Para configuración completa de la base de datos, ver: `docs/database/DATABASE_SETUP.md`

Archivos SQL principales:
1. **Admin Privileges**: `docs/database/setup_admin_privileges.sql` - Create privilege system
2. **Patient Tables**: `database/supabase_diagnostic_assessments.sql` - Patient data tables
3. **Ward Rounds**: `database/setup_ward_round_patients.sql` - Ward round tracking
4. **Interconsultas**: `database/interconsultas_setup.txt` - Consultation requests
5. **Lumbar Punctures**: `database/setup_enhanced_lumbar_puncture.sql` - LP procedures
6. **Post-Alta Patients**: `database/pacientes_post_alta_setup.sql` - Post-discharge tracking
7. **Resident Profiles**: `database/resident_profiles_schema.sql` - User profiles

**Note**: All database schemas and setup instructions are documented in `docs/database/`

### Key Database Tables
- `diagnostic_assessments` - Patient evolution notes from Evolucionador
- `ward_round_patients` - Daily ward round patient data
- `interconsultas` - Consultation requests with status tracking
- `lumbar_puncture_logs` - LP procedure records
- `pacientes_post_alta` - Post-discharge patient tracking
- `resident_profiles` - User profile data
- `admin_privileges` - Privilege management system
- `medical_events` - Calendar events

### RLS Policy Pattern
All tables use Row Level Security with patterns like:
```sql
-- For VARCHAR user_id columns
auth.uid()::text = user_id

-- For UUID user_id columns
auth.uid() = user_id

-- For hospital context filtering
hospital_context IN (SELECT accessible_context FROM user_contexts WHERE user_id = auth.uid())
```

## Development Workflow

### Before Making Changes
1. `npm run lint` - Check code quality
2. `npx tsc --noEmit` - TypeScript validation (critical - catches type errors)
3. Test with `npm run dev` on default port or `npm run dev:vite` on 5173

### Adding New Features
1. **Database First**: Create table schema with RLS policies in a new `.sql` file
2. **Service Layer**: Add business logic in `src/services/[feature]Service.ts`
3. **TypeScript Types**: Define interfaces in `src/types/` directory (use feature-specific files for complex domains)
4. **Component**: Create UI component in appropriate `src/components/` subdirectory (use feature-specific subdirectories for related components)
5. **Module Configuration**: Update `src/config/modules.ts` to control module visibility and routing (set as 'core' for sidebar or 'auxiliary' for route-only access)
6. **Integration**: Add navigation in `neurology_residency_hub.tsx` sidebar menu (if core module)

**For Complex Multi-Step Features**: Reference the Evolucionador architecture as a pattern for implementing wizard-based workflows with draft management and AI integration.

### Database Changes
1. **Always implement RLS policies** for new tables
2. **User ID columns**: Use `auth.uid()::text` for VARCHAR, `auth.uid()` for UUID
3. **Hospital Context**: Add `hospital_context VARCHAR` column for multi-hospital features
4. **Test privilege levels**: Verify with both admin and standard user accounts
5. **Audit trail**: Consider adding `created_at`, `updated_at`, `created_by` columns

### Code Conventions
- **Components**: Functional components with TypeScript, use explicit return types for complex functions
- **Styling**: Tailwind CSS classes, dark mode support via `dark:` prefix
- **State Management**: React hooks (useState, useEffect), custom hooks in `src/hooks/`
- **API Calls**: Wrap Supabase calls in try-catch, implement timeout protection for user-facing queries
- **Medical Data**: Always validate inputs and handle null/undefined safely
- **Error Handling**: Log errors to console with descriptive prefixes (e.g., `🔴 Error:`, `⚠️ Warning:`)

### UI/UX Design Principles
**CRITICAL - Content-First Design**:
- **Primary content MUST be visible without scrolling** (above the fold)
- Headers and filters should be **compact and collapsible** by default
- Use horizontal layouts for filters when possible to save vertical space
- Maximum header height: **80px** (including navigation and filters)
- Filters should use dropdowns, pills, or inline controls instead of full-width sections
- **Never** create layouts where users must scroll to see the main content cards/tables
- Prioritize information density - medical staff need to see multiple items at once
- If filters are complex, use a **modal or drawer** instead of inline expansion
- Follow the "80/20 rule": 80% of viewport for content, 20% for controls

**Layout Guidelines**:
- Use `sticky` positioning for headers/filters only when absolutely necessary
- Grid/card layouts should start immediately after header (max 80px from top)
- Implement "show/hide filters" toggle if filters exceed 40px height
- Default state: filters collapsed or minimal
- Empty states should be compact and actionable

**Action Buttons & Auto-save Behavior**:
- **Rapid Actionability Principle**: All data management interfaces MUST include clearly visible action buttons:
  - **Edit button**: Always accessible for modifying existing records
  - **Delete button**: Always accessible for removing records (with confirmation when appropriate)
  - **Save button**: Always visible as a manual save option
  - Buttons should be positioned consistently across features (e.g., top-right of cards, inline with records)
  - Actions should be immediately responsive with visual feedback

- **Auto-save by Default**: Implement automatic saving in all major sections of the application:
  - **Primary behavior**: Auto-save changes automatically after user input (debounced)
  - **Manual fallback**: Maintain a visible save button as backup for user control
  - **Implementation pattern**: Use debounced auto-save (e.g., 2-3 seconds after last keystroke)
  - **Visual feedback**: Show saving status indicators (e.g., "Guardando...", "Guardado ✓")
  - **Error handling**: If auto-save fails, prominently display manual save button and error message
  - **Apply to**: Evolucionador, Interconsultas, Pendientes, Ward Rounds, Post-Alta, and all data entry forms

### Dark Theme Implementation
The application supports comprehensive dark theme:
- **Context**: `src/contexts/ThemeContext.tsx` provides theme state
- **Detection**: Respects user's system preference via `prefers-color-scheme`
- **Persistence**: Theme choice saved to localStorage
- **Application**: Use Tailwind `dark:` variants for dark mode styles
- **Components**: Most components include dark mode styling

## Medical Domain Context

### Assessment Scales (`ScaleModal.tsx`)
Complete implementation of 15+ neurological assessment tools:
- NIHSS (stroke severity), Glasgow Coma Scale, UPDRS (Parkinson's), mRS (functional outcome)
- ASPECTS (stroke imaging), CHA2DS2-VASc/HAS-BLED (anticoagulation risk)
- ICH Score (hemorrhage prognosis), MMSE/MoCA (cognitive)
- Standardized scoring with null-safe calculations using `calculateScaleScore.ts`

### Patient Data Features
- **Evolucionador**: AI-assisted clinical note generation with structured patient data extraction
- **Real-time Storage**: Immediate Supabase persistence with optimistic UI updates
- **Hospital Context**: All patient saves respect selected hospital context
- **Search & Filter**: Patient lists filterable by name, DNI, diagnosis, date range
- **Data Export**: Export capabilities for clinical records

### Interconsultas System
- **Auth Protection**: Write operations require authentication (see `interconsultasService.ts`)
- **Timeout Protection**: 12-second timeout on Supabase queries to prevent UI hangs
- **Status Tracking**: Pendiente, En Proceso, Resuelta, Cancelada states
- **Specialty Routing**: Different medical specialty categorization

## Important Notes

1. **Privilege System**: Always use `checkUserPrivilege()` from `diagnosticAssessmentDB.ts` for privilege checks, never hardcode email checks
2. **Hospital Context**: Patient-facing features must respect hospital context separation
3. **Security First**: RLS policies are mandatory for all new patient/medical data tables
4. **Medical Accuracy**: Verify scale calculations against published medical literature
5. **Timeout Protection**: User-facing Supabase queries should implement timeout protection (see interconsultas service pattern)
6. **Null Safety**: Medical data fields frequently contain null values - always use optional chaining and nullish coalescing
7. **Production Testing**: Authentication flows behave differently in production - test logout and session management thoroughly
8. **TypeScript Strict**: The codebase uses TypeScript - avoid `any` types, prefer explicit interfaces
9. **Dual Entry Points**: Be aware of both `neurology_residency_hub.tsx` (v2) and `neurology_residency_hub_v3.tsx` - v2 is currently active
10. **User Guidance**: See AGENTS.md for contributor workflow guidelines and best practices

## Documentation Structure

The project documentation is organized hierarchically in the `docs/` directory:

- **Architecture**: `docs/architecture/` - System architecture, project principles
- **Database**: `docs/database/` - Database schemas, setup scripts, security
- **Deployment**: `docs/deployment/` - Vercel deployment, production configuration
- **Features**: `docs/features/` - Feature-specific documentation
- **Planning**: `docs/planning/` - Development plans, pending tasks
- **Reports**: `docs/reports/` - Audit reports, implementation summaries

For the complete documentation index, see: `docs/README.md`

## MCP (Model Context Protocol) Configuration

The project is configured with MCP servers for enhanced Claude Code integration:

**MCP Servers Active:**
- **filesystem** - Intelligent file navigation across `src/`, `database/`, `docs/`, `pages/`
- **ripgrep** - Advanced code search with TypeScript, SQL filtering
- **shadcn** - Component library integration
- **supabase** - Database context integration

**Configuration files:**
- `.mcp.json` - MCP server definitions
- `mcp-config.json` - Server-specific configurations

This enables Claude Code to navigate the large medical codebase more efficiently and consume fewer tokens during development.

### Verifying MCP Usage

**How to ensure Claude Code uses MCP and advanced tools:**

1. **Ask explicitly** - Don't assume automatic usage:
   ```
   "Use the Explore agent to map the authentication system"
   "Enter plan mode to design this refactor"
   "Use ripgrep MCP to search for all database queries"
   ```

2. **Look for indicators** in Claude's responses:
   - ✅ "Launching Explore agent..."
   - ✅ "Using mcp__filesystem__search_files..."
   - ✅ "Entering plan mode..."
   - ❌ "Running grep command..." (should use Grep tool instead)

3. **Verification prompts**:
   ```
   "What tools and agents will you use for this task?"
   "Show me explicitly which MCP servers you're using"
   ```

4. **Force tool usage** when needed:
   ```
   "Use the Explore agent instead of reading files manually"
   "Launch multiple Explore agents in parallel to understand this system"
   ```

**Complete verification guide:** See `docs/deployment/MCP_VERIFICATION_GUIDE.md`

## Common Development Patterns

### Service Layer Pattern
All Supabase interactions should go through service files in `src/services/`:

```typescript
// Example: src/services/exampleService.ts
import { supabase } from '../utils/supabase'

export async function fetchItems() {
  try {
    const { data, error } = await Promise.race([
      supabase.from('table_name').select('*'),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('Timeout')), 12000)
      )
    ])

    if (error) throw error
    return { data, error: null }
  } catch (error) {
    console.error('🔴 Error fetching items:', error)
    return { data: null, error }
  }
}
```

### RLS Policy Template
When creating new tables with user-scoped data:

```sql
-- Enable RLS
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- For VARCHAR user_id columns
CREATE POLICY "Users can view their own records"
  ON table_name FOR SELECT
  USING (auth.uid()::text = user_id);

-- For UUID user_id columns
CREATE POLICY "Users can view their own records"
  ON table_name FOR SELECT
  USING (auth.uid() = user_id);

-- For hospital context filtering
CREATE POLICY "Users can view accessible contexts"
  ON table_name FOR SELECT
  USING (
    hospital_context = 'Posadas' OR
    (hospital_context = 'Julian' AND
     EXISTS (
       SELECT 1 FROM admin_privileges
       WHERE user_id = auth.uid()::text
       AND privilege_type = 'hospital_context_access'
     ))
  );
```

### Component Pattern
Medical feature components follow this structure:

```typescript
// Feature component in src/[FeatureName].tsx
import React, { useState, useEffect } from 'react'
import { useAuth } from './hooks/useAuth'
import { featureService } from './services/featureService'

export default function FeatureName() {
  const { user } = useAuth()
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    const { data, error } = await featureService.fetch()
    if (!error) setData(data)
    setLoading(false)
  }

  if (loading) return <div className="text-center">Cargando...</div>

  return (
    <div className="p-4 dark:bg-gray-800">
      {/* Feature content with dark mode support */}
    </div>
  )
}
```

### Privilege Checking Pattern
Always check privileges before showing admin-only features:

```typescript
import { checkUserPrivilege } from './utils/diagnosticAssessmentDB'

const [hasPrivilege, setHasPrivilege] = useState(false)

useEffect(() => {
  async function checkPrivileges() {
    const canAccess = await checkUserPrivilege(user.email, 'privilege_type')
    setHasPrivilege(canAccess)
  }
  if (user?.email) checkPrivileges()
}, [user])

// Conditionally render UI
{hasPrivilege && <AdminFeature />}
```
