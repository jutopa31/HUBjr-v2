// Supabase client configuration
import { createClient } from '@supabase/supabase-js';

// Simple, reliable configuration with quote cleaning for Vite
const cleanValue = (val) => {
  if (typeof val === 'string' && val.startsWith('"') && val.endsWith('"')) {
    return val.slice(1, -1);
  }
  return val;
};

const supabaseUrl = cleanValue(process.env.SUPABASE_URL) || 'https://jvdpuxpurhetopsclqrq.supabase.co';
const supabaseKey = cleanValue(process.env.SUPABASE_ANON_KEY) || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp2ZHB1eHB1cmhldG9wc2NscXJxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY2MDk3NDYsImV4cCI6MjA3MjE4NTc0Nn0.WxyPZK6atg4CeQiPKCKwrUA5pTu6c0JyPGF26TqPTo8';

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
      key: process.env.SUPABASE_ANON_KEY
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
    // Try local logout first (works in production)
    const { error } = await supabase.auth.signOut({ scope: 'local' });
    if (error) {
      console.warn('Local logout failed, clearing manually:', error);
      await clearAuthState();
    }
    return { success: true };
  } catch (err) {
    console.error('Logout error:', err);
    // Fallback: clear auth state manually
    await clearAuthState();
    return { success: true, fallback: true };
  }
};