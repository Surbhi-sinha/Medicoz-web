'use client';

import { FormEvent, useEffect, useState } from 'react';
import { Briefcase, Clock, CreditCard, Shield, User } from 'lucide-react';
import { ClinicalShell } from '@/components/dashboard/ClinicalShell';
import { Badge, Card, Btn, FieldLabel, Input, Textarea } from '@/components/ui/ClinicalPrimitives';
import { api, type DoctorProfile } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const DEPARTMENTS = [
  'Cardiology', 'Dermatology', 'Endocrinology', 'Gastroenterology',
  'General Medicine', 'General Surgery', 'Neurology', 'Orthopedics',
  'Pediatrics', 'Psychiatry', 'Urology',
];

const TABS = [
  { id: 'personal', label: 'Personal info', icon: User },
  { id: 'credentials', label: 'Professional credentials', icon: Briefcase },
  { id: 'availability', label: 'Weekly availability', icon: Clock },
  { id: 'billing', label: 'Billing settings', icon: CreditCard },
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function DoctorProfilePage() {
  const token = useAuthStore((s) => s.token)!;
  const user = useAuthStore((s) => s.user);
  const [form, setForm] = useState<Partial<DoctorProfile>>({});
  const [tab, setTab] = useState<TabId>('personal');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    api.profile
      .getMe(token)
      .then((res) => {
        if (res.type === 'doctor') setForm(res.profile);
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
        department: form.department,
        clinicalAddress: form.clinicalAddress,
        experience: form.experience,
        about: form.about,
        consultationPrice: form.consultationPrice,
        contactNumber: form.contactNumber,
        image: form.image,
      });
      if (res.type === 'doctor') {
        setForm(res.profile);
        setMessage('Profile saved.');
      }
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const displayName =
    form.name || `Dr. ${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() || 'Practitioner';

  return (
    <ClinicalShell role="DOCTOR" title="Profile settings" searchPlaceholder="Search data…">
      <div className="profile-overview-grid">
        <Card>
          <div className="profile-overview">
            <div className="profile-overview__photo" aria-hidden>
              {displayName.charAt(0)}
              <span className="profile-overview__verified" title="Verified">
                ✓
              </span>
            </div>
            <div style={{ flex: 1 }}>
              <h2 className="clinical-display" style={{ fontSize: 22, margin: '0 0 6px' }}>
                {displayName}
              </h2>
              <p style={{ margin: '0 0 10px', color: 'var(--stone-600)', fontSize: 14 }}>
                {form.department ? `Senior ${form.department} Specialist` : 'Clinical specialist'}
              </p>
              <p style={{ margin: '0 0 4px', fontSize: 13, color: 'var(--teal-800)', display: 'flex', alignItems: 'center', gap: 6 }}>
                <Shield size={14} aria-hidden /> Verified practitioner
              </p>
              {form.clinicalAddress && (
                <p style={{ margin: 0, fontSize: 13, color: 'var(--stone-600)' }}>{form.clinicalAddress}</p>
              )}
            </div>
            <Btn type="submit" form="doctor-profile-form" variant="primary" disabled={saving}>
              {saving ? 'Saving…' : 'Save profile'}
            </Btn>
          </div>
        </Card>

        <Card className="profile-status-card">
          <p className="profile-status-card__eyebrow">Verification status</p>
          <h3 style={{ color: '#fff', margin: '0 0 12px', fontSize: 20 }}>Clinical credentials</h3>
          <Badge variant="success">100% secure</Badge>
          <p style={{ color: 'rgba(255,255,255,0.85)', fontSize: 13, lineHeight: 1.6, margin: '16px 0' }}>
            Board certifications and licenses are verified and stored securely for patient trust.
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'rgba(255,255,255,0.7)', display: 'flex', alignItems: 'center', gap: 6 }}>
            <Shield size={14} aria-hidden /> HIPAA compliant profile
          </p>
        </Card>
      </div>

      <Card style={{ marginTop: 20 }}>
        <div className="profile-tabs" role="tablist" aria-label="Profile sections">
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={tab === t.id}
                className={`profile-tabs__btn ${tab === t.id ? 'profile-tabs__btn--active' : ''}`}
                onClick={() => setTab(t.id)}
              >
                <Icon size={16} aria-hidden />
                {t.label}
              </button>
            );
          })}
        </div>

        {loading ? (
          <p style={{ color: 'var(--stone-600)', padding: 24 }}>Loading…</p>
        ) : (
          <form id="doctor-profile-form" onSubmit={handleSubmit} style={{ padding: '8px 0 0' }}>
            {tab === 'personal' && (
              <div className="profile-form-grid">
                <div>
                  <FieldLabel htmlFor="doc-name">Full name (legal)</FieldLabel>
                  <Input
                    id="doc-name"
                    value={form.name ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="doc-email">Primary email</FieldLabel>
                  <Input id="doc-email" type="email" defaultValue={user?.email ?? ''} readOnly />
                </div>
                <div>
                  <FieldLabel htmlFor="doc-phone">Phone number</FieldLabel>
                  <Input
                    id="doc-phone"
                    value={form.contactNumber ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, contactNumber: e.target.value }))}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="doc-location">Office location</FieldLabel>
                  <Input
                    id="doc-location"
                    value={form.clinicalAddress ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, clinicalAddress: e.target.value }))}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1' }}>
                  <FieldLabel htmlFor="doc-about">Professional biography</FieldLabel>
                  <Textarea
                    id="doc-about"
                    value={form.about ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, about: e.target.value }))}
                  />
                </div>
              </div>
            )}

            {tab === 'credentials' && (
              <div className="profile-form-grid">
                <div>
                  <FieldLabel htmlFor="doc-dept">Department</FieldLabel>
                  <select
                    id="doc-dept"
                    className="clinical-input"
                    value={form.department ?? ''}
                    onChange={(e) => setForm((p) => ({ ...p, department: e.target.value }))}
                  >
                    {DEPARTMENTS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <FieldLabel htmlFor="doc-exp">Years of experience</FieldLabel>
                  <Input
                    id="doc-exp"
                    type="number"
                    value={form.experience ?? 0}
                    onChange={(e) => setForm((p) => ({ ...p, experience: Number(e.target.value) }))}
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="doc-price">Consultation price</FieldLabel>
                  <Input
                    id="doc-price"
                    type="number"
                    value={form.consultationPrice ?? 0}
                    onChange={(e) => setForm((p) => ({ ...p, consultationPrice: Number(e.target.value) }))}
                  />
                </div>
              </div>
            )}

            {(tab === 'availability' || tab === 'billing') && (
              <p style={{ color: 'var(--stone-600)', fontSize: 14, padding: '12px 0' }}>
                {tab === 'availability'
                  ? 'Weekly availability scheduling will be available in a future release.'
                  : 'Billing and payout settings will be available in a future release.'}
              </p>
            )}

            {message && <p style={{ color: 'var(--success)', fontSize: 13, marginTop: 12 }}>{message}</p>}
            {error && <p style={{ color: 'var(--error)', fontSize: 13, marginTop: 12 }}>{error}</p>}
          </form>
        )}
      </Card>

      <style>{`
        .profile-overview-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 20px;
        }
        .profile-overview {
          display: flex;
          gap: 20px;
          align-items: flex-start;
          flex-wrap: wrap;
        }
        .profile-overview__photo {
          width: 96px;
          height: 96px;
          border-radius: var(--radius-md);
          background: var(--teal-100);
          color: var(--teal-900);
          font-size: 36px;
          font-weight: 700;
          display: flex;
          align-items: center;
          justify-content: center;
          position: relative;
          border: 2px solid var(--border-default);
        }
        .profile-overview__verified {
          position: absolute;
          bottom: -4px;
          right: -4px;
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: var(--success);
          color: #fff;
          font-size: 12px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid #fff;
        }
        .profile-status-card {
          background: linear-gradient(145deg, var(--teal-900), var(--teal-800)) !important;
          border: none !important;
          color: #fff;
        }
        .profile-status-card__eyebrow {
          font-size: 11px;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.5);
          margin: 0 0 8px;
        }
        .profile-tabs {
          display: flex;
          gap: 4px;
          border-bottom: 1px solid var(--border-default);
          margin: -8px -24px 24px;
          padding: 0 24px;
          overflow-x: auto;
        }
        .profile-tabs__btn {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 14px 16px;
          border: none;
          background: none;
          font-size: 13px;
          font-weight: 500;
          color: var(--stone-600);
          cursor: pointer;
          border-bottom: 2px solid transparent;
          margin-bottom: -1px;
          white-space: nowrap;
        }
        .profile-tabs__btn:hover { color: var(--teal-900); }
        .profile-tabs__btn--active {
          color: var(--teal-900);
          border-bottom-color: var(--teal-800);
        }
        .profile-form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        @media (max-width: 900px) {
          .profile-overview-grid { grid-template-columns: 1fr; }
          .profile-form-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </ClinicalShell>
  );
}
