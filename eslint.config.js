import js from "@eslint/js";
import tsPlugin from "@typescript-eslint/eslint-plugin";
import tsParser from "@typescript-eslint/parser";
import reactPlugin from "eslint-plugin-react";
import reactHooksPlugin from "eslint-plugin-react-hooks";

export default [
  {
    ignores: ["node_modules/", "dist/", "coverage/"],
  },
  {
    files: [
      "src/**/*.ts",
      "src/**/*.tsx",
      "components/**/*.tsx",
      "services/**/*.ts",
      "public/**/*.ts",
      "*.tsx",
      "*.ts",
    ],
    languageOptions: {
      parser: tsParser,
      parserOptions: {
        ecmaVersion: "latest",
        sourceType: "module",
        ecmaFeatures: {
          jsx: true,
        },
        project: "./tsconfig.json",
      },
      globals: {
        console: "readonly",
        process: "readonly",
        performance: "readonly",
        window: "readonly",
        document: "readonly",
        navigator: "readonly",
        localStorage: "readonly",
        indexedDB: "readonly",
        fetch: "readonly",
        Promise: "readonly",
        // Timers
        setTimeout: "readonly",
        clearTimeout: "readonly",
        setInterval: "readonly",
        clearInterval: "readonly",
        // PWA / Service Workers
        caches: "readonly",
        ServiceWorkerGlobalScope: "readonly",
        ExtendableEvent: "readonly",
        FetchEvent: "readonly",
        ExtendableMessageEvent: "readonly",
        self: "readonly",
        // Node / Globals
        __dirname: "readonly",
        // Dialogs
        alert: "readonly",
        confirm: "readonly",
        // Encoding
        btoa: "readonly",
        atob: "readonly",
        // Crypto
        crypto: "readonly",
      },
    },
    plugins: {
      "@typescript-eslint": tsPlugin,
      react: reactPlugin,
      "react-hooks": reactHooksPlugin,
    },
    rules: {
      // Base ESLint rules
      ...js.configs.recommended.rules,
      "no-unused-vars": "off", // Disable base ESLint rule, use TSLint instead
      // TypeScript rules - ERRORS
      "@typescript-eslint/no-explicit-any": "warn", // Relaxed from error to warn
      "@typescript-eslint/no-floating-promises": "warn",
      "@typescript-eslint/no-misused-promises": "warn",
      "@typescript-eslint/await-thenable": "warn",
      "@typescript-eslint/prefer-nullish-coalescing": "warn",
      "@typescript-eslint/prefer-optional-chain": "warn",
      "@typescript-eslint/no-unused-vars": [
        "error",
        {
          argsIgnorePattern: "^_",
          varsIgnorePattern: "^_",
          caughtErrorsIgnorePattern: "^_",
        },
      ],
      "no-console": [
        "error",
        {
          allow: ["warn", "error"],
        },
      ],
      "no-debugger": "error",
      "no-var": "error",
      "prefer-const": "error",
      eqeqeq: ["error", "always"],
      "no-eval": "error",
      "no-implied-eval": "error",
      "no-new-func": "error",
      "no-empty": ["error", { allowEmptyCatch: true }],
      // React & React Hooks
      "react/react-in-jsx-scope": "off",
      "react/prop-types": "off",
      "react-hooks/rules-of-hooks": "error",
      "react-hooks/exhaustive-deps": "warn",
      // Code Quality - WARNINGS (Relaxed complexity thresholds)
      "no-nested-ternary": "warn",
      complexity: ["warn", { max: 25 }], // Relaxed from 15 to 25 for large components
    },
  },
  {
    files: ["public/sw.ts"],
    rules: {
      "no-console": "off",
    },
  },
  {
    files: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    rules: {
      "@typescript-eslint/no-explicit-any": "off",
      "no-console": "off",
    },
  },
  {
    // Relax rules for large/complex components that we'll refactor later
    files: [
      "src/components/AccountingManager.tsx",
      "src/components/Dashboard.tsx",
      "src/components/EmailManager.tsx",
      "src/components/SecurityTab.tsx",
      "src/components/SettingsManager.tsx",
      "src/components/Sidebar.tsx",
      "src/components/P2PSync.tsx"
    ],
    rules: {
      complexity: "off", // Defer complexity refactor to later
      "@typescript-eslint/no-unused-vars": "warn", // Defer unused vars cleanup
      "no-undef": "warn", // Relax undefined warnings for now
    },
  },
];
