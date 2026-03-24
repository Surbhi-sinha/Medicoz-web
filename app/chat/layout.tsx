/**
 * app/chat/layout.tsx — Chat shell with auth guard
 *
 * WHY THE AUTH GUARD LIVES HERE AND NOT IN MIDDLEWARE
 * Next.js middleware runs on the Edge runtime — it can't access sessionStorage
 * (browser APIs don't exist there). We could check for a cookie in middleware,
 * but we're using sessionStorage for tokens (see authStore.ts for why).
 * The pragmatic solution: check auth in this layout component, redirect if
 * the token is missing. This runs on the client after hydration.
 *
 * The slight downside: there's a brief flash of the chat shell before the
 * redirect fires. We handle this with the `if (!token) return null` guard —
 * the shell renders nothing until we know the auth state.
 *
 * WHY WEBSOCKETPROVIDER WRAPS THE WHOLE CHAT LAYOUT
 * The WebSocket connection should be created once when the user enters /chat
 * and destroyed when they leave. If we put WebSocketProvider inside each
 * room's page component, the connection would reconnect on every room switch.
 * The layout component has exactly the right lifecycle: mounted on /chat entry,
 * unmounted on /chat exit.
 *
 * WHY THE ROOM LIST IS IN THE LAYOUT, NOT EACH PAGE
 * The sidebar (room list) is persistent — it's always visible regardless of
 * which room is open. Rendering it in the layout means it's never unmounted
 * during room navigation, so the room list state is preserved (scroll position,
 * unread counts) even as the right panel changes.
 */

'use client';

import { useEffect }         from 'react';
import { useRouter }         from 'next/navigation';
import { WebSocketProvider } from '@/context/WebSocketContext';
import { useAuthStore }      from '@/stores/authStore';
import { useChatStore }      from '@/stores/chatStore';
import { api }               from '@/lib/api';
// Both components live in the chat component barrel — index.tsx
import { RoomList } from '@/components/chat/RoomList';
import { ConnectionBanner } from '@/components/chat/ConnectionBanner';

// ─── Inner shell (needs WS context) ──────────────────────────────────────────

function ChatShell({ children }: { children: React.ReactNode }) {
  const router              = useRouter();
  const { token, user, clearAuth } = useAuthStore();
  const { setRooms }        = useChatStore();

  // Auth guard — redirect to login if no token
  useEffect(() => {
    if (!token) router.replace('/login');
  }, [token, router]);

  // Load the room list once on mount.
  // We do this in the layout (not each room page) so the sidebar is
  // populated before the user selects a room.
  useEffect(() => {
    if (!token) return;

    api.chat
      .getRooms(token)
      .then((rooms) => {
        // getting the list of rooms from from getRooms api call and if there are no rooms then setting an empty array
        const list = Array.isArray(rooms) ? rooms : [];
        // unread counts per-connection, we derive them from WS events
        setRooms(list.map((r: any) => ({ ...r, unreadCount: r.unreadCount ?? 0 })));
      })
      .catch((err: unknown) => {
        const msg = err instanceof Error ? err.message : String(err);
        if (process.env.NODE_ENV === 'development') {
          console.error('[chat/layout] getRooms failed:', msg);
          if (msg.includes('Cannot GET /chat/rooms')) {
            console.error(
              '→ medicoz-api is running without chat routes: stop the API, run `npm run build` + start again so ChatModule loads.',
            );
          }
        }
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
  }, [token]);

  const handleLogout = () => {
    clearAuth();
    router.push('/login');
  };

  // Don't render anything until we confirm auth state —
  // prevents the flash of unauthenticated content
  if (!token) return null;

  return (
    <div style={{
      display:    'flex',
      height:     '100vh',
      overflow:   'hidden',
      background: '#FAFAF8',
    }}>
      {/* ── Sidebar: always visible, never unmounted ─────────────────── */}
      <aside style={{
        width:         '300px',
        flexShrink:    0,
        borderRight:   '1px solid #E4E2DC',
        display:       'flex',
        flexDirection: 'column',
        background:    '#fff',
      }}>

        {/* Brand bar */}
        <div style={{
          padding:        '16px 20px 13px',
          borderBottom:   '1px solid #F2F1EE',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'space-between',
        }}>
          {/* Logo mark + wordmark */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <div style={{
              width: '28px', height: '28px', borderRadius: '8px',
              background: '#0D5454',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none"
                stroke="#fff" strokeWidth="2.2" strokeLinecap="round">
                <path d="M22 12h-4l-3 9L9 3l-3 9H2"/>
              </svg>
            </div>
            <span style={{
              fontSize: '15px', fontWeight: 600, color: '#1A1917',
              fontFamily: "'DM Sans', sans-serif", letterSpacing: '-0.2px',
            }}>
              MedicoZ
            </span>
          </div>

          {/* User initials + logout */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            {/* Avatar — initials derived from the stored user object */}
            <div style={{
              width: '30px', height: '30px', borderRadius: '50%',
              background: '#F0FAFA', color: '#1A8080',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '11px', fontWeight: 700, letterSpacing: '0',
            }}>
              {user?.firstName?.charAt(0)}{user?.lastName?.charAt(0)}
            </div>

            <button
              onClick={handleLogout}
              title="Sign out"
              style={{
                width: '28px', height: '28px', borderRadius: '6px',
                background: 'transparent', border: '1px solid #E4E2DC',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: '#A09D94', transition: 'background .1s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#F2F1EE')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                <polyline points="16,17 21,12 16,7"/>
                <line x1="21" y1="12" x2="9" y2="12"/>
              </svg>
            </button>
          </div>
        </div>

        {/* Room list fills remaining height */}
        <RoomList />
      </aside>

      {/* ── Main content: changes per room route ─────────────────────── */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>
        {/* Banner sits above the room content at all times */}
        <ConnectionBanner />
        {children}
      </main>
    </div>
  );
}

// ─── Exported layout: ChatShell wrapped in WebSocketProvider ─────────────────

export default function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <WebSocketProvider>
      <ChatShell>{children}</ChatShell>
    </WebSocketProvider>
  );
}