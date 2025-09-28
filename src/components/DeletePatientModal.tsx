import React, { useState } from 'react';
import useEscapeKey from '../hooks/useEscapeKey';
import { X, Trash2, Archive } from 'lucide-react';

interface DeletePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    id: string;
    nombre: string;
    dni: string;
  } | null;
  onConfirmDelete: (action: 'delete' | 'archive') => Promise<void>;
  isProcessing: boolean;
}

const DeletePatientModal: React.FC<DeletePatientModalProps> = ({
  isOpen,
  onClose,
  patient,
  onConfirmDelete,
  isProcessing
}) => {
  const [selectedAction, setSelectedAction] = useState<'delete' | 'archive'>('archive');

  useEscapeKey(onClose, isOpen);

  if (!isOpen || !patient) return null;

  const handleConfirm = async () => {
    await onConfirmDelete(selectedAction);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              Eliminar Paciente
            </h3>
            <p className="text-sm text-gray-600">
              {patient.nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Action Options */}
          <div className="space-y-3">
            {/* Archive Option */}
            <label className="flex items-center space-x-3 p-3 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
              <input
                type="radio"
                name="deleteAction"
                value="archive"
                checked={selectedAction === 'archive'}
                onChange={(e) => setSelectedAction(e.target.value as 'archive')}
                className="text-blue-600 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <Archive className="h-5 w-5 text-blue-600" />
              <span className="font-medium text-blue-900">Guardar en "Pacientes ambulatorio"</span>
            </label>

            {/* Delete Option */}
            <label className="flex items-center space-x-3 p-3 border-2 border-red-200 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
              <input
                type="radio"
                name="deleteAction"
                value="delete"
                checked={selectedAction === 'delete'}
                onChange={(e) => setSelectedAction(e.target.value as 'delete')}
                className="text-red-600 focus:ring-red-500"
                disabled={isProcessing}
              />
              <Trash2 className="h-5 w-5 text-red-600" />
              <span className="font-medium text-red-900">Eliminar completamente</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-gray-200 flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 flex items-center space-x-2 ${
              selectedAction === 'archive'
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                {selectedAction === 'archive' ? (
                  <>
                    <Archive className="h-4 w-4" />
                    <span>Archivar Paciente</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4" />
                    <span>Eliminar Completamente</span>
                  </>
                )}
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

export default DeletePatientModal;
