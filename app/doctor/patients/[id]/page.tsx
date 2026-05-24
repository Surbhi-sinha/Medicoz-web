'use client';

import Link from 'next/link';
import { use } from 'react';
import {
  ArrowLeft,
  Edit,
  ExternalLink,
  Heart,
  Mail,
  Phone,
  Share2,
  Activity,
} from 'lucide-react';
import { ClinicalShell } from '@/components/dashboard/ClinicalShell';
import { Badge, Card, Btn } from '@/components/ui/ClinicalPrimitives';

const DEMO: Record<string, { name: string; id: string; age: string; dob: string; gender: string }> = {
  elena: { name: 'Elena Rodriguez', id: 'MZ-94420-B', age: '34 Years', dob: 'Oct 12, 1989', gender: 'Female' },
  robert: { name: 'Robert Patterson', id: 'MZ-4829-X', age: '52 Years', dob: 'Mar 3, 1972', gender: 'Male' },
  linda: { name: 'Linda Garrick', id: 'MZ-9102-A', age: '41 Years', dob: 'Jul 18, 1983', gender: 'Female' },
};

export default function DoctorPatientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const patient = DEMO[id] ?? DEMO.elena;

  return (
    <ClinicalShell
      role="DOCTOR"
      title={`Patient profile: ${patient.name}`}
      searchPlaceholder="Search patient records…"
      headerExtra={
        <Link
          href="/doctor/patients"
          className="clinical-icon-btn"
          aria-label="Back to patients"
          style={{ textDecoration: 'none', flexShrink: 0 }}
        >
          <ArrowLeft size={18} />
        </Link>
      }
    >
      <p style={{ margin: '-12px 0 20px', fontSize: 13, color: 'var(--stone-600)' }}>ID: {patient.id}</p>

      <div className="patient-detail-grid">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <div className="patient-summary">
              <div className="patient-summary__photo">
                {patient.name.charAt(0)}
                <span className="patient-summary__status"><Badge variant="teal">Active</Badge></span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
                  <div>
                    <h2 className="clinical-display" style={{ fontSize: 26, margin: '0 0 8px' }}>
                      {patient.name}
                    </h2>
                    <p style={{ margin: 0, fontSize: 14, color: 'var(--stone-600)' }}>
                      {patient.age} • {patient.dob} • {patient.gender}
                    </p>
                  </div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button type="button" className="clinical-icon-btn" aria-label="Edit profile">
                      <Edit size={16} />
                    </button>
                    <button type="button" className="clinical-icon-btn" aria-label="Share profile">
                      <Share2 size={16} />
                    </button>
                  </div>
                </div>
                <div className="patient-metrics">
                  {[
                    { label: 'Blood type', value: 'O-Positive', highlight: true },
                    { label: 'Height', value: '168 cm' },
                    { label: 'BMI', value: '22.4 (Normal)' },
                    { label: 'Last visit', value: '14 days ago' },
                  ].map((m) => (
                    <div key={m.label} className="patient-metrics__item">
                      <span className="patient-metrics__label">{m.label}</span>
                      <span className={m.highlight ? 'patient-metrics__value--teal' : 'patient-metrics__value'}>
                        {m.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card>
            <div className="clinical-section-head">
              <h2 className="clinical-section-title">Current vitals</h2>
              <Link href="#" style={{ fontSize: 13, color: 'var(--teal-800)', display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none' }}>
                View history <ExternalLink size={14} aria-hidden />
              </Link>
            </div>
            <div className="vitals-grid">
              {[
                { label: 'Blood pressure', value: '118/76 mmHg', status: 'Optimal range', icon: Activity, variant: 'success' as const },
                { label: 'Heart rate', value: '72 BPM', status: 'Stable', icon: Heart, variant: 'success' as const },
                { label: 'Body weight', value: '64.2 KG', status: '-0.8kg since last visit', icon: Activity, variant: 'info' as const },
              ].map((v) => {
                const VitalIcon = v.icon;
                return (
                  <div key={v.label} className="vitals-card">
                    <VitalIcon size={20} color="var(--teal-800)" aria-hidden />
                    <div>
                      <p className="vitals-card__label">{v.label}</p>
                      <p className="vitals-card__value">{v.value}</p>
                      <Badge variant={v.variant}>{v.status}</Badge>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card padding={false}>
            <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
              <h2 className="clinical-section-title">Comprehensive medical record</h2>
              <div className="record-tabs" role="tablist">
                {['Conditions', 'Medications', 'Allergies'].map((t, i) => (
                  <button
                    key={t}
                    type="button"
                    role="tab"
                    aria-selected={i === 1}
                    className={`record-tabs__btn ${i === 1 ? 'record-tabs__btn--active' : ''}`}
                  >
                    {t}
                  </button>
                ))}
              </div>
            </div>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Medication</th>
                  <th>Dosage</th>
                  <th>Frequency</th>
                  <th>Start date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>
                    <strong>Lisinopril 10mg</strong>
                    <br />
                    <span style={{ fontSize: 12, color: 'var(--stone-600)' }}>For hypertension</span>
                  </td>
                  <td>1 tablet</td>
                  <td>Once daily (morning)</td>
                  <td>Jan 14, 2023</td>
                  <td><Badge variant="success">Active</Badge></td>
                  <td><button type="button" className="clinical-btn--ghost" style={{ padding: 0, border: 'none', background: 'none', color: 'var(--teal-800)', cursor: 'pointer' }}>Renew</button></td>
                </tr>
              </tbody>
            </table>
          </Card>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <Card>
            <p className="clinical-label">Communication</p>
            <div className="comm-row">
              <Phone size={16} aria-hidden />
              <div>
                <span className="comm-row__label">Primary phone</span>
                <span>+1 (555) 012-9844</span>
              </div>
            </div>
            <div className="comm-row">
              <Mail size={16} aria-hidden />
              <div>
                <span className="comm-row__label">Email address</span>
                <span>e.rodriguez@example.com</span>
              </div>
            </div>
            <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border-default)' }}>
              <p className="clinical-label">Emergency contact</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <strong>Marco Rodriguez</strong>
                <Badge variant="info">Spouse</Badge>
              </div>
              <p style={{ margin: 0, fontSize: 14, color: 'var(--stone-600)' }}>+1 (555) 012-4400</p>
            </div>
          </Card>

          <Card>
            <h2 className="clinical-section-title" style={{ marginBottom: 16 }}>Next events</h2>
            {[
              { month: 'OCT', day: '28', title: 'Routine cardiovascular checkup', time: '09:30 AM • Clinic room 4B', variant: 'dark' },
              { month: 'NOV', day: '12', title: 'Dermatology consultation', time: '02:15 PM • Specialty wing', variant: 'light' },
            ].map((ev) => (
              <div key={ev.title} className={`event-card event-card--${ev.variant}`}>
                <div className="event-card__date">
                  <span>{ev.month}</span>
                  <strong>{ev.day}</strong>
                </div>
                <div>
                  <strong style={{ fontSize: 14 }}>{ev.title}</strong>
                  <p style={{ margin: '4px 0 0', fontSize: 12, color: 'var(--stone-600)' }}>{ev.time}</p>
                </div>
              </div>
            ))}
            <Btn variant="outline" style={{ width: '100%', marginTop: 16, textTransform: 'none' }}>
              Reschedule appointment
            </Btn>
          </Card>
        </div>
      </div>

      <style>{`
        .patient-detail-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 20px;
          align-items: start;
        }
        .patient-summary { display: flex; gap: 24px; flex-wrap: wrap; }
        .patient-summary__photo {
          width: 120px;
          height: 120px;
          border-radius: var(--radius-md);
          background: var(--teal-50);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 40px;
          font-weight: 700;
          color: var(--teal-800);
          position: relative;
        }
        .patient-summary__status {
          position: absolute;
          bottom: 8px;
          right: 8px;
        }
        .patient-metrics {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 12px;
          margin-top: 20px;
        }
        .patient-metrics__item {
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 12px;
        }
        .patient-metrics__label {
          display: block;
          font-size: 11px;
          color: var(--stone-600);
          margin-bottom: 4px;
        }
        .patient-metrics__value { font-size: 14px; font-weight: 600; }
        .patient-metrics__value--teal { font-size: 14px; font-weight: 700; color: var(--teal-800); }
        .vitals-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
        }
        .vitals-card {
          border: 1px solid var(--border-default);
          border-radius: var(--radius-sm);
          padding: 16px;
          display: flex;
          gap: 12px;
        }
        .vitals-card__label { font-size: 12px; color: var(--stone-600); margin: 0 0 4px; }
        .vitals-card__value { font-size: 18px; font-weight: 700; margin: 0 0 8px; }
        .record-tabs { display: flex; gap: 8px; flex-wrap: wrap; }
        .record-tabs__btn {
          padding: 8px 14px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-default);
          background: var(--surface-card);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.04em;
          text-transform: uppercase;
          cursor: pointer;
          color: var(--stone-600);
        }
        .record-tabs__btn--active {
          background: var(--teal-800);
          color: #fff;
          border-color: var(--teal-800);
        }
        .comm-row {
          display: flex;
          gap: 12px;
          margin-bottom: 14px;
          font-size: 14px;
        }
        .comm-row__label {
          display: block;
          font-size: 11px;
          color: var(--stone-600);
          margin-bottom: 2px;
        }
        .event-card {
          display: flex;
          gap: 14px;
          padding: 14px;
          border-radius: var(--radius-sm);
          margin-bottom: 12px;
          border: 1px solid var(--border-default);
        }
        .event-card--dark { background: var(--teal-50); border-left: 3px solid var(--teal-800); }
        .event-card--light { background: var(--surface-active); border-left: 3px solid #38BDF8; }
        .event-card__date {
          text-align: center;
          min-width: 48px;
          font-size: 11px;
          font-weight: 700;
          color: var(--teal-900);
        }
        .event-card__date strong { display: block; font-size: 20px; }
        @media (max-width: 1100px) {
          .patient-detail-grid { grid-template-columns: 1fr; }
          .patient-metrics { grid-template-columns: repeat(2, 1fr); }
          .vitals-grid { grid-template-columns: 1fr; }
        }
      `}</style>
    </ClinicalShell>
  );
}
