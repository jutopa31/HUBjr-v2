import React, { useEffect, useMemo, useState } from 'react';
import { Download, Plus } from 'lucide-react';
import { listPacientesPostAltaMonth, PacientePostAltaRow } from './services/pacientesPostAltaService';
import { useAuthContext } from './components/auth/AuthProvider';
import CalendarView from './components/postAlta/CalendarView';
import PatientCard from './components/postAlta/PatientCard';
import PatientDetailModal from './components/postAlta/PatientDetailModal';
import CreatePatientForm from './components/postAlta/CreatePatientForm';

const PacientesPostAlta: React.FC = () => {
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
      {/* Banner Header */}
      <div className="flex items-center justify-between mb-6 banner rounded-lg p-4">
        <div>
          <h1 className="text-2xl font-bold">Post Alta + Ambulatorio</h1>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
            {filteredPatients.length} paciente{filteredPatients.length !== 1 ? 's' : ''} para el {formattedSelectedDate}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => fetchMonthPatients(selectedDate)}
            className="px-3 py-2 text-sm btn-soft rounded"
          >
            Actualizar
          </button>
          <button
            onClick={exportCSV}
            className="px-3 py-2 text-sm btn-soft rounded inline-flex items-center gap-2"
          >
            <Download className="h-4 w-4" />
            Exportar CSV
          </button>
          <button
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="px-3 py-2 text-sm btn-accent rounded inline-flex items-center gap-2"
          >
            <Plus className="h-4 w-4" />
            Nuevo Paciente
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
        />
      )}
    </div>
  );
};

export default PacientesPostAlta;
