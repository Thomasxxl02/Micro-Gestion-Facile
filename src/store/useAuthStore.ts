/**
 * useAuthStore.ts
 * Dedicated store for authentication state
 *
 * Handles: user identity, auth readiness
 * Consumed by: LoginPage, NavBar, ProtectedRoutes
 */

import type { User } from 'firebase/auth';
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

export interface AuthStoreState {
  // Auth State
  user: User | null;
  setUser: (user: User | null) => void;

  isAuthReady: boolean;
  setIsAuthReady: (ready: boolean) => void;

  // Reset
  reset: () => void;
}

export const useAuthStore = create<AuthStoreState>()(
  devtools(
    persist(
      (set) => ({
        // Auth State
        user: null,
        setUser: (user: User | null) => set({ user }),

        isAuthReady: false,
        setIsAuthReady: (ready: boolean) => set({ isAuthReady: ready }),

        // Reset
        reset: () =>
          set({
            user: null,
            isAuthReady: false,
          }),
      }),
      {
        name: 'auth-store',
        partialize: (state) => ({
          // Don't persist user (security)
          isAuthReady: state.isAuthReady,
        }),
      }
    )
  )
);

export default useAuthStore;
