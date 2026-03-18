# 📊 Intégration Codecov - Configuration et Utilisation

## 🎯 Vue d'ensemble

Codecov est un service qui mesure et rapporte la **couverture de code** de votre application. L'intégration complète permet :
- ✅ Automatiser la mesure de la couverture lors de chaque commit/PR
- ✅ Afficher les rapports de couverture dans les PR GitHub
- ✅ Tracker la couverture dans le temps
- ✅ Fixer des seuils minimums de couverture

## 🔧 Configuration Complète

### 1. **Dépendances Installées**
```json
{
  "devDependencies": {
    "vitest": "^2.1.8",
    "@vitest/coverage-v8": "^2.1.8",
    "@vitest/ui": "^2.1.8"
  }
}
```

### 2. **Fichiers de Configuration**

#### `vitest.config.ts` - Configuration des tests et couverture
- **Provider** : v8 (le meilleur pour V8 engine)
- **Reporters** : `text`, `json`, `html`, `lcov`
  - `lcov` : Format requis par Codecov
  - `html` : Rapport lisible dans le navigateur
- **Seuils de couverture** (optionnel mais recommandé) :
  - Lines: 70%
  - Functions: 70%
  - Branches: 60%
  - Statements: 70%

#### `codecov.yml` - Configuration Codecov
Configure les comportements de Codecov:
- Seuils de couverture minimum
- Commentaires automatiques sur les PR
- Exclusions de fichiers
- Correction des chemins

#### `.github/workflows/build.yml` - Pipeline CI/CD
Ajoute les étapes :
1. **Tests avec couverture** : `npm run test:coverage`
2. **Upload vers Codecov** : Utilise l'action officielle `codecov/codecov-action@v5`

### 3. **Scripts npm Disponibles**
```bash
# Exécuter les tests une seule fois
npm run test

# Exécuter les tests avec interface interactive
npm run test:ui

# Exécuter les tests et générer le rapport de couverture
npm run test:coverage
```

## 📱 Utilisation Locale

### Générer un rapport de couverture localement :
```bash
npm run test:coverage
```

Cela crée un dossier `coverage/` avec :
- `coverage/coverage-final.json` : Données brutes Codecov
- `coverage/index.html` : Rapport HTML interactif
  - Ouvrir dans le navigateur : `open coverage/index.html`

### Consulter le rapport HTML :
```bash
# Sur Windows
start coverage/index.html

# Sur macOS
open coverage/index.html

# Sur Linux
xdg-open coverage/index.html
```

## 🔗 Intégration GitHub

### 1. **Configurer Codecov sur GitHub**

**Option A : Sans token (recommandé pour repos publics)**
- Codecov détecte automatiquement les repos publics GitHub
- Les rapports sont uploadés via les logs CI/CD

**Option B : Avec token (pour repos privés)**
1. Aller sur https://codecov.io
2. Se connecter avec GitHub
3. Activer le repo "Micro-Gestion-Facile"
4. Récupérer le **CODECOV_TOKEN**
5. Ajouter le token dans GitHub Secrets :
   - Settings → Secrets → New secret
   - Nom : `CODECOV_TOKEN`
   - Valeur : [Token de Codecov]

### 2. **Vérifier les PR**
À chaque PR, vous verrez :
- ✅ Rapport de couverture généré automatiquement
- 📊 Comparaison avec la branche main
- 💬 Commentaire Codecov avec résumé

## 📈 Actions Recommandées

### 1. **Ajouter des tests au projet**
Les tests doivent être créés dans :
- `__tests__/` folders (à côté des fichiers)
- Ou `*.test.ts`, `*.spec.ts`

Exemple de structure :
```
components/
  ├── Dashboard.tsx
  └── __tests__/
      └── Dashboard.test.tsx
services/
  ├── geminiService.ts
  └── __tests__/
      └── geminiService.test.ts
```

### 2. **Créer un badge de couverture**
Ajouter au `README.md` :
```markdown
[![codecov](https://codecov.io/gh/Thomasxxl02/Micro-Gestion-Facile/branch/main/graph/badge.svg)](https://codecov.io/gh/Thomasxxl02/Micro-Gestion-Facile)
```

### 3. **Maintenir une couverture de qualité**
- Avant chaque commit : `npm run test:coverage`
- Vérifier les zones non couvertes
- Améliorer progressivement les seuils

## 🚨 Dépannage

### Les tests ne s'exécutent pas dans le workflow
- Vérifier que `npm ci` installe bien `@vitest/coverage-v8`
- Vérifier les variables d'environnement Firebase/Gemini sont présentes

### Codecov ne reçoit pas les rapports
- Vérifier que `coverage/coverage-final.json` existe
- Vérifier l'onglet "Actions" sur GitHub pour les erreurs

### Chemins incorrects dans les rapports
- Les chemins Windows dans `codecov.yml` sont corrigés automatiquement

## 📚 Ressources

- [Codecov Documentation](https://docs.codecov.io/)
- [Vitest Coverage Guide](https://vitest.dev/guide/coverage)
- [GitHub Codecov Action](https://github.com/codecov/codecov-action)
- [Rapport HTML d'exemple](./coverage/index.html) (après `npm run test:coverage`)

## 🔒 Sécurité

- ✅ Token Codecov optionnel (détection auto pour repos publics)
- ✅ Logs de couverture exclus des commandes push
- ✅ Dossier `coverage/` rajouté à `.gitignore`
