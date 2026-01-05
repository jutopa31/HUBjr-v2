# Plan: Flujo Robusto Interconsulta → Evolucionador → Ward Rounds

## Resumen Ejecutivo

Implementar un flujo de confirmación robusto que permita al usuario revisar y editar campos antes de enviar datos desde Evolucionador a Pase de Sala (Ward Rounds).

**ESTADO**: ✅ Parsing implementado con detección automática de formato | ⚠️ Pendiente: Modal de confirmación

## Prioridades del Usuario

✅ **Formato nuevo**: Template compacto y específico para neurología
✅ **Compatibilidad**: Mantener soporte para evoluciones antiguas (formato SOAP)
✅ **UX Moderado**: Pre-llenado + revisión/edición antes de confirmar
✅ **NO guardar escalas** en Ward Rounds (solo en Evolucionador)
✅ **Mantener texto libre** en Evolucionador (con headers)
✅ **Modal en 2 lugares**: Desde Evolucionador Y desde Interconsultas
✅ **Todo editable**: Nombre, DNI, edad, cama, secciones clínicas
✅ **Validación estricta**: Campos obligatorios antes de confirmar

## Arquitectura Actual

### Flujo Existente (Implementado)
```
INTERCONSULTAS
    ↓ generateEvolucionadorTemplate() - ✅ Genera formato nuevo
EVOLUCIONADOR (texto libre con headers)
    ↓ Guarda en diagnostic_assessments
    ↓ extractStructuredSections() - ✅ Detecta formato automáticamente
    ↓   ├─ Formato NUEVO → extractStructuredSections_Nuevo()
    ↓   └─ Formato SOAP → extractStructuredSections_SOAP()
    ↓ (⚠️ PENDIENTE: UI DE CONFIRMACIÓN)
    ↓ createWardPatientFromEvolution()
WARD ROUNDS
```

### Cambios Implementados (✅ Completado)

1. **Nuevo formato de template** (`generateEvolucionadorTemplate()`):
   - Template compacto: datos básicos en 2 líneas
   - Secciones específicas para neurología: "Examen neurológico"
   - Nuevas secciones: "Interpretación", "Sugerencias", "Personal interviniente"
   - Sin sección "Alergias"

2. **Detección automática de formato** (`extractStructuredSections()`):
   - Detecta si es formato NUEVO (`PACIENTE:`) o SOAP (`DATOS:`)
   - Llama al parser apropiado automáticamente
   - Compatibilidad total con evoluciones antiguas

3. **Mapeo inteligente** (`mapToWardRoundPatient()`):
   - Detecta formato y usa campos apropiados
   - Mapea secciones nuevas a campos existentes de Ward Rounds
   - "Personal interviniente" se ignora (no se mapea)

## Implementación Actual (✅ Completado)

### 1. FORMATOS DE TEMPLATE

**Archivo**: `src/services/workflowIntegrationService.ts`

#### Formato NUEVO (Generado por `generateEvolucionadorTemplate()`)

```
PACIENTE: Juan Pérez
DNI: 12345678, EDAD: 45, CAMA: 4-3

Antecedentes:

Enfermedad actual:
[motivo de consulta de la interconsulta]

Examen neurológico

Estudios complementarios
[estudios OCR si existen]

Interpretación

Sugerencias

Personal interviniente
```

**Características**:
- ✅ Header: `PACIENTE: Nombre` (no sección DATOS separada)
- ✅ Datos básicos en UNA línea: `DNI: X, EDAD: Y, CAMA: Z`
- ✅ Sin sub-secciones en Antecedentes (no "Alergias", "Medicación")
- ✅ "Examen neurológico" específico para neurología
- ✅ Nuevas secciones: Interpretación, Sugerencias, Personal interviniente

#### Formato SOAP ANTIGUO (Compatibilidad)

```
DATOS:
PACIENTE: Juan Pérez
DNI: 12345678
EDAD: 45
CAMA: 4-3

ANTECEDENTES:
- Antecedentes personales:
- Medicación actual:
- Alergias:

ENFERMEDAD ACTUAL:
[...]

EXAMEN FÍSICO:
[...]

CONDUCTA:
[...]

PENDIENTES:
[...]
```

**Mantiene compatibilidad** con evoluciones guardadas antes del cambio.

### 2. PARSING CON DETECCIÓN AUTOMÁTICA

#### A. Wrapper con Detección (`extractStructuredSections()`)

```typescript
export function extractStructuredSections(clinicalNotes: string): any {
  // Detectar formato automáticamente
  const hasNewFormat = /^PACIENTE:/.test(clinicalNotes.trim());
  const hasSOAPFormat = /^DATOS:/i.test(clinicalNotes.trim());

  if (hasNewFormat) {
    console.log('[WorkflowIntegration] ✅ Formato NUEVO detectado');
    return extractStructuredSections_Nuevo(clinicalNotes);
  } else if (hasSOAPFormat) {
    console.log('[WorkflowIntegration] ℹ️ Formato SOAP detectado (compatibilidad)');
    return extractStructuredSections_SOAP(clinicalNotes);
  } else {
    // Default: asumir SOAP para compatibilidad
    console.warn('[WorkflowIntegration] ⚠️ Formato desconocido, asumiendo SOAP');
    return extractStructuredSections_SOAP(clinicalNotes);
  }
}
```

#### B. Parser para Formato NUEVO (`extractStructuredSections_Nuevo()`)

```typescript
function extractStructuredSections_Nuevo(clinicalNotes: string): {
  paciente: string;
  datosBasicos: string;
  antecedentes: string;
  enfermedadActual: string;
  examenNeurologico: string;
  estudiosComplementarios: string;
  interpretacion: string;
  sugerencias: string;
  personalInterviniente: string;
} {
  const sections = {
    paciente: '',
    datosBasicos: '',
    antecedentes: '',
    enfermedadActual: '',
    examenNeurologico: '',
    estudiosComplementarios: '',
    interpretacion: '',
    sugerencias: '',
    personalInterviniente: ''
  };

  // Regex patterns para formato nuevo
  const patterns = {
    paciente: /^PACIENTE:\s*(.+?)(?=\n)/m,
    datosBasicos: /DNI:\s*(.+?)(?=\n\n|$)/s,
    antecedentes: /Antecedentes:\s*\n+([^\n]*(?:\n(?!Enfermedad actual:)[^\n]*)*)/i,
    enfermedadActual: /Enfermedad actual:\s*\n+([^\n]*(?:\n(?!Examen neurológico)[^\n]*)*)/i,
    examenNeurologico: /Examen neurológico\s*\n+([^\n]*(?:\n(?!Estudios complementarios)[^\n]*)*)/i,
    estudiosComplementarios: /Estudios complementarios\s*\n+([^\n]*(?:\n(?!Interpretación)[^\n]*)*)/i,
    interpretacion: /Interpretación\s*\n+([^\n]*(?:\n(?!Sugerencias)[^\n]*)*)/i,
    sugerencias: /Sugerencias\s*\n+([^\n]*(?:\n(?!Personal interviniente)[^\n]*)*)/i,
    personalInterviniente: /Personal interviniente\s*\n+([^\n]*(?:\n[^\n]*)*)/i
  };

  for (const [key, pattern] of Object.entries(patterns)) {
    const match = clinicalNotes.match(pattern);
    if (match && match[1]) {
      sections[key as keyof typeof sections] = match[1].trim();
    }
  }

  return sections;
}
```

#### C. Parser para Datos Básicos Compactos (`extractDataFieldsFromLine()`)

```typescript
export function extractDataFieldsFromLine(datosLine: string): {
  dni: string;
  edad: string;
  cama: string;
} {
  const fields = { dni: '', edad: '', cama: '' };

  // Formato: "DNI: 12345678, EDAD: 45, CAMA: 4-3"
  const dniMatch = datosLine.match(/DNI:\s*([^,\n]+)/i);
  if (dniMatch) fields.dni = dniMatch[1].trim();

  const edadMatch = datosLine.match(/EDAD:\s*([^,\n]+)/i);
  if (edadMatch) fields.edad = edadMatch[1].trim();

  const camaMatch = datosLine.match(/CAMA:\s*(.+?)(?=\n|$)/i);
  if (camaMatch) fields.cama = camaMatch[1].trim();

  return fields;
}
```

### 3. MAPEO INTELIGENTE (`mapToWardRoundPatient()`)

```typescript
export function mapToWardRoundPatient(
  interconsulta: InterconsultaRow,
  assessment: PatientAssessment
): any {
  const sections = extractStructuredSections(assessment.clinical_notes);

  // Caso 1: Formato NUEVO
  if ('paciente' in sections && sections.paciente) {
    const dataFields = extractDataFieldsFromLine(sections.datosBasicos);

    return {
      nombre: sections.paciente || interconsulta.nombre,
      dni: dataFields.dni || interconsulta.dni,
      edad: dataFields.edad || interconsulta.edad || '',
      cama: dataFields.cama || interconsulta.cama,
      fecha: new Date().toISOString().split('T')[0],

      antecedentes: sections.antecedentes || '',
      motivo_consulta: sections.enfermedadActual || '',
      examen_fisico: sections.examenNeurologico || '',
      estudios: sections.estudiosComplementarios || '',

      // Mapear nuevas secciones a campos existentes
      diagnostico: sections.interpretacion || '',
      plan: sections.sugerencias || '',

      // Personal interviniente NO se mapea (se ignora)
      pendientes: '',

      image_thumbnail_url: interconsulta.image_thumbnail_url || [],
      image_full_url: interconsulta.image_full_url || [],
      exa_url: interconsulta.exa_url || [],

      hospital_context: interconsulta.hospital_context || 'Posadas',
      severidad: 'II',
      display_order: 9999
    };
  }

  // Caso 2: Formato SOAP (compatibilidad hacia atrás)
  const dataFields = extractDataFields(sections.datos);

  return {
    nombre: dataFields.nombre || interconsulta.nombre,
    dni: dataFields.dni || interconsulta.dni,
    edad: dataFields.edad || interconsulta.edad || '',
    cama: dataFields.cama || interconsulta.cama,
    fecha: new Date().toISOString().split('T')[0],

    antecedentes: sections.antecedentes,
    motivo_consulta: sections.enfermedadActual,
    examen_fisico: sections.examenFisico,
    estudios: sections.estudiosComplementarios,
    plan: sections.conducta,
    diagnostico: extractDiagnosticoFromConducta(sections.conducta),
    pendientes: sections.pendientes,

    image_thumbnail_url: interconsulta.image_thumbnail_url || [],
    image_full_url: interconsulta.image_full_url || [],
    exa_url: interconsulta.exa_url || [],

    hospital_context: interconsulta.hospital_context || 'Posadas',
    severidad: 'II',
    display_order: 9999
  };
}
```

**Mapeo de Secciones Nuevas**:

| Sección Evolucionador | Campo Ward Rounds | Notas |
|-----------------------|-------------------|-------|
| `Interpretación` | `diagnostico` | ✅ Mapeado |
| `Sugerencias` | `plan` | ✅ Mapeado |
| `Personal interviniente` | (ninguno) | ⚪ Ignorado |

## Pendiente de Implementación (⚠️ TODO)

### COMPONENTE MODAL DE CONFIRMACIÓN

**Archivo**: `src/components/interconsultas/WardConfirmationModal.tsx` (ya existe, verificar si necesita actualización)

```typescript
import React, { useState, useEffect } from 'react';

interface WardRoundConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (editedData: any) => Promise<void>;
  interconsulta: InterconsultaRow;
  assessment: PatientAssessment;
}

export function WardRoundConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  interconsulta,
  assessment
}: WardRoundConfirmationModalProps) {
  const [formData, setFormData] = useState<any>({});
  const [extractionQuality, setExtractionQuality] = useState<any>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  // Pre-llenar campos al abrir modal
  useEffect(() => {
    if (isOpen && interconsulta && assessment) {
      const mapped = mapToWardRoundPatient(interconsulta, assessment);
      setFormData(mapped);
      setExtractionQuality(mapped._extractionQuality || {});
    }
  }, [isOpen, interconsulta, assessment]);

  // Validar campos obligatorios (req. 6C)
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.nombre?.trim()) {
      newErrors.nombre = 'Nombre es obligatorio';
    }
    if (!formData.dni?.trim()) {
      newErrors.dni = 'DNI es obligatorio';
    }
    if (!formData.edad?.trim()) {
      newErrors.edad = 'Edad es obligatoria';
    }
    if (!formData.cama?.trim()) {
      newErrors.cama = 'Cama es obligatoria';
    }

    // Campos clínicos obligatorios (req. 6C)
    if (!formData.antecedentes?.trim()) {
      newErrors.antecedentes = 'Antecedentes es obligatorio';
    }
    if (!formData.motivo_consulta?.trim()) {
      newErrors.motivo_consulta = 'Motivo de consulta es obligatorio';
    }
    if (!formData.examen_fisico?.trim()) {
      newErrors.examen_fisico = 'Examen físico es obligatorio';
    }
    if (!formData.plan?.trim()) {
      newErrors.plan = 'Plan/Conducta es obligatorio';
    }
    if (!formData.diagnostico?.trim()) {
      newErrors.diagnostico = 'Diagnóstico es obligatorio';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleConfirm = async () => {
    if (!validateForm()) {
      alert('Por favor complete todos los campos obligatorios');
      return;
    }

    setSaving(true);
    try {
      await onConfirm(formData);
      onClose();
    } catch (error) {
      console.error('Error al confirmar:', error);
      alert('Error al guardar paciente en Pase de Sala');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-6xl w-full max-h-[90vh] overflow-hidden">

        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
            Confirmar envío a Pase de Sala
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Revise y edite los campos antes de confirmar
          </p>
        </div>

        {/* Body - Layout de 2 columnas */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-180px)]">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

            {/* Columna izquierda: Texto original (read-only) */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                Texto generado en Evolucionador
              </h3>
              <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 text-sm font-mono whitespace-pre-wrap max-h-[600px] overflow-y-auto border border-gray-200 dark:border-gray-700">
                {assessment.clinical_notes}
              </div>
            </div>

            {/* Columna derecha: Campos editables */}
            <div>
              <h3 className="text-lg font-medium mb-3 text-gray-900 dark:text-white">
                Campos para Pase de Sala (editables)
              </h3>

              <div className="space-y-4">
                {/* Datos básicos */}
                <div className="grid grid-cols-2 gap-3">
                  <InputField
                    label="Nombre"
                    value={formData.nombre || ''}
                    onChange={(val) => setFormData({...formData, nombre: val})}
                    error={errors.nombre}
                    required
                  />
                  <InputField
                    label="DNI"
                    value={formData.dni || ''}
                    onChange={(val) => setFormData({...formData, dni: val})}
                    error={errors.dni}
                    required
                  />
                  <InputField
                    label="Edad"
                    value={formData.edad || ''}
                    onChange={(val) => setFormData({...formData, edad: val})}
                    error={errors.edad}
                    required
                  />
                  <InputField
                    label="Cama"
                    value={formData.cama || ''}
                    onChange={(val) => setFormData({...formData, cama: val})}
                    error={errors.cama}
                    required
                  />
                </div>

                {/* Secciones clínicas */}
                <TextAreaField
                  label="Antecedentes"
                  value={formData.antecedentes || ''}
                  onChange={(val) => setFormData({...formData, antecedentes: val})}
                  error={errors.antecedentes}
                  quality={extractionQuality.antecedentes}
                  required
                />

                <TextAreaField
                  label="Motivo de Consulta / Enfermedad Actual"
                  value={formData.motivo_consulta || ''}
                  onChange={(val) => setFormData({...formData, motivo_consulta: val})}
                  error={errors.motivo_consulta}
                  quality={extractionQuality.enfermedadActual}
                  required
                />

                <TextAreaField
                  label="Examen Físico"
                  value={formData.examen_fisico || ''}
                  onChange={(val) => setFormData({...formData, examen_fisico: val})}
                  error={errors.examen_fisico}
                  quality={extractionQuality.examenFisico}
                  required
                />

                <TextAreaField
                  label="Estudios Complementarios"
                  value={formData.estudios || ''}
                  onChange={(val) => setFormData({...formData, estudios: val})}
                  quality={extractionQuality.estudiosComplementarios}
                />

                <TextAreaField
                  label="Plan / Conducta"
                  value={formData.plan || ''}
                  onChange={(val) => setFormData({...formData, plan: val})}
                  error={errors.plan}
                  quality={extractionQuality.conducta}
                  required
                />

                <InputField
                  label="Diagnóstico"
                  value={formData.diagnostico || ''}
                  onChange={(val) => setFormData({...formData, diagnostico: val})}
                  error={errors.diagnostico}
                  required
                  placeholder="Diagnóstico presuntivo principal"
                />

                <TextAreaField
                  label="Pendientes"
                  value={formData.pendientes || ''}
                  onChange={(val) => setFormData({...formData, pendientes: val})}
                  quality={extractionQuality.pendientes}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={saving}
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? 'Guardando...' : 'Confirmar y Enviar a Pase'}
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Input simple con validación
 */
function InputField({
  label,
  value,
  onChange,
  error,
  required,
  placeholder
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`
          w-full px-3 py-2 rounded border
          ${error ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-300 dark:border-gray-600'}
          dark:bg-gray-700 dark:text-white
          focus:outline-none focus:ring-2 focus:ring-blue-500
        `}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}

/**
 * TextArea con indicador de calidad de extracción
 */
function TextAreaField({
  label,
  value,
  onChange,
  error,
  quality,
  required
}: {
  label: string;
  value: string;
  onChange: (val: string) => void;
  error?: string;
  quality?: 'high' | 'medium' | 'low' | 'empty';
  required?: boolean;
}) {
  // Fondo amarillo suave si vacío (req. 3B)
  const bgClass = quality === 'empty'
    ? 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400'
    : error
    ? 'bg-red-50 dark:bg-red-900/20 border-red-500'
    : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600';

  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
        {label} {required && <span className="text-red-500">*</span>}
        {quality === 'empty' && (
          <span className="text-yellow-600 dark:text-yellow-400 text-xs ml-2">
            ⚠️ Campo vacío - debe completarlo
          </span>
        )}
      </label>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={4}
        className={`
          w-full px-3 py-2 rounded border
          ${bgClass}
          dark:text-white
          focus:outline-none focus:ring-2 focus:ring-blue-500
        `}
      />
      {error && (
        <p className="text-sm text-red-600 dark:text-red-400 mt-1">{error}</p>
      )}
    </div>
  );
}
```

### 3. INTEGRAR MODAL EN DOS LUGARES

#### A. En Listado de Interconsultas

**Archivo**: `src/Interconsultas.tsx` (o componente principal de Interconsultas)

```typescript
import { WardRoundConfirmationModal } from './components/wardRounds/WardRoundConfirmationModal';
import { createWardPatientDirectly } from './services/workflowIntegrationService';

function Interconsultas() {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [selectedInterconsulta, setSelectedInterconsulta] = useState<InterconsultaRow | null>(null);
  const [selectedAssessment, setSelectedAssessment] = useState<PatientAssessment | null>(null);

  const handleSendToPase = async (interconsulta: InterconsultaRow) => {
    // Buscar assessment asociado
    const { data: assessment } = await supabase
      .from('diagnostic_assessments')
      .select('*')
      .eq('source_interconsulta_id', interconsulta.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (!assessment) {
      alert('No se encontró evaluación asociada. Primero debe evolucionar este paciente.');
      return;
    }

    setSelectedInterconsulta(interconsulta);
    setSelectedAssessment(assessment);
    setConfirmModalOpen(true);
  };

  const handleConfirmSend = async (editedData: any) => {
    if (!selectedAssessment) return;

    const result = await createWardPatientDirectly(editedData, selectedAssessment.id);

    if (result.success) {
      alert('✓ Paciente enviado a Pase de Sala exitosamente');
      // Refrescar lista si es necesario
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  return (
    <div>
      {/* Lista de interconsultas */}
      {interconsultas.map(ic => (
        <div key={ic.id}>
          {/* Card de interconsulta */}
          <button onClick={() => handleSendToPase(ic)}>
            Enviar a Pase de Sala
          </button>
        </div>
      ))}

      {/* Modal de confirmación */}
      <WardRoundConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmSend}
        interconsulta={selectedInterconsulta!}
        assessment={selectedAssessment!}
      />
    </div>
  );
}
```

#### B. En Evolucionador (después de guardar)

**Archivo**: Componente principal de Evolucionador (a identificar)

```typescript
import { WardRoundConfirmationModal } from './components/wardRounds/WardRoundConfirmationModal';

function Evolucionador() {
  const [confirmModalOpen, setConfirmModalOpen] = useState(false);
  const [currentInterconsulta, setCurrentInterconsulta] = useState<InterconsultaRow | null>(null);
  const [currentAssessment, setCurrentAssessment] = useState<PatientAssessment | null>(null);

  const handleSaveComplete = async (savedAssessment: PatientAssessment) => {
    // Después de guardar exitosamente en diagnostic_assessments

    // Obtener interconsulta origen si existe
    if (savedAssessment.source_interconsulta_id) {
      const { data: interconsulta } = await getInterconsultaById(
        savedAssessment.source_interconsulta_id
      );

      setCurrentInterconsulta(interconsulta);
      setCurrentAssessment(savedAssessment);

      // Mostrar opción de enviar a Pase
      const shouldSend = confirm('¿Desea enviar este paciente a Pase de Sala?');
      if (shouldSend) {
        setConfirmModalOpen(true);
      }
    }
  };

  return (
    <div>
      {/* UI del Evolucionador */}

      {/* Modal de confirmación */}
      <WardRoundConfirmationModal
        isOpen={confirmModalOpen}
        onClose={() => setConfirmModalOpen(false)}
        onConfirm={handleConfirmSend}
        interconsulta={currentInterconsulta!}
        assessment={currentAssessment!}
      />
    </div>
  );
}
```

### 4. TESTING Y VALIDACIÓN

#### Casos de Prueba

1. **Formato estándar**:
   - Texto con headers exactos: `ANTECEDENTES:`, `ENFERMEDAD ACTUAL:`
   - ✅ Debe extraer correctamente

2. **Variaciones de formato**:
   - `Antecedentes:` (minúsculas), `ANTEC:` (abreviatura)
   - ✅ Debe extraer con regex flexible

3. **Campos vacíos**:
   - Sección `ESTUDIOS COMPLEMENTARIOS:` sin contenido
   - ✅ Debe marcar con fondo amarillo en modal

4. **Diagnóstico en diferentes lugares**:
   - En CONDUCTA, en ENFERMEDAD ACTUAL, como "Dx:"
   - ✅ Debe encontrarlo con búsqueda flexible

5. **Validación obligatoria**:
   - Intentar confirmar con campos vacíos
   - ✅ Debe mostrar error y no permitir guardar

6. **Edición manual**:
   - Usuario edita nombre, DNI, secciones clínicas
   - ✅ Debe guardar datos editados, no originales

## Archivos Modificados

### ✅ Completado
- **`src/services/workflowIntegrationService.ts`**
  - ✅ Modificado `generateEvolucionadorTemplate()` → genera formato nuevo
  - ✅ Creado `extractStructuredSections_Nuevo()` → parser formato nuevo
  - ✅ Renombrado `extractStructuredSections()` → `extractStructuredSections_SOAP()`
  - ✅ Creado wrapper `extractStructuredSections()` → detección automática
  - ✅ Creado `extractDataFieldsFromLine()` → parser DNI/EDAD/CAMA compacto
  - ✅ Actualizado `mapToWardRoundPatient()` → detecta y mapea ambos formatos

### ⚠️ Pendiente
- **`src/components/interconsultas/WardConfirmationModal.tsx`** (verificar si existe y si necesita actualización)
  - ⚠️ Verificar soporte para formato nuevo
  - ⚠️ Validación de campos obligatorios
  - ⚠️ Interfaz de edición pre-confirmación

- **`src/Interconsultas.tsx`** (o componente principal)
  - ⚠️ Verificar integración con modal
  - ⚠️ Botón "Enviar a Pase de Sala"

- **Componente Evolucionador** (identificar ruta exacta)
  - ⚠️ Integrar modal después de guardar
  - ⚠️ Flujo post-guardado → confirmación → Ward Rounds

## Estado de Implementación

### ✅ Fase 1: Parsing y Template (COMPLETADO)
1. ✅ Nuevo formato de template implementado
2. ✅ Parser para formato nuevo (`extractStructuredSections_Nuevo()`)
3. ✅ Parser para formato SOAP (`extractStructuredSections_SOAP()`)
4. ✅ Detección automática de formato
5. ✅ Mapeo inteligente con soporte dual
6. ✅ Compilación TypeScript sin errores
7. ⚠️ **Testing manual**: Pendiente verificar con interconsulta real

### ⚠️ Fase 2: UI de Confirmación (PENDIENTE)
1. ⚠️ Verificar modal existente (`WardConfirmationModal.tsx`)
2. ⚠️ Actualizar modal para formato nuevo (si es necesario)
3. ⚠️ Validación de campos obligatorios
4. ⚠️ Testing del modal

### ⚠️ Fase 3: Integración (PENDIENTE)
1. ⚠️ Identificar componente principal de Evolucionador
2. ⚠️ Integrar modal en Evolucionador
3. ⚠️ Integrar modal en Interconsultas
4. ⚠️ Testing end-to-end

## Notas Importantes

### Decisiones de Diseño Implementadas

1. **Nuevo formato compacto** (✅ Implementado)
   - Template más breve: datos básicos en 2 líneas
   - Específico para neurología: "Examen neurológico"
   - Nuevas secciones: Interpretación, Sugerencias, Personal interviniente

2. **Compatibilidad hacia atrás** (✅ Implementado)
   - Evoluciones antiguas (formato SOAP) siguen funcionando
   - Detección automática de formato
   - Sin necesidad de migración de datos

3. **Mapeo de secciones nuevas** (✅ Implementado)
   - Interpretación → `diagnostico` (Ward Rounds)
   - Sugerencias → `plan` (Ward Rounds)
   - Personal interviniente → **NO se mapea** (se ignora)

4. **NO se guardan escalas en Ward Rounds**
   - Las escalas quedan solo en `diagnostic_assessments.scale_results`

5. **Modal en 2 lugares** (⚠️ Pendiente implementar)
   - Desde Evolucionador (después de guardar)
   - Desde Interconsultas (botón en cada interconsulta evolucionada)

## Testing Pendiente

### Casos de Prueba

1. **Template nuevo generado correctamente**:
   ```bash
   # Abrir interconsulta → Evolucionador
   # Verificar formato:
   PACIENTE: [nombre]
   DNI: [dni], EDAD: [edad], CAMA: [cama]

   Antecedentes:

   Enfermedad actual:
   [motivo de consulta]

   Examen neurológico

   Estudios complementarios

   Interpretación

   Sugerencias

   Personal interviniente
   ```
   ✅ Debe generar estructura correcta

2. **Parsing de formato nuevo**:
   - Completar evolución en formato nuevo
   - Guardar en diagnostic_assessments
   - Abrir modal de confirmación Ward Rounds
   - ✅ Debe extraer todas las secciones correctamente

3. **Compatibilidad con formato SOAP**:
   - Abrir evolución vieja (formato SOAP)
   - Intentar enviar a Ward Rounds
   - ✅ Debe parsear con `extractStructuredSections_SOAP()`

4. **Mapeo correcto**:
   - Verificar que "Interpretación" → `diagnostico`
   - Verificar que "Sugerencias" → `plan`
   - Verificar que "Personal interviniente" NO aparece en Ward Rounds
   - ✅ Mapeo debe ser correcto

## Próximos Pasos

1. **Testing Manual Inmediato**:
   ```bash
   npm run dev
   ```
   - Ir a Interconsultas
   - Click "Evolucion" en una interconsulta
   - Verificar template nuevo
   - Completar secciones
   - Guardar

2. **Verificar Modal Existente**:
   - Localizar `WardConfirmationModal.tsx`
   - Verificar si soporta formato nuevo
   - Actualizar si es necesario

3. **Integración Completa**:
   - Conectar flujo Evolucionador → Modal → Ward Rounds
   - Testing end-to-end

## Resumen de Cambios

### ✅ Completado (Fase 1)
- Nuevo formato de template de evoluciones
- Parsing con detección automática de formato
- Compatibilidad con evoluciones antiguas
- Mapeo inteligente a Ward Rounds
- Compilación TypeScript sin errores

### ⚠️ Pendiente (Fases 2-3)
- Verificar/actualizar modal de confirmación
- Integrar flujo completo en UI
- Testing manual exhaustivo
- Testing con usuarios reales
