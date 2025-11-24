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
    <div className="modal-overlay z-[60]">
      <div className="modal-content relative w-full max-w-md max-h-[90vh] my-8 p-0">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute -top-2 -right-2 z-[70] p-2 bg-[var(--bg-primary)] rounded-full shadow-lg hover:bg-[var(--bg-secondary)]"
        >
          <X className="h-5 w-5 text-[var(--text-secondary)]" />
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
