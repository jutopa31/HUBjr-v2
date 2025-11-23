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
The application is organized into distinct medical/administrative modules:

- **Evolucionador (Diagnostic)**: `src/DiagnosticAlgorithmContent.tsx` - AI-assisted patient evolution notes with context-aware saving
- **Pase de Sala (Ward Rounds)**: `src/WardRounds.tsx`, `src/WardRoundsComplete.tsx` - Daily patient rounds tracking
- **Interconsultas**: `src/Interconsultas.tsx` + `src/services/interconsultasService.ts` - Consultation request management with auth guards
- **Pendientes (Tasks)**: `src/PendientesManager.tsx` - Task tracking system
- **Academia**: `src/AcademiaManager.tsx` - Educational resources and class scheduling
- **Eventos**: `src/EventManagerSupabase.tsx` - Real-time calendar with Supabase integration
- **Punciones Lumbares**: `src/components/LumbarPunctureDashboard.tsx` - Lumbar puncture tracking
- **Pacientes Post-Alta**: `src/PacientesPostAlta.tsx` - Post-discharge patient follow-up
- **Saved Patients**: `src/SavedPatients.tsx` - Patient list with hospital context filtering

### Component Organization

```
src/
├── components/
│   ├── auth/                    # Authentication system
│   │   ├── AuthProvider.tsx     # Auth context provider
│   │   ├── AuthModal.tsx        # Login modal
│   │   ├── SessionGuard.tsx     # Session protection
│   │   └── ProtectedRoute.tsx   # Route protection wrapper
│   ├── user/                    # User-specific features
│   │   ├── UserDashboard.tsx    # Personal resident dashboard
│   │   ├── MyPatients.tsx       # Personal patient list
│   │   ├── ResidentProfile.tsx  # Profile management
│   │   └── ProcedureLogger.tsx  # Procedure tracking
│   ├── admin/                   # Administrative interfaces
│   │   ├── UserCreator.tsx      # User management
│   │   └── OCRProcessorModal.tsx # OCR document processing
│   ├── layout/
│   │   └── Sidebar.tsx          # Main navigation sidebar with theme support
│   ├── patients/                # Patient management components
│   │   ├── PatientsList.tsx
│   │   ├── PatientsFilters.tsx
│   │   └── PatientDetailDrawer.tsx
│   └── v3/                      # Version 3 components (newer architecture)
│       ├── dashboard/
│       ├── patients/
│       ├── resources/
│       └── admin/
├── services/                    # Business logic layer
│   ├── interconsultasService.ts # Interconsultas CRUD with timeout protection
│   ├── pacientesPostAltaService.ts
│   ├── patients.ts              # Patient data service
│   ├── neurologicalExamService.ts
│   └── hospitalContextService.ts # Hospital context management
├── hooks/                       # Custom React hooks
│   ├── useAuth.ts              # Authentication hook with privilege detection
│   ├── usePatients.ts          # Patient data management
│   └── useLumbarPuncture.ts    # Lumbar puncture data
├── utils/
│   ├── supabase.js             # Supabase client configuration
│   ├── diagnosticAssessmentDB.ts # Database operations + privilege checking
│   ├── patientDataExtractor.ts  # AI text extraction utilities
│   └── theme.ts                 # Theme utilities
├── contexts/
│   └── ThemeContext.tsx         # Dark/light theme context
└── types.ts                     # Shared TypeScript definitions
```

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

- **Setup**: Execute `setup_admin_privileges.sql` in Supabase SQL Editor
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
```

## Database Setup

### Critical Setup Steps
1. **Admin Privileges**: Run `setup_admin_privileges.sql` to create privilege system
2. **Patient Tables**: Run `supabase_diagnostic_assessments.sql` for patient data tables
3. **Ward Rounds**: Run `database/setup_ward_round_patients.sql`
4. **Interconsultas**: Run `database/interconsultas_setup.txt`
5. **Lumbar Punctures**: Run `database/setup_enhanced_lumbar_puncture.sql`
6. **Post-Alta Patients**: Run `database/pacientes_post_alta_setup.sql`
7. **Resident Profiles**: Run `database/resident_profiles_schema.sql`

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
3. **TypeScript Types**: Define interfaces in `src/types.ts` or feature-specific type files
4. **Component**: Create UI component in appropriate `src/components/` subdirectory
5. **Integration**: Add navigation in `neurology_residency_hub.tsx` sidebar menu

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
