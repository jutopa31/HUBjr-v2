import { useState, useEffect, useCallback } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '../utils/supabase';

export interface AuthState {
  user: User | null;
  session: Session | null;
  loading: boolean;
  error: string | null;
}


export function useAuth() {
  const [state, setState] = useState<AuthState>({
    user: null,
    session: null,
    loading: true,
    error: null,
  });


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
      const { error } = await supabase.auth.signOut();
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



  return {
    ...state,
    signUp,
    signIn,
    signOut,
    resetPassword,
  };
}