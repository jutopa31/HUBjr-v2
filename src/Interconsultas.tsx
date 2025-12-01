import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Download } from 'lucide-react';
import { createInterconsulta, listInterconsultas, updateRespuesta } from './services/interconsultasService';
import { saveToSavedPatients, saveToWardRounds } from './utils/interconsultasUtils';
import { useAuthContext } from './components/auth/AuthProvider';
import { LoadingWithRecovery } from './components/LoadingWithRecovery';

type Row = {
  id?: string;
  nombre: string;
  dni: string;
  cama: string;
  relato_consulta?: string | null;
  fecha_interconsulta: string; // YYYY-MM-DD
  respuesta?: string | null;
  created_at?: string;
};

const required = (v: string) => v && v.trim().length > 0;
const buildDefaultForm = (): Row => ({
  nombre: '',
  dni: '',
  cama: '',
  relato_consulta: '',
  fecha_interconsulta: new Date().toISOString().slice(0, 10),
  respuesta: ''
});

const Interconsultas: React.FC = () => {
  const { user } = useAuthContext();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingPaseId, setSavingPaseId] = useState<string | null>(null);
  const [savingPacientesId, setSavingPacientesId] = useState<string | null>(null);
  const [savingRespuestaId, setSavingRespuestaId] = useState<string | null>(null);

  const [form, setForm] = useState<Row>(buildDefaultForm());
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

  const handleCreate = async () => {
    if (!user) {
      console.warn('[Interconsultas] handleCreate blocked: unauthenticated');
      setError('Debes iniciar sesion para agregar interconsultas');
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
    const optimisticRow: Row = { ...form, id: optimisticId, created_at: new Date().toISOString() };
    setRows(prev => [optimisticRow, ...prev]);

    const { success, error, data } = await createInterconsulta(form);
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
  };

  const handleUpdateRespuesta = async (id: string, respuesta: string) => {
    console.log('[Interconsultas] handleUpdateRespuesta -> id:', id);
    const previousRespuesta = rows.find(r => r.id === id)?.respuesta || '';
    setSavingRespuestaId(id);
    setRows(prev => prev.map(r => r.id === id ? { ...r, respuesta } : r));

    const { success, error, data } = await updateRespuesta(id, respuesta);
    setSavingRespuestaId(null);

    if (!success) {
      console.error('[Interconsultas] handleUpdateRespuesta error:', error);
      setRows(prev => prev.map(r => r.id === id ? { ...r, respuesta: previousRespuesta } : r));
      setError(error || 'Error al guardar respuesta');
      return;
    }

    setError(null);
    setRows(prev => prev.map(r => r.id === id ? { ...r, respuesta: data?.respuesta ?? respuesta } : r));
    setSuccessMessage('Respuesta guardada');
  };

  const handleGuardarPase = async (row: Row) => {
    if (!user) {
      console.warn('[Interconsultas] handleGuardarPase blocked: unauthenticated');
      setError('Debes iniciar sesion para guardar en Pase de Sala');
      return;
    }
    if (!row.id) {
      setError('Error: ID de interconsulta no disponible');
      return;
    }

    setSavingPaseId(row.id);
    setError(null);
    setSuccessMessage(null);

    console.log('[Interconsultas] handleGuardarPase -> row:', row);
    const { success, error } = await saveToWardRounds({
      nombre: row.nombre,
      dni: row.dni,
      cama: row.cama,
      relato_consulta: row.relato_consulta || '',
      fecha_interconsulta: row.fecha_interconsulta,
      respuesta: row.respuesta || ''
    });

    setSavingPaseId(null);

    if (!success) {
      console.error('[Interconsultas] handleGuardarPase error:', error);
      setError(error || 'No se pudo guardar en Pase de Sala');
    } else {
      setError(null);
      const message = `Paciente "${row.nombre}" guardado exitosamente en Pase de Sala`;
      setSuccessMessage(message);
      window.alert(message);
    }
  };

  const handleGuardarPacientes = async (row: Row) => {
    if (!user) {
      console.warn('[Interconsultas] handleGuardarPacientes blocked: unauthenticated');
      setError('Debes iniciar sesion para guardar en Pacientes');
      return;
    }
    if (!row.id) {
      setError('Error: ID de interconsulta no disponible');
      return;
    }

    setSavingPacientesId(row.id);
    setError(null);
    setSuccessMessage(null);

    console.log('[Interconsultas] handleGuardarPacientes -> row:', row);
    const { success, error } = await saveToSavedPatients({
      nombre: row.nombre,
      dni: row.dni,
      cama: row.cama,
      relato_consulta: row.relato_consulta || '',
      fecha_interconsulta: row.fecha_interconsulta,
      respuesta: row.respuesta || ''
    });

    setSavingPacientesId(null);

    if (!success) {
      console.error('[Interconsultas] handleGuardarPacientes error:', error);
      setError(error || 'No se pudo guardar en Pacientes');
    } else {
      setError(null);
      const message = `Paciente "${row.nombre}" guardado exitosamente en la base de pacientes`;
      setSuccessMessage(message);
      window.alert(message);
    }
  };

  const exportCSV = () => {
    const header = ['Nombre', 'DNI', 'Cama', 'Fecha', 'Relato', 'Respuesta'];
    const data = rows.map(r => [
      r.nombre,
      r.dni,
      r.cama,
      r.fecha_interconsulta,
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
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6 banner rounded-lg p-4">
          <h1 className="text-2xl font-bold">Interconsultas</h1>
          <div className="flex gap-2">
            <button onClick={fetchAll} className="px-3 py-2 text-sm btn-soft rounded">Actualizar</button>
            <button onClick={exportCSV} className="px-3 py-2 text-sm btn-soft rounded inline-flex items-center gap-2"><Download className="h-4 w-4"/>Exportar CSV</button>
          </div>
        </div>

        {!user && (
          <div className="mb-4 p-3 rounded medical-card text-sm">
            Debes iniciar sesion para crear o guardar interconsultas.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 rounded medical-card text-sm">{error}</div>
        )}

        {successMessage && (
          <div className="mb-4 p-3 rounded medical-card text-sm">{successMessage}</div>
        )}

        <div className="medical-card p-4 mb-6">
          <h2 className="font-medium mb-3">Nueva interconsulta</h2>
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
              <Plus className="h-4 w-4"/>{creating ? 'Guardando...' : 'Agregar'}
            </button>
          </div>
        </div>

        <div className="medical-card">
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left">
                  <th className="px-3 py-2">Fecha</th>
                  <th className="px-3 py-2">Nombre</th>
                  <th className="px-3 py-2">DNI</th>
                  <th className="px-3 py-2">Cama</th>
                  <th className="px-3 py-2">Relato</th>
                  <th className="px-3 py-2">Respuesta</th>
                  <th className="px-3 py-2">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr key={r.id} className="border-t align-top">
                    <td className="px-3 py-2 text-gray-700">{r.fecha_interconsulta}</td>
                    <td className="px-3 py-2 font-medium">{r.nombre}</td>
                    <td className="px-3 py-2">{r.dni}</td>
                    <td className="px-3 py-2">{r.cama}</td>
                    <td className="px-3 py-2 w-[280px]">
                      <div className="text-gray-700 whitespace-pre-line leading-snug max-h-36 overflow-auto">{r.relato_consulta || '-'}</div>
                    </td>
                    <td className="px-3 py-2 w-[360px]">
                      <InlineRespuesta
                        initial={r.respuesta || ''}
                        onSave={(value) => handleUpdateRespuesta(r.id!, value)}
                        isSaving={savingRespuestaId === r.id}
                      />
                    </td>
                    <td className="px-3 py-2 whitespace-nowrap flex gap-2">
                      <button
                        onClick={() => handleGuardarPase(r)}
                        disabled={savingPaseId === r.id || !user}
                        className={`px-2 py-1 rounded text-xs ${savingPaseId === r.id ? 'btn-accent' : 'btn-soft'} disabled:cursor-not-allowed`}
                      >
                        {savingPaseId === r.id ? 'Guardando...' : 'Guardar al pase'}
                      </button>
                      <button
                        onClick={() => handleGuardarPacientes(r)}
                        disabled={savingPacientesId === r.id || !user}
                        className={`px-2 py-1 rounded text-xs ${savingPacientesId === r.id ? 'btn-accent' : 'btn-soft'} disabled:cursor-not-allowed`}
                      >
                        {savingPacientesId === r.id ? 'Guardando...' : 'Guardar en pacientes'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {rows.length === 0 && (
            <div className="p-6 text-sm" style={{ color: 'var(--text-tertiary)' }}>No hay interconsultas registradas.</div>
          )}
        </div>
      </div>
    </LoadingWithRecovery>
  );
};

const InlineRespuesta: React.FC<{ initial: string; onSave: (value: string) => Promise<void>; isSaving: boolean }> = ({ initial, onSave, isSaving }) => {
  const [value, setValue] = useState(initial);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setValue(initial); setDirty(false); }, [initial]);
  const handleSave = async () => {
    await onSave(value);
    setDirty(false);
  };
  return (
    <div className="flex flex-col gap-2">
      <textarea
        className="border rounded px-2 py-1 w-full text-sm"
        style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-primary)', borderColor: 'var(--border-primary)' }}
        placeholder="Escribe respuesta"
        rows={3}
        value={value}
        onChange={(e) => { setValue(e.target.value); setDirty(true); }}
      />
      <div className="flex justify-end">
        <button
          onClick={handleSave}
          disabled={!dirty || isSaving}
          className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${dirty ? 'btn-accent' : 'btn-soft'} disabled:cursor-not-allowed`}
        >
          <Save className="h-3 w-3"/>{isSaving ? 'Guardando...' : 'Guardar'}
        </button>
      </div>
    </div>
  );
};

export default Interconsultas;