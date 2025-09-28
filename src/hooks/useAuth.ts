import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, forceLogout } from '../utils/supabase';
import { hasAdminPrivilege, hasHospitalContextAccess, AdminPrivilegeType } from '../utils/diagnosticAssessmentDB';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
  hasHospitalContextAccess?: boolean;
  privileges?: AdminPrivilegeType[];
}


export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
    hasHospitalContextAccess: false,
    privileges: [],
  });

  // Function to check and update user privileges
  const checkUserPrivileges = useCallback(async (user: User | null) => {
    if (!user?.email) {
      setState(prev => ({
        ...prev,
        hasHospitalContextAccess: false,
        privileges: []
      }));
      return;
    }

    try {
      // Check hospital context access
      const contextAccess = await hasHospitalContextAccess(user.email);

      // Check for specific admin privileges
      const privilegeTypes: AdminPrivilegeType[] = [
        'hospital_context_access',
        'full_admin',
        'lumbar_puncture_admin',
        'scale_management',
        'user_management'
      ];

      const userPrivileges: AdminPrivilegeType[] = [];

      for (const privilegeType of privilegeTypes) {
        const privilege = await hasAdminPrivilege(user.email, privilegeType);
        if (privilege.success && privilege.hasPrivilege) {
          userPrivileges.push(privilegeType);
        }
      }

      setState(prev => ({
        ...prev,
        hasHospitalContextAccess: contextAccess.success ? contextAccess.hasAccess : false,
        privileges: userPrivileges
      }));

    } catch (error) {
      console.error('Error checking user privileges:', error);
      setState(prev => ({
        ...prev,
        hasHospitalContextAccess: false,
        privileges: []
      }));
    }
  }, []);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Handle invalid token/session errors
        if (error.message.includes('missing sub claim') || 
            error.message.includes('invalid claim') ||
            error.message.includes('jwt expired')) {
          console.log('Invalid session detected, clearing auth state');
          supabase.auth.signOut({ scope: 'local' });
          setState(prev => ({ ...prev, session: null, user: null, error: null, loading: false }));
        } else {
          setState(prev => ({ ...prev, error: error.message, loading: false }));
        }
      } else {
        setState(prev => ({
          ...prev,
          session,
          user: session?.user ?? null,
          loading: false,
        }));

        // Check user privileges after setting session
        if (session?.user) {
          checkUserPrivileges(session.user);
        }
      }
    });

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (_event, session) => {
      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));

      // Check user privileges when auth state changes
      if (session?.user) {
        await checkUserPrivileges(session.user);
      } else {
        setState(prev => ({
          ...prev,
          hasHospitalContextAccess: false,
          privileges: []
        }));
      }
    });

    return () => subscription.unsubscribe();
  }, []);


  const signUp = useCallback(async (email: string, password: string, metadata?: Record<string, any>) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError.message, loading: false }));
      return { data: null, error: authError };
    }
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError.message, loading: false }));
      return { data: null, error: authError };
    }
  }, []);

  const signOut = useCallback(async () => {
    setState(prev => ({ ...prev, loading: true, error: null }));

    try {
      // Check if we're dealing with cached/production environment
      const isProduction = process.env.NODE_ENV === 'production' ||
                          (typeof window !== 'undefined' && window.location.hostname !== 'localhost');

      if (isProduction) {
        console.log('Production logout: using comprehensive cache clearing');
        // Use the enhanced force logout to clear ALL browser storage
        await forceLogout();
        return { error: null };
      } else {
        // Local development - try API logout first
        try {
          const { error } = await supabase.auth.signOut({ scope: 'local' });
          if (error) {
            console.warn('Local API logout failed, using force logout:', error);
            await forceLogout();
          }
          return { error: null };
        } catch (apiError) {
          console.warn('Local logout completely failed, using force logout:', apiError);
          await forceLogout();
          return { error: null };
        }
      }
    } catch (error) {
      console.error('Logout error, using force logout as ultimate fallback:', error);
      // Ultimate fallback: force logout clears everything
      await forceLogout();
      return { error: null };
    }
  }, []);

  const resetPassword = useCallback(async (email: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });

      if (error) throw error;
      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError.message }));
      return { error: authError };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
    }
  }, []);

  // Helper function to check if user has a specific privilege
  const hasPrivilege = useCallback((privilegeType: AdminPrivilegeType): boolean => {
    return state.privileges?.includes(privilegeType) ?? false;
  }, [state.privileges]);

  // Helper function to refresh privileges
  const refreshPrivileges = useCallback(async () => {
    if (state.user) {
      await checkUserPrivileges(state.user);
    }
  }, [state.user, checkUserPrivileges]);

  return {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
    hasPrivilege,
    refreshPrivileges,
    checkUserPrivileges,
  };
}