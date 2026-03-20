'use server';

import { redirect } from 'next/navigation';
import { createSupabaseServerClient } from '@lib/supabase/server';

export type LoginFormState = {
  error?: string | null;
};

export async function loginWithCredentials(
  _prevState: LoginFormState,
  formData: FormData
): Promise<LoginFormState> {
  const email = String(formData.get('email') ?? '').trim();
  const password = String(formData.get('password') ?? '').trim();

  if (!email || !password) {
    return { error: 'Email and password are required.' };
  }

  const supabase = await createSupabaseServerClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });

  if (error) {
    return { error: 'Invalid email or password.' };
  }

  redirect('/');
}

export async function logout() {
  const supabase = await createSupabaseServerClient();
  await supabase.auth.signOut();
  redirect('/');
}

