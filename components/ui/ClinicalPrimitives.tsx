'use client';

import { ReactNode, ButtonHTMLAttributes, InputHTMLAttributes } from 'react';

export function Card({
  children,
  className = '',
  padding = true,
  style,
}: {
  children: ReactNode;
  className?: string;
  padding?: boolean;
  style?: React.CSSProperties;
}) {
  return (
    <div
      className={`clinical-card ${padding ? 'clinical-card--padded' : ''} ${className}`.trim()}
      style={style}
    >
      {children}
    </div>
  );
}

export function Badge({
  children,
  variant = 'default',
}: {
  children: ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'critical' | 'info' | 'teal';
}) {
  return <span className={`clinical-badge clinical-badge--${variant}`}>{children}</span>;
}

export function Btn({
  children,
  variant = 'primary',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
}) {
  return (
    <button
      type="button"
      className={`clinical-btn clinical-btn--${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function FieldLabel({ children, htmlFor }: { children: ReactNode; htmlFor?: string }) {
  return (
    <label className="clinical-label" htmlFor={htmlFor}>
      {children}
    </label>
  );
}

export function Input({
  className = '',
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { error?: boolean }) {
  return (
    <input
      className={`clinical-input ${error ? 'clinical-input--error' : ''} ${className}`.trim()}
      {...props}
    />
  );
}

export function Textarea({
  className = '',
  ...props
}: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={`clinical-input clinical-textarea ${className}`.trim()} {...props} />;
}

export function SectionTitle({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="clinical-section-head">
      <h2 className="clinical-section-title">{title}</h2>
      {action}
    </div>
  );
}
