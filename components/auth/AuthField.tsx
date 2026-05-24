'use client';

import { InputHTMLAttributes, ReactNode } from 'react';
import { FieldLabel, Input } from '@/components/ui/ClinicalPrimitives';

export function AuthField({
  label,
  labelExtra,
  error,
  id,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string;
  labelExtra?: ReactNode;
  error?: string;
}) {
  const fieldId = id ?? label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'baseline',
          gap: 8,
        }}
      >
        <FieldLabel htmlFor={fieldId}>{label}</FieldLabel>
        {labelExtra}
      </div>
      <Input id={fieldId} error={!!error} aria-invalid={!!error} {...props} />
      {error && (
        <span style={{ fontSize: 12, color: 'var(--error)' }} role="alert">
          {error}
        </span>
      )}
    </div>
  );
}
