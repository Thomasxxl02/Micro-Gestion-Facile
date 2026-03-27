# 🔐 Guide Détaillé : Révocation et Régénération des Clés API

**Objectif** : Révoquer les 2 clés exposées et générer de nouvelles clés sécurisées.  
**Temps estimé** : 15 minutes  
**Difficulté** : Facile ⭐

---

## 1️⃣ Révoquer la Firebase API Key

### Étape 1.1 : Accéder à Google Cloud Console

```
URL : https://console.cloud.google.com/apis/credentials
```

**Actions** :

1. Ouvrir le lien dans un navigateur
2. Se connecter avec ton compte Google (celui associé au projet Firebase)
3. **Sélectionner le projet** "micro-gestion-facile" ou similaire
   - Dropdown en haut à gauche → Chercher ton projet

### Étape 1.2 : Trouver et supprimer la clé

**Navigation** :

1. Menu latéral → **"APIs & Services"** → **"Credentials"**
2. Onglet **"API Keys"**
3. Chercher la clé : `AIzaSyAryNVYzN1uXwiaFhFPC5xSeW4neFRs7B4`

**Suppression** :

1. Cliquer sur la clé pour l'ouvrir
2. En haut à droite : bouton **"Delete"** (ou les trois points ⋮ → Delete)
3. Confirmer : **"Delete"** dans la boîte de dialogue

✅ **La clé est maintenant révoquée et inutilisable**

---

## 2️⃣ Générer une nouvelle Firebase API Key

### Étape 2.1 : Créer la nouvelle clé

**Dans Google Cloud Console** (même endroit) :

1. Bouton bleu **"+ CREATE CREDENTIALS"**
2. Sélectionner **"API Key"**
3. Une nouvelle clé est générée automatiquement
4. **Copier la clé** (maintenant visible à l'écran)
   - Format : `AIzaSy...` (longue chaîne)

### Étape 2.2 : Ajouter les restrictions

**IMPORTANT** : Limiter l'usage pour la sécurité

1. Cliquer sur la nouvelle clé pour l'ouvrir
2. Scroll jusqu'à **"Key restrictions"**
3. Changer **"Application restrictions"** de "None" à **"HTTP referrers"**
4. Ajouter les domaines autorisés :
   ```
   https://micro-gestion-facile.vercel.app
   http://localhost:*
   https://localhost:*
   ```
5. Ajouter les **"API restrictions"** :
   - [ ] Activé
   - [ ] Sélectionner :
     - ✓ Cloud Firestore API
     - ✓ Firebase App Check API
     - ✓ Cloud Pub/Sub API (si utilisé)
6. Cliquer **"Save"**

✅ **La nouvelle Firebase Key est sécurisée et prête**

---

## 3️⃣ Révoquer la Gemini API Key

### Étape 3.1 : Accéder à Google AI Studio

```
URL : https://aistudio.google.com/apikey
```

**Actions** :

1. Ouvrir le lien (ou aller sur aistudio.google.com → API Keys)
2. **Sélectionner le même projet** Firebase

### Étape 3.2 : Trouver et supprimer la clé

**Navigation** :

1. Onglet **"API Keys"**
2. Chercher l'ancienne clé : `AIzaSyBXejKbJpVWxARCRP3hYroCEbREQiVWbiE`

**Suppression** :

1. Cliquer sur la clé
2. Bouton **"Delete"** (ou trois points ⋮)
3. Confirmer la suppression

✅ **La Gemini Key est révoquée**

---

## 4️⃣ Générer une nouvelle Gemini API Key

### Étape 4.1 : Créer la nouvelle clé

**Dans Google AI Studio** :

1. Bouton **"+ Create API Key"**
2. Sélectionner **le projet Firebase** (dropdown)
3. Une nouvelle clé est générée
4. **Copier la clé**
   - Format : `AIzaSy...` (longue chaîne)

### Étape 4.2 : Ajouter les restrictions

1. Cliquer sur la clé pour l'ouvrir
2. Scroll jusqu'à **"API restrictions"**
3. Sélectionner :
   - ✓ Generative Language API (ou Google AI API)
4. Cliquer **"Save"**

✅ **La nouvelle Gemini Key est prête**

---

## 5️⃣ Mettre à jour GitHub Secrets

### Étape 5.1 : Accéder à GitHub Secrets

```
URL : https://github.com/Thomasxxl02/Micro-Gestion-Facile/settings/secrets/actions
```

**Actions** :

1. Ouvrir le lien
2. Se connecter si nécessaire
3. Vérifier que tu es dans le bon repo

### Étape 5.2 : Mettre à jour VITE_FIREBASE_API_KEY

**Navigation** :

1. Section **"Repository secrets"**
2. Cliquer sur **`VITE_FIREBASE_API_KEY`**
3. Cliquer sur **"Update secret"**
4. **Coller la nouvelle clé** (celle générée à l'étape 2.1)
5. Cliquer **"Update secret"**

✅ **GitHub Secret mis à jour**

### Étape 5.3 : Mettre à jour GEMINI_API_KEY

**Même procédure** :

1. Cliquer sur **`GEMINI_API_KEY`**
2. **"Update secret"**
3. **Coller la nouvelle clé** (celle générée à l'étape 4.1)
4. **"Update secret"**

✅ **Tous les secrets sont à jour**

---

## 6️⃣ Vérifier les Mises à Jour

### Étape 6.1 : Déclencher un nouveau build

**Créer un commit vide pour tester** :

```bash
git commit --allow-empty -m "test: Validate new API keys in GitHub Actions"
git push
```

### Étape 6.2 : Vérifier que le build réussit

1. Aller à : https://github.com/Thomasxxl02/Micro-Gestion-Facile/actions
2. Cliquer sur le dernier workflow
3. Vérifier que **tous les jobs passent** ✅
4. Vérifier que les logs ne contiennent pas les anciennes clés

### Étape 6.3 : Tester en local

```bash
# Updater .env.local avec les nouvelles clés
echo "VITE_FIREBASE_API_KEY=AIzaSy..." > .env.local
echo "GEMINI_API_KEY=AIzaSy..." >> .env.local

# Tester le build
npm run build

# Tester les tests
npm test -- --run

# Tester le dev server
npm run dev
```

✅ **Tout fonctionne avec les nouvelles clés**

---

## 7️⃣ (Optionnel) Nettoyer l'Historique Git

⚠️ **ATTENTION** : Cette étape est optionnelle mais recommandée

### Étape 7.1 : Installer BFG

```bash
npm install -g bfg
```

### Étape 7.2 : Créer le fichier de secrets à supprimer

**Créer `secrets.txt`** :

```bash
cat > secrets.txt << 'EOF'
AIzaSyAryNVYzN1uXwiaFhFPC5xSeW4neFRs7B4
AIzaSyBXejKbJpVWxARCRP3hYroCEbREQiVWbiE
EOF
```

### Étape 7.3 : Exécuter BFG

```bash
bfg --replace-text secrets.txt
```

### Étape 7.4 : Forcer le push

```bash
git push --force
```

⚠️ **Avertissement** :

- Tous les contributeurs doivent refaire : `git clone`
- Les branches feature doivent être rebasées
- Les pull requests doivent être fermées et recréées

---

## ✅ Checklist Finale

- [ ] Firebase API Key supprimée
- [ ] Nouvelle Firebase API Key générée
- [ ] Restrictions appliquées à la Firebase Key
- [ ] Gemini API Key supprimée
- [ ] Nouvelle Gemini API Key générée
- [ ] Restrictions appliquées à la Gemini Key
- [ ] GitHub Secret VITE_FIREBASE_API_KEY mis à jour
- [ ] GitHub Secret GEMINI_API_KEY mis à jour
- [ ] Build GitHub Actions réussi (vert ✅)
- [ ] Logs GitHub Actions ne contiennent pas les anciennes clés
- [ ] Tests locaux passent (npm test)
- [ ] Build local réussit (npm run build)
- [ ] Dev server fonctionne (npm run dev)
- [ ] (Optionnel) Historique Git nettoyé avec BFG

---

## 🆘 Troubleshooting

### ❌ Problème : "API Key not found"

**Solution** :

- Vérifier que le bon projet est sélectionné (dropdown en haut)
- Page la plus à jour (Ctrl+F5 pour rafraîchir)

### ❌ Problème : "Invalid API Key" après mise à jour

**Solution** :

- Attendre 2-3 minutes que GitHub Actions redéploie
- Vérifier que la clé a été copiée complètement (sans espaces)
- Refaire le secret si besoin

### ❌ Problème : Build GitHub Actions échoue

**Solution** :

1. Aller dans https://github.com/Thomasxxl02/Micro-Gestion-Facile/actions
2. Cliquer sur le workflow échoué
3. Lire les logs pour voir l'erreur spécifique
4. Vérifier que les secrets sont bien remplis (ne pas afficher les vraies valeurs)

### ❌ Problème : Cannot access Google Cloud Console

**Solution** :

- Vérifier que tu es connecté avec le bon compte Google
- Vérifier que tu as les permissions "Editor" sur le projet
- Contacter l'administrateur du projet

---

## 📞 Support

Si tu as besoin d'aide :

1. Consulte la [documentation Google Cloud](https://cloud.google.com/docs/authentication/api-keys)
2. Consulte la [documentation Gemini API](https://ai.google.dev/)
3. Consulte la [documentation GitHub Secrets](https://docs.github.com/en/actions/security-guides/using-secrets-in-github-actions)

---

**Créé** : 20 mars 2026  
**Version** : 1.0  
**Temps estimé** : 15 minutes
