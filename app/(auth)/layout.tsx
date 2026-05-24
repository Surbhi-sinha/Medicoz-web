import type { Metadata } from 'next';
import { AuthTabs } from '@/components/auth/AuthTabs';

export const metadata: Metadata = {
  title: 'MedicoZ — Sign in',
  icons: { icon: '/medicoz.png' },
};

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="auth-layout">
      <aside className="auth-hero" aria-hidden={false}>
        <div className="auth-hero__rings" />
        <div className="auth-hero__logo">
          <div className="auth-hero__logo-mark" aria-hidden>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
              <path d="M19 8h-2V6a3 3 0 0 0-6 0v2H9a2 2 0 0 0-2 2v9a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-9a2 2 0 0 0-2-2z" />
              <path d="M12 11v4M10 13h4" />
            </svg>
          </div>
          <span>MedicoZ</span>
        </div>

        <div className="auth-hero__copy">
          <h2 className="auth-hero__headline">
            Advancing Health through
            <br />
            Clinical Precision
          </h2>
          <p className="auth-hero__text">
            Secure messaging between doctors and patients. Every conversation stays private
            and protected.
          </p>
        </div>

        <div className="auth-hero__stats">
          <div>
            <strong>99.9%</strong>
            <span>Uptime reliability</span>
          </div>
          <div>
            <strong>AES-256</strong>
            <span>Encryption level</span>
          </div>
        </div>

        <p className="auth-hero__legal">
          © {new Date().getFullYear()} MedicoZ Systems. HIPAA &amp; GDPR Compliant.
        </p>
      </aside>

      <div className="auth-panel">
        <div className="auth-panel__inner">
          <AuthTabs />
          {children}
        </div>
      </div>

      <style>{`
        .auth-layout {
          display: flex;
          min-height: 100vh;
          background: var(--stone-50);
        }
        .auth-hero {
          width: min(48%, 520px);
          flex-shrink: 0;
          background: var(--teal-900);
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          padding: 48px 44px;
          position: relative;
          overflow: hidden;
          color: #fff;
        }
        .auth-hero__rings::before,
        .auth-hero__rings::after {
          content: '';
          position: absolute;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.08);
        }
        .auth-hero__rings::before {
          width: 320px; height: 320px;
          top: -80px; right: -80px;
        }
        .auth-hero__rings::after {
          width: 220px; height: 220px;
          top: -40px; right: -40px;
        }
        .auth-hero__logo {
          display: flex;
          align-items: center;
          gap: 12px;
          font-size: 20px;
          font-weight: 600;
          position: relative;
          z-index: 1;
        }
        .auth-hero__logo-mark {
          width: 40px;
          height: 40px;
          border-radius: 10px;
          background: rgba(255,255,255,0.12);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .auth-hero__headline {
          font-family: var(--font-display);
          font-size: clamp(28px, 3vw, 38px);
          line-height: 1.2;
          font-weight: 400;
          margin: 0 0 16px;
          position: relative;
          z-index: 1;
        }
        .auth-hero__text {
          font-size: 14px;
          color: rgba(255,255,255,0.6);
          line-height: 1.65;
          max-width: 320px;
          margin: 0;
          position: relative;
          z-index: 1;
        }
        .auth-hero__stats {
          display: flex;
          gap: 40px;
          position: relative;
          z-index: 1;
        }
        .auth-hero__stats strong {
          display: block;
          font-size: 22px;
          letter-spacing: 0.02em;
        }
        .auth-hero__stats span {
          font-size: 11px;
          text-transform: uppercase;
          letter-spacing: 0.08em;
          color: rgba(255,255,255,0.45);
        }
        .auth-hero__legal {
          font-size: 11px;
          color: rgba(255,255,255,0.4);
          margin: 0;
          position: relative;
          z-index: 1;
        }
        .auth-panel {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: 40px 32px;
          overflow-y: auto;
        }
        .auth-panel__inner {
          width: 100%;
          max-width: 440px;
          animation: fadeUp 0.35s ease both;
        }
        @media (max-width: 900px) {
          .auth-layout { flex-direction: column; }
          .auth-hero {
            width: 100%;
            min-height: auto;
            padding: 32px 24px;
            gap: 24px;
          }
          .auth-hero__stats { gap: 24px; }
          .auth-hero__legal { display: none; }
        }
      `}</style>
    </div>
  );
}
