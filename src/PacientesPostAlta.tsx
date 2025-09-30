import React, { useEffect, useMemo, useState } from 'react';
import { Plus, Save, Download } from 'lucide-react';
import { createPacientePostAlta, listPacientesPostAlta, updatePendiente } from './services/pacientesPostAltaService';
import { useAuthContext } from './components/auth/AuthProvider';

type Row = {
  id?: string;
  dni: string;
  nombre: string;
  diagnostico: string;
  pendiente?: string | null;
  fecha_visita: string; // YYYY-MM-DD
  created_at?: string;
};

const required = (v: string) => v && v.trim().length > 0;

const PacientesPostAlta: React.FC = () => {
  const { user } = useAuthContext();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [form, setForm] = useState<Row>({
    dni: '',
    nombre: '',
    diagnostico: '',
    pendiente: '',
    fecha_visita: new Date().toISOString().slice(0, 10)
  });

  const isValid = useMemo(() => (
    required(form.dni) && required(form.nombre) && required(form.diagnostico) && required(form.fecha_visita)
  ), [form]);

  const fetchAll = async () => {
    setLoading(true);
    setError(null);
    console.log('[PacientesPostAlta] fetchAll -> start');
    const res = await listPacientesPostAlta();
    if (res.error) {
      console.error('[PacientesPostAlta] fetchAll error:', res.error);
      setError(res.error);
    }
    console.log('[PacientesPostAlta] fetchAll -> rows:', (res.data || []).length);
    setRows(res.data || []);
    setLoading(false);
  };

  useEffect(() => { fetchAll(); }, []);

  const handleCreate = async () => {
    if (!user) {
      console.warn('[PacientesPostAlta] handleCreate blocked: unauthenticated');
      setError('Debes iniciar sesión para agregar pacientes');
      return;
    }
    if (!isValid) {
      setError('Completa los campos requeridos: DNI, nombre, diagnóstico y fecha');
      return;
    }
    setError(null);
    console.log('[PacientesPostAlta] handleCreate -> payload:', form);
    const { success, error } = await createPacientePostAlta(form);
    if (!success) {
      console.error('[PacientesPostAlta] handleCreate error:', error);
      setError(error || 'Error al crear paciente post alta');
      return;
    }
    setForm({
      dni: '',
      nombre: '',
      diagnostico: '',
      pendiente: '',
      fecha_visita: new Date().toISOString().slice(0, 10)
    });
    fetchAll();
  };

  const handleUpdatePendiente = async (id: string, pendiente: string) => {
    console.log('[PacientesPostAlta] handleUpdatePendiente -> id:', id);
    const { success, error } = await updatePendiente(id, pendiente);
    if (!success) {
      console.error('[PacientesPostAlta] handleUpdatePendiente error:', error);
      setError(error || 'Error al guardar pendiente');
    } else {
      setError(null);
      fetchAll();
    }
  };

  const exportCSV = () => {
    const header = ['DNI', 'Nombre', 'Diagnóstico', 'Pendiente', 'Fecha Visita'];
    const data = rows.map(r => [r.dni, r.nombre, r.diagnostico, (r.pendiente || '').replace(/\n/g, ' '), r.fecha_visita]);
    const csv = [header, ...data].map(cols => cols.map(c => `"${(c ?? '').toString().replace(/"/g, '""')}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = 'pacientes_post_alta.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Post alta + Ambulatorio</h1>
          <p className="text-sm text-gray-600 mt-1">Pacientes programados para consulta hoy ({today})</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchAll} className="px-3 py-2 text-sm bg-gray-100 border rounded">Actualizar</button>
          <button onClick={exportCSV} className="px-3 py-2 text-sm bg-white border rounded inline-flex items-center gap-2">
            <Download className="h-4 w-4"/>Exportar CSV
          </button>
        </div>
      </div>

      {!user && (
        <div className="mb-4 p-3 rounded border border-yellow-200 bg-yellow-50 text-sm text-yellow-800">
          Debes iniciar sesión para crear o modificar pacientes post alta.
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 rounded border border-red-200 bg-red-50 text-sm text-red-700">{error}</div>
      )}

      {/* Formulario de nuevo paciente */}
      <div className="bg-white rounded-lg border p-4 mb-6">
        <h2 className="font-medium mb-3">Nuevo paciente ambulatorio</h2>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="DNI"
            value={form.dni}
            onChange={(e) => setForm({ ...form, dni: e.target.value })}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Nombre"
            value={form.nombre}
            onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          />
          <input
            className="border rounded px-3 py-2 text-sm"
            placeholder="Diagnóstico"
            value={form.diagnostico}
            onChange={(e) => setForm({ ...form, diagnostico: e.target.value })}
          />
          <input
            type="date"
            className="border rounded px-3 py-2 text-sm"
            value={form.fecha_visita}
            onChange={(e) => setForm({ ...form, fecha_visita: e.target.value })}
          />
        </div>
        <textarea
          className="mt-3 w-full border rounded px-3 py-2 text-sm"
          placeholder="Pendiente (opcional)"
          rows={3}
          value={form.pendiente ?? ''}
          onChange={(e) => setForm({ ...form, pendiente: e.target.value })}
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
                <th className="px-3 py-2">DNI</th>
                <th className="px-3 py-2">Nombre</th>
                <th className="px-3 py-2">Diagnóstico</th>
                <th className="px-3 py-2">Pendiente</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr key={r.id} className="border-t">
                  <td className="px-3 py-2 text-gray-700">{r.fecha_visita}</td>
                  <td className="px-3 py-2 font-medium">{r.dni}</td>
                  <td className="px-3 py-2">{r.nombre}</td>
                  <td className="px-3 py-2">{r.diagnostico}</td>
                  <td className="px-3 py-2 w-[360px]">
                    <InlinePendiente id={r.id!} initial={r.pendiente || ''} onSave={handleUpdatePendiente} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {rows.length === 0 && (
          <div className="p-6 text-sm text-gray-500">No hay pacientes ambulatorios programados para hoy.</div>
        )}
      </div>
    </div>
  );
};

const InlinePendiente: React.FC<{ id: string; initial: string; onSave: (id: string, value: string) => void }> = ({ id, initial, onSave }) => {
  const [value, setValue] = useState(initial);
  const [dirty, setDirty] = useState(false);
  useEffect(() => { setValue(initial); setDirty(false); }, [initial]);
  return (
    <div className="flex items-center gap-2">
      <input
        className="border rounded px-2 py-1 w-full"
        placeholder="Escribe pendiente"
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

export default PacientesPostAlta;