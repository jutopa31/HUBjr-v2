import React, { useState } from 'react';
import { User, Settings, Shield, LogOut, ChevronDown } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import AuthModal from './AuthModal';

function UserMenu() {
  const { user, signOut, hasMFA, loading } = useAuthContext();
  const [isOpen, setIsOpen] = useState(false);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'mfa'>('login');

  const handleSignOut = async () => {
    await signOut();
    setIsOpen(false);
  };

  const openMFASetup = () => {
    setAuthModalView('mfa');
    setShowAuthModal(true);
    setIsOpen(false);
  };

  const openLogin = () => {
    setAuthModalView('login');
    setShowAuthModal(true);
    setIsOpen(false);
  };

  if (!user) {
    return (
      <>
        <button
          onClick={openLogin}
          disabled={loading}
          className="flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
        >
          <User className="h-4 w-4 mr-2" />
          Iniciar Sesión
        </button>
        
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          initialView={authModalView}
        />
      </>
    );
  }

  const userDisplayName = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Usuario';
  const userRole = user.user_metadata?.role || 'Usuario';

  return (
    <>
      <div className="relative">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50"
        >
          <div className="flex items-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mr-3">
              <User className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-left">
              <p className="text-sm font-medium text-gray-900">{userDisplayName}</p>
              <p className="text-xs text-gray-500 capitalize">{userRole}</p>
            </div>
          </div>
          <ChevronDown className="h-4 w-4 ml-2 text-gray-400" />
        </button>

        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Menu */}
            <div className="absolute right-0 mt-2 w-64 sm:w-72 bg-white rounded-lg shadow-lg border border-gray-200 z-50 max-h-screen overflow-y-auto" 
                 style={{
                   maxHeight: 'calc(100vh - 100px)',
                   right: '0',
                   transform: 'translateX(0)',
                   minWidth: '280px'
                 }}>
              <div className="py-2">
                {/* User Info */}
                <div className="px-4 py-3 border-b border-gray-100">
                  <div className="flex items-center">
                    <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full mr-3">
                      <User className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{userDisplayName}</p>
                      <p className="text-xs text-gray-500">{user.email}</p>
                      <div className="flex items-center mt-1">
                        <span className="text-xs text-gray-500 capitalize mr-2">{userRole}</span>
                        {hasMFA && (
                          <div className="flex items-center text-xs text-green-600">
                            <Shield className="h-3 w-3 mr-1" />
                            MFA Activo
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="py-1">
                  <button
                    onClick={openMFASetup}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Shield className="h-4 w-4 mr-3" />
                    <div className="flex-1 text-left">
                      <div className="flex items-center justify-between">
                        <span>Autenticación 2FA</span>
                        {!hasMFA && (
                          <span className="text-xs text-orange-600 bg-orange-100 px-2 py-0.5 rounded-full">
                            Configurar
                          </span>
                        )}
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      setIsOpen(false);
                      // Future: Open settings modal
                    }}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    <Settings className="h-4 w-4 mr-3" />
                    Configuración
                  </button>
                </div>

                {/* Sign Out */}
                <div className="py-1 border-t border-gray-100">
                  <button
                    onClick={handleSignOut}
                    disabled={loading}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    <LogOut className="h-4 w-4 mr-3" />
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView={authModalView}
      />
    </>
  );
}

export default UserMenu;