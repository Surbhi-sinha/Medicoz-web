/**
 * signup/page.tsx — Signup screen
 *
 * VALIDATION STRATEGY: CLIENT-SIDE FIRST, SERVER AS FALLBACK
 * We validate client-side to give instant feedback (no network round-trip).
 * We still catch server errors because the server is the source of truth —
 * it checks for duplicate emails, enforces password complexity rules, etc.
 *
 * The validate() function returns a map of field → error message.
 * This allows us to highlight specific fields rather than showing a generic
 * "something is wrong" banner.
 *
 * PASSWORD STRENGTH INDICATOR
 * Three checks: length ≥ 8, has uppercase, has number.
 * We show a visual progress bar rather than a list of rules because:
 *   1. It's less intimidating than a checklist
 *   2. It gives positive feedback as rules are met
 *   3. It doesn't block submission — it informs, not enforces (server enforces)
 */

'use client';

import { useState, FormEvent } from 'react';
import { useRouter }           from 'next/navigation';
import Link                    from 'next/link';
import { api }                 from '@/lib/api';
import { useAuthStore }        from '@/stores/authStore';

// ─── Field component (same as login, local to auth forms) ────────────────────

function Field({
  label, type = 'text', value, onChange, placeholder, error,
}: {
  label: string; type?: string; value: string;
  onChange: (v: string) => void; placeholder?: string; error?: string;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
      <label style={{ fontSize: '13px', fontWeight: 500, color: '#2C2B27' }}>{label}</label>
      <input
        type={type} value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        placeholder={placeholder}
        style={{
          padding: '11px 14px', borderRadius: '10px', outline: 'none',
          border: `1.5px solid ${error ? '#C0392B' : focused ? '#1A8080' : '#E4E2DC'}`,
          fontSize: '14px', color: '#1A1917', background: '#fff',
          transition: 'border-color .15s', width: '100%',
        }}
      />
      {error && <span style={{ fontSize: '12px', color: '#C0392B' }}>{error}</span>}
    </div>
  );
}

// ─── Password strength indicator ─────────────────────────────────────────────

/**
 * Provides visual feedback without blocking the form.
 * Returns null when the password field is empty to avoid showing
 * the indicator before the user has started typing.
 */
function PasswordStrength({ password }: { password: string }) {
  if (!password) return null;

  const rules = [
    password.length >= 8,   // length check
    /[A-Z]/.test(password), // has uppercase
    /[0-9]/.test(password), // has number
  ];
  const score  = rules.filter(Boolean).length;

  // Semantic colours: red → amber → green
  const colors = ['', '#C0392B', '#B8860B', '#1A8060'];
  const labels = ['', 'Weak', 'Good', 'Strong'];

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '5px' }}>
      {rules.map((met, i) => (
        <div key={i} style={{
          flex:         1,
          height:       '3px',
          borderRadius: '2px',
          background:   i < score ? colors[score] : '#E4E2DC',
          transition:   'background .2s',
        }}/>
      ))}
      <span style={{ fontSize: '11px', color: colors[score], minWidth: '44px' }}>
        {labels[score]}
      </span>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SignupPage() {
  const router  = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  // Single object for form fields — easier to update and pass to api.auth.signup
  const [form, setForm] = useState({
    firstName: '',
    lastName:  '',
    email:     '',
    phone:     '',
    password:  '',
  });

  const [fieldErrors,  setFieldErrors]  = useState<Record<string, string>>({});
  const [serverError,  setServerError]  = useState('');
  const [loading,      setLoading]      = useState(false);

  // Helper to update one field without spreading manually at every call site
  const updateField = (field: keyof typeof form) => (value: string) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  /**
   * Client-side validation.
   * Returns false if any field fails — the error map is also set in state
   * so individual fields highlight their own errors.
   */
  const validate = (): boolean => {
    const errors: Record<string, string> = {};

    if (!form.firstName.trim()) errors.firstName = 'First name is required';
    if (!form.lastName.trim())  errors.lastName  = 'Last name is required';
    if (!form.email.includes('@')) errors.email  = 'Enter a valid email address';

    // Matches the Indian phone format the curl example uses (10 digits)
    if (!/^\d{10}$/.test(form.phone)) errors.phone = 'Enter a 10-digit phone number';

    if (form.password.length < 8) errors.password = 'Password must be at least 8 characters';

    setFieldErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    // Client-side guard — abort early if obvious errors
    if (!validate()) return;

    setLoading(true);

    try {
      const response = await api.auth.signup(form);

      setAuth(response.access_token, {
        id:        response.user.id,
        email:     response.user.email,
        phone:     response.user.phone,
        firstName: response.user.firstName,
        lastName:  response.user.lastName,
        role:      'PATIENT',
      });

      router.push('/chat');

    } catch (err: any) {
      setServerError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ animation: 'fadeUp .35s ease both' }}>

      <div style={{ marginBottom: '28px' }}>
        <h1 style={{
          fontFamily:   "'Instrument Serif', Georgia, serif",
          fontSize:     '30px', color: '#1A1917',
          marginBottom: '6px', letterSpacing: '-0.3px',
        }}>
          Create account
        </h1>
        <p style={{ fontSize: '14px', color: '#6B6860' }}>
          Join MedicoZ — secure healthcare messaging
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

        {/* Name row — two fields side by side */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
          <Field label="First name" value={form.firstName}
            onChange={updateField('firstName')} placeholder="Arun"
            error={fieldErrors.firstName} />
          <Field label="Last name" value={form.lastName}
            onChange={updateField('lastName')} placeholder="Kumar"
            error={fieldErrors.lastName} />
        </div>

        <Field label="Email address" type="email" value={form.email}
          onChange={updateField('email')} placeholder="arun@hospital.com"
          error={fieldErrors.email} />

        <Field label="Phone number" type="tel" value={form.phone}
          onChange={updateField('phone')} placeholder="9876543210"
          error={fieldErrors.phone} />

        {/* Password with strength indicator below */}
        <div>
          <Field label="Password" type="password" value={form.password}
            onChange={updateField('password')} placeholder="Minimum 8 characters"
            error={fieldErrors.password} />
          <PasswordStrength password={form.password} />
        </div>

        {serverError && (
          <div style={{
            padding: '10px 14px', borderRadius: '8px',
            background: '#FDF0EE', border: '1px solid #F5C4B3',
            fontSize: '13px', color: '#C0392B',
            display: 'flex', gap: '8px', alignItems: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/>
              <line x1="12" y1="9" x2="12" y2="13"/>
              <line x1="12" y1="17" x2="12.01" y2="17"/>
            </svg>
            {serverError}
          </div>
        )}

        <button
          type="submit"
          disabled={loading}
          style={{
            padding: '13px', borderRadius: '10px',
            background: loading ? '#99DCDC' : '#1A8080',
            color: '#fff', fontSize: '14px', fontWeight: 500,
            border: 'none', cursor: loading ? 'not-allowed' : 'pointer',
            transition: 'background .15s, transform .1s',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: '8px', marginTop: '4px',
          }}
          onMouseDown={(e) => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)'; }}
          onMouseUp={(e)   => { e.currentTarget.style.transform = 'scale(1)'; }}
        >
          {loading && (
            <div style={{
              width: '16px', height: '16px',
              border: '2px solid rgba(255,255,255,0.3)',
              borderTopColor: '#fff', borderRadius: '50%',
              animation: 'spin .65s linear infinite',
            }}/>
          )}
          {loading ? 'Creating account…' : 'Create account'}
        </button>
      </form>

      <p style={{ textAlign: 'center', fontSize: '14px', color: '#6B6860', marginTop: '24px' }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: '#1A8080', fontWeight: 500 }}>Sign in</Link>
      </p>

      <style>{`
        @keyframes fadeUp { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin   { to   { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}