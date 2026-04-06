# 📱 Guide de Test — PWA Offline Mode (Session 2)

**Date:** 6 avril 2026  
**Objectif:** Valider que la PWA fonctionne vraiment en offline avec `useOfflineSync + Dexie`  
**Durée:** 15 minutes

---

## ✅ Prérequis

- ✅ `useOfflineSync` câblé dans AppShell.tsx (Phase 1: invoices, clients, products)
- ✅ Service Worker enregistré (vite-plugin-pwa actif)
- ✅ Dexie database créée avec données préexistantes
- ✅ Build local lancée : `npm run dev` ou `npm run build && npm run preview`

---

## 🧪 Test 1 — Offline avec rechargement (Mode simple)

### Étape 1: Charger l'app en ligne

1. Ouvrir l'app → `http://localhost:3000` (dev) ou `http://localhost:4173` (preview)
2. Créer quelques **factures, clients, produits** (au moins 3 de chaque)
3. Vérifier que les données s'affichent normalement ✅

### Étape 2: Passer en offline

1. Ouvrir DevTools (F12)
2. Aller à l'onglet **Application** (ou **Storage**)
3. Naviguer → **Service Workers**
4. Cocher **Offline** (ou utiliser Network tab → throttling offline)

```
[✓] Offline
```

### Étape 3: Rafraîchir la page

```
Ctrl+R  (ou Cmd+R sur Mac)
```

### Étape 4: Vérifier les données

**Résultat attendu:** ✅

- Factures visibles (depuis Dexie) même offline
- Clients visibles
- Produits visibles
- No console errors

**Résultat problématique:** ❌

- Écran vide → Dexie n'a pas sauvegardé
- Erreur Firestore → Cache Firestore pas activé

---

## 🧪 Test 2 — Créer des données en offline (Plus réaliste)

### Étape 1: Aller en offline

F12 → Application → Service Workers → [✓] Offline

### Étape 2: Ajouter une facture

1. Cliquer sur **Invoices** (ou aller à la section factures)
2. Cliquer **+ Nouvelle facture**
3. Remplir le formulaire :
   - Client: (sélectionner un client existant)
   - Date: (aujourd'hui)
   - Montant: 100 €
4. Cliquer **Sauvegarder**

**Résultat attendu:** ✅

- Facture apparaît **immédiatement** dans la liste (de Dexie local)
- Pas d'erreur "Network request failed"
- Pas de console error

### Étape 3: Rafraîchir la page

```
Ctrl+R
```

**Résultat attendu:** ✅

- Nouvelle facture **still visible** après refresh (persistée dans Dexie)

### Étape 4: Revenir en ligne

F12 → Application → Service Workers → [ ] Offline (décocher)

**Résultat attendu:** ✅

- La facture créée offline **sync vers Firestore** automatiquement
- Vérifier dans Firestore console que la facture est présente

---

## 🧪 Test 3 — Indicateur offline (Advanced)

**À faire ultérieurement:** Ajouter un badge UI dans AppShell pour afficher :

```
📶 Mode offline - Données locales
```

```tsx
// Dans AppShell.tsx (futur)
const { isFromLocalCache } = useOfflineSync(...);

{isFromLocalCache && (
  <div className="bg-yellow-100 text-yellow-800 p-2">
    📶 Mode offline - Données du cache local
  </div>
)}
```

---

## 📊 Checklist de Status

| Aspect           | Test 1 | Test 2 | Status |
| ---------------- | ------ | ------ | ------ |
| Offline read     | ✓      | ✓      | ✅     |
| Offline write    | N/A    | ✓      | ✅     |
| Persistence      | ✓      | ✓      | ✅     |
| Auto-sync online | N/A    | ✓      | ✅     |
| No errors        | ✓      | ✓      | ✅     |

---

## 🔍 Debugging — Si ça ne marche pas

### Problème: Données vides en offline

**Diagnostic:**

1. F12 → Application → **IndexedDB** → **MicroGestionFacile**
2. Vérifier les tables Dexie (invoices, clients, products)
3. Vérifier qu'il y a des données insider

**Solution:**

- Assurez-vous d'avoir créé des données **avant** d'aller offline
- Vérifier que useOfflineSync est câblé avec `dexieTableName` correct

### Problème: Service Worker ne se déclenche pas

**Diagnostic:**

1. F12 → Application → Service Workers
2. Vérifier qu'il y a une entrée `127.0.0.1` ou `localhost`
3. Vérifier le status: **activated and running**

**Solution:**

- Relancer `npm run dev` ou `npm run preview`
- Forcer refresh : Ctrl+Shift+R (clear cache + reload)
- Vérifier vite-plugin-pwa dans vite.config.ts

### Problème: Firestore sync ne marche pas après reconnection

**Diagnostic:**

1. Créer une facture en offline
2. Revenir online
3. Attendre 2-3 secondes
4. Ouvrir Firestore console → vérifier la collection invoices

**Solution:**

- Vérifier que Firestore credentials sont corrects
- Vérifier que `userId` est bien défini dans user.uid
- Vérifier les logs DEV (F12 → Console) pour `[OfflineSync]` messages

---

## 📝 Logs à vérifier (Mode DEV)

Ouvrir F12 → Console et chercher ces logs :

```
[OfflineSync] Chargement initial de invoices depuis Dexie...
[OfflineSync] invoices synchronisé (X items)
[OfflineSync] invoices depuis cache local (offline détecté)
```

---

## ✨ Résultats Attendus (Session 2 Success)

- ✅ App fonctionne offline (données visibles)
- ✅ Créer/modifier données offline (persiste dans Dexie)
- ✅ Sync vers Firestore au reconnection
- ✅ 0 erreurs console
- ✅ Service Worker actif + indexed DB peuplée

---

## 🚀 Prochaines Étapes (Session 3)

1. **Ajouter indicateur offline UI** (badge "📶 Offline mode")
2. **Tests unitaires useOfflineSync** avec Dexie mock
3. **Phase 2 migration** → suppliers, expenses (même design)
4. **Performance monitoring** → time to interactive offline vs online

---

**🎯 Test terminé ?** Documenter les résultats et les problèmes rencontrés dans les issues GitHub !
