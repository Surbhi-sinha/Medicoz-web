/**
 * useChat.ts — Per-room chat logic
 *
 * RESPONSIBILITY BOUNDARY
 * This hook owns everything that is scoped to a single open room:
 *   - Loading that room's message history (REST, paginated)
 *   - Sending messages with optimistic updates
 *   - Subscribing to room-specific WS events (message_ack)
 *   - Marking the room as read on open
 *
 * It does NOT own:
 *   - The WebSocket connection lifecycle (WebSocketContext)
 *   - Typing indicators (useTyping — separate concern, separate hook)
 *   - Room list updates (WebSocketContext writes directly to Zustand)
 *
 * WHY REST FOR HISTORY, NOT WEBSOCKET?
 * On room open, we need the last 30 messages immediately — before any
 * real-time events arrive. WebSocket is event-driven; it can't respond
 * to "give me messages from before I connected". REST is the right tool
 * for point-in-time data retrieval. WebSocket handles everything that
 * happens after we're connected.
 *
 * WHY useRef FOR page AND hasMore INSTEAD OF useState?
 * These values drive data fetching but never need to cause a re-render
 * themselves — only the messages array causes the list to re-render.
 * If we used useState for page, every loadMore() call would trigger an
 * extra render cycle with no visible change. Refs give us mutable state
 * without the render overhead.
 */

'use client';

import { useEffect, useCallback, useRef } from 'react';
import { useWebSocket }  from '@/context/WebSocketContext';
import { useAuthStore }  from '@/stores/authStore';
import { useChatStore }  from '@/stores/chatStore';
import { api }           from '@/lib/api';
import type { Message }  from '@/stores/chatStore';

// ─────────────────────────────────────────────────────────────────────────────

/** Stable empty list for Zustand selectors — see TypingIndication / React useSyncExternalStore. */
const EMPTY_MESSAGES: Message[] = [];

export function useChat(roomId: string) {
  const { send, subscribe } = useWebSocket();
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);

  const messages = useChatStore((s) => s.messagesByRoom[roomId] ?? EMPTY_MESSAGES);

  // Pagination state — refs because they don't drive rendering (see doc above)
  const pageRef        = useRef(1);
  const hasMoreRef     = useRef(true);
  const isLoadingRef   = useRef(false);

  // ── Initial load ────────────────────────────────────────────────────────────

  useEffect(() => {
    if (!roomId || !token) return;

    // Reset pagination when switching rooms —
    // otherwise room B starts with room A's page counter
    pageRef.current    = 1;
    hasMoreRef.current = true;

    const { setActiveRoom, clearUnread, setMessages } = useChatStore.getState();

    // Tell the store this room is active so the WS context knows whether
    // to auto-mark incoming messages as read or increment the badge
    setActiveRoom(roomId);
    clearUnread(roomId);

    api.chat.getMessages(token, roomId, 1)
      .then(({ data, total }) => {
        // The API returns newest-first for efficient DB queries (sort by -createdAt).
        // We reverse here so the oldest message is at the top of the UI,
        // which is the universal chat convention.
        setMessages(roomId, [...data].reverse());

        // If the API returned fewer messages than we asked for, there's no more history
        hasMoreRef.current = data.length < total;
      })
      .catch((err) => {
        if (process.env.NODE_ENV === 'development') {
          console.error('[useChat] Failed to load messages:', err);
        }
      });

    // Immediately tell the server this room is read —
    // clears the unread count on the server side and triggers
    // a messages_read event to the other participant (turns their ticks green)
    send('mark_read', { roomId });

    return () => {
      // When the user navigates away from the room, clear the active room
      // so the WS context knows to increment unread for new messages
      useChatStore.getState().setActiveRoom(null);
    };
  }, [roomId, token, send]);

  // ── Subscribe to message_ack ────────────────────────────────────────────────

  useEffect(() => {
    /**
     * message_ack is the server's confirmation that it saved our message.
     * At this point we swap the optimistic placeholder (with tempId) for
     * the real message (with a permanent MongoDB _id and status: 'sent').
     *
     * We subscribe here (not in WebSocketContext) because this event is
     * specifically responding to actions taken in this room.
     */
    const unsubscribe = subscribe('message_ack', (data: any) => {
      useChatStore.getState().confirmMessage(roomId, data.tempId, data.message);
    });

    return unsubscribe;
  }, [roomId, subscribe]);

  // ── Load more (infinite scroll) ─────────────────────────────────────────────

  const loadMore = useCallback(async () => {
    // Guard against concurrent calls — React's StrictMode and scroll events
    // can both fire this very quickly
    if (!hasMoreRef.current || isLoadingRef.current || !token) return;

    isLoadingRef.current = true;
    pageRef.current     += 1;

    try {
      const { data, total } = await api.chat.getMessages(token, roomId, pageRef.current);

      // Prepend (not append) so older messages appear above the current list
      // and the user's current scroll position is preserved
      useChatStore.getState().prependMessages(roomId, [...data].reverse());

      // Check if we've fetched everything
      hasMoreRef.current = (pageRef.current * 30) < total;

    } finally {
      isLoadingRef.current = false;
    }
  }, [roomId, token]);

  // ── Send message ────────────────────────────────────────────────────────────

  const sendMessage = useCallback((content: string) => {
    if (!content.trim() || !user) return;

    /**
     * Optimistic update — add the message to the UI before the server confirms it.
     *
     * We generate a temporary ID using Date.now(). This is good enough because:
     *   1. Messages from the same user can't be sent faster than 1ms apart
     *   2. We only need uniqueness within this session, not globally
     *   3. We never persist tempIds — they're replaced by real MongoDB IDs on ack
     *
     * The `isOptimistic: true` flag lets the component style it with
     * reduced opacity so the user knows it hasn't been confirmed yet.
     */
    const tempId = `temp_${Date.now()}`;

    const optimisticMessage: Message = {
      _id:           tempId,
      roomId,
      senderId:      { _id: user.id, name: `${user.firstName} ${user.lastName}`, email: user.email },
      content:       content.trim(),
      type:          'text',
      status:        'sending',
      createdAt:     new Date().toISOString(),
      isOptimistic:  true,
    };

    useChatStore.getState().addMessage(optimisticMessage);

    // Include tempId in the WS payload so the server echoes it back
    // in the message_ack event — that's how we know which placeholder to replace
    send('send_message', {
      roomId,
      content: content.trim(),
      type:    'text',
      tempId,
    });
  }, [roomId, user, send]);

  return {
    messages,
    sendMessage,
    loadMore,
    hasMore: hasMoreRef.current,
  };
}