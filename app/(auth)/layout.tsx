import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'MedicoZ — Sign in' };

// ─────────────────────────────────────────────────────────────────────────────
// Auth Layout
//
// Split screen:  left = brand panel (teal, decorative)
//                right = form content
// ─────────────────────────────────────────────────────────────────────────────
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{
      display:   'flex',
      minHeight: '100vh',
      background: '#FAFAF8',
    }}>
      {/* ── Left brand panel ─────────────────────────────────────────── */}
      <div style={{
        width:          '420px',
        flexShrink:     0,
        background:     '#0D5454',
        display:        'flex',
        flexDirection:  'column',
        justifyContent: 'space-between',
        padding:        '48px 44px',
        position:       'relative',
        overflow:       'hidden',
      }}>
        {/* Decorative rings */}
        <div style={{
          position:     'absolute', top: '-80px', right: '-80px',
          width:        '320px',   height: '320px',
          borderRadius: '50%',
          border:       '1px solid rgba(255,255,255,0.08)',
        }}/>
        <div style={{
          position:     'absolute', top: '-40px', right: '-40px',
          width:        '220px',   height: '220px',
          borderRadius: '50%',
          border:       '1px solid rgba(255,255,255,0.06)',
        }}/>
        <div style={{
          position:     'absolute', bottom: '80px', left: '-60px',
          width:        '260px',   height: '260px',
          borderRadius: '50%',
          border:       '1px solid rgba(255,255,255,0.05)',
        }}/>

        {/* Logo */}
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{
              width:        '36px', height: '36px',
              borderRadius: '10px',
              background:   'rgba(255,255,255,0.15)',
              display:      'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2" strokeLinecap="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span style={{
              fontFamily: 'DM Sans, sans-serif',
              fontSize:   '18px', fontWeight: 600,
              color:      '#fff', letterSpacing: '-0.3px',
            }}>MedicoZ</span>
          </div>
        </div>

        {/* Headline */}
        <div>
          <p style={{
            fontFamily:  'Instrument Serif, Georgia, serif',
            fontSize:    '38px',
            lineHeight:  '1.2',
            color:       '#fff',
            marginBottom: '20px',
            fontStyle:   'italic',
          }}>
            Healthcare,<br/>
            <span style={{ fontStyle: 'normal' }}>connected.</span>
          </p>
          <p style={{
            fontSize:   '14px',
            color:      'rgba(255,255,255,0.55)',
            lineHeight: '1.6',
            maxWidth:   '280px',
          }}>
            Secure messaging between doctors and patients. Every conversation stays private and protected.
          </p>
        </div>

        {/* Trust badges */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {['HIPAA compliant', 'End-to-end encrypted', 'ISO 27001 certified'].map((t) => (
            <div key={t} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <div style={{
                width: '16px', height: '16px', borderRadius: '50%',
                background: 'rgba(255,255,255,0.12)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <svg width="9" height="9" viewBox="0 0 12 12" fill="none">
                  <path d="M2 6l3 3 5-5" stroke="#99DCDC" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
              </div>
              <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.45)' }}>{t}</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────── */}
      <div style={{
        flex:           1,
        display:        'flex',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '40px 32px',
        overflowY:      'auto',
      }}>
        <div style={{ width: '100%', maxWidth: '400px' }}>
          {children}
        </div>
      </div>
    </div>
  );
}