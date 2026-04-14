# 🚀 Guide d'Intégration UseOfflineSync dans AppShell

**Objectif:** Passer de `useFirestoreSync` (Firestore-only) à `useOfflineSync` (Firestore + Dexie offline-first) pour une vraie PWA robust.

**Date:** 6 avril 2026  
**Session:** Phase Option A - Activation PWA Offline-First

---

## 📊 État Actuel

```tsx
// AppShell.tsx ligne ~110
const {
  data: syncedInvoices,
  upsert: saveInvoice,
  remove: deleteInvoice,
} = useFirestoreSync({
  userId: user?.uid || '',
  collectionName: 'invoices',
});
```

**Problème :** Les données ne sont persistées que via Firestore. En mode offline complet, les données disparaissent.

---

## ✅ État Cible

```tsx
// AppShell.tsx ligne ~110
const {
  data: syncedInvoices,
  upsert: saveInvoice,
  remove: deleteInvoice,
  isFromLocalCache,
} = useOfflineSync({
  userId: user?.uid || '',
  collectionName: 'invoices',
  dexieTableName: 'invoices', // ← Active la persistance Dexie
});
```

**Bénéfice :** Les données restent accessibles en offline, synchronisées automatiquement au retour de connexion.

---

## 🔄 Plan de Migration (Progressif)

### Étape 1: Remplacer les imports (2 min)

**Fichier:** `src/components/AppShell.tsx`

```diff
- import { useFirestoreSync } from '../hooks/useFirestoreSync';
+ import { useOfflineSync } from '../hooks/useOfflineSync';
```

### Étape 2: Remplacer les hooks **critiques en priorité** (10 min)

Les collections critiques (données métier) :

```tsx
// 🔴 CRITIQUE - À migrer EN PRIORITÉ
const { data: syncedInvoices, ... } = useOfflineSync({
  userId: user?.uid || '',
  collectionName: 'invoices',
  dexieTableName: 'invoices', // ← Ajouter ça
});

const { data: syncedClients, ... } = useOfflineSync({
  userId: user?.uid || '',
  collectionName: 'clients',
  dexieTableName: 'clients', // ← Ajouter ça
});

const { data: syncedProducts, ... } = useOfflineSync({
  userId: user?.uid || '',
  collectionName: 'products',
  dexieTableName: 'products', // ← Ajouter ça
});
```

### Étape 3: Remplacer les autres collections (20 min)

Les collections secondaires (meilleur-effort offline) :

```tsx
// 🟡 SECONDAIRE - Peut rester en useFirestoreSync pour l'instant
// ou migrer progressivement
const { data: syncedSuppliers, ... } = useOfflineSync({
  userId: user?.uid || '',
  collectionName: 'suppliers',
  dexieTableName: 'suppliers',
});

const { data: syncedExpenses, ... } = useOfflineSync({
  userId: user?.uid || '',
  collectionName: 'expenses',
  dexieTableName: 'expenses',
});

// ... et les autres collections
```

### Étape 4: Tester l'offline (5 min)

1. Ouvrir DevTools (F12)
2. Application → Service Workers → **Offline**
3. Rafraîchir la page
4. Vérifier que les données restent visibles ✅

---

## 🚨 Pièges Courants

### 1. **Oublier `dexieTableName`**

```tsx
// ❌ WRONG - Restera comme FirestoreSync
const { data } = useOfflineSync({
  userId: user?.uid || '',
  collectionName: 'invoices',
  // ← dexieTableName manquant → pas de persistence
});

// ✅ CORRECT
const { data } = useOfflineSync({
  userId: user?.uid || '',
  collectionName: 'invoices',
  dexieTableName: 'invoices', // ← Requis pour offline
});
```

### 2. **Conflits de noms table**

Les noms Dexie doivent **CORRESPONDRE EXACTEMENT** aux keys de `invoiceDB`:

- `'invoices'` ✅
- `'Invoices'` ❌ (sensible à la casse)
- `'clients'` ✅
- `'suppliers'` ✅

Voir tous les noms valides dans : `src/db/invoiceDB.ts` (constructor)

### 3. **Oublie de redéployer** après changement

```bash
npm run build
# Puis redéployer avec clear cache navigateur (Ctrl+Shift+Delete)
```

---

## 📈 Progression Recommandée

| Phase       | Collections                 | Impact                 | Durée  | Risque |
| ----------- | --------------------------- | ---------------------- | ------ | ------ |
| **Phase 1** | invoices, clients, products | 90% des données métier | 15 min | 🟢 Bas |
| **Phase 2** | suppliers, expenses         | Accounting complete    | 15 min | 🟢 Bas |
| **Phase 3** | emails, events, templates   | Périphérique           | 15 min | 🟢 Bas |

---

## ✨ Après la Migration

### Amélioration de l'UX offline

Afficher un badge "Offline" :

```tsx
// Dans AppShell.tsx
const { isFromLocalCache } = useOfflineSync({ ... });

{isFromLocalCache && (
  <div className="bg-yellow-100 text-yellow-800 p-2 text-sm">
    📶 Mode offline - Données locales
  </div>
)}
```

### Monitoring

En développement, les logs DEV affichent :

```
[OfflineSync] invoices synchronisé (42 items)
[OfflineSync] invoices depuis cache local (offline détecté)
[OfflineSync] 12345 sauvegardé dans Dexie
```

---

## 🔍 Débogage

### Vérifier Dexie dans DevTools

1. F12 → Application → **IndexedDB**
2. Ouvrir `MicroGestionFacile` database
3. Naviguer les tables (invoices, clients, etc.)

### Forcer un sync manuel

```tsx
// Dans AppShell.tsx, optionnel
const refreshSync = async () => {
  // L'effet useEffect trigger automatiquement les syncs
  // Mais on peut forcer une re-souscription
  window.location.reload(); // Dernier recours
};
```

---

## 🎯 Checklist Post-Migration

- [ ] Tous les `useFirestoreSync` → `useOfflineSync` pour collections critiques
- [ ] `dexieTableName` ajouté pour chaque collection
- [ ] Build compile sans erreurs (`npm run type-check`)
- [ ] Tests offline pass (`npm run test`)
- [ ] Manifestement testé offline (F12 offline + reload)
- [ ] Performance monitored (`npm run build` taille fichier)

---

## 📞 Support

Si des erreurs TypeScript :

```
Property 'invoiceTableName' does not exist on type 'InvoiceDB'
```

→ Vérifier la casse et les noms dans `src/db/invoiceDB.ts` constructor.

Si offline ne marche pas :

→ Vérifier Service Worker status dans DevTools Application tab.

---

**Prêt à migrer ? Commentez les changements dans git avec :**

```bash
git commit -m "feat(sync): activate useOfflineSync for true offline-first PWA

- Migrate invoices, clients, products to useOfflineSync
- Enable Dexie persistence for local data backup
- Support true offline mode with cache-first strategy
- Improve UX with offline indicators

Closes: <issue-id>"
```
