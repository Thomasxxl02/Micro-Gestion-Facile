---
applyTo: '**/*.{ts,tsx}'
description: |
  WORKFLOW: Micro-Gestion-Facile React TypeScript Development.
  USE WHEN: Writing React components, hooks, services, or business logic for the PWA app.
  KEY RULES: (1) Always use Decimal.js for fiscal calculations (NEVER Number). (2) Components must be FC<Props> with explicit Props interface. (3) All managers import from db/invoiceDB, use Dexie transactions. (4) Test critical paths (fiscal calcs, CRUD, offline sync). (5) Commit messages: type(scope): description (ex: feat(invoice): add discount field).
---

# 🎯 Micro-Gestion-Facile Development Guide

_Micro-gestion-facile: PWA React TypeScript for French micro-entrepreneur management._

## Quick Start: Key Patterns

### 1️⃣ React Component Pattern

```typescript
import React, { FC } from 'react';

interface MyComponentProps {
  title: string;
  onSave?: (data: any) => void;
}

export const MyComponent: FC<MyComponentProps> = ({ title, onSave }) => {
  return <div>{title}</div>;
};

MyComponent.displayName = 'MyComponent';
```

### 2️⃣ Fiscal Calculation Pattern (ALWAYS use Decimal.js)

```typescript
import Decimal from 'decimal.js';

/**
 * Calculate URSSAF cotisation for 2026
 * @reference Code des impôts L.133-6-8, plafond 2026: 32,900€
 */
export const calculateURSSAFCotisation = (revenue: Decimal | number): Decimal => {
  const rev = new Decimal(revenue);
  const threshold = new Decimal('32900');

  if (rev.lessThanOrEqualTo(threshold)) {
    return rev.times('0.205'); // 20.5%
  }
  return threshold.times('0.205').plus(rev.minus(threshold).times('0.205'));
};
```

### 3️⃣ Manager + Dexie Pattern

```typescript
import db from '@/db/invoiceDB';

export const getInvoices = async () => {
  return await db.invoices.toArray();
};

export const createInvoice = async (invoice: Invoice) => {
  return await db.invoices.add(invoice);
};

export const deleteInvoice = async (id: string) => {
  return await db.invoices.delete(id);
};
```

### 4️⃣ Zustand Store Pattern

```typescript
import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';

interface AppState {
  userId: string;
  selectUser: (id: string) => void;
}

export const useAppStore = create<AppState>()(
  devtools(
    persist(
      (set) => ({
        userId: '',
        selectUser: (id: string) => set({ userId: id }),
      }),
      { name: 'app-store' }
    )
  )
);
```

### 5️⃣ Testing Pattern (Vitest + React Testing Library)

```typescript
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render with title', () => {
    render(<MyComponent title="Test" />);
    expect(screen.getByText('Test')).toBeInTheDocument();
  });
});
```

---

## ✅ Critical Rules (DO NOT BREAK)

| Rule                           | Why                                                  | Example                                                          |
| ------------------------------ | ---------------------------------------------------- | ---------------------------------------------------------------- |
| **Decimal.js for fiscal**      | JavaScript floats cause rounding errors (€0.01 loss) | ❌ `0.1 + 0.2 === 0.3` fails ✅ `new Decimal('0.1').plus('0.2')` |
| **FC<Props> components**       | Explicit types enable autocomplete and catch bugs    | ✅ `const C: FC<P> = ({...})` ❌ `const C = (props) => {}`       |
| **Transactions for batch ops** | Prevents partial writes if DB crashes                | ✅ `db.transaction('rw', ...)`                                   |
| **Test fiscal + CRUD**         | Compliance + data integrity                          | At least 1 test per calc function                                |
| **No API keys in code**        | SECURITY: keys leak on GitHub                        | Use `.env.local`, never commit secrets                           |
| **Offline-first design**       | App must work without internet                       | Always prefer IndexedDB → Firestore sync                         |

---

## 📂 Project Structure

```
src/
├── components/          # React components (UI + forms)
│   ├── Managers/       # CRUD managers (Invoice, Client, etc.)
│   └── *Manager.tsx
├── hooks/              # Custom React hooks
├── services/           # Business logic (fiscal, export, etc.)
├── lib/                # Utilities (facturX, calculations, etc.)
├── db/                 # Dexie database schema (invoiceDB.ts)
├── types/              # TypeScript interfaces
├── store/              # Zustand stores
└── __tests__/          # Vitest test files
```

**Key Modules:**

- `db/invoiceDB.ts` - Dexie schema (collections: invoices, clients, etc.)
- `lib/fiscalCalculations.ts` - URSSAF, TVA, seuils
- `lib/facturX.ts` - Factur-X XML generation
- `lib/exportUtils.ts` - PDF/CSV export
- `hooks/useFirestoreSync.ts` - Offline ↔ Firestore sync

---

## 🧪 Testing Checklist

**Before commit:**

- ✅ Run `npm run type-check` (TypeScript strict mode)
- ✅ Run `npm run lint:fix` (ESLint + Prettier)
- ✅ Run `npm run test:coverage` (target: 70%+)
- ✅ Test offline mode (DevTools Network → Offline)

**Critical coverage targets:**

- Fiscal calculations (100%)
- Manager CRUD (95%+)
- Export operations (90%+)
- UI workflows (60%+)

---

## 🐛 Debugging

### Dev Server + Chrome DevTools

```bash
npm run dev
# Opens http://localhost:5173
# Press F12 → Debugger tab → set breakpoints
```

### Vitest + UI

```bash
npm run test:ui
# Opens http://localhost:51204/__vitest__/__coverage__
```

### Vite Build Analysis

```bash
npm run build
# Check dist/ bundle sizes (warn if >500KB)
```

---

## 📝 Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types:** `feat`, `fix`, `docs`, `style`, `refactor`, `perf`, `test`, `chore`  
**Scope:** `invoice`, `fiscal`, `ui`, `db`, `export`, `sync`, etc.

**Example:**

```
feat(fiscal): add URSSAF seuil validation for 2026

- Implement threshold check at 32,900€
- Add test cases for micro-entrepreneur edge cases
- Reference: Code des impôts L.133-6-8

Closes #42
```

---

## 🚀 Common Tasks

### Add a new Manager (e.g., TaxManager)

1. Create `src/components/TaxManager.tsx` (React component)
2. Add schema to `src/db/invoiceDB.ts` ("taxes": Table<Tax>)
3. Create `src/services/taxService.ts` (CRUD ops)
4. Write tests in `src/__tests__/taxService.test.ts`
5. Connect to Zustand store if needed

### Add a Fiscal Calculation

1. Add function to `src/lib/fiscalCalculations.ts`
2. Use `Decimal.js` throughout
3. Document with `@reference` tag (code des impôts)
4. Write test in `src/__tests__/fiscalCalculations.test.ts` (100% coverage)

### Export Feature (PDF/CSV)

1. Add function to `src/lib/exportUtils.ts`
2. Use `jsPDF` or `csv-parser` already installed
3. Test with real invoices (from IndexedDB)
4. Ensure RGPD compliance (no unencrypted export)

---

## 🔒 Security Checklist

- ❌ Never commit `.env.local` or Firebase config with real keys
- ❌ Never use `eval()` or `innerHTML` with unsanitized data
- ✅ Sanitize PDF/export data (avoid XSS in PDF viewers)
- ✅ Validate file uploads (size, type)
- ✅ Use Content Security Policy headers (check `vite.config.ts`)

---

## 📊 Performance Tips

- Use `React.memo()` for expensive renders
- Lazy-load components: `const C = lazy(() => import('./C'))`
- Index Dexie queries: `.where('field').equals(...)`
- Batch DB writes with transactions
- Use `virtual-scroller` for 1000+ list items

---

## 🆘 Help & Resources

- **Dexie docs:** https://dexie.org/
- **URSSAF 2026:** https://www.urssaf.fr/
- **Factur-X spec:** https://www.e-facture.gouv.fr/
- **Vitest:** https://vitest.dev/
- **React Testing Library:** https://testing-library.com/react

---

## 💡 Agent Instructions Reminder

When working on this project:

1. **Always check fiscal calculations** — use Decimal.js, not Number
2. **Write tests for critical paths** — managers, exports, offline sync
3. **Follow commit message format** — enables better git history
4. **Use snippets from `.vscode/typescript.code-snippets`** — type `rfce`, `vtest`, `fcalc`, etc.
5. **Run full checks before push:** `npm run lint:fix && npm run type-check && npm run test:coverage`

Happy coding! 🚀
