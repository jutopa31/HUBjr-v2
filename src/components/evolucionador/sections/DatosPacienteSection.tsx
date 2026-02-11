import React, { useCallback } from 'react';
import type { DatosPacienteSection } from '../../../types/evolucionadorStructured';

interface DatosPacienteSectionProps {
  value: DatosPacienteSection;
  onChange: (value: DatosPacienteSection) => void;
}

const inputClassName =
  'w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-gray-700 dark:bg-[#0a0a0a] dark:text-gray-100';

const DatosPacienteSection: React.FC<DatosPacienteSectionProps> = ({ value, onChange }) => {
  const updateField = useCallback(
    (field: keyof DatosPacienteSection, fieldValue: string) => {
      onChange({ ...value, [field]: fieldValue });
    },
    [onChange, value]
  );

  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div className="md:col-span-2">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Nombre</label>
        <input
          type="text"
          value={value.nombre}
          onChange={(event) => updateField('nombre', event.target.value)}
          className={inputClassName}
          placeholder="Nombre completo"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">DNI</label>
        <input
          type="text"
          value={value.dni}
          onChange={(event) => updateField('dni', event.target.value)}
          className={inputClassName}
          placeholder="Documento"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Edad</label>
        <input
          type="text"
          value={value.edad}
          onChange={(event) => updateField('edad', event.target.value)}
          className={inputClassName}
          placeholder="Edad"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Cama</label>
        <input
          type="text"
          value={value.cama}
          onChange={(event) => updateField('cama', event.target.value)}
          className={inputClassName}
          placeholder="Cama"
        />
      </div>
      <div>
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Sexo</label>
        <select
          value={value.sexo}
          onChange={(event) => updateField('sexo', event.target.value)}
          className={inputClassName}
        >
          <option value="No especificado">No especificado</option>
          <option value="Masculino">Masculino</option>
          <option value="Femenino">Femenino</option>
          <option value="Otro">Otro</option>
        </select>
      </div>
      <div className="md:col-span-2">
        <label className="text-xs font-semibold text-gray-600 dark:text-gray-300">Obra social</label>
        <input
          type="text"
          value={value.obraSocial}
          onChange={(event) => updateField('obraSocial', event.target.value)}
          className={inputClassName}
          placeholder="Obra social"
        />
      </div>
    </div>
  );
};

export default DatosPacienteSection;
