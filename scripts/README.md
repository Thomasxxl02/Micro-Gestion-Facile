# Scripts PowerShell - Micro-Gestion-Facile

Ce dossier contient des scripts utilitaires pour faciliter le développement et la configuration de l'application.

## 📜 Scripts disponibles

### 🔐 OAuth & Configuration

#### `test-oauth-connection.ps1`

**Test automatique de la configuration GitHub OAuth**

- ✅ Vérifie Node.js et npm
- ✅ Vérifie les dépendances installées
- ✅ Valide la configuration Firebase
- ✅ Contrôle la sécurité (.env.local, .gitignore)
- ✅ Vérifie les Firestore Rules
- ✅ Test du composant GitHubLoginButton
- ✅ Build TypeScript
- 🚀 Propose de lancer le serveur dev

**Usage :**

```powershell
.\scripts\test-oauth-connection.ps1
```

**Prérequis :** Node.js installé

---

#### `convert-logo-to-png.ps1`

**Conversion du logo SVG en PNG 512x512px pour GitHub OAuth**

- 🔍 Recherche automatique d'Inkscape
- 🔄 Conversion automatique si Inkscape trouvé
- 💡 Propose des alternatives sinon (svgtopng.com, navigateur, etc.)
- 📋 Copie le chemin du fichier dans le presse-papiers

**Usage :**

```powershell
.\scripts\convert-logo-to-png.ps1
```

**Sortie :** `public/logo-512x512.png`

**Alternatives suggérées :**

- https://svgtopng.com (recommandé)
- Script navigateur (F12 console)
- Inkscape, GIMP, Paint.NET

---

### 🧪 Tests & API

#### `test-new-api-keys.ps1`

**Test des nouvelles clés API Gemini**

- Teste la connexion à l'API Google Gemini
- Valide les clés API configurées

**Usage :**

```powershell
.\scripts\test-new-api-keys.ps1
```

---

#### `test-new-api-keys.sh`

**Version Bash du script de test API** (pour Linux/macOS)

**Usage :**

```bash
./scripts/test-new-api-keys.sh
```

---

## 🚀 Workflows recommandés

### Première configuration

```powershell
# 1. Vérifier la configuration globale
.\scripts\test-oauth-connection.ps1

# 2. Convertir le logo
.\scripts\convert-logo-to-png.ps1

# 3. Tester les API
.\scripts\test-new-api-keys.ps1
```

### Avant chaque commit

```powershell
# Test rapide
npm run type-check
npm run lint
npm run test

# Si modification OAuth
.\scripts\test-oauth-connection.ps1
```

### Débogage OAuth

```powershell
# Test complet des composants
.\scripts\test-oauth-connection.ps1

# Vérifier les logs Firebase
firebase emulators:start --only auth

# Tester en local
npm run dev
```

---

## 📚 Documentation connexe

- **Guide OAuth complet :** [../docs/GITHUB_OAUTH_SETUP.md](../docs/GITHUB_OAUTH_SETUP.md)
- **Checklist OAuth :** [../docs/GITHUB_OAUTH_CHECKLIST.md](../docs/GITHUB_OAUTH_CHECKLIST.md)
- **Quick Start OAuth :** [../docs/GITHUB_OAUTH_QUICKSTART.md](../docs/GITHUB_OAUTH_QUICKSTART.md)
- **Instructions logo :** [../public/README-LOGO.md](../public/README-LOGO.md)

---

## 🛠️ Création de nouveaux scripts

Si vous créez de nouveaux scripts PowerShell :

1. **Nommage :** `kebab-case.ps1`
2. **Header :** Incluez un commentaire d'usage
3. **Outputs :** Utilisez des couleurs (`Write-Host ... -ForegroundColor`)
4. **Erreurs :** Gérez les erreurs avec try/catch
5. **Documentation :** Mettez à jour ce README

### Template de base

```powershell
# Description du script
# Usage: .\scripts\mon-script.ps1

Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host "  Nom du Script" -ForegroundColor Cyan
Write-Host "════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""

try {
    # Votre code ici
    Write-Host "✅ Succès" -ForegroundColor Green
} catch {
    Write-Host "❌ Erreur: $_" -ForegroundColor Red
    exit 1
}
```

---

## 🔒 Sécurité

**Important :** Ces scripts peuvent accéder à des fichiers sensibles (.env.local, etc.)

- ⚠️ Ne committez JAMAIS de secrets dans ces scripts
- ⚠️ Ne partagez pas de scripts contenant des clés API
- ✅ Utilisez des variables d'environnement quand possible
- ✅ Vérifiez `.gitignore` avant de committer

---

## 🐛 Dépannage

### "Impossible d'exécuter des scripts"

**Problème :** Execution Policy Windows

**Solution :**

```powershell
Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned
```

### "Script non trouvé"

**Problème :** Chemin incorrect

**Solution :** Assurez-vous d'être à la racine du projet

```powershell
cd C:\Users\Thomas\Micro-Gestion-Facile
.\scripts\nom-du-script.ps1
```

### "Command not found" (Git Bash)

**Problème :** Scripts PowerShell dans Git Bash

**Solution :** Utilisez PowerShell ou créez l'équivalent `.sh`

```bash
powershell -File scripts/test-oauth-connection.ps1
```

---

**Dernière mise à jour :** 19 avril 2026  
**Contributeurs :** Thomas, GitHub Copilot  
**Version :** 1.0
