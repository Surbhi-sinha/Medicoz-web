'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Building2 } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { RoleSelector } from '@/components/auth/RoleSelector';
import { AuthField } from '@/components/auth/AuthField';
import { Btn } from '@/components/ui/ClinicalPrimitives';
import { getDashboardPath } from '@/lib/roles';
import type { UserRole } from '@/lib/roles';

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<UserRole>('DOCTOR');
  const [remember, setRemember] = useState(false);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState('');

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setServerError('');

    if (!email.trim() || !password) {
      setServerError('Please enter your email and password.');
      return;
    }

    setLoading(true);
    try {
      const response = await api.auth.login({
        email: email.trim(),
        password,
        role,
      });

      setAuth(response.access_token, {
        id: response.user.id,
        email: response.user.email,
        phone: response.user.phone,
        firstName: response.user.firstName,
        lastName: response.user.lastName,
        role: response.user.role,
        profileId: response.user.profileId,
      });

      router.push(getDashboardPath(response.user.role));
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Something went wrong. Please try again.';
      setServerError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div style={{ marginBottom: 28 }}>
        <h1
          className="clinical-display"
          style={{ fontSize: 30, marginBottom: 8, fontWeight: 400 }}
        >
          Welcome back
        </h1>
        <p style={{ fontSize: 14, color: 'var(--stone-600)', margin: 0 }}>
          Please enter your credentials to access the portal.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        style={{ display: 'flex', flexDirection: 'column', gap: 20 }}
        noValidate
      >
        <div>
          <span className="clinical-label" style={{ marginBottom: 10, display: 'block' }}>
            Sign in as
          </span>
          <RoleSelector value={role} onChange={setRole} />
        </div>

        <AuthField
          label="Email address"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="e.g. name@clinic.com"
        />

        <AuthField
          label="Password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
          labelExtra={
            <Link
              href="/login"
              style={{
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
                color: 'var(--teal-800)',
                textDecoration: 'none',
              }}
              onClick={(e) => e.preventDefault()}
            >
              Forgot password?
            </Link>
          }
        />

        <label
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            fontSize: 13,
            color: 'var(--stone-600)',
            cursor: 'pointer',
          }}
        >
          <input
            type="checkbox"
            checked={remember}
            onChange={(e) => setRemember(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--teal-800)' }}
          />
          Remember me for 30 days
        </label>

        {serverError && (
          <div
            role="alert"
            style={{
              padding: '10px 14px',
              borderRadius: 'var(--radius-sm)',
              background: '#FDF0EE',
              border: '1px solid #F5C4B3',
              fontSize: 13,
              color: 'var(--error)',
            }}
          >
            {serverError}
          </div>
        )}

        <Btn
          type="submit"
          variant="primary"
          disabled={loading}
          style={{ width: '100%', marginTop: 4 }}
        >
          {loading ? 'Signing in…' : 'Secure login'}
        </Btn>
      </form>

      <div className="auth-divider">
        <span>Institutional login</span>
      </div>

      <Btn variant="outline" style={{ width: '100%' }} disabled title="Coming soon">
        <Building2 size={18} aria-hidden />
        Sign in with hospital SSO
      </Btn>

      <style>{`
        .auth-divider {
          display: flex;
          align-items: center;
          gap: 12px;
          margin: 28px 0 20px;
        }
        .auth-divider::before,
        .auth-divider::after {
          content: '';
          flex: 1;
          height: 1px;
          background: var(--border-default);
        }
        .auth-divider span {
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: var(--stone-400);
          white-space: nowrap;
        }
      `}</style>
    </>
  );
}
