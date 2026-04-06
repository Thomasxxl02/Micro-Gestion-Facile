// ⚠️ CRITICAL: Import fake-indexeddb FIRST before anything else uses IndexedDB
import 'fake-indexeddb/auto';

import '@testing-library/jest-dom';
import { cleanup } from '@testing-library/react';
import { afterAll, afterEach, beforeAll, vi } from 'vitest';
import { setupDexieForTests } from './src/__tests__/integration/dexieIntegrationSetup';
import { server } from './src/mocks/server';

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

// Polyfill crypto avec l'API webcrypto de Node.js (CSPRNG — jamais Math.random)
import { webcrypto } from 'node:crypto';
if (!globalThis.crypto?.getRandomValues) {
  Object.defineProperty(globalThis, 'crypto', {
    value: webcrypto,
    writable: false,
    configurable: true,
  });
}

// Mock de scrollIntoView pour JSDOM
globalThis.HTMLElement.prototype.scrollIntoView = vi.fn();
