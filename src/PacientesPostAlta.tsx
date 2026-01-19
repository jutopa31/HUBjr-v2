import React, { useEffect, useMemo, useState } from 'react';
import { Download, Plus, Users, RefreshCw } from 'lucide-react';
import { listPacientesPostAltaMonth, deletePacientePostAlta, PacientePostAltaRow } from './services/pacientesPostAltaService';
import { useAuthContext } from './components/auth/AuthProvider';
import CalendarView from './components/postAlta/CalendarView';
import PatientCard from './components/postAlta/PatientCard';
import PatientDetailModal from './components/postAlta/PatientDetailModal';
import CreatePatientForm from './components/postAlta/CreatePatientForm';

interface PacientesPostAltaProps {
  onGoToEvolucionador?: (patient: PacientePostAltaRow) => void;
}

const PacientesPostAlta: React.FC<PacientesPostAltaProps> = ({ onGoToEvolucionador }) => {
  const { user } = useAuthContext();

  // State
  const [allPatients, setAllPatients] = useState<PacientePostAltaRow[]>([]);
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [filteredPatients, setFilteredPatients] = useState<PacientePostAltaRow[]>([]);
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load patients for current month whenever month/year changes
  useEffect(() => {
    fetchMonthPatients(selectedDate);
  }, [selectedDate.getMonth(), selectedDate.getFullYear()]);

  // Section accent for readability
  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.body.dataset.section = 'patients';
    }
    return () => {
      if (typeof document !== 'undefined') {
        delete (document.body as any).dataset.section;
      }
    };
  }, []);

  // Filter patients by selected date
  useEffect(() => {
    const dateString = selectedDate.toISOString().split('T')[0];
    const filtered = allPatients.filter(p => p.fecha_visita === dateString);
    setFilteredPatients(filtered);
  }, [selectedDate, allPatients]);

  // Calculate patient counts by date for calendar badges
  const patientCountByDate = useMemo(() => {
    const counts: Record<string, number> = {};
    allPatients.forEach(p => {
      counts[p.fecha_visita] = (counts[p.fecha_visita] || 0) + 1;
    });
    return counts;
  }, [allPatients]);

  const fetchMonthPatients = async (date: Date) => {
    setLoading(true);
    setError(null);
    console.log('[PacientesPostAlta] fetchMonthPatients -> year:', date.getFullYear(), 'month:', date.getMonth());

    const res = await listPacientesPostAltaMonth(date.getFullYear(), date.getMonth());

    if (res.error) {
      console.error('[PacientesPostAlta] fetchMonthPatients error:', res.error);
      setError(res.error);
    }

    console.log('[PacientesPostAlta] fetchMonthPatients -> rows:', (res.data || []).length);
    setAllPatients(res.data || []);
    setLoading(false);
  };

  const handleCreatePatient = (patient: PacientePostAltaRow) => {
    // If patient's month matches current calendar month, add to allPatients
    const patientDate = new Date(patient.fecha_visita);
    if (patientDate.getMonth() === selectedDate.getMonth() &&
        patientDate.getFullYear() === selectedDate.getFullYear()) {
      setAllPatients(prev => [...prev, patient]);
    }
  };

  const handleUpdatePatient = (updated: PacientePostAltaRow) => {
    setAllPatients(prev => prev.map(p => (p.id === updated.id ? updated : p)));

    // If date was changed and patient moved to different month, remove from current view
    if (updated.fecha_visita) {
      const updatedDate = new Date(updated.fecha_visita);
      if (updatedDate.getMonth() !== selectedDate.getMonth() ||
          updatedDate.getFullYear() !== selectedDate.getFullYear()) {
        setAllPatients(prev => prev.filter(p => p.id !== updated.id));
      }
    }
  };

  const handleDeletePatient = async (patientId: string) => {
    const result = await deletePacientePostAlta(patientId);
    if (result.success) {
      setAllPatients(prev => prev.filter(p => p.id !== patientId));
      setSelectedPatientId(null); // Close modal if open
    } else {
      setError(result.error || 'Error al eliminar paciente');
    }
    return result;
  };

  const exportCSV = () => {
    const header = ['Fecha Visita', 'DNI', 'Nombre', 'Teléfono', 'Diagnóstico', 'Pendiente', 'Notas Evolución'];
    const data = filteredPatients.map(r => [
      r.fecha_visita,
      r.dni,
      r.nombre,
      r.telefono || '',
      r.diagnostico,
      (r.pendiente || '').replace(/\n/g, ' '),
      (r.notas_evolucion || '').replace(/\n/g, ' ')
    ]);
    const csv = [header, ...data]
      .map(cols => cols.map(c => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    const monthName = selectedDate.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
    a.href = url;
    a.download = `pacientes-post-alta-${monthName}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const selectedPatient = selectedPatientId
    ? allPatients.find(p => p.id === selectedPatientId)
    : null;

  const formattedSelectedDate = selectedDate.toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });

  return (
    <div className="max-w-7xl mx-auto">
      {/* Header Principal - Estilo Ward Rounds */}
      <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-900 rounded-lg px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700 mb-4">
        <div className="flex items-center gap-3">
          {/* Icono circular con sombra */}
          <div className="rounded-full bg-white dark:bg-gray-800 p-1.5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
            <Users className="h-5 w-5 text-blue-700 dark:text-blue-400" />
          </div>

          {/* Título y subtítulo */}
          <div>
            <h1 className="text-xl font-semibold text-[var(--text-primary)]">Post alta</h1>
            <p className="text-xs text-[var(--text-secondary)] hidden sm:block">
              {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''} para el {formattedSelectedDate}
            </p>
          </div>
        </div>

        {/* Botones de acción */}
        <div className="flex items-center gap-2 flex-wrap justify-end">
          <button
            onClick={() => fetchMonthPatients(selectedDate)}
            className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
            title="Actualizar datos"
          >
            <RefreshCw className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Actualizar</span>
          </button>
          <button
            onClick={exportCSV}
            className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
            title="Exportar CSV"
          >
            <Download className="h-3.5 w-3.5" />
            <span className="hidden md:inline">CSV</span>
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-2.5 py-1.5 text-xs btn-accent rounded inline-flex items-center gap-1.5"
            title="Nuevo paciente"
          >
            <Plus className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nuevo</span>
          </button>
        </div>
      </div>

      {/* Auth Warning */}
      {!user && (
        <div className="mb-4 p-3 rounded bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-200 text-sm">
          Debes iniciar sesión para crear o modificar pacientes post alta.
        </div>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm">
          {error}
        </div>
      )}

      {/* Create Patient Form (Collapsible) */}
      {showCreateForm && (
        <CreatePatientForm
          isOpen={showCreateForm}
          onToggle={() => setShowCreateForm(!showCreateForm)}
          onCreate={handleCreatePatient}
        />
      )}

      {/* Main Content: Two-Panel Layout */}
      <div className="flex flex-col lg:flex-row gap-6">
        {/* Left Panel: Calendar */}
        <div className="lg:w-1/3">
          <CalendarView
            selectedDate={selectedDate}
            onDateSelect={setSelectedDate}
            patientCountByDate={patientCountByDate}
          />
        </div>

        {/* Right Panel: Patient Cards */}
        <div className="lg:w-2/3">
          {loading ? (
            <div className="medical-card p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">Cargando pacientes...</p>
            </div>
          ) : filteredPatients.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filteredPatients.map((patient) => (
                <PatientCard
                  key={patient.id}
                  patient={patient}
                  onClick={() => setSelectedPatientId(patient.id || null)}
                  onGoToEvolucionador={onGoToEvolucionador}
                />
              ))}
            </div>
          ) : (
            <div className="medical-card p-12 text-center">
              <p className="text-gray-500 dark:text-gray-400">
                No hay pacientes programados para el {formattedSelectedDate}.
              </p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="mt-4 btn-accent px-4 py-2 rounded inline-flex items-center gap-2"
              >
                <Plus className="h-4 w-4" />
                Agregar Paciente
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Patient Detail Modal */}
      {selectedPatient && (
        <PatientDetailModal
          patient={selectedPatient}
          onClose={() => setSelectedPatientId(null)}
          onUpdate={handleUpdatePatient}
          onDelete={handleDeletePatient}
          onGoToEvolucionador={onGoToEvolucionador}
        />
      )}
    </div>
  );
};

export default PacientesPostAlta;
