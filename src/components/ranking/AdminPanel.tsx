import React from 'react';

type Props = {
  onCreateTopic?: () => void;
  onValidateQueue?: () => void;
};

const AdminPanel: React.FC<Props> = ({ onCreateTopic, onValidateQueue }) => {
  return (
    <section className="rounded-lg border border-indigo-200 dark:border-indigo-700 bg-white dark:bg-[#1f1f1f] p-4 shadow-sm">
      <h3 className="text-base font-semibold text-indigo-700 dark:text-indigo-300">Panel del Jefe</h3>
      <p className="mt-1 text-sm text-gray-700 dark:text-gray-200">
        Acciones rápidas (placeholder). Las vistas completas llegarán en próximas fases.
      </p>
      <div className="mt-3 flex gap-3">
        <button onClick={onCreateTopic} className="px-3 py-2 rounded-md bg-indigo-600 text-white text-sm hover:bg-indigo-700">Nuevo tema</button>
        <button onClick={onValidateQueue} className="px-3 py-2 rounded-md border border-indigo-300 dark:border-indigo-600 text-sm text-indigo-700 dark:text-indigo-300">Validar participaciones</button>
      </div>
    </section>
  );
};

export default AdminPanel;

