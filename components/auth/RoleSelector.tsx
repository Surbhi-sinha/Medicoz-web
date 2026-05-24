'use client';

import { Stethoscope, User } from 'lucide-react';
import type { UserRole } from '@/lib/roles';

export function RoleSelector({
  value,
  onChange,
}: {
  value: UserRole;
  onChange: (role: UserRole) => void;
}) {
  const options: { role: UserRole; label: string; icon: typeof Stethoscope }[] = [
    { role: 'DOCTOR', label: 'I am a Doctor', icon: Stethoscope },
    { role: 'PATIENT', label: 'I am a Patient', icon: User },
  ];

  return (
    <div style={{ display: 'flex', gap: 12 }} role="radiogroup" aria-label="Account type">
      {options.map((opt) => {
        const selected = value === opt.role;
        const Icon = opt.icon;
        return (
          <button
            key={opt.role}
            type="button"
            role="radio"
            aria-checked={selected}
            className={`role-card ${selected ? 'role-card--selected' : ''}`}
            onClick={() => onChange(opt.role)}
          >
            <Icon size={22} color={selected ? 'var(--teal-800)' : 'var(--stone-600)'} aria-hidden />
            <span className="role-card__label">{opt.label}</span>
          </button>
        );
      })}
    </div>
  );
}
