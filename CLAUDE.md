# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev              # Next.js development server
npm run dev:vite         # Vite development server (http://localhost:5173)

# Build & Deploy
npm run build            # Production build with Next.js
npm run start            # Start production server
npm run build:vite       # Alternative Vite build

# Quality Assurance
npm run lint             # ESLint checking
npx tsc --noEmit        # TypeScript type checking
npm run audit:responsive # Responsive design audit
```

## Architecture Overview

### Main Application
- **Entry Point**: `src/neurology_residency_hub.tsx` - Central medical residency management interface
- **Technology Stack**: Next.js 14 + React 18 + TypeScript + Supabase + Tailwind CSS
- **Dual Build System**: Next.js (production) + Vite (fast development)

### Key Components
- **Authentication**: `src/components/auth/` - Privilege-based authentication system
- **Medical Features**: `src/DiagnosticAlgorithmContent.tsx`, `src/ScaleModal.tsx`
- **User Management**: `src/AdminAuthModal.tsx`, `src/HospitalContextSelector.tsx`
- **Database Integration**: `src/utils/supabase.js`

### Hospital Context System
- **Posadas** (Default): Available to all users
- **Julian** (Privileged): Restricted access for authorized users
- Privileged users can switch contexts; standard users see Posadas only

## Environment Setup

Required environment variables:
```env
SUPABASE_URL=your-supabase-url
SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## Database Setup

**Critical**: Execute `setup_admin_privileges.sql` in Supabase for privilege system.
- Creates admin privilege tables and policies
- Pre-configures access for `julian.martin.alonso@gmail.com`

## Development Workflow

### Before Making Changes
1. `npm run lint` - Check code quality
2. `npx tsc --noEmit` - TypeScript validation
3. Test with `npm run dev`

### Database Changes
1. **Always implement RLS policies** for new tables
2. Use `auth.uid()::text` for VARCHAR user_id columns
3. Use `auth.uid()` for UUID columns
4. Test with different user privilege levels

### Code Conventions
- Functional React components with TypeScript
- Tailwind CSS for styling
- Medical data requires input validation and null safety
- Follow existing patterns in `src/components/` organization

## Medical Domain Context

### Assessment Scales
- Complete neurological evaluation tools (NIHSS, Glasgow Coma, UPDRS, etc.)
- Standardized scoring with null-safe calculations
- Located in `src/ScaleModal.tsx` and `src/DiagnosticAlgorithmContent.tsx`

### Patient Management
- Real-time patient data with Supabase
- Hospital context separation for data isolation
- User-specific tracking with RLS policies

### Admin Privileges
Database-level access control with privilege types:
- `hospital_context_access` - Multi-hospital access
- `full_admin` - Complete administrative access
- `lumbar_puncture_admin`, `scale_management`, `user_management`

## File Structure

```
src/
├── neurology_residency_hub.tsx    # Main application
├── components/
│   ├── auth/                       # Authentication system
│   ├── user/                       # User-specific features
│   └── admin/                      # Admin interfaces
├── utils/supabase.js              # Database client
├── types.ts                       # TypeScript definitions
└── hooks/                         # Custom React hooks
```

## Important Notes

1. **Privilege System**: Use database privileges instead of password-based admin access
2. **Hospital Context**: Ensure patient features respect context separation
3. **Security First**: Always implement RLS policies for new tables
4. **Medical Accuracy**: Verify scale calculations against validated standards
5. **Production Testing**: Test authentication and logout in production environment