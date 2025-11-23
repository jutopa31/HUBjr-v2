import React, { useEffect, useState } from 'react';
import { listSubmittedParticipations, validateParticipation, rejectParticipation, ParticipationRow } from '../../services/rankingService';

const AdminQueue: React.FC = () => {
  const [items, setItems] = useState<ParticipationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pointsMap, setPointsMap] = useState<Record<string, number>>({});

  const load = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await listSubmittedParticipations();
      setItems(data);
    } catch (e) {
      setError('No se pudo cargar la bandeja de validación');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const handleValidate = async (id: string) => {
    const pts = pointsMap[id] ?? 0;
    const { success } = await validateParticipation(id, pts);
    if (success) await load();
  };

  const handleReject = async (id: string) => {
    const { success } = await rejectParticipation(id);
    if (success) await load();
  };

  if (loading) return <div className="text-sm text-gray-600 dark:text-gray-300">Cargando bandeja…</div>;
  if (error) return <div className="text-sm text-red-600">{error}</div>;

  return (
    <div className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-4 shadow-sm">
      <div className="flex items-baseline justify-between">
        <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Bandeja de validación</h3>
        <button onClick={load} className="text-xs px-2 py-1 rounded border border-gray-300 dark:border-gray-600">Refrescar</button>
      </div>
      {items.length === 0 ? (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">Sin participaciones pendientes.</p>
      ) : (
        <div className="mt-3 grid grid-cols-1 gap-2 text-sm">
          {items.map(it => (
            <div key={it.id} className="p-3 rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-[#141414]">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <div className="font-medium">{it.displayName || it.userId}</div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">{it.type} • {new Date(it.createdAt).toLocaleString()}</div>
                  {it.comment && <div className="text-xs mt-1 text-gray-700 dark:text-gray-200">{it.comment}</div>}
                </div>
                <div className="flex items-center gap-2">
                  <input type="number" min={0} className="w-24 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-[#1f1f1f] p-1"
                    value={pointsMap[it.id] ?? 0} onChange={e => setPointsMap(prev => ({ ...prev, [it.id]: Number(e.target.value) }))} />
                  <button onClick={() => handleValidate(it.id)} className="px-2 py-1 rounded bg-green-600 text-white text-xs">Validar</button>
                  <button onClick={() => handleReject(it.id)} className="px-2 py-1 rounded border border-red-300 text-red-700 text-xs">Rechazar</button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AdminQueue;

