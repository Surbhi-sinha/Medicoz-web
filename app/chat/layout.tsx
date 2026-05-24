'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';
import { api } from '@/lib/api';
import { RoomList } from '@/components/chat/RoomList';
import { ConnectionBanner } from '@/components/chat/ConnectionBanner';
import { MessagesShell } from '@/components/chat/MessagesShell';
import { ChatInfoPanel } from '@/components/chat/ChatInfoPanel';

function ChatShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { token, user, clearAuth } = useAuthStore();
  const { setRooms } = useChatStore();

  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  useEffect(() => {
    if (!token) return;

    api.chat
      .getRooms(token)
      .then((rooms) => {
        const list = Array.isArray(rooms) ? rooms : [];
        setRooms(list.map((r: any) => ({ ...r, unreadCount: r.unreadCount ?? 0 })));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        const lower = msg.toLowerCase();
        if (
          lower.includes('unauthorized') ||
          lower.includes('401') ||
          lower.includes('invalid token') ||
          lower.includes('jwt')
        ) {
          clearAuth();
          router.replace('/login');
        } else {
          setRooms([]);
        }
      });
  }, [token, clearAuth, router, setRooms]);

  if (!token) return null;

  const isDoctor = user?.role === 'DOCTOR';

  return (
    <MessagesShell
      sidebar={
        <>
          <ConnectionBanner />
          <RoomList />
        </>
      }
      infoPanel={isDoctor ? <ChatInfoPanel /> : undefined}
    >
      {children}
    </MessagesShell>
  );
}

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <WebSocketProvider>
      <ChatShell>{children}</ChatShell>
    </WebSocketProvider>
  );
}
