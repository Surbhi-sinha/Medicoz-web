/**
 * chatStore.ts — All real-time chat state
 *
 * ARCHITECTURAL PHILOSOPHY: ONE STORE, MULTIPLE CONCERNS
 * Chat has several interlocked state slices: rooms, per-room messages,
 * per-room typing indicators, and connection status. We could split these
 * into separate stores, but they change together — a new message updates
 * the room preview AND the message list simultaneously. Splitting creates
 * synchronisation bugs. One store, clearly sectioned, is the right call here.
 *
 * WHY messagesByRoom IS A MAP, NOT A LIST
 * The naive approach stores all messages in a flat array and filters by roomId
 * on every render. At 50 rooms with 100 messages each, that's 5,000 items
 * being filtered on every keystroke. Instead we key by roomId so each room's
 * list is O(1) to access and isolated — room A's new message never triggers
 * a re-render in room B's message list.
 *
 * WHY OPTIMISTIC UPDATES
 * Without optimistic updates, there's a visible delay between hitting Send
 * and seeing your message appear — the round trip to the server. This makes
 * the app feel slow even on fast connections. We add the message to the UI
 * immediately with a `sending` status, then swap it for the confirmed version
 * when the server acknowledges it. The user never waits.
 *
 * WHY WE TRACK typingByRoom AS STRING[] (NAMES, NOT BOOLEANS)
 * "User is typing" isn't binary in group chats. If Dr. Arun AND Nurse Priya
 * are both typing, we need to show "Dr. Arun & Nurse Priya are typing".
 * A boolean per room can't express that. An array of display names can.
 */

import { create } from 'zustand';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
export interface Participant {
  _id:    string;
  name:   string;
  email:  string;
  avatar?: string;
}

export interface Room {
  _id:           string;
  type:          'direct' | 'group';
  name:          string | null; // null for direct rooms — derive the name from participants
  participants:  Participant[];
  lastMessage:   string | null;
  lastMessageAt: string | null;
  unreadCount:   number;          // client-side badge count
}

export interface Message {
  _id:       string;
  roomId:    string;
  senderId:  Participant | string;
  content:   string;
  type:      'text' | 'image' | 'file';
   
  /**
   * Delivery lifecycle: sending → sent → delivered → read
   *
   * - sending:   optimistic message, not yet acknowledged by server
   * - sent:      server saved it, but recipient socket hasn't received it
   * - delivered: recipient's WebSocket is open and received the event
   * - read:      recipient explicitly called mark_read
   *
   * We render different tick states based on this:
   *   sending → grey circle
   *   sent    → single grey tick
   *   delivered → double grey tick
   *   read    → double green tick
   */
  status:    'sending' | 'sent' | 'delivered' | 'read';
  mediaUrl?: string | null;
  createdAt: string;
  isOptimistic?: boolean;  // true while awaiting server ack
}

// ─────────────────────────────────────────────────────────────────────────────
// State shape
// ─────────────────────────────────────────────────────────────────────────────
interface ChatState {
  // ── Connection ─────────────────────────────────────────────────────────
   /**
   * True when the WebSocket is in OPEN state.
   * Used by: ConnectionBanner (show warning), RoomList (show dot),
   * RoomHeader (show "Online" status), ChatInput (disable vs enable).
   */
  connected:    boolean;
  setConnected: (v: boolean) => void;

  // ── Rooms ──────────────────────────────────────────────────────────────
  rooms:        Room[];
  activeRoomId: string | null;

  setRooms:      (rooms: Room[]) => void;
  addRoom:       (room: Room) => void;
  setActiveRoom: (roomId: string | null) => void;

  // Updates lastMessage preview + sorts the list to the top
  updateRoomPreview: (roomId: string, lastMessage: string, lastMessageAt: string) => void;

  // Increments the unread badge for a room (called when message arrives for non-active room)
  incrementUnread: (roomId: string) => void;

  // Clears the badge when user opens the room
  clearUnread: (roomId: string) => void;

  // ── Messages ───────────────────────────────────────────────────────────
  // Map of roomId → Message[]  (each room has its own list)
  messagesByRoom: Record<string, Message[]>;

  setMessages:     (roomId: string, messages: Message[]) => void;
  prependMessages: (roomId: string, messages: Message[]) => void;  // for load-more
  addMessage:      (message: Message) => void;

  // Replaces a temp optimistic message with the confirmed server version
  confirmMessage:  (roomId: string, tempId: string, confirmed: Message) => void;

  // Updates tick status: delivered 
  updateMessageStatus: (roomId: string, messageId: string, status: Message['status']) => void;

  // Marks every message in the room as read (used when receiver opens the room)
  markAllMessagesRead: (roomId: string) => void;

  // ── Typing ─────────────────────────────────────────────────────────────
 /**
   * roomId → string[] of display names currently typing.
   * We store names (not IDs) because we render them directly in the UI:
   * "Dr. Arun is typing" — no lookup needed at render time.
   */
 typingByRoom: Record<string, string[]>;

  setTyping:   (roomId: string, userName: string) => void;
  clearTyping: (roomId: string, userName: string) => void;
}

// ─────────────────────────────────────────────────────────────────────────────
// Chat Store
//
// Central source of truth for all real-time chat state.
// The WebSocket context writes to this store via actions.
// Components read from it with selectors.
// ─────────────────────────────────────────────────────────────────────────────
export const useChatStore = create<ChatState>((set, get) => ({

  // ── Connection ───────────────────────────────────────────────────────────
  connected:    false,
  setConnected: (v) => set({ connected: v }),

  // ── Rooms ────────────────────────────────────────────────────────────────
  rooms:        [],
  activeRoomId: null,

  setRooms:      (rooms) => set({ rooms }),
  addRoom:       (room)  => set((s) => ({ rooms: [room, ...s.rooms] })),
  setActiveRoom: (roomId) => set({ activeRoomId: roomId }),

  updateRoomPreview: (roomId, lastMessage, lastMessageAt) =>
    set((s) => ({
      rooms: s.rooms
        .map((r) => r._id === roomId ? { ...r, lastMessage, lastMessageAt } : r)
        // Sort by most recent activity
        .sort((a, b) =>
          new Date(b.lastMessageAt ?? 0).getTime() -
          new Date(a.lastMessageAt ?? 0).getTime()
        ),
    })),

  incrementUnread: (roomId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r._id === roomId ? { ...r, unreadCount: r.unreadCount + 1 } : r
      ),
    })),

  clearUnread: (roomId) =>
    set((s) => ({
      rooms: s.rooms.map((r) =>
        r._id === roomId ? { ...r, unreadCount: 0 } : r
      ),
    })),

  // ── Messages ─────────────────────────────────────────────────────────────
  messagesByRoom: {},

  setMessages: (roomId, messages) =>
    set((s) => ({
      messagesByRoom: { ...s.messagesByRoom, [roomId]: messages },
    })),

  // Prepends older messages above the current list (infinite scroll)
  prependMessages: (roomId, messages) =>
    set((s) => ({
      messagesByRoom: {
        ...s.messagesByRoom,
        [roomId]: [...messages, ...(s.messagesByRoom[roomId] ?? [])],
      },
    })),

  addMessage: (message) =>
    set((s) => ({
      messagesByRoom: {
        ...s.messagesByRoom,
        [message.roomId]: [
          ...(s.messagesByRoom[message.roomId] ?? []),
          message,
        ],
      },
    })),

  // Replace optimistic message (tempId starts with "temp_") with server version
  confirmMessage: (roomId, tempId, confirmed) =>
    set((s) => ({
      messagesByRoom: {
        ...s.messagesByRoom,
        [roomId]: (s.messagesByRoom[roomId] ?? []).map((m) =>
          m._id === tempId ? confirmed : m
        ),
      },
    })),

  updateMessageStatus: (roomId, messageId, status) =>
    set((s) => ({
      messagesByRoom: {
        ...s.messagesByRoom,
        [roomId]: (s.messagesByRoom[roomId] ?? []).map((m) =>
          m._id === messageId ? { ...m, status } : m
        ),
      },
    })),

  markAllMessagesRead: (roomId) =>
    set((s) => ({
      messagesByRoom: {
        ...s.messagesByRoom,
        [roomId]: (s.messagesByRoom[roomId] ?? []).map((m) =>
          m.status !== 'read' ? { ...m, status: 'read' } : m
        ),
      },
    })),

  // ── Typing ───────────────────────────────────────────────────────────────
  typingByRoom: {},

  setTyping: (roomId, userName) =>
    set((s) => {
      const current = s.typingByRoom[roomId] ?? [];
       // Idempotent — if the user is already in the list, don't add them again.
      // This can happen if the client re-sends typing_start before stop fires.
      if (current.includes(userName)) return s; // already in list
      return {
        typingByRoom: {
          ...s.typingByRoom,
          [roomId]: [...current, userName],
        },
      };
    }),

  clearTyping: (roomId, userName) =>
    set((s) => ({
      typingByRoom: {
        ...s.typingByRoom,
        [roomId]: (s.typingByRoom[roomId] ?? []).filter((u) => u !== userName),
      },
    })),
}));