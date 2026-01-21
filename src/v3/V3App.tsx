import React, { useState, useEffect } from 'react';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../contexts/ThemeContext';
import { DestinationCounts } from './types/v3.types';
import PatientEntry from './components/PatientEntry';
import InterconsultasViewer from './components/viewers/InterconsultasViewer';
import PaseSalaViewer from './components/viewers/PaseSalaViewer';
import PostAltaViewer from './components/viewers/PostAltaViewer';
import { getDestinationCounts } from './services/patientsV3Service';

type ViewTab = 'interconsultas' | 'pase_sala' | 'post_alta';

export default function V3App() {
  const { user } = useAuth();
  const { theme } = useTheme();
  const [activeTab, setActiveTab] = useState<ViewTab>('interconsultas');
  const [counts, setCounts] = useState<DestinationCounts>({
    interconsulta: 0,
    pase_sala: 0,
    post_alta: 0,
    ambulatorio: 0,
  });
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    loadCounts();
  }, [refreshKey]);

  async function loadCounts() {
    const { data } = await getDestinationCounts();
    if (data) {
      setCounts(data);
    }
  }

  function handlePatientCreated() {
    setRefreshKey((k) => k + 1);
  }

  function handlePatientUpdated() {
    setRefreshKey((k) => k + 1);
  }

  const tabs: { id: ViewTab; label: string; countKey: keyof DestinationCounts }[] = [
    { id: 'interconsultas', label: 'Interconsultas', countKey: 'interconsulta' },
    { id: 'pase_sala', label: 'Pase de Sala', countKey: 'pase_sala' },
    { id: 'post_alta', label: 'Post-Alta', countKey: 'post_alta' },
  ];

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-50'}`}>
      {/* Header */}
      <header
        className={`sticky top-0 z-10 px-4 py-3 border-b ${
          theme === 'dark'
            ? 'bg-gray-800 border-gray-700'
            : 'bg-white border-gray-200'
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1
            className={`text-xl font-bold ${
              theme === 'dark' ? 'text-white' : 'text-gray-900'
            }`}
          >
            HUBJR v3
          </h1>
          <div className="flex items-center gap-4">
            {user && (
              <span
                className={`text-sm ${
                  theme === 'dark' ? 'text-gray-400' : 'text-gray-600'
                }`}
              >
                {user.email}
              </span>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-4">
        {/* Patient Entry Section */}
        <PatientEntry
          onPatientCreated={handlePatientCreated}
          defaultDestination={activeTab === 'interconsultas' ? 'interconsulta' : activeTab}
        />

        {/* Tab Navigation */}
        <div className="mt-6">
          <div
            className={`flex border-b ${
              theme === 'dark' ? 'border-gray-700' : 'border-gray-200'
            }`}
          >
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 text-sm font-medium transition-colors relative ${
                  activeTab === tab.id
                    ? theme === 'dark'
                      ? 'text-blue-400 border-b-2 border-blue-400'
                      : 'text-blue-600 border-b-2 border-blue-600'
                    : theme === 'dark'
                    ? 'text-gray-400 hover:text-gray-300'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {tab.label}
                <span
                  className={`ml-2 px-2 py-0.5 text-xs rounded-full ${
                    activeTab === tab.id
                      ? theme === 'dark'
                        ? 'bg-blue-900 text-blue-300'
                        : 'bg-blue-100 text-blue-700'
                      : theme === 'dark'
                      ? 'bg-gray-700 text-gray-400'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {counts[tab.countKey]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Content Area */}
        <div className="mt-4">
          {activeTab === 'interconsultas' && (
            <InterconsultasViewer
              key={refreshKey}
              onPatientUpdated={handlePatientUpdated}
            />
          )}
          {activeTab === 'pase_sala' && (
            <PaseSalaViewer
              key={refreshKey}
              onPatientUpdated={handlePatientUpdated}
            />
          )}
          {activeTab === 'post_alta' && (
            <PostAltaViewer
              key={refreshKey}
              onPatientUpdated={handlePatientUpdated}
            />
          )}
        </div>
      </main>
    </div>
  );
}
