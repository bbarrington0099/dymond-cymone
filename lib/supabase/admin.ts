import { createClient } from '@supabase/supabase-js';

/**
 * Supabase admin client using the service role key.
 * Works in any Node.js context (seed scripts, CLI tools, etc.)
 * — does NOT depend on Next.js APIs like cookies().
 */
export function createSupabaseAdmin() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !key) {
    throw new Error(
      'Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY env vars'
    );
  }

  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}
