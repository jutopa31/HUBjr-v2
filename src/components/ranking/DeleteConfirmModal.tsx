import React, { useState } from 'react';
import { AlertTriangle, X } from 'lucide-react';

type Props = {
  topicTitle: string;
  onClose: () => void;
  onConfirm: () => Promise<void>;
};

const DeleteConfirmModal: React.FC<Props> = ({ topicTitle, onClose, onConfirm }) => {
  const [loading, setLoading] = useState(false);

  const handleConfirm = async () => {
    setLoading(true);
    await onConfirm();
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-[#1f1f1f] rounded-lg shadow-xl max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5" />
            Confirmar Eliminación
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
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
            <p className="text-sm text-red-800 dark:text-red-200 font-medium mb-2">
              ⚠️ Esta acción no se puede deshacer
            </p>
            <p className="text-sm text-red-700 dark:text-red-300">
              Estás a punto de eliminar el tema:
            </p>
            <p className="text-sm font-semibold text-red-900 dark:text-red-100 mt-2">
              "{topicTitle}"
            </p>
          </div>

          <div className="mb-6 text-sm text-gray-700 dark:text-gray-300 space-y-2">
            <p>Esta acción eliminará:</p>
            <ul className="list-disc list-inside pl-2 space-y-1 text-gray-600 dark:text-gray-400">
              <li>El tema completo</li>
              <li>TODAS las participaciones asociadas</li>
              <li>TODOS los registros del ledger de puntos</li>
            </ul>
            <p className="font-medium text-gray-800 dark:text-gray-200 mt-4">
              ¿Estás seguro de que deseas continuar?
            </p>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 rounded-md border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              onClick={handleConfirm}
              disabled={loading}
              className="px-4 py-2 rounded-md bg-red-600 hover:bg-red-700 text-white disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Eliminando...' : 'Eliminar definitivamente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeleteConfirmModal;
