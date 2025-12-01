import React, { useState } from 'react';
import ClasesScheduler from './ClasesScheduler';
import RecursosManager from './RecursosManager';

interface AcademiaManagerProps {
  isAdminMode?: boolean;
}

type ContentType = 'clases' | 'rotaciones' | 'recursos';

const AcademiaManager: React.FC<AcademiaManagerProps> = ({ isAdminMode = false }) => {
  const [contentType, setContentType] = useState<ContentType>('clases');

  const contentOptions = [
    { value: 'clases' as const, label: 'Clases', description: 'Magistrales, ateneos y seminarios' },
    { value: 'rotaciones' as const, label: 'Rotaciones', description: 'Rotaciones clínicas' },
    { value: 'recursos' as const, label: 'Recursos educativos', description: 'Guías, papers y materiales' }
  ];

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto mt-4 max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-gray-500">Academia</p>
              <h1 className="text-2xl font-semibold text-gray-900">Clases, actividades y recursos en un solo lugar</h1>
              <p className="text-sm text-gray-600">
                Cronograma académico integrado con la biblioteca de materiales para que planifiques y prepares tus sesiones.
              </p>
            </div>
            {isAdminMode && (
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                Modo admin
              </span>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Mostrar:</label>
            <select
              value={contentType}
              onChange={(e) => setContentType(e.target.value as ContentType)}
              className="rounded-lg border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:ring-2 focus:ring-blue-500"
            >
              {contentOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <span className="text-sm text-gray-500">
              {contentOptions.find((opt) => opt.value === contentType)?.description}
            </span>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white shadow-sm">
          {contentType === 'recursos' ? (
            <RecursosManager isAdminMode={isAdminMode} />
          ) : (
            <ClasesScheduler isAdminMode={isAdminMode} filterType={contentType} />
          )}
        </div>
      </div>
    </div>
  );
};

export default AcademiaManager;
