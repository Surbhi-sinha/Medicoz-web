'use client';
import { useEffect, useRef, useCallback } from 'react';
import { MessageBubble }    from './MessageBubble';
import { TypingIndication } from './TypingIndication';
import type { Message }     from '@/stores/chatStore';
import { useAuthStore }     from '@/stores/authStore';

// ─────────────────────────────────────────────────────────────────────────────
// Date divider between messages from different days
// ─────────────────────────────────────────────────────────────────────────────
function DateDivider({ date }: { date: string }) {
  return (
    <div style={{
      textAlign:    'center',
      fontSize:     '11px',
      color:        'var(--color-text-tertiary)',
      padding:      '8px 0',
      position:     'relative',
      display:      'flex',
      alignItems:   'center',
      gap:          '12px',
    }}>
      <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
      {date}
      <div style={{ flex: 1, height: '0.5px', background: 'var(--color-border-tertiary)' }} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Groups consecutive messages from the same sender so we only show
// one avatar per group, keeping the chat visually clean.
// ─────────────────────────────────────────────────────────────────────────────
function groupMessages(messages: Message[]) {
  const groups: Array<{ messages: Message[]; date: string }> = [];
  let lastDate = '';
  let lastSenderId = '';

  for (const msg of messages) {
    const date = new Date(msg.createdAt).toLocaleDateString([], {
      weekday: 'long', month: 'long', day: 'numeric',
    });

    const sid = typeof msg.senderId === 'string' ? msg.senderId : msg.senderId._id;

    if (date !== lastDate || sid !== lastSenderId) {
      groups.push({ messages: [msg], date: date !== lastDate ? date : '' });
      lastDate      = date;
      lastSenderId  = sid;
    } else {
      groups[groups.length - 1].messages.push(msg);
    }
  }

  return groups;
}

// ─────────────────────────────────────────────────────────────────────────────
// MessageList
// ─────────────────────────────────────────────────────────────────────────────
export function MessageList({ messages, roomId, onLoadMore, hasMore, loading }: {
  messages:   Message[];
  roomId:     string;
  onLoadMore: () => void;
  hasMore:    boolean;
  loading:    boolean;
}) {
  const listRef    = useRef<HTMLDivElement>(null);
  const bottomRef  = useRef<HTMLDivElement>(null);
  const prevCount  = useRef(0);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (messages.length > prevCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
    prevCount.current = messages.length;
  }, [messages.length]);

  // Detect scroll to top → load more
  const handleScroll = useCallback(() => {
    if (!listRef.current) return;
    if (listRef.current.scrollTop === 0 && hasMore && !loading) {
      onLoadMore();
    }
  }, [hasMore, loading, onLoadMore]);

  const groups = groupMessages(messages);

  return (
    <div
      ref={listRef}
      onScroll={handleScroll}
      style={{
        flex:        1,
        overflowY:   'auto',
        padding:     '16px',
        display:     'flex',
        flexDirection: 'column',
        gap:         '4px',
      }}
    >
      {/* Load more button */}
      {hasMore && (
        <div style={{ textAlign: 'center', paddingBottom: '8px' }}>
          <button
            onClick={onLoadMore}
            style={{
              fontSize:     '12px',
              color:        'var(--color-text-secondary)',
              background:   'none',
              border:       '0.5px solid var(--color-border-tertiary)',
              padding:      '4px 16px',
              borderRadius: '20px',
              cursor:       'pointer',
            }}
          >
            {loading ? 'Loading...' : 'Load earlier messages'}
          </button>
        </div>
      )}

      {/* Message groups */}
      {groups.map((group, gi) => (
        <div key={gi} style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {group.date && <DateDivider date={group.date} />}
          {group.messages.map((msg, mi) => (
            <MessageBubble
              key={msg._id}
              message={msg}
              showAvatar={mi === 0}
            />
          ))}
        </div>
      ))}

      {/* Typing indicator */}
      <TypingIndication roomId={roomId} />

      {/* Scroll anchor */}
      <div ref={bottomRef} />
    </div>
  );
}