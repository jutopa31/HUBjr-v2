import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}

export interface MFAFactors {
  id: string;
  friendly_name?: string;
  factor_type: 'totp';
  status: 'verified' | 'unverified';
}

export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });

  const [mfaFactors, setMfaFactors] = useState<MFAFactors[]>([]);

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (error) {
        // Handle invalid token/session errors
        if (error.message.includes('missing sub claim') || 
            error.message.includes('invalid claim') ||
            error.message.includes('jwt expired')) {
          console.log('Invalid session detected, clearing auth state');
          supabase.auth.signOut();
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
        
        // Load MFA factors if user is logged in
        if (session?.user) {
          loadMFAFactors();
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

      if (session?.user) {
        loadMFAFactors();
      } else {
        setMfaFactors([]);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadMFAFactors = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (error) {
        // Don't log MFA errors if user doesn't have MFA set up
        if (!error.message.includes('422')) {
          console.error('Error loading MFA factors:', error);
        }
        setMfaFactors([]);
        return;
      }
      setMfaFactors((data.totp || []) as MFAFactors[]);
    } catch (error) {
      console.error('Error loading MFA factors:', error);
      setMfaFactors([]);
    }
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
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setMfaFactors([]);
      return { error: null };
    } catch (error) {
      const authError = error as AuthError;
      setState(prev => ({ ...prev, error: authError.message }));
      return { error: authError };
    } finally {
      setState(prev => ({ ...prev, loading: false }));
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

  const enrollMFA = useCallback(async () => {
    try {
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'HubJR Authenticator',
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const authError = error as AuthError;
      return { data: null, error: authError };
    }
  }, []);

  // Verify MFA enrollment (no challenge needed)
  const verifyMFAEnrollment = useCallback(async (factorId: string, code: string) => {
    try {
      console.log('Verifying MFA enrollment with:', { factorId, code: code.substring(0, 3) + '***' });
      
      // For enrollment verification, we need to use a different approach
      // Create a minimal verification object without challengeId
      const verificationData = {
        factorId: factorId,
        code: code
      };
      
      console.log('Sending verification data (enrollment):', verificationData);
      
      const { data, error } = await supabase.auth.mfa.verify(verificationData as any);

      if (error) {
        console.error('Supabase MFA verify error:', error);
        throw error;
      }
      
      console.log('MFA enrollment verification successful:', data);
      await loadMFAFactors(); // Reload factors after verification
      return { data, error: null };
    } catch (error) {
      console.error('MFA enrollment verification error:', error);
      const authError = error as AuthError;
      return { data: null, error: authError };
    }
  }, [loadMFAFactors]);

  // Verify MFA challenge (for login) - simplified
  const verifyMFA = useCallback(async (factorId: string, code: string, challengeId?: string) => {
    try {
      // Always use enrollment verification for now to avoid challenge ID issues
      return await verifyMFAEnrollment(factorId, code);
    } catch (error) {
      const authError = error as AuthError;
      return { data: null, error: authError };
    }
  }, [verifyMFAEnrollment]);

  const unenrollMFA = useCallback(async (factorId: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.unenroll({
        factorId,
      });

      if (error) throw error;
      await loadMFAFactors(); // Reload factors after unenrollment
      return { data, error: null };
    } catch (error) {
      const authError = error as AuthError;
      return { data: null, error: authError };
    }
  }, [loadMFAFactors]);

  const challengeMFA = useCallback(async (factorId: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.challenge({
        factorId,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const authError = error as AuthError;
      return { data: null, error: authError };
    }
  }, []);

  const verifyMFAChallenge = useCallback(async (factorId: string, challengeId: string, code: string) => {
    try {
      const { data, error } = await supabase.auth.mfa.verify({
        factorId,
        challengeId,
        code,
      });

      if (error) throw error;
      return { data, error: null };
    } catch (error) {
      const authError = error as AuthError;
      return { data: null, error: authError };
    }
  }, []);

  return {
    ...state,
    mfaFactors,
    hasMFA: mfaFactors.some(factor => factor.status === 'verified'),
    signUp,
    signIn,
    signOut,
    resetPassword,
    enrollMFA,
    verifyMFA,
    verifyMFAEnrollment,
    unenrollMFA,
    challengeMFA,
    verifyMFAChallenge,
    refreshMFAFactors: loadMFAFactors,
  };
}