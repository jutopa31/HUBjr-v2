import React, { useEffect, useState } from 'react';
import { BookOpen, FileQuestion, List, Sparkles } from 'lucide-react';
import AcademiaSimplified from './AcademiaSimplified';
import { AcademicClass, fetchClasses, isFutureClass, normalizeTimeValue } from './services/academiaService';

interface AcademiaManagerProps {
  isAdminMode?: boolean;
}

const AcademiaManager: React.FC<AcademiaManagerProps> = ({ isAdminMode = false }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'calendar' | 'weekly' | 'quizzes'>('register');
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
    <div className="min-h-screen bg-slate-50 dark:bg-[#1a1a1a]">
      {/* Header Principal - Estilo Ward Rounds */}
      <div className="max-w-6xl mx-auto mb-4 px-4 pt-4">
        <div className="flex items-center justify-between bg-gradient-to-r from-blue-50 via-white to-white dark:from-gray-800 dark:via-gray-900 dark:to-gray-900 rounded-lg px-4 py-3 shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-3">
            {/* Icono circular con sombra */}
            <div className="rounded-full bg-white dark:bg-gray-800 p-1.5 shadow-sm ring-1 ring-gray-200 dark:ring-gray-700">
              <BookOpen className="h-5 w-5 text-blue-700 dark:text-blue-400" />
            </div>

            {/* Título y subtítulo */}
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-semibold text-[var(--text-primary)]">Academia</h1>
                {isAdminMode && (
                  <span className="inline-flex items-center rounded-full border border-blue-200 dark:border-blue-700 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 text-[10px] font-semibold text-blue-700 dark:text-blue-300">
                    Admin
                  </span>
                )}
              </div>
              <p className="text-xs text-[var(--text-secondary)] hidden sm:block">
                {nextClass ? `Próxima: ${nextClass.topic_name} - ${formatCompactDate(nextClass.class_date)}` : 'Sin clases programadas'}
              </p>
            </div>
          </div>

          {/* Tabs de navegación */}
          <div className="flex items-center gap-2 flex-wrap justify-end">
            <div className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-800 p-0.5">
              <button
                onClick={() => setActiveTab('register')}
                aria-current={activeTab === 'register' ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  activeTab === 'register'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
                }`}
                title="Nueva clase"
              >
                <BookOpen className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Nueva</span>
              </button>
              <button
                onClick={() => setActiveTab('calendar')}
                aria-current={activeTab === 'calendar' ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  activeTab === 'calendar'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
                }`}
                title="Ver cronograma"
              >
                <List className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Lista</span>
              </button>
              <button
                onClick={() => setActiveTab('weekly')}
                aria-current={activeTab === 'weekly' ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  activeTab === 'weekly'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
                }`}
                title="Tema semanal"
              >
                <Sparkles className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Semanal</span>
              </button>
              <button
                onClick={() => setActiveTab('quizzes')}
                aria-current={activeTab === 'quizzes' ? 'page' : undefined}
                className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition ${
                  activeTab === 'quizzes'
                    ? 'bg-white dark:bg-gray-700 text-blue-600 dark:text-blue-300 shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-700'
                }`}
                title="Cuestionarios"
              >
                <FileQuestion className="h-3.5 w-3.5" />
                <span className="hidden sm:inline">Quiz</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Componente principal simplificado */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <AcademiaSimplified activeTab={activeTab} setActiveTab={setActiveTab} />
      </div>
    </div>
  );
};

export default AcademiaManager;
