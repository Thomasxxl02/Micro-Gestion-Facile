import type { User } from "firebase/auth";
import { create } from "zustand";

interface AuthStoreState {
  user: User | null;
  isAuthReady: boolean;
  setUser: (user: User | null) => void;
  setIsAuthReady: (ready: boolean) => void;
  reset: () => void;
}

export const useAuthStore = create<AuthStoreState>()((set) => ({
  user: null,
  isAuthReady: false,
  setUser: (user) => set({ user }),
  setIsAuthReady: (isAuthReady) => set({ isAuthReady }),
  reset: () => set({ user: null, isAuthReady: false }),
}));

export default useAuthStore;
