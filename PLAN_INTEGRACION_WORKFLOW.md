# Plan de Implementación: Integración de Flujo Interconsultas → Evolucionador → Pase de Sala

## Resumen Ejecutivo

Implementar un flujo integrado de gestión de pacientes que conecte los tres módulos principales:
1. **Interconsultas**: Filtro automático del día + carga de imágenes + OCR
2. **Evolucionador**: Pre-carga de datos + template estructurado + respuesta automática
3. **Pase de Sala**: Traslado automático con mapeo inteligente de campos

**Objetivo**: Eliminar duplicación de trabajo y crear un flujo clínico natural desde la consulta inicial hasta la gestión diaria en sala.

---

## Decisiones de Diseño Confirmadas

### Flujo de Usuario
1. Usuario abre Interconsultas → **filtro automático día actual**
2. Click en interconsulta → modal detalle con botón **"Ir al Evolucionador"**
3. Cambia al tab Evolucionador → **pre-carga datos con template estructurado**
4. Usuario completa evolución (antecedentes, examen físico, diagnóstico, plan)
5. Click "Guardar" → modal pregunta: **"¿Agregar a Pase de Sala?"** + selector de status final
6. Si acepta → crea en `ward_round_patients` + actualiza status interconsulta
7. Paciente totalmente editable en Pase de Sala

### Decisiones Técnicas
- **Template estructurado**: Pre-carga con secciones `ANTECEDENTES:`, `EXAMEN FÍSICO:`, `DIAGNÓSTICO:`, `PLAN:`
- **Respuesta**: Todo el contenido del Evolucionador se copia a `interconsulta.respuesta`
- **Imágenes en Interconsultas**: Botones en modal detalle Y formulario creación
- **Status final**: Usuario elige en modal (Resuelta/En Proceso/etc.)
- **Edición Pase**: Sin restricciones, gestión normal

---

## Fase 1: Base de Datos

### 1.1 Agregar campo `status` a tabla `interconsultas`

**Archivo a crear**: `database/add_status_column_interconsultas.sql`

```sql
-- Agregar columna status (actualmente usada en código pero no existe en BD)
ALTER TABLE public.interconsultas
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'Pendiente';

-- Actualizar registros existentes sin status
UPDATE public.interconsultas
SET status = CASE
  WHEN respuesta IS NOT NULL AND respuesta != '' THEN 'En Proceso'
  ELSE 'Pendiente'
END
WHERE status IS NULL;

-- Índice para filtrado rápido por status
CREATE INDEX IF NOT EXISTS idx_interconsultas_status
ON public.interconsultas(status);

-- Constraint para validar valores
ALTER TABLE public.interconsultas
ADD CONSTRAINT check_status_values
CHECK (status IN ('Pendiente', 'En Proceso', 'Resuelta', 'Cancelada'));
```

### 1.2 Agregar campos de imágenes a `interconsultas`

**Archivo a crear**: `database/add_images_to_interconsultas.sql`

```sql
-- Arrays de URLs de imágenes (mismo patrón que ward_round_patients)
ALTER TABLE public.interconsultas
ADD COLUMN IF NOT EXISTS image_thumbnail_url TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS image_full_url TEXT[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS exa_url TEXT[] DEFAULT '{}';

-- Columna para texto OCR extraído de estudios
ALTER TABLE public.interconsultas
ADD COLUMN IF NOT EXISTS estudios_ocr TEXT;

COMMENT ON COLUMN public.interconsultas.image_thumbnail_url IS 'URLs de miniaturas de imágenes subidas';
COMMENT ON COLUMN public.interconsultas.image_full_url IS 'URLs de imágenes en tamaño completo';
COMMENT ON COLUMN public.interconsultas.exa_url IS 'URLs del visor EXA institucional';
COMMENT ON COLUMN public.interconsultas.estudios_ocr IS 'Texto extraído de PDFs/imágenes mediante OCR';
```

### 1.3 Campo para tracking de interconsulta en diagnostic_assessments

**Archivo a crear**: `database/add_source_interconsulta_to_assessments.sql`

```sql
-- Tracking de origen desde interconsulta
ALTER TABLE public.diagnostic_assessments
ADD COLUMN IF NOT EXISTS source_interconsulta_id UUID,
ADD COLUMN IF NOT EXISTS response_sent BOOLEAN DEFAULT FALSE;

-- Foreign key para trazabilidad
ALTER TABLE public.diagnostic_assessments
ADD CONSTRAINT fk_source_interconsulta
FOREIGN KEY (source_interconsulta_id)
REFERENCES public.interconsultas(id)
ON DELETE SET NULL;

-- Índice para búsquedas rápidas
CREATE INDEX IF NOT EXISTS idx_assessments_source_interconsulta
ON public.diagnostic_assessments(source_interconsulta_id);

COMMENT ON COLUMN public.diagnostic_assessments.source_interconsulta_id IS 'ID de interconsulta origen (si aplica)';
COMMENT ON COLUMN public.diagnostic_assessments.response_sent IS 'Si se envió respuesta a interconsulta';
```

**Ejecutar en este orden**:
1. `add_status_column_interconsultas.sql`
2. `add_images_to_interconsultas.sql`
3. `add_source_interconsulta_to_assessments.sql`

---

## Fase 2: Servicios y Utilidades

### 2.1 Actualizar `interconsultasService.ts`

**Archivo**: `src/services/interconsultasService.ts`

**Cambios necesarios**:

```typescript
// 1. Actualizar interfaz InterconsultaRow
export interface InterconsultaRow {
  id?: string;
  nombre: string;
  dni: string;
  cama: string;
  fecha_interconsulta: string;
  relato_consulta?: string | null;
  respuesta?: string | null;
  status: 'Pendiente' | 'En Proceso' | 'Resuelta' | 'Cancelada';
  hospital_context?: string;
  user_id?: string;
  created_at?: string;
  updated_at?: string;

  // Nuevos campos de imágenes
  image_thumbnail_url?: string[];
  image_full_url?: string[];
  exa_url?: string[];
  estudios_ocr?: string;
}

// 2. Nueva función: uploadImageToInterconsulta
export async function uploadImageToInterconsulta(
  interconsultaId: string,
  file: File
): Promise<{ thumbnailUrl: string; fullUrl: string } | null> {
  try {
    // Usar storageService.ts para upload
    const { thumbnailUrl, fullUrl } = await uploadImageToStorage(file, 'interconsultas');

    // Obtener arrays actuales
    const { data: current } = await supabase
      .from('interconsultas')
      .select('image_thumbnail_url, image_full_url')
      .eq('id', interconsultaId)
      .single();

    // Append nueva imagen
    const newThumbnails = [...(current?.image_thumbnail_url || []), thumbnailUrl];
    const newFulls = [...(current?.image_full_url || []), fullUrl];

    // Actualizar
    const { error } = await supabase
      .from('interconsultas')
      .update({
        image_thumbnail_url: newThumbnails,
        image_full_url: newFulls,
        updated_at: new Date().toISOString()
      })
      .eq('id', interconsultaId);

    if (error) throw error;

    return { thumbnailUrl, fullUrl };
  } catch (error) {
    console.error('🔴 Error uploading image to interconsulta:', error);
    return null;
  }
}

// 3. Nueva función: removeImageFromInterconsulta
export async function removeImageFromInterconsulta(
  interconsultaId: string,
  index: number
): Promise<boolean> {
  try {
    const { data: current } = await supabase
      .from('interconsultas')
      .select('image_thumbnail_url, image_full_url')
      .eq('id', interconsultaId)
      .single();

    if (!current) return false;

    const newThumbnails = [...(current.image_thumbnail_url || [])];
    const newFulls = [...(current.image_full_url || [])];

    newThumbnails.splice(index, 1);
    newFulls.splice(index, 1);

    const { error } = await supabase
      .from('interconsultas')
      .update({
        image_thumbnail_url: newThumbnails,
        image_full_url: newFulls,
        updated_at: new Date().toISOString()
      })
      .eq('id', interconsultaId);

    return !error;
  } catch (error) {
    console.error('🔴 Error removing image:', error);
    return false;
  }
}

// 4. Nueva función: appendOCRTextToInterconsulta
export async function appendOCRTextToInterconsulta(
  interconsultaId: string,
  ocrText: string
): Promise<boolean> {
  try {
    const { data: current } = await supabase
      .from('interconsultas')
      .select('estudios_ocr')
      .eq('id', interconsultaId)
      .single();

    const existingText = current?.estudios_ocr || '';
    const newText = existingText
      ? `${existingText}\n\n--- Nuevo estudio ---\n${ocrText}`
      : ocrText;

    const { error } = await supabase
      .from('interconsultas')
      .update({
        estudios_ocr: newText,
        updated_at: new Date().toISOString()
      })
      .eq('id', interconsultaId);

    return !error;
  } catch (error) {
    console.error('🔴 Error appending OCR text:', error);
    return false;
  }
}

// 5. Nueva función: updateInterconsultaResponse (desde Evolucionador)
export async function updateInterconsultaResponse(
  interconsultaId: string,
  respuesta: string,
  newStatus: 'Pendiente' | 'En Proceso' | 'Resuelta' | 'Cancelada'
): Promise<boolean> {
  try {
    const { error } = await robustQuery(
      () => supabase
        .from('interconsultas')
        .update({
          respuesta,
          status: newStatus,
          updated_at: new Date().toISOString()
        })
        .eq('id', interconsultaId),
      8000,
      2
    );

    if (error) throw error;
    return true;
  } catch (error) {
    console.error('🔴 Error updating interconsulta response:', error);
    return false;
  }
}
```

### 2.2 Crear servicio de integración

**Archivo nuevo**: `src/services/workflowIntegrationService.ts`

```typescript
import { supabase } from '../utils/supabase';
import type { InterconsultaRow } from './interconsultasService';
import type { PatientAssessment } from '../types';

/**
 * Genera template estructurado para Evolucionador desde interconsulta
 */
export function generateEvolucionadorTemplate(interconsulta: InterconsultaRow): string {
  const template = `PACIENTE: ${interconsulta.nombre}
DNI: ${interconsulta.dni}
EDAD: ${interconsulta.edad || 'No especificada'}
CAMA: ${interconsulta.cama}

MOTIVO DE CONSULTA:
${interconsulta.relato_consulta || ''}

${interconsulta.estudios_ocr ? `ESTUDIOS COMPLEMENTARIOS (OCR):\n${interconsulta.estudios_ocr}\n\n` : ''}
ANTECEDENTES:


EXAMEN FÍSICO:


DIAGNÓSTICO:


PLAN:


`;

  return template;
}

/**
 * Extrae secciones estructuradas del texto del Evolucionador
 */
export function extractStructuredSections(clinicalNotes: string): {
  antecedentes: string;
  examenFisico: string;
  diagnostico: string;
  plan: string;
  motivoConsulta: string;
} {
  const sections = {
    antecedentes: '',
    examenFisico: '',
    diagnostico: '',
    plan: '',
    motivoConsulta: ''
  };

  // Regex patterns para extraer secciones
  const patterns = {
    motivoConsulta: /MOTIVO DE CONSULTA:\s*\n([\s\S]*?)(?=\n\n[A-Z]|$)/i,
    antecedentes: /ANTECEDENTES:\s*\n([\s\S]*?)(?=\n\nEXAMEN|$)/i,
    examenFisico: /EXAMEN F[ÍI]SICO:\s*\n([\s\S]*?)(?=\n\nDIAGN[ÓO]STICO|$)/i,
    diagnostico: /DIAGN[ÓO]STICO:\s*\n([\s\S]*?)(?=\n\nPLAN|$)/i,
    plan: /PLAN:\s*\n([\s\S]*?)$/i
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = clinicalNotes.match(pattern);
    if (match) {
      sections[key as keyof typeof sections] = match[1].trim();
    }
  }

  return sections;
}

/**
 * Mapea datos de Evolucionador + Interconsulta a formato Pase de Sala
 */
export function mapToWardRoundPatient(
  interconsulta: InterconsultaRow,
  assessment: PatientAssessment
): any {
  const sections = extractStructuredSections(assessment.clinical_notes);

  return {
    nombre: interconsulta.nombre,
    dni: interconsulta.dni,
    edad: interconsulta.edad || assessment.patient_age,
    cama: interconsulta.cama,
    fecha: new Date().toISOString().split('T')[0],

    // Datos de interconsulta
    motivo_consulta: sections.motivoConsulta || interconsulta.relato_consulta,
    estudios: interconsulta.estudios_ocr || '',

    // Datos del Evolucionador (secciones extraídas)
    antecedentes: sections.antecedentes,
    examen_fisico: sections.examenFisico,
    diagnostico: sections.diagnostico,
    plan: sections.plan,

    // Imágenes (trasladar desde interconsulta)
    image_thumbnail_url: interconsulta.image_thumbnail_url || [],
    image_full_url: interconsulta.image_full_url || [],
    exa_url: interconsulta.exa_url || [],

    // Metadata
    hospital_context: interconsulta.hospital_context || 'Posadas',
    severidad: 'II', // Default moderado, usuario puede cambiar
    pendientes: '',
    display_order: 9999 // Al final, se recalcula después
  };
}

/**
 * Crea paciente en Pase de Sala desde Evolucionador
 */
export async function createWardPatientFromEvolution(
  interconsultaId: string,
  assessmentId: string
): Promise<{ success: boolean; patientId?: string; error?: string }> {
  try {
    // 1. Obtener interconsulta completa
    const { data: interconsulta, error: icError } = await supabase
      .from('interconsultas')
      .select('*')
      .eq('id', interconsultaId)
      .single();

    if (icError || !interconsulta) {
      return { success: false, error: 'No se encontró la interconsulta' };
    }

    // 2. Obtener assessment completo
    const { data: assessment, error: assError } = await supabase
      .from('diagnostic_assessments')
      .select('*')
      .eq('id', assessmentId)
      .single();

    if (assError || !assessment) {
      return { success: false, error: 'No se encontró la evaluación' };
    }

    // 3. Mapear datos
    const wardPatientData = mapToWardRoundPatient(interconsulta, assessment);

    // 4. Verificar duplicado por DNI
    const { data: existing } = await supabase
      .from('ward_round_patients')
      .select('id, nombre')
      .eq('dni', wardPatientData.dni)
      .eq('hospital_context', wardPatientData.hospital_context);

    if (existing && existing.length > 0) {
      return {
        success: false,
        error: `Ya existe un paciente con DNI ${wardPatientData.dni}: ${existing[0].nombre}`
      };
    }

    // 5. Insertar en ward_round_patients
    const { data: newPatient, error: insertError } = await supabase
      .from('ward_round_patients')
      .insert([wardPatientData])
      .select('id')
      .single();

    if (insertError) throw insertError;

    // 6. Marcar assessment como con respuesta enviada
    await supabase
      .from('diagnostic_assessments')
      .update({ response_sent: true })
      .eq('id', assessmentId);

    return { success: true, patientId: newPatient.id };
  } catch (error) {
    console.error('🔴 Error creating ward patient from evolution:', error);
    return { success: false, error: String(error) };
  }
}
```

---

## Fase 3: Componentes de Interconsultas

### 3.1 Agregar filtro automático del día

**Archivo**: `src/Interconsultas.tsx`

**Cambios en líneas ~30-50** (useEffect inicial):

```typescript
// Estado para filtro de fecha inicial
const [initialDateFilter, setInitialDateFilter] = useState<boolean>(true);

useEffect(() => {
  loadInterconsultas();
}, []);

useEffect(() => {
  // Aplicar filtro automático del día actual al cargar
  if (initialDateFilter && rows.length > 0) {
    const today = new Date().toISOString().split('T')[0];
    setFilters(prev => ({
      ...prev,
      dateFrom: today,
      dateTo: today
    }));
    setInitialDateFilter(false); // Solo aplicar una vez
  }
}, [rows, initialDateFilter]);
```

**Agregar indicador visual en header** (línea ~150):

```typescript
{filters.dateFrom === filters.dateTo && filters.dateFrom === new Date().toISOString().split('T')[0] && (
  <div className="px-3 py-1 bg-blue-100 dark:bg-blue-900 rounded-full text-sm">
    📅 Mostrando solo interconsultas de hoy
  </div>
)}
```

### 3.2 Agregar funcionalidad de imágenes a InterconsultaDetailModal

**Archivo**: `src/components/interconsultas/InterconsultaDetailModal.tsx`

**Importar servicios** (líneas ~1-15):

```typescript
import { uploadImageToInterconsulta, removeImageFromInterconsulta, appendOCRTextToInterconsulta } from '../../services/interconsultasService';
import { readImageFromClipboard } from '../../services/clipboardService';
```

**Agregar estados** (línea ~40):

```typescript
const [uploadingImage, setUploadingImage] = useState(false);
const [showCamera, setShowCamera] = useState(false);
const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
const [showOCRModal, setShowOCRModal] = useState(false);
```

**Agregar sección de imágenes en el JSX** (después del campo respuesta, línea ~250):

```tsx
{/* Sección de Imágenes */}
<div className="border-t pt-4">
  <div className="flex items-center justify-between mb-3">
    <h4 className="font-semibold text-gray-700 dark:text-gray-300">
      Imágenes y Estudios
    </h4>
    <div className="flex gap-2">
      <button
        onClick={() => setShowCamera(true)}
        className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
      >
        📷 Cámara
      </button>
      <button
        onClick={() => setShowOCRModal(true)}
        className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
      >
        📄 OCR
      </button>
      <input
        type="file"
        id="image-upload-interconsulta"
        accept="image/*"
        multiple
        className="hidden"
        onChange={handleImageUpload}
      />
      <label
        htmlFor="image-upload-interconsulta"
        className="px-3 py-1 bg-purple-600 text-white rounded hover:bg-purple-700 text-sm cursor-pointer"
      >
        🖼️ Subir
      </label>
    </div>
  </div>

  {/* Grid de imágenes */}
  {interconsulta.image_full_url && interconsulta.image_full_url.length > 0 && (
    <div className="grid grid-cols-3 gap-2">
      {interconsulta.image_full_url.map((url, idx) => (
        <div key={idx} className="relative group">
          <img
            src={interconsulta.image_thumbnail_url?.[idx] || url}
            alt={`Imagen ${idx + 1}`}
            className="w-full h-24 object-cover rounded cursor-pointer"
            onClick={() => window.open(url, '_blank')}
          />
          <button
            onClick={() => handleRemoveImage(idx)}
            className="absolute top-1 right-1 bg-red-600 text-white p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  )}

  {/* Texto OCR */}
  {interconsulta.estudios_ocr && (
    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded">
      <p className="text-sm font-semibold mb-1">Estudios (OCR):</p>
      <pre className="text-sm whitespace-pre-wrap">{interconsulta.estudios_ocr}</pre>
    </div>
  )}
</div>
```

**Implementar handlers**:

```typescript
const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const files = e.target.files;
  if (!files || files.length === 0) return;

  setUploadingImage(true);
  try {
    for (const file of Array.from(files)) {
      const result = await uploadImageToInterconsulta(interconsulta.id, file);
      if (!result) {
        throw new Error('Error al subir imagen');
      }
    }

    // Recargar interconsulta
    await onUpdate();
    toast.success(`${files.length} imagen(es) subida(s)`);
  } catch (error) {
    toast.error('Error al subir imágenes');
  } finally {
    setUploadingImage(false);
  }
};

const handleRemoveImage = async (index: number) => {
  if (!confirm('¿Eliminar esta imagen?')) return;

  const success = await removeImageFromInterconsulta(interconsulta.id, index);
  if (success) {
    await onUpdate();
    toast.success('Imagen eliminada');
  } else {
    toast.error('Error al eliminar imagen');
  }
};

const handleOCRComplete = async (extractedText: string) => {
  const success = await appendOCRTextToInterconsulta(interconsulta.id, extractedText);
  if (success) {
    await onUpdate();
    toast.success('Texto OCR agregado');
  } else {
    toast.error('Error al guardar OCR');
  }
  setShowOCRModal(false);
};
```

### 3.3 Agregar botón "Ir al Evolucionador"

**Archivo**: `src/components/interconsultas/InterconsultaDetailModal.tsx`

**Props adicionales**:

```typescript
interface InterconsultaDetailModalProps {
  // ... existing props
  onGoToEvolucionador?: (interconsulta: InterconsultaRow) => void;
}
```

**Agregar botón en footer** (línea ~300):

```tsx
<div className="flex justify-between items-center pt-4 border-t">
  <div className="flex gap-2">
    <button
      onClick={() => onGoToEvolucionador?.(interconsulta)}
      className="px-4 py-2 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 font-semibold flex items-center gap-2"
    >
      ➡️ Ir al Evolucionador
    </button>
  </div>

  <div className="flex gap-2">
    <button onClick={onClose} className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded-lg">
      Cerrar
    </button>
  </div>
</div>
```

### 3.4 Agregar imágenes en formulario de creación

**Archivo**: `src/Interconsultas.tsx`

**En el modal de creación** (línea ~400, después de campos básicos):

```tsx
{/* Sección opcional de imágenes en creación */}
<div className="border-t pt-4 mt-4">
  <h4 className="font-semibold mb-2">Imágenes/Estudios (opcional)</h4>
  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
    Puedes agregar imágenes después de crear la interconsulta
  </p>
  <div className="flex gap-2">
    <button
      type="button"
      className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      onClick={() => alert('Funcionalidad disponible después de crear')}
    >
      📷 Cámara
    </button>
    <button
      type="button"
      className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700"
      onClick={() => alert('Funcionalidad disponible después de crear')}
    >
      📄 OCR
    </button>
  </div>
</div>
```

**Nota**: Por simplicidad, la carga de imágenes en creación se hace DESPUÉS de guardar. Alternativamente, se puede implementar upload temporal antes del INSERT.

---

## Fase 4: Integración con Evolucionador

### 4.1 Agregar estado de interconsulta activa

**Archivo**: `src/neurology_residency_hub.tsx`

**Agregar estado global** (línea ~100):

```typescript
const [activeInterconsulta, setActiveInterconsulta] = useState<InterconsultaRow | null>(null);
```

**Pasar como prop a DiagnosticAlgorithmContent**:

```tsx
<DiagnosticAlgorithmContent
  // ... existing props
  activeInterconsulta={activeInterconsulta}
  onClearInterconsulta={() => setActiveInterconsulta(null)}
/>
```

**Handler para "Ir al Evolucionador"**:

```typescript
const handleGoToEvolucionador = (interconsulta: InterconsultaRow) => {
  setActiveInterconsulta(interconsulta);
  setActiveTab('diagnostic'); // Cambiar al tab del Evolucionador
};
```

**Pasar handler a Interconsultas**:

```tsx
<Interconsultas
  currentHospitalContext={currentHospitalContext}
  onGoToEvolucionador={handleGoToEvolucionador}
/>
```

### 4.2 Modificar DiagnosticAlgorithmContent

**Archivo**: `src/DiagnosticAlgorithmContent.tsx`

**Actualizar props** (línea ~30):

```typescript
interface DiagnosticAlgorithmContentProps {
  // ... existing props
  activeInterconsulta?: InterconsultaRow | null;
  onClearInterconsulta?: () => void;
}
```

**Agregar estado para respuesta** (línea ~80):

```typescript
const [showSaveToWardModal, setShowSaveToWardModal] = useState(false);
const [selectedFinalStatus, setSelectedFinalStatus] = useState<string>('Resuelta');
```

**useEffect para pre-cargar desde interconsulta** (línea ~100):

```typescript
useEffect(() => {
  if (activeInterconsulta && activeInterconsulta.id) {
    // Generar template estructurado
    const template = generateEvolucionadorTemplate(activeInterconsulta);
    setNotes(template);

    // Notificar al usuario
    toast.info(`📋 Datos de interconsulta cargados: ${activeInterconsulta.nombre}`);
  }
}, [activeInterconsulta]);
```

**Modificar función handleSavePatient** (línea ~250):

```typescript
const handleSavePatient = async () => {
  try {
    // ... existing save logic

    // Si vino de interconsulta, mostrar modal de confirmación
    if (activeInterconsulta) {
      setShowSaveToWardModal(true);
    } else {
      toast.success('Paciente guardado exitosamente');
    }
  } catch (error) {
    toast.error('Error al guardar paciente');
  }
};
```

**Agregar modal de confirmación** (línea ~600, en JSX):

```tsx
{showSaveToWardModal && activeInterconsulta && (
  <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
    <div className="bg-white dark:bg-gray-800 p-6 rounded-lg max-w-md w-full">
      <h3 className="text-xl font-bold mb-4">¿Agregar a Pase de Sala?</h3>

      <p className="mb-4 text-gray-700 dark:text-gray-300">
        La evolución se guardó correctamente. ¿Deseas agregar este paciente al Pase de Sala?
      </p>

      <div className="mb-4">
        <label className="block text-sm font-semibold mb-2">
          Estado final de la interconsulta:
        </label>
        <select
          value={selectedFinalStatus}
          onChange={(e) => setSelectedFinalStatus(e.target.value)}
          className="w-full p-2 border rounded dark:bg-gray-700"
        >
          <option value="Resuelta">Resuelta</option>
          <option value="En Proceso">En Proceso</option>
          <option value="Pendiente">Pendiente</option>
          <option value="Cancelada">Cancelada</option>
        </select>
      </div>

      <div className="flex gap-3 justify-end">
        <button
          onClick={async () => {
            // Solo actualizar status, no agregar a pase
            await updateInterconsultaResponse(
              activeInterconsulta.id,
              notes, // Todo el contenido como respuesta
              selectedFinalStatus as any
            );
            setShowSaveToWardModal(false);
            onClearInterconsulta?.();
            toast.success('Interconsulta actualizada');
          }}
          className="px-4 py-2 bg-gray-300 dark:bg-gray-600 rounded hover:bg-gray-400"
        >
          No, solo actualizar interconsulta
        </button>

        <button
          onClick={async () => {
            // Agregar a Pase de Sala
            const result = await createWardPatientFromEvolution(
              activeInterconsulta.id,
              lastSavedAssessmentId // Guardar ID en handleSavePatient
            );

            if (result.success) {
              // Actualizar respuesta e interconsulta
              await updateInterconsultaResponse(
                activeInterconsulta.id,
                notes,
                selectedFinalStatus as any
              );

              setShowSaveToWardModal(false);
              onClearInterconsulta?.();
              toast.success('✅ Paciente agregado al Pase de Sala');
            } else {
              toast.error(`Error: ${result.error}`);
            }
          }}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 font-semibold"
        >
          Sí, agregar a Pase de Sala
        </button>
      </div>
    </div>
  </div>
)}
```

**Agregar indicador visual** si hay interconsulta activa (línea ~200, en header):

```tsx
{activeInterconsulta && (
  <div className="mb-4 p-3 bg-blue-100 dark:bg-blue-900 border-l-4 border-blue-600 rounded">
    <div className="flex items-center justify-between">
      <div>
        <p className="font-semibold">📋 Evolucionando interconsulta:</p>
        <p className="text-sm">{activeInterconsulta.nombre} - DNI: {activeInterconsulta.dni}</p>
      </div>
      <button
        onClick={() => {
          if (confirm('¿Descartar conexión con interconsulta?')) {
            onClearInterconsulta?.();
          }
        }}
        className="px-3 py-1 bg-red-600 text-white rounded text-sm"
      >
        Desconectar
      </button>
    </div>
  </div>
)}
```

---

## Fase 5: Integración con Pase de Sala

**Archivo**: `src/WardRounds.tsx`

**NO requiere cambios significativos** porque:
1. La función `createWardPatientFromEvolution` en `workflowIntegrationService.ts` hace el INSERT directamente
2. El paciente se crea con `display_order = 9999` (al final)
3. Es totalmente editable (decisión del usuario)

**Opcional - Agregar indicador visual**:

En el componente `WardPatientCard.tsx` (línea ~50), agregar badge si tiene `source_interconsulta_id`:

```tsx
{patient.source_interconsulta_id && (
  <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200 text-xs rounded">
    📋 Desde Interconsulta
  </span>
)}
```

---

## Fase 6: Testing y Validación

### 6.1 Flujo completo de testing

**Checklist de prueba**:

1. ✅ **Interconsultas - Filtro del día**
   - Abrir Interconsultas → debe mostrar solo las del día actual
   - Verificar badge "Mostrando solo interconsultas de hoy"
   - Cambiar filtro manualmente → debe funcionar

2. ✅ **Interconsultas - Carga de imágenes**
   - Crear interconsulta básica
   - Abrir modal detalle → probar botones Cámara, OCR, Subir
   - Verificar que imágenes se guardan en `image_thumbnail_url[]`
   - Eliminar imagen → verificar que se remueve

3. ✅ **Interconsultas - OCR**
   - Subir PDF de estudio → verificar extracción de texto
   - Verificar que texto aparece en `estudios_ocr`
   - Subir segunda imagen → verificar que se appendea con separador

4. ✅ **Flujo al Evolucionador**
   - Click "Ir al Evolucionador" → verificar cambio de tab
   - Verificar pre-carga de template estructurado
   - Verificar indicador azul "Evolucionando interconsulta"
   - Completar secciones: ANTECEDENTES, EXAMEN FÍSICO, DIAGNÓSTICO, PLAN

5. ✅ **Guardar evolución**
   - Click "Guardar" → verificar modal de confirmación
   - Verificar dropdown de status final
   - Probar opción "No, solo actualizar interconsulta"
   - Verificar que `respuesta` se actualiza en BD
   - Verificar que status cambia según selección

6. ✅ **Traslado a Pase de Sala**
   - Repetir flujo pero elegir "Sí, agregar a Pase de Sala"
   - Verificar que paciente aparece en Pase de Sala
   - Verificar mapeo de campos:
     - nombre, dni, edad, cama → correctos
     - motivo_consulta → desde relato_consulta
     - antecedentes, examen_fisico, diagnostico, plan → desde secciones extraídas
     - estudios → desde estudios_ocr
     - image_*_url → arrays copiados
   - Verificar que severidad es 'II' (default)
   - Verificar que es totalmente editable

7. ✅ **Validación de duplicados**
   - Intentar agregar mismo paciente (mismo DNI) dos veces
   - Verificar error: "Ya existe un paciente con DNI..."

8. ✅ **Hospital context**
   - Verificar que todo respeta `hospital_context = 'Posadas'`
   - Si usuario tiene privilegios, probar con contexto 'Julian'

### 6.2 Edge cases

- Interconsulta sin relato_consulta → template debe funcionar
- Texto sin secciones estructuradas → regex debe devolver strings vacíos (no crashear)
- Interconsulta sin imágenes → debe permitir traslado sin problema
- Usuario cancela modal "Agregar a Pase" → no debe crear paciente ni actualizar status
- Desconectar interconsulta activa → debe limpiar estado

---

## Orden de Implementación Recomendado

### Sprint 1: Base de Datos y Servicios (1-2 días)
1. Ejecutar SQLs de BD (status, imágenes, source_interconsulta_id)
2. Actualizar `interconsultasService.ts` (interfaces + nuevas funciones)
3. Crear `workflowIntegrationService.ts` completo
4. Testing de servicios con Postman/Supabase console

### Sprint 2: Interconsultas - Imágenes y Filtro (1-2 días)
5. Agregar filtro automático del día en `Interconsultas.tsx`
6. Agregar funcionalidad de imágenes en `InterconsultaDetailModal.tsx`
7. Agregar sección de imágenes en formulario de creación
8. Testing de carga/eliminación de imágenes

### Sprint 3: Interconsultas → Evolucionador (2-3 días)
9. Agregar estado `activeInterconsulta` en hub principal
10. Implementar botón "Ir al Evolucionador" en modal detalle
11. Implementar pre-carga de template en `DiagnosticAlgorithmContent.tsx`
12. Agregar modal de confirmación "Agregar a Pase de Sala"
13. Testing de flujo completo de pre-carga

### Sprint 4: Evolucionador → Pase de Sala (1-2 días)
14. Implementar lógica de guardado con actualización de interconsulta
15. Implementar creación en Pase de Sala con mapeo de campos
16. Agregar indicador visual opcional en WardPatientCard
17. Testing de extracción de secciones estructuradas

### Sprint 5: Testing Integral y Refinamiento (1-2 días)
18. Testing end-to-end del flujo completo
19. Validación de edge cases
20. Ajustes de UX/UI según feedback
21. Verificación de tipos TypeScript
22. Linting y formateo

**Tiempo total estimado**: 6-11 días de desarrollo

---

## Archivos a Modificar/Crear

### Nuevos archivos SQL (crear)
- `database/add_status_column_interconsultas.sql`
- `database/add_images_to_interconsultas.sql`
- `database/add_source_interconsulta_to_assessments.sql`

### Nuevo servicio (crear)
- `src/services/workflowIntegrationService.ts`

### Archivos TypeScript a modificar
1. `src/services/interconsultasService.ts` - Agregar funciones de imágenes y response update
2. `src/Interconsultas.tsx` - Filtro automático, handler para Evolucionador
3. `src/components/interconsultas/InterconsultaDetailModal.tsx` - Imágenes, OCR, botón Evolucionador
4. `src/neurology_residency_hub.tsx` - Estado activeInterconsulta, handler
5. `src/DiagnosticAlgorithmContent.tsx` - Pre-carga, modal confirmación, update respuesta
6. `src/WardRounds.tsx` - (Opcional) Indicador visual
7. `src/components/wardRounds/WardPatientCard.tsx` - (Opcional) Badge "Desde Interconsulta"

### Archivos de tipos
8. `src/types.ts` - Agregar `source_interconsulta_id` a PatientAssessment

---

## Consideraciones de Performance

1. **Lazy loading de imágenes**: Usar thumbnails en grids, full en modal
2. **Debouncing**: Filtro de búsqueda ya implementado (300ms)
3. **Optimistic updates**: Mantener patrón actual de Interconsultas
4. **Timeout protection**: Mantener robustQuery con 8000ms timeout
5. **Índices de BD**: Ya creados para fecha, status, display_order

---

## Consideraciones de UX

1. **Feedback visual constante**: Toast notifications en cada acción
2. **Confirmaciones**: Modal antes de agregar a Pase de Sala
3. **Indicadores de carga**: Spinners durante uploads
4. **Error recovery**: Mensajes claros de error con instrucciones
5. **Undo/Redo**: No implementado (fuera de scope), usar validaciones preventivas

---

## Riesgos y Mitigaciones

| Riesgo | Probabilidad | Impacto | Mitigación |
|--------|--------------|---------|------------|
| Regex de extracción falla | Media | Alto | Implementar fallbacks, validar en testing |
| Upload de imágenes lento | Media | Medio | Mostrar progreso, permitir cancelar |
| Duplicados en Pase de Sala | Baja | Alto | Validación de DNI antes de INSERT |
| Desincronización de status | Media | Medio | Usar transacciones cuando sea posible |
| Template estructurado confuso | Media | Medio | Agregar ejemplos/placeholders en secciones |

---

## Próximos Pasos (Fuera de Scope Actual)

- Sincronización bidireccional (cambios en Pase → actualizar Interconsulta)
- Historial de cambios/auditoría
- Notificaciones push cuando se resuelve interconsulta
- Export PDF directo desde flujo integrado
- Machine learning para autocompletar campos

---

## Conclusión

Este plan implementa un flujo integrado y natural para gestión de pacientes desde la consulta inicial hasta el seguimiento diario en sala. La arquitectura propuesta:

- ✅ Minimiza duplicación de datos
- ✅ Mantiene trazabilidad completa
- ✅ Respeta patrones existentes del codebase
- ✅ Es extensible para futuras mejoras
- ✅ No rompe funcionalidad existente
- ✅ Prioriza UX médica sobre complejidad técnica

**Estimated Lines of Code**: ~800-1000 nuevas líneas
**Files Modified**: 8 archivos existentes
**Files Created**: 4 archivos nuevos (3 SQL + 1 TS service)
