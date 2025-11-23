import React from 'react';

const PatientDetailView: React.FC = () => {
  return (
<section className="flex flex-col gap-4 p-6 bg-slate-900/40 text-gray-100">
      <header className="flex flex-col gap-1">
        <h2 className="text-xl font-semibold">Detalle del paciente (WIP)</h2>
  <p className="text-sm text-gray-400">
          Patient-centric timeline, scale history, and documentation tools will render here once v3
          data hooks are in place.
        </p>
      </header>
  <div className="rounded-xl border border-dashed border-slate-800 p-4 text-sm text-gray-400">
        Component placeholder  wired once unified patients view is interactive.
      </div>
    </section>
  );
};

export default PatientDetailView;
