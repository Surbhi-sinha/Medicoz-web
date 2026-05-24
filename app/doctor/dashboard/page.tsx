'use client';

import Link from 'next/link';
import { Calendar, ClipboardList, Users } from 'lucide-react';
import { ClinicalShell } from '@/components/dashboard/ClinicalShell';
import { Badge, Card } from '@/components/ui/ClinicalPrimitives';
import { useAuthStore } from '@/stores/authStore';

const STATS = [
  { label: 'Patients seen', value: '1,284', badge: '+12%', accent: '#1A8060', icon: Users },
  { label: 'Upcoming', value: '14', badge: 'Today', accent: '#7C3AED', icon: Calendar },
  { label: 'Pending lab results', value: '08', badge: 'High', accent: '#0D9488', icon: ClipboardList },
];

const SCHEDULE = [
  { time: '09:00 – 09:45 AM', name: 'Elias Thorne', note: 'Follow-up: Neuropathy check', active: true },
  { time: '10:30 AM', name: 'Sarah Jenkins', note: 'Annual review', active: false },
  { time: '11:15 AM', name: 'Marcus Wright', note: 'Lab results discussion', active: false },
  { time: '01:00 PM', name: 'Practice board meeting', note: 'Internal', active: false },
];

const RECENT = [
  { initials: 'ET', color: '#DCFCE7', text: '#166534', name: 'Elias Thorne', id: '#PX-9022', visit: '22 May 2024', status: 'stable' as const },
  { initials: 'SJ', color: '#FFEDD5', text: '#9A3412', name: 'Sarah Jenkins', id: '#PX-8810', visit: '21 May 2024', status: 'recovery' as const },
  { initials: 'MW', color: '#FEE2E2', text: '#991B1B', name: 'Marcus Wright', id: '#PX-7741', visit: '20 May 2024', status: 'critical' as const },
];

const STATUS_MAP = {
  stable: 'success',
  recovery: 'warning',
  critical: 'critical',
} as const;

export default function DoctorDashboardPage() {
  const user = useAuthStore((s) => s.user);

  return (
    <ClinicalShell
      role="DOCTOR"
      title="Overview"
      searchPlaceholder="Search records…"
    >
      <p className="dash-page-sub" style={{ marginTop: -8 }}>
        Welcome back{user?.lastName ? `, Dr. ${user.lastName}` : ''}. Here is your clinical summary for today.
      </p>

      <div className="dash-stat-grid">
        {STATS.map((s) => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="dash-stat-card" style={{ ['--accent' as string]: s.accent }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 8,
                    background: 'var(--surface-muted)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: s.accent,
                  }}
                >
                  <Icon size={20} aria-hidden />
                </div>
                <Badge variant={s.badge === 'High' ? 'critical' : 'success'}>{s.badge}</Badge>
              </div>
              <div className="dash-stat-card__label">{s.label}</div>
              <div className="dash-stat-card__value">{s.value}</div>
            </div>
          );
        })}
      </div>

      <div className="dash-two-col">
        <Card>
          <div className="clinical-section-head">
            <div>
              <h2 className="clinical-section-title">Today&apos;s schedule</h2>
              <p style={{ fontSize: 13, color: 'var(--teal-600)', margin: '4px 0 0' }}>
                {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {SCHEDULE.map((item) => (
              <div
                key={item.time + item.name}
                className={`dash-schedule-item ${item.active ? 'dash-schedule-item--active' : ''}`}
              >
                <div style={{ minWidth: 100, fontSize: 12, color: 'var(--stone-600)' }}>{item.time}</div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                    <strong style={{ fontSize: 14 }}>{item.name}</strong>
                    {item.active && <Badge variant="teal">Active</Badge>}
                  </div>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--stone-600)' }}>{item.note}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card padding={false}>
          <div style={{ padding: '20px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 className="clinical-section-title">Recent patients</h2>
            <Link href="/doctor/patients" style={{ fontSize: 13, color: 'var(--teal-800)', fontWeight: 500, textDecoration: 'none' }}>
              View all records →
            </Link>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Patient name</th>
                  <th>ID number</th>
                  <th>Last visit</th>
                  <th>Status</th>
                  <th aria-label="Actions" />
                </tr>
              </thead>
              <tbody>
                {RECENT.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span
                        className="dash-avatar-initials"
                        style={{ background: row.color, color: row.text }}
                        aria-hidden
                      >
                        {row.initials}
                      </span>
                      <strong>{row.name}</strong>
                    </td>
                    <td style={{ color: 'var(--stone-600)' }}>{row.id}</td>
                    <td>{row.visit}</td>
                    <td>
                      <Badge variant={STATUS_MAP[row.status]}>{row.status}</Badge>
                    </td>
                    <td>⋯</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      </div>

      <div style={{ marginTop: 20, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
        <Link href="/chat" className="clinical-btn clinical-btn--primary" style={{ textDecoration: 'none' }}>
          Open messages
        </Link>
        <Link href="/doctor/profile" className="clinical-btn clinical-btn--outline" style={{ textDecoration: 'none' }}>
          Profile settings
        </Link>
      </div>
    </ClinicalShell>
  );
}
