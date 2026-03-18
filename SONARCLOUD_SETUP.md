# 🔍 Configuration SonarCloud

## 📋 Vue d'ensemble

SonarCloud analyse votre code TypeScript/JavaScript pour identifier les bugs, vulnérabilités de sécurité, et problèmes de qualité. Il s'intègre avec GitHub pour des analyses automatiques à chaque push et PR.

---

## ✅ Configuration Complétée

### 1. Fichier de configuration créé
- **`sonar-project.properties`** : Configuration SonarCloud pour le projet
  - Exclusions des dossiers inutiles (node_modules, dist, __tests__)
  - Rapport de couverture LCOV
  - Support TypeScript avec tsconfig.json

### 2. Workflow GitHub Actions mis à jour
- **`.github/workflows/build.yml`** : Ajout de l'étape de scan SonarCloud
  - Lance après les tests et génération de la couverture
  - Utilise l'action officielle `SonarSource/sonarcloud-github-action`
  - Continue le workflow même en cas d'erreur

---

## 🚀 Étapes de Configuration Manuelle

### Étape 1 : Créer un compte SonarCloud

1. Allez sur [sonarcloud.io](https://sonarcloud.io)
2. Cliquez sur **"Sign up"** et authentifiez-vous avec GitHub
3. Acceptez les permissions demandées par SonarCloud

### Étape 2 : Créer un token SonarCloud

1. Dans SonarCloud, allez à **Profile → My Account → Security**
2. Cliquez sur **"Generate new token"**
3. Nommez-le `GITHUB_TOKEN_SONARCLOUD` ou similaire
4. Copiez le token (vous ne pourrez plus le voir après)

### Étape 3 : Ajouter le secret GitHub

1. Allez sur GitHub → **Settings → Secrets and variables → Actions**
2. Cliquez sur **"New repository secret"**
3. Nom : `SONAR_TOKEN`
4. Valeur : Collez le token SonarCloud généré
5. Cliquez sur **"Add secret"**

### Étape 4 : Configurer le projet SonarCloud

1. Dans SonarCloud, cliquez sur **"Analyze new project"**
2. Sélectionnez `Micro-Gestion-Facile` depuis GitHub
3. Cliquez sur **"Set up"**
4. Choisissez **"GitHub Actions"** comme méthode d'analyse
5. SonarCloud détectera votre `sonar-project.properties` automatiquement

### Étape 5 : Vérifier la configuration

1. Allez dans **Project Settings → General**
2. Vérifiez que le `projectKey` correspond : `Thomasxxl02_Micro-Gestion-Facile`
3. Allez dans **Project Settings → Languages → TypeScript**
4. Assurez-vous que **"Enable TypeScript analyis"** est activé

---

## 📊 Fonctionnalités de SonarCloud

Une fois configuré, vous obtiendrez :

### 🐛 Détection des bugs
- Erreurs de logique courantes
- Variables non initialisées
- Chaînes de comparaison dangereuses

### 🔒 Sécurité
- Vulnérabilités OWASP
- Injections XSS potentielles
- Gestion inadéquate des secrets

### 📈 Qualité du code
- Couverture de tests
- Complexité cyclomatique
- Duplication de code
- Code mort

### 🎯 Code smells
- Fonctions trop complexes
- Paramètres non utilisés
- Imports inutiles
- Noms de variables confus

---

## 🔧 Intégration avec les Power Requests

### Sur chaque PR
- SonarCloud ajoute un commentaire avec l'analyse
- Affiche les nouveaux problèmes introduits
- Compare avec la branche principale
- Donne une note de qualité

### Exemple de rapport
```
Quality Gate: PASSED / FAILED
Lines of Code: 2,345
Bugs: 3 (2 new)
Vulnerabilities: 1 new
Code Smells: 12 (3 new)
Test Coverage: 78% (+2%)
```

---

## 🌍 Badge SonarCloud

Pour ajouter un badge au README.md :

```markdown
[![Quality Gate Status](https://sonarcloud.io/api/project_badges/measure?project=Thomasxxl02_Micro-Gestion-Facile&metric=alert_status)](https://sonarcloud.io/dashboard?id=Thomasxxl02_Micro-Gestion-Facile)
[![Coverage](https://sonarcloud.io/api/project_badges/measure?project=Thomasxxl02_Micro-Gestion-Facile&metric=coverage)](https://sonarcloud.io/dashboard?id=Thomasxxl02_Micro-Gestion-Facile)
```

---

## 📚 Ressources

- **Documentation officielle** : https://docs.sonarcloud.io/
- **GitHub Action** : https://github.com/SonarSource/sonarcloud-github-action
- **Quality Gates** : https://docs.sonarcloud.io/improving/quality-gates/

---

## ⚡ Prochaines étapes

1. **Créer un compte SonarCloud** et générer un token
2. **Ajouter le secret** `SONAR_TOKEN` dans GitHub
3. **Configurer le projet** dans SonarCloud
4. **Faire un push** pour déclencher la première analyse
5. **Consulter le tableau de bord** pour voir les résultats

---

## 💡 Bonnes pratiques

- ✅ Vérifier les nouveaux problèmes sur chaque PR
- ✅ Corriger les bugs et vulnérabilités signalées
- ✅ Mettre à jour les Configuration Rules si nécessaire
- ✅ Monitorer la couverture de tests (cible : 70%+)
- ✅ Utiliser les alertes SonarCloud dans vos conventions de code
