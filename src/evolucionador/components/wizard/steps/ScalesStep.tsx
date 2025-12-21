import React from 'react';

const ScalesStep: React.FC = () => {
  return (
    <div className="space-y-3">
      <div>
        <h3 className="text-gray-900 text-lg font-semibold">Escalas neurologicas</h3>
        <p className="text-gray-500 text-sm">Selecciona escalas relevantes para este paciente.</p>
      </div>
      <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-gray-500 text-sm">
        Placeholder para el sistema de escalas.
      </div>
    </div>
  );
};

export default React.memo(ScalesStep);
