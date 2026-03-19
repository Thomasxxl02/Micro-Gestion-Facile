# Changelog

Tous les changements notables de ce projet seront documentés dans ce fichier.

Le format est basé sur [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
et ce projet adhère à [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
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

### Fixed
- Corrections des problèmes d'encodage UTF-8
- Normalisation des classes Tailwind
- Améliorations d'accessibilité ARIA

### Security
- Stockage sécurisé des données sensibles
- Validation des entrées utilisateur
- Protection des secrets Firebase

## [0.0.0] - 2026-03-19

### Initial Release
- Première release alpha pour tests internes
