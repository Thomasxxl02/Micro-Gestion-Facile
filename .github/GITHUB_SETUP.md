# ⚙️ Configuration GitHub Optimale

Ce document vous guide pour configurer les protections et paramètres GitHub pour **Micro-Gestion-Facile**.

## 🔐 Protections de branches

### Pour la branche `main`

Via **Settings → Branches → Branch protection rules** :

#### 1. Activer les protections

- ✅ **Require a pull request before merging**
  - Require approvals: 1
  - Require review from Code Owners: Oui
  - Dismiss stale pull request approvals: Oui
  - Require approval of the most recent reviewable push: Oui

- ✅ **Require status checks to pass before merging**
  - Require branches to be up to date: Oui
  - Status checks à valider :
    - `Build & Test / build`
    - `Security Checks / codeql`
    - `Security Checks / dependency-check`

- ✅ **Require code reviews before merging**
  - Minimum number of approvals: 1
  - Require review from code owners: Oui

- ✅ **Require conversation resolution before merging**
  - Oui (les commentaires doivent être résolus)

- ✅ **Require signed commits**
  - Recommandé (tous les commits doivent être signés)

- ✅ **Require deployment to specific environments before merging**
  - Si vous avez des déploiements (staging, production)

#### 2. Administrateur

- ✅ **Allow force pushes** : Non
- ✅ **Allow deletions** : Non
- ✅ **Dismiss stale reviews** : Non
- ✅ **Require branches to be up to date** : Oui

### Pour la branche `develop` (plus permissive)

- Require 1 approval de PR
- Require status checks (build seulement)
- Pas de signature de commits requise

---

## 👥 Code Owners

Créez un fichier `.github/CODEOWNERS` :

```
# Global owners
* @Thomasxxl02

# Components/Features
/components/** @Thomasxxl02

# Services/Firebase
/services/** @Thomasxxl02
/firebase.ts @Thomasxxl02

# Security & Configuration
.env.example @Thomasxxl02
tsconfig.json @Thomasxxl02
vite.config.ts @Thomasxxl02

# Documentation
*.md @Thomasxxl02

# DevOps/CI-CD
.github/** @Thomasxxl02
```

---

## 🔑 Secrets GitHub

Configurez via **Settings → Secrets and variables → Actions** :

### Required Secrets pour les workflows

```
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_FIRESTORE_DATABASE_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_MEASUREMENT_ID
GEMINI_API_KEY
```

> ⚠️ **Jamais en clair** dans les workflows - toujours utiliser les secrets

---

## 🚀 Déploiement et Releases

### Automated Release Notes

Via **Settings → General → About** :

- 📝 Description claire du projet
- 🔗 URL du site (si applicable)
- 🏷️ Topics: `pwa`, `react`, `typescript`, `micro-business`

### GitHub Releases

À faire manuellement ou via workflow automatisé :

```yaml
- [ ] Créer une release sur GitHub
- [ ] Générer les release notes
- [ ] Attacher les artifacts (si applicable)
```

---

## 📊 Paramètres de visibilité et discussion

### via Settings → General

- ✅ **Public** ou **Private** : À votre choix
- ✅ **Discussions** : Activer pour la communauté
- ✅ **Issues** : Activer
- ✅ **Pull requests** : Activer
- ✅ **Wikis** : À évaluer
- ✅ **Projects** : Activer pour le suivi

### GitHub Discussions

Organization > Settings → Features :
- ✅ Activer Discussions
- Créer des catégories :
  - 💡 Ideas
  - 🐛 Troubleshooting
  - 📣 Announcements
  - 🎤 General

---

## 🤖 Automations

### Labeler automatique

Créez `.github/workflows/label.yml` :

```yaml
name: Labeler
on: [pull_request]

jobs:
  label:
    runs-on: ubuntu-latest
    permissions:
      contents: read
      pull-requests: write
    steps:
      - uses: actions/labeler@v5
        with:
          repo-token: "${{ secrets.GITHUB_TOKEN }}"
          configuration-path: '.github/labeler.yml'
```

Créez `.github/labeler.yml` :

```yaml
dependencies:
  - changed-files:
      - any-glob-to-any-file: ['package*.json']

documentation:
  - changed-files:
      - any-glob-to-any-file: ['**/*.md']

typescript:
  - changed-files:
      - any-glob-to-any-file: ['**/*.tsx', '**/*.ts']
```

---

## ✅ Stale Issues/PRs Bot

Activer automatiquement via **Settings → Manage access** :

Ou créer un workflow :

```yaml
name: Close Stale Issues
on:
  schedule:
    - cron: '0 0 * * 0'

jobs:
  stale:
    runs-on: ubuntu-latest
    permissions:
      issues: write
      pull-requests: write
    steps:
      - uses: actions/stale@v9
        with:
          stale-issue-message: 'This issue is stale...'
          stale-pr-message: 'This PR is stale...'
          days-before-stale: 60
          days-before-close: 14
```

---

## 📈 Metrics et Monitoring

### GitHub Analytics

Via **Insights** :
- 📊 Traffic
- 📈 Forks
- ⭐ Stargazers
- 👥 Network

### Code Quality

Intégrez (optionnel) :
- 🔍 Codecov pour la couverture de tests
- 🔗 SonarCloud pour l'analyse
- 🚀 Snyk pour les vulnérabilités

---

## 🔄 Merge Strategy

Via **Settings → General → Pull Requests** :

- ✅ **Allow squash merging** : Oui (préféré pour commits propres)
- ✅ **Allow rebase merging** : Oui (option)
- ✅ **Allow auto-merge** : Oui (with conditions)
- ✅ **Suggest updating pull request branches** : Oui

---

## 📋 Checklist d'implémentation

- [ ] Branche `main` protégée
- [ ] Secrets GitHub configurés
- [ ] Workflows CI/CD testés
- [ ] CODEOWNERS créé
- [ ] Templates de PR/issue créés
- [ ] Dépendabot activé
- [ ] Discussions activées
- [ ] Code de conduite accepté

---

## 🔗 Ressources

- [GitHub Docs: Branch Protection](https://docs.github.com/en/repositories/configuring-branches-and-merges-in-your-repository/managing-protected-branches)
- [GitHub Actions Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [GitHub CODEOWNERS](https://docs.github.com/en/repositories/managing-your-repositorys-settings-and-features/customizing-your-repository/about-code-owners)

---

**Dernière mise à jour** : 18 mars 2026
