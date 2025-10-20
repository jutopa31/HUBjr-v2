# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

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
