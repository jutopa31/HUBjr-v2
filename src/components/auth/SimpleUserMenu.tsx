import React, { useState } from 'react';
import ReactDOM from 'react-dom';
import { User } from 'lucide-react';
import { useAuthContext } from './AuthProvider';
import AuthModal from './AuthModal';

function SimpleUserMenu() {
  const { user, signOut, loading } = useAuthContext();
  const [showAuthModal, setShowAuthModal] = useState(false);

  const openLogin = () => {
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