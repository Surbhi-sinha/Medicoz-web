// ─────────────────────────────────────────────────────────────────────────────
// MedicoZ API client
//
/**
 * lib/api.ts — Centralised HTTP client
 *
 * WHY A CENTRALISED API MODULE INSTEAD OF FETCH IN EACH COMPONENT?
 * Scattered fetch calls throughout components create several problems:
 *   1. The base URL is hardcoded in 20 places — change the API host and
 *      you're doing a global find-replace hoping you caught them all.
 *   2. Error handling logic (parse the response, throw a typed error)
 *      gets duplicated and diverges over time.
 *   3. TypeScript types for request/response shapes live in the component
 *      files instead of a single authoritative location.
 *
 * This module is the single contract between the frontend and the API.
 * If the backend changes an endpoint or response shape, there's exactly
 * one file to update.
 *
 * WHY NOT REACT QUERY / SWR?
 * Those libraries are excellent for GET requests with caching. For our
 * auth flow (login/signup), we want fire-once imperative calls with no
 * caching — the user hits submit, we call the API, we handle the response.
 * Adding React Query for two auth calls would be over-engineering.
 * We'll introduce it when we have cacheable data (user profiles, doctor lists).
 */
// ─────────────────────────────────────────────────────────────────────────────

/** Trim and drop trailing slash; empty env falls back so client always hits the API host. */
function apiBase(): string {
    const raw = process.env.NEXT_PUBLIC_API_URL;
    const s = typeof raw === "string" ? raw.trim() : "";
    if(process.env.NEXT_ENVIRONMENT === "development") {
        return (s || "http://localhost:4000").replace(/\/$/, "");
    }
    return (s || "https://medicoz-api.onrender.com").replace(/\/$/, "");
}

const BASE = apiBase();

/**
 * Medicoz-api wraps JSON bodies in `{ status, message, data }` (ResponseInterceptor).
 * Some error paths still return HTTP 200 with `status` set to the real code (AllExceptionsFilter).
 * Unwrap so callers see the inner payload and failed logical statuses throw like HTTP errors.
 */
function parseApiJson<T>(json: unknown, path: string, httpOk: boolean): T {
    const isEnvelope =
        json !== null &&
        typeof json === "object" &&
        "status" in json &&
        "message" in json &&
        "data" in json;

    if (isEnvelope) {
        const env = json as { status: number; message: string | string[]; data: unknown };
        if (env.status !== 200) {
            const msg = Array.isArray(env.message)
                ? env.message.join(", ")
                : String(env.message ?? "Request failed");
            throw new Error(msg);
        }
        return env.data as T;
    }

    if (!httpOk) {
        const body = json as { message?: string } | null;
        throw new Error(
            body?.message ?? `Request to ${path} failed`,
        );
    }

    return json as T;
}

/**
 * The base POST function. All POST calls go through this.
 *
 * Why does it throw on non-OK responses instead of returning { error }?
 * Because callers use try/catch anyway (they need to handle network failures).
 * Returning a union type forces every caller to check a flag. Throwing means
 * the caller's catch block handles both network errors and API errors uniformly.
 */

async function post<TResponse>(
    path: string,
    body: unknown,
    token?: string,
): Promise<TResponse> {
    const headers: Record<string, string> = {
        "Content-Type": "application/json",
    };

    //Only attach the authorisation header if a token is provided
    if (token) headers["Authorization"] = `Bearer ${token}`;

    const res = await fetch(`${BASE}${path}`, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
    });

    const json = await res.json();
    return parseApiJson<TResponse>(json, path, res.ok);
}

async function get<TResponse>(
    path: string,
    token?: string,
): Promise<TResponse> {
    const response = await fetch(`${BASE}${path}`, {
        headers: { Authorization: `Bearer ${token}` },
    });

    const json = await response.json();
    return parseApiJson<TResponse>(json, path, response.ok);
}

// ── Auth ─────────────────────────────────────────────────────────────────────

export interface LoginPayload {
    email: string;
    password: string;
}
export interface SignupPayload {
    email: string;
    phone: string;
    firstName: string;
    lastName: string;
    password: string;
}
export interface AuthResponse {
    access_token: string;
    user: {
        id: string;
        email: string;
        phone: string;
        firstName: string;
        lastName: string;
    };
}

// ── Exported API calls ───────────────────────────────────────────────────────
/**
 * The exported `api` object is the only thing consumers should import.
 * Namespacing by domain (auth, chat) keeps it readable as the surface grows.
 *
 * Usage:
 *   const res = await api.auth.login({ email, password });
 *   const rooms = await api.chat.getRooms(token);
 */
export const api = {
    auth: {
        /**
         * POST /auth/login
         * Matches: curl --data '{ "email": "...", "password": "..." }'
         */
        login: (body: LoginPayload) => post<AuthResponse>("/auth/login", body),
        /**
         * POST /auth/signup
         * Matches: curl --data '{ "email", "phone", "firstName", "lastName", "password" }'
         */
        signup: (body: SignupPayload) => post<AuthResponse>("/auth/signup", body),
    },
    chat: {
        /** GET /chat/rooms — returns all rooms the authenticated user participates in */
        getRooms: (token: string) => get<any[]>("/chat/rooms", token),
        /**
         * GET /chat/rooms/:roomId — single room with populated participants (requires membership).
         */
        getRoom: (token: string, roomId: string) =>
            get<any>(`/chat/rooms/${roomId}`, token),
        /**
         * POST /chat/rooms — start or reuse a direct chat, or create a group.
         * For a 1:1 chat: `{ type: 'direct', participants: [otherUserMongoId] }`.
         * The API adds you as a participant; duplicate direct rooms are collapsed server-side.
         */
        createRoom: (
            token: string,
            body: {
                type: "direct" | "group";
                participants: string[];
                name?: string;
            },
        ) => post<any>("/chat/rooms", body, token),
        /**
         * GET /chat/rooms/:roomId/messages?page=N&limit=30
         * Returns newest-first — the caller reverses the array before rendering.
         */
        getMessages: (token: string, roomId: string, page = 1) =>
            get<any>(`/chat/rooms/${roomId}/messages?page=${page}&limit=30`, token),
    },
};
