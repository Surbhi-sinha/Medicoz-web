'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useChatStore } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';
import { api } from '@/lib/api';
import type { Room } from '@/stores/chatStore';

const MONGO_ID_RE = /^[a-f\d]{24}$/i;

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Returns initials from a name, e.g. "Arun Kumar" → "AK" */
function initials(name: string): string {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

/** Returns a deterministic soft colour for a room's avatar */
const AVATAR_COLORS = [
  { bg: '#E1F5EE', color: '#085041' },
  { bg: '#EEEDFE', color: '#534AB7' },
  { bg: '#FAECE7', color: '#993C1D' },
  { bg: '#E6F1FB', color: '#0C447C' },
  { bg: '#FAEEDA', color: '#633806' },
];
function avatarColor(id: string) {
  const idx = id.charCodeAt(id.length - 1) % AVATAR_COLORS.length;
  return AVATAR_COLORS[idx];
}

/** Formats a timestamp as a short relative label */
function formatTime(iso: string | null): string {
  if (!iso) return '';
  const d   = new Date(iso);
  const now = new Date();
  const diff = now.getTime() - d.getTime();

  if (diff < 60_000)         return 'now';
  if (diff < 3_600_000)      return `${Math.floor(diff / 60_000)}m`;
  if (diff < 86_400_000)     return `${Math.floor(diff / 3_600_000)}h`;
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomItem
// ─────────────────────────────────────────────────────────────────────────────
function RoomItem({ room, isActive }: { room: Room; isActive: boolean }) {
  const router    = useRouter();
  const { user }  = useAuthStore();

  // For direct rooms, show the other participant's name
  const displayName = room.type === 'group'
    ? (room.name ?? 'Group chat')
    : room.participants.find((p) => p._id !== user?.id)?.name ?? 'Chat';

  const { bg, color } = avatarColor(room._id);

  return (
    <div
      onClick={() => router.push(`/chat/${room._id}`)}
      style={{
        display:       'flex',
        alignItems:    'center',
        gap:           '10px',
        padding:       '11px 14px',
        cursor:        'pointer',
        borderBottom:  '0.5px solid var(--color-border-tertiary)',
        borderLeft:    isActive ? '2px solid #1D9E75' : '2px solid transparent',
        background:    isActive ? 'var(--color-background-primary)' : 'transparent',
        transition:    'background .12s',
      }}
      onMouseEnter={(e) => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'var(--color-background-primary)';
      }}
      onMouseLeave={(e) => {
        if (!isActive) (e.currentTarget as HTMLDivElement).style.background = 'transparent';
      }}
    >
      {/* Avatar */}
      <div style={{
        width: '38px', height: '38px', borderRadius: '50%',
        background: bg, color, display: 'flex', alignItems: 'center',
        justifyContent: 'center', fontSize: '12px', fontWeight: 500, flexShrink: 0,
      }}>
        {initials(displayName)}
      </div>

      {/* Text */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontSize: '13px', fontWeight: 500, color: 'var(--color-text-primary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
        }}>
          {displayName}
        </div>
        <div style={{
          fontSize: '12px', color: 'var(--color-text-secondary)',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px',
        }}>
          {room.lastMessage ?? 'No messages yet'}
        </div>
      </div>

      {/* Time + badge */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '4px', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
          {formatTime(room.lastMessageAt)}
        </span>
        {room.unreadCount > 0 && (
          <span style={{
            background: '#1D9E75', color: '#fff', borderRadius: '10px',
            fontSize: '11px', padding: '1px 6px', fontWeight: 500,
          }}>
            {room.unreadCount > 99 ? '99+' : room.unreadCount}
          </span>
        )}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// RoomList
// ─────────────────────────────────────────────────────────────────────────────
function normalizeRoomFromApi(raw: any): Room {
  const _id = typeof raw._id === 'string' ? raw._id : raw._id?.toString?.() ?? '';
  const participants = Array.isArray(raw.participants)
    ? raw.participants.map((p: any) => ({
        _id: typeof p._id === 'string' ? p._id : p._id?.toString?.() ?? String(p),
        name:
          p.name ??
          (`${p.firstName ?? ''} ${p.lastName ?? ''}`.trim() || p.email || 'User'),
        email: p.email ?? '',
        avatar: p.avatar,
      }))
    : [];
  return {
    _id,
    type: raw.type ?? 'direct',
    name: raw.name ?? null,
    participants,
    lastMessage: raw.lastMessage ?? null,
    lastMessageAt:
      raw.lastMessageAt != null
        ? typeof raw.lastMessageAt === 'string'
          ? raw.lastMessageAt
          : new Date(raw.lastMessageAt).toISOString()
        : null,
    unreadCount: raw.unreadCount ?? 0,
  };
}

export function RoomList() {
  const router = useRouter();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const rooms = useChatStore((s) => s.rooms);
  const activeRoomId = useChatStore((s) => s.activeRoomId);
  const connected = useChatStore((s) => s.connected);
  const setActiveRoom = useChatStore((s) => s.setActiveRoom);

  const [peerId, setPeerId] = useState('');
  const [startLoading, setStartLoading] = useState(false);
  const [startError, setStartError] = useState('');

  async function startDirectChat() {
    setStartError('');
    const id = peerId.trim();
    if (!token) {
      setStartError('Not signed in.');
      return;
    }
    if (!MONGO_ID_RE.test(id)) {
      setStartError('Enter a valid 24-character user ID from your database.');
      return;
    }
    if (user?.id && id === user.id) {
      setStartError('Use another user’s ID, not your own.');
      return;
    }
    setStartLoading(true);
    try {
      const created = await api.chat.createRoom(token, {
        type: 'direct',
        participants: [id],
      });
      const roomId =
        typeof created._id === 'string' ? created._id : created._id?.toString?.();
      if (!roomId) throw new Error('No room id returned');

      const full = await api.chat.getRoom(token, roomId);
      const room = normalizeRoomFromApi(full);

      useChatStore.setState((s) => ({
        rooms: [room, ...s.rooms.filter((r) => r._id !== room._id)],
      }));
      setPeerId('');
      setActiveRoom(roomId);
      router.push(`/chat/${roomId}`);
    } catch (e) {
      setStartError(e instanceof Error ? e.message : 'Could not start chat');
    } finally {
      setStartLoading(false);
    }
  }

  return (
    <aside style={{
      width: '280px', flexShrink: 0,
      borderRight: '0.5px solid var(--color-border-tertiary)',
      display: 'flex', flexDirection: 'column',
      background: 'var(--color-background-secondary)',
    }}>
      {/* Header */}
      <div style={{
        padding: '14px 16px',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <span style={{ fontSize: '14px', fontWeight: 500, color: 'var(--color-text-primary)' }}>
          Messages
        </span>
        {/* Connection dot */}
        <span title={connected ? 'Connected' : 'Reconnecting...'} style={{
          width: '8px', height: '8px', borderRadius: '50%',
          background: connected ? '#639922' : '#E24B4A',
          display: 'inline-block', transition: 'background .3s',
        }} />
      </div>

      {/* Search */}
      <div style={{ padding: '10px 12px' }}>
        <input
          placeholder="Search conversations..."
          style={{
            width: '100%', padding: '7px 12px',
            border: '0.5px solid var(--color-border-tertiary)',
            borderRadius: 'var(--border-radius-md)',
            fontSize: '13px',
            background: 'var(--color-background-primary)',
            color: 'var(--color-text-primary)',
            outline: 'none',
          }}
        />
      </div>

      {/* Start 1:1 chat — other user’s MongoDB _id (see users collection) */}
      <div
        style={{
          padding: '0 12px 12px',
          borderBottom: '0.5px solid var(--color-border-tertiary)',
        }}
      >
        <div
          style={{
            fontSize: '11px',
            fontWeight: 600,
            color: 'var(--color-text-tertiary)',
            textTransform: 'uppercase',
            letterSpacing: '0.04em',
            marginBottom: '8px',
          }}
        >
          New conversation
        </div>
        <div style={{ display: 'flex', gap: '8px', alignItems: 'stretch' }}>
          <input
            value={peerId}
            onChange={(e) => setPeerId(e.target.value)}
            placeholder="Other user’s ID"
            disabled={startLoading || !token}
            onKeyDown={(e) => e.key === 'Enter' && startDirectChat()}
            style={{
              flex: 1,
              minWidth: 0,
              padding: '8px 10px',
              border: '0.5px solid var(--color-border-tertiary)',
              borderRadius: 'var(--border-radius-md)',
              fontSize: '12px',
              background: 'var(--color-background-primary)',
              color: 'var(--color-text-primary)',
              outline: 'none',
            }}
          />
          <button
            type="button"
            disabled={startLoading || !peerId.trim() || !token}
            onClick={startDirectChat}
            style={{
              padding: '8px 12px',
              borderRadius: 'var(--border-radius-md)',
              border: 'none',
              background: '#0D5454',
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor:
                startLoading || !peerId.trim() || !token ? 'not-allowed' : 'pointer',
              opacity: startLoading || !peerId.trim() || !token ? 0.5 : 1,
              flexShrink: 0,
            }}
          >
            {startLoading ? '…' : 'Start'}
          </button>
        </div>
        {startError ? (
          <p
            style={{
              margin: '8px 0 0',
              fontSize: '11px',
              color: '#C0392B',
            }}
          >
            {startError}
          </p>
        ) : (
          <p
            style={{
              margin: '6px 0 0',
              fontSize: '11px',
              color: 'var(--color-text-tertiary)',
              lineHeight: 1.35,
            }}
          >
            Paste the other person’s <code style={{ fontSize: '10px' }}>_id</code> from
            MongoDB <code style={{ fontSize: '10px' }}>users</code> (24 hex characters).
          </p>
        )}
      </div>

      {/* Room items */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rooms.length === 0 ? (
          <div style={{
            padding: '32px 16px', textAlign: 'center',
            fontSize: '13px', color: 'var(--color-text-secondary)',
          }}>
            No conversations yet
          </div>
        ) : (
          rooms.map((room) => (
            <RoomItem
              key={room._id}
              room={room}
              isActive={room._id === activeRoomId}
            />
          ))
        )}
      </div>
    </aside>
  );
}