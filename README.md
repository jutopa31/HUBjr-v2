# HUBJR - Neurology Residency Hub

[![Vercel Status](https://img.shields.io/badge/Vercel-Deployed-brightgreen)](https://github.com/jutopa31/HUBjr-v2)
[![Next.js](https://img.shields.io/badge/Next.js-14.2.31-blue)](https://nextjs.org/)
[![React](https://img.shields.io/badge/React-18.2.0-61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.2.2-3178C6)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Database-3ECF8E)](https://supabase.com/)

## 🏥 Overview

**HUBJR** (Neurology Residency Hub) is a comprehensive digital platform designed specifically for neurology residents at Hospital Nacional Posadas. It provides essential clinical tools, diagnostic algorithms, educational resources, and administrative management in a unified interface.

### ✨ Key Features

- **🧠 Medical Scales & Assessments**: Complete implementation of NIHSS, Glasgow Coma Scale, UPDRS, mRS, and 15+ other neurological assessment tools
- **📊 Diagnostic Algorithms**: Evidence-based diagnostic pathways for neurological conditions
- **📅 Event Management**: Supabase-powered real-time calendar for academic and clinical events
- **📝 Patient Notes**: AI-assisted clinical documentation tools
- **🎯 Personalized Dashboard**: Tailored interface for neurology residents

## 🚀 Current Status: STABLE ✅

- **Version**: 2.2.0 (Working Deployment)
- **Repository**: https://github.com/jutopa31/HUBjr-v2
- **Technology Stack**: React + TypeScript + Next.js + Supabase
- **Deployment**: Ready for Vercel production deployment

## 🛠️ Technical Architecture

### Frontend
- **React 18.2.0** with TypeScript
- **Tailwind CSS** for responsive design
- **Lucide React** for professional medical iconography
- **Vite** for fast development builds

### Backend & Database
- **Next.js API Routes** for serverless functions
- **Supabase** for real-time database and authentication
- **Vercel** for deployment and hosting

### Key Components
- `neurology_residency_hub.tsx` - Main application hub
- `EventManagerSupabase.tsx` - Real-time event management
- `DiagnosticAlgorithmContent.tsx` - Clinical decision support
- `ScaleModal.tsx` - Medical assessment tools

## 🔧 Development

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Supabase account (for database)

### Environment Setup
```bash
# Clone repository
git clone https://github.com/jutopa31/HUBjr-v2
cd HUBjr-v2

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local
# Add your Supabase credentials
```

### Available Scripts

**Development:**
```bash
npm run dev          # Next.js development server (http://localhost:3000)
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
**Last Updated**: August 31, 2025