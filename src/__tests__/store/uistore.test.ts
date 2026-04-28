/**
 * Tests du store UI — src/store/useUIStore.ts
 * 
 * Vérifie l'état initial, les actions Zustand, la persistance 
 * et l'interaction avec le DOM (classes high-visibility, dark, etc.)
 */
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useUIStore } from "../../store/useUIStore";

// Mock matchMedia for jsdom
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(), // deprecated
    removeListener: vi.fn(), // deprecated
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

describe("useUIStore", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.className = "";
    document.documentElement.style.cssText = "";
    // Reset Zustand store state
    useUIStore.getState().reset();
  });

  it("initialise avec les valeurs par défaut", () => {
    const state = useUIStore.getState();
    expect(state.currentView).toBe("dashboard");
    expect(state.isMobileMenuOpen).toBe(false);
    expect(state.isDarkMode).toBe(false);
    expect(state.fontSize).toBe(16);
  });

  it("met à jour la vue courante (setCurrentView)", () => {
    useUIStore.getState().setCurrentView("clients");
    expect(useUIStore.getState().currentView).toBe("clients");
  });

  it("gère l'ouverture du menu mobile (setIsMobileMenuOpen)", () => {
    useUIStore.getState().setIsMobileMenuOpen(true);
    expect(useUIStore.getState().isMobileMenuOpen).toBe(true);
  });

  describe("Thème et Accessibilité", () => {
    it("active le mode sombre et met à jour le DOM", () => {
      useUIStore.getState().setIsDarkMode(true);
      expect(useUIStore.getState().isDarkMode).toBe(true);
      expect(document.documentElement.classList.contains("dark")).toBe(true);
      expect(localStorage.getItem("theme")).toBe("dark");
    });

    it("désactive le mode sombre", () => {
      useUIStore.getState().setIsDarkMode(true);
      useUIStore.getState().setIsDarkMode(false);
      expect(document.documentElement.classList.contains("dark")).toBe(false);
      expect(localStorage.getItem("theme")).toBe("light");
    });

    it("gère la réduction de mouvement (reducedMotion)", () => {
      useUIStore.getState().setReducedMotion(true);
      expect(useUIStore.getState().reducedMotion).toBe(true);
      expect(document.documentElement.classList.contains("reduced-motion")).toBe(true);
      expect(localStorage.getItem("reduced-motion")).toBe("true");
    });

    it("gère la haute visibilité (highVisibility)", () => {
      useUIStore.getState().setHighVisibility(true);
      expect(useUIStore.getState().highVisibility).toBe(true);
      expect(document.documentElement.classList.contains("high-visibility")).toBe(true);
    });

    it("met à jour la taille de police (fontSize)", () => {
      useUIStore.getState().setFontSize(20);
      expect(useUIStore.getState().fontSize).toBe(20);
      expect(document.documentElement.style.getPropertyValue("--app-font-size")).toBe("20px");
      expect(localStorage.getItem("font-size")).toBe("20");
    });
  });

  describe("Préférences & Reset", () => {
    it("gère la priorité hors-ligne (offlinePriority)", () => {
      useUIStore.getState().setOfflinePriority(true);
      expect(useUIStore.getState().offlinePriority).toBe(true);
      expect(localStorage.getItem("offline-priority")).toBe("true");
    });

    it("réinitialise tout le store (reset)", () => {
      const state = useUIStore.getState();
      state.setCurrentView("invoices");
      state.setIsDarkMode(true);
      state.setFontSize(24);
      
      state.reset();
      
      const newState = useUIStore.getState();
      expect(newState.currentView).toBe("dashboard");
      expect(newState.isDarkMode).toBe(false);
      expect(newState.fontSize).toBe(16);
    });
  });
});
