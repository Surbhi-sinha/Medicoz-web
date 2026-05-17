import type { Metadata } from 'next';
import '@/app/globals.css';
import { PushNotificationProvider } from '@/components/PushNotifications/PushNotificationProvider';


export const metadata: Metadata = {
  title: 'MedicoZ',
  description: 'Secure healthcare messaging.',
  icons: {
    icon: '/medicoz.png',
  },
};

/**
 * Root layout — only `<html>` / `<body>` and global styles.
 * Chat chrome (sidebar, WebSocket, room fetch) lives in `app/chat/layout.tsx`.
 */
export default function RootLayout({ children }: { children: React.ReactNode }) {
  
  
  return (
    <html lang="en">
      <body>
        <PushNotificationProvider/>
        {children}
        </body>
    </html>
  );
}
