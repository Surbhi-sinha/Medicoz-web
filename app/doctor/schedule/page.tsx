'use client';

import { ClinicalShell } from '@/components/dashboard/ClinicalShell';
import { Card } from '@/components/ui/ClinicalPrimitives';

export default function DoctorSchedulePage() {
  return (
    <ClinicalShell role="DOCTOR" title="Schedule" searchPlaceholder="Search appointments…">
      <p className="dash-page-sub">Manage your clinical calendar and appointment slots.</p>
      <Card>
        <p style={{ margin: 0, color: 'var(--stone-600)', fontSize: 14 }}>
          Full calendar scheduling will be available in a future release. Use Messages to coordinate
          appointments with patients in the meantime.
        </p>
      </Card>
    </ClinicalShell>
  );
}
