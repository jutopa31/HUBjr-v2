# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

### Primary Development
```bash
npm run dev          # Next.js development server (auto-detects port, usually 3001)
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
**Note**: No test framework is currently configured. Manual testing is performed using development servers.

## Architecture Overview

### Technology Stack
- **Next.js 14.2.32** - Primary framework for production builds
- **React 18.2.0** with TypeScript - Frontend framework
- **Supabase** - Real-time database and authentication backend
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Alternative fast development build tool

### Core Application Structure

**Main Entry Point**: `src/neurology_residency_hub.tsx` - The primary application hub (extensive component, 1700+ lines)

**Key Components**:
- `src/WardRounds.tsx` - Patient ward management system
- `src/SavedPatients.tsx` - Patient data persistence and management
- `src/EventManagerSupabase.tsx` - Real-time calendar and event management
- `src/DiagnosticAlgorithmContent.tsx` - Medical assessment scales and algorithms
- `src/ScaleModal.tsx` - Modal interface for neurological evaluations
- `src/components/auth/` - Authentication system components

**Authentication Architecture**:
- `AuthProvider.tsx` - React context for authentication state
- `ProtectedRoute.tsx` - Route protection wrapper
- `LoginForm.tsx` - User login interface
- `UserMenu.tsx` & `SimpleUserMenu.tsx` - User profile management

### Medical Features Architecture

**Assessment Scales**: Complete implementation of standardized neurological evaluation tools:
- NIHSS (National Institutes of Health Stroke Scale)
- Glasgow Coma Scale
- UPDRS I-IV (Unified Parkinson's Disease Rating Scale)
- Modified Rankin Scale (mRS)
- ASPECTS, CHA2DS2-VASc, HAS-BLED, ICH Score
- MMSE, MoCA, Hunt & Hess Scale

**Patient Management**:
- Real-time patient data with Supabase integration
- Ward rounds management with patient tracking
- Clinical notes and assessment history
- Archive and delete functionality with validation

**Event Management**:
- Supabase-powered real-time calendar system
- Event categorization (clinical, academic, administrative, social, emergency)
- CRUD operations with professional inline editing interface

### Database Integration

**Supabase Configuration**:
- Real-time subscriptions for events and patient data
- Environment variables required: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Authentication handled through Supabase Auth

**Key Tables**:
- `medical_events` - Calendar events with categorization
- Patient data tables (refer to DATABASE_SETUP.md for schema)

### Build Configuration

**Dual Build System**:
- Next.js for production deployment (recommended)
- Vite for fast development (alternative)

**Environment Setup**:
- Copy `.env.example` to `.env` and configure required API keys
- Supabase credentials required: `SUPABASE_URL`, `SUPABASE_ANON_KEY`
- Optional: Google Calendar API keys, AI service API keys (OpenAI, Anthropic, Google AI)
- Medical data encryption keys for HIPAA compliance

### Code Conventions

**Component Patterns**:
- Functional components with TypeScript interfaces
- React hooks (useState, useEffect, useCallback) for state management
- Modal-based UI interactions for complex workflows
- Tailwind CSS for styling with professional medical interface design

**File Organization**:
- Components grouped by functionality in `src/components/`
- Authentication components isolated in `src/components/auth/`
- Main feature components in `src/` root
- TypeScript definitions should be co-located or in dedicated types files

**Medical Data Handling**:
- Input validation for all medical assessments
- Standardized scoring methodologies
- Copy-to-clipboard functionality for clinical documentation
- Patient data encryption and HIPAA compliance considerations

### Development Notes

**Authentication**: The app uses Supabase Auth with protected routes. Admin functions require special authentication through `AdminAuthModal.tsx`.

**State Management**: Primarily uses React's built-in state management with component-level state and context for authentication.

**Responsive Design**: Tailwind CSS with mobile-first approach. Use `npm run audit:responsive` to check responsive behavior.

**Medical Compliance**: All medical scales follow internationally validated scoring systems. Ensure accuracy when modifying scale calculations.

### Deployment

**Production**: Vercel deployment with environment variables configured in dashboard
**Development**: Both Next.js and Vite development servers available
**Environment Variables**: Copy `.env.example` to `.env` and configure all required API keys

### Development Workflow

**Before making changes**:
1. Run `npm run lint` to check for code quality issues
2. Run `npx tsc --noEmit` for TypeScript type checking
3. Test locally with `npm run dev` (Next.js) or `npm run dev:vite` (Vite)

**File Structure Conventions**:
- Main application components in `src/` root
- Reusable UI components in `src/components/`
- Authentication system in `src/components/auth/`
- Utility functions in `src/utils/`
- TypeScript type definitions in `src/types/` or co-located with components
- API routes in `pages/api/` (Next.js) or `api/` (legacy)