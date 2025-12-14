import React from 'react';
import { ArrowRight, X } from 'lucide-react';
import { InterconsultaRow } from '../../services/interconsultasService';

interface Props {
  interconsulta: InterconsultaRow;
  onClose: () => void;
  onConfirm: () => void;
}

const ConfirmacionEvolucionadorModal: React.FC<Props> = ({ interconsulta, onClose, onConfirm }) => {
  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden animate-in zoom-in-95 duration-200">
        {/* Header minimalista */}
        <div className="px-6 pt-6 pb-4 flex items-start justify-between">
          <div>
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              Responder interconsulta
            </h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Ir al Evolucionador
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        {/* Contenido minimalista */}
        <div className="px-6 pb-6">
          {/* Información del paciente - diseño limpio */}
          <div className="space-y-3 mb-6">
            <div className="flex items-baseline gap-2">
              <span className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium w-16">
                Paciente
              </span>
              <span className="text-base font-semibold text-gray-900 dark:text-gray-100">
                {interconsulta.nombre}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium w-16">
                DNI
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {interconsulta.dni}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium w-16">
                Cama
              </span>
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {interconsulta.cama}
              </span>
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-xs uppercase tracking-wide text-gray-400 dark:text-gray-500 font-medium w-16">
                Estado
              </span>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                interconsulta.status === 'Pendiente'
                  ? 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300'
                  : interconsulta.status === 'En Proceso'
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
                  : interconsulta.status === 'Resuelta'
                  ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'
                  : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'
              }`}>
                {interconsulta.status}
              </span>
            </div>
          </div>

          {/* Botones minimalistas */}
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="flex-1 px-4 py-2.5 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors font-medium text-sm"
            >
              Cancelar
            </button>
            <button
              onClick={onConfirm}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold text-sm transition-all shadow-lg shadow-blue-500/25 inline-flex items-center justify-center gap-2"
            >
              Continuar
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ConfirmacionEvolucionadorModal;
