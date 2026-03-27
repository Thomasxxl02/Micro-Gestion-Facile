# Quick Start - GitHub OAuth en 5 minutes

**Durée:** 5 min pour démarrer (30 min pour configurer correctement)  
**Niveau:** Débutant

---

## 🚀 Démarrage Rapide

### Étape 1: Configuration GitHub (5 min)

1. Allez à https://github.com/settings/developers
2. Cliquez **New OAuth App**
3. Remplissez:
   - **App name:** `Micro-Gestion-Facile`
   - **Homepage:** `https://micro-gestion-facile.com`
   - **Callback:** `https://YOUR-PROJECT.firebaseapp.com/__/auth/handler`
4. Copiez **Client ID** et **Client Secret**

### Étape 2: Configuration Firebase (5 min)

1. Firebase Console → **Authentication** → **Sign-in method**
2. Cliquez GitHub
3. Activez le switch
4. Collez **Client ID** et **Client Secret**
5. Cliquez **Save**

### Étape 3: Utilisation dans votre app (2 min)

```typescript
// app.tsx
import { GitHubLoginButton } from '@/components/GitHubLoginButton';

export function App() {
  return (
    <>
      <h1>Micro-Gestion-Facile</h1>
      <GitHubLoginButton />
    </>
  );
}
```

### Étape 4: Testez localement

```bash
npm run dev
# Ouvrez http://localhost:5173
# Cliquez "Se connecter avec GitHub"
```

---

## 📂 Fichiers pour comprendre

| Fichier | Utilisation | Lignes |
|---------|-----------|--------|
| [src/services/authService.ts](../src/services/authService.ts) | Logique d'authentification | 221 |
| [src/hooks/useGitHubAuth.ts](../src/hooks/useGitHubAuth.ts) | Hook pour composants | 170 |
| [src/components/GitHubLoginButton.tsx](../src/components/GitHubLoginButton.tsx) | Composant login | 215 |
| [docs/GITHUB_OAUTH_SETUP.md](./GITHUB_OAUTH_SETUP.md) | Documentation complète | 340 |

---

## 💡 Cas d'usage les plus courants

### 1. Juste un bouton login
```typescript
import { GitHubLoginButton } from '@/components/GitHubLoginButton';

<GitHubLoginButton />
```

### 2. Accéder aux infos utilisateur
```typescript
import { useGitHubAuth } from '@/hooks/useGitHubAuth';

const { user, isAuthenticated } = useGitHubAuth();

return isAuthenticated ? <h1>Hello {user?.displayName}</h1> : <Login />;
```

### 3. Bloc login/logout automatique
```typescript
import { GitHubLoginBlock } from '@/components/GitHubLoginButton';

<GitHubLoginBlock /> {/* Affiche login OU profil */}
```

### 4. Gestion avancée avec erreurs
```typescript
const { user, error, loginWithGitHub, logout } = useGitHubAuth();

if (error) return <div>Erreur: {error.message}</div>;
if (!user) return <button onClick={loginWithGitHub}>Login</button>;
return <button onClick={logout}>Logout</button>;
```

---

## ⚙️ Configuration locale `.env.local`

Créez le fichier à la racine du projet:

```env
VITE_FIREBASE_API_KEY=AIza...
VITE_FIREBASE_PROJECT_ID=micro-gestion-facile
VITE_FIREBASE_AUTH_DOMAIN=micro-gestion-facile.firebaseapp.com
VITE_FIRESTORE_DATABASE_ID=(default)
```

**Important:** Ce fichier ne doit PAS être commité (ajoutez à `.gitignore`)

---

## 🔐 Sécurité (obligatoire)

✅ **GitHub OAuth App - Authorization callback URL DOIT correspondre EXACTEMENT:**

```
Production:  https://YOUR-PROJECT.firebaseapp.com/__/auth/handler
Development: http://localhost:5173/__/auth/handler
```

✅ **Scopes autorisés (seulement):**
- `user:email` ✅
- `read:user` ✅

❌ **Scopes interdits:**
- `repo` ❌
- `admin` ❌
- Autres ❌

---

## 🐛 Erreurs courantes

| Erreur | Solution |
|--------|----------|
| "redirect_uri_mismatch" | Vérifiez URL callback exacte dans GitHub + Firebase |
| "Popup blocked" | Autorisez popups dans navigateur |
| "Network error" | Vérifiez Internet + Firebase status |
| "Unauthorized" | Vérifiez GitHub OAuth App est créée |

---

## 📖 Documentation complète

Pour plus de détails:
- [GITHUB_OAUTH_SETUP.md](./GITHUB_OAUTH_SETUP.md) - Configuration complète
- [GITHUB_OAUTH_CHECKLIST.md](./GITHUB_OAUTH_CHECKLIST.md) - Checklist étape par étape
- [GitHubAuth.example.tsx](../src/__tests__/GitHubAuth.example.tsx) - 5 exemples

---

## ✅ Prochaines étapes

1. **Configuration GitHub OAuth App** (5 min)
   → https://github.com/settings/developers

2. **Configuration Firebase** (5 min)
   → Firebase Console → Authentication

3. **Test local** (5 min)
   → `npm run dev` et testez le login

4. **Intégrer dans votre app** (10 min)
   → Copier-coller les exemples

---

**Créé:** 27 mars 2026  
**Temps estimé:** 30 min  
**Niveau:** Débutant ↔ Intermédiaire
