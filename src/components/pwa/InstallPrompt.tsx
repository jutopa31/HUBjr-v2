import { useEffect, useState } from 'react';

const DISMISSED_KEY = 'hubjr-pwa-dismissed';
const DISMISSED_TTL = 7 * 24 * 60 * 60 * 1000; // 7 days in ms

function isDismissedRecently(): boolean {
  try {
    const raw = localStorage.getItem(DISMISSED_KEY);
    if (!raw) return false;
    const ts = parseInt(raw, 10);
    return Date.now() - ts < DISMISSED_TTL;
  } catch {
    return false;
  }
}

function dismiss() {
  try {
    localStorage.setItem(DISMISSED_KEY, String(Date.now()));
  } catch {
    // ignore
  }
}

function isIOS(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches ||
    (navigator as Navigator & { standalone?: boolean }).standalone === true;
}

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function InstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOSDevice, setIsIOSDevice] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Don't show if already standalone or recently dismissed
    if (isStandalone() || isDismissedRecently()) return;

    const ios = isIOS();
    setIsIOSDevice(ios);

    if (ios) {
      // iOS/Safari: show manual instructions immediately
      setShow(true);
      return;
    }

    // Android/Chrome: capture beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShow(true);
    };

    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    deferredPrompt.userChoice.then(() => {
      setDeferredPrompt(null);
      setShow(false);
    });
  }

  function handleDismiss() {
    dismiss();
    setShow(false);
  }

  if (!show) return null;

  return (
    <div
      className="fixed bottom-0 left-0 right-0 z-50 pb-safe"
      role="banner"
      aria-label="Instalar aplicación"
    >
      <div className="mx-auto max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-t-2xl shadow-xl p-4">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-sky-700 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <rect x="9" y="2" width="6" height="14" rx="2" fill="white" />
              <rect x="2" y="9" width="20" height="6" rx="2" fill="white" />
            </svg>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">
              Instalá HUBjr
            </p>

            {isIOSDevice ? (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                Tocá{' '}
                <span className="inline-flex items-center gap-0.5 font-medium text-sky-700 dark:text-sky-400">
                  Compartir
                  {/* Share icon */}
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                    <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
                    <polyline points="16 6 12 2 8 6" />
                    <line x1="12" y1="2" x2="12" y2="15" />
                  </svg>
                </span>{' '}
                → &quot;Agregar a pantalla de inicio&quot;
              </p>
            ) : (
              <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Accedé rápido desde tu pantalla de inicio
              </p>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleDismiss}
            className="flex-shrink-0 p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            aria-label="Cerrar"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Install button (Android only) */}
        {!isIOSDevice && deferredPrompt && (
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleInstall}
              className="flex-1 bg-sky-700 hover:bg-sky-800 text-white text-sm font-semibold py-2 px-4 rounded-lg transition-colors"
            >
              Instalar
            </button>
            <button
              onClick={handleDismiss}
              className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 px-3 py-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Ahora no
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
