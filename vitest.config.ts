import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Use virtual browser jsdom to simulate the DOM
    environment: 'jsdom',

    // Configure test files
    globals: true, // Use global APIs (describe, it, expect, etc.)

    // Include test files
    include: ['**/*.{test,spec}.{ts,tsx}'],

    // Exclude folders
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],

    // Code coverage configuration
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportOnFailure: true,
      exclude: ['node_modules/', 'dist/', '**/*.d.ts', '**/*.config.*', '**/mockData'],
      thresholds: {
        lines: 50,
        functions: 40,
        branches: 35,
        statements: 45,
      },
    },

    // Setup files for global configuration
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
