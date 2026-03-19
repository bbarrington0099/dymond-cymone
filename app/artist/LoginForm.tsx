'use client';

import { useActionState } from 'react';
import { loginWithCredentials, type LoginFormState } from '@actions/auth';

export default function LoginForm() {
  const initial: LoginFormState = { error: null };
  const [state, formAction] = useActionState(loginWithCredentials, initial);

  return (
    <div style={{ maxWidth: 520, margin: '0 auto' }}>
      <h1 style={{ marginBottom: '1rem' }}>Artist Login</h1>

      <form action={formAction}>
        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          <span>Email</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            required
            style={{ width: '100%', padding: '0.6rem', marginTop: 6 }}
          />
        </label>

        <label style={{ display: 'block', marginBottom: '0.5rem' }}>
          <span>Password</span>
          <input
            name="password"
            type="password"
            autoComplete="current-password"
            required
            style={{ width: '100%', padding: '0.6rem', marginTop: 6 }}
          />
        </label>

        {state.error && (
          <p style={{ color: 'var(--primary-color, #b00020)', marginTop: 10 }}>
            {state.error}
          </p>
        )}

        <button
          type="submit"
          style={{
            marginTop: '1rem',
            width: '100%',
            padding: '0.75rem',
            borderRadius: 8,
            border: '1px solid var(--tertiary-color, #ddd)',
            background: 'var(--secondary-color, #fff)',
            color: 'var(--primary-color, #111)',
          }}
        >
          Sign in
        </button>
      </form>
    </div>
  );
}

