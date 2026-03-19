# 🔒 Guide de Remédiation - Clé API Google Divulguée

## ⚠️ Statut: URGENT - Clé API compromise

La clé API Google `AIzaSyAryNVYzN1uXwiaFhFPC5xSeW4neFRs7B4` a été divulguée publiquement dans le dépôt. Une action immédiate est requise.

---

## ✅ Actions Complétées

### 1. Sécurisation du dépôt

- [x] Ajout de `.env.local` et `firebase-applet-config.json` au `.gitignore`
- [x] Création de fichiers exemple (`.env.example`, `firebase-applet-config.example.json`)
- [x] Suppression de la clé compromise du fichier de configuration
- [x] Modification de `firebase.ts` pour charger depuis les variables d'environnement
- [x] Remplacement de la clé compromise par un placeholder

### 2. Structure Sécurisée Mise en Place

```
.env.local                          # ← À ne JAMAIS commiter
.env.example                        # ← Template pour les contributeurs
firebase-applet-config.json         # ← À ne JAMAIS commiter
firebase-applet-config.example.json # ← Template obligatoire
```

---

## 🔴 Actions Requises (À FAIRE IMMÉDIATEMENT PAR L'UTILISATEUR)

### Étape 1: Révoquer la Clé Compromise

1. Accédez à [Google Cloud Console](https://console.cloud.google.com)
2. Sélectionnez le projet: **gen-lang-client-0231981865**
3. Allez dans: **APIs & Services** → **Credentials**
4. Trouvez la clé API: `AIzaSyAryNVYzN1uXwiaFhFPC5xSeW4neFRs7B4`
5. Cliquez sur **Delete** ou **Disable**
6. ⚠️ Confirmez la suppression

### Étape 2: Générer une Nouvelle Clé API

1. Dans Google Cloud Console, cliquez sur **+ Create Credentials**
2. Choisissez **API Key**
3. Sélectionnez **Browser (Web browsers)**
4. Copiez la nouvelle clé générée
5. Ajoutez des **API Restrictions**:
   - ✅ Firestore API
   - ✅ Firebase Hosting API
   - ✅ Firebase Rules API

### Étape 3: Mettre à Jour les Secrets Locaux

1. Ouvrez `.env.local`
2. Remplacez `REPLACE_WITH_YOUR_NEW_API_KEY` par votre nouvelle clé
3. Sauvegardez le fichier
4. **NE LE COMMITTEZ PAS**

```bash
# .env.local
VITE_FIREBASE_PROJECT_ID=gen-lang-client-0231981865
VITE_FIREBASE_API_KEY=AIzaSy... (NOUVELLE CLÉ)
...
```

### Étape 4: Vérifier les Logs de Sécurité

1. Dans [Firebase Console](https://console.firebase.google.com):
   - Allez dans **Project Settings** → **Usage and Billing**
   - Vérifiez les accès et statistiques
2. Vérifiez l'**Activity Log** pour détecter tout accès suspect
3. Vérifiez les **Firestore Usage Metrics**

### Étape 5: Configurer les Restrictions API

Dans Google Cloud Console:

1. **APIs & Services** → votre nouvelle **clé API**
2. **API Restrictions** → Ajouter uniquement les APIs utilisées:
   - Firestore API
   - Firebase Rules API
   - (Ajouter d'autres si nécessaire)
3. **HTTP Referrers** → Restreindre aux domaines de production

---

## 🚀 Configuration pour le Développement

### Installation Locale

```bash
# 1. Copier le fichier exemple
cp .env.example .env.local

# 2. Éditer .env.local avec votre nouvelle clé
# Remplacer: VITE_FIREBASE_API_KEY=votre_nouvelle_clé

# 3. Relancer le serveur
npm run dev
```

### Variables Disponibles

- `VITE_FIREBASE_PROJECT_ID` - ID du projet Firebase
- `VITE_FIREBASE_API_KEY` - **Nouvelle clé API**
- `VITE_FIREBASE_APP_ID` - ID de l'application
- `VITE_FIREBASE_AUTH_DOMAIN` - Domaine d'authentification
- `VITE_FIREBASE_FIRESTORE_DATABASE_ID` - ID de la base Firestore
- `VITE_FIREBASE_STORAGE_BUCKET` - Bucket de stockage
- `VITE_FIREBASE_MESSAGING_SENDER_ID` - ID pour Cloud Messaging
- `GEMINI_API_KEY` - Clé API Gemini (si utilisée)

---

## 📋 Checklist de Fermeture

- [ ] Clé compromise revoquée dans Google Cloud Console
- [ ] Nouvelle clé API créée
- [ ] `.env.local` configuré avec la nouvelle clé
- [ ] `.env.local` et `firebase-applet-config.json` ignorés (vérifier `.gitignore`)
- [ ] Logs de sécurité vérifiés (pas d'accès suspects)
- [ ] API restreintes à la nouvelle clé
- [ ] Serveur de développement redémarré et fonctionne
- [ ] Alerte GitHub fermée comme "Revoked" (clé compromise)

---

## 🛡️ Bonnes Pratiques à Partir de Maintenant

1. **JAMAIS** commiter de fichiers contenant des secrets

   ```bash
   # ✅ Toujours ignorer ces fichiers
   .env.local
   .env.production.local
   firebase-applet-config.json
   secrets/ (s'il existe)
   ```

2. **Utiliser des variables d'environnement** pour tous les secrets

   ```typescript
   const apiKey = import.meta.env.VITE_FIREBASE_API_KEY;
   ```

3. **Rotationner les clés régulièrement** (mensuellement recommandé)

4. **Auditer les commits** avant de pusher

   ```bash
   git diff --cached  # Vérifier les changements
   git log -p        # Vérifier l'historique
   ```

5. **Utiliser des outils de détection**:
   - GitHub Secret Scanning (déjà activé)
   - `git-secrets` (hook pré-commit)
   - Trivy, TruffleHog (scanning)

---

## 📚 Ressources Utiles

- [Google Cloud - API Keys Management](https://cloud.google.com/docs/authentication/api-keys)
- [GitHub - Secret Scanning](https://docs.github.com/en/code-security/secret-scanning)
- [Firebase Security Best Practices](https://firebase.google.com/docs/rules)
- [12 Factor App - Secrets Management](https://12factor.net/config)

---

⚠️ **Cette alerte ne pourra être fermée que lorsque**:

1. La clé originale aura été revoquée
2. Une nouvelle clé aura remplacé l'ancienne
3. Les logs de sécurité auront été vérifiés
