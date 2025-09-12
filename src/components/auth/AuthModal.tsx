import React, { useState } from 'react';
import { X, Shield } from 'lucide-react';
import LoginForm from './LoginForm';
import MFASetup from './MFASetup';
import { useAuthContext } from './AuthProvider';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialView?: 'login' | 'mfa';
}

function AuthModal({ isOpen, onClose, initialView = 'login' }: AuthModalProps) {
  const { user } = useAuthContext();
  const [view, setView] = useState<'login' | 'signup' | 'mfa'>(initialView);
  const [showSignUp, setShowSignUp] = useState(false);

  // Update view when initialView changes (for switching between login and MFA)
  React.useEffect(() => {
    if (isOpen) {
      setView(initialView);
    }
  }, [initialView, isOpen]);

  if (!isOpen) return null;

  const handleSuccess = () => {
    onClose();
  };

  const handleToggleMode = () => {
    setShowSignUp(!showSignUp);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60] p-4 overflow-y-auto">
      <div className="relative w-full max-w-md max-h-[90vh] my-8">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-[70] p-2 bg-white rounded-full shadow-lg hover:bg-gray-50"
        >
          <X className="h-5 w-5 text-gray-500" />
        </button>

        {/* Content */}
        {view === 'mfa' || (user && initialView === 'mfa') ? (
          <MFASetup onClose={onClose} />
        ) : (
          <LoginForm
            onSuccess={handleSuccess}
            onToggleMode={handleToggleMode}
            showSignUp={showSignUp}
          />
        )}

        {/* Switch to MFA setup if logged in and not already in MFA view */}
        {user && view !== 'mfa' && initialView !== 'mfa' && (
          <div className="mt-4 text-center">
            <button
              onClick={() => setView('mfa')}
              className="inline-flex items-center text-sm text-blue-600 hover:text-blue-800"
            >
              <Shield className="h-4 w-4 mr-1" />
              Configurar MFA
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default AuthModal;