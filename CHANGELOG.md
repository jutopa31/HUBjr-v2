# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

## [2025-10-23]

### Fixed
- **Hospital Context Synchronization in Evolucionador (Diagnostic Algorithm)**: Resolved critical issue where patients were not being saved to the correct hospital context
  - Fixed `SavePatientModal` to properly sync with global hospital context using `useEffect`
  - Eliminated duplicate hospital context selectors causing state desynchronization
  - Implemented single global hospital context selector in main layout
  - Removed redundant selectors from `SavedPatients` component
  - Removed hospital context selector from `SavePatientModal` to prevent user confusion
  - Added visual banner in save modal clearly indicating target hospital context
  - **Impact**: Patients now save correctly to selected hospital context (Posadas/Julian)
  - **Root Cause**: Modal had independent state that didn't update when global context changed
  - **Solution**: Centralized hospital context management with single source of truth

### Changed
- Increased privilege check timeout from 3 to 10 seconds to handle multiple sequential database calls
  - Prevents "Privilege check timeout" errors during authentication
  - Improves reliability of hospital context access verification
- Enhanced logging for hospital context operations with clear emoji indicators (🏥)
  - `[SavePatientModal]` logs now show context updates and save operations
  - `[SavedPatients]` logs track context synchronization
  - `[DiagnosticAlgorithm]` logs display context when opening save modal
- Success messages now include hospital context name for clarity
  - "Paciente guardado exitosamente en Hospital Posadas"
  - "Paciente guardado exitosamente en Consultorios Julian"

### Removed
- Duplicate hospital context selectors across multiple components
- `isAdminMode` prop from `SavePatientModal` (no longer needed)
- `useAuthContext` import from `DiagnosticAlgorithmContent` (unused after refactor)

## [2025-09-30]

### Fixed
- **Ward Rounds (Pase de Sala) bootloop issue**: Resolved infinite loading state when browser had stale/expired JWT tokens
  - Added session clear guard in `useAuth` hook to prevent authentication state loops
  - Implemented auth initialization guard to prevent duplicate initialization
  - Added detailed logging for auth state transitions for better debugging
  - Prevented `onAuthStateChange` updates during session clearing operations
  - Added 10-second safety timeout in WardRounds component as ultimate fallback
  - Ensured loading state properly transitions to `false` after stale session clearing
  - **Impact**: Ward Rounds now loads correctly in all scenarios:
    - Normal browser mode with stale/expired sessions
    - Incognito mode (fresh state)
    - After logout/login (refreshed state)
  - **Commits**: `61d9e6c`, `dcfbaf4`

### Changed
- Optimized session checks to be non-blocking in patient update operations
- Removed manual Promise.race timeouts that were causing stuck operations
- Simplified archive, task deletion, and patient deletion processes

## [2025-09-23]

### Added
- Admin privileges implementation with database-level access control
- Hospital context system (Posadas/Julian) with privilege-based access
- Resident profiles table and management system

### Changed
- Migrated from password-based admin access to database privilege system
- Enhanced security with Row Level Security (RLS) policies

## Previous Changes

See git history for changes prior to September 2025.

---

## How to Use This Changelog

### For Developers
When making changes:
1. Add entries under `[Unreleased]` section
2. Use categories: `Added`, `Changed`, `Deprecated`, `Removed`, `Fixed`, `Security`
3. Include commit references when relevant
4. Move to dated section when releasing

### Categories
- **Added**: New features
- **Changed**: Changes in existing functionality
- **Deprecated**: Soon-to-be removed features
- **Removed**: Removed features
- **Fixed**: Bug fixes
- **Security**: Vulnerability fixes
