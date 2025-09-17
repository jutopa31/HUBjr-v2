import React, { useState } from 'react';
import { X, Trash2, Archive, AlertTriangle, FileText } from 'lucide-react';

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

  if (!isOpen || !patient) return null;

  const handleConfirm = async () => {
    await onConfirmDelete(selectedAction);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full shadow-xl">
        {/* Header */}
        <div className="p-6 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-orange-100 rounded-full">
              <AlertTriangle className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Eliminar Paciente del Pase
              </h3>
              <p className="text-sm text-gray-600">
                ¿Qué desea hacer con {patient.nombre}?
              </p>
            </div>
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
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Esta acción eliminará al paciente del pase de sala activo.</p>
                <p>Seleccione una opción para continuar:</p>
              </div>
            </div>
          </div>

          {/* Action Options */}
          <div className="space-y-3">
            {/* Archive Option */}
            <label className="flex items-start space-x-3 p-4 border-2 border-blue-200 rounded-lg cursor-pointer hover:bg-blue-50 transition-colors">
              <input
                type="radio"
                name="deleteAction"
                value="archive"
                checked={selectedAction === 'archive'}
                onChange={(e) => setSelectedAction(e.target.value as 'archive')}
                className="mt-1 text-blue-600 focus:ring-blue-500"
                disabled={isProcessing}
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Archive className="h-5 w-5 text-blue-600" />
                  <span className="font-medium text-blue-900">Archivar en "Pacientes Guardados"</span>
                  <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full font-medium">
                    Recomendado
                  </span>
                </div>
                <p className="text-sm text-gray-600">
                  Guarda toda la información del paciente en la sección "Pacientes Guardados"
                  antes de eliminarlo del pase actual. Podrá acceder a estos datos posteriormente.
                </p>
                <div className="mt-2 flex items-center space-x-1 text-xs text-blue-700 bg-blue-50 px-2 py-1 rounded">
                  <FileText className="h-3 w-3" />
                  <span>Accesible desde: Menú principal → Pacientes Guardados</span>
                </div>
              </div>
            </label>

            {/* Delete Option */}
            <label className="flex items-start space-x-3 p-4 border-2 border-red-200 rounded-lg cursor-pointer hover:bg-red-50 transition-colors">
              <input
                type="radio"
                name="deleteAction"
                value="delete"
                checked={selectedAction === 'delete'}
                onChange={(e) => setSelectedAction(e.target.value as 'delete')}
                className="mt-1 text-red-600 focus:ring-red-500"
                disabled={isProcessing}
              />
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-2">
                  <Trash2 className="h-5 w-5 text-red-600" />
                  <span className="font-medium text-red-900">Eliminar completamente</span>
                </div>
                <p className="text-sm text-gray-600">
                  Elimina permanentemente toda la información del paciente.
                  <strong className="text-red-700"> Esta acción no se puede deshacer.</strong>
                </p>
              </div>
            </label>
          </div>

          {/* Patient Info */}
          <div className="bg-gray-50 rounded-lg p-3 border">
            <h4 className="text-sm font-medium text-gray-700 mb-2">Información del paciente:</h4>
            <div className="text-sm space-y-1">
              <div><strong>Nombre:</strong> {patient.nombre}</div>
              <div><strong>DNI:</strong> {patient.dni || 'No especificado'}</div>
            </div>
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