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
    <div className="chat-input-wrap">
      <div className="chat-input-box">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Type a secure message…"
          rows={1}
          aria-label="Message"
        />
        <button
          type="button"
          className="chat-input-send"
          onClick={handleSend}
          disabled={isEmpty}
          aria-label="Send message"
        >
          Send message
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" aria-hidden>
            <line x1="22" y1="2" x2="11" y2="13" />
            <polygon points="22 2 15 22 11 13 2 9 22 2" />
          </svg>
        </button>
      </div>
      <p className="chat-input-legal">
        This conversation is encrypted and follows HIPAA security standards.
      </p>
      <style>{`
        .chat-input-wrap {
          width: 100%;
          box-sizing: border-box;
          padding: 16px 20px;
          border-top: 1px solid var(--border-default);
          background: var(--surface-card);
        }
        .chat-input-box {
          display: flex;
          flex-direction: column;
          gap: 12px;
          border: 1px solid var(--border-default);
          border-radius: var(--radius-md);
          padding: 14px;
          background: var(--surface-page);
        }
        .chat-input-box textarea {
          width: 100%;
          border: none;
          background: transparent;
          font-size: 14px;
          color: var(--stone-900);
          outline: none;
          resize: none;
          min-height: 48px;
          max-height: 120px;
          font-family: var(--font-body);
        }
        .chat-input-send {
          align-self: flex-end;
          display: inline-flex;
          align-items: center;
          gap: 8px;
          padding: 10px 18px;
          border-radius: var(--radius-sm);
          background: var(--teal-800);
          color: #fff;
          border: none;
          font-size: 13px;
          font-weight: 600;
          cursor: pointer;
        }
        .chat-input-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .chat-input-legal {
          text-align: center;
          font-size: 10px;
          letter-spacing: 0.06em;
          text-transform: uppercase;
          color: var(--stone-400);
          margin: 10px 0 0;
        }
      `}</style>
    </div>
  );
}