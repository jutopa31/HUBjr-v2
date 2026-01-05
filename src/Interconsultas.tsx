import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Download, ChevronUp, Stethoscope, Trash2, CheckSquare } from 'lucide-react';
import { createInterconsulta, listInterconsultas, InterconsultaRow, InterconsultaFilters, deleteInterconsulta, deleteMultipleInterconsultas } from './services/interconsultasService';
import { useAuthContext } from './components/auth/AuthProvider';
import { LoadingWithRecovery } from './components/LoadingWithRecovery';
import InterconsultaCard from './components/interconsultas/InterconsultaCard';
import InterconsultaDetailModal from './components/interconsultas/InterconsultaDetailModal';
import InterconsultaFiltersComponent from './components/interconsultas/InterconsultaFilters';
import WardConfirmationModal from './components/interconsultas/WardConfirmationModal';
import { mapToWardRoundPatient, createWardPatientDirectly } from './services/workflowIntegrationService';
import { supabase } from './utils/supabase';

type Row = InterconsultaRow;

const required = (v: string) => v && v.trim().length > 0;
const buildDefaultForm = (): Omit<Row, 'status'> & { status?: string } => ({
  nombre: '',
  dni: '',
  cama: '',
  edad: '',
  relato_consulta: '',
  fecha_interconsulta: new Date().toISOString().slice(0, 10),
  respuesta: '',
  status: 'Pendiente'
});

interface InterconsultasProps {
  onGoToEvolucionador?: (interconsulta: InterconsultaRow) => void;
}

const Interconsultas: React.FC<InterconsultasProps> = ({ onGoToEvolucionador }) => {
  const { user } = useAuthContext();
  const today = new Date().toISOString().split('T')[0];
  const [rows, setRows] = useState<Row[]>([]);
  const [filteredRows, setFilteredRows] = useState<Row[]>([]);
  const [filters, setFilters] = useState<InterconsultaFilters>({
    dateFrom: today,
    dateTo: today,
  });
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Estados para selección múltiple y borrado
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleting, setDeleting] = useState(false);

  // Estados para Ward Confirmation Modal
  const [wardConfirmModalOpen, setWardConfirmModalOpen] = useState(false);
  const [wardInterconsulta, setWardInterconsulta] = useState<InterconsultaRow | null>(null);
  const [wardAssessment, setWardAssessment] = useState<any | null>(null);
  const [wardInitialData, setWardInitialData] = useState<any>(null);

  const [form, setForm] = useState(buildDefaultForm());
  const isValid = useMemo(() => (
    required(form.nombre)
    && required(form.dni)
    && required(form.cama)
    && required(form.edad || '')
    && required(form.fecha_interconsulta)
    && required(form.relato_consulta || '')
  ), [form]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    console.log('[Interconsultas] fetchAll -> start');
    const res = await listInterconsultas();
    if (res.error) {
      console.error('[Interconsultas] fetchAll error:', res.error);
      setError(res.error);
    }
    console.log('[Interconsultas] fetchAll -> rows:', (res.data || []).length);
    setRows(res.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

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

  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => setSuccessMessage(null), 2500);
      return () => clearTimeout(timer);
    }
  }, [successMessage]);

  // Client-side filtering
  useEffect(() => {
    let filtered = [...rows];

    // Filter by status
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(row => filters.status!.includes(row.status));
    }

    // Filter by search text (nombre or DNI)
    if (filters.searchText && filters.searchText.trim() !== '') {
      const searchLower = filters.searchText.toLowerCase();
      filtered = filtered.filter(
        row =>
          row.nombre.toLowerCase().includes(searchLower) ||
          row.dni.includes(searchLower)
      );
    }

    // Filter by date range
    if (filters.dateFrom) {
      filtered = filtered.filter(row => row.fecha_interconsulta >= filters.dateFrom!);
    }
    if (filters.dateTo) {
      filtered = filtered.filter(row => row.fecha_interconsulta <= filters.dateTo!);
    }

    setFilteredRows(filtered);
  }, [rows, filters]);

  // Calculate status counts for filter badges
  const statusCounts = useMemo(() => {
    const counts = {
      Pendiente: 0,
      'En Proceso': 0,
      Resuelta: 0,
      Cancelada: 0,
    };
    rows.forEach(row => {
      counts[row.status] = (counts[row.status] || 0) + 1;
    });
    return counts;
  }, [rows]);

  const handleCreate = async () => {
    if (!user) {
      console.warn('[Interconsultas] handleCreate blocked: unauthenticated');
      setError('Debes iniciar sesión para agregar interconsultas');
      return;
    }
    if (!isValid) {
      setError('Completa los campos requeridos: nombre, DNI, edad, cama, fecha y relato');
      return;
    }
    if (creating) {
      console.warn('[Interconsultas] handleCreate blocked: already creating');
      return;
    }
    setError(null);
    setCreating(true);
    console.log('[Interconsultas] handleCreate -> payload:', form);
    const optimisticId = `tmp-${Date.now()}`;
    const optimisticRow: Row = {
      ...form,
      id: optimisticId,
      created_at: new Date().toISOString(),
      status: 'Pendiente'
    } as Row;
    setRows(prev => [optimisticRow, ...prev]);

    const { success, error, data } = await createInterconsulta(form as any);
    setCreating(false);

    if (!success || !data) {
      console.error('[Interconsultas] handleCreate error:', error);
      setRows(prev => prev.filter(r => r.id !== optimisticId));
      setError(error || 'Error al crear interconsulta');
      return;
    }

    setRows(prev => [data, ...prev.filter(r => r.id !== optimisticId)]);
    setSuccessMessage('Interconsulta guardada');
    setForm(buildDefaultForm());
    setShowCreateForm(false);
  };

  const handleUpdateRow = (updated: InterconsultaRow) => {
    setRows(prev => prev.map(r => (r.id === updated.id ? updated : r)));
  };

  const exportCSV = () => {
    const header = ['Nombre', 'DNI', 'Cama', 'Fecha', 'Estado', 'Relato', 'Respuesta'];
    const data = filteredRows.map(r => [
      r.nombre,
      r.dni,
      r.cama,
      r.fecha_interconsulta,
      r.status,
      (r.relato_consulta || '').replace(/\n/g, ' '),
      (r.respuesta || '').replace(/\n/g, ' ')
    ]);
    const csv = [header, ...data].map(cols => cols.map(c => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'interconsultas.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  // Selección múltiple
  const handleToggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  const handleSelectAll = () => {
    if (selectedIds.size === filteredRows.length) {
      // Deseleccionar todas
      setSelectedIds(new Set());
    } else {
      // Seleccionar todas las filtradas
      setSelectedIds(new Set(filteredRows.map(r => r.id!)));
    }
  };

  // Borrado individual
  const handleDeleteSingle = async (id: string) => {
    if (!window.confirm('¿Estás seguro de que quieres eliminar esta interconsulta? Esta acción no se puede deshacer.')) {
      return;
    }

    setError(null);
    const { success, error } = await deleteInterconsulta(id);

    if (success) {
      setRows(prev => prev.filter(r => r.id !== id));
      setSuccessMessage('Interconsulta eliminada');
    } else {
      setError(error || 'Error al eliminar la interconsulta');
    }
  };

  // Borrado múltiple
  const handleDeleteMultiple = async () => {
    if (selectedIds.size === 0) {
      setError('No hay interconsultas seleccionadas');
      return;
    }

    setShowDeleteModal(true);
  };

  const confirmDeleteMultiple = async () => {
    setDeleting(true);
    setError(null);

    const idsArray = Array.from(selectedIds);
    const { success, error, deletedCount } = await deleteMultipleInterconsultas(idsArray);

    setDeleting(false);
    setShowDeleteModal(false);

    if (success) {
      setRows(prev => prev.filter(r => !selectedIds.has(r.id!)));
      setSelectedIds(new Set());
      setSuccessMessage(`${deletedCount} interconsulta(s) eliminada(s)`);
    } else {
      setError(error || 'Error al eliminar las interconsultas');
    }
  };

  // Abrir modal de confirmación Ward Rounds
  const handleSendToWardRounds = async (interconsulta: InterconsultaRow) => {
    setError(null);

    // Buscar assessment asociado a esta interconsulta
    const { data: assessment, error: assessmentError } = await supabase
      .from('diagnostic_assessments')
      .select('*')
      .eq('source_interconsulta_id', interconsulta.id)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (assessmentError || !assessment) {
      setError('No se encontró una evolución asociada a esta interconsulta. Primero debe evolucionar el paciente.');
      return;
    }

    // Mapear datos usando el servicio
    const mappedData = mapToWardRoundPatient(interconsulta, assessment);

    setWardInterconsulta(interconsulta);
    setWardAssessment(assessment);
    setWardInitialData(mappedData);
    setWardConfirmModalOpen(true);
  };

  // Confirmar y enviar a Ward Rounds
  const handleConfirmWardRounds = async (editedData: any) => {
    if (!wardAssessment) {
      setError('No se pudo obtener la evaluación asociada');
      return;
    }

    const result = await createWardPatientDirectly(editedData, wardAssessment.id);

    if (result.success) {
      setSuccessMessage('✓ Paciente enviado a Pase de Sala exitosamente');
      setWardConfirmModalOpen(false);

      // Limpiar estados
      setWardInterconsulta(null);
      setWardAssessment(null);
      setWardInitialData(null);
    } else {
      setError(`Error al enviar a Pase de Sala: ${result.error}`);
    }
  };

  const selectedInterconsulta = selectedId ? rows.find(r => r.id === selectedId) : null;

  return (
    <LoadingWithRecovery
      isLoading={loading}
      onRetry={() => {
        console.log('[Interconsultas] Manual retry triggered by user');
        fetchAll();
      }}
      loadingMessage="Cargando interconsultas..."
      recoveryTimeout={15000}
    >
      <div className="max-w-7xl mx-auto">
        {/* Compact Header with Gradient and Badges - Sticky on mobile */}
        <div className="sticky top-0 z-10 flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white dark:from-gray-900 dark:via-gray-900 dark:to-gray-900 rounded-lg px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-800 mb-3 backdrop-blur-sm bg-opacity-95">
          <div className="flex items-center gap-3">
            {/* Icono redondeado con sombra */}
            <div className="rounded-full bg-white p-1.5 shadow-sm ring-1 ring-gray-200">
              <Stethoscope className="h-5 w-5 text-blue-700" />
            </div>

            {/* Título */}
            <div>
              <h1 className="text-xl font-semibold text-[var(--text-primary)]">Interconsultas</h1>
            </div>

            {/* Badges de estadísticas */}
            <div className="hidden md:flex items-center gap-2 ml-4">
              <span className="text-xs px-2 py-1 bg-white rounded-full ring-1 ring-gray-200 text-[var(--text-secondary)]">
                {rows.length} total
              </span>
              <span className="text-xs px-2 py-1 bg-amber-50 rounded-full ring-1 ring-amber-100 text-amber-800">
                {statusCounts.Pendiente} Pendiente
              </span>
              <span className="text-xs px-2 py-1 bg-blue-50 rounded-full ring-1 ring-blue-100 text-blue-800">
                {statusCounts['En Proceso']} En Proceso
              </span>
              <span className="text-xs px-2 py-1 bg-emerald-50 rounded-full ring-1 ring-emerald-100 text-emerald-800">
                {statusCounts.Resuelta} Resuelta
              </span>
              <span className="text-xs px-2 py-1 bg-gray-50 rounded-full ring-1 ring-gray-100 text-gray-800">
                {statusCounts.Cancelada} Cancelada
              </span>

              {/* Indicador de filtro del día actual */}
              {filters.dateFrom === filters.dateTo && filters.dateFrom === today && (
                <span className="text-xs px-2.5 py-1 bg-blue-100 dark:bg-blue-900 rounded-full ring-1 ring-blue-200 dark:ring-blue-700 text-blue-800 dark:text-blue-200 font-medium">
                  📅 Solo hoy
                </span>
              )}
            </div>
          </div>

          {/* Botones secundarios a la derecha - Responsive: solo iconos en mobile */}
          <div className="flex gap-2">
            <button
              onClick={fetchAll}
              className="px-2.5 py-1.5 text-xs btn-soft rounded"
              title="Actualizar"
            >
              <span className="hidden sm:inline">Actualizar</span>
              <span className="sm:hidden">🔄</span>
            </button>
            <button
              onClick={exportCSV}
              className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
              title="Exportar CSV"
            >
              <Download className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Exportar CSV</span>
            </button>

            {/* Botón de seleccionar todas */}
            {filteredRows.length > 0 && (
              <button
                onClick={handleSelectAll}
                className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5"
                title={selectedIds.size === filteredRows.length ? 'Deseleccionar todas' : 'Seleccionar todas'}
              >
                <CheckSquare className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">
                  {selectedIds.size === filteredRows.length ? 'Deseleccionar' : 'Seleccionar'}
                </span>
              </button>
            )}

            {/* Botón de borrado múltiple */}
            {selectedIds.size > 0 && (
              <button
                onClick={handleDeleteMultiple}
                className="px-2.5 py-1.5 text-xs rounded inline-flex items-center gap-1.5 bg-red-100 text-red-700 hover:bg-red-200 dark:bg-red-900 dark:text-red-200 dark:hover:bg-red-800"
              >
                <Trash2 className="h-3.5 w-3.5" />
                Eliminar ({selectedIds.size})
              </button>
            )}
          </div>
        </div>

        {!user && (
          <div className="mb-2 p-2 rounded medical-card text-xs">
            Debes iniciar sesión para crear o guardar interconsultas.
          </div>
        )}

        {error && (
          <div className="mb-2 p-2 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-xs">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-2 p-2 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs">
            {successMessage}
          </div>
        )}

        {/* Create Form (Collapsible) - Layout horizontal */}
        {showCreateForm && (
          <div className="medical-card p-3 mb-3">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-medium">Nueva interconsulta</h2>
              <button
                onClick={() => setShowCreateForm(false)}
                className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
              >
                <ChevronUp className="h-5 w-5" />
              </button>
            </div>

            {/* Grid horizontal: Datos (izquierda) + Relato (derecha) */}
            <div className="grid md:grid-cols-5 gap-4">
              {/* Columna izquierda: 2/5 (40%) - Inputs apilados verticalmente */}
              <div className="md:col-span-2 space-y-3">
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Nombre *
                  </label>
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                    placeholder="Nombre del paciente"
                    value={form.nombre}
                    onChange={(e) => setForm({ ...form, nombre: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    DNI *
                  </label>
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                    placeholder="DNI"
                    value={form.dni}
                    onChange={(e) => setForm({ ...form, dni: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Edad *
                  </label>
                  <input
                    type="number"
                    className="w-full border rounded px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                    placeholder="Edad en años"
                    min="0"
                    max="150"
                    value={form.edad}
                    onChange={(e) => setForm({ ...form, edad: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Cama *
                  </label>
                  <input
                    className="w-full border rounded px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                    placeholder="Cama"
                    value={form.cama}
                    onChange={(e) => setForm({ ...form, cama: e.target.value })}
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                    Fecha *
                  </label>
                  <input
                    type="date"
                    className="w-full border rounded px-3 py-2 text-sm"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                    value={form.fecha_interconsulta}
                    onChange={(e) => setForm({ ...form, fecha_interconsulta: e.target.value })}
                  />
                </div>
              </div>

              {/* Columna derecha: 3/5 (60%) - Textarea del relato */}
              <div className="md:col-span-3">
                <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                  Relato o motivo de la consulta *
                </label>
                <textarea
                  className="w-full border rounded px-3 py-2 text-sm resize-none"
                  style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                  placeholder="Relato o motivo de la consulta"
                  rows={8}
                  value={form.relato_consulta ?? ''}
                  onChange={(e) => setForm({ ...form, relato_consulta: e.target.value })}
                />
              </div>
            </div>

            {/* Botones debajo del grid */}
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!isValid || loading || creating || !user}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded ${(isValid && !creating) ? 'btn-accent' : 'btn-soft'} disabled:cursor-not-allowed`}
              >
                <Plus className="h-4 w-4" />{creating ? 'Guardando...' : 'Guardar'}
              </button>
              <button
                onClick={() => setShowCreateForm(false)}
                className="px-4 py-2 rounded btn-soft"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}

        {/* Filters */}
        <InterconsultaFiltersComponent
          filters={filters}
          onFiltersChange={setFilters}
          statusCounts={statusCounts}
          onNewClick={() => setShowCreateForm(!showCreateForm)}
        />

        {/* Card Grid */}
        {filteredRows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRows.map((row) => (
              <InterconsultaCard
                key={row.id}
                interconsulta={row}
                onClick={() => setSelectedId(row.id || null)}
                isSelected={selectedIds.has(row.id!)}
                onToggleSelection={handleToggleSelection}
                onDelete={handleDeleteSingle}
                onGoToEvolucionador={onGoToEvolucionador}
                onSendToWardRounds={handleSendToWardRounds}
              />
            ))}
          </div>
        ) : (
          <div className="medical-card p-12 text-center">
            <p className="text-gray-500 dark:text-gray-500">
              {filters.searchText || filters.status?.length || filters.dateFrom || filters.dateTo
                ? 'No se encontraron interconsultas con los filtros aplicados.'
                : 'No hay interconsultas registradas.'}
            </p>
          </div>
        )}

        {/* Detail Modal */}
        {selectedInterconsulta && (
          <InterconsultaDetailModal
            interconsulta={selectedInterconsulta}
            onClose={() => setSelectedId(null)}
            onUpdate={handleUpdateRow}
            onGoToEvolucionador={onGoToEvolucionador}
          />
        )}

        {/* Modal de confirmación de borrado múltiple */}
        {showDeleteModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="medical-card max-w-md w-full p-6 rounded-lg">
              <h2 className="text-xl font-semibold mb-4 text-red-700 dark:text-red-400">
                Confirmar Eliminación
              </h2>
              <p className="mb-4 text-gray-700 dark:text-gray-300">
                ¿Estás seguro de que quieres eliminar <strong>{selectedIds.size}</strong> interconsulta(s)?
                Esta acción no se puede deshacer.
              </p>

              {/* Lista de interconsultas a borrar */}
              <div className="mb-4 max-h-48 overflow-y-auto border rounded p-2 bg-gray-50 dark:bg-gray-800">
                {Array.from(selectedIds).map(id => {
                  const consulta = rows.find(r => r.id === id);
                  return consulta ? (
                    <div key={id} className="text-sm py-1 text-gray-700 dark:text-gray-300">
                      • {consulta.nombre} - DNI: {consulta.dni}
                    </div>
                  ) : null;
                })}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={confirmDeleteMultiple}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  {deleting ? 'Eliminando...' : 'Eliminar'}
                </button>
                <button
                  onClick={() => setShowDeleteModal(false)}
                  disabled={deleting}
                  className="flex-1 px-4 py-2 btn-soft rounded"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Modal de confirmación Ward Rounds */}
        {wardConfirmModalOpen && wardInitialData && wardInterconsulta && (
          <WardConfirmationModal
            isOpen={wardConfirmModalOpen}
            onClose={() => {
              setWardConfirmModalOpen(false);
              setWardInterconsulta(null);
              setWardAssessment(null);
              setWardInitialData(null);
            }}
            onConfirm={handleConfirmWardRounds}
            initialData={wardInitialData}
            interconsultaName={`${wardInterconsulta.nombre} (DNI: ${wardInterconsulta.dni})`}
          />
        )}
      </div>
    </LoadingWithRecovery>
  );
};

export default Interconsultas;
