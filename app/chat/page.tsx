export default function ChatIndexPage() {
  return (
    <div className="chat-empty">
      <div className="chat-empty__icon" aria-hidden>
        <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--teal-800)" strokeWidth="1.8">
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p className="chat-empty__title">Select a conversation</p>
      <p className="chat-empty__text">
        Choose a chat from the list or start a new appointment to begin secure messaging.
      </p>
      <style>{`
        .chat-empty {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 32px;
          background: var(--surface-page);
        }
        .chat-empty__icon {
          width: 56px;
          height: 56px;
          border-radius: 14px;
          background: var(--teal-50);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 16px;
        }
        .chat-empty__title {
          font-size: 16px;
          font-weight: 600;
          color: var(--stone-900);
          margin: 0 0 6px;
        }
        .chat-empty__text {
          font-size: 14px;
          color: var(--stone-600);
          text-align: center;
          max-width: 300px;
          margin: 0;
        }
      `}</style>
    </div>
  );
}
