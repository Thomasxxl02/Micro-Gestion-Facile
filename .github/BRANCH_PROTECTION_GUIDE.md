# 🔒 Configuration des Branches Protégées

Ce guide configure les protections de branche pour **Micro-Gestion-Facile** via GitHub API ou UI.

## 📋 Configuration pour la branche `main`

### Via GitHub UI

1. Allez à **Settings → Branches**
2. Cliquez sur **Add rule** pour `main`

### Paramètres recommandés

#### ✅ Protection de base

- [x] **Require a pull request before merging**
  - Require approvals: **1**
  - Require review from code owners: **Oui**
  - Dismiss stale pull request approvals: **Oui**
  - Require approval of the most recent reviewable push: **Oui**

#### ✅ Vérifications CI/CD

- [x] **Require status checks to pass before merging**
  - Require branches to be up to date before merging: **Oui**
  - Status checks:
    - `build` (Build & Test)
    - `codeql` (Security)
    - `security-scan` (Dependencies)
    - `quality-check` (Code quality)

#### ✅ Conversations

- [x] **Require conversation resolution before merging**
  - Tous les commentaires doivent être résolus

#### ✅ Commits signés (optionnel mais recommandé)

- [x] **Require signed commits**
  - Les commits doivent être signés GPG

#### ✅ Administrateur

- [ ] **Restrict who can push to matching branches**
- [ ] **Allow force pushes** (Non)
- [ ] **Allow deletions** (Non)

---

## 📋 Configuration pour la branche `develop`

### Règle pour develop

```yaml
Branch name pattern: develop
```

### Paramètres (moins restrictif que main)

- [x] **Require a pull request before merging**
  - Require approvals: **1**
  - Require review from code owners: **Non**

- [x] **Require status checks to pass before merging**
  - Require branches to be up to date: **Oui**
  - Status checks:
    - `build`
    - `security-scan`

- [ ] **Require conversation resolution**
- [ ] **Require signed commits**

---

## 📋 Règles pour les feature branches

```yaml
Branch name pattern: feature/*
```

- [x] **Require status checks**
  - `build` (Build & Test)

---

## 🔐 Secrets GitHub à configurer

Via **Settings → Secrets and variables → Actions** :

### Firebase Secrets

```yaml
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_APP_ID
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_FIRESTORE_DATABASE_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_MEASUREMENT_ID
```

### Services d'analyse

```yaml
SONAR_TOKEN          # SonarCloud
CODECOV_TOKEN        # Codecov
SNYK_TOKEN          # Snyk
FOSSA_API_KEY       # Fossa (licenses)
```

### Déploiement

```yaml
SLACK_WEBHOOK_DEV   # Slack notifications (dev)
SLACK_WEBHOOK_PROD  # Slack notifications (prod)
```

---

## 🚀 Stratégie de branchement

```text
main (production)
  ↑
  └─ develop (staging)
      ↑
      └─ feature/* (features)
      └─ bugfix/* (bugfixes)
      └─ hotfix/* (emergency fixes)
```

### Noms de branches recommandés

```text
feature/invoice-export          # Nouvelle fonctionnalité
bugfix/fiscal-calculation       # Correction de bug
hotfix/security-patch           # Correction urgente
refactor/component-structure    # Refactoring
docs/api-documentation          # Documentation
test/coverage-improvement       # Tests
```

---

## 📊 Statut des vérifications requises

Les workflows suivants doivent réussir avant de merger :

1. **Build & Test** ✅
   - Checkout → Install → Lint → Test → Build → Archive

2. **CodeQL Security** ✅
   - Analyse statique du code

3. **Security Scan** ✅
   - Audit des dépendances npm
   - Snyk scan

4. **Quality Check** ✅
   - ESLint
   - Prettier
   - Complexité du code
   - Performance

---

## 🔄 Code Review Process

1. **Créer une PR** depuis votre feature branch
2. **Description claire** avec contexte
3. **Attendre les vérifications** (tous les checks doivent passer)
4. **Code review** par @Thomasxxl02 ou codeowners
5. **Resolve conversations** avant de merger
6. **Squash & merge** recommandé (garder l'historique propre)

---

## 🔐 Avantages de cette configuration

- ✅ Qualité de code garantie
- ✅ Pas de break à production
- ✅ Traçabilité des changements
- ✅ Sécurité renforcée
- ✅ Conformité fiscale assurée
- ✅ Revues systématiques

---

## 📝 Notes

- Les secrets ne doivent JAMAIS être committés
- Utilisez `.env.example` pour documenter les variables attendues
- Les commits doivent être clairs et atomiques
- Mettre à jour CHANGELOG.md pour chaque feature/fix
