/**
 * WebSocketContext.tsx — Single WebSocket connection for the entire app
 *
 * WHY A CONTEXT INSTEAD OF A ZUSTAND STORE?
 * The WebSocket object itself is mutable and imperative — it has methods
 * like `.send()` and `.close()` and internal browser state. Zustand stores
 * serialisable data. Mixing an imperative object into a Zustand store would
 * make it impossible to use devtools, persistence, or time-travel debugging.
 * Context is the right tool for "shared imperative resource" — Zustand is for
 * "shared derived state that components read from".
 * 
 * IMPERATIVE = MUTABLE, STATEFUL, CAN CHANGE AT ANY TIME
 * 
 * WHY ONE CONNECTION FOR THE WHOLE APP?
 * The naive approach: open a WebSocket in each room's page component.
 * The problem: navigating between rooms tears down and recreates the connection
 * on every route change. During the ~200ms reconnect window, messages are lost.
 * By hoisting the connection to the chat layout level, it persists across all
 * room navigations. The connection lives as long as the user is in /chat/*.
 *
 * WHY EXPONENTIAL BACKOFF?
 * If the server restarts, every connected client will attempt to reconnect
 * simultaneously — this is called the "thundering herd" problem. Fixed-interval
 * retries (every 1s for 1000 clients = 1000 req/s on startup) can DDoS your
 * own server. Exponential backoff (1s, 2s, 4s, 8s... capped at 30s) spreads
 * the reconnection load over time. The cap prevents clients from waiting
 * forever during extended outages.
 *
 * WHY A MESSAGE QUEUE?
 * If the user sends a message while momentarily disconnected (e.g. switching
 * WiFi networks), we don't want to silently drop it. We queue the serialised
 * payload and flush the queue the moment the connection reopens. The user
 * never knows anything went wrong.
 *
 * THE HANDLER PATTERN (vs. putting all logic in onmessage)
 * We could handle every incoming event in the onmessage callback directly.
 * Instead, we split it: onmessage writes to Zustand for events that affect
 * global state (new messages, typing, read receipts), while the `subscribe`
 * API lets individual components add their own handlers for ephemeral events
 * (like a message_ack for a specific send operation). This avoids the
 * alternative — a giant switch statement in one file that every feature adds to.
 */
'use client';

import { createContext, useContext, useRef, useEffect, useCallback, ReactNode } from 'react';

import { useAuthStore } from '@/stores/authStore';
import { useChatStore } from '@/stores/chatStore';


// --------------------------------------------------------------
// Types
// --------------------------------------------------------------

type EventHandler = (data: unknown) => void;

interface WsContextValue {
    // Send any event over the WebSocket and queue if disconnected
    send: (event: string, data: unknown) => void;

    // Subscribe to a server-sent event. Returns an unsubscribe function.
    subscribe: (event: string, handler: EventHandler) => () => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Context
// ─────────────────────────────────────────────────────────────────────────────
const WsContext = createContext<WsContextValue | null>(null);

// ─────────────────────────────────────────────────────────────────────────────
// WebSocketProvider
//
// Lives at the app/chat/layout.tsx level so one WS connection persists
// across all room navigations without reconnecting on every page change.
//
// Responsibilities:
//  - Connect when a token is available, disconnect on logout
//  - Exponential backoff reconnection (1s → 2s → 4s … max 30s)
//  - Queue outgoing messages while disconnected, flush on reconnect
//  - Dispatch incoming events to subscribed handlers
//  - Write connection status to Zustand (useChatStore.setConnected)
// ─────────────────────────────────────────────────────────────────────────────

export function WebSocketProvider({ children }: { children: ReactNode }) {
    const token = useAuthStore(state => state.token);

     // We use refs for the WS object, handler map, and queue because:
  // - They need to survive re-renders without triggering re-renders themselves
  // - The WS object is imperative and not appropriate for React state
    const wsRef = useRef<WebSocket | null>(null);
    const handlers = useRef<Map<string, Set<EventHandler>>>(new Map());
    const queue = useRef<string[]>([]);
    const retryTime = useRef<ReturnType<typeof setTimeout> | null>(null);
    const retryCount = useRef(0);
    const isMounted = useRef(true);
    /** Latest global handler — `connect` only depends on `token` so we must not close over a stale handler. */
    const handleGlobalEventRef = useRef<(type: string, data: unknown) => void>(() => {});

    const addMessage = useChatStore((s) => s.addMessage);
    const updateRoomPreview = useChatStore((s) => s.updateRoomPreview);
    const setTyping = useChatStore((s) => s.setTyping);
    const clearTyping = useChatStore((s) => s.clearTyping);
    const updateMessageStatus = useChatStore((s) => s.updateMessageStatus);
    const incrementUnread = useChatStore((s) => s.incrementUnread);
    const activeRoomId = useChatStore((s) => s.activeRoomId);

    const send = useCallback((event: string, data: unknown) => {
        const payload = JSON.stringify({ event, data });
        if (wsRef.current?.readyState === WebSocket.OPEN) {
            wsRef.current.send(payload);
        } else {
            queue.current.push(payload);
        }
    }, []);

    // ── Handle events that always update global store ──────────────────────
    const handleGlobalEvent = useCallback((type: string, data: any) => {
        switch (type) {

            // New message arrives
            case 'new_message': {
                addMessage(data);
                updateRoomPreview(data.roomId, data.content, data.createdAt);

                // Only increment badge if this room is NOT currently open
                if (data.roomId !== activeRoomId) {
                    incrementUnread(data.roomId);
                } else {
                    // Room is open — auto mark as read
                    send('mark_read', { roomId: data.roomId });
                }
                break;
            }

            // Message confirmed by server — swap optimistic for real
            case 'message_ack': {
                // handled per-room in useChat
                break;
            }

            // Typing indicators
            case 'user_typing':
                setTyping(data.roomId, data.userName);
                // Safety net: auto-clear after 4s if stop event never arrives
                setTimeout(() => clearTyping(data.roomId, data.userName), 4000);
                break;

            case 'user_stop_typing':
                clearTyping(data.roomId, data.userId);
                break;

            // Read receipts — turn ticks green
            case 'messages_read':
                updateMessageStatus(data.roomId, data.lastMessageId, 'read');
                break;

            case 'error':
                if (process.env.NODE_ENV === 'development') {
                    console.error('[WS error]', data?.message ?? data);
                }
                break;
        }
    }, [activeRoomId, addMessage, updateRoomPreview, incrementUnread, send, setTyping, clearTyping, updateMessageStatus]);

    useEffect(() => {
        handleGlobalEventRef.current = handleGlobalEvent;
    }, [handleGlobalEvent]);

    // ---------------------------core connect function-----------------------------------

    const connect = useCallback(() => {
        // 1. Check if token is available and component is mounted
        if (!token || !isMounted.current) return;
        // 2. Check if WebSocket is already connected
        if (wsRef.current?.readyState === WebSocket.OPEN) return;
        // 3. Drop any half-open socket so we do not leak or double-connect
        if (
            wsRef.current &&
            wsRef.current.readyState !== WebSocket.CLOSED &&
            wsRef.current.readyState !== WebSocket.CLOSING
        ) {
            wsRef.current.close();
        }
        const base = process.env.NEXT_PUBLIC_WS_URL ?? 'ws://localhost:4000';
        const ws = new WebSocket(
            `${base.replace(/\/$/, '')}/ws?token=${encodeURIComponent(token)}`,
        );
        wsRef.current = ws;

        ws.onopen = () => {
            if (!isMounted.current) return;
            useChatStore.getState().setConnected(true);
            retryCount.current = 0;

            //Flush the queued message from while we were offline
            queue.current.forEach(msg => {
                ws.send(msg);
            });
            queue.current = [];
        }


        ws.onclose = () => {
            if (!isMounted.current) return;
            useChatStore.getState().setConnected(false);
            retryCount.current++;
            // Exponential backoff: 1s, 2s, 4s … capped at 30s
            const delay = Math.min(1000 * Math.pow(2, retryCount.current), 30000);
            retryTime.current = setTimeout(connect, delay);
        };
        ws.onerror = () => ws.close();

        //----------- Handle incoming router ------------------------
        ws.onmessage = (event) => {
            try {
                const { event: type, data } = JSON.parse(event.data);

                handleGlobalEventRef.current(type, data);

                // dispatch to anny component -level subscribers
                handlers.current.get(type)?.forEach(handler => handler(data));
            } catch (error) {
                console.error('Error parsing WebSocket message:', error);
            }
        };
    }, [token]);


    // ── Connect / disconnect with token - Lifecycle ───────────────────────────────────
    useEffect(() => {

        isMounted.current = true;

        if (token) {
            connect();
        } else {
            wsRef.current?.close();
            clearTimeout(retryTime.current as ReturnType<typeof setTimeout>);
            useChatStore.getState().setConnected(false);
        }

        return () => {
            isMounted.current = false;
            wsRef.current?.close();
            clearTimeout(retryTime.current as ReturnType<typeof setTimeout>);
        };
    }, [connect, token]);


    // ── Subscribe to events ─────────────────────────────────────────────
    const subscribe = useCallback((event: string, handler: EventHandler) => {
        if (!handlers.current.has(event)) {
            handlers.current.set(event, new Set());
        }
        handlers.current.get(event)?.add(handler);
        //returns the clean up function
        return () => {
            handlers.current.get(event)?.delete(handler);
        }
    }, []);

    return <WsContext.Provider value={{ send, subscribe }}>{children}</WsContext.Provider>;

}
// ─── Hook ─────────────────────────────────────────────────────────────────────
 
/**
 * useWebSocket — access the send/subscribe API from any component.
 *
 * Must be used inside a <WebSocketProvider>. Throws a clear error if not,
 * rather than silently returning null and causing a confusing runtime crash.
 */
export function useWebSocket() {
    const context = useContext(WsContext);
    if (!context) {
        throw new Error('useWebSocket was called outside of <WebSocketProvider>. ' +
      'Wrap your /chat route tree in WebSocketProvider inside the chat layout.');
    }
    return context;
}