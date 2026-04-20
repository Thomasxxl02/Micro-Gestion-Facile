# Stratégie de Correction ESLint - 682 Problèmes Restants

**Date:** 20 avril 2026  
**État initial:** 765 problèmes (370 erreurs, 395 warnings)  
**État actuel:** 682 problèmes (287 erreurs, 395 warnings)  
**Progrès:** ✅ 83 erreurs `no-undef` éliminées (Browser API globals ajoutés)

---

## 📊 Analyse des Erreurs Restantes (287 erreurs)

### Catégorie 1: Variables/Paramètres Inutilisés (🔴 PRIORITÉ HAUTE)

**~150-180 erreurs** | `no-unused-vars`, `@typescript-eslint/no-unused-vars`

**Fichiers les plus impactés:**

- `src/store/appStore.ts` (40+ variables) - Tous les setters Zustand non utilisés
- `src/store/useDataStore.ts` (40+ variables) - Tous les setters Zustand non utilisés
- `src/hooks/useAppShellSync.ts` (20+ variables) - Collections importées non utilisées
- `src/hooks/useInvoiceActions.ts` (20+ variables) - Handlers destructurés non utilisés
- `src/components/InvoiceManager.tsx` (6+ variables)
- `src/components/SettingsManager.tsx` (8+ variables)

**Solution recommandée:**

```typescript
// ❌ Avant
const { invoice, id } = useEntity();

// ✅ Après - Préfixer avec underscore
const { invoice: _invoice, id: _id } = useEntity();

// OU - Ne pas destructurer si non utilisé
const entity = useEntity();
```

**Action:** Script de remplacement automatique pour préfixer avec `_`

---

### Catégorie 2: Types `any` Explicites (🔴 PRIORITÉ HAUTE)

**~15 erreurs** | `@typescript-eslint/no-explicit-any`

**Fichiers impactés:**

- `src/services/geminiService.ts` (1)
- `src/lib/logger.ts` (3)
- `src/lib/serviceWorkerManager.ts` (1)
- `src/store/useLogStore.ts` (1)
- `src/types/user.ts` (2)
- `src/firebase.ts` (0)
- `src/hooks/useGitHubAuth.ts` (1)

**Solution recommandée:**

```typescript
// ❌ Avant
function process(data: any) { }
metadata?: Record<string, any>

// ✅ Après
function process(data: unknown) { }
metadata?: Record<string, unknown>
// OU si structure connue:
metadata?: Record<string, string | number | boolean>
```

**Action:** Remplacement manuel avec types appropriés

---

### Catégorie 3: console.log Interdits (🟡 PRIORITÉ MOYENNE)

**~10 erreurs** | `no-console`

**Fichiers impactés:**

- `src/firebase.ts` (5)
- `src/hooks/useInvoiceActions.ts` (2)
- `src/hooks/useOfflineSync.ts` (4)
- `src/services/securityService.ts` (1)

**Solution recommandée:**

```typescript
// ❌ Avant
console.log("User logged in:", user);

// ✅ Après
console.warn("User logged in:", user); // Pour debug/info
console.error("Connection failed:", error); // Pour erreurs
```

**Action:** Remplacement automatique avec regex

---

### Catégorie 4: Variables Assignées Non Utilisées (🟡 PRIORITÉ MOYENNE)

**~10 erreurs** | `no-unused-vars` (assigned but never used)

**Exemples:**

- `src/lib/facturX.ts:215` - `secondaryColor` calculé mais non utilisé
- `src/lib/rateLimiter.ts:168` - `_latency` stocké mais non utilisé
- `src/services/authService.ts:225` - `_uid`, `_createdAt` extraits mais non utilisés
- `src/components/SettingsManager.tsx:424` - `_setLastBackupDate` destructuré mais non utilisé

**Solution:** Vérifier si vraiment inutile ou si c'est un bug (variable oubliée)

---

### Catégorie 5: Enums Non Utilisés (🟢 PRIORITÉ BASSE)

**~15 erreurs** | `no-unused-vars`

**Fichier:** `src/types/invoice.ts` (11 exports)

```typescript
export const {
  DRAFT, // ❌ Non utilisé
  SENT, // ❌ Non utilisé
  // ... autres
} = InvoiceStatus;
```

**Solution:** Supprimer les exports inutilisés OU garder pour l'API publique

---

### Catégorie 6: Autres Erreurs Critiques (🔴 PRIORITÉ HAUTE)

**~10 erreurs**

- `src/components/InvoicePaper.tsx:169` - `!=` au lieu de `!==` (`eqeqeq`)
- `src/services/SireneService.ts:75` - Erreur capturée sans `cause` (`preserve-caught-error`)
- `src/db/migrations/types.ts:56` - `db` paramètre non utilisé dans callback
- `src/lib/zod-schemas.ts:13` - `value` paramètre de validation non utilisé

**Action:** Corrections manuelles ciblées

---

## 📊 Analyse des Warnings (395 warnings)

### Warning 1: Nullish Coalescing (🟢 PRIORITÉ BASSE - 200+ warnings)

`@typescript-eslint/prefer-nullish-coalescing` - Préférer `??` à `||`

**Approche:** Correction automatique possible mais nécessite validation (changement sémantique)

```typescript
// ❌ Avant
const value = input || "default"; // Faux si input = 0, "", false

// ✅ Après
const value = input ?? "default"; // Faux seulement si input = null/undefined
```

**Risque:** Peut changer le comportement si des valeurs falsy (0, "", false) sont légitimes

---

### Warning 2: Promises Mal Utilisées (🟡 PRIORITÉ MOYENNE - 30+ warnings)

`@typescript-eslint/no-misused-promises`, `@typescript-eslint/no-floating-promises`

**Fichiers impactés:**

- Event handlers React (onClick, onSubmit, etc.)
- useEffect cleanup functions
- setTimeout/setInterval callbacks

**Solution:**

```typescript
// ❌ Avant
<button onClick={async () => await handleSave()}>

// ✅ Après
<button onClick={() => { void handleSave(); }}>
// OU
<button onClick={() => handleSave().catch(console.error)}>
```

---

### Warning 3: Complexité Cyclomatique (🟢 PRIORITÉ BASSE - 15+ warnings)

`complexity` - Fonctions > 15 branches

**Fichiers impactés (complexity > 15):**

- `src/components/SettingsManager.tsx:272` → **111** (🚨 EXTRÊME!)
- `src/components/ProductManager.tsx:39` → 20
- `src/components/InvoiceManager.tsx:425` → 23
- `src/hooks/useViewRouter.tsx:121` → 20
- `src/lib/facturX.ts:204` → 22

**Solution:** Refactoring pour extraire des sous-fonctions (tâche longue)

---

### Warning 4: Ternaires Imbriqués (🟢 PRIORITÉ BASSE - 10+ warnings)

`no-nested-ternary`

**Solution:** Remplacer par if/else ou fonctions utilitaires

```typescript
// ❌ Avant
const label = isPaid
  ? "Payé"
  : isDraft
    ? "Brouillon"
    : isSent
      ? "Envoyé"
      : "Autre";

// ✅ Après
function getInvoiceLabel(invoice: Invoice): string {
  if (invoice.isPaid) return "Payé";
  if (invoice.isDraft) return "Brouillon";
  if (invoice.isSent) return "Envoyé";
  return "Autre";
}
```

---

## 🎯 Plan d'Action (4 Phases)

### Phase 1: Quick Wins - Config & Globals ✅ TERMINÉE

- [x] Ajouter Browser API globals → **-83 erreurs**
- **Durée:** 5 minutes
- **Impact:** 83 erreurs éliminées

---

### Phase 2: Automated Fixes (🔴 HIGH PRIORITY - 2h)

#### 2.1 Préfixer Variables Inutilisées (~150 erreurs)

**Script automatique possible** pour stocker les variables inutilisées avec `_`

```bash
# Commande pour identifier toutes les variables inutilisées
npm run lint 2>&1 | Select-String -Pattern "is defined but never used"
```

**Fichiers prioritaires:**

1. `src/store/appStore.ts` - Nettoyer les setters Zustand
2. `src/store/useDataStore.ts` - Nettoyer les setters Zustand
3. `src/hooks/useAppShellSync.ts` - Supprimer imports inutilisés
4. `src/hooks/useInvoiceActions.ts` - Préfixer destructurations

**Approche:**

- Stores Zustand: Enlever les destructurations inutilisées (les setters ne sont jamais utilisés directement)
- Hooks: Préfixer avec `_` les variables destructurées non utilisées
- Components: Vérifier si vraiment inutiles ou si c'est un bug

**Tool suggestion:** Utiliser un script Node.js pour automatiser

---

#### 2.2 Remplacer console.log (10 erreurs)

```bash
# Identifier tous les console.log
rg "console\.log\(" --type ts --type tsx
```

**Règle:**

- Debug/Info → `console.warn`
- Erreurs → `console.error`
- Supprimer si dev-only

---

#### 2.3 Corriger eqeqeq (1 erreur)

`src/components/InvoicePaper.tsx:169` - Remplacer `!=` par `!==`

---

### Phase 3: Manual Type Fixes (🔴 HIGH PRIORITY - 1.5h)

#### 3.1 Remplacer `any` par types appropriés (15 erreurs)

**Fichiers à traiter:**

1. `src/services/geminiService.ts:7` - Typer les options API
2. `src/lib/logger.ts:234-236` - Typer les paramètres de log
3. `src/lib/serviceWorkerManager.ts:137` - Typer les messages SW
4. `src/store/useLogStore.ts:11` - Typer les metadata
5. `src/types/user.ts:44,93` - Typer les propriétés utilisateur
6. `src/hooks/useGitHubAuth.ts:93` - Typer la réponse API

**Pattern recommandé:**

```typescript
// Utiliser 'unknown' par défaut, puis type guard
function process(data: unknown) {
  if (isValidData(data)) {
    // data is ValidData ici
  }
}

// OU Record avec types unions
metadata?: Record<string, string | number | boolean | null>
```

---

### Phase 4: Code Quality Improvements (🟡 MEDIUM - 4h+)

#### 4.1 Promises Mal Utilisées (30 warnings)

- Wrapper les async handlers React avec `void` ou `.catch()`
- Ajouter `.catch()` sur les floating promises
- Marquer explicitement avec `void` les promises ignorées

#### 4.2 Nullish Coalescing (200+ warnings) - OPTIONNEL

⚠️ **Attention:** Changement sémantique potentiel

**Approche sécurisée:**

1. Identifier les cas sûrs (jamais de valeurs falsy légitimes)
2. Remplacer progressivement avec tests
3. Valider avec tests unitaires

**Cas sûrs:**

```typescript
// Toujours safe si on sait que falsy values ne sont pas légitimes
const name = user.name ?? "Anonyme"; // Safe car "" n'est pas un nom valide
```

**Cas risqués:**

```typescript
// Risqué si 0 est une valeur légitime
const quantity = item.quantity ?? 1; // ⚠️ Si quantity = 0, devient 1 !
```

#### 4.3 Nested Ternaries (10 warnings)

Refactorer avec fonctions nommées pour lisibilité

#### 4.4 Complexity (15+ warnings) - OPTIONNEL

Necesssite refactoring profond - Report à une sprint dédiée

---

## 📋 Checklist Exécution

### Étape 1: Phase 2 - Automated Fixes ✅

- [ ] Nettoyer `src/store/appStore.ts` - Supprimer setters inutilisés
- [ ] Nettoyer `src/store/useDataStore.ts` - Supprimer setters inutilisés
- [ ] Préfixer variables dans `src/hooks/useAppShellSync.ts`
- [ ] Préfixer variables dans `src/hooks/useInvoiceActions.ts`
- [ ] Remplacer console.log → console.warn/error (10 fichiers)
- [ ] Fix `src/components/InvoicePaper.tsx:169` - `!=` → `!==`

**Résultat attendu:** ~150-160 erreurs éliminées → **682 → ~520 problèmes**

---

### Étape 2: Phase 3 - Type Fixes

- [ ] Typer `src/services/geminiService.ts`
- [ ] Typer `src/lib/logger.ts`
- [ ] Typer `src/lib/serviceWorkerManager.ts`
- [ ] Typer `src/store/useLogStore.ts`
- [ ] Typer `src/types/user.ts`
- [ ] Typer `src/hooks/useGitHubAuth.ts`

**Résultat attendu:** ~15 erreurs éliminées → **~520 → ~505 problèmes**

---

### Étape 3: Phase 4 - Quality (Optionnel)

- [ ] Fix promises handlers (30 warnings)
- [ ] Fix nullish coalescing (200 warnings) - SI SAFE
- [ ] Refactor nested ternaries (10 warnings)

**Résultat attendu:** ~240+ warnings éliminées → **~505 → ~265 problèmes**

---

## 🎯 Objectifs par Priorité

| Priorité       | Objectif                               | Problèmes Restants           | Effort |
| -------------- | -------------------------------------- | ---------------------------- | ------ |
| 🔴 **HIGH**    | Éliminer toutes les erreurs critiques  | ~120 problèmes (errors only) | 3.5h   |
| 🟡 **MEDIUM**  | Réduire à <200 problèmes               | <200 problèmes               | +2h    |
| 🟢 **LOW**     | Atteindre <100 problèmes (code propre) | <100 problèmes               | +4h    |
| ⭐ **PERFECT** | 0 problème (perfectionniste)           | 0 problèmes                  | +10h   |

---

## 🛠️ Scripts Utiles

### Analyser les erreurs par type

```powershell
# Compter les erreurs par règle
npm run lint 2>&1 | Select-String -Pattern "error.*(@typescript-eslint|no-)" |
  ForEach-Object { ($_ -split "error  ")[1] } | Group-Object | Sort-Object Count -Descending

# Lister tous les fichiers avec erreurs
npm run lint 2>&1 | Select-String -Pattern "\.tsx?:" |
  ForEach-Object { ($_ -split ":")[0] } | Sort-Object -Unique

# Compter erreurs par fichier
npm run lint 2>&1 | Select-String -Pattern "error" |
  ForEach-Object { ($_ -split ":")[0] } | Group-Object | Sort-Object Count -Descending
```

### Fix automatique ESLint (certaines règles)

```bash
npm run lint:fix
```

---

## 📌 Recommandations Finales

1. **Commencer par Phase 2** (variables inutilisées + console.log) - Impact immédiat, faible risque
2. **Continuer avec Phase 3** (types any) - Améliore la type-safety
3. **Phase 4 optionnelle** - Qualité code mais effort élevé pour impact modéré
4. **Ne PAS forcer à 0 problème** - Certains warnings sont légitimes (complexity nécessite refactor profond)
5. **Objectif réaliste:** **<150 problèmes** en 3.5h de travail focalisé

**Prochain fichier à créer:** `ESLINT_FIX_SCRIPTS.md` avec scripts automatisés
