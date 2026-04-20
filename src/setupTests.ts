/**
 * setupTests.ts — Configuration globale des tests Vitest.
 * Importe jest-dom pour les matchers DOM (.toBeInTheDocument, .toHaveAttribute, etc.)
 */
import "@testing-library/jest-dom";
import "fake-indexeddb/auto";
import { vi } from "vitest";

// Mock window.matchMedia — non disponible dans jsdom, requis par useUIStore (prefers-color-scheme)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  configurable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});
