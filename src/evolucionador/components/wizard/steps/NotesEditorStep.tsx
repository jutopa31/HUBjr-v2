import React, { useCallback } from 'react';
import OCRProcessor from '../../ocr/OCRProcessor';

interface NotesEditorStepProps {
  notes: string;
  onNotesChange: (value: string) => void;
  onNext?: () => void;
  onBack?: () => void;
  autoSaveLabel?: string;
}

const appendText = (current: string, incoming: string): string => {
  const safeCurrent = current?.trim() || '';
  const safeIncoming = incoming.trim();
  if (!safeIncoming) return safeCurrent;
  if (!safeCurrent) return safeIncoming;
  return `${safeCurrent}\n\n${safeIncoming}`;
};

const NotesEditorStep: React.FC<NotesEditorStepProps> = ({
  notes,
  onNotesChange,
  onNext,
  onBack,
  autoSaveLabel
}) => {
  const handleInsert = useCallback(
    (text: string) => {
      onNotesChange(appendText(notes, text));
    },
    [notes, onNotesChange]
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h3 className="text-gray-900 text-lg font-semibold">Notas clínicas + OCR</h3>
          <p className="text-gray-500 text-sm">Carga una imagen y extrae texto con Claude Vision.</p>
        </div>
        {autoSaveLabel && (
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-emerald-700 text-xs font-semibold">
            {autoSaveLabel}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1.1fr_1fr]">
        <div className="space-y-3">
          <label className="text-gray-700 text-sm font-semibold">Notas</label>
          <textarea
            value={notes}
            onChange={(event) => onNotesChange(event.target.value)}
            placeholder="Escribe las notas clínicas aquí..."
            className="h-72 w-full resize-none rounded-xl border p-4 border-gray-200 bg-white text-gray-900 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="space-y-3">
          <label className="text-gray-700 text-sm font-semibold">OCR</label>
          <OCRProcessor
            documentType="generic"
            onInsertText={handleInsert}
            helperText="Puedes pegar desde portapapeles o usar la cámara del dispositivo."
          />
        </div>
      </div>

      {(onBack || onNext) && (
        <div className="flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onBack}
            className="rounded-lg border px-4 py-2 border-gray-200 bg-white text-gray-700 text-sm font-semibold hover:bg-gray-100"
          >
            Anterior
          </button>
          <button
            type="button"
            onClick={onNext}
            className="rounded-lg px-4 py-2 bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700"
          >
            Siguiente
          </button>
        </div>
      )}
    </div>
  );
};

export default React.memo(NotesEditorStep);
