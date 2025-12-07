import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Download, ChevronUp } from 'lucide-react';
import { createInterconsulta, listInterconsultas, InterconsultaRow, InterconsultaFilters } from './services/interconsultasService';
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
        {/* Banner Header */}
        <div className="flex items-center justify-between mb-6 banner rounded-lg p-4">
          <h1 className="text-2xl font-bold">Interconsultas</h1>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="px-3 py-2 text-sm btn-soft rounded">
              Actualizar
            </button>
            <button onClick={exportCSV} className="px-3 py-2 text-sm btn-soft rounded inline-flex items-center gap-2">
              <Download className="h-4 w-4" />
              Exportar CSV
            </button>
            <button
              onClick={() => setShowCreateForm(!showCreateForm)}
              className="px-3 py-2 text-sm btn-accent rounded inline-flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Nueva Interconsulta
            </button>
          </div>
        </div>

        {!user && (
          <div className="mb-4 p-3 rounded medical-card text-sm">
            Debes iniciar sesión para crear o guardar interconsultas.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200 text-sm">
            {error}
          </div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-sm">
            {successMessage}
          </div>
        )}

        {/* Create Form (Collapsible) */}
        {showCreateForm && (
          <div className="medical-card p-4 mb-6">
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

        {/* Results count */}
        <div className="mb-4 text-sm text-gray-600 dark:text-gray-400">
          Mostrando {filteredRows.length} de {rows.length} interconsultas
        </div>

        {/* Card Grid */}
        {filteredRows.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {filteredRows.map((row) => (
              <InterconsultaCard
                key={row.id}
                interconsulta={row}
                onClick={() => setSelectedId(row.id || null)}
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
      </div>
    </LoadingWithRecovery>
  );
};

export default Interconsultas;
