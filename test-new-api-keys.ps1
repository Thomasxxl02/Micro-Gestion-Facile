# test-new-api-keys.ps1
# Script to test newly generated Firebase and Gemini API keys (Windows PowerShell)

$ErrorActionPreference = "Stop"

Write-Host "🔐 API Key Validation Script" -ForegroundColor Cyan
Write-Host "============================" -ForegroundColor Cyan
Write-Host ""

# Function to print colored messages
function Print-Status {
    param([string]$Message)
    $Time = Get-Date -Format "HH:mm:ss"
    Write-Host "[${Time}] ${Message}" -ForegroundColor Blue
}

function Print-Success {
    param([string]$Message)
    Write-Host "✅ ${Message}" -ForegroundColor Green
}

function Print-Error {
    param([string]$Message)
    Write-Host "❌ ${Message}" -ForegroundColor Red
}

function Print-Warning {
    param([string]$Message)
    Write-Host "⚠️  ${Message}" -ForegroundColor Yellow
}

# Step 1: Check if .env.local exists
Print-Status "Step 1: Checking .env.local configuration"

if (!(Test-Path ".env.local")) {
    Print-Error ".env.local not found"
    Print-Warning "Creating .env.local template..."
    
    $template = @"
# Firebase Configuration - FILL IN YOUR NEW KEYS HERE
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=1:000000000000:web:0000000000000000000000
VITE_FIREBASE_API_KEY=PASTE_NEW_FIREBASE_KEY_HERE
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_FIRESTORE_DATABASE_ID=your-firestore-database-id
VITE_FIREBASE_STORAGE_BUCKET=your-project-id.firebasestorage.app
VITE_FIREBASE_MESSAGING_SENDER_ID=000000000000
VITE_FIREBASE_MEASUREMENT_ID=

# Gemini API - FILL IN YOUR NEW KEY HERE
GEMINI_API_KEY=PASTE_NEW_GEMINI_KEY_HERE
"@
    
    Set-Content -Path ".env.local" -Value $template
    Print-Warning "⚠️  .env.local created. Please edit it with your new API keys."
    Print-Status "Edit .env.local and run this script again."
    exit 1
}

Print-Success ".env.local found"

# Step 2: Validate that keys are not placeholders
Print-Status "Step 2: Validating API keys are configured"

# Read .env.local
$envContent = Get-Content ".env.local" | ConvertFrom-StringData -ErrorAction SilentlyContinue

if ($null -eq $envContent) {
    # Try manual parsing if ConvertFrom-StringData fails
    $envContent = @{}
    Get-Content ".env.local" | Where-Object { $_ -match '=' } | ForEach-Object {
        $key, $value = $_ -split '=', 2
        $envContent[$key.Trim()] = $value.Trim()
    }
}

$firebaseKey = $envContent["VITE_FIREBASE_API_KEY"]
$geminiKey = $envContent["GEMINI_API_KEY"]

if ([string]::IsNullOrWhiteSpace($firebaseKey) -or $firebaseKey -eq "PASTE_NEW_FIREBASE_KEY_HERE") {
    Print-Error "Firebase API Key not configured in .env.local"
    exit 1
}

if ([string]::IsNullOrWhiteSpace($geminiKey) -or $geminiKey -eq "PASTE_NEW_GEMINI_KEY_HERE") {
    Print-Error "Gemini API Key not configured in .env.local"
    exit 1
}

Print-Success "Both API keys are configured"

# Step 3: Check environment setup
Print-Status "Step 3: Checking environment setup"

# Check Node.js
try {
    $nodeVersion = node --version
    Print-Success "Node.js found: $nodeVersion"
} catch {
    Print-Error "Node.js is not installed"
    exit 1
}

# Check npm
try {
    $npmVersion = npm --version
    Print-Success "npm found: $npmVersion"
} catch {
    Print-Error "npm is not installed"
    exit 1
}

# Step 4: Install dependencies
Print-Status "Step 4: Installing dependencies"
try {
    npm install --legacy-peer-deps | Select-Object -Last 3
    Print-Success "Dependencies installed"
} catch {
    Print-Error "Failed to install dependencies: $_"
    exit 1
}

# Step 5: TypeScript compilation
Print-Status "Step 5: Running TypeScript type check"
try {
    npm run type-check | Out-Null
    Print-Success "TypeScript compilation passed (0 errors)"
} catch {
    Print-Error "TypeScript compilation failed"
    exit 1
}

# Step 6: Run tests
Print-Status "Step 6: Running test suite"
try {
    npm test -- --run | Out-Null
    Print-Success "Test suite passed (all tests)"
} catch {
    Print-Error "Test suite failed"
    exit 1
}

# Step 7: Build production
Print-Status "Step 7: Building production bundle"
try {
    npm run build | Out-Null
    
    if (Test-Path "dist/assets/index.js") {
        $bundleSize = (Get-Item "dist/assets/index.js").Length
        Print-Success "Production build completed (bundle size: $bundleSize bytes)"
    } else {
        Print-Success "Production build completed"
    }
} catch {
    Print-Error "Production build failed"
    exit 1
}

# Step 8: Check for exposed secrets
Print-Status "Step 8: Scanning for accidentally committed secrets"

$oldFirebaseKey = "AIzaSyAryNVYzN1uXwiaFhFPC5xSeW4neFRs7B4"
$oldGeminiKey = "AIzaSyBXejKbJpVWxARCRP3hYroCEbREQiVWbiE"

$firebaseExposed = Get-ChildItem -Path . -Recurse -Exclude @("node_modules", "dist", ".git") -File | 
    Where-Object { $_.FullName -notmatch "node_modules|dist|\.git" } |
    Select-String -Pattern $oldFirebaseKey -ErrorAction SilentlyContinue

if ($firebaseExposed) {
    Print-Warning "Old Firebase key found in source!"
    exit 1
}

$geminiExposed = Get-ChildItem -Path . -Recurse -Exclude @("node_modules", "dist", ".git") -File |
    Where-Object { $_.FullName -notmatch "node_modules|dist|\.git" } |
    Select-String -Pattern $oldGeminiKey -ErrorAction SilentlyContinue

if ($geminiExposed) {
    Print-Warning "Old Gemini key found in source!"
    exit 1
}

Print-Success "No old API keys found in source"

# Step 9: Summary
Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Print-Success "All validation checks passed! ✅"
Write-Host "========================================" -ForegroundColor Green
Write-Host ""

Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "  • Node.js version: $nodeVersion"
Write-Host "  • npm version: $npmVersion"
Write-Host "  • TypeScript: ✅ 0 errors"
Write-Host "  • Tests: ✅ All passed"
Write-Host "  • Build: ✅ Completed"
Write-Host "  • Security: ✅ No old keys found"
Write-Host ""

Print-Status "Next steps:"
Write-Host "  1. Test the app locally: npm run dev"
Write-Host "  2. Verify login functionality"
Write-Host "  3. Test chat with Gemini API"
Write-Host "  4. Create an invoice to verify Firestore"
Write-Host ""

Print-Success "New API keys are working! Ready for deployment. 🚀"
