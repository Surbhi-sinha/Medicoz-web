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
  Users,
  X,
} from 'lucide-react';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/lib/roles';
import { getProfilePath } from '@/lib/roles';
import { Btn } from '@/components/ui/ClinicalPrimitives';

type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  match?: (path: string) => boolean;
};

function navForRole(role: UserRole): NavItem[] {
  const base = role === 'PATIENT' ? '/patient' : '/doctor';
  if (role === 'PATIENT') {
    return [
      {
        href: `${base}/dashboard`,
        label: 'Dashboard',
        icon: LayoutDashboard,
        match: (p) => p.startsWith(`${base}/dashboard`),
      },
      {
        href: '/chat',
        label: 'Messages',
        icon: MessageSquare,
        match: (p) => p.startsWith('/chat'),
      },
      {
        href: `${base}/profile`,
        label: 'Settings',
        icon: Settings,
        match: (p) => p.startsWith(`${base}/profile`),
      },
    ];
  }
  return [
    {
      href: `${base}/dashboard`,
      label: 'Dashboard',
      icon: LayoutDashboard,
      match: (p) => p === `${base}/dashboard`,
    },
    {
      href: `${base}/patients`,
      label: 'Patients',
      icon: Users,
      match: (p) => p.startsWith(`${base}/patients`),
    },
    {
      href: `${base}/schedule`,
      label: 'Schedule',
      icon: Calendar,
      match: (p) => p.startsWith(`${base}/schedule`),
    },
    {
      href: '/chat',
      label: 'Messages',
      icon: MessageSquare,
      match: (p) => p.startsWith('/chat'),
    },
    {
      href: `${base}/profile`,
      label: 'Settings',
      icon: Settings,
      match: (p) => p.startsWith(`${base}/profile`),
    },
  ];
}

export function ClinicalShell({
  role,
  title,
  searchPlaceholder = 'Search records…',
  showSearch = true,
  headerExtra,
  children,
}: {
  role: UserRole;
  title: string;
  searchPlaceholder?: string;
  showSearch?: boolean;
  headerExtra?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const clearAuth = useAuthStore((s) => s.clearAuth);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const nav = navForRole(role);
  const displayName = user
    ? `Dr. ${user.firstName} ${user.lastName}`.trim().replace(/^Dr\.\s*$/, 'User')
    : 'User';
  const patientName = user ? `${user.firstName} ${user.lastName}`.trim() : 'User';
  const name = role === 'DOCTOR' ? displayName : patientName;
  const initials = user
    ? `${user.firstName?.charAt(0) ?? ''}${user.lastName?.charAt(0) ?? ''}`.toUpperCase()
    : 'MZ';
  const subtitle =
    role === 'DOCTOR'
      ? (user?.role === 'DOCTOR' ? 'CLINICAL PORTAL' : 'PORTAL')
      : 'PATIENT PORTAL';

  const handleLogout = async () => {
    await clearAuth();
    router.replace('/login');
  };

  const closeSidebar = () => setSidebarOpen(false);

  return (
    <div className="clinical-shell">
      <div
        className={`clinical-overlay ${sidebarOpen ? 'clinical-overlay--visible' : ''}`}
        onClick={closeSidebar}
        aria-hidden={!sidebarOpen}
      />

      <aside
        className={`clinical-sidebar ${sidebarOpen ? 'clinical-sidebar--open' : ''}`}
        aria-label="Main navigation"
      >
        <div className="clinical-brand">
          <div className="clinical-brand__name">MedicoZ</div>
          <div className="clinical-brand__sub">Clinical Portal</div>
        </div>

        <nav className="clinical-nav" aria-label="Portal sections">
          {nav.map((item) => {
            const active = item.match
              ? item.match(pathname ?? '')
              : pathname === item.href;
            const Icon = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`clinical-nav__link ${active ? 'clinical-nav__link--active' : ''}`}
                onClick={closeSidebar}
              >
                <Icon size={18} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <Btn
          variant="primary"
          className="clinical-sidebar__cta"
          onClick={() => router.push('/chat')}
        >
          + New Appointment
        </Btn>

        <div className="clinical-sidebar__footer">
          <Link href={getProfilePath(role)} onClick={closeSidebar}>
            <HelpCircle size={16} aria-hidden />
            Help Center
          </Link>
          <button type="button" className="logout" onClick={handleLogout}>
            <LogOut size={16} aria-hidden />
            Logout
          </button>
        </div>
      </aside>

      <div className="clinical-main">
        <header className="clinical-header">
          <button
            type="button"
            className="clinical-menu-toggle"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={sidebarOpen}
          >
            {sidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          <h1 className="clinical-header__title">{title}</h1>

          {showSearch && (
            <div className="clinical-header__search">
              <Search size={18} aria-hidden />
              <input
                type="search"
                placeholder={searchPlaceholder}
                aria-label="Search"
              />
            </div>
          )}

          {headerExtra}

          <div className="clinical-header__actions">
            <button type="button" className="clinical-icon-btn" aria-label="Notifications">
              <Bell size={18} />
              <span className="clinical-icon-btn__dot" aria-hidden />
            </button>
            <Link
              href={getProfilePath(role)}
              className="clinical-icon-btn"
              aria-label="Settings"
            >
              <Settings size={18} />
            </Link>
            <div className="clinical-user">
              <div className="clinical-user__meta">
                <p className="clinical-user__name">{name}</p>
                <p className="clinical-user__role">{subtitle}</p>
              </div>
              <div className="clinical-user__avatar" aria-hidden>
                {initials}
              </div>
            </div>
          </div>
        </header>

        <div className="clinical-content">{children}</div>
      </div>
    </div>
  );
}

/** @deprecated Use ClinicalShell — kept for gradual migration */
export { ClinicalShell as DashboardShell };
