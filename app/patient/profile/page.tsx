'use client';

import { FormEvent, useEffect, useState } from 'react';
import {
  Download,
  HelpCircle,
  LogOut,
  MapPin,
  Phone,
  Shield,
  User,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { ClinicalShell } from '@/components/dashboard/ClinicalShell';
import { Badge, Card, Btn, FieldLabel, Input } from '@/components/ui/ClinicalPrimitives';
import { api, type PatientProfile } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const NAV = [
  { id: 'personal', label: 'Personal info', icon: User },
  { id: 'address', label: 'Address details', icon: MapPin },
  { id: 'emergency', label: 'Emergency contacts', icon: Phone },
  { id: 'security', label: 'Security', icon: Shield },
] as const;

type NavId = (typeof NAV)[number]['id'];

export default function PatientProfilePage() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token)!;
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [form, setForm] = useState<Partial<PatientProfile>>({});
  const [section, setSection] = useState<NavId>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.profile
      .getMe(token)
      .then((res) => {
        if (res.type === 'patient') setForm(res.profile);
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false));
  }, [token]);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    setError('');
    try {
      const res = await api.profile.updateMe(token, {
        name: form.name,
        gender: form.gender,
        age: form.age,
        address: form.address,
        phone: form.phone,
        email: form.email,
        image: form.image,
      });
      if (res.type === 'patient') {
        setForm(res.profile);
        setMessage('Profile saved.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const handleLogout = async () => {
    await clearAuth();
    router.replace('/login');
  };

  return (
    <ClinicalShell role="PATIENT" title="Personal information" showSearch={false}>
      <p className="dash-page-sub">
        Update your personal details and contact preferences below.
      </p>

      <div className="patient-settings-layout">
        <aside className="patient-settings-nav" aria-label="Profile sections">
          <div className="patient-settings-nav__head">
            <div className="patient-settings-nav__avatar" aria-hidden>
              {(form.name ?? 'P').charAt(0)}
            </div>
            <div>
              <strong style={{ color: 'var(--teal-900)' }}>Patient profile</strong>
              <p style={{ margin: 0, fontSize: 10, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--stone-600)' }}>
                Manage account settings
              </p>
            </div>
          </div>
          {NAV.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                type="button"
                className={`patient-settings-nav__link ${section === item.id ? 'patient-settings-nav__link--active' : ''}`}
                onClick={() => setSection(item.id)}
              >
                <Icon size={18} aria-hidden />
                {item.label}
              </button>
            );
          })}
          <Btn variant="primary" style={{ width: '100%', marginTop: 16 }}>
            <Download size={16} aria-hidden />
            Download medical record
          </Btn>
          <button type="button" className="patient-settings-nav__support">
            <HelpCircle size={16} aria-hidden />
            Support
          </button>
          <button type="button" className="patient-settings-nav__signout" onClick={handleLogout}>
            <LogOut size={16} aria-hidden />
            Sign out
          </button>
        </aside>

        <Card>
          <div className="patient-profile-header">
            <div className="patient-profile-header__photo" aria-hidden>
              {(form.name ?? 'E').charAt(0)}
            </div>
            <div>
              <h2 style={{ margin: '0 0 6px', fontSize: 20 }}>{form.name || 'Your name'}</h2>
              <Badge variant="info">Patient ID: MZ-{form.id?.slice(-6).toUpperCase() ?? '449288'}</Badge>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <Btn variant="primary">Change photo</Btn>
              <Btn variant="outline">Remove</Btn>
            </div>
          </div>

          {loading ? (
            <p style={{ color: 'var(--stone-600)' }}>Loading…</p>
          ) : (
            <form onSubmit={handleSubmit}>
              {section === 'personal' && (
                <>
                  <h3 className="profile-section-label">
                    <User size={16} aria-hidden /> Basic details
                  </h3>
                  <div className="profile-form-grid">
                    <div>
                      <FieldLabel htmlFor="pat-name">Full name</FieldLabel>
                      <Input
                        id="pat-name"
                        value={form.name ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="pat-email">Email address</FieldLabel>
                      <Input
                        id="pat-email"
                        type="email"
                        value={form.email ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="pat-phone">Phone number</FieldLabel>
                      <Input
                        id="pat-phone"
                        value={form.phone ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="pat-age">Age</FieldLabel>
                      <Input
                        id="pat-age"
                        type="number"
                        value={form.age ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, age: Number(e.target.value) }))}
                      />
                    </div>
                    <div>
                      <FieldLabel htmlFor="pat-gender">Gender</FieldLabel>
                      <Input
                        id="pat-gender"
                        value={form.gender ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, gender: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}

              {section === 'address' && (
                <>
                  <h3 className="profile-section-label">
                    <MapPin size={16} aria-hidden /> Residential address
                  </h3>
                  <div className="profile-form-grid">
                    <div style={{ gridColumn: '1 / -1' }}>
                      <FieldLabel htmlFor="pat-address">Street address</FieldLabel>
                      <Input
                        id="pat-address"
                        value={form.address ?? ''}
                        onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))}
                      />
                    </div>
                  </div>
                </>
              )}

              {(section === 'emergency' || section === 'security') && (
                <p style={{ color: 'var(--stone-600)', fontSize: 14 }}>
                  {section === 'emergency'
                    ? 'Emergency contact management will be available in a future release.'
                    : 'Security and password settings will be available in a future release.'}
                </p>
              )}

              {message && <p style={{ color: 'var(--success)', fontSize: 13, marginTop: 16 }}>{message}</p>}
              {error && <p style={{ color: 'var(--error)', fontSize: 13, marginTop: 16 }}>{error}</p>}

              <Btn type="submit" variant="primary" disabled={saving} style={{ marginTop: 24 }}>
                {saving ? 'Saving…' : 'Save changes'}
              </Btn>
            </form>
          )}
        </Card>
      </div>

      <style>{`
        .patient-settings-layout {
          display: grid;
          grid-template-columns: 260px 1fr;
          gap: 24px;
          align-items: start;
        }
        .patient-settings-nav {
          background: var(--surface-muted);
          border-radius: var(--radius-md);
          padding: 20px;
          border: 1px solid var(--border-default);
        }
        .patient-settings-nav__head {
          display: flex;
          gap: 12px;
          align-items: center;
          margin-bottom: 20px;
          padding-bottom: 16px;
          border-bottom: 1px solid var(--border-default);
        }
        .patient-settings-nav__avatar {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--teal-100);
          color: var(--teal-800);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 700;
        }
        .patient-settings-nav__link {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 11px 12px;
          border: none;
          background: none;
          border-radius: var(--radius-sm);
          font-size: 14px;
          color: var(--stone-600);
          cursor: pointer;
          text-align: left;
        }
        .patient-settings-nav__link:hover { background: var(--surface-card); }
        .patient-settings-nav__link--active {
          background: var(--surface-active);
          color: var(--teal-900);
          font-weight: 500;
        }
        .patient-settings-nav__support,
        .patient-settings-nav__signout {
          display: flex;
          align-items: center;
          gap: 10px;
          width: 100%;
          padding: 10px 12px;
          border: none;
          background: none;
          font-size: 13px;
          color: var(--stone-600);
          cursor: pointer;
          margin-top: 8px;
        }
        .patient-settings-nav__signout { color: var(--error); }
        .patient-profile-header {
          display: flex;
          gap: 20px;
          align-items: center;
          flex-wrap: wrap;
          padding-bottom: 24px;
          margin-bottom: 24px;
          border-bottom: 1px solid var(--border-default);
        }
        .patient-profile-header__photo {
          width: 88px;
          height: 88px;
          border-radius: var(--radius-md);
          background: var(--teal-50);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 32px;
          font-weight: 700;
          color: var(--teal-800);
        }
        .profile-section-label {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 15px;
          font-weight: 600;
          margin: 0 0 16px;
          color: var(--teal-900);
        }
        @media (max-width: 900px) {
          .patient-settings-layout { grid-template-columns: 1fr; }
        }
      `}</style>
    </ClinicalShell>
  );
}
