'use client';
import { useState, useRef, KeyboardEvent } from 'react';
import { useTyping } from '@/hooks/useTyping';

// ─────────────────────────────────────────────────────────────────────────────
// ChatInput
//
// Auto-grows up to 5 lines. Sends on Enter (Shift+Enter for new line).
// Fires typing events via useTyping hook.
// ─────────────────────────────────────────────────────────────────────────────
export function ChatInput({ roomId, onSend }: {
  roomId: string;
  onSend: (content: string) => void;
}) {
  const [value, setValue]       = useState('');
  const textareaRef             = useRef<HTMLTextAreaElement>(null);
  const { onKeyStroke, onStopTyping } = useTyping(roomId);

  // Auto-resize textarea height up to 5 lines (~120px)
  const adjustHeight = () => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = 'auto';
    el.style.height = `${Math.min(el.scrollHeight, 120)}px`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setValue(e.target.value);
    adjustHeight();
    if (e.target.value.length > 0) onKeyStroke();
    else onStopTyping();
  };

  const handleSend = () => {
    const trimmed = value.trim();
    if (!trimmed) return;
    onSend(trimmed);
    setValue('');
    onStopTyping();
    if (textareaRef.current) textareaRef.current.style.height = 'auto';
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter sends, Shift+Enter inserts newline
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const isEmpty = value.trim().length === 0;

  return (
    <div style={{ padding: '10px 14px', borderTop: '0.5px solid var(--color-border-tertiary)' }}>
      {/* Input row */}
      <div style={{
        display:       'flex',
        alignItems:    'flex-end',
        gap:           '8px',
        border:        '0.5px solid var(--color-border-secondary)',
        borderRadius:  'var(--border-radius-lg)',
        padding:       '8px 12px',
        background:    'var(--color-background-secondary)',
        transition:    'border-color .15s',
      }}
        onFocus={(e) => (e.currentTarget.style.borderColor = '#1D9E75')}
        onBlur={(e)  => (e.currentTarget.style.borderColor = 'var(--color-border-secondary)')}
      >
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a message..."
          rows={1}
          style={{
            flex:       1,
            border:     'none',
            background: 'transparent',
            fontSize:   '13px',
            color:      'var(--color-text-primary)',
            outline:    'none',
            resize:     'none',
            lineHeight: '1.5',
            minHeight:  '22px',
            maxHeight:  '120px',
            overflowY:  'auto',
            fontFamily: 'var(--font-sans)',
          }}
        />

        {/* Send button */}
        <button
          onClick={handleSend}
          disabled={isEmpty}
          style={{
            width:        '32px',
            height:       '32px',
            borderRadius: '50%',
            background:   isEmpty ? 'var(--color-border-tertiary)' : '#1D9E75',
            border:       'none',
            cursor:       isEmpty ? 'default' : 'pointer',
            display:      'flex',
            alignItems:   'center',
            justifyContent: 'center',
            flexShrink:   0,
            transition:   'background .15s, transform .1s',
            transform:    'scale(1)',
          }}
          onMouseDown={(e) => { if (!isEmpty) (e.currentTarget.style.transform = 'scale(0.92)'); }}
          onMouseUp={(e)   => { (e.currentTarget.style.transform = 'scale(1)'); }}
        >
          {/* Send icon (paper plane) */}
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <line x1="22" y1="2" x2="11" y2="13"/>
            <polygon points="22 2 15 22 11 13 2 9 22 2"/>
          </svg>
        </button>
      </div>

      {/* Hint */}
      <div style={{ fontSize: '11px', color: 'var(--color-text-tertiary)', marginTop: '4px', paddingLeft: '4px' }}>
        Enter to send · Shift+Enter for new line
      </div>
    </div>
  );
}