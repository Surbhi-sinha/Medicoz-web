'use client';
import { useChatStore } from '@/stores/chatStore';

// ─────────────────────────────────────────────────────────────────────────────
// ConnectionBanner
//
// Shows a subtle banner at the top of the chat when the WebSocket is
// disconnected. Hidden when connected. Auto-disappears on reconnect.
// ─────────────────────────────────────────────────────────────────────────────
export function ConnectionBanner() {
  const connected = useChatStore((s) => s.connected);

  if (connected) return null;

  return (
    <div
      style={{
        background:   'var(--color-background-warning)',
        color:        'var(--color-text-warning)',
        fontSize:     '12px',
        padding:      '7px 16px',
        textAlign:    'center',
        borderBottom: '0.5px solid var(--color-border-tertiary)',
        display:      'flex',
        alignItems:   'center',
        justifyContent: 'center',
        gap:          '8px',
      }}
    >
      {/* Pulsing dot */}
      <span
        style={{
          width:        '7px',
          height:       '7px',
          borderRadius: '50%',
          background:   'var(--color-text-warning)',
          display:      'inline-block',
          animation:    'pulse 1.5s ease-in-out infinite',
        }}
      />
      Reconnecting — messages will be sent once connection is restored
    </div>
  );
}