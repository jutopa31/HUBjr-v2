import React, { useState } from 'react';
import { User, Shield } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import AuthModal from './AuthModal';

function SimpleUserMenu() {
  const { user, signOut, hasMFA, loading } = useAuthContext();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authModalView, setAuthModalView] = useState<'login' | 'mfa'>('login');

  const openMFASetup = () => {
    setAuthModalView('mfa');
    setShowAuthModal(true);
  };

  const openLogin = () => {
    setAuthModalView('login');
    setShowAuthModal(true);
  };

  if (loading) {
    return (
      <div className="w-full p-3 bg-gray-100 rounded-lg">
        <p className="text-sm text-gray-600">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <button
          onClick={openLogin}
          className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
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

  // User is logged in - show user info and MFA option
  return (
    <>
      <div className="w-full space-y-3">
        {/* User Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center mb-2">
            <User className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">
              {user.email}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-xs text-blue-700">
              MFA: {hasMFA ? 'Activo' : 'Inactivo'}
            </span>
            {hasMFA && (
              <Shield className="h-4 w-4 text-green-600" />
            )}
          </div>
        </div>

        {/* MFA Setup Button - Temporarily disabled */}
        <div className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium rounded-lg text-gray-500 bg-gray-100 border border-gray-300">
          <Shield className="h-4 w-4 mr-2" />
          MFA (En desarrollo)
        </div>

        {/* Sign Out Button */}
        <button
          onClick={signOut}
          className="w-full px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
        >
          Cerrar Sesión
        </button>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        initialView={authModalView}
      />
    </>
  );
}

export default SimpleUserMenu;