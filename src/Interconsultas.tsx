import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Download, ChevronUp, Stethoscope, Trash2, CheckSquare } from 'lucide-react';
import { createInterconsulta, listInterconsultas, InterconsultaRow, InterconsultaFilters, deleteInterconsulta, deleteMultipleInterconsultas } from './services/interconsultasService';
import { useAuthContext } from './components/auth/AuthProvider';
import { LoadingWithRecovery } from './components/LoadingWithRecovery';
import InterconsultaCard from './components/interconsultas/InterconsultaCard';
import InterconsultaDetailModal from './components/interconsultas/InterconsultaDetailModal';
import InterconsultaFiltersComponent from './components/interconsultas/InterconsultaFilters';

type Row = InterconsultaRow;

const required = (v: string) => v && v.trim().length > 0;
const buildDefaultForm = (): Omit<Row, 'status'> & { status?: string } => ({
  nombre: '',
  dni: '',
  cama: '',
  relato_consulta: '',
  fecha_interconsulta: new Date().toISOString().slice(0, 10),
  respuesta: '',
  status: 'Pendiente'
});

const Interconsultas: React.FC = () => {
  const { user } = useAuthContext();
  const [rows, setRows] = useState<Row[]>([]);
  const [filteredRows, setFilteredRows] = useState<Row[]>([]);
  const [filters, setFilters] = useState<InterconsultaFilters>({});
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

  const [form, setForm] = useState(buildDefaultForm());
  const isValid = useMemo(() => (
    required(form.nombre)
    && required(form.dni)
    && required(form.cama)
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
      setError('Completa los campos requeridos: nombre, DNI, cama, fecha y relato');
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
        {/* Compact Header with Gradient and Badges */}
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white rounded-lg px-4 py-3 shadow-sm border border-gray-100 mb-3">
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
            </div>
          </div>

          <div className="flex gap-2">
            <button onClick={fetchAll} className="px-2.5 py-1.5 text-xs btn-soft rounded">
              Actualizar
            </button>
            <button onClick={exportCSV} className="px-2.5 py-1.5 text-xs btn-soft rounded inline-flex items-center gap-1.5">
              <Download className="h-3.5 w-3.5" />
              Exportar CSV
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

            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-2.5 py-1.5 text-xs btn-accent rounded inline-flex items-center gap-1.5"
            >
              <Plus className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">Nueva Interconsulta</span>
            </button>
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

        {/* Create Form (Collapsible) */}
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
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <input
                className="border rounded px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                placeholder="Nombre"
                value={form.nombre}
                onChange={(e) => setForm({ ...form, nombre: e.target.value })}
              />
              <input
                className="border rounded px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                placeholder="DNI"
                value={form.dni}
                onChange={(e) => setForm({ ...form, dni: e.target.value })}
              />
              <input
                className="border rounded px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                placeholder="Cama"
                value={form.cama}
                onChange={(e) => setForm({ ...form, cama: e.target.value })}
              />
              <input
                type="date"
                className="border rounded px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                value={form.fecha_interconsulta}
                onChange={(e) => setForm({ ...form, fecha_interconsulta: e.target.value })}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-3">
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                placeholder="Relato o motivo de la consulta"
                rows={4}
                value={form.relato_consulta ?? ''}
                onChange={(e) => setForm({ ...form, relato_consulta: e.target.value })}
              />
              <textarea
                className="w-full border rounded px-3 py-2 text-sm"
                style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
                placeholder="Respuesta inicial (opcional)"
                rows={4}
                value={form.respuesta ?? ''}
                onChange={(e) => setForm({ ...form, respuesta: e.target.value })}
              />
            </div>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleCreate}
                disabled={!isValid || loading || creating || !user}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded ${(isValid && !creating) ? 'btn-accent' : 'btn-soft'} disabled:cursor-not-allowed`}
              >
                <Plus className="h-4 w-4" />{creating ? 'Guardando...' : 'Agregar'}
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
      </div>
    </LoadingWithRecovery>
  );
};

export default Interconsultas;
