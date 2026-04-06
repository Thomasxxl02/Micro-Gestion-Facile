import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    server: {
      port: 3000,
      host: '0.0.0.0',
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'prompt',
        injectRegister: null, // On gère l'enregistrement manuellement dans main

        // Assets copiés depuis public/ à inclure dans le précache
        includeAssets: ['offline.html', 'icons/icon.svg', 'icons/icon-maskable.svg'],

        manifest: {
          name: 'Micro Gestion Facile',
          short_name: 'Micro Gestion',
          description:
            'Gestion complète pour micro-entrepreneurs : factures, clients, fournisseurs, comptabilité et fiscal',
          theme_color: '#4F46E5',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'portrait-primary',
          scope: '/',
          start_url: '/',
          lang: 'fr',
          categories: ['business', 'finance', 'productivity'],
          icons: [
            {
              src: 'icons/icon.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any',
            },
            {
              src: 'icons/icon-maskable.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'maskable',
            },
          ],
          shortcuts: [
            {
              name: 'Nouvelle facture',
              short_name: 'Facture',
              url: '/?section=invoices',
              description: 'Créer une nouvelle facture',
            },
            {
              name: 'Tableau de bord',
              short_name: 'Dashboard',
              url: '/?section=dashboard',
              description: 'Voir le tableau de bord',
            },
          ],
        },

        workbox: {
          // Précache tout le shell applicatif
          globPatterns: ['**/*.{js,css,html,ico,svg,webp,woff2,woff,ttf}'],

          // Stratégies de cache runtime
          runtimeCaching: [
            // Google Fonts stylesheets – StaleWhileRevalidate (mise à jour silencieuse)
            {
              urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
              handler: 'StaleWhileRevalidate',
              options: {
                cacheName: 'google-fonts-stylesheets',
                expiration: { maxEntries: 5, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // Google Fonts fichiers – CacheFirst (immutables)
            {
              urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'google-fonts-webfonts',
                expiration: { maxEntries: 20, maxAgeSeconds: 60 * 60 * 24 * 365 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // Firebase Firestore & Auth – NetworkFirst (données fraîches prioritaires)
            {
              urlPattern: /^https:\/\/[^/]+\.googleapis\.com\/.*/i,
              handler: 'NetworkFirst',
              options: {
                cacheName: 'firebase-api',
                networkTimeoutSeconds: 5,
                expiration: { maxEntries: 50, maxAgeSeconds: 60 * 60 * 24 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
            // Firebase Storage – CacheFirst
            {
              urlPattern: /^https:\/\/firebasestorage\.googleapis\.com\/.*/i,
              handler: 'CacheFirst',
              options: {
                cacheName: 'firebase-storage',
                expiration: { maxEntries: 30, maxAgeSeconds: 60 * 60 * 24 * 7 },
                cacheableResponse: { statuses: [0, 200] },
              },
            },
          ],

          // Page fallback quand la navigation échoue hors-ligne
          navigateFallback: '/offline.html',
          navigateFallbackDenylist: [
            // Exclure les routes d'API et les ressources statiques
            /^\/api\//,
            /\.[a-z]{2,4}$/i,
          ],

          // Nettoyage des anciens caches au démarrage
          cleanupOutdatedCaches: true,
          skipWaiting: false, // Le SW attend la confirmation de l'utilisateur
          clientsClaim: false,
        },
      }),
    ],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
      'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    css: {
      postcss: {
        plugins: [
          autoprefixer(),
          cssnano({
            preset: 'default',
          }),
        ],
      },
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, './src'),
      },
    },
    build: {
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Separate vendor chunks by dependency
            if (id.includes('node_modules/jspdf')) {
              return 'vendor-pdf';
            }
            if (id.includes('node_modules/html2canvas')) {
              return 'vendor-canvas';
            }
            if (id.includes('node_modules/firebase')) {
              return 'vendor-firebase';
            }
            if (id.includes('node_modules/recharts')) {
              return 'vendor-charts';
            }
            if (id.includes('node_modules/lucide-react')) {
              return 'vendor-ui';
            }
            if (id.includes('node_modules/@dnd-kit')) {
              return 'vendor-dnd';
            }

            // Separate app chunks by feature domain
            if (
              id.includes('InvoiceManager') ||
              id.includes('ClientManager') ||
              id.includes('SupplierManager') ||
              id.includes('ProductManager')
            ) {
              return 'app-managers';
            }
            if (
              id.includes('AccountingManager') ||
              id.includes('SettingsManager') ||
              id.includes('EmailManager') ||
              id.includes('CalendarManager')
            ) {
              return 'app-admin';
            }
          },
        },
      },
    },
  };
});
