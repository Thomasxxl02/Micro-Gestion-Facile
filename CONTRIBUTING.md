# 🤝 Guide de Contribution

Merci de votre intérêt pour contribuer à **Micro-Gestion-Facile** ! Ce document vous guide pour soumettre des contributions de qualité.

## 📋 Table des matières

- [Code de conduite](#-code-de-conduite)
- [Types de contributions](#-types-de-contributions)
- [Avant de commencer](#-avant-de-commencer)
- [Processus de contribution](#-processus-de-contribution)
- [Directives de code](#-directives-de-code)
- [Commit messages](#-commit-messages)
- [Pull Requests](#-pull-requests)
- [Signaler un bug](#-signaler-un-bug)
- [Proposer une amélioration](#-proposer-une-amélioration)

---

## 😊 Code de conduite

Ce projet adhère à un code de conduite inclusif. En participant, vous acceptez de :

- 💬 Être respectueux envers tous les contributeurs
- 🤝 Accueillir les critiques constructives
- 🎯 Vous concentrer sur ce qui est meilleur pour la communauté
- ❌ Rejeter le harcèlement, la discrimination et les comportements offensants

Tout non-respect sera adressé sérieusement.

---

## 🎯 Types de contributions

### 🐛 Corrections de bugs
- Rapporter et corriger des bugs existants
- Améliorer la stabilité et la fiabilité

### ✨ Nouvelles fonctionnalités
- Ajouter de nouvelles capacités
- Améliorer l'expérience utilisateur

### 📚 Documentation
- Améliorer les READMEs et guides
- Ajouter des commentaires de code
- Créer des tutoriels et exemples

### 🎨 Amélioration de l'UX/UI
- Refonte de l'interface
- Amélioration du design responsive
- Optimisations d'accessibilité

### 🔧 Refactoring
- Nettoyer et structurer le code
- Améliorer la performance
- Augmenter la couverture de tests

### 🔒 Sécurité
- Améliorer les protections
- Corriger les vulnérabilités
- Auditer le code

---

## 📝 Avant de commencer

### 1. Vérifiez les issues existantes
Avant de commencer, consultez :
- [Issues ouvertes](https://github.com/Thomasxxl02/Micro-Gestion-Facile/issues)
- [Discussions](https://github.com/Thomasxxl02/Micro-Gestion-Facile/discussions)

Plusieurs personnes pourraient travailler sur le même problème.

### 2. Configurez votre environnement de développement

```bash
# Fork et cloner
git clone https://github.com/YOUR_USERNAME/Micro-Gestion-Facile.git
cd Micro-Gestion-Facile

# Ajouter le dépôt upstream
git remote add upstream https://github.com/Thomasxxl02/Micro-Gestion-Facile.git

# Installer les dépendances
npm install

# Créer votre branche
git checkout -b feature/ma-feature
```

### 3. Préparez votre environnement

Installez les extensions VS Code recommandées :
- ESLint
- Prettier
- TypeScript Vue Plugin
- Thunder Client (pour tester l'API)

---

## 🔄 Processus de contribution

### Étape 1 : Créer une branche

Utilisez des noms de branche explicites basés sur le type :

```bash
# Bug fixes
git checkout -b fix/nom-du-bug

# Nouvelles fonctionnalités
git checkout -b feature/nom-de-la-feature

# Documentation
git checkout -b docs/nom-doc

# Refactoring
git checkout -b refactor/nom-refactor
```

### Étape 2 : Développer

- ✅ Écrivez du code clair et type-safe
- ✅ Commenter le code complexe
- ✅ Testez votre code localement
- ✅ Suivez la structure du projet

```bash
# Lancer le serveur de dev
npm run dev

# Vérifier les types
npm run lint

# Vérifier le formatage
npm run format (si disponible)
```

### Étape 3 : Commit

Suivez la convention [Conventional Commits](https://www.conventionalcommits.org/fr/) :

```bash
git commit -m "type(scope): description"
```

### Étape 4 : Push et Pull Request

```bash
# Pusher votre branche
git push origin feature/ma-feature

# Ouvrir une PR sur GitHub
```

---

## 💻 Directives de code

### TypeScript obligatoire
- ✅ Typage strict activé dans `tsconfig.json`
- ✅ Pas de `any` sauf cas exceptionnels (avec comment)
- ✅ Interfaces et types bien documentés

```typescript
// ✅ BON
interface User {
  id: string;
  name: string;
  email: string;
}

// ❌ MAUVAIS
const user: any = { name: "John" };
```

### Structure de fichiers

```
components/
  ├── MyComponent.tsx      # Composant
  ├── MyComponent.styles.ts # Styles (si complexe)
  └── index.ts             # Export

services/
  ├── myService.ts         # Service métier
  └── types.ts             # Types du service

utils/
  └── helpers.ts           # Utilitaires
```

### React et hooks

```typescript
// ✅ Utilisez les hooks modernes
const MyComponent = () => {
  const [state, setState] = React.useState<string>("");
  
  React.useEffect(() => {
    // Effet
  }, [state]);

  return <div>{state}</div>;
};

// ❌ Évitez les class components sauf nécessité
```

### Gestion d'erreurs

```typescript
// ✅ Gérez les erreurs
try {
  await fetchData();
} catch (error) {
  if (error instanceof Error) {
    console.error("Error:", error.message);
  }
}

// ❌ Pas de try-catch vides
```

### Calculs financiers

🚨 **CRITIQUE** : Utilisez toujours des devises décimales pour les calculs :

```typescript
// ✅ BON avec big.js ou decimal.js
import Decimal from "decimal.js";
const total = new Decimal("10.50").plus(new Decimal("5.25"));

// ❌ MAUVAIS avec des floats
const total = 10.50 + 5.25; // Erreurs d'arrondi !
```

---

## 📝 Commit Messages

Suivez [Conventional Commits](https://www.conventionalcommits.org/fr/) :

```
type(scope): description

[optional body]
[optional footer]
```

### Types validés

- **feat**: Nouvelle fonctionnalité
- **fix**: Correction de bug
- **docs**: Documentation
- **style**: Formatage (pas de logique)
- **refactor**: Refactorisation
- **test**: Tests
- **chore**: Maintenance

### Exemplet

```
feat(invoice): ajouter la génération de PDF

- Ajout de la génération de factures en PDF
- Implémentation de la signature numérique
- Tests unitaires inclus

Fixes #123
```

---

## 🔀 Pull Requests

### Avant de soumettre

- [ ] Branche à jour avec `main`
- [ ] Code formaté et linté
- [ ] Pas de console.log() de debug
- [ ] Tests écrits et passant
- [ ] .env.example mis à jour si besoin

### Template de PR

```markdown
## 📋 Description
Courte description de la PR

## 🎯 Type de changement
- [ ] Bug fix
- [ ] Nouvelle fonctionnalité
- [ ] Breaking change
- [ ] Amélioration de documentation

## ✅ Checklist
- [ ] J'ai testé localement
- [ ] J'ai ajouté des tests
- [ ] J'ai mis à jour la doc
- [ ] Les types TypeScript sont vérifiés

## 📸 Capture d'écran (Si applicable)
Ajoutez une capture pour l'UX changes
```

---

## 🐛 Signaler un bug

### Avant de signaler

1. **Cherchez les issues existantes** pour éviter les doublons
2. **Testez sur la dernière version** - le bug peut être corrigé
3. **Vérifiez votre configuration** - problème local ?

### Comment signaler

Utilisez le [template de bug](https://github.com/Thomasxxl02/Micro-Gestion-Facile/issues/new?template=bug_report.md) qui inclut :

- 📝 Description claire du problème
- 🔗 Étapes pour reproduire
- 🎯 Comportement attendu
- ❌ Comportement réel
- 🖥️ Environnement (OS, navigateur, version Node)

---

## 💡 Proposer une amélioration

### Avant de proposer

1. **Vérifiez les améliorations existantes** dans les discussions
2. **Discutez d'abord** - ouvrez une issue de discussion avant de coder

### Template d'amélioration

Utilisez le [template de feature request](https://github.com/Thomasxxl02/Micro-Gestion-Facile/issues/new?template=feature_request.md) :

- 📝 Description claire de l'idée
- ✅ Cas d'usage et bénéfices
- 🔧 Solution proposée
- 🚀 Alternatives envisagées

---

## 🔍 Processus de review

### Critères d'approval

- ✅ Code clair et bien typé
- ✅ Tests robustes
- ✅ Documentation à jour
- ✅ Pas de breaking changes
- ✅ Performance acceptable

### Feedback

- 💬 Les reviewers vous feront des commentaires
- 🔄 Vous pouvez demander des clarifications
- 🎯 Réagissez aux critiques de façon constructive
- ✏️ Mettez à jour votre code selon les retours

---

## 🚀 Après votre contribution

Félicitations ! Après le merge :

- 🎉 Vous êtes un contributeur officiel
- ✨ Votre nom sera dans les crédits
- 📢 La version sera déployée en production
- 🔔 Vous serez notifié des discussions futures

---

## 📞 Questions ?

- 📖 Consultez la [documentation](docs/)
- 💬 Ouvrez une [discussion](https://github.com/Thomasxxl02/Micro-Gestion-Facile/discussions)
- 📧 Créez une [issue](https://github.com/Thomasxxl02/Micro-Gestion-Facile/issues) détaillée

---

<div align="center">

**Merci de votre contribution !** 

Ensemble, nous rendons Micro-Gestion-Facile meilleure ❤️

</div>
