'use client';
import type { Message } from '@/stores/chatStore';
import { useAuthStore } from '@/stores/authStore';

// ─────────────────────────────────────────────────────────────────────────────
// Tick icon — shows message delivery status
// ─────────────────────────────────────────────────────────────────────────────
function Tick({ status }: { status: Message['status'] }) {
  if (status === 'sending') return <span style={{ color: 'var(--color-text-tertiary)', fontSize: '12px' }}>○</span>;

  const color = status === 'read' ? '#1D9E75' : 'var(--color-text-tertiary)';
  // Single tick = sent/delivered, double = delivered/read
  const double = status === 'delivered' || status === 'read';

  return (
    <span style={{ color, fontSize: '12px', letterSpacing: '-2px' }}>
      {double ? '✓✓' : '✓'}
    </span>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MessageBubble
// ─────────────────────────────────────────────────────────────────────────────
export function MessageBubble({ message, showAvatar }: {
  message: Message;
  showAvatar: boolean;   // true for first message in a group
}) {
  const { user } = useAuthStore();

  const senderId = typeof message.senderId === 'string'
    ? message.senderId
    : message.senderId._id;

  const senderName = typeof message.senderId === 'string'
    ? ''
    : message.senderId.name;

  const isMine = senderId === user?.id || senderId === 'me';

  const time = new Date(message.createdAt).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div style={{
      display: 'flex',
      flexDirection: isMine ? 'row-reverse' : 'row',
      alignItems: 'flex-end',
      gap: '8px',
      opacity: message.isOptimistic ? 0.75 : 1,
      transition: 'opacity .2s',
    }}>
      {/* Avatar — only shown for first message in a group, and only for others */}
      {!isMine && (
        <div style={{
          width: '26px',
          height: '26px',
          borderRadius: '50%',
          background: '#E1F5EE',
          color: '#085041',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: '10px',
          fontWeight: 500,
          flexShrink: 0,
          visibility: showAvatar ? 'visible' : 'hidden',
        }}>
          {senderName?.charAt(0)?.toUpperCase() ?? '?'}
        </div>
      )}

      {/* Bubble + timestamp */}
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: isMine ? 'flex-end' : 'flex-start',
        maxWidth: '68%',
        gap: '3px',
      }}>
        {message.type === 'text' ? (
          <div style={{
            padding: '9px 13px',
            borderRadius: isMine ? '16px 16px 4px 16px' : '16px 16px 16px 4px',
            fontSize: '13px',
            lineHeight: '1.5',
            background: '#E1F5EE',
            border: `0.5px solid #9FE1CB`,
            color: '#085041',
            wordBreak: 'break-word',
          }}>
            {message.content}
          </div>
        ) : (
          /* Image / file message */
          <div style={{
            padding: '8px',
            borderRadius: '12px',
            background: 'var(--color-background-secondary)',
            border: '0.5px solid var(--color-border-tertiary)',
            fontSize: '13px',
            color: 'var(--color-text-secondary)',
          }}>
            {message.type === 'image' ? '🖼 Image' : '📎 File'}
          </div>
        )}

        {/* Timestamp + tick */}
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          fontSize: '11px',
          color: 'var(--color-text-tertiary)',
        }}>
          {time}
          {isMine && <Tick status={message.status} />}
        </div>
      </div>
    </div>
  );
}