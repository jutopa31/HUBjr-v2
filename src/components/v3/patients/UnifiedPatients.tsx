import React from 'react';
import type { HospitalContext } from '../../../types';

interface UnifiedPatientsProps {
  hospitalContext: HospitalContext;
}

const UnifiedPatients: React.FC<UnifiedPatientsProps> = ({ hospitalContext }) => {
  return (
<section className="flex flex-col gap-4 bg-slate-900/40 p-6 text-gray-100">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Pacientes unificados (WIP)</h1>
  <p className="text-sm text-gray-400">
          Este modulo combinara guardia, sala y escalas en un unico flujo. Actualmente usando el
          contexto de {hospitalContext}. La logica llegara a medida que extraigamos servicios desde v2.
        </p>
      </header>
  <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-800 p-6 text-sm text-gray-400">
        <p>
           Proximos pasos: feed de pacientes, filtros rapidos, acceso directo al detalle y scoring de
          escalas desde la lista.
        </p>
        <p>
           Mientras tanto, continue utilizando la vista v2 para operaciones criticas hasta completar la
          migracion.
        </p>
      </div>
    </section>
  );
};

export default UnifiedPatients;
