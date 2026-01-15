# Replicating the Google Keep-Style Board Pattern

## Guía Completa para Crear Secciones Similares a Pacientes Pendientes

Este documento explica cómo replicar la arquitectura de "Pacientes Pendientes" para crear nuevas secciones de la aplicación con la misma interfaz tipo Google Keep (tarjetas coloridas, prioridades, filtros, etc.).

---

## 🎯 Arquitectura General

La sección de Pacientes Pendientes implementa un patrón de **"Board de Tarjetas"** con las siguientes características:

### Componentes Core:
1. **Board Component** - Contenedor principal con grid responsive
2. **Card Component** - Tarjetas individuales con acciones inline
3. **Form Modal** - Modal para crear/editar items
4. **Service Layer** - Capa de servicios para Supabase
5. **Types** - Sistema de tipos TypeScript
6. **Database Schema** - Tabla con RLS policies

### Features Implementadas:
- ✅ Sistema de colores (8 colores estilo Google Keep)
- ✅ Niveles de prioridad (urgent, high, medium, low)
- ✅ Sistema de tags/etiquetas
- ✅ Búsqueda en tiempo real
- ✅ Filtros múltiples
- ✅ Estados (pendiente/resuelto)
- ✅ Hospital context support
- ✅ CRUD completo
- ✅ Auto-save
- ✅ Dark mode
- ✅ Responsive design

---

## 📋 Casos de Uso Ideales para este Patrón

Este patrón es perfecto para:

### ✅ Excelentes casos de uso:
- **Procedimientos pendientes** (cirugías, estudios, intervenciones)
- **Papers para leer** (artículos científicos, referencias bibliográficas)
- **Consultas pendientes de responder** (interconsultas, derivaciones)
- **Pacientes para seguimiento** (controles, telefonía)
- **Ideas/notas clínicas** (observaciones, hipótesis diagnósticas)
- **Tareas administrativas** (trámites, documentación)
- **Casos para discusión** (ateneos, revisión de casos)
- **Estudios pendientes de interpretar** (laboratorios, imágenes)

### ❌ No recomendado para:
- Datos tabulares complejos con muchas columnas
- Visualizaciones de tipo calendario/timeline
- Datos que requieren edición inline constante
- Listas simples sin necesidad de categorización

---

## 🏗️ Arquitectura de Archivos

Para cada nueva sección, necesitas replicar esta estructura:

```
src/
├── types/
│   └── yourFeature.ts                          # Tipos TypeScript
├── services/
│   └── yourFeatureService.ts                   # Service layer para Supabase
├── components/
│   └── yourFeature/
│       ├── ItemCard.tsx                        # Tarjeta individual
│       └── ItemFormModal.tsx                   # Modal crear/editar
├── YourFeatureBoard.tsx                        # Componente principal (Board)
└── config/
    └── modules.ts                              # Actualizar con nuevo módulo

database/
└── setup_your_feature.sql                      # Schema de base de datos
```

---

## 🚀 Paso a Paso: Crear una Nueva Sección

### Ejemplo: "Papers Pendientes para Leer"

Vamos a crear una sección para trackear papers científicos que necesitas leer.

---

## PASO 1: Definir el Modelo de Datos

### 1.1 Crear `src/types/pendingPapers.ts`

```typescript
export type CardColor =
  | 'default'
  | 'red'
  | 'orange'
  | 'yellow'
  | 'green'
  | 'blue'
  | 'purple'
  | 'pink';

export type PriorityLevel = 'urgent' | 'high' | 'medium' | 'low';

// Adaptación específica para papers
export type PaperStatus = 'to_read' | 'reading' | 'read' | 'reviewed';

export interface PendingPaper {
  id: string;

  // Información del paper
  title: string;
  authors: string;
  journal?: string;
  year?: number;
  doi?: string;
  url?: string;

  // Notas y resumen
  abstract?: string;
  personal_notes: string;
  key_findings?: string[];

  // Organización
  color: CardColor;
  priority: PriorityLevel;
  status: PaperStatus;
  tags?: string[];

  // Contexto
  hospital_context: 'Posadas' | 'Julian';

  // Metadata
  created_by: string;
  created_at: string;
  updated_at: string;
  read_at?: string;
}

export interface CreatePendingPaperInput {
  title: string;
  authors: string;
  journal?: string;
  year?: number;
  doi?: string;
  url?: string;
  abstract?: string;
  personal_notes: string;
  key_findings?: string[];
  color?: CardColor;
  priority?: PriorityLevel;
  status?: PaperStatus;
  tags?: string[];
  hospital_context: 'Posadas' | 'Julian';
}

export interface UpdatePendingPaperInput {
  title?: string;
  authors?: string;
  journal?: string;
  year?: number;
  doi?: string;
  url?: string;
  abstract?: string;
  personal_notes?: string;
  key_findings?: string[];
  color?: CardColor;
  priority?: PriorityLevel;
  status?: PaperStatus;
  tags?: string[];
}

// Color themes (reutilizable - copia del original)
export const CARD_COLORS: Record<CardColor, { bg: string; border: string; text: string }> = {
  default: { bg: 'bg-white dark:bg-gray-800', border: 'border-gray-200 dark:border-gray-700', text: 'text-gray-900 dark:text-gray-100' },
  red: { bg: 'bg-red-50 dark:bg-red-900/20', border: 'border-red-200 dark:border-red-800', text: 'text-red-900 dark:text-red-100' },
  orange: { bg: 'bg-orange-50 dark:bg-orange-900/20', border: 'border-orange-200 dark:border-orange-800', text: 'text-orange-900 dark:text-orange-100' },
  yellow: { bg: 'bg-yellow-50 dark:bg-yellow-900/20', border: 'border-yellow-200 dark:border-yellow-800', text: 'text-yellow-900 dark:text-yellow-100' },
  green: { bg: 'bg-green-50 dark:bg-green-900/20', border: 'border-green-200 dark:border-green-800', text: 'text-green-900 dark:text-green-100' },
  blue: { bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', text: 'text-blue-900 dark:text-blue-100' },
  purple: { bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', text: 'text-purple-900 dark:text-purple-100' },
  pink: { bg: 'bg-pink-50 dark:bg-pink-900/20', border: 'border-pink-200 dark:border-pink-800', text: 'text-pink-900 dark:text-pink-100' }
};

export const PRIORITY_COLORS: Record<PriorityLevel, string> = {
  urgent: 'text-red-600 dark:text-red-400',
  high: 'text-orange-600 dark:text-orange-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  low: 'text-blue-600 dark:text-blue-400'
};

export const PRIORITY_LABELS: Record<PriorityLevel, string> = {
  urgent: 'Urgente',
  high: 'Alta',
  medium: 'Media',
  low: 'Baja'
};

export const STATUS_LABELS: Record<PaperStatus, string> = {
  to_read: 'Por leer',
  reading: 'Leyendo',
  read: 'Leído',
  reviewed: 'Revisado'
};
```

### 1.2 Mapeo de Campos: Tu Dominio → Patrón Base

| Campo Base (Pacientes) | Campo Adaptado (Papers) | Tipo |
|------------------------|-------------------------|------|
| `patient_name` | `title` | string |
| `age`, `dni` | `authors`, `journal`, `year`, `doi`, `url` | string/number |
| `chief_complaint` | `abstract` | string |
| `clinical_notes` | `personal_notes` | string |
| `differential_diagnoses[]` | `key_findings[]` | array |
| `pending_tests[]` | *(opcional: related_papers[])* | array |
| `resolved` / `final_diagnosis` | `status` / `read_at` | boolean/timestamp |

**Pregunta clave para tu dominio:**
- ¿Qué información identifica el item? (título, nombre, descripción)
- ¿Qué campos son obligatorios vs opcionales?
- ¿Qué arrays necesitas? (listas de sub-items)
- ¿Tiene estados? (pendiente/resuelto, por_hacer/haciendo/hecho, etc.)

---

## PASO 2: Schema de Base de Datos

### 2.1 Crear `database/setup_pending_papers.sql`

```sql
-- PENDING PAPERS TABLE
CREATE TABLE IF NOT EXISTS pending_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Paper information
  title VARCHAR(500) NOT NULL,
  authors TEXT NOT NULL,
  journal VARCHAR(255),
  year INTEGER,
  doi VARCHAR(255),
  url TEXT,

  -- Content
  abstract TEXT,
  personal_notes TEXT NOT NULL,
  key_findings TEXT[],

  -- Organization
  color VARCHAR(20) NOT NULL DEFAULT 'default',
  priority VARCHAR(20) NOT NULL DEFAULT 'medium',
  status VARCHAR(20) NOT NULL DEFAULT 'to_read',
  tags TEXT[],

  -- Context
  hospital_context VARCHAR(50) NOT NULL DEFAULT 'Posadas',

  -- Metadata
  created_by VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  read_at TIMESTAMP WITH TIME ZONE,

  -- Constraints
  CONSTRAINT valid_color CHECK (color IN ('default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink')),
  CONSTRAINT valid_priority CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
  CONSTRAINT valid_status CHECK (status IN ('to_read', 'reading', 'read', 'reviewed')),
  CONSTRAINT valid_hospital_context CHECK (hospital_context IN ('Posadas', 'Julian'))
);

-- Indexes
CREATE INDEX idx_pending_papers_hospital_context ON pending_papers(hospital_context);
CREATE INDEX idx_pending_papers_status ON pending_papers(status);
CREATE INDEX idx_pending_papers_priority ON pending_papers(priority);
CREATE INDEX idx_pending_papers_created_by ON pending_papers(created_by);
CREATE INDEX idx_pending_papers_composite ON pending_papers(hospital_context, status, priority, created_at DESC);

-- Full-text search
CREATE INDEX idx_pending_papers_search ON pending_papers USING gin(to_tsvector('spanish',
  title || ' ' || authors || ' ' || COALESCE(personal_notes, '')
));

-- Trigger: updated_at
CREATE OR REPLACE FUNCTION update_pending_papers_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_pending_papers_updated_at
  BEFORE UPDATE ON pending_papers
  FOR EACH ROW
  EXECUTE FUNCTION update_pending_papers_updated_at();

-- RLS Policies
ALTER TABLE pending_papers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view pending papers"
  ON pending_papers FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create pending papers"
  ON pending_papers FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

CREATE POLICY "Users can update own pending papers"
  ON pending_papers FOR UPDATE
  USING (auth.uid() IS NOT NULL AND created_by = (auth.jwt() ->> 'email'))
  WITH CHECK (auth.uid() IS NOT NULL AND created_by = (auth.jwt() ->> 'email'));

CREATE POLICY "Users can delete own pending papers"
  ON pending_papers FOR DELETE
  USING (auth.uid() IS NOT NULL AND created_by = (auth.jwt() ->> 'email'));
```

### 2.2 Checklist de Adaptación del Schema

- [ ] Tabla renombrada apropiadamente
- [ ] Columnas específicas del dominio agregadas
- [ ] Arrays declarados como `TEXT[]`
- [ ] Constraints de CHECK agregados para enums
- [ ] Índices en campos de filtro común
- [ ] Full-text search configurado
- [ ] Trigger de `updated_at`
- [ ] RLS policies básicas (SELECT, INSERT, UPDATE, DELETE)
- [ ] Hospital context incluido

---

## PASO 3: Service Layer

### 3.1 Crear `src/services/pendingPapersService.ts`

```typescript
import { supabase } from '../utils/supabase';
import { PendingPaper, CreatePendingPaperInput, UpdatePendingPaperInput } from '../types/pendingPapers';

const QUERY_TIMEOUT = 12000;

function createTimeout(ms: number): Promise<never> {
  return new Promise((_, reject) =>
    setTimeout(() => reject(new Error('Query timeout')), ms)
  );
}

/**
 * Fetch all pending papers
 */
export async function fetchPendingPapers(
  hospitalContext: 'Posadas' | 'Julian',
  status?: string
): Promise<{ data: PendingPaper[] | null; error: any }> {
  try {
    let query = supabase
      .from('pending_papers')
      .select('*')
      .eq('hospital_context', hospitalContext);

    if (status) {
      query = query.eq('status', status);
    }

    query = query.order('priority', { ascending: true }).order('created_at', { ascending: false });

    const { data, error } = await Promise.race([query, createTimeout(QUERY_TIMEOUT)]);

    if (error) {
      console.error('🔴 Error fetching pending papers:', error);
      return { data: null, error };
    }

    console.log(`✅ Fetched ${data?.length || 0} pending papers for ${hospitalContext}`);
    return { data: data as PendingPaper[], error: null };
  } catch (error) {
    console.error('🔴 Exception in fetchPendingPapers:', error);
    return { data: null, error };
  }
}

/**
 * Create a new pending paper
 */
export async function createPendingPaper(
  paperData: CreatePendingPaperInput,
  userEmail: string
): Promise<{ data: PendingPaper | null; error: any }> {
  try {
    const newPaper = {
      ...paperData,
      color: paperData.color || 'default',
      priority: paperData.priority || 'medium',
      status: paperData.status || 'to_read',
      created_by: userEmail,
      key_findings: paperData.key_findings || [],
      tags: paperData.tags || []
    };

    const { data, error } = await Promise.race([
      supabase.from('pending_papers').insert(newPaper).select().single(),
      createTimeout(QUERY_TIMEOUT)
    ]);

    if (error) {
      console.error('🔴 Error creating pending paper:', error);
      return { data: null, error };
    }

    console.log('✅ Created pending paper:', data.id);
    return { data: data as PendingPaper, error: null };
  } catch (error) {
    console.error('🔴 Exception in createPendingPaper:', error);
    return { data: null, error };
  }
}

/**
 * Update an existing pending paper
 */
export async function updatePendingPaper(
  paperId: string,
  updates: UpdatePendingPaperInput
): Promise<{ data: PendingPaper | null; error: any }> {
  try {
    const { data, error } = await Promise.race([
      supabase.from('pending_papers').update(updates).eq('id', paperId).select().single(),
      createTimeout(QUERY_TIMEOUT)
    ]);

    if (error) {
      console.error('🔴 Error updating pending paper:', error);
      return { data: null, error };
    }

    console.log('✅ Updated pending paper:', paperId);
    return { data: data as PendingPaper, error: null };
  } catch (error) {
    console.error('🔴 Exception in updatePendingPaper:', error);
    return { data: null, error };
  }
}

/**
 * Delete a pending paper
 */
export async function deletePendingPaper(
  paperId: string
): Promise<{ success: boolean; error: any }> {
  try {
    const { error } = await Promise.race([
      supabase.from('pending_papers').delete().eq('id', paperId),
      createTimeout(QUERY_TIMEOUT)
    ]);

    if (error) {
      console.error('🔴 Error deleting pending paper:', error);
      return { success: false, error };
    }

    console.log('✅ Deleted pending paper:', paperId);
    return { success: true, error: null };
  } catch (error) {
    console.error('🔴 Exception in deletePendingPaper:', error);
    return { success: false, error };
  }
}

/**
 * Mark paper as read
 */
export async function markPaperAsRead(
  paperId: string
): Promise<{ data: PendingPaper | null; error: any }> {
  try {
    const { data, error } = await Promise.race([
      supabase
        .from('pending_papers')
        .update({ status: 'read', read_at: new Date().toISOString() })
        .eq('id', paperId)
        .select()
        .single(),
      createTimeout(QUERY_TIMEOUT)
    ]);

    if (error) {
      console.error('🔴 Error marking paper as read:', error);
      return { data: null, error };
    }

    console.log('✅ Marked paper as read:', paperId);
    return { data: data as PendingPaper, error: null };
  } catch (error) {
    console.error('🔴 Exception in markPaperAsRead:', error);
    return { data: null, error };
  }
}

// ... más funciones según necesites (changeColor, search, stats, etc.)
```

### 3.2 Funciones Estándar del Service

Siempre incluir:
- ✅ `fetch{Items}()` - Con filtros y ordenamiento
- ✅ `create{Item}()` - Con defaults y validación
- ✅ `update{Item}()` - Update parcial
- ✅ `delete{Item}()` - Soft o hard delete
- ✅ Función específica de estado (ej: `markAsRead()`, `resolve()`, `complete()`)
- ✅ `change{Item}Color()` - Para cambio rápido de color
- ⚠️ Opcional: `search{Items}()`, `get{Items}Stats()`

---

## PASO 4: Componente Card

### 4.1 Crear `src/components/pendingPapers/PaperCard.tsx`

```typescript
import React, { useState } from 'react';
import { PendingPaper, CARD_COLORS, PRIORITY_COLORS, PRIORITY_LABELS, STATUS_LABELS, CardColor } from '../../types/pendingPapers';

interface PaperCardProps {
  paper: PendingPaper;
  onEdit: (paper: PendingPaper) => void;
  onDelete: (id: string) => void;
  onMarkAsRead: (id: string) => void;
  onColorChange: (id: string, color: CardColor) => void;
}

export default function PaperCard({ paper, onEdit, onDelete, onMarkAsRead, onColorChange }: PaperCardProps) {
  const [showActions, setShowActions] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);

  const colorTheme = CARD_COLORS[paper.color || 'default'];
  const colorOptions: CardColor[] = ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];

  return (
    <div
      className={`${colorTheme.bg} ${colorTheme.border} border-2 rounded-lg p-4 shadow-md hover:shadow-lg transition-all duration-200 relative group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => { setShowActions(false); setShowColorPicker(false); }}
    >
      {/* Header */}
      <div className="flex justify-between items-start mb-2">
        <div className="flex-1">
          <h3 className={`font-semibold text-lg ${colorTheme.text} line-clamp-2`}>
            {paper.title}
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            {paper.authors}
          </p>
          {paper.journal && paper.year && (
            <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
              {paper.journal} ({paper.year})
            </p>
          )}
        </div>
        <div className="flex flex-col items-end gap-1">
          <span className={`text-xs font-medium px-2 py-1 rounded ${PRIORITY_COLORS[paper.priority]}`}>
            {PRIORITY_LABELS[paper.priority]}
          </span>
          <span className="text-xs px-2 py-1 rounded bg-gray-200 dark:bg-gray-700">
            {STATUS_LABELS[paper.status]}
          </span>
        </div>
      </div>

      {/* Personal Notes */}
      {paper.personal_notes && (
        <div className="mb-3">
          <p className={`text-sm ${colorTheme.text} line-clamp-3`}>
            {paper.personal_notes}
          </p>
        </div>
      )}

      {/* Key Findings */}
      {paper.key_findings && paper.key_findings.length > 0 && (
        <div className="mb-3">
          <p className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
            Hallazgos clave:
          </p>
          <ul className="list-disc list-inside text-xs text-gray-600 dark:text-gray-400">
            {paper.key_findings.slice(0, 3).map((finding, idx) => (
              <li key={idx}>{finding}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Tags */}
      {paper.tags && paper.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mb-2">
          {paper.tags.map((tag, idx) => (
            <span key={idx} className="text-xs px-2 py-1 rounded-full bg-gray-200 dark:bg-gray-700">
              #{tag}
            </span>
          ))}
        </div>
      )}

      {/* URL Link */}
      {paper.url && (
        <div className="mb-2">
          <a
            href={paper.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
          >
            🔗 Ver paper
          </a>
        </div>
      )}

      {/* Metadata */}
      <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center text-xs text-gray-500 dark:text-gray-400">
          <span>{new Date(paper.created_at).toLocaleDateString()}</span>
          <span>{paper.hospital_context}</span>
        </div>
      </div>

      {/* Action Buttons (aparecen on hover) */}
      {showActions && paper.status !== 'read' && (
        <div className="absolute top-2 right-2 flex gap-1 bg-white dark:bg-gray-800 p-1 rounded shadow-lg border border-gray-200 dark:border-gray-700">
          {/* Color Picker */}
          <div className="relative">
            <button
              onClick={() => setShowColorPicker(!showColorPicker)}
              className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
              title="Cambiar color"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21a4 4 0 01-4-4V5a2 2 0 012-2h4a2 2 0 012 2v12a4 4 0 01-4 4zm0 0h12a2 2 0 002-2v-4a2 2 0 00-2-2h-2.343M11 7.343l1.657-1.657a2 2 0 012.828 0l2.829 2.829a2 2 0 010 2.828l-8.486 8.485M7 17h.01" />
              </svg>
            </button>
            {showColorPicker && (
              <div className="absolute top-8 left-0 bg-white dark:bg-gray-800 p-2 rounded shadow-lg border z-10">
                <div className="grid grid-cols-4 gap-1">
                  {colorOptions.map((color) => (
                    <button
                      key={color}
                      onClick={() => { onColorChange(paper.id, color); setShowColorPicker(false); }}
                      className={`w-6 h-6 rounded ${CARD_COLORS[color].bg} ${CARD_COLORS[color].border} border-2`}
                    />
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Edit */}
          <button onClick={() => onEdit(paper)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>

          {/* Mark as Read */}
          <button onClick={() => onMarkAsRead(paper.id)} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </button>

          {/* Delete */}
          <button
            onClick={() => { if (confirm('¿Eliminar paper?')) onDelete(paper.id); }}
            className="p-1 hover:bg-red-100 dark:hover:bg-red-900/30 text-red-600 rounded"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
```

### 4.2 Elementos Clave del Card

- ✅ Color theme aplicado (`bg`, `border`, `text`)
- ✅ Hover state para mostrar acciones
- ✅ Color picker inline
- ✅ Badges de prioridad y estado
- ✅ Line clamps para limitar texto
- ✅ Metadata en el footer
- ✅ Dark mode completo

---

## PASO 5: Form Modal

### 5.1 Crear `src/components/pendingPapers/PaperFormModal.tsx`

Este es el componente más largo. Estructura general:

```typescript
import React, { useState, useEffect } from 'react';
import { PendingPaper, CreatePendingPaperInput, CardColor, PriorityLevel, PaperStatus, CARD_COLORS, PRIORITY_LABELS, STATUS_LABELS } from '../../types/pendingPapers';

interface PaperFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (data: CreatePendingPaperInput) => void;
  editingPaper?: PendingPaper | null;
  hospitalContext: 'Posadas' | 'Julian';
}

export default function PaperFormModal({ isOpen, onClose, onSave, editingPaper, hospitalContext }: PaperFormModalProps) {
  const [formData, setFormData] = useState<CreatePendingPaperInput>({
    title: '',
    authors: '',
    journal: '',
    year: undefined,
    doi: '',
    url: '',
    abstract: '',
    personal_notes: '',
    key_findings: [],
    color: 'default',
    priority: 'medium',
    status: 'to_read',
    tags: [],
    hospital_context: hospitalContext
  });

  // Arrays dinámicos
  const [findingInput, setFindingInput] = useState('');
  const [tagInput, setTagInput] = useState('');

  useEffect(() => {
    if (editingPaper) {
      setFormData({ ...editingPaper });
    } else {
      resetForm();
    }
  }, [editingPaper, hospitalContext]);

  const resetForm = () => {
    setFormData({
      title: '',
      authors: '',
      journal: '',
      year: undefined,
      doi: '',
      url: '',
      abstract: '',
      personal_notes: '',
      key_findings: [],
      color: 'default',
      priority: 'medium',
      status: 'to_read',
      tags: [],
      hospital_context: hospitalContext
    });
    setFindingInput('');
    setTagInput('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.title && formData.authors && formData.personal_notes) {
      onSave(formData);
      resetForm();
      onClose();
    }
  };

  const addFinding = () => {
    if (findingInput.trim()) {
      setFormData({
        ...formData,
        key_findings: [...(formData.key_findings || []), findingInput.trim()]
      });
      setFindingInput('');
    }
  };

  const removeFinding = (index: number) => {
    setFormData({
      ...formData,
      key_findings: formData.key_findings?.filter((_, i) => i !== index)
    });
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      setFormData({
        ...formData,
        tags: [...(formData.tags || []), tagInput.trim()]
      });
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags?.filter(t => t !== tag)
    });
  };

  if (!isOpen) return null;

  const colorOptions: CardColor[] = ['default', 'red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'];
  const priorityOptions: PriorityLevel[] = ['urgent', 'high', 'medium', 'low'];
  const statusOptions: PaperStatus[] = ['to_read', 'reading', 'read', 'reviewed'];

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white dark:bg-gray-800 border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold">
            {editingPaper ? 'Editar Paper' : 'Nuevo Paper'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              required
            />
          </div>

          {/* Authors */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Autores <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.authors}
              onChange={(e) => setFormData({ ...formData, authors: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              required
              placeholder="Ej: Smith J, Doe A, et al."
            />
          </div>

          {/* Journal, Year, DOI (grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Revista</label>
              <input
                type="text"
                value={formData.journal || ''}
                onChange={(e) => setFormData({ ...formData, journal: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Año</label>
              <input
                type="number"
                value={formData.year || ''}
                onChange={(e) => setFormData({ ...formData, year: e.target.value ? parseInt(e.target.value) : undefined })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">DOI</label>
              <input
                type="text"
                value={formData.doi || ''}
                onChange={(e) => setFormData({ ...formData, doi: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              />
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="block text-sm font-medium mb-1">URL del paper</label>
            <input
              type="url"
              value={formData.url || ''}
              onChange={(e) => setFormData({ ...formData, url: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              placeholder="https://..."
            />
          </div>

          {/* Abstract */}
          <div>
            <label className="block text-sm font-medium mb-1">Abstract</label>
            <textarea
              value={formData.abstract || ''}
              onChange={(e) => setFormData({ ...formData, abstract: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              rows={3}
            />
          </div>

          {/* Personal Notes */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Notas personales <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.personal_notes}
              onChange={(e) => setFormData({ ...formData, personal_notes: e.target.value })}
              className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              rows={4}
              required
              placeholder="Tus notas, resumen, ideas..."
            />
          </div>

          {/* Key Findings (dynamic list) */}
          <div>
            <label className="block text-sm font-medium mb-1">Hallazgos clave</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={findingInput}
                onChange={(e) => setFindingInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addFinding())}
                className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700"
                placeholder="Agregar hallazgo..."
              />
              <button
                type="button"
                onClick={addFinding}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>
            {formData.key_findings && formData.key_findings.length > 0 && (
              <ul className="space-y-1">
                {formData.key_findings.map((finding, idx) => (
                  <li key={idx} className="flex justify-between items-center bg-gray-100 dark:bg-gray-700 px-3 py-2 rounded">
                    <span>{finding}</span>
                    <button type="button" onClick={() => removeFinding(idx)} className="text-red-600">✕</button>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* Tags (dynamic list) */}
          <div>
            <label className="block text-sm font-medium mb-1">Etiquetas</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="flex-1 px-3 py-2 border rounded-lg dark:bg-gray-700"
                placeholder="Agregar etiqueta..."
              />
              <button
                type="button"
                onClick={addTag}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Agregar
              </button>
            </div>
            {formData.tags && formData.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {formData.tags.map((tag, idx) => (
                  <span key={idx} className="inline-flex items-center gap-2 px-3 py-1 bg-gray-200 dark:bg-gray-700 rounded-full text-sm">
                    #{tag}
                    <button type="button" onClick={() => removeTag(tag)} className="text-red-600">✕</button>
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Color, Priority, Status (grid) */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Color Picker */}
            <div>
              <label className="block text-sm font-medium mb-2">Color</label>
              <div className="grid grid-cols-4 gap-2">
                {colorOptions.map((color) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => setFormData({ ...formData, color })}
                    className={`h-10 rounded ${CARD_COLORS[color].bg} ${CARD_COLORS[color].border} border-2 ${
                      formData.color === color ? 'ring-2 ring-blue-500' : ''
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Priority */}
            <div>
              <label className="block text-sm font-medium mb-2">Prioridad</label>
              <select
                value={formData.priority}
                onChange={(e) => setFormData({ ...formData, priority: e.target.value as PriorityLevel })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              >
                {priorityOptions.map((priority) => (
                  <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>
                ))}
              </select>
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium mb-2">Estado</label>
              <select
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as PaperStatus })}
                className="w-full px-3 py-2 border rounded-lg dark:bg-gray-700"
              >
                {statusOptions.map((status) => (
                  <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Form Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
            >
              {editingPaper ? 'Guardar cambios' : 'Crear paper'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
```

### 5.2 Elementos Clave del Form Modal

- ✅ Controlled inputs con `formData` state
- ✅ Arrays dinámicos con input + botón "Agregar"
- ✅ Validación de campos requeridos
- ✅ Color picker visual (grid de botones)
- ✅ Dropdowns para enums (priority, status)
- ✅ `useEffect` para cargar datos en modo edición
- ✅ Reset form al cerrar o después de submit

---

## PASO 6: Board Component Principal

### 6.1 Crear `src/PendingPapersBoard.tsx`

```typescript
import React, { useState, useEffect } from 'react';
import { useAuth } from './hooks/useAuth';
import PaperCard from './components/pendingPapers/PaperCard';
import PaperFormModal from './components/pendingPapers/PaperFormModal';
import {
  PendingPaper,
  CreatePendingPaperInput,
  PriorityLevel,
  PaperStatus,
  CardColor,
  PRIORITY_LABELS,
  STATUS_LABELS
} from './types/pendingPapers';
import * as pendingPapersService from './services/pendingPapersService';

interface PendingPapersBoardProps {
  hospitalContext: 'Posadas' | 'Julian';
}

export default function PendingPapersBoard({ hospitalContext }: PendingPapersBoardProps) {
  const { user } = useAuth();
  const [papers, setPapers] = useState<PendingPaper[]>([]);
  const [filteredPapers, setFilteredPapers] = useState<PendingPaper[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPaper, setEditingPaper] = useState<PendingPaper | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [priorityFilter, setPriorityFilter] = useState<PriorityLevel | 'all'>('all');
  const [statusFilter, setStatusFilter] = useState<PaperStatus | 'all'>('all');
  const [loading, setLoading] = useState(false);

  // Load papers from Supabase
  useEffect(() => {
    loadPapers();
  }, [hospitalContext]);

  const loadPapers = async () => {
    setLoading(true);
    const { data, error } = await pendingPapersService.fetchPendingPapers(hospitalContext);

    if (!error && data) {
      setPapers(data);
    } else {
      console.error('Error loading papers:', error);
      setPapers([]);
    }
    setLoading(false);
  };

  // Client-side filtering
  useEffect(() => {
    let filtered = papers.filter(p => p.hospital_context === hospitalContext);

    if (searchTerm) {
      filtered = filtered.filter(p =>
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.authors.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.personal_notes.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (priorityFilter !== 'all') {
      filtered = filtered.filter(p => p.priority === priorityFilter);
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === statusFilter);
    }

    // Sort by priority and date
    filtered.sort((a, b) => {
      const priorityOrder = { urgent: 0, high: 1, medium: 2, low: 3 };
      const priorityDiff = priorityOrder[a.priority] - priorityOrder[b.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    });

    setFilteredPapers(filtered);
  }, [papers, searchTerm, priorityFilter, statusFilter, hospitalContext]);

  // CRUD handlers
  const handleCreatePaper = async (data: CreatePendingPaperInput) => {
    const { data: newPaper, error } = await pendingPapersService.createPendingPaper(data, user?.email || '');
    if (!error && newPaper) {
      setPapers([...papers, newPaper]);
    } else {
      alert('Error al crear paper');
    }
  };

  const handleUpdatePaper = async (data: CreatePendingPaperInput) => {
    if (!editingPaper) return;
    const { data: updatedPaper, error } = await pendingPapersService.updatePendingPaper(editingPaper.id, data);
    if (!error && updatedPaper) {
      setPapers(papers.map(p => p.id === editingPaper.id ? updatedPaper : p));
      setEditingPaper(null);
    } else {
      alert('Error al actualizar paper');
    }
  };

  const handleDeletePaper = async (id: string) => {
    const { success } = await pendingPapersService.deletePendingPaper(id);
    if (success) {
      setPapers(papers.filter(p => p.id !== id));
    } else {
      alert('Error al eliminar paper');
    }
  };

  const handleMarkAsRead = async (id: string) => {
    const { data: readPaper, error } = await pendingPapersService.markPaperAsRead(id);
    if (!error && readPaper) {
      setPapers(papers.map(p => p.id === id ? readPaper : p));
    }
  };

  const handleColorChange = async (id: string, color: CardColor) => {
    const { data: updatedPaper } = await pendingPapersService.updatePendingPaper(id, { color });
    if (updatedPaper) {
      setPapers(papers.map(p => p.id === id ? updatedPaper : p));
    }
  };

  const toReadCount = papers.filter(p => p.status !== 'read' && p.status !== 'reviewed').length;
  const readCount = papers.filter(p => p.status === 'read' || p.status === 'reviewed').length;

  return (
    <div className="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b px-6 py-3">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h1 className="text-2xl font-bold">Papers Pendientes</h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {toReadCount} por leer • {readCount} leídos
            </p>
          </div>
          <button
            onClick={() => { setEditingPaper(null); setIsModalOpen(true); }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Nuevo Paper
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="text"
            placeholder="Buscar por título, autor, notas..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1 min-w-[200px] max-w-md px-3 py-2 border rounded-lg dark:bg-gray-700 text-sm"
          />
          <select
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value as PriorityLevel | 'all')}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 text-sm"
          >
            <option value="all">Todas las prioridades</option>
            {(['urgent', 'high', 'medium', 'low'] as PriorityLevel[]).map(p => (
              <option key={p} value={p}>{PRIORITY_LABELS[p]}</option>
            ))}
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as PaperStatus | 'all')}
            className="px-3 py-2 border rounded-lg dark:bg-gray-700 text-sm"
          >
            <option value="all">Todos los estados</option>
            {(['to_read', 'reading', 'read', 'reviewed'] as PaperStatus[]).map(s => (
              <option key={s} value={s}>{STATUS_LABELS[s]}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Content Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          </div>
        ) : filteredPapers.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <svg className="w-16 h-16 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
            </svg>
            <p className="text-lg font-medium">No hay papers</p>
            <p className="text-sm mt-1">Agrega tu primer paper para leer</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredPapers.map(paper => (
              <PaperCard
                key={paper.id}
                paper={paper}
                onEdit={(p) => { setEditingPaper(p); setIsModalOpen(true); }}
                onDelete={handleDeletePaper}
                onMarkAsRead={handleMarkAsRead}
                onColorChange={handleColorChange}
              />
            ))}
          </div>
        )}
      </div>

      {/* Modal */}
      <PaperFormModal
        isOpen={isModalOpen}
        onClose={() => { setIsModalOpen(false); setEditingPaper(null); }}
        onSave={editingPaper ? handleUpdatePaper : handleCreatePaper}
        editingPaper={editingPaper}
        hospitalContext={hospitalContext}
      />
    </div>
  );
}
```

### 6.2 Elementos Clave del Board

- ✅ State management (papers, filtered, modal, editing)
- ✅ `useEffect` para cargar datos
- ✅ Client-side filtering y sorting
- ✅ CRUD handlers conectados al service
- ✅ Grid responsive de cards
- ✅ Loading state
- ✅ Empty state
- ✅ Filtros compactos en header

---

## PASO 7: Integración en la App

### 7.1 Actualizar `src/config/modules.ts`

```typescript
export type ModuleId =
  | 'inicio'
  | 'schedule'
  | 'pendientes'
  | 'pending-patients'
  | 'pending-papers'  // ⬅️ NUEVO
  | 'ward-rounds'
  | 'interconsultas'
  // ...

export const MODULES: Record<ModuleId, ModuleConfig> = {
  // ...
  'pending-papers': {
    id: 'pending-papers',
    label: 'Papers Pendientes',
    audience: 'core',
    corePath: '/papers-pendientes',
    notes: 'Papers científicos para leer - estilo Google Keep'
  },
  // ...
};

export const CORE_MODULE_IDS: ModuleId[] = [
  'inicio',
  'ward-rounds',
  'pendientes',
  'pending-patients',
  'pending-papers',  // ⬅️ NUEVO
  // ...
];
```

### 7.2 Actualizar `src/neurology_residency_hub.tsx`

```typescript
// Imports
import PendingPapersBoard from './PendingPapersBoard';
import { BookOpen } from 'lucide-react';  // o el ícono que prefieras

// En moduleIconMap
const moduleIconMap: Record<ModuleId, React.ComponentType<{ className?: string }>> = {
  // ...
  'pending-papers': BookOpen,
  // ...
};

// En renderContent()
case 'pending-papers':
  return (
    <ProtectedRoute>
      <PendingPapersBoard hospitalContext={currentHospitalContext} />
    </ProtectedRoute>
  );
```

---

## 🎨 Personalización y Adaptación

### Sistema de Colores

Los colores son configurables en `CARD_COLORS`. Puedes:
- Cambiar la paleta completa
- Agregar/quitar colores
- Ajustar intensidades para dark mode

### Prioridades

Puedes cambiar los niveles de prioridad:
```typescript
export type PriorityLevel = 'critical' | 'urgent' | 'normal' | 'low' | 'backlog';
```

### Estados Personalizados

Para tu dominio específico:
- **Papers**: `to_read | reading | read | reviewed`
- **Procedimientos**: `scheduled | in_progress | completed | cancelled`
- **Consultas**: `pending | answered | closed`
- **Tareas**: `todo | in_progress | done`

---

## 📊 Checklist de Implementación

### Frontend:
- [ ] Tipos TypeScript creados en `src/types/`
- [ ] Service layer en `src/services/`
- [ ] Card component con hover actions
- [ ] Form modal con campos específicos
- [ ] Board component principal
- [ ] Integrado en `modules.ts`
- [ ] Routing en hub principal
- [ ] Ícono seleccionado

### Backend:
- [ ] Tabla SQL creada
- [ ] Columnas del dominio agregadas
- [ ] Arrays declarados correctamente
- [ ] Constraints de CHECK
- [ ] Índices en campos de filtro
- [ ] Full-text search
- [ ] Trigger de `updated_at`
- [ ] RLS policies
- [ ] Hospital context incluido

### Testing:
- [ ] Crear item funciona
- [ ] Editar item funciona
- [ ] Eliminar item funciona
- [ ] Cambiar color funciona
- [ ] Cambiar estado funciona
- [ ] Filtros funcionan
- [ ] Búsqueda funciona
- [ ] Dark mode se ve bien
- [ ] Responsive en móvil

---

## 🚀 Features Avanzadas Opcionales

### 1. Real-time Updates
```typescript
useEffect(() => {
  const subscription = supabase
    .channel('papers-changes')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'pending_papers' }, () => {
      loadPapers();
    })
    .subscribe();
  return () => subscription.unsubscribe();
}, []);
```

### 2. Drag & Drop (reordenar)
Usar `react-beautiful-dnd` o `@dnd-kit/core`

### 3. Bulk Actions
Checkbox en cada card + acciones masivas

### 4. Export to PDF/CSV
Función de exportación de los items

### 5. Statistics Dashboard
Card con stats en el header

### 6. Attachments
Upload de archivos relacionados

### 7. Comments/Notes
Sistema de comentarios en cada item

### 8. Due Dates
Fechas límite con alertas

### 9. Assignees
Asignar items a otros usuarios

### 10. Kanban View
Vista alternativa tipo tablero Kanban

---

## 📚 Ejemplos de Otros Dominios

### Procedimientos Pendientes
```typescript
interface PendingProcedure {
  patient_name: string;
  procedure_type: string; // 'surgery' | 'biopsy' | 'imaging'
  scheduled_date?: string;
  location: string;
  preparation_notes: string;
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
}
```

### Consultas Pendientes
```typescript
interface PendingConsultation {
  patient_name: string;
  consultation_type: string;
  referring_physician: string;
  question: string;
  answer?: string;
  status: 'pending' | 'answered' | 'closed';
}
```

### Ideas/Notas Clínicas
```typescript
interface ClinicalNote {
  title: string;
  content: string;
  category: 'observation' | 'hypothesis' | 'question' | 'reminder';
  related_patient?: string;
  follow_up_required: boolean;
}
```

---

## 🔧 Troubleshooting Común

### Error: Tabla no existe
→ Ejecuta el SQL en Supabase SQL Editor

### Error: 403 en INSERT
→ Revisa RLS policies, especialmente la de INSERT

### Error: 400 en INSERT
→ Verifica constraints (especialmente CHECK constraints)
→ Asegúrate que arrays no sean `undefined`

### Cards no se ven bien
→ Verifica que `CARD_COLORS` esté importado
→ Chequea clases de Tailwind

### Filtros no funcionan
→ Verifica el `useEffect` de filtering
→ Chequea que el state se actualice correctamente

---

## 📖 Recursos Adicionales

- **Código base**: `src/PendingPatientsBoard.tsx` (referencia completa)
- **Database patterns**: `database/setup_pending_patients.sql`
- **Types patterns**: `src/types/pendingPatients.ts`
- **Service patterns**: `src/services/pendingPatientsService.ts`

---

## 💡 Tips Finales

1. **Empieza simple**: No agregues todas las features de una vez
2. **Reutiliza código**: Copia el código de Pacientes Pendientes y adapta
3. **Testea incremental**: Prueba cada paso antes de continuar
4. **Mantén consistencia**: Usa los mismos patrones para todas las secciones
5. **Documenta cambios**: Actualiza README y docs cuando agregues features
6. **Dark mode first**: Diseña pensando en dark mode desde el principio
7. **Mobile responsive**: Prueba en móvil frecuentemente
8. **Error handling**: Siempre incluye manejo de errores y feedback al usuario

---

## 🎯 Resultado Final

Siguiendo esta guía tendrás:
- ✅ Sección nueva completamente funcional
- ✅ Interfaz estilo Google Keep
- ✅ CRUD completo con Supabase
- ✅ Filtros y búsqueda
- ✅ Sistema de colores y prioridades
- ✅ Dark mode
- ✅ Responsive
- ✅ Integrada en la app principal

**Tiempo estimado**: 4-6 horas para un desarrollador familiarizado con el stack.

---

**Última actualización**: Enero 2026
**Versión**: 1.0.0
**Autor**: Proyecto HUBjr Neurología
