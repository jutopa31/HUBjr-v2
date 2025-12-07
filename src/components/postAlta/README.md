# Post-Alta Ambulatorio Components

Componentes UI para el sistema de seguimiento de pacientes Post-Alta Ambulatorio.

## Components Overview

### 1. CalendarView
Calendario mensual que muestra solo días laborables (lunes-viernes) con conteo de pacientes.

**Props:**
```typescript
interface CalendarViewProps {
  selectedDate: Date;
  onDateSelect: (date: Date) => void;
  patientCountByDate: Record<string, number>;  // { '2024-01-15': 3 }
}
```

**Features:**
- Grid de 5 columnas (solo lun-vie)
- Navegación prev/next month
- Badge numérico con cantidad de pacientes
- Highlight de fecha seleccionada (border blue-500)
- Highlight de hoy (bg-blue-50)
- Dark mode support

**Example:**
```tsx
<CalendarView
  selectedDate={selectedDate}
  onDateSelect={setSelectedDate}
  patientCountByDate={{ '2024-12-06': 3, '2024-12-07': 1 }}
/>
```

---

### 2. PatientCard
Card resumido de paciente con información clave.

**Props:**
```typescript
interface PatientCardProps {
  patient: PacientePostAltaRow;
  onClick: () => void;
}
```

**Features:**
- Nombre (bold) + DNI
- Diagnóstico (truncado a 60 chars)
- Fecha + Teléfono con iconos
- Indicadores: FileText (notas), AlertCircle (pendiente)
- Hover effects (border-blue-300 + shadow-md)
- "Ver detalles →" button

**Example:**
```tsx
<PatientCard
  patient={patient}
  onClick={() => setSelectedPatient(patient)}
/>
```

---

### 3. PatientDetailModal
Modal full-featured para ver y editar todos los campos del paciente.

**Props:**
```typescript
interface PatientDetailModalProps {
  patient: PacientePostAltaRow;
  onClose: () => void;
  onUpdate: (updated: PacientePostAltaRow) => void;
}
```

**Features:**
- 4 secciones: Personal Info, Medical Info, Follow-up, Actions
- Dirty state tracking (botón habilitado solo si hay cambios)
- Validación inline (DNI, nombre, diagnóstico, fecha required)
- Optimistic update via callback
- Loading state en botón
- Success/error messages
- Auto-close después de guardar exitosamente
- Timestamps (created_at, updated_at)
- Full-screen en mobile

**Example:**
```tsx
{selectedPatient && (
  <PatientDetailModal
    patient={selectedPatient}
    onClose={() => setSelectedPatient(null)}
    onUpdate={(updated) => {
      setPatients(prev => prev.map(p => p.id === updated.id ? updated : p));
    }}
  />
)}
```

---

### 4. CreatePatientForm
Form colapsable para crear nuevos pacientes.

**Props:**
```typescript
interface CreatePatientFormProps {
  isOpen: boolean;
  onToggle: () => void;
  onCreate: (patient: PacientePostAltaRow) => void;
}
```

**Features:**
- Collapsible con ChevronUp/ChevronDown icon
- Grid 2 columnas desktop, 1 mobile
- Campos required: DNI, Nombre, Diagnóstico, Fecha Visita
- Campos optional: Teléfono, Pendiente, Notas de Evolución
- Fecha default: hoy
- Validación inline
- Clear form after success
- Success/error messages
- Button accent cuando valid
- Auto-collapse después de crear

**Example:**
```tsx
<CreatePatientForm
  isOpen={isFormOpen}
  onToggle={() => setIsFormOpen(!isFormOpen)}
  onCreate={() => {
    // Refresh patient list
    loadPatientsForDate(selectedDate);
  }}
/>
```

---

## Integration Example

Ver `PostAltaAmbulatorioExample.tsx` para un ejemplo completo de integración.

**Key Integration Pattern:**

```tsx
const PostAltaPage = () => {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [patients, setPatients] = useState([]);
  const [patientCountByDate, setPatientCountByDate] = useState({});
  const [selectedPatient, setSelectedPatient] = useState(null);
  const [isFormOpen, setIsFormOpen] = useState(false);

  // Load patients for selected date
  useEffect(() => {
    const dateStr = selectedDate.toISOString().slice(0, 10);
    listPacientesPostAlta(dateStr).then(({ data }) => setPatients(data));
  }, [selectedDate]);

  // Load month data for calendar
  useEffect(() => {
    const year = selectedDate.getFullYear();
    const month = selectedDate.getMonth();
    listPacientesPostAltaMonth(year, month).then(({ data }) => {
      const countMap = {};
      data.forEach(p => {
        countMap[p.fecha_visita] = (countMap[p.fecha_visita] || 0) + 1;
      });
      setPatientCountByDate(countMap);
    });
  }, [selectedDate.getMonth(), selectedDate.getFullYear()]);

  return (
    <div>
      <CreatePatientForm ... />
      <CalendarView ... />
      <PatientCard ... />
      {selectedPatient && <PatientDetailModal ... />}
    </div>
  );
};
```

---

## Service Layer

Todos los componentes usan `pacientesPostAltaService.ts`:

```typescript
import {
  PacientePostAltaRow,
  listPacientesPostAlta,
  listPacientesPostAltaMonth,
  createPacientePostAlta,
  updatePacientePostAlta
} from '../../services/pacientesPostAltaService';
```

---

## Icons Used

From `lucide-react`:
- Calendar, Phone, FileText, AlertCircle (PatientCard)
- ChevronLeft, ChevronRight (CalendarView)
- X, Save (PatientDetailModal)
- ChevronUp, ChevronDown, Plus (CreatePatientForm)

---

## Styling

- CSS variables: `var(--bg-secondary)`, `var(--text-primary)`, `var(--border-primary)`
- Medical-card class: `medical-card` para backgrounds
- Dark mode: clases `dark:*` de Tailwind
- Responsive: breakpoints `md:`, `lg:`, `xl:`

---

## Next Steps

Para integrar estos componentes en `PacientesPostAlta.tsx`:

1. Import components: `import { CalendarView, PatientCard, PatientDetailModal, CreatePatientForm } from './components/postAlta'`
2. Replace current UI with new components
3. Implement state management según ejemplo
4. Test responsiveness y dark mode
5. Verify RLS policies en Supabase
