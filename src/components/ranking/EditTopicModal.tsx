import React, { useState } from 'react';
import { X } from 'lucide-react';
import type { Topic } from '../../services/rankingService';

type Props = {
  topic: Topic;
  onClose: () => void;
  onSave: (topicId: string, updates: any) => Promise<boolean>;
};

const EditTopicModal: React.FC<Props> = ({ topic, onClose, onSave }) => {
  const [title, setTitle] = useState(topic.title);
  const [startDate, setStartDate] = useState(() => {
    const date = new Date(topic.startDate);
    return date.toISOString().slice(0, 16);
  });
  const [endDate, setEndDate] = useState(() => {
    const date = new Date(topic.endDate);
    return date.toISOString().slice(0, 16);
  });
  const [objectives, setObjectives] = useState(topic.objectives || '');
  const [status, setStatus] = useState<'draft' | 'published' | 'closed'>(
    // Inferir status basado en si está en el modal (asumimos published por defecto)
    'published'
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isValid = () => {
    if (!title.trim()) return false;
    if (new Date(endDate) <= new Date(startDate)) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid()) {
      setError('Verifica que el título no esté vacío y la fecha de fin sea posterior a la de inicio');
      return;
    }

    setLoading(true);
    setError(null);

    const updates = {
      title,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      objectives: objectives.trim() || undefined,
      status
    };

    const success = await onSave(topic.id, updates);

    setLoading(false);

    if (!success) {
      setError('Error al actualizar el tema');
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Editar Tema
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Título <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2 text-gray-900 dark:text-gray-100"
              placeholder="Título del tema"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha inicio <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2 text-gray-900 dark:text-gray-100"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha fin <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                required
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2 text-gray-900 dark:text-gray-100"
              />
            </div>
          </div>

          {/* Objectives */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Objetivos (opcional)
            </label>
            <textarea
              value={objectives}
              onChange={(e) => setObjectives(e.target.value)}
              rows={4}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2 text-gray-900 dark:text-gray-100"
              placeholder="Objetivos del tema..."
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Estado
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as any)}
              className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2 text-gray-900 dark:text-gray-100"
            >
              <option value="draft">Borrador</option>
              <option value="published">Publicado</option>
              <option value="closed">Cerrado</option>
            </select>
          </div>

          {/* Error Message */}
          {error && (
            <div className="text-sm text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-3 rounded-md">
              {error}
            </div>
          )}

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={loading || !isValid()}
              className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Guardando...' : 'Guardar cambios'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default EditTopicModal;
