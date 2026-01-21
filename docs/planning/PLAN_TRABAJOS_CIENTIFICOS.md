# Plan: Sección "Trabajos Científicos" - Scientific Papers Board

## Resumen
Crear una nueva sección estilo Google Keep para gestionar la preparación de trabajos científicos, con seguimiento de deadlines, asignación de residentes y carga de abstracts/borradores.

## Características Solicitadas
1. **Contador de deadline** - Mostrar días restantes hasta fecha límite
2. **Estados** - Pendiente, En progreso, Completado
3. **Upload de archivos** - Abstract y/o borrador (PDF, DOCX)
4. **Asignación de residentes** - Múltiples residentes por trabajo

## Decisiones Confirmadas

- **Tipos de trabajo**: Abstract, Poster, Artículo, Caso clínico (todas las categorías)
- **Visibilidad**: Solo contexto actual (patrón Posadas/Julian)
- **Notificaciones**: Solo indicador visual en la card (badge rojo/amarillo/verde)
- **Archivos permitidos**: PDF y Word (.pdf, .docx)
- **Identidad para RLS**: Comparar emails con `auth.jwt() ->> 'email'` (no `auth.uid()`)
- **Estados**: Incluye `completed` ademas de `pending`, `in_progress`, `submitted`, `accepted`, `rejected`
- **Deadline**: Calculo timezone-safe usando fechas UTC

---

## Arquitectura Propuesta

### Archivos a Crear

```
src/
├── types/
│   └── scientificPapers.ts        # Tipos e interfaces
├── services/
│   └── scientificPapersService.ts # CRUD con Supabase
├── components/
│   └── scientificPapers/
│       ├── PaperCard.tsx          # Card individual (Google Keep style)
│       └── PaperFormModal.tsx     # Modal crear/editar
└── ScientificPapersBoard.tsx      # Componente principal
```

### Database: Tabla `scientific_papers`

```sql
CREATE TABLE scientific_papers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Datos del trabajo
  title VARCHAR NOT NULL,
  description TEXT,
  paper_type VARCHAR DEFAULT 'abstract', -- 'abstract', 'poster', 'articulo', 'caso_clinico'
  event_name VARCHAR,           -- Nombre del congreso/evento

  -- Deadline y estado
  deadline DATE,
  status VARCHAR DEFAULT 'pending', -- 'pending', 'in_progress', 'completed', 'submitted', 'accepted', 'rejected'

  -- Archivos (URLs de Supabase Storage)
  abstract_url TEXT,
  draft_url TEXT,
  final_url TEXT,

  -- Asignación (array de IDs de residentes)
  assigned_residents TEXT[],    -- Array de emails o UUIDs

  -- Organización (Google Keep style)
  color VARCHAR DEFAULT 'default',
  priority VARCHAR DEFAULT 'medium',
  tags TEXT[],

  -- Metadata
  hospital_context VARCHAR DEFAULT 'Posadas',
  created_by VARCHAR NOT NULL, -- email
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Interfaz TypeScript

```typescript
export type PaperStatus = 'pending' | 'in_progress' | 'completed' | 'submitted' | 'accepted' | 'rejected';
export type PaperType = 'abstract' | 'poster' | 'articulo' | 'caso_clinico';

export const PAPER_TYPE_LABELS: Record<PaperType, string> = {
  abstract: 'Abstract',
  poster: 'Poster',
  articulo: 'Artículo',
  caso_clinico: 'Caso Clínico'
};

// Formatos de archivo permitidos
export const ALLOWED_FILE_TYPES = ['.pdf', '.docx'];
export const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
];

export interface ScientificPaper {
  id: string;
  title: string;
  description?: string;
  paper_type: PaperType;
  event_name?: string;

  deadline?: string;           // ISO date
  status: PaperStatus;

  abstract_url?: string;
  draft_url?: string;
  final_url?: string;

  assigned_residents: string[]; // emails

  color: CardColor;
  priority: PriorityLevel;
  tags?: string[];

  hospital_context: 'Posadas' | 'Julian';
  created_by: string;            // email
  created_at: string;
  updated_at: string;
}
```

---

## Componentes Clave

### 1. PaperCard.tsx - Características

- **Header**: Título + badge de tipo (Abstract, Poster, etc.)
- **Deadline indicator**:
  - Rojo: < 7 días o vencido
  - Amarillo: 7-14 días
  - Verde: > 14 días
  - Formato: "Faltan X días" o "Vencido hace X días"
- **Status badge**: Pendiente, En progreso, Completado, Enviado, Aceptado, Rechazado
- **Assigned residents**: Avatares o iniciales de residentes asignados
- **File indicators**: Iconos mostrando qué archivos están cargados
- **Hover actions**: Editar, eliminar, cambiar color, cambiar estado

### 2. PaperFormModal.tsx - Campos

- Título (requerido)
- Descripción (textarea)
- Tipo de trabajo (select)
- Nombre del evento/congreso
- Fecha límite (date picker)
- **Selector de residentes** (multiselect con lista de resident_profiles)
- Upload de archivos:
  - Abstract (PDF/DOCX)
  - Borrador (PDF/DOCX)
- Color (paleta Google Keep)
- Prioridad (Urgente, Alta, Media, Baja)
- Tags

### 3. ScientificPapersBoard.tsx

- Header compacto con:
  - Título + contador total (ej: "3 pendientes, 2 enviados")
  - Botón "Nuevo Trabajo"
  - Filtros inline: búsqueda, estado, tipo, residente asignado
- Grid de cards responsive (igual que PendingPatientsBoard)
- Ordenamiento por defecto: deadline más cercano primero, luego por prioridad

---

## Funciones del Service

```typescript
// scientificPapersService.ts
- fetchScientificPapers(hospitalContext, filters?)
- createScientificPaper(data, userEmail)
- updateScientificPaper(id, updates)
- deleteScientificPaper(id)
- changeStatus(id, newStatus)
- uploadPaperFile(paperId, file, fileType: 'abstract'|'draft'|'final')
- deletePaperFile(paperId, fileType)
- getPapersStats(hospitalContext)
```

---

## Storage: Bucket para Documentos

Crear bucket `scientific-papers` en Supabase Storage con estructura:
```
scientific-papers/
└── {paper_id}/
    ├── abstract-{timestamp}.pdf
    ├── draft-{timestamp}.docx
    └── final-{timestamp}.pdf
```

---

## Integración en el Hub

### 1. Agregar a modules.ts

```typescript
'scientific-papers': {
  id: 'scientific-papers',
  label: 'Trabajos Científicos',
  audience: 'core',
  corePath: '/trabajos-cientificos',
  notes: 'Gestión de abstracts, posters y publicaciones'
}
```

### 2. Agregar a CORE_MODULE_IDS

```typescript
export const CORE_MODULE_IDS: ModuleId[] = [
  // ... existentes
  'scientific-papers'
];
```

### 3. Agregar case en neurology_residency_hub.tsx

```typescript
case 'scientific-papers':
  return <ScientificPapersBoard hospitalContext={currentHospitalContext} />;
```

### 4. Agregar botón en Sidebar con icono `FileText` o `BookOpen` de lucide-react

---

## Cálculo de Deadline

```typescript
function getDeadlineInfo(deadline: string | undefined) {
  if (!deadline) return { text: 'Sin fecha', color: 'gray', urgent: false };

  // Parse deadline as UTC date to avoid timezone issues
  const [year, month, day] = deadline.split('-').map(Number);
  const deadlineDate = new Date(Date.UTC(year, month - 1, day));
  const today = new Date();
  const todayUTC = new Date(Date.UTC(today.getFullYear(), today.getMonth(), today.getDate()));
  const diffDays = Math.ceil((deadlineDate.getTime() - todayUTC.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays < 0) {
    return {
      text: `Vencido hace ${Math.abs(diffDays)} días`,
      color: 'red',
      urgent: true
    };
  } else if (diffDays === 0) {
    return { text: 'Vence hoy', color: 'red', urgent: true };
  } else if (diffDays <= 7) {
    return { text: `Faltan ${diffDays} días`, color: 'red', urgent: true };
  } else if (diffDays <= 14) {
    return { text: `Faltan ${diffDays} días`, color: 'yellow', urgent: false };
  } else {
    return { text: `Faltan ${diffDays} días`, color: 'green', urgent: false };
  }
}
```

---

## RLS Policies

```sql
-- Enable RLS
ALTER TABLE scientific_papers ENABLE ROW LEVEL SECURITY;

-- Lectura: todos en el contexto
CREATE POLICY "Users can view papers in their context"
ON scientific_papers FOR SELECT
USING (
  hospital_context = 'Posadas' OR
  (hospital_context = 'Julian' AND EXISTS (
    SELECT 1 FROM admin_privileges
    WHERE user_email = auth.jwt() ->> 'email'
    AND privilege_type = 'hospital_context_access'
  ))
);

-- Escritura: usuario autenticado
CREATE POLICY "Authenticated users can create papers"
ON scientific_papers FOR INSERT
WITH CHECK ((auth.jwt() ->> 'email') IS NOT NULL);

-- Update/Delete: creador o asignados
CREATE POLICY "Creators and assignees can update"
ON scientific_papers FOR UPDATE
USING (
  created_by = (auth.jwt() ->> 'email') OR
  (auth.jwt() ->> 'email') = ANY(assigned_residents)
);

CREATE POLICY "Creators and assignees can delete"
ON scientific_papers FOR DELETE
USING (
  created_by = (auth.jwt() ->> 'email') OR
  (auth.jwt() ->> 'email') = ANY(assigned_residents)
);
```

---

## Pasos de Implementación

1. **Base de datos**
   - Crear tabla `scientific_papers`
   - Crear bucket `scientific-papers` en Storage
   - Aplicar RLS policies

2. **Types** (`src/types/scientificPapers.ts`)
   - Definir interfaces y constantes de colores/estados

3. **Service** (`src/services/scientificPapersService.ts`)
   - CRUD operations con timeout protection
   - Upload de archivos al bucket

4. **Componentes**
   - `PaperCard.tsx` con deadline indicator
   - `PaperFormModal.tsx` con selector de residentes y upload
   - `ScientificPapersBoard.tsx` con filtros y grid

5. **Integración**
   - Actualizar `modules.ts`
   - Agregar case en hub
   - Agregar botón en sidebar

6. **Testing**
   - Crear trabajo de prueba
   - Verificar deadline indicator
   - Probar upload de archivos
   - Verificar asignación de residentes

---

## Estado actual

- Hecho: `database/migrations/scientific_papers_setup.sql` con RLS por email
- Hecho: `src/types/scientificPapers.ts` con status `completed` y deadline UTC
- Hecho: `src/services/scientificPapersService.ts` CRUD completo
- Hecho: `src/components/scientificPapers/PaperCard.tsx` con deadline indicator
- Hecho: `src/components/scientificPapers/PaperFormModal.tsx`
- Hecho: `src/ScientificPapersBoard.tsx`
- Hecho: integración en `src/config/modules.ts` y `src/neurology_residency_hub.tsx`

## Verificación

- [ ] Crear nuevo trabajo científico
- [ ] Asignar múltiples residentes
- [ ] Subir abstract PDF
- [ ] Ver contador de días restantes
- [ ] Cambiar estado (pendiente -> en progreso -> completado -> enviado)
- [ ] Filtrar por estado y residente
- [ ] Dark mode funciona correctamente
- [ ] RLS policies funcionan (ver solo contexto correcto)

