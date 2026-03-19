# 🤝 Guide de contribution

Merci d'envisager de contribuer à **Micro-Gestion-Facile** ! Ce guide vous aidera à démarrer.

## 🎯 Principes fondamentaux

- **Souveraineté num érique d'abord** : Pas de dépendance à Big Tech
- **Open Source pour toujours** : Pas de code propriétaire
- **Données utilisateur inviolables** : Zéro tracking, droit à l'oubli
- **Code de qualité** : Tests, types, documentation

## 🛠️ Mise en place du développement

### **1. Fork & Clone**

```bash
git clone https://github.com/YOUR_USERNAME/Micro-Gestion-Facile.git
cd Micro-Gestion-Facile
```

### **2. Installation**

```bash
npm install
cp .env.example .env.local
# Éditer .env.local avec vos clés Firebase
```

### **3. Démarrage**

```bash
npm run dev
# http://localhost:5173
```

### **4. Vérification**

```bash
npm run lint      # TypeScript
npm run format    # Code style
npm run test      # Tests unitaires
```

---

## 📋 Types de contributions

### **🐛 Bug fixes**

1. Créer une issue avec `[BUG]` prefix
2. Expliquer le comportement attendu vs actuel
3. Steps to reproduce
4. Fork → branch `fix/description`
5. Commit: `fix(component): description [#123]`
6. PR avec référence issue

**Exemple:**

```bash
git checkout -b fix/invoice-date-parsing
# ... éditer fichiers ...
git commit -m "fix(invoiceManager): parse date format correctly [#42]"
```

### **✨ Nouvelles fonctionnalités**

1. **Créer une discussion** avant (pas de travail perdu)
2. Valider architecture/design
3. Fork → branch `feature/description`
4. Commit: `feat(area): description`
5. PR avec description détaillée

**Areas reconnus:**

- `feat(auth)` - Authentication
- `feat(invoice)` - Invoice management
- `feat(export)` - Data export
- `feat(crypto)` - Chiffrement
- `feat(a11y)` - Accessibilité
- `feat(perf)` - Performance

### **📚 Documentation**

- Routes: `/docs/*.md`
- En-ligne dans le code: `/** JSDoc */`
- Exemples: dans `README.md`

### **🎨 Refactoring**

1. Pas de changement fonctionnel
2. Tests doivent passer 100%
3. Type coverage maintenue
4. Commit: `refactor(area): description`

---

## ✅ Critères de qualité

### **Code**

```typescript
// ✅ BON
const calculateTVA = (amount: Decimal, rate: 0 | 5.5 | 20): Decimal => {
  return amount.times(rate).dividedBy(100);
};

// ❌ MAUVAIS
function calculateTVA(amount, rate) {
  return (amount * rate) / 100; // Float imprecision!
}
```

### **TypeScript**

- ✅ Types explicites pour params/returns
- ✅ Pas de `any` sauf résistance
- ✅ `strict: true` dans tsconfig
- ✅ Interfaces documentées

### **Tests**

```typescript
// Tests requis pour :
// - Calculs financiers (TVA, URSSAF)
// - Auth flows
// - Exports (JSON, PDF)
// - Validations données

describe('calculateTVA', () => {
  it('should calculate 20% TVA correctly', () => {
    const result = calculateTVA(new Decimal(100), 20);
    expect(result.toString()).toBe('20');
  });
});
```

### **Performance**

- Bundle < 2.5 MB (est. 2 MB actuel)
- Lighthouse > 80 (Web Core Vitals)
- Aucun N+1 Firestore query
- Memoization pour re-renders

### **Accessibilité (WCAG AA)**

```typescript
// ✅ BON
<button title="Supprimer facture" onClick={delete}>
  <Trash size={20} />
</button>

<select title="Sélectionner client">
  {clients.map(c => <option key={c.id}>{c.name}</option>)}
</select>

// ❌ MAUVAIS
<div onClick={delete}>❌</div>
<select>{/* pas de titre */}</select>
```

---

## 📝 Processus de PR

### **Avant de soumettre**

```bash
# 1. Sync avec main
git fetch origin main
git rebase origin/main

# 2. Tests locaux
npm run lint        # Doit passer
npm run format      # Auto-format
npm run test        # 100% pass

# 3. Build produit
npm run build       # Doit réussir
```

### **Template PR**

```markdown
## Description

Quoi fait cette PR ? Pourquoi ?

## Type

- [ ] 🐛 Bug fix
- [ ] ✨ Feature
- [ ] 📚 Documentation
- [ ] 🎨 Refactor

## Issue

Ferme #XXX

## Changes

- Fichier A: Quoi
- Fichier B: Pourquoi

## Tests

- [ ] Tests locaux passent
- [ ] Aucune régression
- [ ] Accessibilité vérifiée

## Screenshots (si UI)

Avant/Après

## Checklist

- [ ] Code suit style guide
- [ ] Auto-tests ajoutés
- [ ] Docs mises à jour
```

---

## 🏗️ Structure projet

```
src/
├── components/          # React components
│   ├── Dashboard.tsx
│   ├── InvoiceManager.tsx
│   └── ...
├── store/              # Zustand stores
│   └── appStore.ts
├── services/           # API integrations
│   ├── firebase.ts
│   └── geminiService.ts
├── lib/               # Business logic
│   └── invoiceCalculations.ts
├── types.ts           # Global types
├── App.tsx            # Entry point
└── index.tsx          # React DOM render

tests/
├── components/        # Component tests
├── lib/              # Logic tests
└── fixtures/         # Test data

docs/
├── CONTRIBUTING.md   # (this file)
├── ARCHITECTURE.md
├── DATA_PORTABILITY.md
└── DEPLOYMENT.md
```

---

## 🔐 Revue de sécurité

**Avant chaque merge à `main`, vérifier:**

- [ ] Pas de secrets (API key, token) hardcodé
- [ ] Validation entrées utilisateur
- [ ] Firestore rules updated (si data model change)
- [ ] Pas de requête N+1
- [ ] Logs n'exposent pas données sensibles
- [ ] CORS/CSP headers corrects

---

## 📖 Conventions de code

### **Nommage**

```typescript
// Files
MyComponent.tsx; // PascalCase
utils.ts; // camelCase
constants.ts; // camelCase

// Variables
const myVar = 'value'; // camelCase
const MY_CONST = 100; // UPPER_SNAKE
type UserProfile = {}; // PascalCase
interface IService {} // PascalCase prefix I

// Functions
function getUserById(); // camelCase
const calculateTVA = () => {}; // camelCase

// Classes (rare dans ce projets)
class InvoiceService {} // PascalCase
```

### **Imports**

```typescript
// 1. Lib externe
import React, { useState } from 'react';
import { Decimal } from 'decimal.js';

// 2. Composants projet
import Dashboard from './components/Dashboard';
import { useAppStore } from './store/appStore';

// 3. Types
import type { Invoice } from './types';

// 4. Utils internes
import { calculateTVA } from './lib/invoiceCalculations';
```

### **Comments**

```typescript
// Mauvais - répète le code
const age = user.birthDate; // user's birth date

// BON - explique le WHY
// We cache birth date to avoid recalculating on each render
const birthDate = useMemo(() => user.birthDate, [user.id]);
```

---

## 🐛 Rapporter des bugs

**Title:** `[BUG] Symptôme court`

**Description:**

```markdown
### Description

Ce qui se passe mal

### Steps to reproduce

1. Aller à Page X
2. Cliquer sur Button Y
3. Voir erreur Z

### Expected

Comportement attendu

### Actual

Comportement réel

### Environment

- OS: Windows 11
- Browser: Chrome 120
- Node: 20.10
```

---

## 🎤 Questions?

- **Discussions:** GitHub Discussions
- **Chat:** (Ajouter Discord/Matrix future)
- **Email:** maintainers

---

## 📄 Licence

En contribuant, vous acceptez que vos contributions soient sous **MIT/AGPL** (selon dossier).

---

Merci d'améliorer Micro-Gestion-Facile ! 🚀
