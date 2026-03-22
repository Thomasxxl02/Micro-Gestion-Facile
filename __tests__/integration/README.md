## 🧪 Guide des Tests d'Intégration - Flux Client

Ce document explique comment exécuter et étendre les tests d'intégration pour le flux complet de gestion des clients.

### 📁 Structure des Tests

```
__tests__/
├── integration/
│   ├── clientFlowIntegration.test.ts    # Suite principale des tests d'intégration
│   ├── dexieIntegrationSetup.ts         # Configuration IndexedDB pour les tests
│   └── README.md                         # Ce document
└── hooks/
    └── useEntity.test.ts                 # Tests unitaires des hooks
```

### 🎯 Objectifs des Tests d'Intégration

Les tests d'intégration `clientFlowIntegration.test.ts` testent **l'interaction complète** entre:

| Couche | Rôle |
|--------|------|
| **useEntityForm Hook** | Gestion du formulaire (créer, éditer, mettre à jour les champs) |
| **appStore (Zustand)** | État global en mémoire des clients |
| **IndexedDB (Dexie)** | Persistance des données côté client |
| **useEntityFilters Hook** | Filtrage, recherche et tri des listes |

### 📋 Scénarios Testés

#### 1️⃣ **Create → Store → Persist**
```
Créer formulaire → Remplir les champs → Sauvegarder en mémoire → Persister en DB → Vérifier
```
- ✅ Création simple d'un client
- ✅ Création de plusieurs clients
- ✅ Vérification de la persistance en IndexedDB

#### 2️⃣ **Edit → Update → Sync**
```
Éditer formulaire → Modifier les champs → Mettre à jour en mémoire → Synchroniser en DB → Vérifier
```
- ✅ Modification de champs
- ✅ Synchronisation bidirectionnelle (store ↔ IndexedDB)
- ✅ État d'édition cohérent

#### 3️⃣ **List → Filter → Display**
```
Charger clients en mémoire → Appliquer filtres → Vérifier résultats
```
- ✅ Lister tous les clients (actifs + archivés)
- ✅ Filtrer par statut d'archivage
- ✅ Rechercher par nom
- ✅ Trier par colonne
- ✅ Combiner filtres + recherche + tri

#### 4️⃣ **Archive → Filter Sync**
```
Archiver client → Mettre à jour filtres → Vérifier masquage/affichage
```
- ✅ Archivage change le statut
- ✅ Filtres s'appliquent correctement
- ✅ Affichage des archivés sur demande

#### 5️⃣ **Persistence Verification**
```
Sauvegarder en DB → Réinitialiser store → Charger depuis DB → Vérifier intégrité
```
- ✅ Les données persistent après réinitialisation
- ✅ Gestion de charges importantes (100+ clients)

#### 6️⃣ **Concurrent Operations**
```
Éditer client 1 → Éditer client 2 → Synchroniser les deux → Vérifier intégrité
```
- ✅ Éditions simultanées sans conflit

### 🚀 Comment Exécuter les Tests

#### Exécuter tous les tests d'intégration
```bash
npm run test -- __tests__/integration/
```

#### Exécuter un scénario spécifique
```bash
npm run test -- __tests__/integration/clientFlowIntegration.test.ts -t "Create → Store → Persist"
```

#### Exécuter avec couverture
```bash
npm run test:coverage -- __tests__/integration/
```

#### Mode watch (développement)
```bash
npm run test -- __tests__/integration/clientFlowIntegration.test.ts --watch
```

#### Mode debug
```bash
node --inspect-brk node_modules/vitest/vitest.mjs run __tests__/integration/clientFlowIntegration.test.ts
```

### 🔧 Configuration Requise

#### 1️⃣ `vitest.setup.ts`
Doit inclure le setup Dexie:
```typescript
import { setupDexieForTests } from './__tests__/integration/dexieIntegrationSetup';
setupDexieForTests();
```

#### 2️⃣ `vite.config.ts` ou `vitest.config.ts`
Doit utiliser `jsdom` comme environnement de test (supporte IndexedDB):
```typescript
export default defineConfig({
  test: {
    environment: 'jsdom',
    // ...
  },
});
```

#### 3️⃣ Types TypeScript
S'assurer que les types `Client`, `Invoice`, etc. sont disponibles depuis `types.ts`.

### 🛠️ Ajuster les Tests pour Votre Contexte

#### Modifier les données de test (fixtures)
Dans `clientFlowIntegration.test.ts`, au début du fichier:

```typescript
const mockNewClient: Omit<Client, 'id'> = {
  name: 'Acme Corporation',              // ← Changer le nom
  email: 'contact@acme.fr',            // ← Changer l'email
  phone: '+33 1 23 45 67 89',          // ← Changer le téléphone
  // ... autres champs
};
```

#### Ajouter un nouveau scénario
```typescript
describe('Scenario 7: Mon Nouveau Scénario', () => {
  it('fait quelque chose de spécifique', async () => {
    // Arrange
    const store = useAppStore.getState();
    const client = createClientWithId(mockNewClient, 'cl-new');

    // Act
    act(() => {
      store.setClients([client]);
    });
    await saveClientToDb(client);

    // Assert
    const saved = await getClientFromDb('cl-new');
    expect(saved).toEqual(client);
  });
});
```

### 🧰 Helpers Disponibles

Tous les helpers sont définis dans `clientFlowIntegration.test.ts`:

| Helper | Signature | Rôle |
|--------|-----------|------|
| `createClientWithId` | `(data: Omit<Client, 'id'>, id?: string) => Client` | Crée un client avec ID |
| `saveClientToDb` | `(client: Client) => Promise<void>` | Persiste en IndexedDB |
| `getClientFromDb` | `(id: string) => Promise<Client \| undefined>` | Récupère depuis IndexedDB |
| `getAllClientsFromDb` | `() => Promise<Client[]>` | Récupère tous les clients |
| `resetDatabase` | `() => Promise<void>` | Réinitialise IndexedDB |

Utility supplémentaires (dans `dexieIntegrationSetup.ts`):
- `setupDexieForTests()` - Initialise Dexie
- `clearDatabase(db)` - Vide toutes les tables
- `isTableEmpty(db, tableName)` - Vérifie si une table est vide
- `exportTableData(db, tableName)` - Exporte les données (debug)

### 📊 Métriques et Couverture

Après exécution, vérifier:

```bash
npm run test:coverage -- __tests__/integration/

# Résultat attendu:
# useEntity.ts        : 95%+ (hooks)
# appStore.ts         : 80%+ (store)
# invoiceDB.ts        : 70%+ (DB context)
```

### 🐛 Troubleshooting

#### ❌ `ReferenceError: indexedDB is not defined`
**Solution:** Vérifier que `vitest.config.ts` utilise `environment: 'jsdom'`

#### ❌ `Database "MicroGestionFacile" is not available`
**Solution:** Ajouter un timeout dans `waitForDatabase()`:
```typescript
// Dans les tests
await waitForDatabase(db, 10000); // 10 secondes
```

#### ❌ `Dexie.connections` vide après les tests
**Solution:** Le cleanup de `dexieIntegrationSetup.ts` fonctionne mal. Vérifier que `setupDexieForTests()` est appelé dans `vitest.setup.ts`

#### ❌ Les données persistant d'un test à l'autre
**Solution:** Vérifier que `resetDatabase()` est appelé dans le `beforeEach`:
```typescript
beforeEach(async () => {
  await resetDatabase(); // ← Obligatoire
});
```

### 📈 Étapes Suivantes

1. **Ajouter des tests pour d'autres entities:**
   - `invoiceFlowIntegration.test.ts` (crée facture → calcule totaux → persiste)
   - `supplierFlowIntegration.test.ts` (même pattern que Client)
   - `productFlowIntegration.test.ts`

2. **Tests d'intégration Firestore (sync offline):**
   - `firestoreSyncIntegration.test.ts` (IndexedDB ↔ Firestore)

3. **Tests de performance:**
   - Temps de requête IndexedDB avec 1000+ clients
   - Temps de rendu avec 500+ clients
   - Temps de recherche/filtrage

4. **Tests E2E (vue complète UI):**
   - Utiliser Playwright ou Cypress
   - Tester le flux complet à travers l'interface utilisateur

### 📚 Ressources Connexes

- [TEST_COVERAGE_ANALYSIS_2026-03-21.md](../../TEST_COVERAGE_ANALYSIS_2026-03-21.md) - Analyse détaillée de la couverture
- [TEST_IMPLEMENTATION_TEMPLATES.md](../../TEST_IMPLEMENTATION_TEMPLATES.md) - Templates de code
- [Dexie.js Documentation](https://dexie.org/)
- [Vitest Documentation](https://vitest.dev/)
- [@testing-library/react](https://testing-library.com/react)

---

**Dernière mise à jour:** 22 mars 2026  
**Auteur:** Agent d'Intégration Automatique  
**Status:** ✅ Prêt pour exécution
