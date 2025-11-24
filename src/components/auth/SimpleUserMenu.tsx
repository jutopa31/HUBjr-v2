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
      <div className="w-full p-2 bg-gray-100 dark:bg-[#2a2a2a] rounded-md">
        <p className="text-xs text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <div className="w-full space-y-1.5">
          <button
            onClick={openLogin}
            className="w-full flex items-center justify-center px-2 py-1.5 text-xs font-medium btn-accent rounded-md"
          >
            <User className="h-3 w-3 mr-1.5" />
            Iniciar
          </button>

          {isDevelopment && (
            <button
              onClick={clearCacheAndReload}
              className="w-full flex items-center justify-center px-2 py-1 text-xs rounded-md border"
              style={{
                color: 'var(--state-warning)',
                backgroundColor: 'color-mix(in srgb, var(--state-warning) 10%, var(--bg-primary) 90%)',
                borderColor: 'color-mix(in srgb, var(--state-warning) 30%, transparent)'
              }}
              title="Limpiar cache de autenticación (solo desarrollo)"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              Cache
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
      <div className="w-full space-y-1.5">
        {/* User Info */}
        <div className="p-2 bg-gray-100 dark:bg-[#2a2a2a] border border-gray-300 dark:border-gray-700 rounded-md">
          <div className="flex items-center">
            <User className="h-3 w-3 text-gray-600 dark:text-gray-400 mr-1.5 flex-shrink-0" />
            <span className="text-xs font-medium text-gray-900 dark:text-gray-200 truncate">
              {user.email}
            </span>
          </div>
        </div>

        {/* Sign Out Button */}
        <button
          onClick={signOut}
          className="w-full px-2 py-1.5 text-xs rounded-md border"
          style={{
            color: 'var(--state-error)',
            backgroundColor: 'color-mix(in srgb, var(--state-error) 10%, var(--bg-primary) 90%)',
            borderColor: 'color-mix(in srgb, var(--state-error) 30%, transparent)'
          }}
        >
          Cerrar
        </button>

        {/* Debug button for development */}
        {isDevelopment && (
          <button
            onClick={clearCacheAndReload}
            className="w-full px-2 py-1 text-xs rounded-md border"
            style={{
              color: 'var(--state-warning)',
              backgroundColor: 'color-mix(in srgb, var(--state-warning) 10%, var(--bg-primary) 90%)',
              borderColor: 'color-mix(in srgb, var(--state-warning) 30%, transparent)'
            }}
            title="Limpiar cache de autenticación (solo desarrollo)"
          >
            <Trash2 className="h-3 w-3 mr-1 inline" />
            Cache
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
