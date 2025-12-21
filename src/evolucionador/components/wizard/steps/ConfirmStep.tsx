import React from 'react';
import type { InterconsultaRow } from '../../../../services/interconsultasService';

interface ConfirmStepProps {
  notes: string;
  interconsulta?: InterconsultaRow | null;
  isSaving?: boolean;
  saveError?: string | null;
  onSave: () => void;
  onSaveToWardRound?: () => void;
}

const ConfirmStep: React.FC<ConfirmStepProps> = ({
  notes,
  interconsulta,
  isSaving,
  saveError,
  onSave,
  onSaveToWardRound
}) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-gray-900 text-lg font-semibold">Confirmar evolucion</h3>
        <p className="text-gray-500 text-sm">Revisa el resumen antes de guardar.</p>
      </div>
      {interconsulta && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-900 text-sm">
          <p className="font-semibold">Interconsulta activa</p>
          <p className="mt-1">{interconsulta.nombre} · DNI {interconsulta.dni}</p>
        </div>
      )}
      <div className="rounded-lg border border-gray-200 bg-white p-4 text-gray-700 text-sm">
        <p className="font-semibold text-gray-900">Notas (preview)</p>
        <p className="mt-2 whitespace-pre-wrap">
          {notes.trim() ? notes.slice(0, 500) : 'Sin notas cargadas.'}
        </p>
      </div>
      {saveError && (
        <div className="rounded-lg border border-red-200 bg-red-50 p-3 text-red-800 text-sm">
          {saveError}
        </div>
      )}
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={onSave}
          disabled={isSaving}
          className={`rounded-lg px-4 py-2 text-sm font-semibold ${
            isSaving ? 'bg-gray-200 text-gray-400 cursor-not-allowed' : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          Guardar evolucion
        </button>
        {interconsulta && onSaveToWardRound && (
          <button
            type="button"
            onClick={onSaveToWardRound}
            disabled={isSaving}
            className={`rounded-lg border px-4 py-2 text-sm font-semibold ${
              isSaving
                ? 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                : 'border-amber-300 bg-amber-100 text-amber-900 hover:bg-amber-200'
            }`}
          >
            Guardar y agregar a Pase de Sala
          </button>
        )}
      </div>
    </div>
  );
};

export default React.memo(ConfirmStep);
