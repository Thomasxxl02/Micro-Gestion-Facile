# Checklist - Configuration GitHub OAuth

**Dernière mise à jour:** 27 mars 2026
**Responsable:** Thomas (Développeur)
**État:** À compléter

## 📋 Configuration GitHub

### Créer OAuth App GitHub

- [ ] Accédez à https://github.com/settings/developers
- [ ] Cliquez "New OAuth App"
- [ ] **Application name:** `Micro-Gestion-Facile`
- [ ] **Homepage URL:** `https://micro-gestion-facile.com`
- [ ] **Authorization callback URL (Production):**

```text
https://YOUR-PROJECT.firebaseapp.com/__/auth/handler
```

- [ ] **Authorization callback URL (Development):**

```text
http://localhost:5173/__/auth/handler
```

- [ ] Copiez **Client ID** → Bloc-notes temporaire
- [ ] Cliquez "Generate a new client secret"
- [ ] Copiez **Client Secret** → Bloc-notes temporaire
- [ ] ✅ Ne commitez JAMAIS ces secrets!

### Créer OAuth App secondaire pour développement local

- [ ] Répétez les étapes ci-dessus avec Authorization callback:

```text
http://localhost:5173/__/auth/handler
```

- [ ] Copiez les identifiants de DEV

## 🔥 Configuration Firebase

### Activer GitHub Provider

- [ ] Ouvrez [Firebase Console](https://console.firebase.google.com)
- [ ] Sélectionnez projet **micro-gestion-facile**
- [ ] Naviguez vers **Authentication** → **Sign-in method**
- [ ] Cliquez **GitHub**
- [ ] Activez le switch **Enable**
- [ ] Collez **Client ID** GitHub (PRODUCTION)
- [ ] Collez **Client Secret** GitHub (PRODUCTION)
- [ ] Cliquez **Save**
- [ ] ✅ Vérifiez que Firebase affiche votre URL de callback

### Configuration pour développement local

- [ ] Créez une deuxième Firebase App pour le développement (optionnel)
- [ ] Activez GitHub Provider avec les identifiants de DEV
- [ ] OU utilisez la même app avec deux OAuth Apps GitHub

## 💻 Configuration Locale

### Fichier `.env.local`

- [ ] Créez `c:\Users\Thomas\Micro-Gestion-Facile\.env.local`
- [ ] Ajoutez les variables Firebase:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_PROJECT_ID=micro-gestion-facile
VITE_FIREBASE_AUTH_DOMAIN=micro-gestion-facile.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=micro-gestion-facile.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789
VITE_FIREBASE_APP_ID=1:123456789:web:...
VITE_FIRESTORE_DATABASE_ID=(default)
```

- [ ] ✅ Ne commitez JAMAIS `.env.local`
- [ ] Vérifiez `.gitignore` inclut `.env.local`

### Vérifier `.gitignore`

- [ ] Ouvrez [.gitignore](.gitignore)
- [ ] Vérifiez que ces lignes existent:

```text
.env.local
.env.*.local
config/firebase-applet-config.json
```

- [ ] Si manquantes, ajoutez-les

## 🧪 Tests Locaux

### Test de connexion

- [ ] Démarrez le serveur Vite: `npm run dev`
- [ ] Ouvrez http://localhost:5173
- [ ] Cherchez le bouton **"Se connecter avec GitHub"**
- [ ] Cliquez le bouton
- [ ] La popup GitHub OAuth devrait s'ouvrir
- [ ] Autorisez l'application (cliquez "Authorize")
- [ ] Devriez être redirigé vers l'app connecté

### Vérifier l'intégration

- [ ] Profil utilisateur s'affiche correctement
- [ ] Photo de profil GitHub chargée
- [ ] Email visible
- [ ] Bouton **Déconnexion** fonctionne

### Tests des erreurs

- [ ] Testez Popup blocked:
  - [ ] Fermez le popup manuellement
  - [ ] Message d'erreur approprié affiché
  - [ ] Bouton retry disponible

- [ ] Testez Erreur réseau:
  - [ ] Désactiver Internet (F12 → Network devtools)
  - [ ] Cliquez login
  - [ ] Message d'erreur de réseau affiché
  - [ ] Retry automatique en cours

## 📝 Vérifications de Sécurité

### Scopes

- [ ] Vérifiez que only ces scopes sont demandés:
  1. `user:email` ✅
  2. `read:user` ✅
- [ ] Les scopes ne dépassent PAS ces deux

### Données sensibles

- [ ] ✅ `.env.local` n'est pas commité
- [ ] ✅ Client Secret n'existe que côté serveur (Firebase)
- [ ] ✅ Pas de secrets en commentaires du code
- [ ] ✅ Pas de secrets dans `package.json`

### Firestore Rules

- [ ] Vérifiez [firestore.rules](config/firestore.rules):

```firestore
match /users/{userId} {
  allow read: if request.auth.uid == userId;
  allow write: if request.auth.uid == userId;
}
```

## 📊 Vérifications Fonctionnelles

### Synchronisation Firestore

- [ ] Après login, vérifiez Firestore Console:
  - Allez à **Firestore Database**
  - Cherchez collection **users**
  - Vérifiez que le document utilisateur a été créé
  - Contient: `uid`, `email`, `displayName`, `provider: 'github'`

### Tests utilisateur

- [ ] Testez avec 2 comptes GitHub différents
- [ ] Chaque compte crée un document Firestore séparé
- [ ] Les données ne se mélangent pas

### Tests multi-appareil

- [ ] Connectez-vous sur computer
- [ ] Vérifiez que vous pouvez accéder l'app sur mobile/tablet
- [ ] Token Firebase se partage correctement

## 🚀 Déploiement Production

### Firebase Hosting

- [ ] Vérifiez que Authorization callback URL en Firebase est:

```text
https://micro-gestion-facile.firebaseapp.com/__/auth/handler
```

- [ ] ✅ DOIT correspondre exactement

### GitHub OAuth App

- [ ] Vérifiez que Authorization callback URL en GitHub est:

```text
https://YOUR-PROJECT.firebaseapp.com/__/auth/handler
```

### Domaine personnalisé

- [ ] Si vous avez un domaine personnalisé (ex: app.monbiz.fr):
  - [ ] Mettez à jour Homepage URL dans GitHub OAuth App
  - [ ] Mettez à jour Authorization callback URL dans GitHub OAuth App
  - [ ] Testez la connexion

## 📚 Documentation

### Mises à jour de documentation

- [ ] Lire [GITHUB_OAUTH_SETUP.md](docs/GITHUB_OAUTH_SETUP.md)
- [ ] Mettez à jour Privacy Policy pour inclure:

```markdown
  ## Authentification GitHub
  Nous utilisons GitHub OAuth pour authentifier les utilisateurs.
  - Nous ne stockons PAS vos données GitHub (repos, issues)
  - Vous pouvez révoquer l'accès depuis GitHub Settings
  ```

- [ ] Mettez à jour Terms of Service si needed

## 🐛 Dépannage

### Erreurs courantes

#### "Unauthorized OAuth app"

- [ ] Vérifiez que GitHub OAuth App est créée
- [ ] Vérifiez que Firebase a les bons identifiants
- [ ] Attendez 1-2 minutes pour propagation

#### "redirect_uri_mismatch"

- [ ] Authorization callback URL DOIT être identique dans:
  1. GitHub OAuth App settings
  2. Firebase Console
- [ ] Pas d'espaces, pas de / supplémentaires

#### "Popup blocked"

- [ ] Vérifiez que le clic est directement sur le bouton
- [ ] Pas de setTimeout() avant la connexion
- [ ] Autorisez les popups dans les paramètres du navigateur

#### "Network request failed"

- [ ] Vérifiez votre connexion Internet
- [ ] Vérifiez que Firebase hosting est accessible
- [ ] Vérifiez les logs Firebase Console

## ✅ Validation Finale

- [ ] Login/Logout fonctionne sans erreurs
- [ ] Profil utilisateur visible et correct
- [ ] Pas de secrets dans le code/logs
- [ ] Firestore synchronise correctement
- [ ] Tests unitaires passent: `npm run test`
- [ ] Coverage à jour: `npm run test:coverage`
- [ ] SonarQube scan: `npm run sonarqube`
- [ ] Build production réussit: `npm run build`

## 📞 Support

En cas de problème:

1. Vérifiez les logs du navigateur (F12)
2. Vérifiez Firebase Console → Logs
3. Vérifiez GitHub OAuth App settings
4. Voir [GITHUB_OAUTH_SETUP.md → Dépannage](docs/GITHUB_OAUTH_SETUP.md#dépannage)

---

**Status:** ⏳ En cours  
**Dernière mise à jour:** 27 mars 2026  
**Prochaine étape:** Configuration GitHub OAuth App
