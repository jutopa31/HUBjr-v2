import React from 'react';

export interface PatientDataDraft {
  name: string;
  dni: string;
  age: string;
  bed: string;
}

interface PatientDataStepProps {
  data: PatientDataDraft;
  onChange: (next: PatientDataDraft) => void;
}

const PatientDataStep: React.FC<PatientDataStepProps> = ({ data, onChange }) => {
  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-gray-900 text-lg font-semibold">Datos del paciente</h3>
        <p className="text-gray-500 text-sm">Completa los datos basicos para iniciar la evolucion.</p>
      </div>
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="space-y-1 text-sm">
          <span className="text-gray-600 font-medium">Nombre</span>
          <input
            value={data.name}
            onChange={(event) => onChange({ ...data, name: event.target.value })}
            className="w-full rounded-lg border px-3 py-2 border-gray-200 bg-white text-gray-900 text-sm"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-gray-600 font-medium">DNI</span>
          <input
            value={data.dni}
            onChange={(event) => onChange({ ...data, dni: event.target.value })}
            className="w-full rounded-lg border px-3 py-2 border-gray-200 bg-white text-gray-900 text-sm"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-gray-600 font-medium">Edad</span>
          <input
            value={data.age}
            onChange={(event) => onChange({ ...data, age: event.target.value })}
            className="w-full rounded-lg border px-3 py-2 border-gray-200 bg-white text-gray-900 text-sm"
          />
        </label>
        <label className="space-y-1 text-sm">
          <span className="text-gray-600 font-medium">Cama</span>
          <input
            value={data.bed}
            onChange={(event) => onChange({ ...data, bed: event.target.value })}
            className="w-full rounded-lg border px-3 py-2 border-gray-200 bg-white text-gray-900 text-sm"
          />
        </label>
      </div>
    </div>
  );
};

export default React.memo(PatientDataStep);
