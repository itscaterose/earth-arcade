import { createClient } from '@supabase/supabase-js'

/**
 * Supabase Admin Client with Service Role Key
 * WARNING: This has elevated privileges and bypasses Row Level Security (RLS)
 * Only use this in:
 * 1. API routes that implement their own authentication
 * 2. Server-side operations that require admin access
 * 3. Never expose this client to the browser
 */
export const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
)
