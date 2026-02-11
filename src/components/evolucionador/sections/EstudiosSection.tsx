import React, { useCallback, useState } from 'react';
import type { EstudiosComplementariosSection } from '../../../types/evolucionadorStructured';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface EstudiosSectionProps {
  value: EstudiosComplementariosSection;
  onChange: (value: EstudiosComplementariosSection) => void;
}

const textareaClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-100';

const EstudiosSection: React.FC<EstudiosSectionProps> = ({ value, onChange }) => {
  const [openSections, setOpenSections] = useState({
    laboratorio: Boolean(value.laboratorio),
    imagenes: Boolean(value.imagenes),
    otros: Boolean(value.otros)
  });

  const updateField = useCallback(
    (field: keyof EstudiosComplementariosSection, fieldValue: string) => {
      onChange({ ...value, [field]: fieldValue });
    },
    [onChange, value]
  );

  const toggleSection = (field: keyof typeof openSections) => {
    setOpenSections((prev) => ({ ...prev, [field]: !prev[field] }));
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Resumen de estudios</label>
        <textarea
          value={value.texto}
          onChange={(event) => updateField('texto', event.target.value)}
          rows={4}
          className={textareaClassName}
          placeholder="Estudios complementarios"
        />
      </div>

      <div>
        <button
          type="button"
          onClick={() => toggleSection('laboratorio')}
          className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300"
        >
          {openSections.laboratorio ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Laboratorio
        </button>
        {openSections.laboratorio && (
          <textarea
            value={value.laboratorio}
            onChange={(event) => updateField('laboratorio', event.target.value)}
            rows={3}
            className={`${textareaClassName} mt-2`}
            placeholder="Resultados de laboratorio"
          />
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => toggleSection('imagenes')}
          className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300"
        >
          {openSections.imagenes ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Imagenes
        </button>
        {openSections.imagenes && (
          <textarea
            value={value.imagenes}
            onChange={(event) => updateField('imagenes', event.target.value)}
            rows={3}
            className={`${textareaClassName} mt-2`}
            placeholder="Resultados de imagenes"
          />
        )}
      </div>

      <div>
        <button
          type="button"
          onClick={() => toggleSection('otros')}
          className="flex items-center gap-2 text-xs font-semibold text-blue-700 dark:text-blue-300"
        >
          {openSections.otros ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          Otros
        </button>
        {openSections.otros && (
          <textarea
            value={value.otros}
            onChange={(event) => updateField('otros', event.target.value)}
            rows={3}
            className={`${textareaClassName} mt-2`}
            placeholder="Otros estudios"
          />
        )}
      </div>
    </div>
  );
};

export default EstudiosSection;
