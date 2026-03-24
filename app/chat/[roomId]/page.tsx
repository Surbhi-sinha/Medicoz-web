/**
 * app/chat/[roomId]/page.tsx — Active chat room view
 *
 * DATA FLOW RECAP (worth restating here because this is where it all meets):
 *
 *   History   → REST (on room open, and on scroll-up for older messages)
 *   Real-time → WebSocket events → Zustand → this component re-renders
 *   Sending   → optimistic Zustand update → WebSocket emit → server ack → confirm
 *
 * WHY use() FOR PARAMS?
 * Next.js 15 made params a Promise. `use(params)` unwraps it inside a Client
 * Component. The alternative — async Server Component + 'use client' child —
 * adds a component boundary for no gain. `use()` is the clean solution.
 *
 * MESSAGE GROUPING LOGIC
 * We group consecutive messages from the same sender to reduce visual noise
 * (one avatar per group instead of one per message). The grouping resets when:
 *   1. The sender changes
 *   2. The date changes (daily dividers separate groups across midnight)
 *
 * SCROLL BEHAVIOUR
 * - On initial load: scroll to bottom (show latest messages)
 * - On new incoming message: scroll to bottom
 * - On load-more (scroll up): preserve scroll position (don't jump to top)
 * The first two use scrollIntoView on a bottom anchor ref.
 * The third is handled by prependMessages in the store — prepending doesn't
 * change the scroll position in most browsers (content grows above the viewport).
 */

'use client';

import { use, useEffect, useRef, useState } from 'react';
import { useChat }              from '@/hooks/useChat';
import { useChatStore }         from '@/stores/chatStore';
import { useAuthStore }         from '@/stores/authStore';
import {
  MessageBubble } from '@/components/chat/MessageBubble';
import { TypingIndication } from '@/components/chat/TypingIndication';
import { ChatInput } from '@/components/chat/ChatInput';
import type { Message } from '@/stores/chatStore';

// ─── Date divider ─────────────────────────────────────────────────────────────

function DateDivider({ label }: { label: string }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px',
      padding: '10px 0', userSelect: 'none',
    }}>
      <div style={{ flex: 1, height: '1px', background: '#F2F1EE' }}/>
      <span style={{
        fontSize:     '11px',
        color:        '#A09D94',
        fontWeight:   500,
        padding:      '3px 10px',
        background:   '#F2F1EE',
        borderRadius: '20px',
        letterSpacing: '0.03em',
      }}>
        {label}
      </span>
      <div style={{ flex: 1, height: '1px', background: '#F2F1EE' }}/>
    </div>
  );
}

// ─── Message grouping ─────────────────────────────────────────────────────────

interface MessageGroup {
  messages: Message[];
  dateDivider: string; // empty string means no divider needed before this group
}

function buildMessageGroups(messages: Message[]): MessageGroup[] {
  const groups: MessageGroup[] = [];
  let lastDate   = '';
  let lastSender = '';

  for (const msg of messages) {
    const date = new Date(msg.createdAt).toLocaleDateString([], {
      weekday: 'long', month: 'long', day: 'numeric',
    });

    const senderId = typeof msg.senderId === 'string'
      ? msg.senderId
      : msg.senderId._id;

    // Start a new group if the sender or date changed
    if (date !== lastDate || senderId !== lastSender) {
      groups.push({
        messages:    [msg],
        dateDivider: date !== lastDate ? date : '',
      });
      lastDate   = date;
      lastSender = senderId;
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }

  return groups;
}

// ─── Room header ──────────────────────────────────────────────────────────────

function RoomHeader({ roomId }: { roomId: string }) {
  const { user }  = useAuthStore();
  const rooms     = useChatStore((s) => s.rooms);
  const connected = useChatStore((s) => s.connected);

  const room = rooms.find((r) => r._id === roomId);
  if (!room) return null;

  const displayName = room.type === 'group'
    ? (room.name ?? 'Group')
    : room.participants.find((p) => p._id !== user?.id)?.name ?? 'Chat';

  const initials = displayName.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();

  const subtext = room.type === 'group'
    ? `${room.participants.length} members`
    : connected ? 'Online' : 'Away';

  return (
    <div style={{
      padding:      '13px 20px',
      borderBottom: '1px solid #F2F1EE',
      display:      'flex',
      alignItems:   'center',
      gap:          '12px',
      background:   '#fff',
    }}>
      <div style={{
        width: '38px', height: '38px', borderRadius: '12px',
        background: '#F0FAFA', color: '#1A8080', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '13px', fontWeight: 700,
      }}>
        {initials}
      </div>

      <div style={{ flex: 1 }}>
        <div style={{ fontSize: '14px', fontWeight: 600, color: '#1A1917' }}>
          {displayName}
        </div>
        <div style={{
          fontSize: '12px', marginTop: '1px',
          display: 'flex', alignItems: 'center', gap: '4px',
          color: room.type === 'direct' && connected ? '#1A8060' : '#A09D94',
        }}>
          {room.type === 'direct' && (
            <span style={{
              width: '6px', height: '6px', borderRadius: '50%',
              background: connected ? '#1A8060' : '#E4E2DC',
              display: 'inline-block',
            }}/>
          )}
          {subtext}
        </div>
      </div>
    </div>
  );
}

// ─── Room page ────────────────────────────────────────────────────────────────

export default function RoomPage({ params }: { params: Promise<{ roomId: string }> }) {
  const { roomId } = use(params);

  const { messages, sendMessage, loadMore, hasMore } = useChat(roomId);

  const listRef    = useRef<HTMLDivElement>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const prevCount  = useRef(0);

  const [moreLoading, setMoreLoading] = useState(false);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCount.current = messages.length;
  }, [messages.length]);

  const handleScroll = () => {
    // Load more when user scrolls to the very top
    if (listRef.current?.scrollTop === 0 && hasMore && !moreLoading) {
      setMoreLoading(true);
      loadMore().finally(() => setMoreLoading(false));
    }
  };

  const groups = buildMessageGroups(messages);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', background: '#FAFAF8' }}>

      <RoomHeader roomId={roomId} />

      {/* Message list */}
      <div
        ref={listRef}
        onScroll={handleScroll}
        style={{
          flex:           1,
          overflowY:      'auto',
          padding:        '20px 20px 8px',
          display:        'flex',
          flexDirection:  'column',
          gap:            '2px',
        }}
      >
        {/* Load more trigger */}
        {hasMore && (
          <div style={{ textAlign: 'center', marginBottom: '10px' }}>
            <button
              onClick={() => { setMoreLoading(true); loadMore().finally(() => setMoreLoading(false)); }}
              style={{
                fontSize:     '12px',
                color:        '#6B6860',
                background:   '#fff',
                border:       '1px solid #E4E2DC',
                padding:      '5px 16px',
                borderRadius: '20px',
                cursor:       'pointer',
              }}
            >
              {moreLoading ? 'Loading…' : 'Load earlier messages'}
            </button>
          </div>
        )}

        {/* Empty state */}
        {messages.length === 0 && (
          <div style={{
            flex:           1,
            display:        'flex',
            flexDirection:  'column',
            alignItems:     'center',
            justifyContent: 'center',
            gap:            '10px',
            paddingTop:     '80px',
            color:          '#A09D94',
            fontSize:       '13px',
          }}>
            <svg width="44" height="44" viewBox="0 0 24 24" fill="none"
              stroke="#E4E2DC" strokeWidth="1.2" strokeLinecap="round">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            No messages yet — start the conversation
          </div>
        )}

        {/* Message groups with date dividers */}
        {groups.map((group, gi) => (
          <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
            {group.dateDivider && <DateDivider label={group.dateDivider} />}
            {group.messages.map((msg, mi) => (
              <MessageBubble
                key={msg._id}
                message={msg}
                // Only show avatar on the first message of each group
                showAvatar={mi === 0}
              />
            ))}
          </div>
        ))}

        <TypingIndication roomId={roomId} />

        {/* Invisible anchor — we scroll here on new messages */}
        <div ref={bottomRef}/>
      </div>

      <ChatInput roomId={roomId} onSend={sendMessage} />
    </div>
  );
}