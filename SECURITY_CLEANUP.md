# 🔄 Nettoyage de l'Historique Git

## ⚠️ Important: Clé Compromise dans l'Historique

La clé API a été commité dans le dépôt. Même si nous l'avons supprimée, elle reste dans l'historique Git et peut être trouvée.

### Options de Nettoyage

#### Option 1: BFG Repo-Cleaner (Recommandée - Plus Simple + Rapide)

```bash
# 1. Installer BFG
npm install -g bfg

# 2. Nettoyer l'historique
cd c:\Users\Thomas\Micro-Gestion-Facile
bfg --replace-text passwords.txt .

# 3. Ou directement:
bfg --no-blob-protection --replace-text \
  "AIzaSyAryNVYzN1uXwiaFhFPC5xSeW4neFRs7B4=>" .

# 4. Nettoyer les réfs orphelines
git reflog expire --expire=now --all
git gc --prune=now --aggressive

# 5. Force push (⚠️ Attention: cela réécrit l'historique pour tout le monde)
git push origin --force --all
git push origin --force --tags
```

#### Option 2: git-filter-branch (Alternative)

```bash
# 1. Créer un script de remplacement
# Ajouter "AIzaSyAryNVYzN1uXwiaFhFPC5xSeW4neFRs7B4=REDACTED" à un fichier secrets_to_remove.txt

# 2. Exécuter le filtre
git filter-branch --tree-filter '
  find . -type f -name "*.json" -o -name "*.ts" | xargs sed -i 
  "s/AIzaSyAryNVYzN1uXwiaFhFPC5xSeW4neFRs7B4/REDACTED/g"
' -- --all

# 3. Nettoyer
git reflog expire --expire=now --all
git gc --aggressive --prune=now

# 4. Force push
git push --force --all --tags
```

---

## ✅ Étapes Complétées: Remédiation Immédiate

### 1. Sécurisation du Code ✓
- [x] Suppression de la clé du fichier `firebase-applet-config.json`
- [x] Remplacement par un placeholder `REPLACE_WITH_NEW_API_KEY`
- [x] Configuration pour charger depuis les variables d'environnement

### 2. Structure Sécurisée Mise en Place ✓
```
.gitignore                          ← Ajout de .env.local et firebase-applet-config.json
.env.example                        ← Template pour les contributeurs
.env.local                          ← Fichier local NON commité
firebase-applet-config.example.json ← Template obligatoire
firebase-applet-config.json         ← Fichier local NON commité (clé remplacée)
firebase.ts                         ← Mis à jour pour support env vars
vite.config.ts                      ← Configuration Vite pour env vars
```

### 3. Documentation ✓
- [x] `SECURITY_REMEDIATION.md` - Guide complet de remédiation
- [x] `.env.example` - Template de configuration secure
- [x] `firebase-applet-config.example.json` - Alternative JSON
- [x] `SECURITY_CLEANUP.md` - Ce guide

---

## 📋 Prochaines Étapes: À FAIRE PAR L'UTILISATEUR

### 1. Avant chaque push (Sécurité Immédiate)
```bash
# Vérifier qu'aucun secret n'est commité
git diff --cached | grep -E "AIza|sk_|pk_|secret|password|token" && echo "❌ SECRETS DETECTED!" || echo "✅ No secrets"

# Ou utiliser git-secrets
git secrets --scan
```

### 2. Nettoyer l'Historique (Urgent)
Voir les options ci-dessus (BFG ou git-filter-branch)

### 3. Notifier les Contributeurs
```markdown
⚠️ ALERTE SÉCURITÉ: 
- Clé API Google compromise (revoked)
- Historique Git contient la clé (en cours de nettoyage)
- Merci de mettre à jour vos copies locales après rebase
```

### 4. Implémentation de Hooks Git
```bash
# Installer pre-commit hook pour détecter les secrets
npm install --save-dev husky

# Ajouter hook
npx husky install

# Créer le hook
cat > .husky/pre-commit << 'EOF'
#!/bin/sh
. "$(dirname "$0")/_/husky.sh"

# Check for secrets
git diff --cached | grep -E "(AIza|sk_|pk_|secret|password|TOKEN)" && \
  echo "❌ Security: Secrets detected in staged changes!" && \
  exit 1

echo "✅ No obvious secrets detected"
EOF

chmod +x .husky/pre-commit
```

---

## 🛡️ Prévention Future

### 1. Ajouter git-secrets au projet
```bash
# Installation globale
npm install -g git-secrets

# Configuration
git secrets --install
git secrets --register-aws
git secrets --register-github
```

### 2. Fichier `.gitignore-secret` supplémentaire
```bash
# Fichiers de secrets
.env
.env.local
.env.*.local
*.key
*.pem
secrets/
.secrets/
```

### 3. Workflow GitHub Actions (Optional)
```yaml
name: 🔒 Security Scanner
on: [pull_request]
jobs:
  secrets:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: trufflesecurity/trufflehog@main
        with:
          path: ./
          base: ${{ github.event.repository.default_branch }}
          head: HEAD
          debug: true
```

---

## 📊 Statut du Dépôt

| Aspect | Statut | Notes |
|--------|--------|-------|
| **Code actuel** | ✅ Sécurisé | Secrets remplacés, env vars configurés |
| **Dépendances** | ✅ À jour | npm install complété |
| **TypeScript** | ✅ Valide | npm run lint OK |
| **Build Production** | ✅ Succès | npm run build OK |
| **Historique Git** | ⚠️ Compromise | À nettoyer (voir Options de Nettoyage) |
| **Configuration Fire    base** | ⏳ EN ATTENTE | Nouvelle clé API nécessaire |

---

## ⏰ Timeline Recommandée

- **Maintenant** (fait ✓)
  - [x] Sécuriser le code
  - [x] Configurer env vars
  - [x] Tester la compilation

- **Immédiat** (< 1 heure)
  - [ ] Révoquer la clé dans Google Cloud
  - [ ] Générer nouvelle clé
  - [ ] Configurer .env.local
  
- **Urgent** (< 24 heures)
  - [ ] Nettoyer l'historique Git (BFG)
  - [ ] Force push les modifications
  - [ ] Notifier les collaborateurs

- **Important** (cette semaine)
  - [ ] Déployer la version nettoyée
 - [ ] Implémenter les hooks git-secrets
  - [ ] Mettre à jour la documentation d'onboarding

---

## 🚨 En Cas de Problème

### La clé a été utilisée de manière non autorisée?
1. Aller dans Firebase Console
2. Vérifier **Usage and Billing** → **Overview**
3. Vérifier **Cloud Firestore Usage**
4. Examiner les adresses IP suspectes dans les logs

### Je ne peux pas force push?
- Vérifier que vous avez les permissions
- Désactiver temporairement "Require status checks to pass"
- Notifier les autres développeurs de synchroniser après

### Aucun secret n'a pas encore été exposé?
- Tant mieux! Mais toujours nettoyer l'historique
- Les crawlers de GitHub scannent régulièrement

---

✅ **Tous les secrets exposés ont été supprimés du code actuel.**  
⚠️ **L'historique Git contient toujours la clé - nettoyage recommandé.**  
🔑 **Attendez la nouvelle clé API avant de deployer en production.**
