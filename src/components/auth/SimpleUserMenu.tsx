import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { User, Trash2 } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import AuthModal from './AuthModal';
import { forceLogout } from '../../utils/supabase';

function SimpleUserMenu() {
  const { user, signOut, loading } = useAuthContext();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const openLogin = () => {
    setShowAuthModal(true);
  };

  const clearCacheAndReload = async () => {
    if (window.confirm('¿Limpiar todo el cache y recargar? Esto cerrará tu sesión.')) {
      await forceLogout();
    }
  };

  const isDevelopment = typeof window !== 'undefined' && window.location.hostname === 'localhost';

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
        <div className="w-full space-y-2">
          <button
            onClick={openLogin}
            className="w-full flex items-center justify-center px-4 py-3 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700"
          >
            <User className="h-4 w-4 mr-2" />
            Iniciar Sesión
          </button>

          {isDevelopment && (
            <button
              onClick={clearCacheAndReload}
              className="w-full flex items-center justify-center px-3 py-2 text-xs text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50"
              title="Limpiar cache de autenticación (solo desarrollo)"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Limpiar Cache
            </button>
          )}
        </div>

        {showAuthModal && ReactDOM.createPortal(
          <AuthModal
            isOpen={showAuthModal}
            onClose={() => setShowAuthModal(false)}
          />,
          document.body
        )}
      </>
    );
  }

  // User is logged in - show user info
  return (
    <>
      <div className="w-full space-y-3">
        {/* User Info */}
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-center">
            <User className="h-4 w-4 text-blue-600 mr-2" />
            <span className="text-sm font-medium text-blue-900">
              {user.email}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={signOut}
          className="w-full px-4 py-2 text-sm text-red-600 border border-red-300 rounded-lg hover:bg-red-50"
        >
          Cerrar Sesión
        </button>

        {/* Debug button for development */}
        {isDevelopment && (
          <button
            onClick={clearCacheAndReload}
            className="w-full px-3 py-2 text-xs text-orange-600 border border-orange-300 rounded-lg hover:bg-orange-50"
            title="Limpiar cache de autenticación (solo desarrollo)"
          >
            <Trash2 className="h-3 w-3 mr-1 inline" />
            Limpiar Cache
          </button>
        )}
      </div>

      {showAuthModal && ReactDOM.createPortal(
        <AuthModal
          isOpen={showAuthModal}
          onClose={() => setShowAuthModal(false)}
        />,
        document.body
      )}
    </>
  );
}

export default SimpleUserMenu;