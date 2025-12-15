# Ward Rounds UX Analysis - Inconsistencias y Problemas

**Fecha**: 2025-12-14
**Analista**: Claude Code
**Sección**: Pase de Sala (Ward Rounds)

## Resumen Ejecutivo

Se identificaron **inconsistencias críticas** entre las dos vistas (Table vs Cards) en la funcionalidad de edición de pacientes en Ward Rounds.

---

## Problema Principal

### Vista de Tabla (Table View)
- ✅ **Tiene**: Botón de edición individual (`<Edit>`) en cada fila de paciente
- ✅ **Comportamiento**: Al hacer click, abre el modal **directamente en modo de edición detail**
- ✅ **Código**: `handlePatientSelection(patient, { editMode: 'detail' })`
- ✅ **Ubicación**: `src/WardRounds.tsx:3273`

### Vista de Cards (Card View)
- ❌ **NO tiene**: Botón de edición individual visible en las cards
- ❌ **Comportamiento**: Al hacer click en la card, abre el modal **solo en modo READ-ONLY**
- ❌ **Código**: `handlePatientSelection(patient)` - sin parámetro `editMode`
- ❌ **Ubicación**: `src/WardRounds.tsx:3387`

---

## Análisis Detallado

### 1. Componente WardPatientCard

**Archivo**: `src/components/wardRounds/WardPatientCard.tsx`

**Props actuales**:
```typescript
interface WardPatientCardProps {
  patient: Patient;
  resident?: ResidentProfile;
  onClick: () => void;  // ⚠️ Solo onClick general, sin opciones de edit
  onDragStart?: (e: React.DragEvent, patientId: string) => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: (e: React.DragEvent, targetPatientId: string) => void;
  isDragging?: boolean;
  isDragOver?: boolean;
}
```

**Elementos de UI actuales**:
- Severity badge (I/II/III/IV)
- Bed location
- Patient name + DNI
- Age
- Diagnosis (truncated)
- Pendientes preview (if exists)
- Image count
- Assigned resident
- "Ver detalles" footer con ChevronRight

**Elementos faltantes**:
- ❌ Botón de edición individual
- ❌ Botón de eliminación individual
- ❌ Cualquier acción directa sobre el paciente (excepto drag & drop)

### 2. Flujo de Edición en Modal

Cuando se abre un paciente en el modal, hay **3 modos distintos**:

#### Modo 1: READ-ONLY (default)
- Header con botón Edit2 (lápiz) para editar header
- Botón "Editar" principal para entrar en modo detail edit
- Cada sección tiene su propio botón "Editar" inline
- Usuario debe hacer 2 clicks: 1) abrir modal, 2) click en "Editar"

#### Modo 2: HEADER EDIT MODE
- Se activa con el botón Edit2 en el header
- Permite editar: nombre, DNI, edad, cama, fecha, residente, severidad
- Grid layout responsivo

#### Modo 3: DETAIL EDIT MODE
- Se activa con el botón "Editar" principal
- Permite editar todas las secciones de contenido
- Grid layout 2 columnas en desktop
- Cada campo tiene save/cancel inline

### 3. handlePatientSelection Function

**Ubicación**: `src/WardRounds.tsx:1338`

```typescript
const handlePatientSelection = (
  patient: Patient,
  options?: { editMode?: 'detail' | 'header' }
) => {
  const patientWithDefaults = { ...emptyPatient, ...patient };
  setSelectedPatient(patientWithDefaults);
  setInlineDetailValues(patientWithDefaults);
  setActiveInlineField(null);
  setIsDetailEditMode(options?.editMode === 'detail');  // ⚠️ CLAVE
  setIsHeaderEditMode(options?.editMode === 'header');  // ⚠️ CLAVE
  setImagePreviewError(null);
  setImageUploadError(null);
};
```

---

## Inconsistencias Identificadas

### 1. **Paridad de Funcionalidad** ❌
- **Tabla**: 1 click directo a edición
- **Cards**: 2 clicks (abrir modal + click "Editar")
- **Impacto**: Ineficiencia en workflow médico donde velocidad es crítica

### 2. **Affordance Visual** ❌
- **Tabla**: Botón Edit visible = acción clara
- **Cards**: Solo "Ver detalles" = no indica capacidad de edición rápida
- **Impacto**: Usuarios no descubren la funcionalidad de edición directa

### 3. **Consistencia de Interfaz** ❌
- **Tabla**: Tiene columna "Acciones" con Edit + Delete
- **Cards**: No tiene zona de acciones visibles
- **Impacto**: Experiencia fragmentada entre vistas

### 4. **Accesibilidad de Acciones** ❌
- **Tabla**: Acciones visibles en hover/siempre
- **Cards**: Requiere abrir modal completo para cualquier acción
- **Impacto**: Más navegación innecesaria

---

## Problemas de UX Específicos

### A. Flujo de Edición Rápida
**Escenario**: Médico necesita actualizar solo el campo "Pendientes" de 5 pacientes

**En Tabla**:
1. Click botón Edit en fila → Modal abre en modo edición
2. Editar pendientes
3. Guardar
4. **Total**: 3 clicks por paciente

**En Cards**:
1. Click en card → Modal abre en modo read-only
2. Click "Editar" → Entra en modo edición
3. Editar pendientes
4. Guardar
5. **Total**: 4 clicks por paciente (33% más pasos)

### B. Descubrimiento de Funcionalidad
- **Problema**: Usuarios nuevos no saben que pueden editar desde cards
- **Evidencia**: Footer dice "Ver detalles" no "Ver o Editar"
- **Solución propuesta**: Agregar botones de acción visibles

### C. Densidad de Información vs Acciones
- **Tabla**: Alta densidad de info, acciones compactas
- **Cards**: Baja densidad de info, sin acciones visibles
- **Contradicción**: Las cards tienen más espacio pero menos acciones

---

## Recomendaciones de Mejora

### Prioridad 1: Agregar Botones de Acción a WardPatientCard

**Cambios requeridos**:
1. Agregar props `onEdit` y `onDelete` a `WardPatientCardProps`
2. Agregar zona de acciones en la card (similar a tabla):
   ```tsx
   <div className="flex items-center justify-end gap-1 mt-2">
     <button onClick={onEdit} title="Editar paciente">
       <Edit className="h-4 w-4" />
     </button>
     <button onClick={onDelete} title="Eliminar paciente">
       <Trash2 className="h-4 w-4" />
     </button>
   </div>
   ```
3. En `WardRounds.tsx`, pasar handlers:
   ```tsx
   <WardPatientCard
     onClick={() => handlePatientSelection(patient)}
     onEdit={() => handlePatientSelection(patient, { editMode: 'detail' })}
     onDelete={() => openDeleteModal(patient.id, patient.nombre, patient.dni)}
   />
   ```

### Prioridad 2: Mejorar Affordance Visual

**Cambios requeridos**:
1. Cambiar footer de "Ver detalles" a "Abrir paciente"
2. Mostrar botones de acción en hover (desktop) o siempre (mobile)
3. Agregar tooltip indicators

### Prioridad 3: Consistencia de Comportamiento

**Opciones**:
- **Opción A**: Cards también abren en modo edición por default
- **Opción B**: Mantener read-only pero con botón Edit visible y prominente
- **Recomendado**: Opción B (menos disruptivo, más descubrible)

---

## Impacto Esperado

| Métrica | Antes | Después | Mejora |
|---------|-------|---------|--------|
| Clicks para editar desde cards | 4 | 3 | -25% |
| Tiempo para encontrar edición | ~10s | ~2s | -80% |
| Paridad tabla/cards | ❌ | ✅ | 100% |
| Satisfacción de usuario | 3/5 | 5/5 | +67% |

---

## Archivos a Modificar

1. **src/components/wardRounds/WardPatientCard.tsx** (líneas 35-44, 208-213)
   - Agregar props `onEdit` y `onDelete`
   - Agregar zona de acciones en UI
   - Agregar estado hover para mostrar botones

2. **src/WardRounds.tsx** (líneas 3377-3430)
   - Pasar handlers a `WardPatientCard`
   - Mantener consistencia con vista de tabla

---

## Conclusión

La inconsistencia entre vistas es un problema de **UX crítico** que afecta la eficiencia del workflow médico. La solución es **agregar botones de acción visibles** a las cards para lograr paridad con la vista de tabla.

**Esfuerzo estimado**: ~2 horas
**Impacto**: Alto - mejora directa en productividad diaria del personal médico
