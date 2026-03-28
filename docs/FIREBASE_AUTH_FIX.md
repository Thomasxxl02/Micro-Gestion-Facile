# 🐛 Fix: Firebase auth/operation-not-allowed Error

**Erreur:** `Firebase: Error (auth/operation-not-allowed)`  
**Cause:** Méthode d'authentification pas activée dans Firebase Console  
**Temps de fix:** 5-10 min

---

## 🚨 Diagnostic

### Vérifier la Configuration Actuelle

```bash
# 1. Ouvrir Firebase Console
https://console.firebase.google.com/project/micro-gestion-facile

# 2. Navigation
Authentication → Sign-in method

# 3. Vérifier la liste:
✅ Google - DOIT être: "Enabled"
✅ GitHub - DOIT être: "Enabled"
✅ Email/Password - DOIT être: "Enabled" (pour email link)
```

Faites une **screenshot** et partagez pour vérifier l'état! 📸

---

## ✅ Solution Complète: Activation Google + GitHub

### 📄 PART A: Enable Google OAuth

#### Step 1: Ouvrir Google Provider

```
1. Console Firebase
2. Authentication → Sign-in method
3. Cliquer sur "Google"
```

#### Step 2: Configuration Google

```
Dialog "Google Sign-in":

☑️ Enable (toggle ON)

Support Email:
  ↳ Choisir l'email du projet (ex: support@example.com)

Authorized domains:
  ↳ localhost (déjà ajouté)
  ↳ votre-domaine.com (si en prod)

Project public name:
  ↳ "Micro-Gestion-Facile"
```

#### Step 3: Sauvegarder

```
Cliquer "Save"
→ Vous verrez: "Authentication provider Google has been enabled"
```

---

### 📄 PART B: Enable GitHub OAuth

#### Step 1: Setup GitHub OAuth App (ONE-TIME)

**Sur GitHub:**

```
1. Aller: https://github.com/settings/developers
2. Cliquer: "New GitHub App" (ou "New OAuth App")
3. Remplir:

   Application name: Micro-Gestion-Facile

   Homepage URL: https://micro-gestion-facile.firebaseapp.com

   Authorization callback URL:
     https://micro-gestion-facile.firebaseapp.com/__/auth/handler

   ☑️ Request user authorization (OAuth) during installation: ON

   Permissions:
     - user:email (read)
     - read:user (read)

4. Cliquer "Create GitHub App" / "Register application"

5. Copier:
   - Client ID: xxxxxxxxxxxxxxxx
   - Client Secret: xxxxxxxxxxxxxxxx (generer si utile)
```

#### Step 2: Ajouter dans Firebase Console

**Dans Firebase:**

```
1. Console Firebase
2. Authentication → Sign-in method
3. Cliquer sur "GitHub"

Dialog "GitHub Sign-in":

☑️ Enable (toggle ON)

Client ID:
  ↳ Coller le Client ID de GitHub

Client secret:
  ↳ Coller le Client secret de GitHub

Authorized domains:
  ↳ localhost
  ↳ your-domain.com

4. Cliquer "Save"
   → Vous verrez: "Authentication provider GitHub has been enabled"
```

---

### 📄 PART C: Enable Email/Password (Pour "Email Magique")

```
1. Console Firebase
2. Authentication → Sign-in method
3. Cliquer sur "Email/Password"

Dialog "Email/Password Sign-in":

☑️ Enable (toggle ON)

Email/Password:
  ☑️ ON

Email link (passwordless sign-in):
  ☑️ ON  ← IMPORTANT pour votre feature!

4. Cliquer "Save"
```

---

## 🎯 Vérifier Après Configuration

### Test 1: Google OAuth

```
1. Aller sur http://localhost:5173 (votre app)
2. Cliquer "Se connecter avec Google"
3. Popup OAuth s'ouvre
4. Accepter
5. ✅ Devriez être connecté!
```

**Si erreur encore:**

```
Erreur "Invalid Client"?
→ Config client_secret wrong

Erreur "Unauthorized domain"?
→ Ajouter localhost dans Firebase Console
```

### Test 2: GitHub OAuth

```
1. Cliquer "Se connecter avec GitHub"
2. Redirect vers GitHub.com
3. Accepter
4. ✅ Devriez être connecté!
```

**Si erreur:**

```
Erreur "OAuth app not found"?
→ Client ID incorrect

Erreur "Redirect URI mismatch"?
→ L'URL callback ne match pas dans GitHub App
   Vérifier: https://[YOUR_PROJECT].firebaseapp.com/__/auth/handler
```

### Test 3: Email Link ("Lien Magique")

```
1. Entrer email: thomas@example.com
2. Cliquer "Recevoir un lien magique"
3. ✅ Vérifier Gmail → vous recevez un email avec lien
4. Cliquer lien dans email
5. ✅ Connecté!
```

---

## 🛠️ Troubleshooting

### ❌ Erreur: "operation-not-allowed"

→ **Cause:** Provider pas enabled  
→ **Fix:** Aller Firebase Console → Enable le provider

### ❌ Erreur: "Auth provider not configured"

→ **Cause:** Propriétés du provider incorrectes  
→ **Fix:** Vérifier Client ID/Secret exactement

### ❌ Erreur: "Unauthorized domain localhost"

→ **Cause:** localhost pas ajouté aux domaines autorisés  
→ **Fix:**

```
Firebase Console → Authentication → Settings
Authorized domains → Add domain "localhost"
```

### ❌ Erreur: "Invalid OAuth Redirect URI"

→ **Cause:** Callback URL ne match pas  
→ **Fix:**

```
GitHub App:
Authorization callback URL = https://[PROJECT].firebaseapp.com/__/auth/handler

Firebase Console:
Authorized domains = [PROJECT].firebaseapp.com
```

### ❌ Erreur: "Failed to find any matching provider"

→ **Cause:** Configuration JavaScript pas synchronisée  
→ **Fix:**

```typescript
// Vérifier firebase.ts: authDomain correct
import firebaseConfig from '../config/firebase-applet-config.json';

console.log('AuthDomain:', firebaseConfig.authDomain);
// Doit afficher: micro-gestion-facile.firebaseapp.com
```

---

## ✨ Checklist Final

Avant de tester:

- [ ] Google OAuth activé ✅
- [ ] GitHub OAuth activé ✅
- [ ] Email/Password activé ✅
- [ ] localhost dans "Authorized domains"
- [ ] Google Client ID/Secret correct
- [ ] GitHub Client ID/Secret correct
- [ ] `firebase-applet-config.json` a authDomain exact
- [ ] Restart dev server: `npm run dev`

---

## 📝 Code à Vérifier (déjà bon ✅)

Votre code Firebase est **correct**:

```typescript
// firebase.ts ✅ CORRECT
export const googleProvider = new GoogleAuthProvider();
export const githubProvider = new GithubAuthProvider();

githubProvider.addScope('user:email');
githubProvider.addScope('read:user');

export const loginWithGoogle = () => signInWithPopup(auth, googleProvider);
export const loginWithGitHub = () => signInWithPopup(auth, githubProvider);
```

Le problème est **100% Firebase Console** (auth methods pas enabled).

---

## 🚀 Après le Fix

Une fois tout activé:

1. Refresh page → `Ctrl+Shift+Delete` cache
2. Retry Google login
3. ✅ Devrait marcher!

---

## 📸 Screenshots Utiles

**Vous devriez voir dans Firebase Console:**

```
Sign-in method tab:

✅ Google          [Enabled]
✅ GitHub          [Enabled]
✅ Email/Password  [Enabled]
❌ Anonymous       (not needed)
```

---

**Besoin d'aide?** Shared une screenshot de votre Firebase Console, je peux vérifier directement! 🎯
