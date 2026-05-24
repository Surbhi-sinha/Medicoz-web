'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function AuthTabs() {
  const pathname = usePathname();
  const isLogin = pathname === '/login';

  return (
    <nav className="auth-tabs" aria-label="Authentication">
      <Link
        href="/login"
        className={`auth-tab ${isLogin ? 'auth-tab--active' : ''}`}
        aria-current={isLogin ? 'page' : undefined}
      >
        Sign in
      </Link>
      <Link
        href="/signup"
        className={`auth-tab ${!isLogin ? 'auth-tab--active' : ''}`}
        aria-current={!isLogin ? 'page' : undefined}
      >
        Create account
      </Link>
    </nav>
  );
}
