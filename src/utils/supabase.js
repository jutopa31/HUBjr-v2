// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

// Simple, reliable configuration with quote cleaning for Vite
const cleanValue = (val) => {
  if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
    return val.slice(1, -1);
  }
  return val;
};

// Use Next.js public environment variables for client-side access
const supabaseUrl = cleanValue(process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL) || 'https://jvdpuxpurhetopsclqrq.supabase.co';
const supabaseKey = cleanValue(process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2ZHB1eHB1cmhldG9wc2NscXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MDk3NDYsImV4cCI6MjA3MjE4NTc0Nn0.WxyPZK6atg4CeQiPKCKwrUA5pTu6c0JyPGF26TqPTo8';

// Debug logging for development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  console.log('Supabase Config:', { 
    url: supabaseUrl, 
    key: supabaseKey,
    hasUrl: !!supabaseUrl,
    hasKey: !!supabaseKey,
    keyLength: supabaseKey ? supabaseKey.length : 0,
    keyPrefix: supabaseKey ? supabaseKey.slice(0, 20) : 'none',
    isValidUrl: supabaseUrl && supabaseUrl.startsWith('https://'),
    rawProcessEnv: {
      url: process.env.SUPABASE_URL,
      key: process.env.SUPABASE_ANON_KEY,
      nextPublicUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      nextPublicKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
    }
  });
}

// Initialize Supabase client
export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    // Better configuration for production deployment
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    // Clear invalid sessions automatically
    onAuthTokenRefresh: (event, session) => {
      if (!session) {
        console.log('Session refresh failed, clearing auth state');
        supabase.auth.signOut({ scope: 'local' }); // Use local scope to avoid 403
      }
    }
  }
});

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseKey && 
         supabaseUrl !== 'your-supabase-url-here' && 
         supabaseKey !== 'your-supabase-anon-key-here' &&
         supabaseUrl.startsWith('https://');
};

// Helper function to clear corrupted auth state
export const clearAuthState = async () => {
  console.log('Clearing corrupted auth state...');

  // Clear localStorage tokens
  if (typeof window !== 'undefined') {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith('supabase.')) {
        localStorage.removeItem(key);
      }
    });
  }

  // Sign out from Supabase with local scope to avoid 403 errors
  await supabase.auth.signOut({ scope: 'local' });

  console.log('Auth state cleared');
};

// Enhanced logout function for production compatibility
export const logoutUser = async () => {
  try {
    // Check if we're in production or cached environment
    const isProduction = process.env.NODE_ENV === 'production' ||
                        (typeof window !== 'undefined' && window.location.hostname !== 'localhost');

    if (isProduction) {
      console.log('Production logout: using force logout to clear all cached data');
      // Use force logout for production to clear ALL browser storage
      await forceLogout();
      return { success: true, method: 'force' };
    } else {
      // Local development - try API logout first
      try {
        const { error } = await supabase.auth.signOut({ scope: 'local' });
        if (error) {
          console.warn('Local logout failed, using force logout:', error);
          await forceLogout();
          return { success: true, method: 'force_fallback' };
        }
        return { success: true, method: 'api' };
      } catch (apiError) {
        console.warn('API logout completely failed, using force logout:', apiError);
        await forceLogout();
        return { success: true, method: 'force_fallback' };
      }
    }
  } catch (err) {
    console.error('Logout error:', err);
    // Ultimate fallback: force logout
    await forceLogout();
    return { success: true, fallback: true };
  }
};

// Force logout - completely clears all auth state and reloads page
export const forceLogout = async () => {
  console.log('Force logout initiated - clearing ALL browser storage');

  if (typeof window !== 'undefined') {
    try {
      // Clear ALL localStorage (more aggressive approach)
      localStorage.clear();

      // Clear ALL sessionStorage
      sessionStorage.clear();

      // Clear ALL cookies for this domain
      document.cookie.split(";").forEach(cookie => {
        const eqPos = cookie.indexOf("=");
        const name = eqPos > -1 ? cookie.substr(0, eqPos).trim() : cookie.trim();
        // Clear cookie for current path and root path
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/";
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=" + window.location.hostname;
        document.cookie = name + "=;expires=Thu, 01 Jan 1970 00:00:00 GMT;path=/;domain=." + window.location.hostname;
      });

      // Clear IndexedDB if it exists (some browsers store auth data here)
      if ('indexedDB' in window) {
        try {
          const databases = await indexedDB.databases();
          await Promise.all(
            databases.map(db => {
              if (db.name && (db.name.includes('supabase') || db.name.includes('auth'))) {
                return new Promise((resolve) => {
                  const deleteReq = indexedDB.deleteDatabase(db.name);
                  deleteReq.onsuccess = () => resolve(true);
                  deleteReq.onerror = () => resolve(false);
                });
              }
            })
          );
        } catch (err) {
          console.log('IndexedDB clearing failed:', err);
        }
      }

      // Clear any Service Worker cache
      if ('serviceWorker' in navigator && 'caches' in window) {
        try {
          const cacheNames = await caches.keys();
          await Promise.all(
            cacheNames.map(cacheName => caches.delete(cacheName))
          );
        } catch (err) {
          console.log('Cache clearing failed:', err);
        }
      }

      console.log('All browser storage cleared');

    } catch (err) {
      console.error('Error during storage clearing:', err);
    }

    // Force navigation to clear any remaining state
    window.location.replace(window.location.origin);
  }
};