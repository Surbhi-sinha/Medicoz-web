import type { Metadata } from 'next';
import '@/app/globals.css';

export const metadata: Metadata = {
  title: 'MedicoZ',
  description: 'Secure healthcare messaging.',
};

/**
 * Root layout — only `<html>` / `<body>` and global styles.
 * Chat chrome (sidebar, WebSocket, room fetch) lives in `app/chat/layout.tsx`.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
