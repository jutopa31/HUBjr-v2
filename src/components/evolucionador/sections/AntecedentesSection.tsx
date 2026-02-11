import React, { useCallback } from 'react';
import type { AntecedentesSection } from '../../../types/evolucionadorStructured';

interface AntecedentesSectionProps {
  value: AntecedentesSection;
  onChange: (value: AntecedentesSection) => void;
}

const commonPathologies = [
  { label: 'Hipertension arterial', abbreviation: 'HTA' },
  { label: 'Diabetes mellitus', abbreviation: 'DBT' },
  { label: 'Tabaquismo', abbreviation: 'TBQ' },
  { label: 'Dislipemia', abbreviation: 'DLP' },
  { label: 'Obesidad', abbreviation: 'Obesidad' },
  { label: 'EPOC', abbreviation: 'EPOC' },
  { label: 'Cardiopatia', abbreviation: 'Cardiopatia' },
  { label: 'Fibrilacion auricular', abbreviation: 'FA' },
  { label: 'ERC', abbreviation: 'ERC' },
  { label: 'Hipotiroidismo', abbreviation: 'Hipotiroidismo' },
  { label: 'ACV previo', abbreviation: 'ACV previo' },
  { label: 'Epilepsia', abbreviation: 'Epilepsia' },
  { label: 'Migrana', abbreviation: 'Migrana' },
  { label: 'Demencia', abbreviation: 'Demencia' },
  { label: 'Enfermedad de Parkinson', abbreviation: 'Enf. Parkinson' }
];

const textareaClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-100';

const AntecedentesSection: React.FC<AntecedentesSectionProps> = ({ value, onChange }) => {
  const updateField = useCallback(
    (field: keyof AntecedentesSection, fieldValue: string | string[]) => {
      onChange({ ...value, [field]: fieldValue });
    },
    [onChange, value]
  );

  const togglePathology = (abbreviation: string) => {
    const exists = value.patologias.includes(abbreviation);
    updateField(
      'patologias',
      exists ? value.patologias.filter((item) => item !== abbreviation) : [...value.patologias, abbreviation]
    );
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Antecedentes generales</label>
        <textarea
          value={value.texto}
          onChange={(event) => updateField('texto', event.target.value)}
          rows={4}
          className={textareaClassName}
          placeholder="Detalle de antecedentes"
        />
      </div>

      <div>
        <p className="text-xs font-semibold text-gray-600 dark:text-gray-300">Patologias frecuentes</p>
        <div className="mt-2 flex flex-wrap gap-2">
          {commonPathologies.map((pathology) => {
            const isActive = value.patologias.includes(pathology.abbreviation);
            return (
              <button
                key={pathology.abbreviation}
                type="button"
                onClick={() => togglePathology(pathology.abbreviation)}
                className={
                  `rounded-full border px-3 py-1 text-xs font-semibold transition ` +
                  (isActive
                    ? 'border-blue-600 bg-blue-600 text-white'
                    : 'border-gray-300 bg-white text-gray-700 dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-300')
                }
              >
                {pathology.label}
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Medicacion habitual</label>
        <textarea
          value={value.medicacionHabitual}
          onChange={(event) => updateField('medicacionHabitual', event.target.value)}
          rows={2}
          className={textareaClassName}
          placeholder="Detalle de medicacion habitual"
        />
      </div>

      <div>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Alergias</label>
        <textarea
          value={value.alergias}
          onChange={(event) => updateField('alergias', event.target.value)}
          rows={2}
          className={textareaClassName}
          placeholder="Alergias"
        />
      </div>
    </div>
  );
};

export default AntecedentesSection;
