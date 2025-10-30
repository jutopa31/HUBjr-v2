import React, { useMemo, useState } from 'react';
import SimplifiedDashboard from './components/v3/dashboard/SimplifiedDashboard';
import UnifiedPatients from './components/v3/patients/UnifiedPatients';
import ResourcesHub from './components/v3/resources/ResourcesHub';
import AdminSection from './components/v3/admin/AdminSection';
import { DEFAULT_HOSPITAL_CONTEXT } from './services/hospitalContextService';
import type { HospitalContext } from './types';

type SectionKey = 'dashboard' | 'patients' | 'resources' | 'admin';

const NAV_ITEMS: Array<{ id: SectionKey; label: string }> = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'patients', label: 'Pacientes' },
  { id: 'resources', label: 'Recursos' },
  { id: 'admin', label: 'Admin' }
];

const NeurologyResidencyHubV3: React.FC = () => {
  const [activeSection, setActiveSection] = useState<SectionKey>('dashboard');
  const [hospitalContext] = useState<HospitalContext>(DEFAULT_HOSPITAL_CONTEXT);

  const sectionContent = useMemo(() => {
    switch (activeSection) {
      case 'patients':
        return <UnifiedPatients hospitalContext={hospitalContext} />;
      case 'resources':
        return <ResourcesHub hospitalContext={hospitalContext} />;
      case 'admin':
        return <AdminSection hospitalContext={hospitalContext} />;
      default:
        return <SimplifiedDashboard onNavigate={setActiveSection} hospitalContext={hospitalContext} />;
    }
  }, [activeSection, hospitalContext]);

  return (
    <div className="flex min-h-screen flex-col" style={{ backgroundColor: 'var(--bg-primary)', color: 'var(--text-primary)' }}>
      <header className="sticky top-0 z-10 backdrop-blur" style={{ borderBottom: '1px solid var(--border-primary)', backgroundColor: 'color-mix(in srgb, var(--bg-primary) 85%, transparent)' }}>
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-4 p-6">
          <div className="flex flex-col gap-1">
            <h1 className="text-3xl font-semibold">HubJR v3 Simplified</h1>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
              Early skeleton. Navigation is functional while views are implemented iteratively.
            </p>
          </div>
          <nav className="flex flex-wrap items-center gap-2">
            {NAV_ITEMS.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => setActiveSection(item.id)}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm transition ${activeSection === item.id ? 'btn-accent' : 'btn-soft'}`}
              >
                {item.label}
              </button>
            ))}
          </nav>
        </div>
      </header>
      <main className="flex flex-1 justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
        <div className="flex w-full max-w-6xl flex-1 flex-col gap-6 p-6">{sectionContent}</div>
      </main>
    </div>
  );
};

export default NeurologyResidencyHubV3;
