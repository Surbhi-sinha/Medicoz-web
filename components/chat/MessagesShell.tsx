'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useState } from 'react';
import {
  Bell,
  Calendar,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Search,
  Settings,
  Shield,
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/lib/roles';
import { getProfilePath } from '@/lib/roles';
import { Btn } from '@/components/ui/ClinicalPrimitives';

function navForRole(role: UserRole) {
  const base = role === 'PATIENT' ? '/patient' : '/doctor';
  if (role === 'PATIENT') {
    return [
      { href: `${base}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
      { href: '/chat', label: 'Messages', icon: MessageSquare },
      { href: `${base}/profile`, label: 'Settings', icon: Settings },
    ];
  }
  return [
    { href: `${base}/dashboard`, label: 'Dashboard', icon: LayoutDashboard },
    { href: `${base}/patients`, label: 'Patients', icon: Users },
    { href: `${base}/schedule`, label: 'Schedule', icon: Calendar },
    { href: '/chat', label: 'Messages', icon: MessageSquare },
    { href: `${base}/profile`, label: 'Settings', icon: Settings },
  ];
}

export function MessagesShell({
  children,
  sidebar,
  infoPanel,
}: {
  children: ReactNode;
  sidebar: ReactNode;
  infoPanel?: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [menuOpen, setMenuOpen] = useState(false);

  const role = user?.role ?? 'PATIENT';
  const nav = navForRole(role);
  const initials = user
    ? `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase()
    : 'MZ';

  const handleLogout = async () => {
    await clearAuth();
    router.replace('/login');
  };

  return (
    <div className="messages-shell">
      <div
        className={`clinical-overlay ${menuOpen ? 'clinical-overlay--visible' : ''}`}
        onClick={() => setMenuOpen(false)}
        aria-hidden={!menuOpen}
      />

      <aside className={`clinical-sidebar messages-shell__nav ${menuOpen ? 'clinical-sidebar--open' : ''}`}>
        <div className="clinical-brand">
          <div className="clinical-brand__name">MedicoZ</div>
          <div className="clinical-brand__sub">Clinical Portal</div>
        </div>
        <nav className="clinical-nav">
          {nav.map((item) => {
            const active = pathname?.startsWith(item.href);
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`clinical-nav__link ${active ? 'clinical-nav__link--active' : ''}`}
                onClick={() => setMenuOpen(false)}
              >
                <Icon size={18} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <Btn variant="primary" className="clinical-sidebar__cta" onClick={() => router.push('/chat')}>
          + New Appointment
        </Btn>
        <div className="clinical-sidebar__footer">
          <Link href={getProfilePath(role)}>
            <HelpCircle size={16} aria-hidden />
            Help Center
          </Link>
          <button type="button" className="logout" onClick={handleLogout}>
            <LogOut size={16} aria-hidden />
            Logout
          </button>
        </div>
      </aside>

      <div className="messages-shell__body">
        <header className="messages-shell__header">
          <button
            type="button"
            className="clinical-menu-toggle"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          <div className="messages-shell__title-row">
            <h1 className="clinical-header__title">Messages</h1>
            <span className="hipaa-badge">
              <Shield size={12} aria-hidden />
              HIPAA compliant
            </span>
          </div>
          <div className="clinical-header__search messages-shell__search">
            <Search size={18} aria-hidden />
            <input type="search" placeholder="Search conversations…" aria-label="Search conversations" />
          </div>
          <div className="clinical-header__actions">
            <button type="button" className="clinical-icon-btn" aria-label="Notifications">
              <Bell size={18} />
            </button>
            <Link href={getProfilePath(role)} className="clinical-icon-btn" aria-label="Settings">
              <Settings size={18} />
            </Link>
            <div className="clinical-user__avatar">{initials}</div>
          </div>
        </header>

        <div className="messages-shell__panels">
          <div className="messages-shell__sidebar">{sidebar}</div>
          <div className="messages-shell__chat">{children}</div>
          {infoPanel && <div className="messages-shell__info">{infoPanel}</div>}
        </div>
      </div>

      <style>{`
        .messages-shell {
          display: flex;
          min-height: 100vh;
          background: var(--surface-page);
        }
        .messages-shell__nav { height: 100vh; position: sticky; top: 0; }
        .messages-shell__body {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
        }
        .messages-shell__header {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 14px 20px;
          background: var(--surface-card);
          border-bottom: 1px solid var(--border-default);
          flex-wrap: wrap;
        }
        .messages-shell__title-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .messages-shell__title-row .clinical-header__title {
          font-size: 24px;
          margin: 0;
        }
        .hipaa-badge {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          padding: 4px 10px;
          border-radius: 999px;
          background: var(--teal-800);
          color: #fff;
          font-size: 10px;
          font-weight: 700;
          letter-spacing: 0.04em;
          text-transform: uppercase;
        }
        .messages-shell__search { flex: 1; max-width: 400px; }
        .messages-shell__panels {
          flex: 1;
          display: flex;
          min-height: 0;
          overflow: hidden;
        }
        .messages-shell__sidebar {
          width: 320px;
          flex-shrink: 0;
          border-right: 1px solid var(--border-default);
          background: var(--surface-card);
          display: flex;
          flex-direction: column;
          overflow: hidden;
        }
        .messages-shell__chat {
          flex: 1;
          display: flex;
          flex-direction: column;
          min-width: 0;
          background: var(--surface-card);
        }
        .messages-shell__info {
          width: 300px;
          flex-shrink: 0;
          border-left: 1px solid var(--border-default);
          background: var(--surface-page);
          overflow-y: auto;
          padding: 20px;
        }
        @media (max-width: 1200px) {
          .messages-shell__info { display: none; }
        }
        @media (max-width: 768px) {
          .messages-shell__sidebar {
            position: absolute;
            left: 0;
            top: var(--header-height);
            bottom: 0;
            z-index: 20;
            transform: translateX(-100%);
            transition: transform 0.25s;
            box-shadow: 4px 0 20px rgba(0,0,0,0.1);
          }
          .messages-shell__sidebar--open { transform: translateX(0); }
          .messages-shell__search { display: none; }
        }
      `}</style>
    </div>
  );
}
