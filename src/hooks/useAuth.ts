import React, { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase, forceLogout } from '../utils/supabase';
import { AdminPrivilegeType } from '../utils/diagnosticAssessmentDB';

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

  // Privilege cache to avoid redundant checks
  const privilegeCache = React.useRef<{
    email: string | null;
    privileges: AdminPrivilegeType[];
    hasHospitalContextAccess: boolean;
    timestamp: number;
  }>({
    email: null,
    privileges: [],
    hasHospitalContextAccess: false,
    timestamp: 0
  });

  // Debounce timer for privilege checks
  const privilegeCheckTimer = React.useRef<NodeJS.Timeout | null>(null);

  // Function to check and update user privileges - OPTIMIZED VERSION with CACHING
  const checkUserPrivileges = useCallback(async (user: User | null) => {
    if (!user?.email) {
      setState(prev => ({
        ...prev,
        hasHospitalContextAccess: false,
        privileges: []
      }));
      privilegeCache.current = {
        email: null,
        privileges: [],
        hasHospitalContextAccess: false,
        timestamp: 0
      };
      return;
    }

    const userEmail = user.email;

    // Check cache first - if we checked this user in the last 5 minutes, use cached result
    const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes
    const now = Date.now();
    if (
      privilegeCache.current.email === userEmail &&
      now - privilegeCache.current.timestamp < CACHE_DURATION
    ) {
      console.log('[useAuth] Using cached privileges for', userEmail);
      setState(prev => ({
        ...prev,
        hasHospitalContextAccess: privilegeCache.current.hasHospitalContextAccess,
        privileges: privilegeCache.current.privileges
      }));
      return;
    }

    // Debounce: clear any pending check
    if (privilegeCheckTimer.current) {
      clearTimeout(privilegeCheckTimer.current);
    }

    // Debounce privilege checks by 500ms to avoid rapid-fire calls
    privilegeCheckTimer.current = setTimeout(async () => {
      try {
        console.log('[useAuth] Checking privileges for', userEmail);

        // Use the optimized RPC function that returns all privileges in a single call
        const privilegeCheckPromise = supabase
          .rpc('get_user_privileges_fast', { user_email_param: userEmail })
          .then(({ data, error }) => {
            if (error) {
              console.error('RPC error checking privileges:', error);
              return {
                hasHospitalContextAccess: false,
                privileges: [] as AdminPrivilegeType[]
              };
            }

            // Parse the response from the optimized function
            const privilegesArray = (data?.privileges || []) as AdminPrivilegeType[];
            const hasContextAccess = data?.hasHospitalContextAccess || false;

            return {
              hasHospitalContextAccess: hasContextAccess,
              privileges: privilegesArray
            };
          });

        // Reduced timeout from 15s to 5s since we're now making only 1 call
        const timeoutPromise = new Promise<{ hasHospitalContextAccess: boolean; privileges: AdminPrivilegeType[] }>((_, reject) =>
          setTimeout(() => reject(new Error('Privilege check timeout')), 5000)
        );

        const result = await Promise.race([privilegeCheckPromise, timeoutPromise]);

        // Update cache
        privilegeCache.current = {
          email: userEmail,
          privileges: result.privileges,
          hasHospitalContextAccess: result.hasHospitalContextAccess,
          timestamp: Date.now()
        };

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
    }, 500); // 500ms debounce
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

    // Track last user email to prevent duplicate checks
    let lastUserEmail: string | null = null;

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      const currentUserEmail = session?.user?.email || null;

      console.log('[useAuth] Auth state changed:', event, 'user:', currentUserEmail || 'none');

      setState(prev => ({
        ...prev,
        session,
        user: session?.user ?? null,
        loading: false,
      }));

      // Only check privileges if:
      // 1. User is signed in AND
      // 2. User email has changed OR event is not SIGNED_IN (to avoid redundant checks)
      if (session?.user) {
        // Skip privilege check for redundant SIGNED_IN events with same user
        if (event === 'SIGNED_IN' && currentUserEmail === lastUserEmail) {
          console.log('[useAuth] Skipping redundant privilege check for', currentUserEmail);
          return;
        }

        lastUserEmail = currentUserEmail;
        await checkUserPrivileges(session.user);
      } else {
        lastUserEmail = null;
        setState(prev => ({
          ...prev,
          hasHospitalContextAccess: false,
          privileges: []
        }));
      }
    });

    return () => {
      clearTimeout(emergencyTimeout);
      if (privilegeCheckTimer.current) {
        clearTimeout(privilegeCheckTimer.current);
      }
      subscription.unsubscribe();
    };
  }, [checkUserPrivileges]);


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
