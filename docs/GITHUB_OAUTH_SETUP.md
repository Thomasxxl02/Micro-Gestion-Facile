# Configuration GitHub OAuth - Guide Complet

**Dernière mise à jour:** 27 mars 2026  
**Version:** 2.0 (OAuth 2.0 sécurisé)  
**État:** ✅ Production-ready

## 📋 Table des matières

1. [Configuration GitHub OAuth](#configuration-github-oauth)
2. [Configuration Firebase](#configuration-firebase)
3. [Utilisation dans l'application](#utilisation-dans-lapplication)
4. [Sécurité et bonnes pratiques](#sécurité-et-bonnes-pratiques)
5. [Dépannage](#dépannage)
6. [Politiques et données](#politiques-et-données)

---

## Configuration GitHub OAuth

### Étape 1 : Créer une OAuth App sur GitHub

1. **Accédez aux paramètres GitHub**
   - Connectez-vous à [github.com](https://github.com)
   - Allez à **Settings** → **Developer settings** → **OAuth Apps**
   - Cliquez sur **New OAuth App**

2. **Remplissez le formulaire**

   | Champ                          | Valeur                                                 | Notes                                |
   | ------------------------------ | ------------------------------------------------------ | ------------------------------------ |
   | **Application name**           | `Micro-Gestion-Facile`                                 | Nom affiché aux utilisateurs         |
   | **Homepage URL**               | `https://micro-gestion-facile.com`                     | URL de votre PWA                     |
   | **Authorization callback URL** | `https://YOUR_PROJECT.firebaseapp.com/__/auth/handler` | **Important!** Voir section Firebase |
   | **Webhook URL**                | (Optionnel)                                            | Pour intégrations futures            |

3. **Récupérez les identifiants**
   - Copiez **Client ID**
   - Cliquez "Generate a new client secret" et copiez-le
   - **⚠️ IMPORTANT**: Ne commitez JAMAIS ces secrets sur GitHub

### Configuration pour développement local

Pour tester localement, ajoutez une OAuth App secondaire :

```
Authorization callback URL: http://localhost:5173/__/auth/handler
```

---

## Configuration Firebase

### Étape 2 : Activer GitHub Provider dans Firebase

1. **Dans Firebase Console**
   - Allez à **Authentication** → **Sign-in method**
   - Cliquez sur **GitHub**
   - Cochez **Enable**

2. **Entrez les identifiants GitHub**
   - Collez le **Client ID** GitHub
   - Collez le **Client Secret** GitHub
   - Cliquez **Save**

3. **Vérifiez les URI autorisées**
   - Firebase affiche automatiquement votre URL de callback
   - Elle doit correspondre au format: `https://YOUR_PROJECT.firebaseapp.com/__/auth/handler`

### Étape 3 : Configuration locale (.env)

Créez un fichier `.env.local` à la racine du projet :

```env
# Firebase Config (depuis firebase-applet-config.json)
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_PROJECT_ID=micro-gestion-facile
VITE_FIREBASE_AUTH_DOMAIN=micro-gestion-facile.firebaseapp.com
VITE_FIREBASE_STORAGE_BUCKET=micro-gestion-facile.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=123456789...
VITE_FIREBASE_APP_ID=1:123456789:web:...
VITE_FIRESTORE_DATABASE_ID=(default)

# GitHub OAuth (optionnel pour tests directs)
VITE_GITHUB_CLIENT_ID=your_client_id_here
```

**Avertissement de sécurité** ⚠️

- N'incluez JAMAIS `Client Secret` côté client
- `Client Secret` ne doit être utilisé que côté serveur
- Firebase gère automatiquement cette sécurité

---

## Utilisation dans l'application

### Composant Simple (Bouton Login)

```typescript
import { GitHubLoginButton } from '@/components/GitHubLoginButton';

function LoginPage() {
  return (
    <GitHubLoginButton
      onSuccess={(username) => {
        console.log(`Connecté en tant que ${username}`);
        // Rediriger vers dashboard
      }}
      onError={(error) => {
        console.error('Erreur login:', error);
      }}
    />
  );
}
```

### Hook complet (useGitHubAuth)

```typescript
import { useGitHubAuth } from '@/hooks/useGitHubAuth';

function Dashboard() {
  const {
    user,           // User Firebase
    profile,        // UserProfile (données Firestore)
    isLoading,      // Loading state
    error,          // Erreur actuelle
    isAuthenticated, // Boolean
    loginWithGitHub,
    logout,
    refreshProfile,
    clearError,
  } = useGitHubAuth();

  if (!isAuthenticated) {
    return <Login />;
  }

  return (
    <div>
      <h1>Bienvenue {profile?.displayName}</h1>
      <button onClick={logout}>Déconnexion</button>
    </div>
  );
}
```

### Hook simplifié (useSimpleGitHubAuth)

```typescript
import { useSimpleGitHubAuth } from '@/hooks/useGitHubAuth';

function SimpleLogin() {
  const { user, isLoading, error, isAuthenticated, login, logout } =
    useSimpleGitHubAuth();

  if (isAuthenticated) {
    return <button onClick={logout}>Logout {user?.displayName}</button>;
  }

  return (
    <>
      <button onClick={login} disabled={isLoading}>
        {isLoading ? 'Loading...' : 'Login with GitHub'}
      </button>
      {error && <p style={{ color: 'red' }}>{error.message}</p>}
    </>
  );
}
```

### Composant bloc complet (GitHubLoginBlock)

```typescript
import { GitHubLoginBlock } from '@/components/GitHubLoginButton';

function Header() {
  return (
    <header>
      <h1>Micro-Gestion-Facile</h1>
      <GitHubLoginBlock /> {/* Affiche login OU infos utilisateur */}
    </header>
  );
}
```

---

## Sécurité et bonnes pratiques

### 🔐 Authentification Sécurisée

#### Scopes requis

```typescript
githubProvider.addScope('user:email'); // Email public/privé
githubProvider.addScope('read:user'); // Profil public
```

**Ne demandez jamais :**

- ❌ `repo` - Accès aux repositories
- ❌ `admin:*` - Accès administrateur
- ❌ `delete_repo` - Suppression de repos

#### Gestion du Secret Client

```typescript
// ❌ MAUVAIS - Ne jamais côté client
const SECRET = 'gh_pat_...'; // En clair dans le code

// ✅ BON - Firebase gère automatiquement
// L'échange de token se fait côté serveur (Firebase)
```

### 🛡️ Données sensibles

#### Chiffrement des données Firestore

Pour IBAN, SIRET etc. - Utilisez le service de sécurité :

```typescript
import { encryptSensitiveData } from '@/services/securityService';

await updateUserProfile(userId, {
  encryptedIBAN: encryptSensitiveData(iban),
  encryptedSIRET: encryptSensitiveData(siret),
});
```

### 🔄 Rafraîchissement des tokens

Firebase gère automatiquement le rafraîchissement des tokens. Mais vous pouvez forcer une réauthentification pour les opérations sensibles :

```typescript
import { GitHubAuthService } from '@/services/authService';

const authService = new GitHubAuthService(auth, db);

// Avant suppression de compte ou changement d'email
await authService.reauthenticateWithGitHub(user);
```

### 📋 Règles Firestore

Appliquez ces règles pour sécuriser les données utilisateur :

```firestore
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Utilisateurs ne peuvent lire/écrire que leur propre profil
    match /users/{userId} {
      allow read: if request.auth.uid == userId;
      allow write: if request.auth.uid == userId &&
                      request.auth.provider == 'github';

      // Audit trail (lecture seule)
      match /loginHistory/{doc=**} {
        allow read: if request.auth.uid == userId;
      }
    }

    // Données publiques en lecture seule
    match /invoices/{invoiceId} {
      allow read: if request.auth.uid == resource.data.ownerId;
      allow write: if request.auth.uid == resource.data.ownerId;
    }
  }
}
```

### 🚫 Protection contre les attaques courantes

#### CSRF (Cross-Site Request Forgery)

✅ **Firebase gère automatiquement via OAuth 2.0** - State parameter validé

#### Réinjection de session

✅ **Firebase gère automatiquement** - Tokens signés et expirables (1 heure)

#### Capture d'écran de secrets

⚠️ **À votre charge** - Utilisez `.env.local` (non commité)

---

## Dépannage

### Erreur: "Unauthorized OAuth app"

**Symptôme:** Erreur lors de la tentative de connexion
**Solution:**

```
1. Vérifiez que GitHub OAuth App est activée
2. Vérifiez l'Authorization callback URL:
   - Production: https://YOUR-PROJECT.firebaseapp.com/__/auth/handler
   - Dev local:  http://localhost:5173/__/auth/handler
3. Si changé, mettez à jour dans Firebase Console
```

### Erreur: "redirect_uri_mismatch"

**Symptôme:** "The redirect_uri parameter does not match..."
**Solution:**

```
1. Ouvrez GitHub Settings → Developer settings → OAuth Apps
2. Éditez l'app "Micro-Gestion-Facile"
3. Vérifiez Authorization callback URL exacte
4. Doit correspondre EXACTEMENT à celle dans Firebase
5. Attendez 1-2 minutes pour propagation
```

### Erreur: "Popup blocked"

**Symptôme:** "Failed to call signInWithPopup"
**Solution:**

```typescript
// L'erreur apparaît si:
// - Popup blocker active
// - Clic n'est pas direct (ça vient d'un callback async)

// ✅ BON: événement direct
button.addEventListener('click', loginWithGitHub);

// ❌ MAUVAIS: callback asynchrone
setTimeout(() => loginWithGitHub(), 1000);
```

### Erreur: "NETWORK ERROR"

**Symptôme:** Network request failed (surtout offline)
**Solution:**

- L'app retry automatiquement 3 fois (exponential backoff)
- Vérifiez votre connexion Internet
- Vérifiez que Firebase est accessible

---

## Politiques et données

### 📊 Données collectées par GitHub OAuth

Lorsqu'un utilisateur se connecte, GitHub partage **via Firebase** :

- ✅ Email (public et privé selon préférences)
- ✅ Nom d'affichage
- ✅ Photo de profil
- ✅ ID public GitHub
- ❌ Historique des repositories
- ❌ Données privées

### 🔒 Données stockées par Micro-Gestion-Facile

```typescript
// Document utilisateur (Firestore)
{
  uid: 'google-oauth2|...',
  email: 'user@example.com',
  displayName: 'John Doe',
  photoURL: 'https://avatars.githubusercontent.com/...',
  provider: 'github',
  githubUsername: 'johndoe',
  createdAt: Timestamp,
  lastLoginAt: Timestamp,
  isVerified: true,
  preferredMFA: 'totp',
}
```

### 🗑️ Suppression de compte

Pour supporter le RGPD, implémentez :

```typescript
async function deleteUserAccount(userId: string) {
  const authService = new GitHubAuthService(auth, db);

  // 1. Reconnecter l'utilisateur (confirmation)
  await authService.reauthenticateWithGitHub(auth.currentUser!);

  // 2. Supprimer les données Firestore (cascade)
  await deleteDoc(doc(db, 'users', userId));

  // 3. Supprimer l'utilisateur Firebase
  await deleteUser(auth.currentUser!);

  // 4. Logger l'événement
  console.log(`User ${userId} supprimé - RGPD compliance`);
}
```

### 📋 Politique de confidentialité

Mettez à jour votre privacy policy pour inclure :

```markdown
## Authentification via GitHub

Nous utilisons GitHub OAuth pour authentifier les utilisateurs.

- Nous ne stockons PAS vos données GitHub (repos, issues, etc.)
- Vous pouvez déconnecter l'app depuis vos paramètres GitHub
- Vos données privées ne sont jamais partagées
```

---

## Variables d'environnement requises

Ajoutez à votre `.env.local` :

```env
# Firebase
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_PROJECT_ID=micro-gestion-facile
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIRESTORE_DATABASE_ID=(default)

# Optional - untuk testing direct
VITE_GITHUB_CLIENT_ID=...
```

**Fichiers à ne jamais commiter :**

```
.env.local          # Variables sensibles locales
.env.*.local        # Variantes locales
config/firebase-applet-config.json  # Si secrets
```

---

## En cas de problème

### Support et contact

1. **Vérifiez les logs du navigateur** (F12 → Console)
2. **Consultez Firebase Console** → Authentication → Sign-in method
3. **Testez avec un compte GitHub secondaire**
4. **Vérifiez votre connexion Internet**

### Ressources officielles

- [Firebase Authentication Docs](https://firebase.google.com/docs/auth)
- [GitHub OAuth Documentation](https://docs.github.com/en/developers/apps/building-oauth-apps)
- [IETF OAuth 2.0](https://tools.ietf.org/html/rfc6749)

---

**Dernière mise à jour:** 27 mars 2026  
**Auteur:** Micro-Gestion-Facile Development Team  
**Licence:** MIT
