# 🔒 Incident de Sécurité - Remédiation des Clés API Exposées

**Date du rapport** : 20 mars 2026  
**Statut** : 🚨 URGENT - À traiter IMMÉDIATEMENT  
**Sévérité** : CRITIQUE (Clés secrètes exposées)

---

## 📋 Résumé de l'Incident

Deux clés API secrètes ont été exposées dans l'historique Git et détectées par GitHub Secret Scanning :

1. **Firebase API Key** : `AIzaSyAryNVYzN1uXwiaFhFPC5xSeW4neFRs7B4`
   - Détectée dans le commit : `a50b612`
   - Lieu : Code source historique

2. **Gemini API Key** : `AIzaSyBXejKbJpVWxARCRP3hYroCEbREQiVWbiE`
   - Détectée par : GitHub Secret Scanning
   - Lieu : Potentiellement logs CI/CD ou historique

---

## ✅ Checklist de Remédiation

### Étape 1 : Révoquer les clés compromises

- [ ] **Firebase Console** : https://console.cloud.google.com/apis/credentials
  - [ ] Se connecter avec le compte Google du projet
  - [ ] Aller dans "Credentials" → "API Keys"
  - [ ] Trouver la clé : `AIzaSyAryNVYzN1uXwiaFhFPC5xSeW4neFRs7B4`
  - [ ] Cliquer sur les trois points → "Supprimer" (Delete)
  - [ ] Confirmer la suppression

- [ ] **Google Cloud Console** : Vérifier aucun autre accès anormal
  - [ ] Aller dans "Activity" pour voir les usages récents
  - [ ] Noter si la clé a été utilisée par des acteurs non autorisés

### Étape 2 : Générer de nouvelles clés

- [ ] **Nouvelle Firebase API Key**
  - [ ] Firebase Console → "Create API Key"
  - [ ] Définir les restrictions :
    - HTTP Referrers
    - Ajouter les domaines autorisés :
      - `https://micro-gestion-facile.vercel.app` (production)
      - `http://localhost:*` (développement local)
  - [ ] Copier la nouvelle clé → Sauvegarder en lieu sûr (password manager)
  - [ ] **Valeur exemple** : `AIzaSy...` (remplacer par la nouvelle)

- [ ] **Nouvelle Gemini API Key**
  - [ ] Google AI Studio : https://aistudio.google.com/
  - [ ] "Create API key"
  - [ ] Sélectionner le projet Firebase
  - [ ] Ajouter les restrictions d'application
  - [ ] Copier la nouvelle clé → Sauvegarder en lieu sûr (password manager)

### Étape 3 : Mettre à jour GitHub Secrets

- [ ] **GitHub Repository Settings**
  - [ ] Aller à : https://github.com/Thomasxxl02/Micro-Gestion-Facile/settings/secrets/actions
  - [ ] Cliquer sur `VITE_FIREBASE_API_KEY`
  - [ ] Appuyer sur "Update secret"
  - [ ] Coller la nouvelle Firebase API Key
  - [ ] Cliquer "Update Secret"

- [ ] Mettre à jour `GEMINI_API_KEY`
  - [ ] Cliquer sur le secret existant
  - [ ] Appuyer sur "Update secret"
  - [ ] Coller la nouvelle Gemini API Key
  - [ ] Cliquer "Update Secret"

### Étape 4 : Tester les nouvelles clés

- [ ] **Vérifier que le build GitHub Actions réussit**
  - [ ] Faire un commit vide pour déclencher la pipeline
  - [ ] Vérifier que le build passe avec les nouvelles clés
  - [ ] Consulter les logs (sans afficher les clés)

- [ ] **Tester en local**

  ```bash
  # Créer un nouveau .env.local
  echo "VITE_FIREBASE_API_KEY=votre_nouvelle_clé" >> .env.local
  echo "GEMINI_API_KEY=votre_nouvelle_clé_gemini" >> .env.local

  # Tester le build
  npm run build

  # Tester les tests
  npm test -- --run
  ```

- [ ] **Tester l'API Gemini** en créant un prompt dans l'app
- [ ] **Tester Firebase Auth** en se connectant/créant un compte

### Étape 5 : Nettoyer l'historique Git (optionnel mais recommandé)

- [ ] **Utiliser BFG Repo Cleaner** pour supprimer l'historique exposé

  ```bash
  # Installer BFG
  npm install -g bfg

  # Créer un fichier secrets.txt avec les clés à supprimer
  echo "AIzaSyAryNVYzN1uXwiaFhFPC5xSeW4neFRs7B4" >> secrets.txt
  echo "AIzaSyBXejKbJpVWxARCRP3hYroCEbREQiVWbiE" >> secrets.txt

  # Nettoyer l'historique
  bfg --replace-text secrets.txt

  # Forcer le push
  git push --force
  ```

- [ ] **Avertissements après nettoyage** :
  - Les utilisateurs avec des clones doivent refaire `git clone`
  - Les branches feature doivent être rebasées
  - Les webhooks GitHub peuvent être temporairement affectés

---

## 📊 État de Sécurité Actuel

### ✅ Éléments Sécurisés

- [x] `.gitignore` : Les fichiers `.env*` sont ignorés
- [x] `.env.example` : Ne contient que des placeholder
- [x] `firebase-applet-config.json` : En `.gitignore`
- [x] GitHub Secrets : Utilisés pour CI/CD
- [x] Code source : Ne contient pas de clés codées en dur
- [x] Compilation TypeScript : ✅ 0 erreurs
- [x] npm audit : ✅ 0 vulnérabilités

### 🟡 Éléments à Corriger IMMÉDIATEMENT

- [ ] Révoquer Firebase API Key exposée
- [ ] Révoquer Gemini API Key exposée
- [ ] Générer de nouvelles clés
- [ ] Mettre à jour GitHub Secrets
- [ ] Nettoyer l'historique Git (recommandé)

### ✅ Validation Complète

- [x] 105 tests passent
- [x] Project builds sans erreurs
- [x] Pas de dépendances vulnérables
- [x] TypeScript strict mode validé

---

## 📞 Prochaines Actions

### Immédiat (Maintenant)

1. ✅ Révoquer les deux clés dans Google Cloud Console
2. ✅ Générer de nouvelles clés
3. ✅ Mettre à jour GitHub Secrets
4. ✅ Tester les builds

### Court terme (Cette semaine)

1. Nettoyer l'historique Git avec BFG
2. Forcer le push et notifier les développeurs
3. Forcer les rebases des branches feature

### Moyen terme (Ce mois)

1. Mettre en place une détection automatique (pre-commit hooks)
2. Implémenter GitGuardian ou équivalent
3. Former l'équipe aux bonnes pratiques de secrets

---

## 🔐 Bonnes Pratiques à Retenir

1. **JAMAIS committer** : `.env*`, `secrets.json`, `credentials.json`
2. **TOUJOURS utiliser** : GitHub Secrets pour les variables sensibles
3. **TOUJOURS vérifier** : `.gitignore` avant le premier commit
4. **UTILISER** : Pre-commit hooks pour détecter les secrets (Husky + lint-staged)
5. **SCRUBER** : Tous les commits historiques avant push public

---

## 📚 Ressources

- [Google Cloud - API Keys Management](https://console.cloud.google.com/apis/credentials)
- [GitHub - Using secrets in GitHub Actions](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)
- [BFG Repo-Cleaner](https://rtyley.github.io/bfg-repo-cleaner/)
- [Git Hooks avec Husky](https://husky.js.org/)
- [detect-secrets (détection CLI)](https://github.com/Yelp/detect-secrets)

---

**Document créé le** : 20 mars 2026  
**Responsable** : Équipe de Sécurité  
**Dernière mise à jour** : En attente de remédiation
