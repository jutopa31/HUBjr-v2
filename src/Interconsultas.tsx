import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Download } from 'lucide-react';
import { createInterconsulta, listInterconsultas, updateRespuesta } from './services/interconsultasService';
import { saveToSavedPatients, saveToWardRounds } from './utils/interconsultasUtils';
import { useAuthContext } from './components/auth/AuthProvider';

type Row = {
  id?: string;
  nombre: string;
  dni: string;
  cama: string;
  fecha_interconsulta: string; // YYYY-MM-DD
  respuesta?: string | null;
  created_at?: string;
};

const required = (v: string) => v && v.trim().length > 0;

const Interconsultas: React.FC = () => {
  const { user } = useAuthContext();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [savingPaseId, setSavingPaseId] = useState<string | null>(null);
  const [savingPacientesId, setSavingPacientesId] = useState<string | null>(null);

  const [form, setForm] = useState<Row>({ nombre: '', dni: '', cama: '', fecha_interconsulta: new Date().toISOString().slice(0, 10), respuesta: '' });
  const isValid = useMemo(() => (
    required(form.nombre) && required(form.dni) && required(form.cama) && required(form.fecha_interconsulta)
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

  const handleCreate = async () => {
    if (!user) {
      console.warn('[Interconsultas] handleCreate blocked: unauthenticated');
      setError('Debes iniciar sesión para agregar interconsultas');
      return;
    }
    if (!isValid) {
      setError('Completa los campos requeridos: nombre, DNI, cama y fecha');
      return;
    }
    setError(null);
    console.log('[Interconsultas] handleCreate -> payload:', form);
    const { success, error } = await createInterconsulta(form);
    if (!success) {
      console.error('[Interconsultas] handleCreate error:', error);
      setError(error || 'Error al crear interconsulta');
      return;
    }
    setForm({ nombre: '', dni: '', cama: '', fecha_interconsulta: new Date().toISOString().slice(0, 10), respuesta: '' });
    fetchAll();
  };

  const handleUpdateRespuesta = async (id: string, respuesta: string) => {
    console.log('[Interconsultas] handleUpdateRespuesta -> id:', id);
    const { success, error } = await updateRespuesta(id, respuesta);
    if (!success) {
      console.error('[Interconsultas] handleUpdateRespuesta error:', error);
      setError(error || 'Error al guardar respuesta');
    } else {
      setError(null);
      fetchAll();
    }
  };

  const handleGuardarPase = async (row: Row) => {
    if (!user) {
      console.warn('[Interconsultas] handleGuardarPase blocked: unauthenticated');
      setError('Debes iniciar sesión para guardar en Pase de Sala');
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
      fecha_interconsulta: row.fecha_interconsulta,
      respuesta: row.respuesta || ''
    });

    setSavingPaseId(null);

    if (!success) {
      console.error('[Interconsultas] handleGuardarPase error:', error);
      setError(error || 'No se pudo guardar en Pase de Sala');
    } else {
      setError(null);
      const message = `✓ Paciente "${row.nombre}" guardado exitosamente en Pase de Sala`;
      setSuccessMessage(message);
      // Immediate visual feedback with browser alert
      window.alert(message);
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const handleGuardarPacientes = async (row: Row) => {
    if (!user) {
      console.warn('[Interconsultas] handleGuardarPacientes blocked: unauthenticated');
      setError('Debes iniciar sesión para guardar en Pacientes');
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
      fecha_interconsulta: row.fecha_interconsulta,
      respuesta: row.respuesta || ''
    });

    setSavingPacientesId(null);

    if (!success) {
      console.error('[Interconsultas] handleGuardarPacientes error:', error);
      setError(error || 'No se pudo guardar en Pacientes');
    } else {
      setError(null);
      const message = `✓ Paciente "${row.nombre}" guardado exitosamente en Pacientes Guardados`;
      setSuccessMessage(message);
      // Immediate visual feedback with browser alert
      window.alert(message);
      // Auto-dismiss success message after 3 seconds
      setTimeout(() => setSuccessMessage(null), 3000);
    }
  };

  const exportCSV = () => {
    const header = ['Nombre', 'DNI', 'Cama', 'Fecha', 'Respuesta'];
    const data = rows.map(r => [r.nombre, r.dni, r.cama, r.fecha_interconsulta, (r.respuesta || '').replace(/\n/g, ' ')]);
    const csv = [header, ...data].map(cols => cols.map(c => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'interconsultas.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Interconsultas</h1>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="px-3 py-2 text-sm bg-gray-100 border rounded">Actualizar</button>
          <button onClick={exportCSV} className="px-3 py-2 text-sm bg-white border rounded inline-flex items-center gap-2"><Download className="h-4 w-4"/>Exportar CSV</button>
        </div>
      </div>

      {!user && (
        <div className="mb-4 p-3 rounded border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
          Debes iniciar sesión para crear o guardar interconsultas.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
      )}

      {successMessage && (
        <div className="mb-4 p-3 rounded border border-green-200 bg-green-50 text-sm text-green-700">{successMessage}</div>
      )}

      {/* Formulario de nueva interconsulta */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <h2 className="font-medium mb-3">Nueva interconsulta</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="DNI"
            value={form.dni}
            onChange={(e) => setForm({ ...form, dni: e.target.value })}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Cama"
            value={form.cama}
            onChange={(e) => setForm({ ...form, cama: e.target.value })}
          />
          <input
            type="date"
            className="border rounded px-3 py-2 text-sm"
            value={form.fecha_interconsulta}
            onChange={(e) => setForm({ ...form, fecha_interconsulta: e.target.value })}
          />
        </div>
        <textarea
          className="mt-3 w-full border rounded px-3 py-2 text-sm"
          placeholder="Respuesta (opcional)"
          rows={3}
          value={form.respuesta ?? ''}
          onChange={(e) => setForm({ ...form, respuesta: e.target.value })}
        />
        <div className="mt-3 flex gap-2">
          <button
            onClick={handleCreate}
            disabled={!isValid || loading || !user}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded text-white ${isValid ? 'bg-blue-600 hover:bg-blue-700' : 'bg-gray-400'} `}
          >
            <Plus className="h-4 w-4"/>Agregar
          </button>
        </div>
      </div>

      {/* Listado */}
      <div className="bg-white rounded-lg border">
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="bg-gray-50 text-left">
                <th className="px-3 py-2">Fecha</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">DNI</th>
                <th className="px-3 py-2">Cama</th>
                <th className="px-3 py-2">Respuesta</th>
                <th className="px-3 py-2">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 text-gray-700">{r.fecha_interconsulta}</td>
                  <td className="px-3 py-2 font-medium">{r.nombre}</td>
                  <td className="px-3 py-2">{r.dni}</td>
                  <td className="px-3 py-2">{r.cama}</td>
                  <td className="px-3 py-2 w-[360px]">
                    <InlineRespuesta id={r.id!} initial={r.respuesta || ''} onSave={handleUpdateRespuesta} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap flex gap-2">
                    <button
                      onClick={() => handleGuardarPase(r)}
                      disabled={savingPaseId === r.id || !user}
                      className={`px-2 py-1 border rounded text-xs ${savingPaseId === r.id ? 'bg-blue-50 text-blue-600 border-blue-300' : 'hover:bg-gray-50'} disabled:opacity-50 disabled:cursor-not-allowed`}
                    >
                      {savingPaseId === r.id ? 'Guardando...' : 'Guardar al pase'}
                    </button>
                    <button
                      onClick={() => handleGuardarPacientes(r)}
                      disabled={savingPacientesId === r.id || !user}
                      className={`px-2 py-1 border rounded text-xs ${savingPacientesId === r.id ? 'bg-blue-50 text-blue-600 border-blue-300' : 'hover:bg-gray-50'} disabled:opacity-50 disabled:cursor-not-allowed`}
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
          <div className="p-6 text-sm text-gray-500">No hay interconsultas registradas.</div>
        )}
      </div>
    </div>
  );
};

const InlineRespuesta: React.FC<{ id: string; initial: string; onSave: (id: string, value: string) => void }>= ({ id, initial, onSave }) => {
  const [value, setValue] = useState(initial);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setValue(initial); setDirty(false); }, [initial]);
  return (
    <div className="flex items-center gap-2">
      <input
        className="border rounded px-2 py-1 w-full"
        placeholder="Escribe respuesta"
        value={value}
        onChange={(e) => { setValue(e.target.value); setDirty(true); }}
      />
      <button
        onClick={() => { onSave(id, value); setDirty(false); }}
        disabled={!dirty}
        className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs ${dirty ? 'bg-green-600 text-white' : 'bg-gray-200 text-gray-600'}`}
      >
        <Save className="h-3 w-3"/>Guardar
      </button>
    </div>
  );
};

export default Interconsultas;
