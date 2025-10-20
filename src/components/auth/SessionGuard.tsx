import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../utils/supabase';

interface SessionGuardProps {
  children: React.ReactNode;
}

/**
 * SessionGuard - Proactive stale session detection and cleanup
 *
 * This component prevents bootloops by:
 * 1. Validating the session BEFORE rendering any app components
 * 2. Detecting and clearing stale/invalid JWT tokens automatically
 * 3. Ensuring components never receive corrupted auth state
 *
 * HOW IT PREVENTS BOOTLOOPS:
 * - Checks session validity at app startup
 * - Clears invalid sessions synchronously
 * - Only allows app to render after auth state is confirmed clean
 * - Prevents race conditions between session clearing and component loading
 */
export function SessionGuard({ children }: SessionGuardProps) {
  const [isValidating, setIsValidating] = useState(true);
  const [validationError, setValidationError] = useState<string | null>(null);
  const hasValidated = useRef(false);

  useEffect(() => {
    // Only validate once on mount
    if (hasValidated.current) return;
    hasValidated.current = true;

    const validateSession = async () => {
      console.log('[SessionGuard] Starting session validation...');

      try {
        // Get current session
        const { data: { session }, error } = await supabase.auth.getSession();

        // Check for invalid session errors
        if (error) {
          const errorMessage = error.message.toLowerCase();

          // Detect stale/invalid session errors
          const isStaleSession =
            errorMessage.includes('missing sub claim') ||
            errorMessage.includes('invalid claim') ||
            errorMessage.includes('jwt expired') ||
            errorMessage.includes('invalid jwt') ||
            errorMessage.includes('malformed') ||
            errorMessage.includes('invalid token');

          if (isStaleSession) {
            console.warn('[SessionGuard] Stale session detected:', error.message);
            console.log('[SessionGuard] Clearing stale session...');

            // Clear the stale session synchronously
            await supabase.auth.signOut({ scope: 'local' });

            // Clear any remaining tokens in localStorage
            if (typeof window !== 'undefined') {
              Object.keys(localStorage).forEach(key => {
                if (key.startsWith('supabase.auth.token')) {
                  localStorage.removeItem(key);
                  console.log('[SessionGuard] Removed stale token:', key);
                }
              });
            }

            console.log('[SessionGuard] Stale session cleared successfully');
            setValidationError(null);
          } else {
            // Non-session related error
            console.error('[SessionGuard] Session validation error:', error);
            setValidationError(error.message);
          }
        } else if (session) {
          // Session exists, validate it's not expired
          const expiresAt = session.expires_at;
          const now = Math.floor(Date.now() / 1000);

          if (expiresAt && expiresAt < now) {
            console.warn('[SessionGuard] Session expired, clearing...');
            await supabase.auth.signOut({ scope: 'local' });
            console.log('[SessionGuard] Expired session cleared');
          } else {
            console.log('[SessionGuard] Valid session found:', session.user?.email);
          }
        } else {
          console.log('[SessionGuard] No session found (clean state)');
        }

        // Session validation complete
        console.log('[SessionGuard] Validation complete, allowing app to render');
        setIsValidating(false);

      } catch (err) {
        console.error('[SessionGuard] Unexpected error during validation:', err);

        // On unexpected error, try to clear everything and start fresh
        try {
          await supabase.auth.signOut({ scope: 'local' });
          console.log('[SessionGuard] Cleared session after unexpected error');
        } catch (clearError) {
          console.error('[SessionGuard] Failed to clear session:', clearError);
        }

        // Allow app to render anyway (better than staying stuck)
        setIsValidating(false);
        setValidationError('Error validating session');
      }
    };

    // Start validation
    validateSession();
  }, []);

  // Show loading state while validating
  if (isValidating) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
          <p className="text-gray-600 text-lg font-medium">Verificando sesión...</p>
          <p className="text-gray-500 text-sm mt-2">Esto solo toma un momento</p>
        </div>
      </div>
    );
  }

  // Show error if validation failed (but still render app)
  if (validationError) {
    console.warn('[SessionGuard] Rendering app despite validation error:', validationError);
  }

  // Validation complete, render app
  return <>{children}</>;
}
