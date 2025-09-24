import React, { createContext, useContext } from 'react';
import { useAuth, AuthState } from '../../hooks/useAuth';
import { AdminPrivilegeType } from '../../utils/diagnosticAssessmentDB';

interface AuthContextType extends AuthState {
  signUp: (email: string, password: string, metadata?: Record<string, any>) => Promise<any>;
  signIn: (email: string, password: string) => Promise<any>;
  signOut: () => Promise<any>;
  resetPassword: (email: string) => Promise<any>;
  hasPrivilege: (privilegeType: AdminPrivilegeType) => boolean;
  refreshPrivileges: () => Promise<void>;
  checkUserPrivileges: (user: any) => Promise<void>;
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