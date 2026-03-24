/**
 * login/page.tsx — Login screen
 *
 * FORM STATE: LOCAL useState, NOT ZUSTAND
 * Form input values are ephemeral — they only exist while this component
 * is mounted and have no meaning to any other part of the app. Putting them
 * in Zustand would pollute the global store with transient UI state.
 * Local useState is exactly right here.
 *
 * ERROR HANDLING STRATEGY
 * We show errors inline (field-level) where they're closest to the problem,
 * and a global error banner for server-level failures (wrong password, network
 * error). This matches user expectations: "your email is missing" appears
 * under the email field, "invalid credentials" appears at the top.
 *
 * WHY WE REDIRECT TO /chat AFTER LOGIN
 * The root page.tsx redirects unauthenticated users to /login.
 * After login, we push to /chat (not the home page) because chat is the
 * primary feature — there's no dashboard to go through first in V1.
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter }           from 'next/navigation';
import Link                    from 'next/link';
import { api }                 from '@/lib/api';
import { useAuthStore }        from '@/stores/authStore';

// ─── Sub-component: Field ─────────────────────────────────────────────────────

/**
 * A reusable input field that manages its own focus state for the
 * highlight border. We keep it local to this file because it's not
 * generic enough to live in /components — it's tuned to the auth forms.
 */
function Field({
  label, type = 'text', value, onChange, placeholder, error,
}: {
  label:        string;
  type?:        string;
  value:        string;
  onChange:     (v: string) => void;
  placeholder?: string;
  error?:       string;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500, color: '#2C2B27' }}>
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          padding:      '11px 14px',
          borderRadius: '10px',
          // Three visual states: error (red), focused (teal), default (stone)
          border:       `1.5px solid ${error ? '#C0392B' : focused ? '#1A8080' : '#E4E2DC'}`,
          fontSize:     '14px',
          color:        '#1A1917',
          background:   '#fff',
          outline:      'none',
          transition:   'border-color .15s',
          width:        '100%',
        }}
      />
      {error && (
        <span style={{ fontSize: '12px', color: '#C0392B' }}>{error}</span>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LoginPage() {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [loading,  setLoading]  = useState(false);

  // Server-level error (wrong credentials, network failure, etc.)
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    // Basic client-side guard — the real validation is on the server,
    // but this prevents an unnecessary network round-trip for empty fields
    if (!email.trim() || !password) {
      setServerError('Please enter your email and password.');
      return;
    }

    setLoading(true);

    try {
      const response = await api.auth.login({ email: email.trim(), password });

      /**
       * Store the token and user in Zustand (persisted to sessionStorage).
       * After this call, any component that reads from useAuthStore will
       * immediately see the authenticated user — no prop drilling needed.
       */
      setAuth(response.access_token, {
        id:        response.user.id,
        email:     response.user.email,
        phone:     response.user.phone,
        firstName: response.user.firstName,
        lastName:  response.user.lastName,
        role:      'PATIENT',
      });

      // Navigate to the chat screen — the chat layout will pick up
      // the token from the store and open the WebSocket connection
      router.push('/chat');

    } catch (err: any) {
      // Surface the server's error message directly.
      // api.ts already extracts it from the NestJS response body.
      setServerError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeUp .35s ease both' }}>

      {/* Heading */}
      <div style={{ marginBottom: '36px' }}>
        <h1 style={{
          fontFamily:   "'Instrument Serif', Georgia, serif",
          fontSize:     '30px',
          color:        '#1A1917',
          marginBottom: '6px',
          letterSpacing: '-0.3px',
        }}>
          Welcome back
        </h1>
        <p style={{ fontSize: '14px', color: '#6B6860' }}>
          Sign in to your MedicoZ account
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>

        <Field
          label="Email address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="doctor@hospital.com"
        />

        <Field
          label="Password"
          type="password"
          value={password}
          onChange={setPassword}
          placeholder="••••••••"
        />

        {/* Server error — shown below the fields, above the submit button */}
        {serverError && (
          <div style={{
            padding:      '10px 14px',
            borderRadius: '8px',
            background:   '#FDF0EE',
            border:       '1px solid #F5C4B3',
            fontSize:     '13px',
            color:        '#C0392B',
            display:      'flex',
            gap:          '8px',
            alignItems:   'center',
          }}>
            {/* Warning icon inline — no icon library dependency */}
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {serverError}
          </div>
        )}

        {/* Submit button — disabled and styled differently while loading */}
        <button
          type="submit"
          disabled={loading}
          style={{
            padding:        '13px',
            borderRadius:   '10px',
            background:     loading ? '#99DCDC' : '#1A8080',
            color:          '#fff',
            fontSize:       '14px',
            fontWeight:     500,
            border:         'none',
            cursor:         loading ? 'not-allowed' : 'pointer',
            transition:     'background .15s, transform .1s',
            display:        'flex',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '8px',
            marginTop:      '4px',
          }}
          onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={(e)   => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {/* Spinner — CSS animation, no external dependency */}
          {loading && (
            <div style={{
              width:        '16px',
              height:       '16px',
              border:       '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff',
              borderRadius: '50%',
              animation:    'spin .65s linear infinite',
            }}/>
          )}
          {loading ? 'Signing in…' : 'Sign in'}
        </button>
      </form>

      {/* Divider */}
      <div style={{
        display:    'flex',
        alignItems: 'center',
        gap:        '12px',
        margin:     '28px 0',
      }}>
        <div style={{ flex: 1, height: '1px', background: '#E4E2DC' }}/>
        <span style={{ fontSize: '12px', color: '#A09D94' }}>or</span>
        <div style={{ flex: 1, height: '1px', background: '#E4E2DC' }}/>
      </div>

      <p style={{ textAlign: 'center', fontSize: '14px', color: '#6B6860' }}>
        Don't have an account?{' '}
        <Link href="/signup" style={{ color: '#1A8080', fontWeight: 500 }}>
          Create one
        </Link>
      </p>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { to   { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}