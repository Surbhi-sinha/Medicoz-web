'use client';

import { use, useEffect, useState } from 'react';
import Link from 'next/link';
import {
  Globe,
  GraduationCap,
  MapPin,
  Shield,
  Star,
  Clock,
} from 'lucide-react';
import { ClinicalShell } from '@/components/dashboard/ClinicalShell';
import { Badge, Card, Btn } from '@/components/ui/ClinicalPrimitives';
import { api, type DoctorProfile } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';

const EXPERTISE = ['Angioplasty', 'Echocardiography', 'Heart Failure Management', 'Preventive Cardiology'];

export default function PatientDoctorProfilePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const token = useAuthStore((s) => s.token)!;
  const [doc, setDoc] = useState<DoctorProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [service, setService] = useState<'in-person' | 'video'>('in-person');

  useEffect(() => {
    api.profile
      .listDoctors(token, { limit: 50 })
      .then((res) => {
        const found = res.items.find((d) => d.id === id);
        setDoc(found ?? res.items[0] ?? null);
      })
      .catch(() => setDoc(null))
      .finally(() => setLoading(false));
  }, [token, id]);

  if (loading) {
    return (
      <ClinicalShell role="PATIENT" title="Find doctors" showSearch={false}>
        <p style={{ color: 'var(--stone-600)' }}>Loading specialist profile…</p>
      </ClinicalShell>
    );
  }

  if (!doc) {
    return (
      <ClinicalShell role="PATIENT" title="Find doctors" showSearch={false}>
        <p style={{ color: 'var(--stone-600)' }}>Doctor not found.</p>
        <Link href="/patient/dashboard">← Back to dashboard</Link>
      </ClinicalShell>
    );
  }

  return (
    <div className="public-doctor-page">
      <header className="public-doctor-nav">
        <Link href="/patient/dashboard" className="clinical-brand__name" style={{ textDecoration: 'none' }}>
          MedicoZ
        </Link>
        <nav className="public-doctor-nav__links" aria-label="Marketing">
          <Link href="/patient/dashboard">Find doctors</Link>
          <Link href="/patient/dashboard">Services</Link>
          <Link href="/patient/dashboard">Hospitals</Link>
        </nav>
        <div className="clinical-header__search" style={{ maxWidth: 400 }}>
          <input type="search" placeholder="Search conditions, specialists…" aria-label="Search" />
        </div>
      </header>

      <main className="public-doctor-main">
        <div className="public-doctor-grid">
          <div>
            <Card>
              <div className="doctor-public-header">
                <div className="doctor-public-header__photo" aria-hidden>
                  {doc.name.charAt(0)}
                </div>
                <div>
                  <Badge variant="success">Verified specialist</Badge>
                  <h1 className="clinical-display" style={{ fontSize: 28, margin: '12px 0 8px' }}>
                    {doc.name}
                  </h1>
                  <p style={{ margin: '0 0 12px', color: 'var(--stone-600)' }}>
                    Senior consultant, {doc.department}
                  </p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, margin: '0 0 6px' }}>
                    <Star size={16} fill="var(--warning)" color="var(--warning)" aria-hidden />
                    {doc.experience}+ years experience
                  </p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, margin: 0, color: 'var(--stone-600)' }}>
                    <GraduationCap size={16} aria-hidden />
                    {doc.clinicalAddress || 'Clinical practice'}
                  </p>
                  <p style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, margin: '8px 0 0', color: 'var(--stone-600)' }}>
                    <Globe size={16} aria-hidden />
                    English, Spanish
                  </p>
                </div>
              </div>
            </Card>

            <div className="public-doctor-two-col" style={{ marginTop: 20 }}>
              <Card>
                <h2 className="clinical-section-title">Professional summary</h2>
                <p style={{ margin: 0, fontSize: 14, color: 'var(--stone-600)', lineHeight: 1.7 }}>
                  {doc.about ||
                    `${doc.name} is a board-certified ${doc.department.toLowerCase()} specialist with ${doc.experience}+ years of clinical experience serving patients with evidence-based care.`}
                </p>
              </Card>
              <Card>
                <h2 className="clinical-section-title">Clinical expertise</h2>
                <div className="expertise-tags">
                  {EXPERTISE.map((tag) => (
                    <span key={tag} className="expertise-tag">{tag}</span>
                  ))}
                </div>
              </Card>
            </div>

            <Card style={{ marginTop: 20 }}>
              <h2 className="clinical-section-title">Practice location</h2>
              <div style={{ display: 'flex', gap: 24, flexWrap: 'wrap' }}>
                <div style={{ flex: 1, minWidth: 200 }}>
                  <p style={{ display: 'flex', gap: 8, fontWeight: 600, margin: '0 0 8px' }}>
                    <MapPin size={16} aria-hidden />
                    Central Heart Institute
                  </p>
                  <p style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--stone-600)' }}>
                    {doc.clinicalAddress || '123 Medical Center Drive, Suite 400'}
                  </p>
                  <p style={{ display: 'flex', gap: 8, fontWeight: 600, margin: '0 0 8px' }}>
                    <Clock size={16} aria-hidden />
                    Clinical hours
                  </p>
                  <p style={{ margin: 0, fontSize: 14, color: 'var(--stone-600)' }}>
                    Mon–Fri: 8:00 AM – 5:00 PM<br />
                    Sat: 9:00 AM – 1:00 PM
                  </p>
                </div>
                <div className="map-placeholder" aria-hidden />
              </div>
            </Card>
          </div>

          <aside>
            <Card className="booking-card">
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 16 }}>
                <h2 style={{ margin: 0, fontSize: 18 }}>Book consultation</h2>
                <strong style={{ color: 'var(--teal-900)' }}>
                  ${doc.consultationPrice?.toFixed(2) ?? '250.00'} initial visit
                </strong>
              </div>
              <div className="availability-box">
                <span className="clinical-label">Availability</span>
                <p style={{ margin: 0, fontWeight: 600 }}>Tomorrow, 10:30 AM</p>
              </div>
              <p className="clinical-label" style={{ marginTop: 16 }}>Select service type</p>
              <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                <button
                  type="button"
                  className={`service-toggle ${service === 'in-person' ? 'service-toggle--active' : ''}`}
                  onClick={() => setService('in-person')}
                >
                  In-person
                </button>
                <button
                  type="button"
                  className={`service-toggle ${service === 'video' ? 'service-toggle--active' : ''}`}
                  onClick={() => setService('video')}
                >
                  Video call
                </button>
              </div>
              <Btn variant="primary" style={{ width: '100%' }}>
                Book appointment
              </Btn>
              <p style={{ textAlign: 'center', fontSize: 12, color: 'var(--stone-600)', marginTop: 12 }}>
                Secure payment via MedicoZ Pay
              </p>
              <div className="trust-row">
                <span><Shield size={14} aria-hidden /> Insurance accepted</span>
                <span><Shield size={14} aria-hidden /> Board certified</span>
              </div>
            </Card>
            <Card style={{ marginTop: 16, background: 'var(--surface-active)' }}>
              <h3 style={{ margin: '0 0 8px', fontSize: 16 }}>Need help?</h3>
              <p style={{ margin: '0 0 12px', fontSize: 13, color: 'var(--stone-600)' }}>
                Our patient support team is available 24/7 for booking assistance.
              </p>
              <Link href="/chat" style={{ color: 'var(--teal-800)', fontWeight: 500, fontSize: 13 }}>
                Contact patient support →
              </Link>
            </Card>
          </aside>
        </div>
      </main>

      <style>{`
        .public-doctor-page { min-height: 100vh; background: var(--surface-page); }
        .public-doctor-nav {
          display: flex;
          align-items: center;
          gap: 24px;
          padding: 16px 32px;
          background: var(--surface-card);
          border-bottom: 1px solid var(--border-default);
          flex-wrap: wrap;
        }
        .public-doctor-nav__links {
          display: flex;
          gap: 20px;
          font-size: 14px;
        }
        .public-doctor-nav__links a {
          color: var(--stone-800);
          text-decoration: none;
        }
        .public-doctor-main { padding: 32px; max-width: 1200px; margin: 0 auto; }
        .public-doctor-grid {
          display: grid;
          grid-template-columns: 1fr 320px;
          gap: 24px;
          align-items: start;
        }
        .doctor-public-header { display: flex; gap: 24px; flex-wrap: wrap; }
        .doctor-public-header__photo {
          width: 140px;
          height: 160px;
          border-radius: var(--radius-md);
          background: var(--teal-50);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 48px;
          font-weight: 700;
          color: var(--teal-800);
        }
        .public-doctor-two-col {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 20px;
        }
        .expertise-tags { display: flex; flex-wrap: wrap; gap: 8px; }
        .expertise-tag {
          padding: 6px 12px;
          border-radius: var(--radius-sm);
          background: var(--surface-active);
          border: 1px solid #BAE6FD;
          font-size: 13px;
          color: #0369A1;
        }
        .map-placeholder {
          width: 200px;
          height: 120px;
          border-radius: var(--radius-sm);
          background: linear-gradient(135deg, #1e293b, #334155);
        }
        .availability-box {
          background: var(--surface-active);
          padding: 14px;
          border-radius: var(--radius-sm);
        }
        .service-toggle {
          flex: 1;
          padding: 10px;
          border-radius: var(--radius-sm);
          border: 1px solid var(--border-default);
          background: var(--surface-card);
          cursor: pointer;
          font-size: 13px;
          font-weight: 500;
        }
        .service-toggle--active {
          background: var(--teal-800);
          color: #fff;
          border-color: var(--teal-800);
        }
        .trust-row {
          display: flex;
          justify-content: space-between;
          margin-top: 16px;
          padding-top: 16px;
          border-top: 1px solid var(--border-default);
          font-size: 11px;
          color: var(--stone-600);
        }
        .trust-row span { display: flex; align-items: center; gap: 4px; }
        @media (max-width: 900px) {
          .public-doctor-grid { grid-template-columns: 1fr; }
          .public-doctor-two-col { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
