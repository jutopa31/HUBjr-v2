import React, { useEffect, useState } from 'react';
import useEscapeKey from '../hooks/useEscapeKey';
import { X, Trash2, Archive, Users } from 'lucide-react';

interface DeletePatientModalProps {
  isOpen: boolean;
  onClose: () => void;
  patient: {
    id: string;
    nombre: string;
    dni: string;
  } | null;
  onConfirmDelete: (action: 'delete' | 'archive' | 'outpatient') => Promise<void>;
  isProcessing: boolean;
}

const DeletePatientModal: React.FC<DeletePatientModalProps> = ({
  isOpen,
  onClose,
  patient,
  onConfirmDelete,
  isProcessing
}) => {
  const [selectedAction, setSelectedAction] = useState<'delete' | 'archive' | 'outpatient'>('outpatient');

  useEffect(() => {
    if (isOpen) {
      setSelectedAction('outpatient');
    }
  }, [isOpen]);

  useEscapeKey(onClose, isOpen);

  if (!isOpen || !patient) return null;

  const handleConfirm = async () => {
    await onConfirmDelete(selectedAction);
  };

  return (
    <div className="modal-overlay z-50 p-4">
      <div className="modal-content max-w-md w-full">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-secondary)] flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold text-[var(--text-primary)]">
              Eliminar Paciente
            </h3>
            <p className="text-sm text-[var(--text-secondary)]">
              {patient.nombre}
            </p>
          </div>
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="text-[var(--text-tertiary)] hover:text-[var(--text-secondary)]"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-4">
          {/* Action Options */}
          <div className="space-y-3">
            {/* Move to outpatients */}
            <label className="flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors" style={{
              borderColor: selectedAction === 'outpatient' 
                ? 'color-mix(in srgb, var(--state-success) 30%, transparent)'
                : 'var(--border-secondary)',
              backgroundColor: selectedAction === 'outpatient'
                ? 'color-mix(in srgb, var(--state-success) 10%, var(--bg-primary) 90%)'
                : 'transparent'
            }}>
              <input
                type="radio"
                name="deleteAction"
                value="outpatient"
                checked={selectedAction === 'outpatient'}
                onChange={(e) => setSelectedAction(e.target.value as 'outpatient')}
                style={{ accentColor: 'var(--state-success)' }}
                disabled={isProcessing}
              />
              <Users className="h-5 w-5" style={{ color: 'var(--state-success)' }} />
              <span className="font-medium text-[var(--text-primary)]">Mover a lista de ambulatorios</span>
            </label>

            {/* Archive Option */}
            <label className="flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors" style={{
              borderColor: selectedAction === 'archive' 
                ? 'color-mix(in srgb, var(--state-info) 30%, transparent)'
                : 'var(--border-secondary)',
              backgroundColor: selectedAction === 'archive'
                ? 'color-mix(in srgb, var(--state-info) 10%, var(--bg-primary) 90%)'
                : 'transparent'
            }}>
              <input
                type="radio"
                name="deleteAction"
                value="archive"
                checked={selectedAction === 'archive'}
                onChange={(e) => setSelectedAction(e.target.value as 'archive')}
                style={{ accentColor: 'var(--state-info)' }}
                disabled={isProcessing}
              />
              <Archive className="h-5 w-5" style={{ color: 'var(--state-info)' }} />
              <span className="font-medium text-[var(--text-primary)]">Archivar en historial</span>
            </label>

            {/* Delete Option */}
            <label className="flex items-center space-x-3 p-3 border-2 rounded-lg cursor-pointer transition-colors" style={{
              borderColor: selectedAction === 'delete'
                ? 'color-mix(in srgb, var(--state-error) 30%, transparent)'
                : 'var(--border-secondary)',
              backgroundColor: selectedAction === 'delete'
                ? 'color-mix(in srgb, var(--state-error) 10%, var(--bg-primary) 90%)'
                : 'transparent'
            }}>
              <input
                type="radio"
                name="deleteAction"
                value="delete"
                checked={selectedAction === 'delete'}
                onChange={(e) => setSelectedAction(e.target.value as 'delete')}
                style={{ accentColor: 'var(--state-error)' }}
                disabled={isProcessing}
              />
              <Trash2 className="h-5 w-5" style={{ color: 'var(--state-error)' }} />
              <span className="font-medium text-[var(--text-primary)]">Eliminar completamente</span>
            </label>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--border-secondary)] flex justify-end space-x-3">
          <button
            onClick={onClose}
            disabled={isProcessing}
            className="px-4 py-2 text-[var(--text-primary)] bg-[var(--bg-secondary)] rounded-lg hover:bg-[var(--bg-hover)] transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            disabled={isProcessing}
            className={`px-4 py-2 rounded-lg font-medium transition-colors flex items-center space-x-2 ${
              selectedAction === 'delete'
                ? 'btn-error'
                : 'btn-accent'
            }`}
          >
            {isProcessing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                <span>Procesando...</span>
              </>
            ) : (
              <>
                {selectedAction === 'outpatient' ? (
                  <>
                    <Users className="h-4 w-4" />
                    <span>Pasar a ambulatorios</span>
                  </>
                ) : selectedAction === 'archive' ? (
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
