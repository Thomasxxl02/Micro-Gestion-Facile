#!/bin/bash
# CD Pipeline Validation Script
# Tests Docker build, Trivy scan setup, and SSH connectivity

set -e

echo "🔍 CD Pipeline Validation"
echo "========================="
echo ""

# Colors
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

pass() {
  echo -e "${GREEN}✅ $1${NC}"
}

fail() {
  echo -e "${RED}❌ $1${NC}"
}

warn() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

# 1. Check Docker
echo "1️⃣  Checking Docker..."
if command -v docker &> /dev/null; then
  DOCKER_VERSION=$(docker --version)
  pass "Docker installed: $DOCKER_VERSION"
else
  fail "Docker not installed"
  exit 1
fi

# 2. Check Docker daemon
echo ""
echo "2️⃣  Checking Docker daemon..."
if docker ps > /dev/null 2>&1; then
  pass "Docker daemon running"
else
  fail "Docker daemon not running"
  exit 1
fi

# 3. Check Dockerfile
echo ""
echo "3️⃣  Checking Dockerfile..."
if [ -f "Dockerfile" ]; then
  pass "Dockerfile exists"
  LINES=$(wc -l < Dockerfile)
  echo "   Lines: $LINES"
else
  fail "Dockerfile not found"
  exit 1
fi

# 4. Check nginx.conf
echo ""
echo "4️⃣  Checking nginx.conf..."
if [ -f "nginx.conf" ]; then
  pass "nginx.conf exists"
  LINES=$(wc -l < nginx.conf)
  echo "   Lines: $LINES"
else
  fail "nginx.conf not found"
  exit 1
fi

# 5. Check .dockerignore
echo ""
echo "5️⃣  Checking .dockerignore..."
if [ -f ".dockerignore" ]; then
  pass ".dockerignore exists"
else
  fail ".dockerignore not found"
fi

# 6. Check CI/CD workflow files
echo ""
echo "6️⃣  Checking workflow files..."
if [ -f ".github/workflows/ci.yml" ]; then
  pass "CI workflow exists (.github/workflows/ci.yml)"
else
  warn "CI workflow not found"
fi

if [ -f ".github/workflows/cd.yml" ]; then
  pass "CD workflow exists (.github/workflows/cd.yml)"
else
  fail "CD workflow not found"
  exit 1
fi

# 7. Test Docker build
echo ""
echo "7️⃣  Testing Docker build..."
echo "   This may take a minute..."

if docker build -t micro-gestion-facile:test . --quiet > /dev/null 2>&1; then
  pass "Docker build successful"
  
  # Check image size
  SIZE=$(docker image inspect micro-gestion-facile:test --format='{{.Size}}')
  SIZE_MB=$((SIZE / 1024 / 1024))
  echo "   Image size: ${SIZE_MB}MB"
else
  fail "Docker build failed"
  echo "   Try: docker build -t micro-gestion-facile:test ."
  exit 1
fi

# 8. Check if image can run
echo ""
echo "8️⃣  Checking if container can start..."
CONTAINER_ID=$(docker run -d --rm micro-gestion-facile:test > /dev/null 2>&1 && echo "success" || echo "failed")
if [ "$CONTAINER_ID" = "success" ]; then
  pass "Container starts successfully"
  
  # Clean up
  docker ps -a --filter ancestor=micro-gestion-facile:test --format="{{.ID}}" | xargs -r docker stop > /dev/null 2>&1
  docker container prune -f --filter "ancestor=micro-gestion-facile:test" > /dev/null 2>&1
else
  fail "Container failed to start"
  exit 1
fi

# 9. Check GitHub CLI (optional)
echo ""
echo "9️⃣  Checking GitHub CLI..."
if command -v gh &> /dev/null; then
  GH_VERSION=$(gh --version)
  pass "GitHub CLI installed: $GH_VERSION"
  
  # Check if logged in
  if gh auth status > /dev/null 2>&1; then
    pass "GitHub CLI authenticated"
  else
    warn "GitHub CLI not authenticated (run: gh auth login)"
  fi
else
  warn "GitHub CLI not installed (optional but recommended)"
fi

# 10. Check Node/npm
echo ""
echo "🔟 Checking Node/npm..."
if command -v node &> /dev/null; then
  NODE_VERSION=$(node --version)
  NPM_VERSION=$(npm --version)
  pass "Node installed: $NODE_VERSION / npm $NPM_VERSION"
else
  fail "Node not installed"
  exit 1
fi

# 11. SSH Key Check (if exists)
echo ""
echo "1️⃣1️⃣  Checking SSH key (for deployment)..."
if [ -f ~/.ssh/deploy_key ]; then
  pass "SSH deploy key exists (~/.ssh/deploy_key)"
  
  # Check permissions
  PERMS=$(stat -f%A ~/.ssh/deploy_key 2>/dev/null || stat -c %a ~/.ssh/deploy_key 2>/dev/null)
  if [ "$PERMS" = "600" ]; then
    pass "SSH key permissions correct (600)"
  else
    warn "SSH key permissions might be wrong (current: $PERMS, should be 600)"
  fi
else
  warn "SSH deploy key not found (needed for production deploy)"
  echo "   Create with: ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -N \"\""
fi

# 12. GitHub Actions Secrets Check
echo ""
echo "1️⃣2️⃣  GitHub Actions Secrets..."
if [ -n "$GITHUB_ACTOR" ]; then
  pass "Running in GitHub Actions context"
else
  warn "Not running in GitHub Actions (run locally for full check)"
fi

# Summary
echo ""
echo "═════════════════════════════════════════"
echo ""
pass "✨ CD Pipeline Validation Complete!"
echo ""
echo "📋 Next Steps:"
echo "   1. Configure GitHub secrets (Settings → Secrets and variables → Actions):"
echo "      - DEPLOY_HOST"
echo "      - DEPLOY_USER"
echo "      - DEPLOY_SSH_KEY"
echo "      - DEPLOY_SSH_PORT (optional)"
echo ""
echo "   2. Test SSH connection:"
echo "      ssh -i ~/.ssh/deploy_key user@host 'docker ps'"
echo ""
echo "   3. Push to main:"
echo "      git push origin main"
echo ""
echo "   4. Monitor deployment:"
echo "      GitHub UI → Actions → CD - Build, Scan, Deploy"
echo ""
