# Pacientes Pendientes: componentes clave y guia de duplicacion

Este documento describe los componentes principales de la seccion "Pacientes Pendientes" y como replicarla para una nueva seccion (ej: "Articulos para leer").

## Objetivo
- Identificar los archivos base y su rol.
- Explicar flujo de datos y props.
- Definir pasos para duplicar la seccion sin romper integraciones existentes.

## Componentes principales

### 1) Board / contenedor
Archivo: `src/PendingPatientsBoard.tsx`
Responsabilidad:
- Cargar data (Supabase) via `pendingPatientsService`.
- Mantener filtros, busqueda, estado de modal, y conteos.
- Renderizar header + filtros + grilla de cards.

Props clave:
- `hospitalContext: 'Posadas' | 'Julian'`

Estado clave:
- `patients`, `filteredPatients`
- `searchTerm`, `priorityFilter`, `showResolved`
- `isModalOpen`, `editingPatient`, `loading`

Puntos de extension:
- Reemplazar servicio de data por el servicio del nuevo dominio.
- Ajustar filtros y campos visibles en header.

### 2) Card
Archivo: `src/components/pendingPatients/PatientCard.tsx`
Responsabilidad:
- Mostrar resumen del paciente con badges, notas y metadata.
- Acciones: editar, resolver, borrar, cambiar color.

Props clave:
- `patient`
- `onEdit`, `onDelete`, `onResolve`, `onColorChange`

Puntos de extension:
- Cambiar campos visibles (titulo, resumen, tags).
- Reemplazar acciones segun el nuevo dominio (ej: marcar como leido).

### 3) Modal de formulario
Archivo: `src/components/pendingPatients/PatientFormModal.tsx`
Responsabilidad:
- Crear/editar item.
- Validacion basica en UI.

Props clave (orientativo):
- `isOpen`, `onClose`
- `initialData`, `onSubmit`

Puntos de extension:
- Ajustar campos del formulario y validaciones.
- Mantener interfaz de submit simple para el board.

### 4) Tipos y constantes de estilo
Archivo: `src/types/pendingPatients.ts`
Responsabilidad:
- Tipos de dominio (`PendingPatient`, `CreatePendingPatientInput`).
- Constantes para estilos de prioridad y color (`PRIORITY_LABELS`, `CARD_COLORS`).

Puntos de extension:
- Clonar tipos para el nuevo dominio.
- Reutilizar constantes si el sistema de prioridades aplica igual.

### 5) Servicio de data
Archivo: `src/services/pendingPatientsService.ts`
Responsabilidad:
- CRUD en Supabase.
- Mapeo de datos y filtros.

Puntos de extension:
- Crear un servicio equivalente para la nueva tabla.
- Reusar firmas similares para minimizar cambios en el board.

## Flujo de datos (resumen)
1. `PendingPatientsBoard` llama `fetchPendingPatients(...)`.
2. La data se guarda en `patients` y se filtra en `filteredPatients`.
3. `PatientCard` muestra cada item y dispara callbacks al board.
4. `PatientFormModal` crea/edita y el board actualiza su estado local.

## Estilos y UI
- Cards y badges se basan en Tailwind y constantes de `pendingPatients.ts`.
- Variables globales en `src/index.css` controlan paleta base (no especifico de la seccion).
- La grilla de cards se define en `PendingPatientsBoard.tsx`.

## Guia de duplicacion (ej: Articulos para leer)

### A) Crear nuevo dominio
1. Crear tipos: `src/types/readingArticles.ts` (copiar estructura base).
2. Crear servicio: `src/services/readingArticlesService.ts` (CRUD nuevo).

### B) Duplicar UI
1. Duplicar board:
   - `src/ReadingArticlesBoard.tsx` (copiar desde `PendingPatientsBoard.tsx`).
   - Reemplazar types, servicio y campos mostrados.
2. Duplicar card:
   - `src/components/readingArticles/ArticleCard.tsx`.
   - Ajustar acciones (ej: `markAsRead`, `save`, `openLink`).
3. Duplicar modal:
   - `src/components/readingArticles/ArticleFormModal.tsx`.

### C) Conectar en el hub
Archivo: `src/neurology_residency_hub.tsx`
- Registrar modulo y ruta si aplica.
- Agregar el nuevo board en el switch de secciones.

### D) Checklist rapido
- [ ] Nuevo tipo y servicio compilan en TS.
- [ ] Board renderiza cards con datos reales.
- [ ] Acciones funcionan y actualizan estado local.
- [ ] Rutas/menus actualizados.
- [ ] Estilos consistentes con el resto de la app.

## Nota
Mantener firmas de callbacks y estructuras de estado similares reduce el esfuerzo al duplicar la seccion.
