import React, { useState } from 'react';
import useEscapeKey from '../../hooks/useEscapeKey';
import { X } from 'lucide-react';
import LoginForm from './LoginForm';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
}

function AuthModal({ isOpen, onClose }: AuthModalProps) {
  const [showSignUp, setShowSignUp] = useState(false);

  useEscapeKey(onClose, isOpen);

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
        <LoginForm
          onSuccess={handleSuccess}
          onToggleMode={handleToggleMode}
          showSignUp={showSignUp}
        />
      </div>
    </div>
  );
}

export default AuthModal;
