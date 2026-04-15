/// <reference types="vitest" />
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import path from "path";
import { defineConfig, loadEnv } from "vite";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, ".", "");
  return {
    server: {
      port: 3000,
      host: "0.0.0.0",
    },
    plugins: [react(), tailwindcss()],
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
      chunkSizeWarningLimit: 500,
      rollupOptions: {
        output: {
          manualChunks: (id) => {
            // Separate vendor chunks by dependency
            if (id.includes("node_modules/jspdf")) {
              return "vendor-pdf";
            }
            if (id.includes("node_modules/html2canvas")) {
              return "vendor-canvas";
            }
            if (id.includes("node_modules/firebase")) {
              return "vendor-firebase";
            }
            if (id.includes("node_modules/recharts")) {
              return "vendor-charts";
            }
            if (id.includes("node_modules/lucide-react")) {
              return "vendor-ui";
            }
            if (id.includes("node_modules/@dnd-kit")) {
              return "vendor-dnd";
            }

            // Separate app chunks by feature domain
            if (
              id.includes("InvoiceManager") ||
              id.includes("ClientManager") ||
              id.includes("SupplierManager") ||
              id.includes("ProductManager")
            ) {
              return "app-managers";
            }
            // AccountingManager, SettingsManager, EmailManager, CalendarManager
            // sont déjà en React.lazy() → laissés en chunks séparés automatiques
          },
        },
      },
    },
  };
});
