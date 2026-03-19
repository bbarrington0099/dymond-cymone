import { createSupabaseServerClient } from '@lib/supabase/server';

export interface SessionUser {
  id: string;
  email?: string;
}

export interface AppSession {
  user: SessionUser;
}

/**
 * Get the current authenticated session from Supabase.
 * Returns null if not authenticated.
 */
export async function auth(): Promise<AppSession | null> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user: authUser },
  } = await supabase.auth.getUser();

  if (!authUser?.id) return null;

  return {
    user: {
      id: authUser.id,
      email: authUser.email ?? undefined,
    },
  };
}

export async function getSession() {
  return auth();
}

/**
 * Throws if not authenticated. Use in server actions that require the artist admin.
 */
export async function requireAuth(): Promise<AppSession> {
  const session = await auth();
  if (!session?.user) {
    throw new Error('Unauthorized');
  }
  return session;
}
