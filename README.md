# 💼 Micro-Gestion-Facile

**Application de gestion complète pour micro-entrepreneurs français**

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue?logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19-61dafb?logo=react)](https://react.dev/)
[![Vite](https://img.shields.io/badge/Vite-8-646cff?logo=vite)](https://vitejs.dev/)
[![Firebase](https://img.shields.io/badge/Firebase-12-ffca28?logo=firebase)](https://firebase.google.com/)
[![PWA](https://img.shields.io/badge/PWA-Ready-5a0fc8?logo=pwa)](https://web.dev/progressive-web-apps/)
[![License](https://img.shields.io/badge/License-Private-red)](./LICENSE)

---

## 🎯 À propos

**Micro-Gestion-Facile** est une Progressive Web App (PWA) conçue spécifiquement pour les **micro-entrepreneurs français**. Elle offre une suite complète d'outils de gestion conformes à la réglementation française 2026.

### ✨ Fonctionnalités principales

- 📄 **Facturation conforme** - Génération de factures Factur-X avec numérotation continue
- 💰 **Suivi fiscal URSSAF** - Calculs automatiques des cotisations et seuils
- 📊 **Comptabilité simplifiée** - Tableau de bord, statistiques, exports
- 👥 **Gestion clients/fournisseurs** - CRM intégré
- 📧 **Emails professionnels** - Templates personnalisables
- 📅 **Calendrier** - Gestion des rendez-vous et échéances
- 🌐 **Mode hors-ligne** - Fonctionne sans connexion internet
- 🔒 **Données chiffrées** - Sécurité et conformité RGPD

---

## 🚀 Démarrage rapide

### Prérequis

- **Node.js** 18+ ([Télécharger](https://nodejs.org/))
- **npm** 9+ (inclus avec Node.js)
- Un compte **GitHub** (pour l'authentification OAuth)
- Un projet **Firebase** (gratuit)

### Installation

```powershell
# Cloner le repository
git clone https://github.com/Thomasxxl02/Micro-Gestion-Facile.git
cd Micro-Gestion-Facile

# Installer les dépendances
npm install

# Lancer le serveur de développement
npm run dev
```

L'application sera accessible sur **http://localhost:5173**

### Configuration OAuth GitHub

Suivez le guide rapide :

📘 **[Guide de démarrage OAuth](./docs/GITHUB_OAUTH_QUICKSTART.md)**

Ou lancez le script de test :

```powershell
.\scripts\test-oauth-connection.ps1
```

---

## 📚 Documentation

### Guides principaux

- **[⚡ Quick Start OAuth](./docs/GITHUB_OAUTH_QUICKSTART.md)** - Configuration en 10 minutes
- **[🔐 Guide OAuth complet](./docs/GITHUB_OAUTH_SETUP.md)** - Documentation détaillée
- **[✅ Checklist OAuth](./docs/GITHUB_OAUTH_CHECKLIST.md)** - Valeurs à copier-coller
- **[🛡️ Sécurité Firebase](./docs/FIRESTORE_SECURITY_AUDIT_2026-04-18.md)** - Audit de sécurité
- **[📱 PWA & Service Worker](./docs/PWA_SERVICE_WORKER_GUIDE.md)** - Mode hors-ligne

### Documentation technique

- **[🏗️ Architecture](./docs/ARCHITECTURE.md)** - Structure du projet
- **[📋 Cahier des charges](./docs/CAHIER_DES_CHARGES_TECHNIQUE.md)** - Spécifications
- **[🔒 Guide sécurité](./docs/SECURITY_GUIDE.md)** - Bonnes pratiques
- **[🧪 Tests & Coverage](./docs/archive/TEST_COVERAGE_ANALYSIS_2026-03-21.md)** - Analyse de couverture

---

## 🛠️ Scripts disponibles

```powershell
# Développement
npm run dev              # Serveur de développement (Vite)
npm run build            # Build de production
npm run preview          # Preview du build

# Qualité du code
npm run type-check       # Vérification TypeScript
npm run lint             # ESLint
npm run lint:fix         # ESLint avec auto-fix
npm run format           # Prettier

# Tests
npm run test             # Lancer les tests (Vitest)
npm run test:watch       # Tests en mode watch
npm run test:ui          # Interface graphique des tests
npm run test:coverage    # Rapport de couverture

# Scripts PowerShell
.\scripts\test-oauth-connection.ps1   # Test configuration OAuth
.\scripts\convert-logo-to-png.ps1     # Convertir le logo SVG→PNG
```

---

## 🏗️ Structure du projet

```
Micro-Gestion-Facile/
├── src/
│   ├── components/        # Composants React
│   ├── hooks/            # Hooks personnalisés
│   ├── lib/              # Utilitaires et helpers
│   ├── services/         # Services (API, Firebase)
│   ├── store/            # État global (Zustand)
│   ├── types/            # Types TypeScript
│   └── __tests__/        # Tests unitaires
├── public/               # Assets statiques
├── docs/                 # Documentation
├── scripts/              # Scripts PowerShell
└── config/               # Configuration Firebase
```

---

## 🧪 Tests

Le projet utilise **Vitest** et **React Testing Library**.

**Couverture actuelle :** ~30% (objectif: 70%)

Voir l'analyse détaillée : [Test Coverage Analysis](./docs/archive/TEST_COVERAGE_ANALYSIS_2026-03-21.md)

```powershell
# Lancer tous les tests
npm run test

# Mode watch (développement)
npm run test:watch

# Rapport de couverture
npm run test:coverage

# Interface graphique
npm run test:ui
```

---

## 🔒 Sécurité

### Authentification

- OAuth 2.0 via GitHub
- Tokens Firebase sécurisés
- Session persistante

### Protection des données

- **Firestore Rules** strictes (accès par `uid` uniquement)
- **Chiffrement** des données sensibles
- **Conformité RGPD** (données locales possible)

### Bonnes pratiques

- ✅ Aucun secret committé (`.env.local` dans `.gitignore`)
- ✅ CSP (Content Security Policy) configurée
- ✅ HTTPS uniquement en production
- ✅ Validation des entrées utilisateur

Voir le guide complet : [SECURITY_GUIDE.md](./docs/SECURITY_GUIDE.md)

---

## 🌐 Déploiement

### Firebase Hosting

```powershell
# Build de production
npm run build

# Déployer sur Firebase
firebase deploy --only hosting
```

### Configuration domaine personnalisé

Consultez : [Firebase Hosting Documentation](https://firebase.google.com/docs/hosting/custom-domain)

---

## 🤝 Contribution

Ce projet est actuellement **privé** et maintenu par **Thomas Carpentier** ([@Thomasxxl02](https://github.com/Thomasxxl02)).

Pour signaler un bug ou proposer une fonctionnalité :

1. Ouvrez une **Issue** sur GitHub
2. Décrivez le problème ou la suggestion
3. Attendez une réponse du mainteneur

---

## 📄 License

**Propriétaire :** Thomas Carpentier ([@Thomasxxl02](https://github.com/Thomasxxl02))  
**Statut :** Projet privé - Tous droits réservés

---

## 🛟 Support

### Problèmes fréquents

| Problème                             | Solution                                                                                |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| Erreur OAuth "Callback URL mismatch" | Vérifiez les URLs dans [GITHUB_OAUTH_CHECKLIST.md](./docs/GITHUB_OAUTH_CHECKLIST.md)    |
| "Module not found"                   | Relancez `npm install`                                                                  |
| Build échoue                         | Vérifiez avec `npm run type-check`                                                      |
| Tests échouent                       | Consultez [TEST_COVERAGE_ANALYSIS](./docs/archive/TEST_COVERAGE_ANALYSIS_2026-03-21.md) |

### Ressources

- **Issues GitHub :** [github.com/Thomasxxl02/Micro-Gestion-Facile/issues](https://github.com/Thomasxxl02/Micro-Gestion-Facile/issues)
- **Documentation Firebase :** [firebase.google.com/docs](https://firebase.google.com/docs)
- **Réglementation micro-entreprise :** [autoentrepreneur.urssaf.fr](https://www.autoentrepreneur.urssaf.fr)

---

## 🙏 Technologies utilisées

- **Frontend :** React 19, TypeScript, Vite 8, Tailwind CSS 4
- **Backend :** Firebase (Auth, Firestore, Hosting)
- **État :** Zustand, React Query
- **Tests :** Vitest, Testing Library
- **Build :** Vite avec Rollup
- **PWA :** Workbox, Service Worker
- **AI :** Google Gemini (assistant intégré)

---

**Développé avec ❤️ pour les micro-entrepreneurs français**

_Dernière mise à jour : 19 avril 2026_
