/**
 * app/chat/page.tsx — /chat with no room selected
 *
 * Chat UI (sidebar, room list, banners) lives in layout.tsx and pulls from
 * @/components/chat. This file is only the main-panel empty state.
 */

export default function ChatIndexPage() {
  return (
    <div
      style={{
        flex:           1,
        display:        'flex',
        flexDirection:  'column',
        alignItems:     'center',
        justifyContent: 'center',
        padding:        '32px',
        background:     '#FAFAF8',
      }}
    >
      <div
        style={{
          width:          '52px',
          height:         '52px',
          borderRadius:   '14px',
          background:     '#F0FAFA',
          display:        'flex',
          alignItems:     'center',
          justifyContent: 'center',
          marginBottom:   '16px',
        }}
      >
        <svg
          width="24"
          height="24"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#1A8080"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
        </svg>
      </div>
      <p
        style={{
          fontSize:   '16px',
          fontWeight: 500,
          color:      '#1A1917',
          margin:     '0 0 6px',
          fontFamily: "'DM Sans', sans-serif",
        }}
      >
        Select a conversation
      </p>
      <p
        style={{
          fontSize:  '14px',
          color:     '#6B6860',
          margin:    0,
          textAlign: 'center',
          maxWidth:  '280px',
        }}
      >
        Choose a chat from the list or start a new one to begin messaging.
      </p>
    </div>
  );
}
