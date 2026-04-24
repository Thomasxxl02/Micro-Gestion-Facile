/// <reference types="vitest" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";
import { VitePWA } from "vite-plugin-pwa";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: "autoUpdate",
        manifest: {
          name: "Micro-Gestion Facile",
          short_name: "Micro-Gestion",
          description: "Gestion complète pour micro-entrepreneurs",
          theme_color: "#1f2937",
          background_color: "#ffffff",
          display: "standalone",
          scope: "/",
          start_url: "/",
          orientation: "portrait-primary",
          icons: [
            {
              src: "/pwa-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "any",
            },
            {
              src: "/pwa-maskable-192x192.png",
              sizes: "192x192",
              type: "image/png",
              purpose: "maskable",
            },
            {
              src: "/pwa-maskable-512x512.png",
              sizes: "512x512",
              type: "image/png",
              purpose: "maskable",
            },
          ],
          screenshots: [
            {
              src: "/screenshot-540x720.png",
              sizes: "540x720",
              type: "image/png",
              form_factor: "narrow",
            },
            {
              src: "/screenshot-1280x720.png",
              sizes: "1280x720",
              type: "image/png",
              form_factor: "wide",
            },
          ],
          shortcuts: [
            {
              name: "Créer une facture",
              short_name: "Facture",
              description: "Créer une nouvelle facture",
              url: "/invoices?create=true",
              icons: [
                {
                  src: "/icon-invoice-192x192.png",
                  sizes: "192x192",
                },
              ],
            },
            {
              name: "Ajouter un client",
              short_name: "Client",
              description: "Ajouter un nouveau client",
              url: "/clients?create=true",
              icons: [
                {
                  src: "/icon-client-192x192.png",
                  sizes: "192x192",
                },
              ],
            },
          ],
        },
        workbox: {
          globPatterns: [
            "**/*.{js,css,html,svg,png,jpg,jpeg,gif,webp,woff,woff2,ttf,eot}",
          ],
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/fonts\.(googleapis|gstatic)\.com\/.*/i,
              handler: "CacheFirst",
              options: {
                cacheName: "google-fonts-cache",
                expiration: {
                  maxEntries: 10,
                  maxAgeSeconds: 60 * 60 * 24 * 365, // 1 year
                },
              },
            },
            {
              urlPattern: /^https:\/\/firebaseapp\.com\/.*/i,
              handler: "NetworkFirst",
              options: {
                cacheName: "firebase-api-cache",
                networkTimeoutSeconds: 3,
                expiration: {
                  maxEntries: 50,
                  maxAgeSeconds: 60 * 60 * 24 * 7, // 1 week
                },
              },
            },
          ],
          skipWaiting: true,
          clientsClaim: true,
        },
        devOptions: {
          enabled: false,
          navigateFallback: "index.html",
          suppressWarnings: true,
        },
      }),
    ],
    define: {
      "process.env.API_KEY": JSON.stringify(env.GEMINI_API_KEY),
      "process.env.GEMINI_API_KEY": JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "."),
      },
    },
    test: {
      globals: true,
      environment: "jsdom",
      setupFiles: ["./src/setupTests.ts"],
      css: false,
      coverage: {
        provider: "v8",
        reporter: ["text", "lcov", "html"],
        exclude: [
          "node_modules/",
          "src/setupTests.ts",
          "**/*.d.ts",
          "**/__mocks__/**",
        ],
      },
    },
    build: {
      chunkSizeWarningLimit: 600,
      // Vite 8 with Rolldown uses oxc minifier by default (Rust-based, faster than terser/esbuild)
      minify: true,
      target: "es2020",
      rollupOptions: {
        output: {
          // Optimized manual chunks for better code splitting
          // eslint-disable-next-line complexity
          manualChunks: (id: string) => {
            // Heavy vendor libraries get their own chunk
            if (id.includes("node_modules/recharts")) {
              return "vendor-charts";
            }
            if (id.includes("node_modules/firebase")) {
              return "vendor-firebase";
            }
            if (id.includes("node_modules/@dnd-kit")) {
              return "vendor-dnd";
            }

            // UI & utilities
            if (id.includes("node_modules/lucide-react")) {
              return "vendor-ui";
            }

            // PDF & canvas (only loaded on demand)
            if (
              id.includes("node_modules/jspdf") ||
              id.includes("node_modules/html2canvas")
            ) {
              return "vendor-export";
            }

            // Google Gemini AI (lazy-loaded lors du scan de reçu)
            if (id.includes("node_modules/@google/genai")) {
              return "vendor-gemini";
            }

            // App-specific chunks for lazy-loaded features
            if (
              id.includes("InvoiceManager") ||
              id.includes("ClientManager") ||
              id.includes("SupplierManager") ||
              id.includes("ProductManager")
            ) {
              return "app-managers";
            }

            // Settings
            if (id.includes("SettingsManager")) {
              return "app-settings";
            }

            // Communication features
            if (
              id.includes("EmailManager") ||
              id.includes("CalendarManager") ||
              id.includes("AIAssistant")
            ) {
              return "app-communication";
            }
          },
          // Use content-based naming for better caching
          chunkFileNames: "chunks/[name]-[hash:8].js",
          entryFileNames: "js/[name]-[hash:8].js",
          assetFileNames: (assetInfo) => {
            if (!assetInfo?.name) {
              return "assets/[name]-[hash:8][extname]";
            }
            const info = assetInfo.name.split(".");
            const ext = info[info.length - 1];
            if (/png|jpe?g|gif|svg/.test(ext)) {
              return `assets/images/[name]-[hash:8][extname]`;
            } else if (/woff|woff2|eot|ttf|otf/.test(ext)) {
              return `assets/fonts/[name]-[hash:8][extname]`;
            } else if (ext === "css") {
              return `assets/css/[name]-[hash:8][extname]`;
            }
            return `assets/[name]-[hash:8][extname]`;
          },
        },
        // Optimize compression
        input: {
          main: path.resolve(__dirname, "index.html"),
        },
      },
    },
  };
});
