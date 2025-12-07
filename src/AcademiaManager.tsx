import React, { useState } from 'react';
import { BookOpen, List } from 'lucide-react';
import AcademiaSimplified from './AcademiaSimplified';

interface AcademiaManagerProps {
  isAdminMode?: boolean;
}

const AcademiaManager: React.FC<AcademiaManagerProps> = ({ isAdminMode = false }) => {
  const [activeTab, setActiveTab] = useState<'register' | 'calendar'>('register');

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="mx-auto mt-4 max-w-7xl space-y-4 px-4 sm:px-6 lg:px-8">
        {/* Header with Integrated Tabs */}
        <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
          {/* Desktop Layout: Horizontal */}
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between md:gap-6">

            {/* Left: Title Section */}
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <p className="text-xs uppercase tracking-wide text-gray-500">Academia</p>
                {isAdminMode && (
                  <span className="md:hidden inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                    Modo admin
                  </span>
                )}
              </div>
              <h1 className="text-2xl font-semibold text-gray-900 mb-1">
                Sistema de Clases Colaborativo
              </h1>
              <p className="text-sm text-gray-600 max-w-2xl">
                Anótate para dar clases y consulta el calendario de todas las actividades programadas.
              </p>
            </div>

            {/* Right: Tab Navigation + Admin Badge */}
            <div className="flex flex-col gap-3 md:items-end">
              {/* Tab Pills */}
              <div className="inline-flex items-center gap-1 p-1 bg-gray-100 rounded-lg">
                {/* Tab 1: Dar una Clase */}
                <button
                  onClick={() => setActiveTab('register')}
                  aria-current={activeTab === 'register' ? 'page' : undefined}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md
                    transition-all duration-200
                    ${activeTab === 'register'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <BookOpen className="h-4 w-4" />
                  <span>Dar una Clase</span>
                </button>

                {/* Tab 2: Calendario */}
                <button
                  onClick={() => setActiveTab('calendar')}
                  aria-current={activeTab === 'calendar' ? 'page' : undefined}
                  className={`
                    inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-md
                    transition-all duration-200
                    ${activeTab === 'calendar'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                    }
                  `}
                >
                  <List className="h-4 w-4" />
                  <span>Calendario de Clases</span>
                </button>
              </div>

              {/* Admin Badge - Desktop Only */}
              {isAdminMode && (
                <span className="hidden md:inline-flex items-center rounded-full border border-blue-200 bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700">
                  Modo admin
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Componente principal simplificado */}
        <AcademiaSimplified
          activeTab={activeTab}
          setActiveTab={setActiveTab}
        />
      </div>
    </div>
  );
};

export default AcademiaManager;
