import React, { useState } from 'react';
import { Calendar, FolderOpen, GraduationCap, FileText } from 'lucide-react';
import ClasesScheduler from './ClasesScheduler';
import RecursosManager from './RecursosManager';

interface AcademiaManagerProps {
  isAdminMode?: boolean;
}

const AcademiaManager: React.FC<AcademiaManagerProps> = ({ isAdminMode = false }) => {
  const [activeTab, setActiveTab] = useState<'clases' | 'recursos'>('clases');

  const tabs = [
    {
      id: 'clases' as const,
      label: 'Clases y Actividades',
      icon: Calendar,
      description: 'Cronograma académico, clases magistrales y ateneos'
    },
    {
      id: 'recursos' as const,
      label: 'Recursos Educativos',
      icon: FolderOpen,
      description: 'Guías, papers y materiales de estudio'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="banner rounded-lg p-4 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <GraduationCap className="h-6 w-6 text-blue-700" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Academia</h1>
                <p className="text-sm text-gray-500">Gestión académica y recursos educativos</p>
              </div>
            </div>

            {isAdminMode && (
              <div className="flex items-center space-x-2">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-gray-800">
                  Modo Admin
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex space-x-8">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;

              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center space-x-2 py-4 px-1 border-b-2 font-medium text-sm transition-colors ${
                    isActive
                      ? 'border-blue-600 text-blue-700'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Tab Description */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-2">
            <FileText className="h-4 w-4 text-blue-600" />
            <p className="text-sm text-blue-800">
              {tabs.find(tab => tab.id === activeTab)?.description}
            </p>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-8">
        {activeTab === 'clases' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <ClasesScheduler isAdminMode={isAdminMode} />
          </div>
        )}

        {activeTab === 'recursos' && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <RecursosManager isAdminMode={isAdminMode} />
          </div>
        )}
      </div>
    </div>
  );
};

export default AcademiaManager;
