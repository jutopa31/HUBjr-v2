import React, { useState } from 'react';
import type { ActiveTopics, Participation } from '../../services/rankingService';

type Props = {
  topics: ActiveTopics;
  onSubmit: (p: Omit<Participation, 'id' | 'status' | 'createdAt'>) => Promise<void>;
  currentUserId?: string; // Optional: hook into auth later
};

const ParticipationForm: React.FC<Props> = ({ topics, onSubmit, currentUserId = 'mock-user' }) => {
  const [topicId, setTopicId] = useState<string>(topics.weekly?.id || topics.monthly?.id || '');
  const [type, setType] = useState<'articulo' | 'clase' | 'revision'>('articulo');
  const [link, setLink] = useState('');
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  const hasAnyTopic = !!topics.weekly || !!topics.monthly;

  // Si cambian los temas activos (por ejemplo, se crea uno nuevo),
  // autoseleccionar alguno disponible para evitar quedar sin selección.
  React.useEffect(() => {
    if (!topicId) {
      const next = topics.weekly?.id || topics.monthly?.id || '';
      if (next) setTopicId(next);
    }
  }, [topics, topicId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!topicId) return setMessage('Selecciona un tema');
    setLoading(true);
    setMessage(null);
    try {
      await onSubmit({ topicId, userId: currentUserId, type, link, comment });
      setMessage('Participación enviada. Queda pendiente de validación.');
      setLink('');
      setComment('');
    } catch (err) {
      setMessage('Error al enviar la participación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1f1f1f] p-4 shadow-sm">
      <h3 className="text-base font-semibold text-gray-900 dark:text-gray-100">Enviar participación</h3>
      {!hasAnyTopic ? (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-300">No hay temas activos por ahora.</p>
      ) : (
        <form onSubmit={handleSubmit} className="mt-3 grid grid-cols-1 gap-3">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <label className="text-sm">
              <span className="block mb-1 text-gray-700 dark:text-gray-200">Tema</span>
              <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2"
                value={topicId} onChange={e => setTopicId(e.target.value)}>
                {topics.weekly && (
                  <option value={topics.weekly.id}>Semanal: {topics.weekly.title}</option>
                )}
                {topics.monthly && (
                  <option value={topics.monthly.id}>Mensual: {topics.monthly.title}</option>
                )}
              </select>
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-gray-700 dark:text-gray-200">Tipo</span>
              <select className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2"
                value={type} onChange={e => setType(e.target.value as any)}>
                <option value="articulo">Artículo</option>
                <option value="clase">Clase</option>
                <option value="revision">Revisión</option>
              </select>
            </label>
            <label className="text-sm">
              <span className="block mb-1 text-gray-700 dark:text-gray-200">Link (opcional)</span>
              <input className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2"
                placeholder="https://..." value={link} onChange={e => setLink(e.target.value)} />
            </label>
          </div>
          <label className="text-sm">
            <span className="block mb-1 text-gray-700 dark:text-gray-200">Comentario</span>
            <textarea className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2"
              rows={3} placeholder="Descripción breve de tu aporte"
              value={comment} onChange={e => setComment(e.target.value)} />
          </label>
          <div className="flex gap-3">
            <button disabled={loading} className="px-3 py-2 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-60">
              {loading ? 'Enviando…' : 'Enviar participación'}
            </button>
            {message && <div className="text-sm text-gray-700 dark:text-gray-200">{message}</div>}
          </div>
        </form>
      )}
    </section>
  );
};

export default ParticipationForm;
