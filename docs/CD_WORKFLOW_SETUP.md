# 🚀 CD Workflow - Setup & Configuration Guide

## 📋 Overview

Complete CI/CD pipeline for Micro-Gestion-Facile PWA:

1. **Build** — Docker multi-stage build → GHCR image push
2. **Scan** — Trivy security vulnerability scanning
3. **Deploy** — SSH deployment to production server
4. **Notify** — Deployment status notifications

---

## 🔐 Required GitHub Secrets

### 1. Registry Access (automatic)

- `GITHUB_TOKEN` — **Already available** (GitHub Actions automatic)

### 2. SSH Deployment (MANUAL setup required)

Go to **Settings → Secrets and variables → Actions** and create:

| Secret            | Value               | Notes                               |
| ----------------- | ------------------- | ----------------------------------- |
| `DEPLOY_HOST`     | `your-server.com`   | Server FQDN or IP                   |
| `DEPLOY_USER`     | `deploy`            | SSH user (non-root recommended)     |
| `DEPLOY_SSH_KEY`  | Private key content | See below for generation            |
| `DEPLOY_SSH_PORT` | `22`                | SSH port (optional, defaults to 22) |

#### Generate SSH Key Pair (Linux/Mac/WSL)

```bash
# Generate ED25519 key (recommended)
ssh-keygen -t ed25519 -f ~/.ssh/deploy_key -C "github-actions-deploy" -N ""

# Or RSA (legacy compatible)
ssh-keygen -t rsa -b 4096 -f ~/.ssh/deploy_key -C "github-actions-deploy" -N ""

# Copy to GitHub Secrets
cat ~/.ssh/deploy_key | pbcopy  # Mac
cat ~/.ssh/deploy_key | xclip -selection clipboard  # Linux
```

#### Configure Server SSH Access

```bash
# On your deployment server (as root or with sudo)

# 1. Create deploy user
adduser deploy
sudo usermod -aG docker deploy  # Allow docker commands

# 2. Setup SSH key
sudo -u deploy mkdir -p /home/deploy/.ssh
chmod 700 /home/deploy/.ssh

# 3. Add public key to authorized_keys
cat >> /home/deploy/.ssh/authorized_keys << 'EOF'
# Paste contents of ~/.ssh/deploy_key.pub here
EOF

chmod 600 /home/deploy/.ssh/authorized_keys
chown -R deploy:deploy /home/deploy/.ssh

# 4. Test SSH connection
ssh -i ~/.ssh/deploy_key deploy@your-server.com "echo Success"
```

---

## 🏗️ Dockerfile & Nginx Configuration

### Dockerfile (Multi-stage)

- **Stage 1**: Build with Node 20 Alpine
  - Install deps
  - Build React/Vite app
  - Output: `/app/dist`

- **Stage 2**: Serve with Nginx Alpine
  - Non-root user (security)
  - Health checks enabled
  - Custom nginx.conf (PWA optimized)

### nginx.conf (PWA Security & Performance)

```
✅ SPA routing (client-side routing via /index.html)
✅ Service Worker (sw.js) — no-cache
✅ Manifest (webmanifest) — 1h cache
✅ Static assets — 30d cache (immutable when versioned)
✅ Security headers (X-Content-Type-Options, CSP, etc.)
✅ Compression (gzip)
✅ Deny .env, sensitive files
```

---

## 🔄 Workflow Stages Explained

### Stage 1: Build & Push (build-and-push)

```yaml
- Checkout code
- Setup Docker Buildx (multi-platform support)
- Log in to ghcr.io (GitHub Container Registry)
- Extract metadata (semver tags, branch, SHA, latest)
- Build & push Docker image with labels
- Cache layers for speed
```

**Output:**

- Image tagged: `ghcr.io/thomasxxl02/micro-gestion-facile:main`
- Also tagged: `latest`, `sha-<hash>`, semantic versions

### Stage 2: Trivy Security Scan (scan-trivy)

```yaml
- Pull image from GHCR
- Run Trivy vulnerability scanner
- Output SARIF report → GitHub Security tab
- Check for CRITICAL vulnerabilities
- Save JSON + SARIF artifacts (30 days)
```

**Output:**

- 🔒 Vulnerabilities auto-reported in GitHub Security
- 📊 Artifacts available for download

### Stage 3: SSH Deploy (deploy-ssh)

```yaml
- Checkout code
- SSH to server via appleboy/ssh-action
- Login to registry
- Pull image from GHCR
- Create Docker network
- Stop/remove old container
- Run new container with health checks
- Verify container is healthy
- Cleanup unused resources
```

**Container Setup:**

```dockerfile
Image: ghcr.io/thomasxxl02/micro-gestion-facile:main
Name: micro-gestion-facile
Network: nginx-network
Port: 8080 (exposed)
Restart: unless-stopped
Health checks: enabled
```

### Stage 4: Notify (notify-deployment)

```yaml
- Check deployment status
- Log status, branch, commit, actor
- Ready to integrate with Discord/Slack webhooks
```

---

## 📊 Workflow Execution Flow

```
Commit to main
       ↓
[build-and-push] ─────→ Build Docker image
       ↓                  Push to GHCR
       └──────┐
              ├─→ [scan-trivy] ─→ Security scan + reports
              │
              └──────┐
                     ├─→ [deploy-ssh] ─→ SSH deployment
                     │
                     └─→ [notify] ─→ Status notification
```

**Parallelization:**

- `build-and-push`: runs first (required)
- `scan-trivy`: runs after build (parallel possible)
- `deploy-ssh`: waits for both build + scan
- `notify`: runs after deploy (always, even on failure)

---

## 🚀 Manual Triggers & Environments

### Trigger on Push to Main

```bash
git push origin main
# Automatically runs: build → scan → deploy
```

### Trigger on Tag (Semantic Versioning)

```bash
git tag v1.2.3
git push origin v1.2.3
# Automatically runs: build (tagged!) → scan → deploy
```

### Manual Trigger (Workflow Dispatch)

In GitHub UI: **Actions → CD - Build, Scan & Deploy → Run workflow**

Choose environment:

- `staging` — Test deployment (optional step)
- `production` — Live deployment

---

## ✅ Verification Checklist

After setup, verify:

- [ ] Secrets configured: `DEPLOY_HOST`, `DEPLOY_USER`, `DEPLOY_SSH_KEY`, `DEPLOY_SSH_PORT`
- [ ] Docker daemon running on server
- [ ] Deploy user created on server with docker group access
- [ ] SSH key pair working: `ssh -i key deploy@host "docker ps"`
- [ ] Nginx reverse proxy configured (if desired) — optional
- [ ] Firewall allows SSH (port 22 or custom)
- [ ] Firewall allows HTTP inbound (containers expose 8080)

### Test Build Manually

```bash
cd /path/to/Micro-Gestion-Facile
docker build -t test-build:latest .
docker run --rm -p 8080:8080 test-build:latest
# Visit http://localhost:8080
```

### Test SSH Deploy Script Locally

```bash
ssh -i ~/.ssh/deploy_key deploy@your-server.com << 'EOF'
set -e
echo "Testing deployment capabilities..."
docker ps
docker pull ghcr.io/thomasxxl02/micro-gestion-facile:main
echo "✅ SSH + Docker access verified"
EOF
```

---

## 🔍 Monitoring & Troubleshooting

### View Workflow Runs

**GitHub UI:** Settings → Actions → All workflows → CD - Build, Scan, Deploy

### View Real-time Logs

1. Click on workflow run
2. Expand job names to see detailed logs
3. Scroll to find errors

### Common Issues

#### ❌ Docker Login Fails

```
Error: unauthorized
```

**Fix:** Ensure `GITHUB_TOKEN` is available (automatic in GitHub Actions)

#### ❌ SSH Connection Refused

```
Error: Connection refused on port 22
```

**Fix:**

- Check `DEPLOY_SSH_KEY` is correct private key
- Check `DEPLOY_HOST` and `DEPLOY_SSH_PORT`
- Verify firewall allows SSH
- Test locally: `ssh -i key user@host`

#### ❌ Container Fails to Start

```
Container exited with code 127
```

**Check on server:**

```bash
docker logs micro-gestion-facile
```

#### ❌ Health Check Fails

```
Container failed to become healthy
```

**Fix:**

- Verify Nginx config is correct
- Check port 8080 accessibility
- View logs: `docker logs micro-gestion-facile`
- Check security groups/firewall

### Debug SSH Deployment Locally

```bash
# Connect to server
ssh deploy@your-server.com

# Check container logs
docker logs micro-gestion-facile

# Check network connectivity
docker exec micro-gestion-facile wget -O- http://localhost/

# Inspect container
docker inspect micro-gestion-facile
```

---

## 🎯 Next Steps

1. **Setup secrets** in GitHub (see §2)
2. **Test Docker build** locally: `docker build -t app:latest .`
3. **Configure SSH** on server (see §2)
4. **Push to main** → Workflow runs automatically
5. **Monitor first run** → Check logs for errors
6. **Setup Nginx reverse proxy** (optional) — to expose port 80

---

## 📚 References

- [GitHub Container Registry](https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Docker Build Action](https://github.com/docker/build-push-action)
- [SSH Action (appleboy)](https://github.com/appleboy/ssh-action)
- [Nginx PWA Configuration](https://create-react-app.dev/deployment/nginx/)
- [Docker Security Best Practices](https://docs.docker.com/engine/security/)

---

## 💡 Future Enhancements

Consider adding:

- [ ] Slack/Discord notification webhooks
- [ ] Staging environment (separate deploy step)
- [ ] Blue-green deployment strategy
- [ ] Rollback on failed health checks
- [ ] Database migrations (if added)
- [ ] Performance testing (Lighthouse)
- [ ] DAST (Dynamic Application Security Testing)
- [ ] Cost monitoring alerts
