import React, { useState, useEffect } from 'react';
import { X, CheckCircle } from 'lucide-react';
import { getAllResidents, awardPointsForLumbarPuncture, type Topic, type ResidentOption } from '../../services/rankingService';

type Props = {
  topic: Topic;
  onClose: () => void;
  onSuccess: () => void;
};

const ManualPointsModal: React.FC<Props> = ({ topic, onClose, onSuccess }) => {
  const [residents, setResidents] = useState<ResidentOption[]>([]);
  const [selectedResidentId, setSelectedResidentId] = useState('');
  const [points, setPoints] = useState(10);
  const [reason, setReason] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingResidents, setLoadingResidents] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    loadResidents();
  }, []);

  const loadResidents = async () => {
    setLoadingResidents(true);
    try {
      const data = await getAllResidents();
      setResidents(data);
      if (data.length > 0) {
        setSelectedResidentId(data[0].userId);
      }
    } catch (err) {
      setError('Error al cargar residentes');
    } finally {
      setLoadingResidents(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedResidentId) {
      setError('Selecciona un residente');
      return;
    }

    setLoading(true);
    setError(null);

    const result = await awardPointsForLumbarPuncture({
      residentUserId: selectedResidentId,
      topicId: topic.id,
      points,
      reason: reason.trim() || 'Puntos manuales',
      period: topic.period
    });

    setLoading(false);

    if (result.success) {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
      }, 2000);
    } else {
      setError(result.error || 'Error al asignar puntos');
    }
  };

  if (success) {
    return (
      <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
        <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow-xl max-w-md w-full p-8 text-center">
          <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">
            ¡Puntos agregados correctamente!
          </h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            El leaderboard se actualizará automáticamente
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Agregar Puntos Manualmente
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800"
            disabled={loading}
          >
            <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md">
            <div className="text-sm font-medium text-blue-900 dark:text-blue-200">
              Tema: {topic.title}
            </div>
            <div className="text-xs text-blue-700 dark:text-blue-300 mt-1">
              {topic.period === 'weekly' ? 'Semanal' : 'Mensual'}
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Resident Select */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Residente <span className="text-red-500">*</span>
              </label>
              {loadingResidents ? (
                <div className="text-sm text-gray-500 dark:text-gray-400">Cargando residentes...</div>
              ) : residents.length === 0 ? (
                <div className="text-sm text-red-600 dark:text-red-400">No hay residentes disponibles</div>
              ) : (
                <select
                  value={selectedResidentId}
                  onChange={(e) => setSelectedResidentId(e.target.value)}
                  required
                  className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2 text-gray-900 dark:text-gray-100"
                >
                  {residents.map((resident) => (
                    <option key={resident.userId} value={resident.userId}>
                      {resident.displayName} {resident.level ? `(${resident.level})` : ''}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Points */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Puntos <span className="text-red-500">*</span>
              </label>
              <input
                type="number"
                value={points}
                onChange={(e) => setPoints(Number(e.target.value))}
                min={0}
                required
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2 text-gray-900 dark:text-gray-100"
              />
            </div>

            {/* Reason */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Razón / Comentario (opcional)
              </label>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={3}
                className="w-full rounded-md border border-gray-300 dark:border-gray-700 bg-white dark:bg-[#141414] p-2 text-gray-900 dark:text-gray-100"
                placeholder="Ej: Presentación excelente, aporte destacado, etc."
              />
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
                disabled={loading || loadingResidents || residents.length === 0}
                className="px-4 py-2 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Asignando...' : 'Otorgar puntos'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ManualPointsModal;
