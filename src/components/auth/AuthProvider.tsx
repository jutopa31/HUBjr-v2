import React, { createContext, useContext } from 'react';
import { useAuth, AuthState, MFAFactors } from '../../hooks/useAuth';

interface AuthContextType extends AuthState {
  mfaFactors: MFAFactors[];
  hasMFA: boolean;
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  enrollMFA: () => Promise<any>;
  verifyMFA: (factorId: string, code: string, challengeId?: string) => Promise<any>;
  verifyMFAEnrollment: (factorId: string, code: string) => Promise<any>;
  unenrollMFA: (factorId: string) => Promise<any>;
  challengeMFA: (factorId: string) => Promise<any>;
  verifyMFAChallenge: (factorId: string, challengeId: string, code: string) => Promise<any>;
  refreshMFAFactors: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  return (
    <AuthContext.Provider value={auth}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}