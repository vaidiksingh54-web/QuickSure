import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'placeholder-anon-key';

export const isMockAuth = supabaseUrl.includes('placeholder.supabase.co') || !import.meta.env.VITE_SUPABASE_ANON_KEY;

/**
 * Standard client-side Supabase instance.
 * STRICT BOUNDARY: Holds only anonymous key, used solely for Auth session lifecycle.
 */
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
