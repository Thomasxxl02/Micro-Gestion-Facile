# 📚 GitHub Workflow Guide - Micro-Gestion-Facile

## 🎯 Vue d'ensemble

Ce document décrit les processus GitHub et workflows pour contribuer à **Micro-Gestion-Facile**.

---

## 🚀 Workflows Automatisés

### 1️⃣ **Build & Test** (build.yml)

**Déclenché**: Push sur main/develop, PR

**Actions**:

- Valide les secrets Firebase
- Installe les dépendances
- Exécute linting TypeScript
- Lance les tests unitaires
- Collecte la couverture de code
- Scanne avec SonarCloud
- Construit l'application
- Archive les artifacts
- Déploie sur staging (develop) et production (main)

**Durée esperée**: ~8-10 minutes

---

### 2️⃣ **Auto-Labeler** (auto-labeler.yml)

**Déclenché**: Ouverture/édition PR et issues

**Actions**:

- Étiquette automatiquement les PR selon les fichiers modifiés
- Détecte le type (feature/fix/docs/refactor/security/perf)
- Assigne une priorité (critical/high/medium/low)

**Exemple**:

```text
PR title: "feat: add invoice export"
→ Labels: [feature, invoice-management]
```

---

### 3️⃣ **Release Management** (release.yml)

**Déclenché**: Push package.json ou CHANGELOG.md vers main

**Actions**:

- Génère les release notes depuis CHANGELOG.md
- Crée une release GitHub
- Sync vers Projects board

---

### 4️⃣ **Security Scan** (security-scan.yml)

**Déclenché**: Modifications package.json, quotidien à 2 AM, PR

**Actions**:

- Audit npm dependencies
- Snyk security scan
- Vérification des licences avec Fossa
- Génère SBOM (Software Bill of Materials)

---

### 5️⃣ **Code Quality** (quality-check.yml)

**Déclenché**: Push main/develop, PR

**Actions**:

- ESLint analysis
- Prettier formatting check
- Complexité du code
- Tests d'accessibilité (a11y)
- Analyse de bundle
- Vérification de la taille

---

### 6️⃣ **CodeQL Security** (codeql.yml)

**Déclenché**: Push, PR, planifié

**Actions**:

- Analyse statique pour vulnérabilités
- Détecte patterns dangereux
- Génère un rapport SARIF

---

### 7️⃣ **Dependabot** (dependabot.yml)

**Déclenché**: Automatiquement

**Actions**:

- Crée des PR pour mises à jour de dépendances
- Sépare les majeure/mineure/patch
- Regroupe les mises à jour mineures

---

## 📋 Issue Templates Disponibles

### 🐛 **Bug Report**

Utilisez pour rapporter des bugs trouvés.

**Éléments**:

- Description du bug
- Étapes à reproduire
- Comportement attendu
- Écran/vidéo
- Contexte (OS, navigateur, version)
- Logs/erreurs

---

### 🚀 **Feature Request**

Utilisez pour proposer une nouvelle fonctionnalité.

**Éléments**:

- Description
- Cas d'usage
- Solution proposée
- Alternatives
- Contexte (performance, dépendances, fiscalité)

---

### 🔐 **Security Vulnerability**

Utilisez pour signaler des failles de sécurité.

**⚠️ IMPORTANT**: Ne créez PAS ce ticket publiquement !
Envoyez à `security@micro-gestion-facile.fr` à la place.

---

### 📚 **Documentation Issue**

Utilisez pour signaler des problèmes de documentation.

---

### 💬 **Discussion**

Utilisez pour discuter, poser des questions, partager des idées.

---

## 🔄 Workflow de Développement

### 1. Créer une branche

```bash
# À partir de develop
git checkout develop
git pull origin develop

# Créer votre branche
git checkout -b feature/ma-feature-name

# Ou pour un bugfix
git checkout -b bugfix/ma-correction
```

### 2. Commitez vos changements

```bash
# Commitez localement
git add .
git commit -m "feat: description claire du changement"

# Format: type(scope): message
# Types: feat, fix, docs, style, refactor, perf, test, chore, ci
```

### 3. Poussez et créez une PR

```bash
git push origin feature/ma-feature-name
```

Allez sur GitHub et créez une Pull Request.

### 4. Remplissez la PR correctement

```markdown
## Description
Brève description de ce que cette PR fait.

## Type de changement
- [x] Bug fix
- [ ] New feature
- [ ] Breaking change

## Linked Issue(s)
Fixes #123

## Checklist
- [x] Code follows project style
- [x] I've tested the changes
- [x] Tests added/updated
- [x] No console.log() or debug code
- [x] No secrets exposed
```

### 5. Attendez les vérifications

Les workflows suivants doivent passer :

- ✅ Build & Test
- ✅ CodeQL Security
- ✅ Security Scan
- ✅ Quality Check

### 6. Code Review

Un codeowner reviewera votre PR. Adressez les commentaires.

### 7. Merge

Une fois approuvée et tous les checks verts :

- Squash & merge (recommandé)
- Delete branch

---

## 🏷️ Labels utilisés

| Label | Couleur | Usage |
| --- | --- | --- |
| `bug` | 🔴 | Bug report |
| `feature` | 🟢 | New feature |
| `enhancement` | 🔵 | Enhancement |
| `documentation` | 📚 | Docs |
| `security` | 🔒 | Security issue |
| `refactor` | 🟡 | Refactoring |
| `performance` | ⚡ | Performance |
| `priority: critical` | 🔴 | Urgent |
| `priority: high` | 🟠 | Important |
| `priority: medium` | 🟡 | Normal |
| `priority: low` | 🟢 | Low priority |
| `good first issue` | 💜 | Good for newcomers |
| `help wanted` | 🤝 | Need help |
| `needs-triage` | ⚪ | Needs review |

---

## 📊 Branches Protection

### `main`

- Require 1 approval
- Require all status checks
- Require up to date
- Require conversation resolution
- Optionnel: signed commits

### `develop`

- Require 1 approval
- Require build & security-scan
- Require up to date

### `feature/*`

- Require build check only

---

## 🚨 Important Guidelines

### 🔐 Sécurité

- ❌ JAMAIS committer de secrets
- ❌ JAMAIS exposer d'API keys
- ✅ Utiliser `.env.example` pour documenter
- ✅ Valider les entrées utilisateur
- ✅ Gerer les erreurs correctement

### 💰 Fiscalité

- ✅ Tester les calculs avec Decimal.js
- ✅ Documenter les formules avec références
- ✅ Inclure des tests pour chaque calcul
- ✅ Respecter les règles URSSAF/TVA

### 📝 Code

- ✅ Suivre le style du projet
- ✅ Commenter les parties complexes
- ✅ Pas de console.log() en production
- ✅ Tests couvrant >70% du code

### 📚 Documentation

- ✅ Mettre à jour README si nécessaire
- ✅ Ajouter des commentaires JSDoc
- ✅ Mettre à jour CHANGELOG.md

---

## 🆘 Troubleshooting

### Checks échouées ?

1. Vérifiez les logs du workflow
2. Lancez localement: `npm run build`, `npm run test`
3. Vérifiez les secrets GitHub
4. Demandez de l'aide sur Discord/Issues

### PR blocker ?

1. Vérifiez les commentaires de review
2. Pushez les correctifs
3. Les checks relancent automatiquement
4. Demandez à un maintainer de relancer si nécessaire

### Merge impossible ?

- Vérifiez que vous êtes à jour: `git rebase origin/develop`
- Vérifiez tous les checks en vert
- Vérifiez les protections de branche

---

## 📞 Support

- **Questions**: Créez une [Discussion](../../discussions)
- **Bugs**: Créez un [Issue](../../issues)
- **Sécurité**: Envoyez à `security@micro-gestion-facile.fr`
- **Chat**: Discord (lien à configurer)
