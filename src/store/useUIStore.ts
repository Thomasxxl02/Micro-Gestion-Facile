/**
 * useUIStore.ts
 * Dedicated store for UI (layout, navigation, theme) state
 *
 * Handles: current view, mobile menu, dark mode
 * Consumed by: AppShell, Sidebar, ThemeToggle, ViewRouter
 */

import { create } from "zustand";
import { devtools, persist } from "zustand/middleware";
import type { ViewState } from "../types";

export interface UIStoreState {
  // Navigation
  currentView: ViewState;
  setCurrentView: (_view: ViewState) => void;

  // Mobile
  isMobileMenuOpen: boolean;
  setIsMobileMenuOpen: (_open: boolean) => void;

  // Theme
  isDarkMode: boolean;
  setIsDarkMode: (_isDark: boolean) => void;

  // Accessibility & UX Preferences
  reducedMotion: boolean;
  setReducedMotion: (_reduced: boolean) => void;
  soundEnabled: boolean;
  setSoundEnabled: (_enabled: boolean) => void;
  highVisibility: boolean;
  setHighVisibility: (_enabled: boolean) => void;

  // Connection Preferences
  offlinePriority: boolean;
  setOfflinePriority: (_enabled: boolean) => void;

  // Font Size
  fontSize: number;
  setFontSize: (_size: number) => void;

  // Reset
  reset: () => void;
}

export const useUIStore = create<UIStoreState>()(
  devtools(
    persist(
      // eslint-disable-next-line complexity
      (set) => ({
        // Navigation
        currentView: "dashboard" as ViewState,
        setCurrentView: (view: ViewState) => set({ currentView: view }),

        // Mobile
        isMobileMenuOpen: false,
        setIsMobileMenuOpen: (open: boolean) => set({ isMobileMenuOpen: open }),

        // Theme
        isDarkMode:
          typeof globalThis !== "undefined" && globalThis.window
            ? localStorage.getItem("theme") === "dark" ||
              (localStorage.getItem("theme") !== "light" &&
                globalThis.window.matchMedia("(prefers-color-scheme: dark)")
                  .matches)
            : false,
        setIsDarkMode: (isDark: boolean) => {
          if (isDark) {
            document.documentElement.classList.add("dark");
            localStorage.setItem("theme", "dark");
          } else {
            document.documentElement.classList.remove("dark");
            localStorage.setItem("theme", "light");
          }
          set({ isDarkMode: isDark });
        },

        // Accessibility & UX Preferences
        reducedMotion:
          typeof globalThis !== "undefined" && globalThis.window
            ? localStorage.getItem("reduced-motion") === "true" ||
              (localStorage.getItem("reduced-motion") === null &&
                globalThis.window.matchMedia("(prefers-reduced-motion: reduce)")
                  .matches)
            : false,
        setReducedMotion: (reduced: boolean) => {
          if (reduced) {
            document.documentElement.classList.add("reduced-motion");
          } else {
            document.documentElement.classList.remove("reduced-motion");
          }
          localStorage.setItem("reduced-motion", reduced.toString());
          set({ reducedMotion: reduced });
        },

        soundEnabled:
          typeof globalThis !== "undefined" && globalThis.window
            ? localStorage.getItem("sound-enabled") !== "false"
            : true,
        setSoundEnabled: (enabled: boolean) => {
          localStorage.setItem("sound-enabled", enabled.toString());
          set({ soundEnabled: enabled });
        },

        highVisibility:
          typeof globalThis !== "undefined" && globalThis.window
            ? localStorage.getItem("high-visibility") === "true"
            : false,
        setHighVisibility: (enabled: boolean) => {
          if (enabled) {
            document.documentElement.classList.add("high-visibility");
          } else {
            document.documentElement.classList.remove("high-visibility");
          }
          localStorage.setItem("high-visibility", enabled.toString());
          set({ highVisibility: enabled });
        },

        offlinePriority:
          typeof globalThis !== "undefined" && globalThis.window
            ? localStorage.getItem("offline-priority") === "true"
            : false,
        setOfflinePriority: (enabled: boolean) => {
          localStorage.setItem("offline-priority", enabled.toString());
          set({ offlinePriority: enabled });
        },

        // Font Size
        fontSize:
          typeof globalThis !== "undefined" && globalThis.window
            ? Number.parseInt(localStorage.getItem("font-size") ?? "16", 10)
            : 16,
        setFontSize: (size: number) => {
          document.documentElement.style.setProperty(
            "--app-font-size",
            `${size}px`,
          );
          localStorage.setItem("font-size", size.toString());
          set({ fontSize: size });
        },

        // Reset
        reset: () =>
          set({
            currentView: "dashboard",
            isMobileMenuOpen: false,
            fontSize: 16,
            reducedMotion: false,
            soundEnabled: true,
            highVisibility: false,
            offlinePriority: false,
          }),
      }),
      {
        name: "ui-store",
        partialize: (state) => ({
          currentView: state.currentView,
          isDarkMode: state.isDarkMode,
          fontSize: state.fontSize,
          reducedMotion: state.reducedMotion,
          soundEnabled: state.soundEnabled,
          highVisibility: state.highVisibility,
          offlinePriority: state.offlinePriority,
        }),
      },
    ),
  ),
);

export default useUIStore;
