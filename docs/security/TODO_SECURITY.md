# 🔴 ACTION ITEMS - À FAIRE MAINTENANT

## IMMÉDIAT (< 30 min)

### ✅ ÉTAPE 1: Révoquer la Clé Google

```
1. Ouvrez: https://console.cloud.google.com
2. Projet: gen-lang-client-0231981865
3. Menu: APIs & Services → Credentials
4. Cherchez: [REDACTED_KEY_1]
5. Cliquez: Delete
6. ✅ Confirmez la suppression
```

### ✅ ÉTAPE 2: Générer Nouvelle Clé

```
1. Cliquez: + Create Credentials
2. Type: API Key
3. Restriction: Browser (HTTP/HTTPS)
4. Domaines: Ajoutez vos domaines
5. Créez: ✅
6. Copiez la nouvelle clé
```

### ✅ ÉTAPE 3: Configurer Localement

```
Fichier: .env.local (déjà créé)

Éditez avec:
- Code: Code .env.local
- OU: Double-cliquez .env.local

Remplacez:
VITE_FIREBASE_API_KEY=AIzaSy...
→
VITE_FIREBASE_API_KEY=(votre_nouvelle_clé)
```

### ✅ ÉTAPE 4: Tester

```bash
# Terminal
npm run dev

# Doit afficher:
# VITE v6.4.1 ready in XXX ms
# ➜ http://localhost:3000/

# Ctrl+C pour arrêter
```

---

## AUJOURD'HUI (< 2 heures)

### ✅ ÉTAPE 5: Vérifier Accès Google Firebase

1. Ouvrez: https://console.firebase.google.com
2. Allez: Project Settings → Usage and Billing → Overview
3. Vérifiez: Aucun accès suspect?
4. Notez: Date/heure du dernier accès

### ✅ ÉTAPE 6: Nettoyer l'Historique Git

```bash
# Installer BFG (si pas installé)
npm install -g bfg

# Nettoyer l'historique
cd c:\Users\Thomas\Micro-Gestion-Facile
bfg --replace-text "[REDACTED_KEY_1]=>"

# Finaliser
git gc --aggressive --prune=now

# Push (envoyer les changements)
git push --force --all
git push --force --tags
```

---

## CETTE SEMAINE

- [ ] Ajouter git-secrets

  ```bash
  npm install --save-dev husky
  npx husky install
  ```

- [ ] Documenter pour l'équipe
  - Envoyer les docs SECURITY\_\*.md
  - Expliquer les changements

- [ ] Déployer version sécurisée
  ```bash
  npm run build
  # Déployer dist/
  ```

---

## 📝 Fichiers À Consulter

1. **Maintenant**:
   - ➡️ SECURITY_QUICK_START.md (ce fichier)
   - ➡️ SECURITY_REMEDIATION.md (étapes détaillées)

2. **Pour Nettoyer Git**:
   - ➡️ SECURITY_CLEANUP.md

3. **Pour Référence**:
   - ➡️ SECURITY_STATUS.md
   - ➡️ .env.example

---

## 🎯 PRIORITÉS

| Priorité     | Action                 | Temps  | Quand         |
| ------------ | ---------------------- | ------ | ------------- |
| 🔴 CRITIQUE  | Révoquer clé           | 15 min | MAINTENANT    |
| 🔴 CRITIQUE  | Générer nouvelle clé   | 10 min | MAINTENANT    |
| 🔴 CRITIQUE  | Configurer .env.local  | 5 min  | MAINTENANT    |
| 🟡 URGENT    | Tester (npm run dev)   | 5 min  | MAINTENANT    |
| 🟡 URGENT    | Vérifier logs Firebase | 30 min | Aujourd'hui   |
| 🟡 URGENT    | Nettoyer Git           | 60 min | Aujourd'hui   |
| 🟢 IMPORTANT | Git-secrets setup      | 15 min | Cette semaine |
| 🟢 IMPORTANT | Documentatioon         | 30 min | Cette semaine |

---

## ✅ CHECKLIST RAPIDE

```
[ ] Clé Google revoquée
[ ] Nouvelle clé Google créée
[ ] .env.local modifié avec nouvelle clé
[ ] npm run dev fonctionne
[ ] npm run build fonctionne
[ ] Logs Firebase vérifiés
[ ] Historique Git nettoyé
[ ] git push --force --all exécuté
[ ] Équipe notifiée
[ ] Alerte GitHub fermée
```

---

## 💡 TIPS

**Besoin de copier la clé rapidement?**

```
.env.local ligne 3: VITE_FIREBASE_API_KEY=
Copiez juste la partie: AIzaSy...
```

**Testez votre config?**

```bash
npm run dev
# Regardez la sortie - si voir aucun erreur → OK
```

**Pas sûr du format .env.local?**

```
Ouvrez .env.example ou
Consultez .env.local
```

---

## 🆘 PROBLÈMES?

**Erreur: "Firebase config not found"**

- Solution: `.env.local` pas configuré

**Erreur: "API key invalid"**

- Vérifiez: La clé dans .env.local est complète?
- Essayez: Copier-coller à nouveau

**Git refuse de push?**

- Vérifiez: Avez-vous les permissions?
- Essayez: `git push --force --all`

**Questions?**

- Lisez: SECURITY_REMEDIATION.md
- Cherchez: Votre erreur dans ce fichier

---

**⏱️ Estimé: 30 min pour les étapes critiques**  
**🎯 Objectif: Fermer l'alerte GitHub d'ici aujourd'hui**  
**🚀 Résultat: Application sécurisée + clé revoquée**

---

**START HERE** →→→ SECURITY_REMEDIATION.md
