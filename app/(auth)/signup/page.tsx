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
import { RoleSelector }        from '@/components/auth/RoleSelector';
import { AuthField }           from '@/components/auth/AuthField';
import { Btn }                 from '@/components/ui/ClinicalPrimitives';
import { getDashboardPath }    from '@/lib/roles';
import type { UserRole }       from '@/lib/roles';

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

  const [role,         setRole]         = useState<UserRole>('PATIENT');
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
      const response = await api.auth.signup({ ...form, role });

      setAuth(response.access_token, {
        id:        response.user.id,
        email:     response.user.email,
        phone:     response.user.phone,
        firstName: response.user.firstName,
        lastName:  response.user.lastName,
        role:      response.user.role,
        profileId: response.user.profileId,
      });

      router.push(getDashboardPath(response.user.role));

    } catch (err: any) {
      setServerError(err.message ?? 'Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1 className="clinical-display" style={{ fontSize: 30, marginBottom: 8, fontWeight: 400 }}>
          Create account
        </h1>
        <p style={{ fontSize: 14, color: 'var(--stone-600)', margin: 0 }}>
          Join MedicoZ — secure healthcare messaging
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }} noValidate>
        <div>
          <span className="clinical-label" style={{ marginBottom: 10, display: 'block' }}>
            Register as
          </span>
          <RoleSelector value={role} onChange={setRole} />
        </div>

        <div className="auth-name-grid">
          <AuthField
            label="First name"
            value={form.firstName}
            onChange={(e) => updateField('firstName')(e.target.value)}
            placeholder="Arun"
            error={fieldErrors.firstName}
          />
          <AuthField
            label="Last name"
            value={form.lastName}
            onChange={(e) => updateField('lastName')(e.target.value)}
            placeholder="Kumar"
            error={fieldErrors.lastName}
          />
        </div>

        <AuthField
          label="Email address"
          type="email"
          value={form.email}
          onChange={(e) => updateField('email')(e.target.value)}
          placeholder="arun@hospital.com"
          error={fieldErrors.email}
        />

        <AuthField
          label="Phone number"
          type="tel"
          value={form.phone}
          onChange={(e) => updateField('phone')(e.target.value)}
          placeholder="9876543210"
          error={fieldErrors.phone}
        />

        <div>
          <AuthField
            label="Password"
            type="password"
            value={form.password}
            onChange={(e) => updateField('password')(e.target.value)}
            placeholder="Minimum 8 characters"
            error={fieldErrors.password}
          />
          <PasswordStrength password={form.password} />
        </div>

        {serverError && (
          <div role="alert" style={{ padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: '#FDF0EE', border: '1px solid #F5C4B3', fontSize: 13, color: 'var(--error)' }}>
            {serverError}
          </div>
        )}

        <Btn type="submit" variant="primary" disabled={loading} style={{ width: '100%' }}>
          {loading ? 'Creating account…' : 'Create account'}
        </Btn>
      </form>

      <p style={{ textAlign: 'center', fontSize: 14, color: 'var(--stone-600)', marginTop: 24 }}>
        Already have an account?{' '}
        <Link href="/login" style={{ color: 'var(--teal-800)', fontWeight: 500, textDecoration: 'none' }}>
          Sign in
        </Link>
      </p>

      <style>{`
        .auth-name-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }
        @media (max-width: 480px) {
          .auth-name-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </>
  );
}