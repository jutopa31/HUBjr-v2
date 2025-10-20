import React, { useEffect, useState, useRef } from 'react';
import { RefreshCw } from 'lucide-react';

interface LoadingWithRecoveryProps {
  /** Current loading state */
  isLoading: boolean;
  /** Function to call when user clicks "Reload" */
  onRetry: () => void;
  /** Custom loading message (default: "Cargando...") */
  loadingMessage?: string;
  /** Timeout in ms before showing recovery button (default: 15000 / 15s) */
  recoveryTimeout?: number;
  /** Children to render when not loading */
  children: React.ReactNode;
}

/**
 * LoadingWithRecovery - Smart loading component with stuck detection
 *
 * Prevents bootloops by detecting when loading state is stuck and offering
 * manual recovery option to the user.
 *
 * Features:
 * - Shows loading spinner initially
 * - After timeout, shows "Reload" button for manual recovery
 * - Logs warnings to console for debugging
 * - Resets timer when loading completes
 *
 * @example
 * <LoadingWithRecovery
 *   isLoading={loading}
 *   onRetry={() => loadData()}
 *   loadingMessage="Cargando pacientes..."
 * >
 *   <PatientList patients={patients} />
 * </LoadingWithRecovery>
 */
export function LoadingWithRecovery({
  isLoading,
  onRetry,
  loadingMessage = 'Cargando...',
  recoveryTimeout = 15000, // 15 seconds
  children
}: LoadingWithRecoveryProps) {
  const [showRecovery, setShowRecovery] = useState(false);
  const [elapsedTime, setElapsedTime] = useState(0);
  const loadingStartTime = useRef<number | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const elapsedTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (isLoading) {
      // Start loading timer
      if (!loadingStartTime.current) {
        loadingStartTime.current = Date.now();
        console.log('[LoadingWithRecovery] Loading started');
      }

      // Timer to show recovery button
      timerRef.current = setTimeout(() => {
        const elapsed = Date.now() - (loadingStartTime.current || 0);
        console.warn(
          `[LoadingWithRecovery] Loading stuck for ${elapsed}ms, showing recovery button`
        );
        setShowRecovery(true);
      }, recoveryTimeout);

      // Timer to update elapsed time (for display)
      elapsedTimerRef.current = setInterval(() => {
        if (loadingStartTime.current) {
          const elapsed = Math.floor((Date.now() - loadingStartTime.current) / 1000);
          setElapsedTime(elapsed);
        }
      }, 1000);

    } else {
      // Loading completed, reset everything
      if (loadingStartTime.current) {
        const totalTime = Date.now() - loadingStartTime.current;
        console.log(`[LoadingWithRecovery] Loading completed in ${totalTime}ms`);
      }

      loadingStartTime.current = null;
      setShowRecovery(false);
      setElapsedTime(0);

      if (timerRef.current) {
        clearTimeout(timerRef.current);
        timerRef.current = null;
      }

      if (elapsedTimerRef.current) {
        clearInterval(elapsedTimerRef.current);
        elapsedTimerRef.current = null;
      }
    }

    // Cleanup on unmount
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      if (elapsedTimerRef.current) clearInterval(elapsedTimerRef.current);
    };
  }, [isLoading, recoveryTimeout]);

  // Not loading - render children
  if (!isLoading) {
    return <>{children}</>;
  }

  // Loading - show spinner or recovery UI
  return (
    <div className="flex items-center justify-center min-h-64 p-6">
      <div className="text-center max-w-md">
        {/* Loading Spinner */}
        {!showRecovery && (
          <>
            <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mb-4"></div>
            <p className="text-gray-600 text-lg font-medium">{loadingMessage}</p>
            <p className="text-gray-500 text-sm mt-2">{elapsedTime}s</p>
          </>
        )}

        {/* Recovery UI */}
        {showRecovery && (
          <>
            <div className="mb-4">
              <RefreshCw className="h-12 w-12 text-yellow-500 mx-auto mb-2" />
              <p className="text-gray-700 text-lg font-medium mb-2">
                La carga está tardando más de lo esperado
              </p>
              <p className="text-gray-500 text-sm">
                Han pasado {elapsedTime} segundos. Puedes intentar recargar los datos.
              </p>
            </div>

            <button
              onClick={() => {
                console.log('[LoadingWithRecovery] User initiated manual retry');
                setShowRecovery(false);
                loadingStartTime.current = null;
                onRetry();
              }}
              className="inline-flex items-center space-x-2 bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors"
            >
              <RefreshCw className="h-5 w-5" />
              <span>Recargar Datos</span>
            </button>

            <p className="text-gray-400 text-xs mt-4">
              O presiona F5 para recargar toda la página
            </p>
          </>
        )}
      </div>
    </div>
  );
}
