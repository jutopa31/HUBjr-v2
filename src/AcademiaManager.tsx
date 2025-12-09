import React, { useEffect, useState } from 'react';
import { BookOpen, List } from 'lucide-react';
import AcademiaSimplified from './AcademiaSimplified';
import { AcademicClass, fetchClasses, isFutureClass, normalizeTimeValue } from './services/academiaService';

interface AcademiaManagerProps {
  isAdminMode?: boolean;
}

const AcademiaManager: React.FC<AcademiaManagerProps> = ({ isAdminMode = false }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'calendar'>('register');
  const [nextClass, setNextClass] = useState<AcademicClass | null>(null);

  useEffect(() => {
    const loadNextClass = async () => {
      const { data, error } = await fetchClasses();
      if (error || !data) {
        setNextClass(null);
        return;
      }

      const future = data.filter(c => isFutureClass(c.class_date, c.class_time));
      future.sort((a, b) => {
        const dateA = new Date(`${a.class_date}T${normalizeTimeValue(a.class_time)}`).getTime();
        const dateB = new Date(`${b.class_date}T${normalizeTimeValue(b.class_time)}`).getTime();
        return dateA - dateB;
      });

      setNextClass(future[0] || null);
    };

    loadNextClass();
  }, []);

  const formatCompactDate = (isoDate: string) => {
    const [year, month, day] = isoDate.split('-');
    if (!year || !month || !day) return '--/--/----';
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto mt-4 max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
        {/* Header compacto con próxima clase */}
        <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 bg-white px-4 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <h1 className="text-lg font-semibold tracking-wide text-gray-900">CLASES</h1>
            {isAdminMode && (
              <span className="inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-[11px] font-semibold text-blue-700">
                Modo admin
              </span>
            )}
          </div>

          <div className="flex flex-1 flex-wrap items-center justify-end gap-3">
            <div className="flex min-w-[230px] items-center justify-between rounded-xl border border-gray-200 bg-gray-50 px-3 py-2">
              <div>
                <p className="text-[11px] font-semibold uppercase tracking-[0.3em] text-gray-500">Próxima clase</p>
                <p className="text-sm font-semibold text-gray-900">
                  {nextClass ? nextClass.topic_name : 'Sin clases'}
                </p>
              </div>
              <div className="rounded-lg bg-gray-900 px-3 py-1 text-[11px] font-semibold text-white">
                {nextClass ? formatCompactDate(nextClass.class_date) : '--/--/----'}
              </div>
            </div>

            <div className="inline-flex items-center gap-2 rounded-full bg-gray-100 p-1">
              <button
                onClick={() => setActiveTab('register')}
                aria-current={activeTab === 'register' ? 'page' : undefined}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'register'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-white'
                }`}
              >
                <BookOpen className="h-4 w-4" />
                Nueva clase
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                aria-current={activeTab === 'calendar' ? 'page' : undefined}
                className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition ${
                  activeTab === 'calendar'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-white'
                }`}
              >
                <List className="h-4 w-4" />
                Cronograma
              </button>
            </div>
          </div>
        </div>

        {/* Componente principal simplificado */}
        <AcademiaSimplified activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

export default AcademiaManager;
