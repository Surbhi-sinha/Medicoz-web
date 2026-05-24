/**
 * authStore.ts — Authentication state
 *
 * WHY ZUSTAND INSTEAD OF CONTEXT + USESTATE?
 * React Context re-renders every consumer whenever any value changes.
 * For auth, that means the entire app tree re-renders on login/logout.
 * Zustand lets components subscribe to only the slice they need —
 * a component reading `user.firstName` won't re-render when `token` changes.
 *
 * WHY SESSIONSSTORAGE INSTEAD OF LOCALSTORAGE?
 * localStorage persists indefinitely. If a user walks away from a shared
 * computer, their session stays alive forever. sessionStorage clears when
 * the browser tab closes — a much safer default for a healthcare app
 * where we're handling patient data.
 *
 * WHY NOT HTTPONLY COOKIES?
 * httpOnly cookies are more XSS-safe, but they require a Next.js route handler
 * to proxy every auth request so the browser never touches the token directly.
 * That adds infrastructure complexity (and a round-trip) we don't need in V1.
 * SessionStorage + short-lived JWTs is the pragmatic tradeoff here.
 * We can migrate to httpOnly cookies in V2 without changing any consumer code
 * because the store interface stays the same.
 */

import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';

// ─────────────────────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────────────────────
import type { UserRole } from '@/lib/roles';

export interface AuthUser {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: UserRole;
  profileId?: string;
}

interface AuthState {
  // ── State ──────────────────────────────────────────────────────────────
  token: string | null;
  user: AuthUser | null;
  isReady: boolean;   // true once we've checked for a stored session

  // ── Actions ────────────────────────────────────────────────────────────
  /**
  * Called once after a successful login OR signup response.
  * Both flows return the same shape, so they share one setter.
  */
  setAuth: (token: string, user: AuthUser) => void;

  /**
   * Called on explicit logout. Also called by the WebSocket context
   * if the server sends a 4001 (auth expired) close code.
   */
  clearAuth: () => Promise<void>;
}

// ─────────────────────────────────────────────────────────────────────────────
// Auth Store
//
// Holds the JWT and current user. The token is kept in memory only —
// never written to localStorage directly from here (XSS risk).
// For persistence across page refreshes, use an httpOnly cookie
// strategy on the server, or call setAuth() from your auth API route.
// ─────────────────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      isReady: false,
      setAuth: (token, user) => set({ token, user, isReady: true }),
      clearAuth: async() => {
        const {token} = useAuthStore.getState();
        
        //remove the FCM token from the backend before clearing the auth token
        if(token) {
          try{
          await fetch(`${process.env.NEXT_PUBLIC_API_URL}/notifications/token`, {
            method: 'DELETE',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`,
            },
            body: JSON.stringify({
              platform: 'web',
            }),
          })}
          catch(error) {
            console.error('Error removing FCM token:', error);
          }
        }
        set({ token: null, user: null, isReady: true });
      },
    }),
    {
      name: 'medicoz-auth',
      /**
    * We explicitly use sessionStorage (not the default localStorage)
    * for the reason explained at the top of this file.
    * createJSONStorage handles the serialize/deserialize for us.
    */
      storage: createJSONStorage(() => sessionStorage),

      /**
     * Only persist the fields we actually need across page refreshes.
     * We don't persist anything else to avoid stale state bugs.
     */
      partialize: (state) => ({
        token: state.token,
        user: state.user,
      }),
    }
  )
)