import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import legacy from '@vitejs/plugin-legacy';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

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
        legacy({
          targets: ['defaults', 'not IE 11', 'Edge >= 79', 'Firefox >= 78'],
          additionalLegacyPolyfills: ['regenerator-runtime/runtime']
        }),
      ],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
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
          '@': path.resolve(__dirname, '.'),
        }
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
              if (id.includes('InvoiceManager') || id.includes('ClientManager') ||
                  id.includes('SupplierManager') || id.includes('ProductManager')) {
                return 'app-managers';
              }
              if (id.includes('AccountingManager') || id.includes('SettingsManager') ||
                  id.includes('EmailManager') || id.includes('CalendarManager')) {
                return 'app-admin';
              }
            }
          }
        }
      }
    };
});
