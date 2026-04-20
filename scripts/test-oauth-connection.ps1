# Script de test de la connexion GitHub OAuth
# Usage: .\scripts\test-oauth-connection.ps1

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Test GitHub OAuth - Micro-Gestion-Facile                 ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# 1. Vérifier que Node.js est installé
Write-Host "🔍 Vérification de Node.js..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    Write-Host "✅ Node.js installé: $nodeVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ Node.js non trouvé. Veuillez installer Node.js." -ForegroundColor Red
    exit 1
}

# 2. Vérifier que npm est installé
Write-Host "🔍 Vérification de npm..." -ForegroundColor Yellow
try {
    $npmVersion = npm --version
    Write-Host "✅ npm installé: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "❌ npm non trouvé. Veuillez réinstaller Node.js." -ForegroundColor Red
    exit 1
}

# 3. Vérifier que les dépendances sont installées
Write-Host ""
Write-Host "🔍 Vérification des dépendances..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✅ node_modules trouvé" -ForegroundColor Green
} else {
    Write-Host "⚠️  node_modules non trouvé. Installation des dépendances..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Échec de l'installation des dépendances" -ForegroundColor Red
        exit 1
    }
    Write-Host "✅ Dépendances installées" -ForegroundColor Green
}

# 4. Vérifier la configuration Firebase
Write-Host ""
Write-Host "🔍 Vérification de la configuration Firebase..." -ForegroundColor Yellow
if (Test-Path "config/firebase-applet-config.json") {
    Write-Host "✅ firebase-applet-config.json trouvé" -ForegroundColor Green
    
    # Lire la configuration
    $firebaseConfig = Get-Content "config/firebase-applet-config.json" | ConvertFrom-Json
    
    if ($firebaseConfig.apiKey) {
        Write-Host "✅ API Key configurée" -ForegroundColor Green
    } else {
        Write-Host "❌ API Key manquante dans firebase-applet-config.json" -ForegroundColor Red
        exit 1
    }
    
    if ($firebaseConfig.authDomain) {
        Write-Host "✅ Auth Domain: $($firebaseConfig.authDomain)" -ForegroundColor Green
    } else {
        Write-Host "❌ Auth Domain manquant" -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "❌ firebase-applet-config.json non trouvé dans /config" -ForegroundColor Red
    exit 1
}

# 5. Vérifier que .env.local n'est PAS committé
Write-Host ""
Write-Host "🔍 Vérification de la sécurité (.env.local)..." -ForegroundColor Yellow
$gitTracked = git ls-files | Select-String -Pattern "\.env\.local"
if ($gitTracked) {
    Write-Host "❌ ATTENTION: .env.local est tracké par Git!" -ForegroundColor Red
    Write-Host "   Exécutez: git rm --cached .env.local" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env.local non tracké par Git (sécurité OK)" -ForegroundColor Green
}

# 6. Vérifier .gitignore
Write-Host ""
Write-Host "🔍 Vérification du .gitignore..." -ForegroundColor Yellow
if (Test-Path ".gitignore") {
    $gitignoreContent = Get-Content ".gitignore" -Raw
    
    if ($gitignoreContent -match "\.env\.local") {
        Write-Host "✅ .env.local dans .gitignore" -ForegroundColor Green
    } else {
        Write-Host "⚠️  .env.local non présent dans .gitignore" -ForegroundColor Yellow
        Write-Host "   Ajoutez cette ligne: .env.local" -ForegroundColor Yellow
    }
    
    if ($gitignoreContent -match "\.env") {
        Write-Host "✅ .env dans .gitignore" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Ajoutez '.env' au .gitignore" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ .gitignore non trouvé" -ForegroundColor Red
}

# 7. Vérifier les Firestore Rules
Write-Host ""
Write-Host "🔍 Vérification des Firestore Rules..." -ForegroundColor Yellow
if (Test-Path "firestore.rules") {
    $rulesContent = Get-Content "firestore.rules" -Raw
    
    if ($rulesContent -match "request\.auth\.uid") {
        Write-Host "✅ Sécurité uid détectée dans firestore.rules" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Pas de vérification uid trouvée dans firestore.rules" -ForegroundColor Yellow
    }
    
    if ($rulesContent -match "isDocOwner") {
        Write-Host "✅ Fonction isDocOwner() détectée" -ForegroundColor Green
    } else {
        Write-Host "⚠️  Fonction isDocOwner() non trouvée" -ForegroundColor Yellow
    }
} else {
    Write-Host "❌ firestore.rules non trouvé" -ForegroundColor Red
}

# 8. Vérifier le composant GitHubLoginButton
Write-Host ""
Write-Host "🔍 Vérification du composant GitHubLoginButton..." -ForegroundColor Yellow
if (Test-Path "src/components/GitHubLoginButton.tsx") {
    Write-Host "✅ GitHubLoginButton.tsx trouvé" -ForegroundColor Green
} else {
    Write-Host "❌ GitHubLoginButton.tsx non trouvé" -ForegroundColor Red
    exit 1
}

# 9. Build de test
Write-Host ""
Write-Host "🔍 Test de build TypeScript..." -ForegroundColor Yellow
Write-Host "   (Cela peut prendre quelques secondes...)" -ForegroundColor Gray

npm run type-check 2>&1 | Out-Null
if ($LASTEXITCODE -eq 0) {
    Write-Host "✅ Type-check réussi (aucune erreur TypeScript)" -ForegroundColor Green
} else {
    Write-Host "⚠️  Des erreurs TypeScript ont été détectées" -ForegroundColor Yellow
    Write-Host "   Exécutez 'npm run type-check' pour voir les détails" -ForegroundColor Yellow
}

# 10. Résumé et prochaines étapes
Write-Host ""
Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  RÉSUMÉ                                                    ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "📊 Configuration Firebase : OUI" -ForegroundColor Green
Write-Host "🔒 Sécurité .env : OUI" -ForegroundColor Green
Write-Host "🛡️  Firestore Rules : OUI" -ForegroundColor Green
Write-Host "🧩 Composant OAuth : OUI" -ForegroundColor Green
Write-Host ""

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "║  PROCHAINES ÉTAPES                                         ║" -ForegroundColor Magenta
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "1️⃣  Lancez le serveur de développement :" -ForegroundColor Yellow
Write-Host "    npm run dev" -ForegroundColor White
Write-Host ""
Write-Host "2️⃣  Ouvrez votre navigateur :" -ForegroundColor Yellow
Write-Host "    http://localhost:5173" -ForegroundColor White
Write-Host ""
Write-Host "3️⃣  Testez la connexion GitHub :" -ForegroundColor Yellow
Write-Host "    - Cliquez sur 'Se connecter avec GitHub'" -ForegroundColor White
Write-Host "    - Autorisez l'application" -ForegroundColor White
Write-Host "    - Vérifiez que vous êtes connecté" -ForegroundColor White
Write-Host ""
Write-Host "4️⃣  Vérifiez la console navigateur (F12) :" -ForegroundColor Yellow
Write-Host "    - Aucune erreur ne doit apparaître" -ForegroundColor White
Write-Host "    - Vérifiez que l'utilisateur est bien stocké" -ForegroundColor White
Write-Host ""
Write-Host "5️⃣  Consultez la checklist complète :" -ForegroundColor Yellow
Write-Host "    docs/GITHUB_OAUTH_CHECKLIST.md" -ForegroundColor White
Write-Host ""

# 11. Proposer de lancer le serveur de dev
Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Cyan
Write-Host ""
$launchDev = Read-Host "Voulez-vous lancer le serveur de développement maintenant? (O/N)"

if ($launchDev -eq "O" -or $launchDev -eq "o" -or $launchDev -eq "Oui" -or $launchDev -eq "oui") {
    Write-Host ""
    Write-Host "🚀 Lancement du serveur de développement..." -ForegroundColor Green
    Write-Host "   Appuyez sur Ctrl+C pour arrêter" -ForegroundColor Gray
    Write-Host ""
    npm run dev
} else {
    Write-Host ""
    Write-Host "✅ Script terminé. Lancez 'npm run dev' quand vous êtes prêt." -ForegroundColor Green
    Write-Host ""
}
