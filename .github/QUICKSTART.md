# 🚀 Quick Start Guide pour Développeurs

**Bienvenue!** Ce guide vous montre comment démarrer en 5 minutes.

## 1️⃣ Préparation (2 min)

### Fork et cloner
```bash
# 1. Allez sur GitHub et cliquez "Fork"
# 2. Cloner votre fork
git clone https://github.com/YOUR_USERNAME/Micro-Gestion-Facile.git
cd Micro-Gestion-Facile

# 3. Ajouter le dépôt upstream
git remote add upstream https://github.com/Thomasxxl02/Micro-Gestion-Facile.git
```

### Configuration locale
```bash
# Installer les dépendances
npm install

# Configurer les variables d'environnement
cp .env.example .env.local
# ⚠️ Éditez .env.local avec vos vraies valeurs Firebase/Gemini
```

---

## 2️⃣ Développement (2 min)

### Démarrer le serveur
```bash
npm run dev
```

Accédez à [http://localhost:5173](http://localhost:5173)

### Vérifier votre code
```bash
npm run lint  # Vérifier les types TypeScript
```

---

## 3️⃣ Soumettre une contribution (1 min)

### Créer une branche
```bash
# Mettez à jour depuis upstream
git fetch upstream
git checkout main
git merge upstream/main

# Créer votre branche
git checkout -b feature/ma-feature
```

### Faire vos changements
```bash
# Développez votre feature
# Testez bien !
npm run dev

# Commit (suivez Conventional Commits)
git add .
git commit -m "feat: description courte"
```

### Pusher et créer une PR
```bash
# Pusher votre branche
git push origin feature/ma-feature

# Allez sur GitHub et cliquez "Create Pull Request"
```

---

## 📚 Ressources

- 📖 Guide complet : [CONTRIBUTING.md](CONTRIBUTING.md)
- 🔧 Configuration GitHub : [.github/GITHUB_SETUP.md](.github/GITHUB_SETUP.md)
- 🛠️ README complet : [README.md](README.md)
- 🔒 Sécurité : [SECURITY.md](SECURITY.md)

---

## ❓ Questions fréquentes

### Q: Comment testé mon code ?
```bash
npm run dev          # Lancer en local
npm run lint         # Vérifier les types
npm run build        # Tester le build
```

### Q: Le port 5173 est occupé ?
```bash
npm run dev -- --port 3000
```

### Q: Comment créer une branche depuis une issue ?
```bash
# Utilisez le GitHub CLI si disponible
gh issue develop 123

# Ou créez manuellement
git checkout -b feature/issue-123-description
```

### Q: Mes changements ne fonctionnent pas ?
```bash
# Vérifier les logs
npm run dev       # Les erreurs s'affichent ici

# Vérifier les types
npm run lint

# Nettoyer node_modules
rm -rf node_modules
npm install
```

### Q: Comment mettre à jour depuis upstream ?
```bash
git fetch upstream
git rebase upstream/main
git push origin feature/ma-feature --force-with-lease
```

---

## 🎯 Bonnes pratiques

✅ Toujours créer une branche pour chaque feature/fix  
✅ Écrire des messages de commit clairs  
✅ Tester avant de soumettre une PR  
✅ Lire CONTRIBUTING.md avant le premier commit  
✅ Respecter le style de code du projet (TypeScript strict)  
✅ Ne jamais commiter .env.local  

---

## 🆘 Besoin d'aide ?

- 💬 [Discussions GitHub](https://github.com/Thomasxxl02/Micro-Gestion-Facile/discussions)
- 🐛 [Issues](https://github.com/Thomasxxl02/Micro-Gestion-Facile/issues)
- 📧 Créez une issue avec [bug_report.md](ISSUE_TEMPLATE/bug_report.md)

---

**Bienvenue dans l'équipe!** 🎉
