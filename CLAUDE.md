# CLAUDE.md

This file provides comprehensive guidance to Claude Code (claude.ai/code) when working with the HubJR v2 neurology residency management platform.

## Development Commands

### Primary Development
```bash
npm run dev          # Next.js development server (auto-detects port, usually 3000)
npm run build        # Production build with Next.js
npm run start        # Start production server
npm run lint         # ESLint checking and error detection
```

### Alternative Build System
```bash
npm run dev:vite          # Vite development server (http://localhost:5173)
npm run build:vite        # TypeScript compilation + Vite build
npm run preview:vite      # Preview Vite production build
```

### Quality Assurance
```bash
npm run lint              # ESLint checking
npm run audit:responsive  # Run responsive design audit script
npx tsc --noEmit         # TypeScript type checking without compilation
```

### Testing
**Note**: No test framework is currently configured. Manual testing is performed using development servers. Playwright is available as a dependency for potential E2E testing implementation.

## Architecture Overview

### Technology Stack
- **Next.js 14.2.32** - Primary framework for production builds with dual build system
- **React 18.2.0** with TypeScript 5.2.2 - Frontend framework with strict type checking
- **Supabase 2.56.1** - Real-time database, authentication, and Row Level Security (RLS)
- **Tailwind CSS** - Utility-first CSS framework with medical interface optimizations
- **Vite 5.2.0** - Alternative fast development build tool
- **Lucide React** - Comprehensive icon system for medical interfaces
- **Real-time Features** - Live updates for collaborative learning environment

### Core Application Structure

**Main Entry Point**: `src/neurology_residency_hub.tsx` - The primary application hub (5,699 lines) serving as the central medical residency management interface

**Core Medical Components**:
- `src/components/LumbarPunctureDashboard.tsx` - **NEW**: Full lumbar puncture management with shared access
- `src/components/LumbarPunctureForm.tsx` - Comprehensive procedure data entry
- `src/components/LumbarPunctureResults.tsx` - **ENHANCED**: Department-wide results viewing and analytics
- `src/WardRounds.tsx` - Patient ward management system
- `src/SavedPatients.tsx` - Patient data persistence and management
- `src/EventManagerSupabase.tsx` - Real-time calendar and event management
- `src/DiagnosticAlgorithmContent.tsx` - Medical assessment scales and algorithms
- `src/ScaleModal.tsx` - Modal interface for neurological evaluations
- `src/components/NeurologicalExamModal.tsx` - Comprehensive neurological examination interface

**Feature Modules**:
- `src/AcademiaManager.tsx` - **ENHANCED**: Academic schedule and education management with RLS
- `src/PendientesManager.tsx` - Task and pending items management
- `src/RecursosManager.tsx` - **SECURED**: Resource management system with user favorites
- `src/AIBadgeSystem.tsx` - AI-powered badge and achievement system
- `src/GoogleCalendarIntegration.tsx` - External calendar synchronization

**Authentication & User Management**:
- `src/components/auth/` - **ENHANCED**: Complete authentication system with auto-initialization
- `src/components/user/` - User-specific components (MyPatients, EducationTracker, Goals, etc.)
- `src/components/admin/UserCreator.tsx` - **NEW**: Admin user creation interface

**Authentication Architecture**:
- `AuthProvider.tsx` - React context for authentication state with enhanced error handling
- `ProtectedRoute.tsx` - Route protection wrapper with user initialization
- `LoginForm.tsx` - User login interface with production logout fixes
- `UserMenu.tsx` & `SimpleUserMenu.tsx` - User profile management
- `useAuth.ts` - **ENHANCED**: Custom authentication hook with comprehensive cache clearing

### Medical Features Architecture

**Lumbar Puncture System** - **MAJOR ENHANCEMENT**:
- **Shared Educational Access**: All residents can view all procedures for collaborative learning
- **Comprehensive Tracking**: 60+ fields including clinical details, technique, outcomes
- **Three-Table System**:
  - `lumbar_punctures` - Main procedure data
  - `csf_analysis_results` - Detailed laboratory results and biomarkers
  - `lp_complications` - Comprehensive complication tracking
- **Department Analytics**: Statistical functions for resident comparison and department metrics
- **Secure View**: `lumbar_punctures_with_names` view with RLS-compliant resident name display

**Assessment Scales**: Complete implementation of standardized neurological evaluation tools:
- NIHSS (National Institutes of Health Stroke Scale)
- Glasgow Coma Scale
- UPDRS I-IV (Unified Parkinson's Disease Rating Scale)
- Modified Rankin Scale (mRS)
- ASPECTS, CHA2DS2-VASc, HAS-BLED, ICH Score
- MMSE, MoCA, Hunt & Hess Scale
- **Enhanced**: Safe calculation functions with null checking

**Patient Management**:
- Real-time patient data with Supabase integration
- Ward rounds management with patient tracking
- Clinical notes and assessment history
- Archive and delete functionality with validation
- **NEW**: User-specific patient tracking with RLS policies

**Event Management**:
- Supabase-powered real-time calendar system
- Event categorization (clinical, academic, administrative, social, emergency)
- CRUD operations with professional inline editing interface

### Database Integration & Security

**Supabase Configuration**:
- Real-time subscriptions for events and patient data
- **ENHANCED**: Comprehensive Row Level Security (RLS) on all tables
- Environment variables: `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- **SECURED**: Authentication with automatic user profile creation

**Key Tables with RLS Policies**:
- `lumbar_punctures` - **SHARED ACCESS**: Read access for all users, write access for owners
- `csf_analysis_results` - Linked to lumbar punctures with proper security
- `lp_complications` - Complication tracking with user restrictions
- `academic_resources` - **SECURED**: Educational content with RLS
- `user_resource_favorites` - **SECURED**: User-specific favorites with UUID/VARCHAR type handling
- `academic_classes` - **SECURED**: Class management with attendance tracking
- `class_attendance` - **SECURED**: User-specific attendance records
- `user_procedures`, `user_patients`, `user_classes`, `user_reviews`, `user_goals` - **SECURED**: Individual tracking tables
- `medical_events` - Calendar events with categorization
- `resident_profiles` - **ENHANCED**: Comprehensive resident information with auto-sync

**Security Improvements**:
- **Fixed Supabase Security Warnings**: Resolved all auth.users exposure and SECURITY DEFINER issues
- **Type Safety**: Fixed VARCHAR/UUID comparison issues in RLS policies
- **Comprehensive RLS**: Every public table secured with appropriate policies
- **User Isolation**: Proper data segregation while maintaining educational sharing

### Build Configuration

**Dual Build System**:
- Next.js for production deployment (recommended)
- Vite for fast development (alternative)

**Environment Setup**:
- Copy `.env.example` to `.env` and configure required API keys
- **Required Supabase Variables**:
  - `SUPABASE_URL` & `SUPABASE_ANON_KEY` - Server-side access
  - `NEXT_PUBLIC_SUPABASE_URL` & `NEXT_PUBLIC_SUPABASE_ANON_KEY` - Client-side access
- Optional: Google Calendar API keys, AI service API keys (OpenAI, Anthropic, Google AI)
- Optional: Medical data encryption keys for HIPAA compliance

**Fallback Configuration**: Supabase client includes hardcoded fallback credentials for development

### Code Conventions

**Component Patterns**:
- Functional components with TypeScript interfaces
- React hooks (useState, useEffect, useCallback) for state management
- Modal-based UI interactions for complex workflows
- Tailwind CSS for styling with professional medical interface design
- **Enhanced**: Comprehensive error handling and null safety

**File Organization**:
- Main application components in `src/` root
- Feature-specific components in `src/components/[feature]/`
- Authentication system in `src/components/auth/`
- User-specific features in `src/components/user/`
- Admin features in `src/components/admin/`
- Utility functions in `src/utils/`
- TypeScript type definitions in `src/types/` (comprehensive type system)
- Custom hooks in `src/hooks/`
- Services in `src/services/`

**Medical Data Handling**:
- Input validation for all medical assessments
- Standardized scoring methodologies
- Copy-to-clipboard functionality for clinical documentation
- Patient data encryption and HIPAA compliance considerations
- **Enhanced**: Null-safe statistical calculations

### Development Notes

**Authentication**:
- Uses Supabase Auth with protected routes and automatic user initialization
- **ENHANCED**: Production-safe logout with comprehensive cache clearing
- Admin functions require special authentication through `AdminAuthModal.tsx`
- **NEW**: Automatic user profile creation and metadata synchronization

**State Management**:
- React's built-in state management with component-level state
- Context-based authentication with enhanced error handling
- **NEW**: Shared state management for lumbar puncture filtering and analytics

**Responsive Design**:
- Tailwind CSS with mobile-first approach
- Use `npm run audit:responsive` to check responsive behavior
- **Enhanced**: Mobile-optimized medical interfaces

**Medical Compliance**:
- All medical scales follow internationally validated scoring systems
- Ensure accuracy when modifying scale calculations
- **Enhanced**: Safe arithmetic operations with null checking

### Deployment

**Production**:
- Vercel deployment with environment variables configured in dashboard
- **ENHANCED**: Production-specific authentication handling
- **FIXED**: Logout issues in production environment with cache clearing

**Development**: Both Next.js and Vite development servers available

### Hooks & Services Architecture

**Custom Hooks**:
- `useAuth.ts` - **ENHANCED**: Authentication state management with production fixes
- `useLumbarPuncture.ts` - **ENHANCED**: Shared access lumbar puncture management
- `useUserData.ts` - **ENHANCED**: User profile and statistics with error handling
- `useEscapeKey.ts` - Modal escape key handling
- **NEW**: `useLPFilters.ts` - Lumbar puncture filtering state
- **NEW**: `useDepartmentLPStats.ts` - Department-wide analytics

**Services**:
- `services/api.ts` - API communication layer
- `services/neurologicalExamService.ts` - Neurological examination logic
- `services/ocrService.ts` - Optical character recognition for medical documents
- `utils/supabase.js` - **ENHANCED**: Database client with production logout fixes
- `utils/patientDataExtractor.ts` - Patient data processing utilities
- `aiTextAnalyzer.ts` - AI-powered text analysis for medical content

### Medical Data Processing

**Assessment Systems**:
- `calculateScaleScore.ts` - **ENHANCED**: Standardized neurological scale calculations with null safety
- `utils/diagnosticAssessmentDB.ts` - Assessment result persistence
- Complete implementation of NIHSS, Glasgow Coma Scale, UPDRS I-IV, and 15+ other scales
- **NEW**: Department-wide statistics and comparison functions

**Document Processing**:
- OCR integration for medical document analysis
- AI-powered text extraction and clinical note processing
- Lumbar puncture result analysis and storage

### Database Setup & Security

**Critical Setup Requirements**:
1. **Execute Security Fixes**: Run `fix_supabase_security_warnings.sql` to resolve all security warnings
2. **Alternative Setup**: Use `create_secure_user_profiles.sql` for enhanced security approach
3. **Type Fixes**: Run `fix_type_mismatch_error.sql` if encountering VARCHAR/UUID issues
4. **User Initialization**: Run `fix_user_authentication_issues.sql` for comprehensive user setup
5. **Lumbar Puncture Sharing**: Run `update_lumbar_puncture_shared_access.sql` for collaborative features

**Security SQL Scripts** (All located in project root):
- `fix_supabase_security_warnings.sql` - **REQUIRED**: Main security fixes
- `fix_type_mismatch_error.sql` - Type safety corrections
- `fix_rls_policies_varchar.sql` - Alternative VARCHAR handling
- `create_secure_user_profiles.sql` - Enhanced user profile approach
- `update_lumbar_puncture_shared_access.sql` - Shared educational access

### Development Workflow

**Before making changes**:
1. Run `npm run lint` to check for code quality issues
2. Run `npx tsc --noEmit` for TypeScript type checking
3. Test locally with `npm run dev` (Next.js) or `npm run dev:vite` (Vite)
4. Use `npm run audit:responsive` to check responsive design
5. **NEW**: Verify RLS policies are working correctly after database changes

**Database Security Checklist**:
1. All new tables must have RLS enabled: `ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;`
2. Create appropriate policies for SELECT, INSERT, UPDATE, DELETE operations
3. Use `auth.uid()::text` for VARCHAR user_id columns, `auth.uid()` for UUID columns
4. Test policies with different user roles
5. Avoid exposing `auth.users` table directly in views

**Recent Changes to be Aware of**:
1. **Lumbar Puncture System**: Now supports shared access for educational purposes
2. **Authentication**: Enhanced with production-safe logout and cache clearing
3. **Database Security**: Comprehensive RLS policies implemented across all tables
4. **User Management**: Automatic profile creation and initialization
5. **Type Safety**: Fixed all VARCHAR/UUID comparison issues

**File Structure Conventions**:
- Main application: `src/neurology_residency_hub.tsx` (5,699 lines)
- Security fixes: Root-level SQL files with descriptive names
- Component organization by medical specialty and functionality
- Comprehensive TypeScript interfaces in `src/types/`

## Important Notes for Future Development

1. **Security First**: Always implement RLS policies when creating new tables
2. **Shared Learning**: Maintain educational access while respecting privacy
3. **Type Safety**: Use proper type casting for database operations
4. **Error Handling**: Implement null-safe operations for all medical calculations
5. **Production Compatibility**: Test authentication and logout in production environment
6. **Medical Accuracy**: Verify all medical scale calculations against validated standards

This platform represents a sophisticated medical education system with robust security, comprehensive procedure tracking, and collaborative learning environment for neurology residents.