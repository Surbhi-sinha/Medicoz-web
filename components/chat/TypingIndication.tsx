'use client';
import { useChatStore } from '@/stores/chatStore';

// Stable fallback — `?? []` inside a Zustand selector allocates a new array on every
// getSnapshot() when empty, so useSyncExternalStore never stabilises → infinite re-renders.
const EMPTY_TYPING: string[] = [];

// ─────────────────────────────────────────────────────────────────────────────
// TypingIndication
//
// Shows the animated "..." bubble when someone in the room is typing.
// Reads directly from Zustand — no props needed.
// ─────────────────────────────────────────────────────────────────────────────
export function TypingIndication({ roomId }: { roomId: string }) {
  const typingUsers = useChatStore((s) => s.typingByRoom[roomId] ?? EMPTY_TYPING);

  if (typingUsers.length === 0) return null;

  const label = typingUsers.length === 1
    ? `${typingUsers[0]} is typing`
    : `${typingUsers.slice(0, 2).join(', ')} are typing`;

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '2px 0' }}>
      {/* Animated dots bubble */}
      <div style={{
        display:      'flex',
        gap:          '3px',
        alignItems:   'center',
        background:   'var(--color-background-secondary)',
        border:       '0.5px solid var(--color-border-tertiary)',
        padding:      '8px 12px',
        borderRadius: '16px 16px 16px 4px',
      }}>
        {[0, 1, 2].map((i) => (
          <div key={i} style={{
            width:        '6px',
            height:       '6px',
            borderRadius: '50%',
            background:   'var(--color-text-tertiary)',
            animation:    `typingBounce 1.2s ease-in-out ${i * 0.2}s infinite`,
          }} />
        ))}
      </div>
      <span style={{ fontSize: '11px', color: 'var(--color-text-tertiary)' }}>
        {label}
      </span>

      <style>{`
        @keyframes typingBounce {
          0%, 60%, 100% { transform: translateY(0); }
          30%            { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}