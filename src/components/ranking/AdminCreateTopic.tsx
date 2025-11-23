import React, { useState } from 'react';
import { createTopic, RankingPeriod } from '../../services/rankingService';

const hospitalOptions = ['Posadas', 'Julian'];

const AdminCreateTopic: React.FC = () => {
  const [title, setTitle] = useState('');
  const [period, setPeriod] = useState<RankingPeriod>('weekly');
  const [hospital, setHospital] = useState('Posadas');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().slice(0, 16));
  const [endDate, setEndDate] = useState<string>(new Date(Date.now() + 6 * 24 * 3600 * 1000).toISOString().slice(0, 16));
  const [objectives, setObjectives] = useState('');
  const [status, setStatus] = useState<'draft' | 'published'>('draft');
  const [msg, setMsg] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const ok = await createTopic({
        title,
        period,
        hospitalContext: hospital,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        objectives: objectives || undefined,
        materials: undefined,
        status,
      });
      if (ok.success) {
        setMsg('Tema creado');
        setTitle('');
        setObjectives('');
      } else {
        setMsg('Error creando el tema');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-[#1f1f1f] p-4 shadow-sm">
      <h3 className="text-base font-semibold text-indigo-700 dark:text-indigo-300">Crear tema</h3>
      <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-3">
        <label className="text-sm">
          <span className="block mb-1">Título</span>
          <input value={title} onChange={e=>setTitle(e.target.value)} required className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2" />
        </label>
        <div className="grid grid-cols-2 gap-3">
          <label className="text-sm">
            <span className="block mb-1">Periodo</span>
            <select value={period} onChange={e=>setPeriod(e.target.value as RankingPeriod)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2">
              <option value="weekly">Semanal</option>
              <option value="monthly">Mensual</option>
            </select>
          </label>
          <label className="text-sm">
            <span className="block mb-1">Hospital</span>
            <select value={hospital} onChange={e=>setHospital(e.target.value)} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2">
              {hospitalOptions.map(h=> <option key={h} value={h}>{h}</option>)}
            </select>
          </label>
        </div>
        <label className="text-sm">
          <span className="block mb-1">Inicio</span>
          <input type="datetime-local" value={startDate} onChange={e=>setStartDate(e.target.value)} required className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2" />
        </label>
        <label className="text-sm">
          <span className="block mb-1">Fin</span>
          <input type="datetime-local" value={endDate} onChange={e=>setEndDate(e.target.value)} required className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2" />
        </label>
        <label className="text-sm md:col-span-2">
          <span className="block mb-1">Objetivos (opcional)</span>
          <textarea value={objectives} onChange={e=>setObjectives(e.target.value)} rows={3} className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2" />
        </label>
        <div className="flex items-center gap-3 md:col-span-2">
          <label className="text-sm flex items-center gap-2">
            <span>Estado:</span>
            <select value={status} onChange={e=>setStatus(e.target.value as any)} className="rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2 text-sm">
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
            </select>
          </label>
          <button disabled={loading} className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700 disabled:opacity-60">{loading ? 'Creando…' : 'Crear tema'}</button>
          {msg && <span className="text-sm">{msg}</span>}
        </div>
      </form>
    </section>
  );
};

export default AdminCreateTopic;

