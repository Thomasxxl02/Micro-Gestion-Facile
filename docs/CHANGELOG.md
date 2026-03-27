# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added - Sécurité Avancée (v1.1.0)

- **🔐 Authentification 2FA** (TOTP avec Google Authenticator, Microsoft Authenticator, Authy)
- **🔑 Gestion sécurisée des API Keys** (Gemini, Firebase, Custom) avec rotation recommandée
- **🗝️ Reset Password** avec validation de force et indicateur de sécurité
- **🚪 Sessions actives** - Gestion des connexions multi-appareils et déconnexion à distance
- **📜 Login History** - Historique complet des 50 dernières connexions avec statut
- **🔒 Chiffrement AES-256** des données sensibles (IBAN, SIRET, SIREN, TVA) côté client
- **PasswordValidator** - Validateur de mots de passe avec feedback intelligent
- Service de sécurité complet (`services/securityService.ts`)
- Composant `SecurityTab` avec interface intuitive
- Guide de sécurité complet (`docs/SECURITY_GUIDE.md`)

### Added - Fonctionnalités existantes

- Support pour la PWA complète (Service Worker, Offline-first)
- Gestion des factures avec numérotation automatique
- Édition par glisser-déposer pour les éléments
- Intégration Google Gemini pour l'assistance IA
- Synchronisation Firebase Firestore optionnelle
- Calculs fiscaux français 2026 (URSSAF, TVA, IR)
- Recherche et filtrage avancés
- Export de données (CSV, PDF)
- Gestion multi-clients et multi-fournisseurs
- Calendrier événementiel intégré

### Changed

- Migration vers Vite pour optimisation build
- Mise à jour vers Tailwind CSS v4
- React 19 avec types améliorés
- Interface Sécurité repensée avec 5 onglets distincts

### Fixed

- Corrections des problèmes d'encodage UTF-8
- Normalisation des classes Tailwind
- Améliorations d'accessibilité ARIA

### Security

- ✅ Authentification 2FA complète (RFC 6238 TOTP)
- ✅ Hash SHA-256 pour les API Keys (jamais stockées en clair)
- ✅ Chiffrement AES-256-GCM avec PBKDF2 (100k itérations)
- ✅ Gestion sécurisée des tokens de reset password
- ✅ Validation et feedback fort des mots de passe
- ✅ Isolation des données sensibles via encryption côté client
- ✅ Sessions storage avec révocation possible
- ⚠️ Note: Toutes les opérations de sécurité restent côté client (navigateur)

## [0.0.0] - 2026-03-19

### Initial Release

- Première release alpha pour tests internes
