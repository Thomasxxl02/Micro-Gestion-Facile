# ✅ Checklist Configuration GitHub OAuth

**Date:** 19 avril 2026  
**Application:** Micro-Gestion-Facile  
**État:** 🔄 En configuration

---

## 📝 Étapes à suivre (Copier-Coller Ready)

### 🔹 Étape 1 : Description de l'application

Allez sur : https://github.com/settings/developers  
Cliquez sur votre app **Micro-Gestion-Facile**

**Collez cette description dans le champ "Application description" :**

```
Application de gestion complète pour micro-entrepreneurs français.
Facturation conforme, suivi fiscal URSSAF, comptabilité simplifiée.
PWA sécurisée avec données chiffrées localement (RGPD-compliant).
```

**Version courte alternative (si limite de caractères) :**

```
Gestion pour micro-entrepreneurs : facturation, fiscal URSSAF, comptabilité. PWA sécurisée et RGPD.
```

✅ **Fait** : [ ]

---

### 🎨 Étape 2 : Logo de l'application

**Fichier créé :** `public/logo.svg`

**Instructions pour créer le PNG 512x512px :**

**Option A - Avec un outil en ligne (recommandé) :**

1. Allez sur https://svgtopng.com ou https://cloudconvert.com/svg-to-png
2. Uploadez le fichier `public/logo.svg`
3. Configurez la taille : **512x512 pixels**
4. Téléchargez le PNG résultant
5. Uploadez-le sur GitHub OAuth settings

**Option B - Avec Inkscape (local) :**

```powershell
# Si Inkscape est installé
inkscape public/logo.svg --export-type=png --export-width=512 --export-height=512 -o public/logo.png
```

**Option C - Avec PowerShell et navigateur :**

1. Ouvrez le fichier SVG dans votre navigateur
2. Utilisez l'outil de capture d'écran Windows (Win + Shift + S)
3. Retaillez à 512x512px avec Paint ou Paint 3D

✅ **Logo uploadé sur GitHub** : [ ]

---

### 🎨 Étape 3 : Couleur du badge

**Dans GitHub OAuth Settings, section "Badge background color" :**

**Nouvelle valeur à saisir :**

```
#2563eb
```

**Rendu visuel :** Bleu professionnel (cohérent avec le thème de l'app)

**Alternatives :**

- Vert comptable : `#059669`
- Gris foncé élégant : `#1f2937`

✅ **Fait** : [ ]

---

### 🔗 Étape 4 : URLs de callback

**Dans GitHub OAuth Settings, section "Authorization callback URLs" :**

**Ajoutez ces 4 URLs (cliquez sur "Add" pour chaque ligne) :**

```
https://micro-gestion-facile.firebaseapp.com/__/auth/handler
http://localhost:5173/__/auth/handler
http://localhost:4173/__/auth/handler
http://127.0.0.1:5173/__/auth/handler
```

**Explication :**

- Ligne 1 : Production (Firebase Hosting)
- Ligne 2 : Développement local (Vite dev server)
- Ligne 3 : Preview local (Vite preview)
- Ligne 4 : Alternative localhost (au cas où)

**Si vous avez un domaine custom, ajoutez aussi :**

```
https://micro-gestion-facile.com/__/auth/handler
https://www.micro-gestion-facile.com/__/auth/handler
```

✅ **Fait** : [ ]

---

### 🧪 Étape 5 : Tester la connexion

#### **5.1 - Test en développement local**

```powershell
# Dans le terminal PowerShell
cd C:\Users\Thomas\Micro-Gestion-Facile
npm run dev
```

Puis :

1. Ouvrez http://localhost:5173 dans votre navigateur
2. Cliquez sur "Se connecter avec GitHub"
3. Vérifiez que la popup GitHub s'ouvre
4. Autorisez l'application
5. Vérifiez que vous êtes redirigé et connecté

**Checklist de test dev :**

- [ ] Popup GitHub s'ouvre
- [ ] Autorisation demandée
- [ ] Redirection fonctionne
- [ ] Nom d'utilisateur affiché
- [ ] Aucune erreur dans la console (F12)

#### **5.2 - Test en production**

```powershell
# Build de production
npm run build

# Preview local (simulation prod)
npm run preview
```

Puis :

1. Ouvrez http://localhost:4173
2. Répétez les tests ci-dessus

**Checklist de test prod :**

- [ ] Build réussit sans erreur
- [ ] Preview fonctionne
- [ ] Connexion GitHub OK
- [ ] Performance acceptable

#### **5.3 - Test après déploiement Firebase**

```powershell
# Déployer sur Firebase (si configuré)
firebase deploy --only hosting
```

Puis :

1. Allez sur https://micro-gestion-facile.firebaseapp.com
2. Testez la connexion GitHub
3. Vérifiez les données Firestore (Firebase Console)

**Checklist de test Firebase :**

- [ ] Déploiement réussi
- [ ] Site accessible en HTTPS
- [ ] OAuth fonctionne
- [ ] Profil créé dans Firestore
- [ ] Pas d'erreur de sécurité (Firestore Rules)

✅ **Tous les tests passent** : [ ]

---

## 🔒 Vérifications de sécurité

Avant de valider, vérifiez :

- [ ] **Client Secret jamais committé** dans Git
- [ ] **`.env.local` dans `.gitignore`** (pas `.env`)
- [ ] **Firestore Rules actives** (seulement `uid` du propriétaire)
- [ ] **HTTPS uniquement en prod** (pas de HTTP)
- [ ] **Email admin protégé** dans les Firestore Rules

```bash
# Vérifier qu'aucun secret n'est committé
git log --all --full-history --source -- "*env*" | grep -i "secret"
```

---

## 📊 Résumé visuel de la configuration

```
┌─────────────────────────────────────────────────────────────┐
│  GITHUB OAUTH APP SETTINGS                                  │
├─────────────────────────────────────────────────────────────┤
│  Application Name: Micro-Gestion-Facile                     │
│  Homepage URL: https://micro-gestion-facile.firebaseapp.com │
│  Description: Application de gestion complète pour micro... │
│  Logo: [logo-512x512.png] ✅                                │
│  Badge Color: #2563eb (Bleu professionnel) ✅               │
├─────────────────────────────────────────────────────────────┤
│  CALLBACK URLs:                                             │
│    ✅ https://...firebaseapp.com/__/auth/handler            │
│    ✅ http://localhost:5173/__/auth/handler                 │
│    ✅ http://localhost:4173/__/auth/handler                 │
│    ✅ http://127.0.0.1:5173/__/auth/handler                 │
├─────────────────────────────────────────────────────────────┤
│  Client ID: Ov23libsQBrUrVNwbfK2                            │
│  Client Secret: *****c774a008 (NE PAS PARTAGER)            │
└─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Après configuration

Une fois toutes les cases cochées, vous pouvez :

1. **Tester en conditions réelles** avec de vrais utilisateurs
2. **Surveiller les connexions** dans Firebase Authentication
3. **Configurer GitHub Marketplace** (optionnel) pour référencer l'app
4. **Ajouter des métriques** pour suivre les connexions
5. **Documenter le processus** pour les futurs contributeurs

---

## 🆘 Dépannage rapide

| Problème                | Solution                                                 |
| ----------------------- | -------------------------------------------------------- |
| "Callback URL mismatch" | Vérifiez que l'URL dans GitHub correspond EXACTEMENT     |
| "Client Secret invalid" | Régénérez le secret dans GitHub + mettez à jour Firebase |
| "Popup bloquée"         | Autorisez les popups pour localhost dans le navigateur   |
| "Network error"         | Vérifiez que Firebase Auth est activé (Console)          |
| "Permission denied"     | Vérifiez les Firestore Rules (`uid` requis)              |

**Logs utiles :**

```javascript
// Dans la console du navigateur (F12)
localStorage.getItem("githubAuthState");
console.log(firebase.auth().currentUser);
```

---

## 📚 Documentation connexe

- [Guide complet OAuth](./GITHUB_OAUTH_SETUP.md)
- [Sécurité Firebase](./SECURITY_GUIDE.md)
- [Firestore Rules](./FIRESTORE_SECURITY_AUDIT_2026-04-18.md)
- [PWA Service Worker](./PWA_SERVICE_WORKER_GUIDE.md)

---

**Dernière mise à jour :** 19 avril 2026  
**Auteur :** GitHub Copilot + Thomas  
**Version :** 1.0
