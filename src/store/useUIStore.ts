/**
 * useUIStore.ts
 * Dedicated store for UI (layout, navigation, theme) state
 *
 * Handles: current view, mobile menu, dark mode
 * Consumed by: AppShell, Sidebar, ThemeToggle, ViewRouter
 */

import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import type { ViewState } from '../types';

export interface UIStoreState {
  // Navigation
  currentView: ViewState;
  setCurrentView: (view: ViewState) => void;

  // Mobile
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (open: boolean) => void;

  // Theme
  isDarkMode: boolean;
  setIsDarkMode: (isDark: boolean) => void;

  // Reset
  reset: () => void;
}

export const useUIStore = create<UIStoreState>()(
  devtools(
    persist(
      (set) => ({
        // Navigation
        currentView: 'dashboard' as ViewState,
        setCurrentView: (view: ViewState) => set({ currentView: view }),

        // Mobile
        isMobileMenuOpen: false,
        setIsMobileMenuOpen: (open: boolean) => set({ isMobileMenuOpen: open }),

        // Theme
        isDarkMode:
          typeof globalThis !== 'undefined' && globalThis.window
            ? localStorage.getItem('theme') === 'dark' ||
              (localStorage.getItem('theme') !== 'light' &&
                globalThis.window.matchMedia('(prefers-color-scheme: dark)').matches)
            : false,
        setIsDarkMode: (isDark: boolean) => {
          if (isDark) {
            document.documentElement.classList.add('dark');
            localStorage.setItem('theme', 'dark');
          } else {
            document.documentElement.classList.remove('dark');
            localStorage.setItem('theme', 'light');
          }
          set({ isDarkMode: isDark });
        },

        // Reset
        reset: () =>
          set({
            currentView: 'dashboard',
            isMobileMenuOpen: false,
          }),
      }),
      {
        name: 'ui-store',
        partialize: (state) => ({
          currentView: state.currentView,
          isDarkMode: state.isDarkMode,
        }),
      }
    )
  )
);

export default useUIStore;
