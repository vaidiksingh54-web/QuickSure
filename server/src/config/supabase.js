import { createClient } from '@supabase/supabase-js'
import { env } from './env.js'

/**
 * Privileged Supabase client with service-role permissions.
 * STRICT SECURITY BOUNDARY: Used exclusively inside Express backend services.
 * NEVER exposed to client-side bundles.
 */
export const supabaseAdmin = createClient(env.SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})

/**
 * Standard anonymous Supabase client (respects RLS policies).
 */
export const supabaseAnon = createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
})
