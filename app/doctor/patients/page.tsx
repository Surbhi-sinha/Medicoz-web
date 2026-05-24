'use client';

import Link from 'next/link';
import { ClinicalShell } from '@/components/dashboard/ClinicalShell';
import { Badge, Card } from '@/components/ui/ClinicalPrimitives';

const PATIENTS = [
  { id: 'elena', name: 'Elena Rodriguez', record: 'MZ-94420-B', lastVisit: '14 days ago', status: 'stable' as const },
  { id: 'robert', name: 'Robert Patterson', record: 'MZ-4829-X', lastVisit: '22 May 2024', status: 'stable' as const },
  { id: 'linda', name: 'Linda Garrick', record: 'MZ-9102-A', lastVisit: '21 May 2024', status: 'recovery' as const },
];

export default function DoctorPatientsPage() {
  return (
    <ClinicalShell role="DOCTOR" title="Patients" searchPlaceholder="Search patient records…">
      <p className="dash-page-sub">View and manage your active patient roster.</p>
      <div style={{ display: 'grid', gap: 12 }}>
        {PATIENTS.map((p) => (
          <Link key={p.id} href={`/doctor/patients/${p.id}`} style={{ textDecoration: 'none' }}>
            <Card>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 4px', fontSize: 16, color: 'var(--stone-900)' }}>{p.name}</h3>
                  <p style={{ margin: 0, fontSize: 13, color: 'var(--stone-600)' }}>ID: {p.record}</p>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <span style={{ fontSize: 13, color: 'var(--stone-600)' }}>Last visit: {p.lastVisit}</span>
                  <Badge variant={p.status === 'recovery' ? 'warning' : 'success'}>{p.status}</Badge>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </ClinicalShell>
  );
}
