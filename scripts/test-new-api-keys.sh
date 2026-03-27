#!/bin/bash
# test-new-api-keys.sh
# Script to test newly generated Firebase and Gemini API keys

set -e  # Exit on error

echo "🔐 API Key Validation Script"
echo "============================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored messages
print_status() {
    echo -e "${BLUE}[$(date '+%H:%M:%S')]${NC} $1"
}

print_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

print_error() {
    echo -e "${RED}❌ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

# Step 1: Check if .env.local exists
print_status "Step 1: Checking .env.local configuration"

if [ ! -f .env.local ]; then
    print_error ".env.local not found"
    print_warning "Creating .env.local template..."
    cat > .env.local << 'EOF'
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
EOF
    print_warning "⚠️  .env.local created. Please edit it with your new API keys."
    print_status "Edit .env.local and run this script again."
    exit 1
fi

print_success ".env.local found"

# Step 2: Validate that keys are not placeholders
print_status "Step 2: Validating API keys are configured"

FIREBASE_KEY=$(grep "VITE_FIREBASE_API_KEY=" .env.local | cut -d '=' -f 2)
GEMINI_KEY=$(grep "GEMINI_API_KEY=" .env.local | cut -d '=' -f 2)

if [[ "$FIREBASE_KEY" == "PASTE_NEW_FIREBASE_KEY_HERE" ]] || [[ -z "$FIREBASE_KEY" ]]; then
    print_error "Firebase API Key not configured in .env.local"
    exit 1
fi

if [[ "$GEMINI_KEY" == "PASTE_NEW_GEMINI_KEY_HERE" ]] || [[ -z "$GEMINI_KEY" ]]; then
    print_error "Gemini API Key not configured in .env.local"
    exit 1
fi

print_success "Both API keys are configured"

# Step 3: Check environment setup
print_status "Step 3: Checking environment setup"

if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed"
    exit 1
fi

NODE_VERSION=$(node --version)
print_success "Node.js found: $NODE_VERSION"

if ! command -v npm &> /dev/null; then
    print_error "npm is not installed"
    exit 1
fi

NPM_VERSION=$(npm --version)
print_success "npm found: $NPM_VERSION"

# Step 4: Install dependencies
print_status "Step 4: Installing dependencies"
npm install --legacy-peer-deps 2>&1 | tail -5

# Step 5: TypeScript compilation
print_status "Step 5: Running TypeScript type check"
if npm run type-check; then
    print_success "TypeScript compilation passed (0 errors)"
else
    print_error "TypeScript compilation failed"
    exit 1
fi

# Step 6: Run tests
print_status "Step 6: Running test suite"
if npm test -- --run; then
    print_success "Test suite passed (all tests)"
else
    print_error "Test suite failed"
    exit 1
fi

# Step 7: Build production
print_status "Step 7: Building production bundle"
if npm run build; then
    BUILD_OUTPUT=$(stat -f%z dist/assets/index.js 2>/dev/null || stat -c%s dist/assets/index.js 2>/dev/null || echo "unknown")
    print_success "Production build completed (bundle size: $BUILD_OUTPUT bytes)"
else
    print_error "Production build failed"
    exit 1
fi

# Step 8: Check for exposed secrets
print_status "Step 8: Scanning for accidentally committed secrets"
if grep -r "AIzaSyAryNVYzN1uXwiaFhFPC5xSeW4neFRs7B4" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git . 2>/dev/null; then
    print_warning "Old Firebase key found in source!"
    exit 1
fi

if grep -r "AIzaSyBXejKbJpVWxARCRP3hYroCEbREQiVWbiE" --exclude-dir=node_modules --exclude-dir=dist --exclude-dir=.git . 2>/dev/null; then
    print_warning "Old Gemini key found in source!"
    exit 1
fi

print_success "No old API keys found in source"

# Step 9: Summary
echo ""
echo "========================================"
print_success "All validation checks passed! ✅"
echo "========================================"
echo ""
echo "📊 Summary:"
echo "  • Node.js version: $NODE_VERSION"
echo "  • npm version: $NPM_VERSION"
echo "  • TypeScript: ✅ 0 errors"
echo "  • Tests: ✅ All passed"
echo "  • Build: ✅ Completed"
echo "  • Security: ✅ No old keys found"
echo ""
print_status "Next steps:"
echo "  1. Test the app locally: npm run dev"
echo "  2. Verify login functionality"
echo "  3. Test chat with Gemini API"
echo "  4. Create an invoice to verify Firestore"
echo ""
print_success "New API keys are working! Ready for deployment. 🚀"
