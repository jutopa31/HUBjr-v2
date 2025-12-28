# Plan: Importador CSV para Ward Rounds (Pase de Sala)

## Resumen Ejecutivo

Implementar un importador CSV que permita a los residentes cargar datos del pase de sala desde Google Sheets o archivos locales, evitando duplicar trabajo. El sistema identificará pacientes existentes por DNI y los actualizará, o creará nuevos registros según corresponda.

---

## Estructura del CSV Actual

**Archivo analizado:** `C:\Users\julia\Downloads\PASE NEUROLOGÍA 02_09_25 - INTERNACION.csv`

**Formato:**
- Primeras 3 filas: Headers/títulos (se ignoran)
- Fila 4: Nombres de columnas
- Fila 5+: Datos de pacientes

**Columnas → Campos del Sistema:**
```
CAMA             → cama (requerido)
DNI              → dni (requerido, clave única para updates)
NOMBRE           → nombre (requerido)
EDAD             → edad (opcional)
ANT              → antecedentes
MC               → motivo_consulta
EF/NIHSS/ABCD2.  → examen_fisico
EC               → estudios
SEV              → severidad (valores: I, II, III, IV, V)
DX               → diagnostico
PLAN             → plan
```

**Campos NO en CSV (preservar al actualizar):**
- `pendientes` (sincroniza con sistema de tareas)
- `image_thumbnail_url`, `image_full_url`, `exa_url`
- `assigned_resident_id`
- `display_order`
- `hospital_context` (usar contexto actual del usuario)
- `fecha` (seleccionable en UI, default: hoy)

---

## Arquitectura de la Solución

### 1. Archivos Nuevos

```
src/
├── components/wardRounds/
│   ├── CSVImportModal.tsx              # Modal principal de importación
│   └── ImportValidationResults.tsx     # Componente de resultados
├── services/
│   └── wardRoundsImportService.ts      # Lógica de negocio
└── utils/
    └── csvParser.ts                     # Utilidades de parsing
```

### 2. Archivos a Modificar

- **`src/WardRounds.tsx`**:
  - Línea ~100: Agregar estado `showCSVImportModal`
  - Línea ~1804: Agregar botón "Importar CSV" junto a "Exportar PDF"
  - Final del componente: Renderizar `<CSVImportModal>`
  - Imports: Agregar `Upload` icon y `CSVImportModal`

- **`package.json`**:
  - Instalar `papaparse` y `@types/papaparse`

---

## Flujo de Datos

```
┌──────────────────────────┐
│ Usuario sube CSV o URL   │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ csvParser.ts             │
│ - PapaParse              │
│ - Skip 3 header rows     │
│ - Map columnas           │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ wardRoundsImportService  │
│ - validateCSVData()      │
│ - Check DNI duplicates   │
│ - Validate campos        │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ ImportValidationResults  │
│ - Mostrar solo errores   │
│ - Summary stats          │
└────────────┬─────────────┘
             │
             ▼ (Usuario confirma)
┌──────────────────────────┐
│ processImport()          │
│ - Por cada fila:         │
│   * Query DNI            │
│   * UPDATE si existe     │
│   * INSERT si es nuevo   │
│ - Preservar non-CSV      │
└────────────┬─────────────┘
             │
             ▼
┌──────────────────────────┐
│ loadPatients() refresh   │
│ - Mostrar éxito          │
│ - Auto-cerrar modal      │
└──────────────────────────┘
```

---

## Implementación Paso a Paso

### Fase 1: Instalación y Utilidades
**Archivo:** `package.json`
```bash
npm install papaparse
npm install --save-dev @types/papaparse
```

**Archivo:** `src/utils/csvParser.ts`

**Funciones clave:**
- `parseCSVFile(file: File)` - Parser cliente-side
- `parseCSVFromURL(url: string)` - Fetch desde Google Sheets
- `convertToCSVExportURL(url)` - Convertir URL de Sheets a export URL
- Configuración PapaParse:
  - `beforeFirstChunk`: Skip 3 header rows
  - `header: true`: Primera fila como nombres de columnas
  - `transform`: Trim whitespace

**Conversión Google Sheets URL:**
```
Entrada: https://docs.google.com/spreadsheets/d/{ID}/edit#gid={GID}
Salida:  https://docs.google.com/spreadsheets/d/{ID}/export?format=csv&gid={GID}
```

---

### Fase 2: Servicio de Importación
**Archivo:** `src/services/wardRoundsImportService.ts`

**Interfaces:**
```typescript
interface ImportValidationResult {
  valid: boolean;
  summary: { totalRows, newPatients, updates, errors, warnings };
  errors: ValidationError[];
  warnings: ValidationWarning[];
  parsedData: ParsedPatient[];
}
```

**Funciones:**

1. **`mapCSVRowToPatient(row, fecha, hospitalContext)`**
   - Mapear columnas CSV a interfaz Patient
   - Establecer `fecha` y `hospital_context`

2. **`validateCSVData(rows, fecha, hospitalContext)`**
   - Validar campos requeridos: CAMA, DNI, NOMBRE
   - Validar severidad: I, II, III, IV, V
   - Warning si EDAD vacío
   - Por cada DNI: `checkDuplicateDNI()` para detectar updates vs inserts
   - Retornar `ImportValidationResult`

3. **`checkDuplicateDNI(dni)`**
   - Query Supabase con `robustQuery`
   - Retornar `{ exists, patientId, patientData }`
   - Timeout: 5000ms, retries: 1

4. **`processImport(parsedData)`**
   - Iterar cada `ParsedPatient`
   - Si `isUpdate`:
     * Fetch current data
     * Merge: CSV fields override, preserve non-CSV fields
     * UPDATE usando `robustQuery` (timeout: 10s, retries: 2)
   - Si nuevo:
     * Set defaults para non-CSV fields
     * INSERT usando `robustQuery`
   - Delay 100ms entre operaciones
   - Retornar `{ success, imported, failed, errors[] }`

**Patrón robustQuery** (heredado de `interconsultasService.ts`):
```typescript
await robustQuery(
  () => supabase.from('ward_round_patients').select('*'),
  { timeout: 8000, retries: 2, operationName: 'operationName' }
);
```

---

### Fase 3: Componentes UI

#### 3.1 ImportValidationResults
**Archivo:** `src/components/wardRounds/ImportValidationResults.tsx`

**Características:**
- Summary badges: verde (nuevos), azul (updates), rojo (errores), amarillo (warnings)
- Sección de errores: expandida por defecto si hay errores, rojo
- Sección de warnings: colapsada por defecto, amarillo
- Cada error muestra: Fila, campo, mensaje, valor
- Altura max: 60vh con scroll

**Diseño content-first:**
- Compacto, collapsible
- Solo mostrar errores (como requerido por usuario)

---

#### 3.2 CSVImportModal
**Archivo:** `src/components/wardRounds/CSVImportModal.tsx`

**Props:**
```typescript
interface CSVImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: () => Promise<void>;
  hospitalContext: HospitalContext;
}
```

**Estructura del Modal:**

1. **Header (60px max):**
   - Título: "Importar Pacientes desde CSV"
   - Subtítulo: Hospital context
   - Botón cerrar (X)

2. **Tabs (40px):**
   - Tab 1: "Archivo Local (.csv)" - File upload con drag & drop
   - Tab 2: "Google Sheets" - URL input

3. **Content Area (scrollable):**
   - **File Tab:**
     * Drag & drop zone con icono Upload
     * Input hidden tipo file (.csv)
     * Mostrar nombre y tamaño de archivo seleccionado

   - **URL Tab:**
     * Input text para URL de Google Sheets
     * Hint: "Debe ser público o accesible con el link"

   - **Date Picker:**
     * Input tipo date
     * Default: hoy
     * Label: "Fecha de pase de sala"

   - **Botón Validar:**
     * Habilitado si hay file o URL
     * Spinner durante validación
     * Label: "Validar CSV"

   - **Validation Results:**
     * Renderizar `<ImportValidationResults>`
     * Solo mostrar si hay resultados

   - **Error Display:**
     * Background rojo claro
     * Icono AlertCircle
     * Mensaje de error

4. **Footer:**
   - Botón "Cancelar" (siempre visible)
   - Botón "Importar X Pacientes" (solo si valid === true)
     * Disabled si hay errores
     * Spinner durante importación
     * Auto-cerrar 2s después de éxito

**Estados:**
```typescript
const [activeTab, setActiveTab] = useState<'file' | 'url'>('file');
const [selectedFile, setSelectedFile] = useState<File | null>(null);
const [googleSheetsURL, setGoogleSheetsURL] = useState('');
const [importDate, setImportDate] = useState(today);
const [validation, setValidation] = useState<ImportValidationResult | null>(null);
const [isValidating, setIsValidating] = useState(false);
const [isImporting, setIsImporting] = useState(false);
const [importComplete, setImportComplete] = useState(false);
const [importResult, setImportResult] = useState(null);
const [error, setError] = useState<string | null>(null);
```

**Handlers:**
- `handleFileSelect`: Validar tipo .csv
- `handleFileDrop`: Drag & drop handler
- `handleValidate`: Llamar parser → validation service
- `handleImport`: Llamar processImport → onImportComplete → auto-close

---

### Fase 4: Integración en WardRounds

**Archivo:** `src/WardRounds.tsx`

**Cambios específicos:**

1. **Línea ~100** (State declarations):
```typescript
const [showCSVImportModal, setShowCSVImportModal] = useState(false);
```

2. **Línea ~1804** (Botón de importación - ANTES del botón Export PDF):
```typescript
<button
  onClick={() => setShowCSVImportModal(true)}
  className="flex items-center space-x-2 px-3 py-2 rounded btn-soft text-sm"
>
  <Upload className="h-4 w-4" />
  <span>Importar CSV</span>
</button>
```

3. **Imports** (inicio del archivo):
```typescript
import { Upload } from 'lucide-react'; // Agregar a imports existentes
import CSVImportModal from './components/wardRounds/CSVImportModal';
```

4. **Final del componente** (antes del return final):
```typescript
{showCSVImportModal && (
  <CSVImportModal
    isOpen={showCSVImportModal}
    onClose={() => setShowCSVImportModal(false)}
    onImportComplete={loadPatients}
    hospitalContext="Posadas"
  />
)}
```

---

## Validaciones Implementadas

### Validación de Campos
- ✅ **CAMA** (requerido): Error si vacío
- ✅ **DNI** (requerido): Error si vacío, usado para detectar duplicados
- ✅ **NOMBRE** (requerido): Error si vacío
- ⚠️ **EDAD** (opcional): Warning si vacío
- ✅ **SEVERIDAD**: Error si no es I, II, III, IV, V o vacío

### Validación de DNI Duplicado
- Query a `ward_round_patients` filtrando por DNI
- Si existe → marcar como UPDATE
- Si no existe → marcar como INSERT
- Summary muestra count de nuevos vs updates

### Validación de CSV
- PapaParse reporta errores de parsing
- Verificar tipo de archivo (.csv)
- Verificar estructura (columnas correctas)

---

## Lógica de Update vs Insert

### UPDATE (DNI existe):
1. Query paciente actual por ID
2. **Merge strategy:**
   - **Campos CSV**: Sobrescribir con valores del CSV
   - **Campos NO-CSV**: Preservar valores existentes
     * `pendientes`
     * `image_thumbnail_url`, `image_full_url`, `exa_url`
     * `assigned_resident_id`
     * `display_order`
3. UPDATE con `robustQuery` (timeout: 10s, retries: 2)

### INSERT (DNI nuevo):
1. **Campos CSV**: Valores del CSV
2. **Campos NO-CSV**: Defaults
   - `pendientes`: ''
   - Images: `[]`
   - `assigned_resident_id`: null
   - `display_order`: null (auto-asignado por DB)
3. INSERT con `robustQuery` (timeout: 10s, retries: 2)

### Manejo de Hospital Context
- Siempre usar `hospital_context` del usuario actual
- Nunca permitir que CSV override el contexto
- En esta implementación: hardcoded a "Posadas"
  (futuro: usar context selector si hay privilegios)

---

## Manejo de Errores

### Errores de Parser
- Mostrar mensaje: "Errores al parsear CSV: {detalles}"
- No permitir continuar hasta corregir

### Errores de Validación
- Listar fila por fila con campo y mensaje
- Deshabilitar botón "Importar" si hay errores
- Warnings no bloquean importación

### Errores de Importación
- Tracking row-by-row de éxitos y fallos
- Mostrar count de importados vs fallidos
- Listar errores específicos con fila y mensaje
- Importación parcial permitida (algunos pueden fallar)

### Timeouts y Retries
- Queries con `robustQuery`:
  - Read (DNI check): 5s timeout, 1 retry
  - Write (INSERT/UPDATE): 10s timeout, 2 retries
- Delay 100ms entre operaciones para no sobrecargar DB

### Google Sheets
- CORS puede causar problemas
- Error handling para URLs inválidas
- Verificar que documento sea público

---

## Consideraciones de Seguridad

1. **Validación de Input:**
   - Whitelist de valores severidad
   - Trim de whitespace
   - Escape automático por Supabase parameterized queries

2. **RLS Policies:**
   - Hospital context enforcement a nivel DB
   - Usuario solo ve/edita su contexto

3. **Google Sheets:**
   - Solo public o "anyone with link"
   - Client-side fetch (sin credenciales)

---

## Testing Checklist

### Casos de Prueba Críticos

**1. File Upload:**
- ✅ CSV válido con todos los campos
- ✅ CSV con campos opcionales vacíos
- ✅ CSV con severidad inválida → error
- ✅ CSV con DNI duplicado → update
- ✅ CSV con campos requeridos vacíos → error
- ✅ Archivo no-CSV → rechazo
- ✅ CSV grande (50+ pacientes)

**2. Google Sheets:**
- ✅ URL pública válida
- ✅ URL privada → error CORS
- ✅ URL inválida → error parsing

**3. Validación:**
- ✅ DNI existente detectado como update
- ✅ DNI nuevo detectado como insert
- ✅ Campos requeridos validados
- ✅ Severidad validada

**4. Importación:**
- ✅ INSERT de pacientes nuevos
- ✅ UPDATE preservando pendientes
- ✅ UPDATE preservando imágenes
- ✅ Merge correcto de campos
- ✅ Hospital context correcto

**5. Edge Cases:**
- ✅ CSV vacío
- ✅ CSV solo con headers
- ✅ Multiline text en celdas
- ✅ Caracteres especiales
- ✅ Timeout durante import → retry

---

## Archivos Críticos

### Nuevos
1. `src/utils/csvParser.ts` - Parser con PapaParse
2. `src/services/wardRoundsImportService.ts` - Validación y procesamiento
3. `src/components/wardRounds/ImportValidationResults.tsx` - UI de resultados
4. `src/components/wardRounds/CSVImportModal.tsx` - Modal principal

### Modificar
1. `src/WardRounds.tsx` - Integración del botón y modal
2. `package.json` - Dependencia papaparse

### Referencia (no modificar)
1. `src/services/interconsultasService.ts` - Patrón robustQuery
2. `src/utils/supabase.js` - Cliente configurado
3. `database/setup_ward_round_patients.sql` - Schema reference

---

## Notas de Implementación

### Patrones del Codebase a Seguir

1. **Service Layer:**
   - Todas las llamadas Supabase en archivos `src/services/`
   - Usar `robustQuery` para timeout protection
   - Retornar `{ data, error }` o `{ success, data, error }`
   - Console logging: `[ServiceName] operationName -> mensaje`

2. **Componentes:**
   - Funcional components con TypeScript
   - CSS variables: `var(--text-primary)`, `var(--bg-secondary)`
   - Dark mode ya soportado globalmente
   - Modales: `.modal-overlay` y `.modal-content`
   - useEscapeKey hook para cerrar con Esc

3. **Error Handling:**
   - Try/catch en service layer
   - Mensajes user-friendly en UI
   - Console.error con prefijos descriptivos

4. **Performance:**
   - Client-side parsing (no server round-trip)
   - Delay entre operaciones DB (100ms)
   - robustQuery timeout protection
   - Batch operations posibles (futuro enhancement)

---

## Mejoras Futuras (Fuera de Scope)

- [ ] Import history tracking
- [ ] Rollback capability
- [ ] Template CSV download
- [ ] Excel (.xlsx) support
- [ ] Scheduled auto-imports
- [ ] Email notifications
- [ ] Multi-context support (Posadas + Julian)

---

## Resultado Esperado

Al completar esta implementación, los residentes podrán:

1. ✅ Exportar pase de sala de Google Sheets como CSV
2. ✅ Subir CSV desde archivo local o URL pública
3. ✅ Ver validación inmediata con errores/warnings
4. ✅ Importar con un clic
5. ✅ Ver pacientes nuevos insertados
6. ✅ Ver pacientes existentes actualizados (por DNI)
7. ✅ Preservar datos críticos (pendientes, imágenes, asignaciones)
8. ✅ Evitar trabajo duplicado entre Excel y sistema

**Tiempo estimado de implementación:** 2-3 días
- Día 1: Utils + Service layer
- Día 2: UI Components + Integration
- Día 3: Testing + Refinement
