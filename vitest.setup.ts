// ⚠️ CRITICAL: Import fake-indexeddb FIRST before anything else uses IndexedDB
import 'fake-indexeddb/auto';

import { afterEach, vi, beforeAll, afterAll } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';
import { server } from './src/mocks/server';
import { setupDexieForTests } from './__tests__/integration/dexieIntegrationSetup';

// Configurer le setup Dexie pour les tests d'intégration IndexedDB
setupDexieForTests();

// Configurer MSW pour les tests
beforeAll(() => server.listen());
afterEach(() => {
  server.resetHandlers();
  cleanup();
});
afterAll(() => server.close());

// Mock des APIs navigateur non disponibles dans jsdom
Object.defineProperty(globalThis, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation(query => ({
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

// Mock de crypto si nécessaire
if (!globalThis.crypto) {
  globalThis.crypto = {
    getRandomValues: (arr: Uint8Array | Uint32Array) => {
      for (let i = 0; i < arr.length; i++) {
        arr[i] = Math.floor(Math.random() * 256);
      }
      return arr;
    },
  } as any;
}

// Mock de scrollIntoView pour JSDOM
window.HTMLElement.prototype.scrollIntoView = vi.fn();
