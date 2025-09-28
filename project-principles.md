# HUBJR - Medical Residency Hub Project Principles

This document serves as the central reference point for the HUBJR (Medical Residency Hub) project's principles, standards, and practices. It establishes the foundational guidelines that will ensure consistent development and maintain the project's vision throughout its lifecycle.

## Project Vision and Objectives

### Vision
HUBJR is designed to be a comprehensive digital platform that enhances the educational experience for neurology residents while streamlining administrative processes for hospital staff. The hub serves as a centralized resource for learning materials, case studies, scheduling, and professional development tracking.

### Key Objectives

1. **Centralized Learning Management**: Provide a unified platform where neurology residents can access course materials, clinical guidelines, case studies, and educational resources in an organized, searchable format.

2. **Efficient Scheduling and Rotation Management**: Streamline the complex process of managing resident rotations, call schedules, and clinical assignments while ensuring optimal learning opportunities and hospital coverage.

3. **Progress Tracking and Assessment**: Implement comprehensive tools for tracking resident progress, competency assessments, and milestone achievements to support both educational goals and accreditation requirements.

4. **Enhanced Communication and Collaboration**: Facilitate better communication between residents, attending physicians, and administrative staff through integrated messaging, announcement systems, and collaborative tools.

5. **Data-Driven Insights**: Generate meaningful analytics and reports that help program directors make informed decisions about curriculum improvements, resource allocation, and resident performance optimization.

### Benefits

- **For Residents**: Improved access to learning resources, clearer visibility into schedules and requirements, and better tracking of professional development progress
- **For Hospital Staff**: Reduced administrative burden, better resource management, and improved oversight of residency program compliance
- **For the Institution**: Enhanced program quality, better data for accreditation purposes, and improved overall efficiency in residency management

## Coding Style Standards

### Naming Conventions

#### Variables and Functions
- Use **camelCase** for variables and functions: `patientRecord`, `calculateRotationHours()`
- Use descriptive names that clearly indicate purpose: `residentScheduleData` instead of `data`
- Boolean variables should start with verbs: `isActive`, `hasCompleted`, `canAccess`

#### Files and Directories
- Use **kebab-case** for file names: `resident-dashboard.js`, `rotation-scheduler.vue`
- Use **PascalCase** for component files: `PatientCaseCard.vue`, `ScheduleCalendar.js`
- Directory names should be lowercase with hyphens: `patient-cases/`, `schedule-management/`

#### Constants
- Use **SCREAMING_SNAKE_CASE** for constants: `MAX_ROTATION_HOURS`, `DEFAULT_NOTIFICATION_SETTINGS`

### Linter Configuration
- **Primary Linter**: ESLint with medical-specific rules
- **Configuration**: Extend from `@eslint/recommended` and `@typescript-eslint/recommended`
- **Custom Rules**:
  - Enforce JSDoc comments for all medical data handling functions
  - Require explicit error handling for patient data operations
  - Mandate input validation for all user-facing forms

### Code Formatter
- **Primary Formatter**: Prettier
- **Settings**:
  ```json
  {
    "semi": true,
    "trailingComma": "es5",
    "singleQuote": true,
    "printWidth": 100,
    "tabWidth": 2,
    "useTabs": false
  }
  ```

### Best Practices Examples

#### Good Practice ✅
```javascript
// Clear, descriptive function with proper error handling
async function calculateResidentWorkHours(residentId, startDate, endDate) {
  try {
    validateDateRange(startDate, endDate);
    const scheduleData = await fetchScheduleData(residentId, startDate, endDate);
    return scheduleData.reduce((total, shift) => total + shift.hours, 0);
  } catch (error) {
    logger.error('Failed to calculate work hours', { residentId, error });
    throw new MedicalDataError('Unable to calculate resident work hours');
  }
}
```

#### Bad Practice ❌
```javascript
// Unclear naming, no error handling, hardcoded values
function calc(id, d1, d2) {
  const data = getData(id, d1, d2);
  return data.map(x => x.h).reduce((a, b) => a + b, 0);
}
```

## Common Commands and Hooks

### Development Commands

#### Local Development
```bash
# Start development server
npm run dev

# Start with medical data mock server
npm run dev:with-mocks

# Run in HIPAA compliance mode (production-like)
npm run dev:secure
```

#### Testing
```bash
# Run all tests
npm test

# Run tests with coverage report
npm run test:coverage

# Run medical data validation tests
npm run test:medical-validation

# Run accessibility compliance tests
npm run test:a11y
```

#### Building and Deployment
```bash
# Build for production
npm run build

# Build with medical compliance checks
npm run build:hipaa

# Preview production build
npm run preview
```

### Pre-commit Hooks

The following hooks run automatically before each commit:

1. **Code Formatting**: Prettier formats all staged files
2. **Linting**: ESLint checks for code quality and medical-specific rules
3. **Medical Data Validation**: Custom scripts verify HIPAA compliance patterns
4. **Test Validation**: Run critical medical data handling tests

```bash
# Install pre-commit hooks
npm run prepare

# Manually run pre-commit checks
npm run pre-commit
```

### Post-commit Hooks

After each successful commit:

1. **Type Checking**: TypeScript compiler validates all type definitions
2. **Security Scan**: Automated security vulnerability assessment
3. **Medical Compliance Check**: Validate against healthcare industry standards
4. **Documentation Update**: Auto-generate API documentation if interfaces changed

```bash
# Manually run post-commit checks
npm run post-commit

# Run comprehensive compliance audit
npm run audit:medical
```

### Database and Migration Commands

```bash
# Run database migrations
npm run db:migrate

# Seed development database with sample data
npm run db:seed:dev

# Create new migration file
npm run db:migration:create <migration_name>

# Reset database (development only)
npm run db:reset
```

---

---

## Current Project Status (Updated: August 31, 2025)

### ✅ STABLE WORKING VERSION
- **Repository**: https://github.com/jutopa31/HUBjr-v2 (Main working repository)
- **Status**: Fully functional neurology residency hub with Supabase integration
- **Key Achievement**: Replaced static Google Calendar with dynamic Supabase-powered event management

### Major Components Implemented:
- **Main Hub**: Complete neurology residency interface (`src/neurology_residency_hub.tsx`)
- **Event Management**: Real-time Supabase integration (`src/EventManagerSupabase.tsx`)  
- **Medical Scales**: 15+ neurological assessment tools with proper calculations
- **Diagnostic Algorithms**: Evidence-based clinical decision support
- **Professional UI**: Tailwind CSS with Lucide React icons

### Deployment Architecture:
- **Frontend**: React 18 + TypeScript + Next.js 14
- **Database**: Supabase with `medical_events` table
- **Hosting**: Vercel with automatic deployment
- **API**: Next.js serverless functions (`pages/api/events.js`)

---

**Note**: This file is automatically loaded into Claude's context for each development session, ensuring consistent guidance and adherence to project principles throughout the HUBJR development lifecycle. All team members should familiarize themselves with these standards and refer to this document when making development decisions.