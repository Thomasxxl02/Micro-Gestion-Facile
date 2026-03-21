# 📊 Analyse Complète de la Couverture de Tests - Micro-Gestion-Facile
**Date:** 21 mars 2026 | **Analyse:** Thorough Coverage Assessment

---

## 🎯 Résumé Exécutif

**État général:**
- ✅ **11 fichiers de test** existants
- ❌ **11 modules importants SANS tests**
- 📊 **Couverture estimée:** ~25-30% du codebase
- ⚠️ **Zones critiques non testées:** Exports PDF, IndexedDB, Hooks réactifs, Composants complexes

### Statut par Catégorie

| Catégorie | Testée | Non-Testée | Couverture |
|-----------|--------|-----------|-----------|
| **Calculs (Fiscal/Invoice)** | ✅ 2/2 | ❌ 0/2 | 100% |
| **Store & État** | ✅ 1/1 | ❌ 0/1 | 100% |
| **Services** | ✅ 1/1 | ❌ 0/1 | 100% |
| **Composants UI** | ✅ 6/16 | ❌ 10/16 | **37.5%** |
| **Hooks Custom** | ❌ 0/2 | ✅ 2/2 | **0%** |
| **Base de Données** | ❌ 0/1 | ✅ 1/1 | **0%** |
| **Utilitaires Lib** | ✅ 2/5 | ❌ 3/5 | **40%** |

---

## 📝 FICHIERS DE TEST DÉTAILLÉS

### 1️⃣ **example.test.tsx** ⚠️ EXEMPLES SEULEMENT

**Localisation:** `__tests__/example.test.tsx`  
**Type:** Exemples/Templates  
**Status:** ❌ INUTILE - À SUPPRIMER

#### Analyse:
```
✅ TESTS PRÉSENTS:
  - Button Component (simple mock)
  - calculateSum (3 cas basiques)

❌ PROBLÈMES:
  - N'EST PAS UN VRAI TEST du projet
  - Code en dur (pas d'imports réels)
  - Ne valide RIEN du domaine métier
  - Crée de l'espace mental fumeux
```

#### Recommandation:
🗑️ **SUPPRIMER** - Remplacer par des tests réels du domaine

---

### 2️⃣ **appStore.test.ts** ✅ BON

**Localisation:** `__tests__/appStore.test.ts`  
**Fichier source:** `store/appStore.ts`  
**Type:** Tests d'état global (Zustand)  
**Status:** ✅ COMPLET

#### Couverture:
```
✅ POINTS TESTÉS:
  [✅] État initial correct
  [✅] setCurrentView (changement de vue)
  [✅] setIsDarkMode (mode sombre)
  [✅] setInvoices + updateInvoices
  [✅] Logs d'activité (addLog, clearLogs)
  [✅] Réinitialisation (reset)
  [✅] Tous les setters CRUD (clients, suppliers, products, expenses, emails, templates, calendar)
  [✅] setUser + setIsAuthReady (auth)
  [✅] setIsMobileMenuOpen (UI)
```

#### Points Forts:
- ✅ Couverture exhaustive des actions
- ✅ Test du cycle complet (add → update → clear)
- ✅ Mock profile correct (`beforeEach`)

#### Points Faibles:
```
⚠️ LIMITATIONS:
  - Pas de test des mutations simultanées (race conditions)
  - Pas de test de persistence entre sessions
  - Pas de validation des types d'erreur
  - Mock trop simpliste (pas de données réalistes)
```

#### Score: **8/10**

---

### 3️⃣ **fiscalCalculations.test.ts** ✅ BON

**Localisation:** `__tests__/fiscalCalculations.test.ts`  
**Fichier source:** `lib/fiscalCalculations.ts`  
**Type:** Tests de logique métier (calculs fiscaux)  
**Status:** ✅ CORRECT

#### Couverture:
```
✅ POINTS TESTÉS:
  [✅] calculateSocialContributions
    └─ SERVICE_BNC (taux standard)
    └─ SALE (taux standard)
    └─ SERVICE_BIC (taux standard)
    └─ ACRE (taux réduit pour bénéficiaires)
    └─ Fallback SERVICE_BNC (default)
  
  [✅] calculateIncomeTaxPFL (pour 3 types d'activité)
  
  [✅] getThresholds (seuils micro et TVA)
  
  [✅] calculateThresholdStatus
    └─ Dépassement seuil micro
    └─ Revenu faible
    └─ Proximité seuil TVA
    └─ Revenu ÉGAL au seuil (cas limite)
    └─ Revenu dans zone de tolérance
```

#### Points Forts:
- ✅ Cas limites bien couverts (==, <, >)
- ✅ Tous les types d'activité testés
- ✅ ACRE vs normal documenté
- ✅ Seuils validés (micro, TVA, tolérance)

#### Points Faibles:
```
⚠️ LIMITATIONS:
  - Pas de test avec montants DÉCIMALES complexes (ex: 1234.567)
  - Pas de test des arrondis comptables français
  - Pas de validation contre les seuils 2025/2026 en production
  - Pas de test des cas d'erreur (entrées invalides)
  - Pas de documentation des références légales (URSSAF, Code des impôts)
```

#### Score: **7.5/10**

---

### 4️⃣ **invoiceCalculations.test.tsx** ✅ EXCELLENT

**Localisation:** `__tests__/invoiceCalculations.test.tsx`  
**Fichier source:** `lib/invoiceCalculations.ts`  
**Type:** Tests de calculs de factures (domaine critique)  
**Status:** ✅ TRÈS COMPLET

#### Couverture Détaillée:
```
✅ TESTS MASSIFS (500+ lignes):
  
  [✅] calculateInvoiceTax
    └─ TVA taux normal 20%
    └─ TVA taux réduit 5.5%
    └─ TVA taux super-réduit 2.1%
    └─ TVA exonérée 0%
    └─ Entrées Decimal
    └─ Entrées string
    └─ Arrondis à 2 décimales
    └─ VALIDATION: montants négatifs ❌
    └─ VALIDATION: taux invalides ❌
    └─ VALIDATION: montant 0
  
  [✅] calculateHTFromTTC (fonction inverse)
    └─ Réciprocité avec calculateInvoiceTax
    └─ Tous les taux TVA
    └─ Décimales complexes
    └─ VALIDATION: montants négatifs
  
  [✅] calculateMicroEntrepreneurCharges (SERVICES vs SALES)
    └─ Calcul des charges (cotisations sociales + impôt)
    └─ Taux spécifiques (23.2% SERVICES, 12.3% SALES)
    └─ Seuils de franchise micro-entreprise
    └─ Revenu net calculé correctement
```

#### Points Forts:
- ✅ **Précision critique** - Decimal.js utilisé partout
- ✅ Tests inverses (TTC ↔ HT)
- ✅ Validation d'entrées exhaustive
- ✅ Types bien vérifiés (Decimal)
- ✅ Cas limites (montant 0)

#### Points Faibles:
```
⚠️ LIMITATIONS:
  - Pas de test des remises (applyDiscount, applyFixedDiscount)
  - Pas de test de calculateFullInvoice (agrégation)
  - Pas de test de formatCurrency
  - Pas de test de isWithinMicroThreshold
  - Pas de test avec vraies données d'invoice (items multiples)
  - Pas de test des MICRO_THRESHOLDS constants
```

#### Score: **8.5/10**

---

### 5️⃣ **geminiService.test.ts** ⚠️ FAIBLE

**Localisation:** `__tests__/geminiService.test.ts`  
**Fichier source:** `services/geminiService.ts`  
**Type:** Tests d'API IA (Gemini Google)  
**Status:** ⚠️ TESTS FRAGILES

#### Couverture:
```
✅ TESTS EXISTANTS (mais peu fiables):
  [✅] generateAssistantResponse
  [✅] suggestInvoiceDescription
  [✅] generateInvoiceItemsFromPrompt
  [✅] draftEmail
  [✅] analyzeReceipt
  [✅] predictRevenue
  [✅] checkInvoiceCompliance
  [✅] predictCashflowJ30
  [⚠️] Gestion d'erreurs (mock dans MSW)
```

#### Points Faibles:
```
❌ PROBLÈMES MAJEURS:
  
  1. MOCKS OBSOLÈTES:
     - Utilise MSW (Mock Service Worker) anciennement
     - Commentaire: "Le code de draftEmail fait JSON.parse(text)"
     - Pas clair si les mocks sont actualisés
  
  2. ENREGISTREMENT FRAGILE:
     - Renvoie des tableaux parfois ([obj] vs obj)
     - Tests adaptent: "const result = Array.isArray(email) ? email[0] : email"
     - ❌ Instabilité API mal géométrée
  
  3. MANQUE DE CONTEXTE:
     - Pas de test avec VRAIES données d'invoice/receipt
     - Pas de test avec VRAIS prompts utilisateur
     - Pas d'assertion sur la qualité de la réponse
     - Juste vérifie "il retourne quelque chose"
  
  4. GESTION ERREUR SIMPLISTE:
     - Mock retourne des valeurs par défaut vides
     - Pas de test des timeouts API
     - Pas de retry logic
     - Pas de test de clé API manquante (GEMINI_API_KEY)
```

#### Score: **4/10**

---

### 6️⃣ **FormFields.test.tsx** ✅ ADEQUAT

**Localisation:** `__tests__/FormFields.test.tsx`  
**Fichier source:** `components/FormFields.tsx`  
**Type:** Tests d'un composant de formulaire élémentaire  
**Status:** ✅ BASIQUE MAIS CORRECT

#### Couverture:
```
✅ TESTS:
  [✅] Render label + value
  [✅] onChange callback
  [✅] Affichage erreur + aria-invalid
  [✅] Affichage astérisque requis + aria-required
```

#### Points Forts:
- ✅ A11y (accessibility) vérifiée (aria-*)
- ✅ Interactions utilisateur (fireEvent)

#### Points Faibles:
```
⚠️ LIMITATIONS:
  - Très basique - juste le composant FormField
  - Pas de test des variantes (type="email", "tel", "number")
  - Pas de test des validations inline
  - Pas de test du focus/blur
  - Pas de test du placeholder
```

#### Score: **6/10**

---

### 7️⃣ **EntityFormFields.test.tsx** ✅ ADEQUAT

**Localisation:** `__tests__/EntityFormFields.test.tsx`  
**Fichier source:** `components/EntityFormFields.tsx`  
**Type:** Tests des champs de formulaire d'entité (adresses, contacts)  
**Status:** ✅ PARTIEL

#### Couverture:
```
✅ TESTS:
  [✅] AddressFields
    └─ Changements adresse, code postal, ville
    └─ Changement pays
    └─ Affichage erreurs simultanées
  
  [✅] ContactFields
    └─ Changements nom, email, téléphone
    └─ Affichage erreurs
```

#### Points Faibles:
```
⚠️ LIMITATIONS:
  - Pas complet (exemple: tronqué à "emailError='Err Email'")
  - Pas de test des validations (format email, code postal)
  - Pas de test du sélecteur pays (liste complète)
  - Pas de test de la localisation (FR vs BE vs CH)
  - Pas de test des erreurs de validation côté formulaire
```

#### Score: **6.5/10**

---

### 8️⃣ **FormFields_extra.test.tsx** ✅ ADEQUAT

**Localisation:** `__tests__/FormFields_extra.test.tsx`  
**Fichier source:** `components/FormFields.tsx`  
**Type:** Tests des composants formulaire avancés (TextArea, Select, Toggle)  
**Status:** ✅ BASIQUE

#### Couverture:
```
✅ TESTS:
  [✅] TextAreaField
    └─ Render label + value
    └─ onChange
    └─ Description + erreur
  
  [✅] SelectField
    └─ Options rendues
    └─ onChange
  
  [✅] ToggleSwitch
    └─ Change d'état au clic
```

#### Points Faibles:
```
⚠️ LIMITATIONS:
  - Pas de test de disabled state
  - Pas de test du keyboard (Enter, Tab)
  - Pas de test des options multisélection
  - Pas de test de focus management
  - TextArea: pas de test du resize, du maxLength, du placeholder
```

#### Score: **5.5/10**

---

### 9️⃣ **AIAssistant.test.tsx** ⚠️ FRAGILE

**Localisation:** `__tests__/AIAssistant.test.tsx`  
**Fichier source:** `components/AIAssistant.tsx`  
**Type:** Tests du composant assistant IA  
**Status:** ⚠️ MOCKS TROP SIMPLES

#### Couverture:
```
✅ TESTS:
  [✅] Rendu du message de bienvenue
  [✅] Envoi de message + réponse affichée
  [✅] Affichage titre prédiction (via getAllByText)
```

#### Points Faibles:
```
❌ PROBLÈMES:
  
  1. MOCKS TRIVIAUX:
     - generateAssistantResponse retourne "Réponse simulée"
     - checkInvoiceCompliance retourne hardcoded { isCompliant: true }
     - predictCashflowJ30 retourne { predictedBalance: 5000, ... }
     - ❌ Ne teste PAS le vrai composant
  
  2. LOGIQUE NON TESTÉE:
     - Pas de test du formulaire d'entrée
     - Pas de test de la liste de messages
     - Pas de test du scroll auto
     - Pas de test des erreurs API
     - Pas de test du loading state
     - Pas de test du clearing de chat
  
  3. INTERACTIONS MANQUANTES:
     - Pas de test du clic sur "Prédiction"
     - Pas de test des onglets (si plusieurs)
     - Pas de test du responsive
```

#### Score: **3.5/10**

---

### 🔟 **Dashboard.test.tsx** ⚠️ STRUCTURE SEULEMENT

**Localisation:** `__tests__/Dashboard.test.tsx`  
**Fichier source:** `components/Dashboard.tsx`  
**Type:** Tests du composant tableau de bord principal  
**Status:** ⚠️ TOUS LES MOCKS, AUCUN TEST RÉEL

#### Couverture:
```
✅ FICHIER LU:
  [✅] Mocks massifs de Recharts, Lucide, framer-motion, dnd-kit
  [✅] Mock `mockProps` avec invoices, products, expenses

❌ TESTS RÉELS:
  ❌ AUCUN describe() / it() trouvé après les mocks
  ❌ Le fichier s'arrête après mockProps
```

#### Points Faibles:
```
❌ CRITIQUE:
  - Fichier INCOMPLET ou VIDE de tests
  - Que des mocks, pas d'assertions
  - Doit avoir au moins 10-15 tests pour un Dashboard :
    └─ Affichage des KPIs (revenue total, paid/pending)
    └─ Affichage des charts (area chart, pie chart)
    └─ Affichage des cartes de synthèse
    └─ Responsive des chiffres
    └─ Dark mode styling
    └─ Drag-and-drop des widgets
    └─ Navigation vers les managers
```

#### Score: **0.5/10** ❌

---

### 1️⃣1️⃣ **Sidebar.test.tsx** ✅ CORRECT

**Localisation:** `__tests__/Sidebar.test.tsx`  
**Fichier source:** `components/Sidebar.tsx`  
**Type:** Tests du menu latéral  
**Status:** ✅ BON

#### Couverture:
```
✅ TESTS:
  [✅] Affichage tous éléments menu (10 items)
  [✅] setView appelé au clic
  [✅] État actif (aria-current="page")
  [✅] Mobile: fermeture menu au clic overlay
```

#### Points Forts:
- ✅ A11y vérifié (aria-current)
- ✅ Interactions claires
- ✅ Responsive mobile testé

#### Points Faibles:
```
⚠️ LIMITATIONS:
  - Pas de test du collapse/expand
  - Pas de test du dark mode toggle
  - Pas de test du comportement keyboard (Escape)
  - Pas de test des icônes des menus
  - Pas de test du scrolling (si beaucoup de menus)
  - Pas de test de l'ordre des items
```

#### Score: **7/10**

---

## 📋 MODULES SANS TESTS (11 fichiers ❌)

### ❌ COMPOSANTS NON TESTÉS (10 fichiers)

| Component | Complexité | Priorité | Raison |
|-----------|-----------|----------|--------|
| **AccountingManager.tsx** | 🔴 Très Haute | 🔴 CRITIQUE | Gestion comptabilité complète - UI+logique |
| **CalendarManager.tsx** | 🟡 Moyenne | 🟡 Haute | Gestion agenda - interactions calendrier |
| **ClientManager.tsx** | 🟡 Moyenne | 🔴 CRITIQUE | Gestion clients - CRUD principal |
| **EmailManager.tsx** | 🟡 Moyenne | 🟡 Haute | Gestion emails - triggers, templates |
| **InvoiceManager.tsx** | 🔴 Très Haute | 🔴 CRITIQUE | Domaine core - création/édition factures |
| **ProductManager.tsx** | 🟡 Moyenne | 🟡 Moyenne | Catalogue produits - CRUD |
| **SettingsManager.tsx** | 🟡 Moyenne | 🟡 Moyenne | Configuration utilisateur |
| **SupplierManager.tsx** | 🟡 Moyenne | 🟡 Haute | Gestion fournisseurs - CRUD |
| **Dialogs.tsx** | 🟢 Basse | 🟢 Basse | Composants au-dessus - intégration |
| **EntityModal.tsx** | 🟡 Moyenne | 🟡 Moyenne | Modal générique d'entité |
| **ExportModal.tsx** | 🟡 Moyenne | 🔴 CRITIQUE | Export données - conformité fiscal |

### ❌ LIBRAIRIES CRITIQUES NON TESTÉES (3 fichiers)

| Module | Type | Complexité | Raison | Impact |
|--------|------|-----------|--------|--------|
| **exportUtils.ts** | Lib Export | 🔴 Haute | CSV/JSON + Decimal | RGPD + Export PDF |
| **facturX.ts** | Lib PDF | 🔴 Très Haute | XML Factur-X + PDF | Conformité 2026 |
| **useExportData.ts** | Hook | 🟡 Moyenne | Logique d'export custom | Intégration |

### ❌ HOOKS RÉACTIFS NON TESTÉS (2 fichiers)

| Hook | Complexité | Raison | Impact |
|------|-----------|--------|--------|
| **useEntity.ts** | 🟡 Moyenne | Gestion form + filtres | Tous les managers |
| **useFirestoreSync.ts** | 🔴 Haute | Sync Firestore + local | Auth + données |

### ❌ BASE DE DONNÉES NON TESTÉE (1 fichier)

| Module | Complexité | Raison | Impact |
|--------|-----------|--------|--------|
| **invoiceDB.ts** (Dexie) | 🔴 Très Haute | IndexedDB, migrations | Persistence offline |

---

## 🚨 DOMAINES CRITIQUES NON COUVERTS (GAP ANALYSIS)

### 1. 🔴 **EXPORTS PDF/FACTUR-X** - ZÉRO TEST

**Fichiers concernés:**
- `lib/facturX.ts` → Génération XML Factur-X
- `lib/exportUtils.ts` → Export JSON/CSV
- `components/ExportModal.tsx` → UI d'export

**Risques:**
```
❌ Conformité 2026 - Factur-X OBLIGATOIRE en France
❌ Structure XML mal formée (pas validée)
❌ Données Decimal mal sérialisées
❌ Encodage UTF-8 problématique
❌ Noms de fichiers non sécurisés
```

**Tests manquants:**
```
- generateFacturX_XML() avec vraies données
- XML valide par le schéma officiel
- Métadonnées de facture complètes
- Sérialisation Decimal.js
- Encodage accents français
- Taille fichier raisonnable
```

**Sévérité:** 🔴 **CRITIQUE**

---

### 2. 🔴 **BASE DE DONNÉES IndexedDB** - ZÉRO TEST

**Fichier concerné:** `db/invoiceDB.ts`

**Risques:**
```
❌ Corruption de données locale
❌ Migrations de schéma non validées
❌ Migrations échouées en production
❌ Données orphelines (invoices sans items)
❌ Indexation défaillante
❌ Transactions échouées (concurrency)
```

**Tests manquants:**
- CRUD complet (invoices, items, clients, etc.)
- Migrations (v1 → v2 future)
- Transactions multi-tables
- Relationship integrity (invoiceId référencé)
- Clearing/Reset
- Performance (1000+ records)

**Sévérité:** 🔴 **CRITIQUE**

---

### 3. 🟡 **GESTION OFFLINE & SYNC FIRESTORE** - ZÉRO TEST

**Fichier concerné:** `hooks/useFirestoreSync.ts`

**Risques:**
```
⚠️ Sync offline → online non validée
⚠️ Conflits de données en cas de modification offline+online
⚠️ Queue de synchronisation perdue
⚠️ Authentification expirée non gérée
```

**Tests manquants:**
- Mode offline/online
- Queue de sync
- Gestion erreur réachabilité
- Auth refresh token
- Conflict resolution

**Sévérité:** 🟡 **HAUTE**

---

### 4. 🟡 **COMPOSANTS MANAGERS** - ZÉRO TEST

**Fichiers concernés:**
```
- components/InvoiceManager.tsx (CORE)
- components/ClientManager.tsx (CORE)
- components/SupplierManager.tsx
- components/ProductManager.tsx
- components/AccountingManager.tsx
- components/EmailManager.tsx
- components/CalendarManager.tsx
```

**Risques:**
```
⚠️ Workflow CRUD cassé (création facture)
⚠️ Actions batch non testées
⚠️ Filtpage/tri non validé
⚠️ Modal d'édition buggée
⚠️ Navigation vers détails
⚠️ Suppression/archivage comportement étrange
```

**Cas de test manquants (par manager):**
```
[✅] Affichage liste
[❌] Création entité (ouvrir modal + remplir + save)
[❌] Édition entité (open edit mode)
[❌] Suppression entité (confirm + action)
[❌] Recherche/filtrage
[❌] Pagination (si applicable)
[❌] Tri
[❌] Bulk actions
[❌] Export liste
```

**Sévérité:** 🟡 → 🔴 (InvoiceManager: CRITIQUE)

---

### 5. 🟡 **CALCULS COMPLETS D'INVOICE** - PARTIELLEMENT TESTÉ

**Fichier:** `lib/invoiceCalculations.ts`

**Couverture actuelle:** ~60%

**Tests manquants:**
```
❌ applyDiscount(invoice, discountRate)
❌ applyFixedDiscount(invoice, fixedAmount)
❌ calculateFullInvoice(invoice) - agrégation complète
❌ calculateFullInvoiceTotals() - totaux multiples
❌ formatCurrency(amount, currency)
❌ isWithinMicroThreshold(revenue, type)
```

**Impact:** Factures incomplet sans ces fonctions

**Sévérité:** 🟡 **MOYEN-HAUTE**

---

### 6. 🟢 **RESPONSIVE DESIGN & A11Y** - ZÉRO TEST

**Aucun test pour:**
```
❌ Media queries (tablet, mobile)
❌ ARIA labels (sauf quelques composants)
❌ Keyboard navigation (Tab, Enter, Escape)
❌ Screen reader compatibility
❌ Color contrast (WCAG 2.1)
❌ Touch interactions (dnd-kit drag-drop)
```

**Sévérité:** 🟢 **MOYEN** (non-bloquant mais recommandé)

---

## 📊 TABLEAU DE SYNTHÈSE

### Fichiers de Test par Score

```
Score   | Fichier                      | Status
--------|------------------------------|----------
9/10    | invoiceCalculations.test.tsx | ✅ EXCELLENT
8.5/10  | (même fichier, plus long)    |
8/10    | appStore.test.ts             | ✅ BON
7.5/10  | fiscalCalculations.test.ts   | ✅ BON
7/10    | Sidebar.test.tsx             | ✅ CORRECT
6.5/10  | EntityFormFields.test.tsx    | ⚠️ ADEQUAT
6/10    | FormFields.test.tsx          | ⚠️ ADEQUAT
5.5/10  | FormFields_extra.test.tsx    | ⚠️ FAIBLE
4/10    | geminiService.test.ts        | ⚠️ FRAGILE
3.5/10  | AIAssistant.test.tsx         | ❌ FRAGILE
0.5/10  | Dashboard.test.tsx           | ❌ VIDE
0/10    | example.test.tsx             | 🗑️ À SUPPRIMER
```

### Coverage par Type

```
Type                    | Coverage | Files
------------------------|----------|-------
Calculs (fiscal/invoice)| ✅ 90%   | 2/2
Store & État            | ✅ 100%  | 1/1
Services (IA)           | ⚠️ 40%   | 1/1
Composants Formulaire   | ⚠️ 50%   | 5/5
Composants Managers     | ❌ 0%    | 0/11
Hooks Custom            | ❌ 0%    | 0/2
Base de Données         | ❌ 0%    | 0/1
Lib d'Export            | ❌ 0%    | 0/3
```

---

## 🎯 RECOMMANDATIONS PRIORITAIRES

### Phase 1: CRITIQUE (2-3 jours)

1. **✅ Tests IndexedDB** (`db/invoiceDB.ts`)
   ```
   - CRUD complet avec Dexie
   - Transactions multi-tables
   - Migrations v1→v2
   - Performance 1000+ records
   ```

2. **✅ Tests Factur-X/Export** (`lib/facturX.ts`, `lib/exportUtils.ts`)
   ```
   - Génération XML valide
   - Sérialisation Decimal.js
   - Export JSON/CSV formaté
   - Conformité 2026
   ```

3. **✅ Tests InvoiceManager & ClientManager** (composants core)
   ```
   - Workflow CRUD complet
   - Intégration BD locale
   - Validation avant save
   ```

### Phase 2: HAUTE (3-5 jours)

4. **✅ Tests Calculs Complets** (fonctions manquantes dans `invoiceCalculations`)
   ```
   - applyDiscount, applyFixedDiscount
   - calculateFullInvoice (agrégation)
   - formatCurrency
   ```

5. **✅ Tests useFirestoreSync** (hook critique offline)
   ```
   - Queue de sync
   - Mode offline/online
   - Conflict resolution
   ```

6. **✅ Finaliser Dashboard.test.tsx** (incomplet)

### Phase 3: MOYENNE (2-3 jours)

7. **✅ Tests Managers restants** (SupplierManager, ProductManager, etc.)

8. **✅ Améliorer geminiService.test.ts** (mocks fragiles)

9. **✅ Supprimer example.test.tsx**

### Checklist de Couverture Requise

```
✅ Couverture >= 70% globale (vitest --coverage)
✅ Tous les calculs fiscaux avec marges d'erreur 0.01€
✅ Toutes les entités CRUD testées
✅ Offline mode validé
✅ Export PDF conforme Factur-X
✅ IndexedDB migrations testées
```

---

## 🛠️ PATTERNS DE TEST À UTILISER

### ✅ Calculs Fiscaux (copier depuis `fiscalCalculations.test.ts`)
```typescript
describe('calculateSomething', () => {
  it('calcule correctement avec valeurs normales', () => {
    const result = calculateSomething(100, userProfile);
    expect(result.value).toEqual(new Decimal('expected'));
  });

  it('valide les entrées invalides', () => {
    expect(() => calculateSomething(-100, profile)).toThrow();
  });

  it('gère les cas limites (0, négatif, énorme)', () => { ... });
});
```

### ✅ Composants UI (copier depuis `Sidebar.test.tsx`)
```typescript
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';

describe('Component', () => {
  it('affiche les éléments', () => {
    render(<Component {...props} />);
    expect(screen.getByText(/text/i)).toBeInTheDocument();
  });

  it('interagit correctement', async () => {
    const handler = vi.fn();
    render(<Component onAction={handler} />);
    await user.click(screen.getByRole('button'));
    expect(handler).toHaveBeenCalled();
  });

  it('respecte l\'accessibilité', () => {
    render(<Component {...props} />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label');
  });
});
```

### ✅ Hooks Custom (patron à créer)
```typescript
import { renderHook, act } from '@testing-library/react';
import { useMyHook } from '../hooks/useMyHook';

describe('useMyHook', () => {
  it('retourne la valeur initiale', () => {
    const { result } = renderHook(() => useMyHook());
    expect(result.current.value).toBe('initial');
  });

  it('met à jour la valeur', () => {
    const { result } = renderHook(() => useMyHook());
    act(() => {
      result.current.setValue('new');
    });
    expect(result.current.value).toBe('new');
  });
});
```

### ✅ Base de Données (patron à créer)
```typescript
import { beforeEach, describe, it, expect, vi } from 'vitest';
import { db } from '../db/invoiceDB';

describe('InvoiceDB', () => {
  beforeEach(async () => {
    await db.clearAll();
  });

  it('crée une facture', async () => {
    await db.invoices.add({ id: '1', number: 'FAC-001', ...data });
    const invoice = await db.invoices.get('1');
    expect(invoice.number).toBe('FAC-001');
  });

  it('gère les relations (items → invoice)', async () => {
    await db.invoices.add({ id: 'inv1', ... });
    await db.invoiceItems.add({ id: 'itm1', invoiceId: 'inv1', ... });
    const items = await db.invoiceItems.where('invoiceId').equals('inv1').toArray();
    expect(items).toHaveLength(1);
  });
});
```

---

## 📝 RÉSUMÉ DES ACTIONS

```
╔═══════════════════════════════════════════════════════════════════════════╗
║                        TABLEAU D'ACTION                                   ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ PRIORITÉ │ ACTION                           │ FICHIER           │ EFFORT  ║
╠═════════╪════════════════════════════════╪═════════════════════╪════════╣
║ 🔴 CRIT  │ Tests IndexedDB + migrations   │ db/invoiceDB.ts   │ 2-3h   ║
║ 🔴 CRIT  │ Tests Factur-X + Export        │ lib/facturX.ts    │ 3-4h   ║
║ 🔴 CRIT  │ Tests InvoiceManager CRUD      │ components/       │ 3-4h   ║
║ 🟡 HAUT  │ Finaliser Dashboard tests      │ __tests__/        │ 1-2h   ║
║ 🟡 HAUT  │ Tests useFirestoreSync         │ hooks/            │ 2-3h   ║
║ 🟡 MOYEN │ Compléter invoiceCalculations  │ __tests__/        │ 1-2h   ║
║ 🟡 MOYEN │ Supprime example.test.tsx      │ __tests__/        │ 0.5h   ║
║ 🟢 BASS  │ Tests managers (reste)         │ __tests__/ (bulk) │ 4-5h   ║
╚═════════╧════════════════════════════════╧═════════════════════╧════════╝

TOTAL ESTIMÉ: 19-24 heures (2-3 jours en développement continu)
OBJECTIF: >= 70% coverage global
```

---

## 📌 NOTES FINALES

1. **Patterns cohérents:** Le projet utilise Vitest + Testing Library - bien !
2. **Forces:** Calculs fiscaux et état Zustand bien testés
3. **Faiblesses:** Zéro test pour la persistance et les managers core
4. **Recommandation:** Commencer par IndexedDB (dépendance de tout)
5. **Sécurité:** aucun test de sécurité (XSS, injection, CSRF) - considérer

---

**Généré le 21 mars 2026**
