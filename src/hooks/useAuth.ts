import React, { useState, useEffect, useCallback } from 'react';
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

  // Guard to prevent duplicate auth initialization
  const authInitialized = React.useRef(false);

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
      // Add timeout to prevent privilege check from hanging
      const privilegeCheckPromise = (async () => {
        const userEmail = user.email!; // Already checked above

        // Check for specific admin privileges - ALL IN PARALLEL
        const privilegeTypes: AdminPrivilegeType[] = [
          'hospital_context_access',
          'full_admin',
          'lumbar_puncture_admin',
          'scale_management',
          'user_management'
        ];

        // Execute ALL privilege checks in parallel using Promise.all
        const privilegeChecks = await Promise.all(
          privilegeTypes.map(async (privilegeType) => {
            const result = await hasAdminPrivilege(userEmail, privilegeType);
            return {
              type: privilegeType,
              hasPrivilege: result.success && result.hasPrivilege
            };
          })
        );

        // Extract privileges that returned true
        const userPrivileges: AdminPrivilegeType[] = privilegeChecks
          .filter(check => check.hasPrivilege)
          .map(check => check.type);

        // Check if user has hospital_context_access or full_admin
        const hasContextAccess = userPrivileges.includes('hospital_context_access') ||
                                 userPrivileges.includes('full_admin');

        return {
          hasHospitalContextAccess: hasContextAccess,
          privileges: userPrivileges
        };
      })();

      // Race between privilege check and 15-second timeout (increased to account for parallel calls)
      const timeoutPromise = new Promise<{ hasHospitalContextAccess: boolean; privileges: AdminPrivilegeType[] }>((_, reject) =>
        setTimeout(() => reject(new Error('Privilege check timeout')), 15000)
      );

      const result = await Promise.race([privilegeCheckPromise, timeoutPromise]);

      setState(prev => ({
        ...prev,
        hasHospitalContextAccess: result.hasHospitalContextAccess,
        privileges: result.privileges
      }));

    } catch (error) {
      console.error('Error checking user privileges:', error);
      // Set default values on error or timeout
      setState(prev => ({
        ...prev,
        hasHospitalContextAccess: false,
        privileges: []
      }));
    }
  }, []);

  useEffect(() => {
    // Prevent duplicate initialization
    if (authInitialized.current) return;
    authInitialized.current = true;

    console.log('[useAuth] Initializing auth (SessionGuard already validated)...');

    // Emergency timeout to prevent loading bootloop
    const emergencyTimeout = setTimeout(() => {
      console.error('[useAuth] EMERGENCY: getSession timeout after 5 seconds, setting loading to false');
      setState(prev => ({
        ...prev,
        loading: false,
        error: 'Session load timeout'
      }));
    }, 5000);

    // Get initial session (already validated by SessionGuard)
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      clearTimeout(emergencyTimeout);
      if (error) {
        console.warn('[useAuth] Session error (should have been caught by SessionGuard):', error.message);
        // Set to clean state
        setState({
          session: null,
          user: null,
          error: null,
          loading: false,
          hasHospitalContextAccess: false,
          privileges: []
        });
      } else {
        console.log('[useAuth] Session loaded, user:', session?.user?.email || 'none');
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
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('[useAuth] Auth state changed:', event, 'user:', session?.user?.email || 'none');

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

    return () => {
      clearTimeout(emergencyTimeout);
      subscription.unsubscribe();
    };
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