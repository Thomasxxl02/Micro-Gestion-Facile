# Script de conversion SVG → PNG pour le logo GitHub OAuth
# Usage: .\scripts\convert-logo-to-png.ps1

Write-Host "╔════════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║  Convertisseur Logo SVG → PNG (512x512)                   ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

# Vérifier que le fichier SVG existe
$svgPath = "public/logo.svg"
$pngPath = "public/logo-512x512.png"

if (-Not (Test-Path $svgPath)) {
    Write-Host "❌ Erreur: Le fichier $svgPath n'existe pas." -ForegroundColor Red
    exit 1
}

Write-Host "✅ Fichier SVG trouvé: $svgPath" -ForegroundColor Green
Write-Host ""

# Méthode 1: Vérifier si Inkscape est installé
Write-Host "🔍 Recherche d'Inkscape..." -ForegroundColor Yellow

$inkscapePaths = @(
    "C:\Program Files\Inkscape\bin\inkscape.exe",
    "C:\Program Files (x86)\Inkscape\bin\inkscape.exe",
    "$env:LOCALAPPDATA\Programs\Inkscape\bin\inkscape.exe"
)

$inkscapeFound = $false
$inkscapePath = $null

foreach ($path in $inkscapePaths) {
    if (Test-Path $path) {
        $inkscapeFound = $true
        $inkscapePath = $path
        break
    }
}

if ($inkscapeFound) {
    Write-Host "✅ Inkscape trouvé: $inkscapePath" -ForegroundColor Green
    Write-Host "🔄 Conversion en cours..." -ForegroundColor Yellow
    
    & $inkscapePath $svgPath --export-type=png --export-width=512 --export-height=512 -o $pngPath
    
    if (Test-Path $pngPath) {
        Write-Host "✅ Conversion réussie!" -ForegroundColor Green
        Write-Host "📁 Fichier créé: $pngPath" -ForegroundColor Green
        
        # Afficher la taille du fichier
        $fileSize = (Get-Item $pngPath).Length
        $fileSizeKB = [math]::Round($fileSize / 1KB, 2)
        Write-Host "📊 Taille: $fileSizeKB KB" -ForegroundColor Cyan
        
        Write-Host ""
        Write-Host "🎉 Le logo est prêt à être uploadé sur GitHub!" -ForegroundColor Green
        Write-Host "   Chemin: $((Get-Item $pngPath).FullName)" -ForegroundColor White
        exit 0
    } else {
        Write-Host "❌ Erreur lors de la conversion." -ForegroundColor Red
        exit 1
    }
} else {
    Write-Host "⚠️  Inkscape non trouvé." -ForegroundColor Yellow
    Write-Host ""
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
    Write-Host "SOLUTIONS ALTERNATIVES" -ForegroundColor White
    Write-Host "═══════════════════════════════════════════════════════════" -ForegroundColor Gray
    Write-Host ""
    
    Write-Host "Option 1 : Installer Inkscape" -ForegroundColor Cyan
    Write-Host "  1. Allez sur https://inkscape.org/release" -ForegroundColor White
    Write-Host "  2. Téléchargez la version Windows" -ForegroundColor White
    Write-Host "  3. Installez et relancez ce script" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Option 2 : Utiliser un service en ligne (RECOMMANDÉ)" -ForegroundColor Cyan
    Write-Host "  1. Allez sur https://svgtopng.com" -ForegroundColor White
    Write-Host "  2. Uploadez le fichier: $((Get-Item $svgPath).FullName)" -ForegroundColor White
    Write-Host "  3. Sélectionnez 512x512 pixels" -ForegroundColor White
    Write-Host "  4. Téléchargez le PNG" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Option 3 : Utiliser le navigateur" -ForegroundColor Cyan
    Write-Host "  1. Ouvrir le fichier SVG dans votre navigateur" -ForegroundColor White
    Write-Host "  2. Ouvrir la console développeur (F12)" -ForegroundColor White
    Write-Host "  3. Copier-coller le script de conversion (voir README-LOGO.md)" -ForegroundColor White
    Write-Host ""
    
    Write-Host "Option 4 : Utiliser Paint.NET ou GIMP" -ForegroundColor Cyan
    Write-Host "  1. Ouvrir $svgPath dans Paint.NET ou GIMP" -ForegroundColor White
    Write-Host "  2. Redimensionner à 512x512 pixels" -ForegroundColor White
    Write-Host "  3. Exporter en PNG" -ForegroundColor White
    Write-Host ""
    
    $openBrowser = Read-Host "Voulez-vous ouvrir svgtopng.com dans votre navigateur? (O/N)"
    
    if ($openBrowser -eq "O" -or $openBrowser -eq "o") {
        Start-Process "https://svgtopng.com"
        Write-Host ""
        Write-Host "🌐 Navigateur ouvert. Uploadez le fichier:" -ForegroundColor Green
        Write-Host "   $((Get-Item $svgPath).FullName)" -ForegroundColor White
        
        # Copier le chemin dans le presse-papiers
        Set-Clipboard -Value (Get-Item $svgPath).FullName
        Write-Host "✅ Chemin copié dans le presse-papiers (Ctrl+V pour coller)" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "📚 Pour plus d'informations, consultez:" -ForegroundColor Yellow
    Write-Host "   public/README-LOGO.md" -ForegroundColor White
    Write-Host ""
}
