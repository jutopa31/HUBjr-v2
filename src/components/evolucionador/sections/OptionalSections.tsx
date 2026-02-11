import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface OptionalSectionsProps {
  interpretacion: string;
  sugerencias: string;
  onChange: (next: { interpretacion: string; sugerencias: string }) => void;
}

const textareaClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-100';

const OptionalSections: React.FC<OptionalSectionsProps> = ({ interpretacion, sugerencias, onChange }) => {
  const [open, setOpen] = useState({
    interpretacion: Boolean(interpretacion),
    sugerencias: Boolean(sugerencias)
  });

  return (
    <div className="space-y-4">
      <div>
        <button
          type="button"
          onClick={() => setOpen((prev) => ({ ...prev, interpretacion: !prev.interpretacion }))}
          className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300"
        >
          {open.interpretacion ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Interpretacion
        </button>
        {open.interpretacion && (
          <textarea
            value={interpretacion}
            onChange={(event) => onChange({ interpretacion: event.target.value, sugerencias })}
            rows={3}
            className={`${textareaClassName} mt-2`}
            placeholder="Interpretacion"
          />
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => setOpen((prev) => ({ ...prev, sugerencias: !prev.sugerencias }))}
          className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300"
        >
          {open.sugerencias ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Sugerencias
        </button>
        {open.sugerencias && (
          <textarea
            value={sugerencias}
            onChange={(event) => onChange({ interpretacion, sugerencias: event.target.value })}
            rows={3}
            className={`${textareaClassName} mt-2`}
            placeholder="Sugerencias"
          />
        )}
      </div>
    </div>
  );
};

export default OptionalSections;
