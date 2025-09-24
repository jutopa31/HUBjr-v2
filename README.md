# HUBJR - Neurology Residency Hub

[![Vercel Status](https://img.shields.io/badge/Vercel-Deployed-brightgreen)](https://github.com/jutopa31/HUBjr-v2)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.31-blue)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E)](https://supabase.com/)

## 🏥 Overview

**HUBJR** (Neurology Residency Hub) is a comprehensive digital platform designed specifically for neurology residents at Hospital Nacional Posadas. It provides essential clinical tools, diagnostic algorithms, educational resources, and administrative management in a unified interface with secure multi-hospital context support.

### ✨ Key Features

- **🧠 Medical Scales & Assessments**: Complete implementation of NIHSS, Glasgow Coma Scale, UPDRS, mRS, and 15+ other neurological assessment tools
- **📊 Diagnostic Algorithms**: Evidence-based diagnostic pathways for neurological conditions
- **🏥 Multi-Hospital Context**: Secure separation between Hospital Posadas and Consultorios Julian with privilege-based access
- **🔐 Admin Privilege System**: Database-level user privilege management with automatic authentication
- **📅 Event Management**: Supabase-powered real-time calendar for academic and clinical events
- **📝 Patient Notes**: AI-assisted clinical documentation tools with context-aware saving
- **🎯 Personalized Dashboard**: Tailored interface for neurology residents

## 🚀 Current Status: STABLE ✅

- **Version**: 2.4.0 (Production Deployment with Admin Privilege System)
- **Repository**: https://github.com/jutopa31/HUBjr-v2
- **Live URL**: https://hubjr-v2.vercel.app/
- **Technology Stack**: React + TypeScript + Next.js + Supabase + Admin Privileges + Hospital Context Management
- **Deployment**: Active production deployment on Vercel
- **Security**: Database-level privilege system with RLS policies
- **Multi-Context Support**: Secure hospital data separation

## 🛠️ Technical Architecture

### Frontend
- **React 18.2.0** with TypeScript
- **Tailwind CSS** for responsive design
- **Lucide React** for professional medical iconography
- **Vite** for fast development builds

### Backend & Database
- **Next.js API Routes** for serverless functions
- **Supabase** for real-time database, authentication, and privilege management
- **Row Level Security (RLS)** for database-level access control
- **Admin Privilege System** with audit trail
- **Vercel** for deployment and hosting

### Key Components
- `neurology_residency_hub.tsx` - Main application hub with hospital context management
- `DiagnosticAlgorithmContent.tsx` - Clinical decision support with context-aware patient saving
- `AdminAuthModal.tsx` - Privilege-based authentication with auto-login for authorized users
- `HospitalContextSelector.tsx` - Secure hospital context switching interface
- `SavePatientModal.tsx` - Context-aware patient saving with privilege validation
- `EventManagerSupabase.tsx` - Real-time event management
- `ScaleModal.tsx` - Medical assessment tools

### Security & Privilege System
- `setup_admin_privileges.sql` - Complete privilege system setup
- `src/utils/diagnosticAssessmentDB.ts` - Privilege checking functions
- `src/hooks/useAuth.ts` - Enhanced authentication with privilege detection
- Database-level enforcement with comprehensive audit trail

## 🔧 Development

### Prerequisites
- Node.js 18+
- npm or yarn
- Supabase account (for database and privilege system)

### Environment Setup
```bash
# Clone repository
git clone https://github.com/jutopa31/HUBjr-v2
cd HUBjr-v2

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Add your Supabase credentials (both server and client-side):
# SUPABASE_URL=your_supabase_url
# SUPABASE_ANON_KEY=your_supabase_anon_key
# NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
# NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Database Setup (Required)
```sql
-- Execute in Supabase SQL Editor:
-- Run setup_admin_privileges.sql for privilege system
-- This grants admin access to julian.martin.alonso@gmail.com
```

### Available Scripts

**Development:**
```bash
npm run dev          # Next.js development server (auto-detects port, usually 3001)
npm run dev:vite     # Vite development server (http://localhost:5173)
```

**Build & Deploy:**
```bash
npm run build        # Production build
npm run start        # Production server
npm run build:vite   # Vite production build
```

**Code Quality:**
```bash
npm run lint         # ESLint checking
npm run typecheck    # TypeScript validation
```

## 🔐 Security & Hospital Context System

### Admin Privilege System
The platform implements a comprehensive database-level privilege system:

#### Privilege Types
- **`hospital_context_access`** - Access to multiple hospital contexts (Posadas + Julian)
- **`full_admin`** - Complete administrative access to all system functions
- **`lumbar_puncture_admin`** - Administrative access to lumbar puncture system
- **`scale_management`** - Permission to manage medical scales
- **`user_management`** - User administration capabilities

#### Security Features
- **Database-Level Enforcement** - RLS policies prevent unauthorized access
- **Automatic Authentication** - Privileged users bypass password requirements
- **Audit Trail** - Complete logging of privilege grants, modifications, and usage
- **Row Level Security** - Supabase RLS policies enforce access at database level

### Hospital Context Management
Secure data separation between different medical institutions:

#### Hospital Contexts
- **Hospital Posadas** (Default) - Public hospital, available to all users
- **Consultorios Julian** (Privileged) - Private consultations, restricted access

#### User Experience
- **Privileged Users** (`julian.martin.alonso@gmail.com`)
  - ✅ Hospital context selector visible in diagnostic interface
  - ✅ Can switch between Posadas and Julian contexts
  - ✅ Auto-authentication in admin functions
  - ✅ Green privilege indicators in UI

- **Standard Users**
  - ✅ Default Posadas context only
  - ✅ No hospital context switching interface
  - ✅ Password required for admin functions
  - ✅ Clean interface without privilege elements

#### Context-Aware Features
- **Patient Saving** - Evolucionador (DiagnosticAlgorithmContent) respects selected hospital context
- **Data Filtering** - All patient lists filtered by user's accessible contexts
- **Secure Isolation** - Julian patients never visible to unauthorized users

## 🏥 Medical Features

### Implemented Assessment Scales
- ✅ **NIHSS** - National Institutes of Health Stroke Scale
- ✅ **Glasgow Coma Scale** - Consciousness assessment
- ✅ **UPDRS I-IV** - Unified Parkinson's Disease Rating Scale
- ✅ **Modified Rankin Scale (mRS)** - Functional outcomes
- ✅ **ASPECTS** - Alberta Stroke Program Early CT Score
- ✅ **CHA2DS2-VASc** - Stroke risk assessment
- ✅ **HAS-BLED** - Bleeding risk calculator
- ✅ **ICH Score** - Intracerebral hemorrhage prognosis
- ✅ **MMSE & MoCA** - Cognitive assessments
- ✅ **Hunt & Hess Scale** - SAH grading

### Event Management
- ✅ **Real-time synchronization** with Supabase database
- ✅ **CRUD operations** for medical events
- ✅ **Event categorization** (clinical, academic, administrative, social, emergency)
- ✅ **Professional UI** with inline editing capabilities
- ✅ **DateTime validation** and proper formatting

### Patient Data Management
- ✅ **Complete patient records** with persistent storage
- ✅ **Diagnostic assessment history** and tracking
- ✅ **Clinical notes editing** with comprehensive interface
- ✅ **Search and filtering** by multiple criteria
- ✅ **Data export capabilities** in multiple formats

## 🔐 Database Schema

### Supabase Tables
```sql
-- medical_events table
CREATE TABLE medical_events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title VARCHAR NOT NULL,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  type VARCHAR DEFAULT 'clinical',
  location VARCHAR,
  description TEXT,
  created_by VARCHAR DEFAULT 'res_chief_julian',
  created_at TIMESTAMPTZ DEFAULT NOW()
);
```

## 📊 Project Structure

```
hubjr/
├── src/
│   ├── neurology_residency_hub.tsx     # Main application
│   ├── EventManagerSupabase.tsx        # Event management
│   ├── DiagnosticAlgorithmContent.tsx  # Clinical algorithms
│   ├── ScaleModal.tsx                   # Assessment scales
│   ├── types.ts                         # TypeScript definitions
│   └── utils/
│       └── supabase.js                  # Database configuration
├── pages/
│   ├── index.js                         # Main page (loads neurology hub)
│   ├── events.js                        # Standalone event manager
│   └── api/
│       └── events.js                    # API endpoints
├── package.json
├── next.config.js
├── vite.config.ts
└── vercel.json                          # Deployment configuration
```

## 🚀 Deployment

### Vercel Deployment (Recommended)
1. Connect repository to Vercel
2. Configure environment variables in Vercel dashboard
3. Deploy automatically on git push

### Environment Variables Required
```env
SUPABASE_URL=your-supabase-project-url
SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_SUPABASE_URL=your-supabase-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
```

## 👥 Contributing

This is a specialized medical tool for Hospital Nacional Posadas Neurology Service. For feature requests or issues, contact Dr. Julián Alonso.

## 📄 License

MIT License - See [LICENSE](LICENSE) file for details.

## 🏥 Medical Disclaimer

This software is designed for educational and clinical support purposes. Always follow institutional protocols and seek senior consultation for patient care decisions.

---

**Developed by**: Dr. Julián Alonso, Chief Neurology Resident  
**Institution**: Hospital Nacional Posadas - Servicio de Neurología  
**Last Updated**: September 2, 2025