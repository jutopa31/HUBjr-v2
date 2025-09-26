import React from 'react';
import type { HospitalContext } from '../../../types';

interface ResourcesHubProps {
  hospitalContext: HospitalContext;
}

const ResourcesHub: React.FC<ResourcesHubProps> = ({ hospitalContext }) => {
  return (
    <section className="flex flex-col gap-4 bg-slate-900/40 p-6 text-slate-100">
    <header className="flex flex-col gap-2">
      <h1 className="text-2xl font-semibold">Recursos medicos (WIP)</h1>
      <p className="text-sm text-slate-400">
        Algoritmos diagnosticos, escalas y procedimientos se centralizaran aqui. Contexto activo:
        {` ${hospitalContext}`}.
      </p>
    </header>
    <div className="flex flex-col gap-3 rounded-xl border border-dashed border-slate-800 p-6 text-sm text-slate-400">
      <p>
         Roadmap: indice de algoritmos, biblioteca de escalas, favoritos y buscador con etiquetas por
        contexto.
      </p>
      <p>
         Integrara las mismas tablas de Supabase utilizadas actualmente por la vista v2 para asegurar
        continuidad de datos.
      </p>
    </div>
  </section>
  );
};

export default ResourcesHub;
