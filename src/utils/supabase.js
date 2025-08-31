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
export const supabase = createClient(supabaseUrl, supabaseKey);

// Helper function to check if Supabase is properly configured
export const isSupabaseConfigured = () => {
  return supabaseUrl && supabaseKey && 
         supabaseUrl !== 'your-supabase-url-here' && 
         supabaseKey !== 'your-supabase-anon-key-here' &&
         supabaseUrl.startsWith('https://');
};