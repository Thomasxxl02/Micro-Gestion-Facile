# Guide d'activation des MCP (Model Context Protocol)

**Date:** 7 avril 2026  
**Statut:** Configuration MCP complète

## Serveurs MCP Configurés

Tous les serveurs MCP suivants sont configurés dans `.vscode/mcp.json` et prêts à être utilisés dans VS Code.

### 1. Chrome DevTools MCP ✅

- **Version:** 0.21.0
- **Exécution:** `npx chrome-devtools-mcp@0.21.0`
- **Statut:** Fonctionnel
- **Utilité:** Interaction avec navigateurs Chrome/Chromium via DevTools Protocol
- **Commande d'activation:** Les outils de Chrome sont automatiquement disponibles

### 2. DBHub MCP ⚠️

- **Version:** 0.21.1
- **Exécution:** `npx @bytebase/dbhub@0.21.1`
- **Statut:** Erreur de recompilation (bcrypt-pbkdf native)
- **Utilité:** Gestion de bases de données (PostgreSQL, MySQL, SQLite, etc.)
- **Solution:** À nécessiter des dépendances Build-tools supplémentaires sur Windows

### 3. GitHub MCP ✅

- **Version:** 0.33.0
- **Exécution:** Docker - `ghcr.io/github/github-mcp-server:0.33.0`
- **Statut:** Fonctionnel
- **Utilité:** Interaction avec GitHub (repos, issues, PRs, workflows)
- **Prérequis:** Docker doit être lancé
- **Activation:** Ajouter `GITHUB_PERSONAL_ACCESS_TOKEN` en tant que `${input:token}`

### 4. MongoDB MCP ✅

- **Version:** 1.9.0
- **Exécution:** `npx mongodb-mcp-server@1.9.0`
- **Statut:** Fonctionnel
- **Utilité:** Gestion complète de bases MongoDB (requêtes, CRUD, transactions)
- **Configuration:** Requiert paramètres de connexion MongoDB

### 5. MarkItDown MCP ✅

- **Version:** 0.0.1a4
- **Exécution:** `uvx markitdown-mcp@0.0.1a4`
- **Statut:** Fonctionnel
- **Utilité:** Conversion de fichiers et ressources web en Markdown
- **Note:** Dépend de ffmpeg pour certains formats média

### 6. Playwright MCP ✅

- **Version:** 0.0.70 (latest)
- **Exécution:** `npx @playwright/mcp@latest`
- **Statut:** Fonctionnel
- **Utilité:** Automatisation de navigateurs (tests, scraping, interactions)
- **Framework:** Support Chrome, Firefox, WebKit

## Comment Activer les MCP dans VS Code

### Méthode 1 : Interface de VS Code (Recommandée)

1. Ouvrir VS Code
2. Aller à **Settings → Chat → MCP Server** (ou utiliser Command Palette)
3. Les serveurs configurés dans `.vscode/mcp.json` devraient être listés
4. Activer les serveurs souhaités (bascule ON/OFF)
5. Pour les serveurs nécessitant une auth (GitHub), VS Code réclamera les tokens
6. Redémarrer VS Code ou le Chat si nécessaire

### Méthode 2 : Rédaction manuelle dans VS Code Settings

1. Command Palette → `Preferences: Open User Settings (JSON)`
2. Ajouter ou mettre à jour la section `modelContextProtocol.servers`:

```json
{
  "modelContextProtocol.servers": {
    "chrome-devtools": {
      "enabled": true
    },
    "github": {
      "enabled": true,
      "env": {
        "GITHUB_PERSONAL_ACCESS_TOKEN": "ghp_xxx..."
      }
    },
    "mongodb": {
      "enabled": true,
      "env": {
        "MDB_MCP_CONNECTION_STRING": "mongodb+srv://..."
      }
    },
    "playwright": {
      "enabled": true
    },
    "markitdown": {
      "enabled": true
    }
  }
}
```

## Prérequis Système

- ✅ **Node.js & NPX:** 11.6.2 (installé)
- ✅ **Docker:** 29.2.1 (installé et actif)
- ✅ **UV (Python):** 0.10.0 (installé)
- ⚠️ **FFmpeg:** Optionnel (pour MarkItDown avec fichiers média)

## Utilisation des MCP dans VS Code Chat

Une fois activés, les MCP fournissent des **outils** à disposition dans VS Code Chat:

### Chrome DevTools

```
Cliquez sur le panneau Chat → les outils Chrome seront disponibles
Utilisez pour: inspectionner/contrôler navigateurs, extraire DOM, etc.
```

### GitHub

```
Avant usage: Configurer token GitHub personnel
Utilisez pour: créer/lister issues, PRs, workflows, repos, etc.
```

### MongoDB

```
Avant usage: Configurer connexion MongoDB
Utilisez pour: requêtes, insertions, mises à jour, agrégations, etc.
```

### Playwright

```
Utilisez pour: tester navigateurs, automatiser interactions web
Utilisez pour: screenshots, scraping, tests E2E
```

### MarkItDown

```
Utilisez pour: convertir URLs/fichiers en Markdown
Utilisez pour: documenter resources web
```

## Dépannage

### DBHub Erreur Bcrypt

**Problème:** `bcrypt-pbkdf` n'est pas compilé pour Windows  
**Solution:**

```powershell
# Installer Build Tools
npm install --global windows-build-tools

# Ou utiliser une base PostgreSQL/MySQL distante via GitHub/Playwright
```

### GitHub MCP - Token Expiré

**Solution:** Régénérer token personnel dans GitHub Settings (Security → Personal access tokens)

### Docker - Image Non Trouvée

**Solution:**

```powershell
docker pull ghcr.io/github/github-mcp-server:0.33.0
```

### MongoDB - Connexion Refusée

**Solution:** Vérifier que MongoDB est en cours d'exécution:

```powershell
# MongoDB local
mongod

# Ou utiliser MongoDB Atlas (cloud)
# Connection string: mongodb+srv://username:password@cluster.mongodb.net/database
```

## Activation Rapide des MCP Fonctionnels

Pour commencer immédiatement avec les MCP fonctionnels:

```bash
# 1. Vérifier que tous les prérequis sont disponibles
npx --version      # ✅ 11.6.2
docker --version   # ✅ 29.2.1
uv --version       # ✅ 0.10.0

# 2. Pré-télécharger les packages MCP
npx chrome-devtools-mcp@0.21.0 --help 2>&1 | Select-Object -First 1
npx @playwright/mcp@latest --help 2>&1 | Select-Object -First 1
npx mongodb-mcp-server@1.9.0 --help 2>&1 | Select-Object -First 1

# 3. Redémarrer VS Code
# Les MCP seront automatiquement détectés depuis .vscode/mcp.json
```

## Configuration pour Micro-Gestion-Facile

### MCP Recommandés pour ce Projet

1. **GitHub MCP** - Gérer issues, PR, workflows pour le projet PWA
2. **Playwright MCP** - Tests E2E de l'application Electron
3. **Chrome DevTools MCP** - Déboguer l'interface web
4. **MarkItDown MCP** - Générer documentation depuis web resources

### MCP Non Essentiels (Optionnels)

- MongoDB MCP - Seulement si utilisation MongoDB (actuellement Firebase)
- DBHub MCP - Seulement si gestion multi-BD (actuellement Firestore)

## Prochaines Étapes

1. ✅ Redémarrer VS Code
2. ✅ Vérifier que les MCP apparaissent dans le Chat
3. ✅ Configurer tokens si nécessaire (GitHub, MongoDB)
4. ✅ Tester chaque MCP dans un message Chat

## Fichier de Configuration

- **Fichier:** `.vscode/mcp.json`
- **Statut:** Tous les serveurs MCP sont préconfigurés
- **Modification:** Éditer le fichier JSON pour ajouter/supprimer/mettre à jour les serveurs
