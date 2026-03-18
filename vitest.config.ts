import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import path from 'path';

export default defineConfig({
  plugins: [react(), tailwindcss()],
  test: {
    // Utiliser le navigateur virtuel jsdom pour simuler le DOM
    environment: 'jsdom',
    
    // Configuration des fichiers de test
    globals: true, // Utiliser les APIs globales (describe, it, expect, etc.)
    
    // Inclure les fichiers de test
    include: ['**/*.{test,spec}.{ts,tsx}'],
    
    // Exclure les dossiers
    exclude: ['node_modules', 'dist', '.idea', '.git', '.cache'],
    
    // Configuration de la couverture de code
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      reportOnFailure: true,
      exclude: [
        'node_modules/',
        'dist/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/mockData',
      ],
      // Seuils de couverture (optionnel mais recommandé)
      lines: 70,
      functions: 70,
      branches: 60,
      statements: 70,
    },
    
    // Setupfiles pour la configuration globale
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
