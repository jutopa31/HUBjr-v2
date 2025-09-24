import React, { useState } from 'react';
import { Home, Users, BookOpen, Settings, Menu, X } from 'lucide-react';
import { HospitalContext } from './types';
import AdminAuthModal from './AdminAuthModal';
import { ProtectedRoute } from './components/auth';
import SimpleUserMenu from './components/auth/SimpleUserMenu';
import HospitalContextSelector from './HospitalContextSelector';
import SimplifiedDashboard from './SimplifiedDashboard';
import UnifiedPatients from './UnifiedPatients';
import ResourcesHub from './ResourcesHub';
import EventManagerSupabase from './EventManagerSupabase';
import AcademiaManager from './AcademiaManager';

const NeurologyResidencyHub = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [currentHospitalContext, setCurrentHospitalContext] = useState<HospitalContext>('Posadas');

  // Function to handle tab changes and close sidebar on mobile
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
    setSidebarOpen(false);
  };

  const menuItems = [
    { id: 'dashboard', icon: Home, label: 'Dashboard' },
    { id: 'patients', icon: Users, label: 'Pacientes' },
    { id: 'resources', icon: BookOpen, label: 'Recursos' },
    { id: 'admin', icon: Settings, label: 'Administración' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return (
          <SimplifiedDashboard
            onNavigate={handleTabChange}
            hospitalContext={currentHospitalContext}
          />
        );
      case 'patients':
        return (
          <UnifiedPatients
            hospitalContext={currentHospitalContext}
          />
        );
      case 'resources':
        return (
          <ResourcesHub
            onNavigate={handleTabChange}
          />
        );
      case 'admin':
        return (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">Administración</h1>
              <HospitalContextSelector
                currentContext={currentHospitalContext}
                onContextChange={setCurrentHospitalContext}
                isAdminMode={isAdminMode}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Cronograma y Eventos</h2>
                <EventManagerSupabase />
              </div>

              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold mb-4">Academia</h2>
                <AcademiaManager isAdminMode={isAdminMode} />
              </div>
            </div>
          </div>
        );
      default:
        return (
          <SimplifiedDashboard
            onNavigate={handleTabChange}
            hospitalContext={currentHospitalContext}
          />
        );
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50 flex">
        {/* Mobile sidebar overlay */}
        {sidebarOpen && (
          <div
            className="fixed inset-0 z-20 bg-black bg-opacity-50 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <div className={`
          fixed inset-y-0 left-0 z-30 w-64 bg-white shadow-lg transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}>
          <div className="flex items-center justify-between h-16 px-6 border-b border-gray-200">
            <div className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-sm">H</span>
              </div>
              <span className="text-xl font-bold text-gray-900">HubJR v3</span>
            </div>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <nav className="mt-6 px-4 space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleTabChange(item.id)}
                  className={`w-full flex items-center space-x-3 px-3 py-3 text-left rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-blue-50 text-blue-700 border-r-2 border-blue-700'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <Icon className="h-5 w-5" />
                  <span className="font-medium">{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* User Menu at bottom of sidebar */}
          <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200">
            <SimpleUserMenu />
          </div>
        </div>

        {/* Main content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Top header */}
          <header className="bg-white shadow-sm border-b border-gray-200 lg:hidden">
            <div className="flex items-center justify-between h-16 px-4">
              <button
                onClick={() => setSidebarOpen(true)}
                className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <Menu className="h-6 w-6" />
              </button>
              <div className="flex items-center space-x-2">
                <div className="w-6 h-6 bg-gradient-to-r from-blue-500 to-indigo-600 rounded flex items-center justify-center">
                  <span className="text-white font-bold text-xs">H</span>
                </div>
                <span className="font-bold text-gray-900">HubJR v3</span>
              </div>
              <div className="w-10" /> {/* Spacer for centering */}
            </div>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-y-auto">
            {renderContent()}
          </main>
        </div>

        {/* Admin Modal */}
        {showAuthModal && (
          <AdminAuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
            onAuthenticate={() => {
              setIsAdminMode(true);
              setShowAuthModal(false);
            }}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default NeurologyResidencyHub;