'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/stores/authStore';
import type { UserRole } from '@/lib/roles';
import { getDashboardPath } from '@/lib/roles';

export function RoleGate({
  allowedRole,
  children,
}: {
  allowedRole: UserRole;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  useEffect(() => {
    if (!token) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== allowedRole) {
      router.replace(getDashboardPath(user.role));
    }
  }, [token, user, allowedRole, router]);

  if (!token || !user || user.role !== allowedRole) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#6B6860',
        }}
      >
        Loading…
      </div>
    );
  }

  return <>{children}</>;
}
