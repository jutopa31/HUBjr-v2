import React, { useCallback, useState } from 'react';
import type { ExamenFisicoSection as ExamenFisicoSectionType } from '../../../types/evolucionadorStructured';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface ExamenFisicoSectionProps {
  value: ExamenFisicoSectionType;
  onChange: (value: ExamenFisicoSectionType) => void;
}

const textareaClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-100';

const ExamenFisicoSection: React.FC<ExamenFisicoSectionProps> = ({ value, onChange }) => {
  const [showSubsection, setShowSubsection] = useState(Boolean(value.examenNeurologico));

  const updateField = useCallback(
    (field: keyof ExamenFisicoSectionType, fieldValue: string) => {
      onChange({ ...value, [field]: fieldValue });
    },
    [onChange, value]
  );

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Examen fisico general</label>
        <textarea
          value={value.texto}
          onChange={(event) => updateField('texto', event.target.value)}
          rows={4}
          className={textareaClassName}
          placeholder="Examen fisico general"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => setShowSubsection((prev) => !prev)}
          className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300"
        >
          {showSubsection ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Examen neurologico
        </button>
        {showSubsection && (
          <textarea
            value={value.examenNeurologico}
            onChange={(event) => updateField('examenNeurologico', event.target.value)}
            rows={3}
            className={`${textareaClassName} mt-2`}
            placeholder="Examen neurologico"
          />
        )}
      </div>
    </div>
  );
};

export default ExamenFisicoSection;
