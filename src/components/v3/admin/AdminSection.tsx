import React from 'react';
import type { HospitalContext } from '../../../types';

interface AdminSectionProps {
  hospitalContext: HospitalContext;
}

const AdminSection: React.FC<AdminSectionProps> = ({ hospitalContext }) => {
  return (
    <section className="flex flex-col gap-4 bg-slate-900/40 p-6 text-gray-100">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-semibold">Administracion (WIP)</h1>
        <p className="text-sm text-gray-400">
          Centralizara privilegios, bitacoras y configuracion avanzada manteniendo el contexto de
          {` ${hospitalContext}`}.
        </p>
      </header>
      <div className="rounded-xl border border-dashed border-slate-800 p-4 text-sm text-gray-400">
        Placeholder temporal  utilice la pestana de administracion en v2 hasta completar la migracion.
      </div>
    </section>
  );
};

export default AdminSection;
