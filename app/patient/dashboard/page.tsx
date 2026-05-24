'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { ArrowRight, Heart, Brain, Baby, Activity } from 'lucide-react';
import { ClinicalShell } from '@/components/dashboard/ClinicalShell';
import { Badge, Card, Btn } from '@/components/ui/ClinicalPrimitives';
import { api, type DoctorProfile } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const DEPARTMENTS = [
  { name: 'Cardiology', desc: 'Heart health, diagnostics, and interventional care.', icon: Heart, color: '#DBEAFE' },
  { name: 'Neurology', desc: 'Brain, spine, and nervous system specialists.', icon: Brain, color: '#EDE9FE' },
  { name: 'Oncology', desc: 'Comprehensive cancer screening and treatment.', icon: Activity, color: '#FCE7F3' },
  { name: 'Pediatrics', desc: 'Dedicated care for infants, children, and teens.', icon: Baby, color: '#D1FAE5' },
];

const INTERACTIONS = [
  { patient: 'Robert Patterson', id: '#MZ-4829-X', type: 'Annual Physical', time: '09:30 AM', status: 'completed' as const },
  { patient: 'Linda Garrick', id: '#MZ-9102-A', type: 'Neurology Consultation', time: '10:15 AM', status: 'progress' as const },
  { patient: 'Samuel Stevens', id: '#MZ-3371-B', type: 'Post-Op Follow-up', time: '11:00 AM', status: 'waiting' as const },
];

const INT_STATUS = {
  completed: 'success',
  progress: 'info',
  waiting: 'warning',
} as const;

export default function PatientDashboardPage() {
  const token = useAuthStore((s) => s.token)!;
  const [search, setSearch] = useState('');
  const [doctors, setDoctors] = useState<DoctorProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDoctors = useCallback(
    async (term?: string) => {
      setLoading(true);
      setError('');
      try {
        const res = await api.profile.listDoctors(token, {
          search: term || undefined,
          limit: 6,
        });
        setDoctors(res.items);
      } catch (e: unknown) {
        setError(e instanceof Error ? e.message : 'Failed to load doctors');
      } finally {
        setLoading(false);
      }
    },
    [token],
  );

  useEffect(() => {
    loadDoctors();
  }, [loadDoctors]);

  const onSearch = (e: React.FormEvent) => {
    e.preventDefault();
    loadDoctors(search);
  };

  return (
    <ClinicalShell
      role="PATIENT"
      title="Patient Overview"
      searchPlaceholder="Search for doctors, departments…"
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 12, marginBottom: 20 }}>
        <div>
          <p className="dash-page-sub" style={{ margin: 0 }}>
            Manage your clinical data and appointments with precision.
          </p>
        </div>
        <Badge variant="info">Live status: Clinical active</Badge>
      </div>

      <div className="dash-hero-row">
        <div className="dash-hero-banner">
          <span
            style={{
              alignSelf: 'flex-start',
              padding: '4px 10px',
              borderRadius: 999,
              fontSize: 11,
              fontWeight: 600,
              background: 'rgba(255,255,255,0.15)',
              color: '#fff',
            }}
          >
            Daily insight
          </span>
          <p style={{ fontSize: 22, lineHeight: 1.35, margin: '16px 0', maxWidth: 420 }}>
            Welcome back to the clinical portal. You have 12 appointments scheduled for today.
          </p>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Btn variant="secondary" style={{ background: '#fff', color: 'var(--teal-900)' }}>
              View schedule
            </Btn>
            <Btn variant="outline" style={{ borderColor: 'rgba(255,255,255,0.4)', color: '#fff' }}>
              EHR records
            </Btn>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <Card>
            <div className="dash-stat-card__label">Total patients</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="dash-stat-card__value" style={{ fontSize: 32 }}>1,284</span>
              <Badge variant="success">+4.2%</Badge>
            </div>
          </Card>
          <Card>
            <div className="dash-stat-card__label">Efficiency rate</div>
            <div style={{ display: 'flex', alignItems: 'baseline', gap: 8 }}>
              <span className="dash-stat-card__value" style={{ fontSize: 32 }}>94.8%</span>
              <Badge variant="critical">-2.1%</Badge>
            </div>
          </Card>
        </div>
      </div>

      <div className="clinical-section-head">
        <h2 className="clinical-section-title">Browse departments</h2>
        <Link href="/patient/dashboard" style={{ fontSize: 13, color: 'var(--teal-800)', fontWeight: 500, textDecoration: 'none' }}>
          View all departments <ArrowRight size={14} style={{ verticalAlign: 'middle' }} aria-hidden />
        </Link>
      </div>
      <div className="dash-dept-grid" style={{ marginBottom: 32 }}>
        {DEPARTMENTS.map((d) => {
          const Icon = d.icon;
          return (
            <Card key={d.name}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 8,
                  background: d.color,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: 12,
                  color: 'var(--teal-900)',
                }}
              >
                <Icon size={22} aria-hidden />
              </div>
              <h3 style={{ margin: '0 0 6px', fontSize: 16 }}>{d.name}</h3>
              <p style={{ margin: 0, fontSize: 13, color: 'var(--stone-600)', lineHeight: 1.5 }}>{d.desc}</p>
            </Card>
          );
        })}
      </div>

      <SectionTitle title="Top rated clinical specialists" />
      {error && <p style={{ color: 'var(--error)', fontSize: 14 }}>{error}</p>}
      {loading ? (
        <p style={{ color: 'var(--stone-600)' }}>Loading specialists…</p>
      ) : (
        <div className="dash-spec-grid" style={{ marginBottom: 32 }}>
          {(doctors.length ? doctors.slice(0, 3) : []).map((doc) => (
            <Card key={doc.id} padding={false}>
              <div
                style={{
                  height: 140,
                  background: `linear-gradient(135deg, var(--teal-100), var(--teal-50))`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 48,
                  fontWeight: 700,
                  color: 'var(--teal-800)',
                }}
                aria-hidden
              >
                {doc.name.charAt(0)}
              </div>
              <div style={{ padding: 20 }}>
                <h3 style={{ margin: '0 0 4px', fontSize: 16 }}>{doc.name}</h3>
                <p style={{ margin: '0 0 8px', fontSize: 11, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', color: 'var(--stone-600)' }}>
                  {doc.department}
                </p>
                <Badge variant="warning">★ {doc.rating.toFixed(1)}</Badge>
                <p style={{ fontSize: 13, color: 'var(--stone-600)', margin: '12px 0' }}>
                  {doc.experience}+ years clinical experience
                </p>
                {doc.clinicalAddress && (
                  <p style={{ fontSize: 12, color: 'var(--stone-400)', margin: '0 0 14px' }}>{doc.clinicalAddress}</p>
                )}
                <Link href={`/patient/doctors/${doc.id}`}>
                  <Btn variant="outline" style={{ width: '100%' }}>
                    Schedule consultation
                  </Btn>
                </Link>
              </div>
            </Card>
          ))}
        </div>
      )}

      <form onSubmit={onSearch} style={{ marginBottom: 16 }}>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search doctors, specialties…"
          className="clinical-input"
          style={{ maxWidth: 480 }}
          aria-label="Search doctors"
        />
      </form>

      <Card padding={false}>
        <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
          <h2 className="clinical-section-title">Recent patient interactions</h2>
          <Btn variant="secondary">Export records</Btn>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table className="dash-table">
            <thead>
              <tr>
                <th>Patient name</th>
                <th>ID / record</th>
                <th>Visit type</th>
                <th>Time</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              {INTERACTIONS.map((row) => (
                <tr key={row.id}>
                  <td><strong>{row.patient}</strong></td>
                  <td style={{ color: 'var(--stone-600)' }}>{row.id}</td>
                  <td>{row.type}</td>
                  <td>{row.time}</td>
                  <td>
                    <Badge variant={INT_STATUS[row.status]}>
                      {row.status === 'progress' ? 'In progress' : row.status}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </ClinicalShell>
  );
}

function SectionTitle({ title }: { title: string }) {
  return (
    <div className="clinical-section-head">
      <h2 className="clinical-section-title">{title}</h2>
    </div>
  );
}
